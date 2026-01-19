import { Gangs } from "../database/Gangs";
import { GangMembers } from "../database/GangMembers";
import { GangRoles } from "../database/GangRoles";
import { Log } from "../utils/log";
import { User } from "./User";
import { Language } from "./Language";
import { defaultComponent, formatMoney, showTime } from "../utils/ui";
import { Users } from "../database/Users";
import { Op } from "sequelize";
import { GangColor, GangColorId } from "../utils/colors";
import { sendComplexPrivateMessage } from "../utils/logic";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Collection,
	ComponentType,
	Message,
	MessageComponentInteraction,
	MessageFlags,
} from "discord.js";
import { getClient } from "../client";
import { EmoteString } from "../utils/emotes";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";
import { GangBaseId } from "../interfaces/GangBases";
import { IDescription } from "../interfaces/Interfaces";
import { addHours } from "date-fns";
import { Notification, NotificationType } from "./Notification";

export enum GangPermission {
	Invite,
	Kick,
	Promote,
	EditGang
}

export interface GangMember {
	UserId: string;
	Nickname: string;
	PermissionCount: number;
	RoleId: number;
	RoleName: string;
	Deposit: {
		Time: Date;
		Amount: number;
	};
}

export interface GangRole {
	Id: number;
	Name: string;
	Permissions: GangPermission[];
}

export class Gang {
	Id = 0;
	Name = "";
	Acronym = "";
	Money = 0;
	BaseId = GangBaseId.None;
	Color = GangColorId.Grey;
	Image: string | null = null;
	Description = "";
	Experience = 0;
	Level = 1;
	LeaderId = "";
	CreatedAt = new Date();
	UpdatedAt = new Date();
	Members: GangMember[] = [];
	Roles: GangRole[] = [];

	static CREATION_COST = 1_000_000;
	static JOIN_COST = 100_000;
	static TIME_BETWEEN_DEPOSITS = 12;
	static MAX_DEPOSIT_PER_DAY = 100_000;


	// Calcula o número máximo de membros com base no nível da gangue
	GetMaxMembers(): number {
		return 9 + this.Level; // Nível 1: 10 membros, e +1 por nível adicional (máx 19 no nível 10)
	}

	// Verificar se um usuário pode entrar na gangue
	CanAddMember(): boolean {
		return this.Members.length < this.GetMaxMembers();
	}

	// Experiência necessária para o próximo nível
	static GetXpForNextLevel(level: number): number {
		if (level === 1) {
			return Math.floor(level * 1_000);
		}

		return Math.floor(level * 1000 ** (1 + ((level - 1) / 10)));
	}

	// Adiciona XP à gangue e verifica se subiu de nível
	async AddExperience(xp: number): Promise<boolean> {
		this.Experience += xp;

		const xpNeeded = Gang.GetXpForNextLevel(this.Level);
		let leveledUp = false;

		if (this.Experience >= xpNeeded && this.Level < 10) { // Máximo nível 10
			this.Level += 1;
			this.Experience -= xpNeeded;
			leveledUp = true;
			Log.Success(`Gang ${this.Name} (Id ${this.Id}) leveled up to level ${this.Level}!`);
		}

		await this.Update();
		return leveledUp;
	}

	// Cria uma nova gangue
	static async Create(user: User, name: string, acronym: string, description: string, color: GangColorId, image: string | null = null): Promise<Gang | null> {
		if (user.Money < Gang.CREATION_COST) {
			return null;
		}

		// Verificar se o usuário já está em uma gangue
		const existingMembership = await GangMembers.findOne({
			where: { userId: user.Id },
		});

		if (existingMembership) {
			return null;
		}

		// Verificar se já existe gangue com esse nome
		const existingGang = await Gangs.findOne({
			where: {
				name: {
					[Op.eq]: name,
				},
			},
		});

		if (existingGang) {
			return null;
		}

		try {
			// Cobrar o custo de criação
			user.Money -= Gang.CREATION_COST;
			await user.Update();

			// Criar a gangue
			const gang = await Gangs.create({
				name,
				acronym,
				description,
				color,
				image,
				level: 1,
				experience: 0,
				money: 0,
				leaderId: user.Id,
			});

			const names = {
				leader: {
					[Language.English]: "Leader",
					[Language.Portuguese]: "Líder",
					[Language.Spanish]: "Líder",
				},
				member: {
					[Language.English]: "Member",
					[Language.Portuguese]: "Membro",
					[Language.Spanish]: "Miembro",
				},
			};

			// Criar o cargo de líder
			const leaderRole = await GangRoles.create({
				gangId: gang.id,
				name: names.leader[user.Language],
				canInvite: true,
				canKick: true,
				canPromote: true,
				canEditGang: true,
			});

			// Criar cargo de membro comum
			await GangRoles.create({
				gangId: gang.id,
				name: names.member[user.Language],
				canInvite: false,
				canKick: false,
				canPromote: false,
				canEditGang: false,
			});

			// Adicionar o líder como membro
			await GangMembers.create({
				gangId: gang.id,
				userId: user.Id,
				roleId: leaderRole.id,
				depositTime: addHours(new Date(), Gang.TIME_BETWEEN_DEPOSITS * 2),
			});

			Log.Success(`User ${user.Nickname} (Id: ${user.Id}) created gang '${name}' (Id: ${gang.id}) for ${formatMoney(Gang.CREATION_COST, Language.English)}.`);

			const newGang = new Gang();
			newGang.Id = gang.id;
			newGang.Name = gang.name;
			newGang.Acronym = gang.acronym;
			newGang.Money = gang.money;
			newGang.BaseId = gang.baseId;
			newGang.Color = gang.color;
			newGang.Image = gang.image;
			newGang.Description = gang.description;
			newGang.Experience = gang.experience;
			newGang.Level = gang.level;
			newGang.LeaderId = gang.leaderId;
			newGang.CreatedAt = gang.createdAt;
			newGang.UpdatedAt = gang.updatedAt;

			return newGang;
		}
		catch (err) {
			Log.Warning(`Failed to create gang '${name}' for user ${user.Nickname} (Id: ${user.Id}): ${err}`);
			return null;
		}
	}

	// Obtém uma gangue pelo ID
	static async GetById(gangId: number): Promise<Gang | null> {
		try {
			const gang = await Gangs.findByPk(gangId);

			if (!gang) {
				return null;
			}

			const result = new Gang();
			result.Id = gang.id;
			result.Name = gang.name;
			result.Acronym = gang.acronym.toUpperCase();
			result.Money = gang.money;
			result.BaseId = gang.baseId;
			result.Color = gang.color;
			result.Image = gang.image;
			result.Description = gang.description;
			result.Experience = gang.experience;
			result.Level = gang.level;
			result.LeaderId = gang.leaderId;
			result.CreatedAt = gang.createdAt;
			result.UpdatedAt = gang.updatedAt;

			await Promise.all([
				result.LoadMembers(),
				result.LoadRoles(),
			]);

			return result;
		}
		catch (err) {
			Log.Warning(`Failed to get gang by Id ${gangId}: ${err}`);
			return null;
		}
	}

	// Obtém a gangue de um usuário
	static async GetByUserId(userId: string): Promise<Gang | null> {
		try {
			const membership = await GangMembers.findOne({
				where: { userId },
			});

			if (!membership) {
				return null;
			}

			return await Gang.GetById(membership.gangId);
		}
		catch (err) {
			Log.Warning(`Failed to get gang for user Id ${userId}: ${err}`);
			return null;
		}
	}

	static async CheckGangWithName(name: string): Promise<boolean> {
		try {
			const gang = await Gangs.findOne({
				where: {
					[Op.or]: {
						name: {
							[Op.like]: name,
						},
					},
				},
			});

			return gang !== null;
		}
		catch (err) {
			Log.Warning(`Failed to check gang by name '${name}': ${err}`);
			return false;
		}
	}

	static async CheckGangWithAcronym(acronym: string): Promise<boolean> {
		try {
			const gang = await Gangs.findOne({
				where: {
					acronym,
				},
			});

			return gang !== null;
		}
		catch (err) {
			Log.Warning(`Failed to check gang by acronym '${acronym}': ${err}`);
			return false;
		}
	}

	// Busca gangue pelo nome
	static async FindByName(name: string): Promise<Gang | null> {
		try {
			const gang = await Gangs.findOne({
				where: {
					[Op.or]: {
						name: {
							[Op.like]: name,
						},
						acronym: {
							[Op.like]: name,
						},
					},
				},
			});

			if (!gang) {
				return null;
			}

			return await Gang.GetById(gang.id);
		}
		catch (err) {
			Log.Warning(`Failed to find gang by name '${name}': ${err}`);
			return null;
		}
	}

	// Carrega os membros da gangue
	async LoadMembers() {
		try {
			const members = await GangMembers.findAll({
				where: { gangId: this.Id },
			});

			this.Members = [];

			for (const member of members) {
				const user = await Users.findByPk(member.userId, {
					attributes: ["id", "nickname"],
				});

				if (user) {
					const role = await GangRoles.findByPk(member.roleId);
					let howManyPermissions = 0;
					if (role?.canInvite) howManyPermissions += 1;
					if (role?.canKick) howManyPermissions += 1;
					if (role?.canPromote) howManyPermissions += 1;
					if (role?.canEditGang) howManyPermissions += 1;

					this.Members.push({
						UserId: user.id,
						Nickname: user.nickname,
						RoleId: member.roleId,
						PermissionCount: howManyPermissions,
						RoleName: role ? role.name : "???",
						Deposit: {
							Time: member.depositTime,
							Amount: member.depositAmount,
						},
					});
				}
			}

			this.Members.sort((a, b) => b.PermissionCount - a.PermissionCount);
		}
		catch (err) {
			Log.Warning(`Failed to load members for gang ${this.Name} (Id: ${this.Id}): ${err}`);
		}
	}

	// Carrega os cargos da gangue
	async LoadRoles() {
		try {
			const roles = await GangRoles.findAll({
				where: { gangId: this.Id },
			});

			this.Roles = [];

			for (const role of roles) {
				const permissions: GangPermission[] = [];

				if (role.canInvite) permissions.push(GangPermission.Invite);
				if (role.canKick) permissions.push(GangPermission.Kick);
				if (role.canPromote) permissions.push(GangPermission.Promote);
				if (role.canEditGang) permissions.push(GangPermission.EditGang);

				this.Roles.push({
					Id: role.id,
					Name: role.name,
					Permissions: permissions,
				});
			}
		}
		catch (err) {
			Log.Warning(`Failed to load roles for gang ${this.Name} (Id: ${this.Id}): ${err}`);
		}
	}

	CanInvite(inviterId: string) {
		// Verificar se o convidador tem permissão
		const inviter = this.Members.find(m => m.UserId === inviterId);
		if (!inviter) return false;

		const inviterRole = this.Roles.find(r => r.Id === inviter.RoleId);
		if (!inviterRole) {
			return false;
		}

		return inviterRole.Permissions.includes(GangPermission.Invite);
	}

	// Convida um usuário para a gangue
	async InviteUser(inviter: User, targetUser: User): Promise<boolean> {
		const COOLDOWN_INVITE = 3 * 60_000;
		const sI = Strings[inviter.Language];
		const sT = Strings[targetUser.Language];

		// Verificar se o alvo já está em uma gangue
		const existingMembership = await GangMembers.findOne({
			where: { userId: targetUser.Id },
		});

		if (existingMembership) {
			return false;
		}

		// Verificar se a gangue tem espaço
		if (!this.CanAddMember()) {
			return false;
		}

		// Verificar se só existe um convite da gangue
		const cooldownInvite = getClient().invites;
		if (!cooldownInvite.has(this.Id)) {
			cooldownInvite.set(this.Id, new Collection());
		}

		const timestamp = cooldownInvite.get(this.Id);
		const now = Date.now();

		if (!timestamp) {
			return false;
		}

		if (timestamp.has(targetUser.Id)) {
			const lastInviteTime = timestamp.get(targetUser.Id) || 0;

			if (now - lastInviteTime < COOLDOWN_INVITE) {
				return false; // Ainda está em cooldown
			}
		}

		timestamp.set(targetUser.Id, now);

		const buttonAccept = new ButtonBuilder()
			.setCustomId("accept")
			.setLabel(sT.acceptText)
			.setStyle(ButtonStyle.Success);

		const buttonDecline = new ButtonBuilder()
			.setCustomId("decline")
			.setLabel(sT.declineText)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents([buttonAccept, buttonDecline]);

		const response = await sendComplexPrivateMessage(targetUser.Id, {
			components: [
				defaultComponent({
					user: inviter,
					description: sT.invitation.description(this.Name, this.Acronym),
					footer: sT.invitation.footer,
					buttons: row,
				}),
			],
			flags: [MessageFlags.IsComponentsV2],
		});

		Log.Info(`${inviter.Nickname} (Id: ${inviter.Id}) invited ${targetUser.Nickname} (Id: ${targetUser.Id}) to join gang ${this.Name} (Id: ${this.Id})`);

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === targetUser.Id,
			max: 1,
			componentType: ComponentType.Button,
			idle: COOLDOWN_INVITE,
		});

		let responded = false;

		collector?.on("collect", async btn => {
			let descriptionPrivate = "";
			let descriptionChannel = "";

			responded = true;

			await targetUser.GetInfo();

			collector?.stop();

			if (btn.customId === "accept") {
				if (targetUser.Money < Gang.JOIN_COST) {
					descriptionPrivate = sT.notEnoughMoney.private(this.Name, this.Acronym);
					descriptionChannel = sI.notEnoughMoney.channel(targetUser.GetNameWithImage());

					Log.Warning(`User ${targetUser.Nickname} (Id: ${targetUser.Id}) tried to accept invite to gang ${this.Name} (Id: ${this.Id}), but doesn't have enough money.`);
				}
				else {
					const success = await this.AcceptInvite(targetUser);

					if (!success) {
						descriptionPrivate = sT.notSuccess.private(this.Name, this.Acronym);
						descriptionChannel = sI.notSuccess.channel(targetUser.GetNameWithImage());

						Log.Warning(`Failed to accept invite for user ${targetUser.Nickname} (Id: ${targetUser.Id}) to gang ${this.Name} (Id: ${this.Id})`);
					}
					else {
						descriptionPrivate = sT.success.private(this.Name, this.Acronym);
						descriptionChannel = sI.success.channel(targetUser.GetNameWithImage());

						Log.Success(`${targetUser.Nickname} (Id: ${targetUser.Id}) accepted the invite to gang ${this.Name} (Id: ${this.Id})`);
					}
				}
			}
			else if (btn.customId === "decline") {
				descriptionPrivate = sT.decline.private(this.Name, this.Acronym);
				descriptionChannel = sI.decline.channel(targetUser.GetNameWithImage());

				Log.Info(`${targetUser.Nickname} (Id: ${targetUser.Id}) declined the invite to gang ${this.Name} (Id: ${this.Id})`);
			}

			response?.edit({
				components: [defaultComponent({
					user: inviter,
					description: descriptionPrivate,
				})],
			});

			await sendComplexPrivateMessage(inviter.Id, {
				components: [
					defaultComponent({
						user: inviter,
						description: descriptionChannel,
						footer: this.Name,
					}),
				],
				flags: [MessageFlags.IsComponentsV2],
			});
		});

		collector?.on("end", async () => {
			if (responded) return;

			response?.edit({
				components: [defaultComponent({
					user: inviter,
					description: sT.timeout.private(this.Name, this.Acronym),
				})],
			});

			await sendComplexPrivateMessage(inviter.Id, {
				components: [
					defaultComponent({
						user: inviter,
						description: sI.timeout.channel(targetUser.GetNameWithImage(), this.Name, this.Acronym),
						footer: this.Name,
					}),
				],
				flags: [MessageFlags.IsComponentsV2],
			});

			Log.Info(`${targetUser.Nickname} (Id: ${targetUser.Id}) did not respond to the invite to gang ${this.Name} (Id: ${this.Id})`);
		});

		return true;
	}

	// Aceitar um convite para a gangue (depois de pagar)
	async AcceptInvite(user: User): Promise<boolean> {
		try {

			// Verificar se o usuário já está em uma gangue
			const existingMembership = await GangMembers.findOne({
				where: { userId: user.Id },
			});

			if (existingMembership) {
				return false;
			}

			// Verificar se a gangue tem espaço
			if (!this.CanAddMember()) {
				return false;
			}

			// Encontrar o cargo de membro comum (o de menor ID que não seja o de líder)
			const memberRole = this.Roles.find(r => r.Name === "Membro");

			if (!memberRole) {
				return false;
			}

			user.Money -= Gang.JOIN_COST;
			this.Money += Gang.JOIN_COST;

			await Promise.all([
				user.Update(),
				this.Update(),
				GangMembers.create({
					gangId: this.Id,
					userId: user.Id,
					roleId: memberRole.Id,
					depositTime: addHours(new Date(), Gang.TIME_BETWEEN_DEPOSITS * 2),
				}),
			]);

			await this.LoadMembers();

			return true;
		}
		catch (err) {
			Log.Warning(`Failed to add user${user.Nickname} (Id: ${user.Id}) to gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	CanKick(kickerId: string): boolean {
		// Verificar se o kicker tem permissão
		const kicker = this.Members.find(m => m.UserId === kickerId);
		if (!kicker) return false;

		const kickerRole = this.Roles.find(r => r.Id === kicker.RoleId);
		if (!kickerRole) {
			return false;
		}

		return kickerRole.Permissions.includes(GangPermission.Kick);
	}

	// Expulsar um membro da gangue
	async KickMember(kicker: User, targetUser: User): Promise<boolean> {
		// Não pode expulsar a si mesmo
		if (kicker.Id === targetUser.Id) {
			return false;
		}

		// Não pode expulsar o líder
		if (targetUser.Id === this.LeaderId) {
			return false;
		}

		try {
			const deleted = await GangMembers.destroy({
				where: {
					gangId: this.Id,
					userId: targetUser.Id,
				},
			});

			if (deleted) {
				const kickedMember = this.Members.find(m => m.UserId === targetUser.Id);
				this.Members = this.Members.filter(m => m.UserId !== targetUser.Id);

				Log.Info(`User ${targetUser.Nickname} (Id: ${targetUser.Id}) was kicked from gang ${this.Name} (Id: ${this.Id}) by ${kicker.Nickname} (Id: ${kicker.Id})`);

				await Promise.all([
					this.ComunicateAllMembers(kicker, {
						[Language.English]: `**${kicker.GetNameWithImage()}** kicked **${targetUser.GetNameWithImage()}** from the gang.`,
						[Language.Portuguese]: `**${kicker.GetNameWithImage()}** expulsou **${targetUser.GetNameWithImage()}** da gangue.`,
						[Language.Spanish]: `**${kicker.GetNameWithImage()}** expulsó a **${targetUser.GetNameWithImage()}** de la cuadrilla.`,
					}),
					this.ComunicateMember(kicker, kickedMember!, {
						[Language.English]: `**${kicker.GetNameWithImage()}** kicked you from the gang.`,
						[Language.Portuguese]: `**${kicker.GetNameWithImage()}** expulsou você da gangue.`,
						[Language.Spanish]: `**${kicker.GetNameWithImage()}** te expulsó de la cuadrilla.`,
					}[targetUser.Language]),
					Notification.Dismiss(targetUser.Id, NotificationType.GangDepositAgain),
				]);
			}

			return !!deleted;

		}
		catch (err) {
			Log.Warning(`Failed to kick user ${targetUser.Nickname} (Id: ${targetUser.Id}) from gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	// Trocar o cargo de um membro
	async ChangeRole(changerId: string, targetUserId: string, newRoleId: number): Promise<boolean> {
		// Verificar se o changer tem permissão
		const changer = this.Members.find(m => m.UserId === changerId);
		if (!changer) return false;

		const changerRole = this.Roles.find(r => r.Id === changer.RoleId);
		if (!changerRole || !changerRole.Permissions.includes(GangPermission.Promote)) {
			return false;
		}

		// Verificar se o novo cargo existe
		const newRole = this.Roles.find(r => r.Id === newRoleId);
		if (!newRole) {
			return false;
		}

		// O líder só pode ser trocado se o próprio líder estiver fazendo a troca
		const target = this.Members.find(m => m.UserId === targetUserId);
		if (!target) return false;

		if (targetUserId === this.LeaderId && changerId !== this.LeaderId) {
			return false;
		}

		try {
			await GangMembers.update(
				{ roleId: newRoleId },
				{ where: { gangId: this.Id, userId: targetUserId } },
			);

			// Se estiver mudando o cargo do líder, atualizar o líder da gangue
			if (targetUserId === this.LeaderId) {
				this.LeaderId = changerId;
				await Gangs.update(
					{ leaderId: changerId },
					{ where: { id: this.Id } },
				);
			}

			await this.LoadMembers();
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to change role for user ${targetUserId} in gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	// Atualizar informações da gangue
	async Update(): Promise<boolean> {
		try {
			await Gangs.update(
				{
					name: this.Name,
					acronym: this.Acronym,
					money: this.Money,
					baseId: this.BaseId,
					color: this.Color,
					image: this.Image,
					description: this.Description,
					experience: this.Experience,
					level: this.Level,
					leaderId: this.LeaderId,
					updatedAt: new Date(),
				},
				{ where: { id: this.Id } },
			);
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to update gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	CanEdit(editorId: string): boolean {
		const editor = this.Members.find(m => m.UserId === editorId);
		if (!editor) return false;

		const editorRole = this.Roles.find(r => r.Id === editor.RoleId);
		if (!editorRole) return false;

		return editorRole.Permissions.includes(GangPermission.EditGang);
	}

	// Editar a gangue
	async Edit(name: string | null, acronym: string | null, description: string | null, color: GangColorId | null, image: string | null): Promise<boolean> {

		if (name) this.Name = name;
		if (acronym) this.Acronym = acronym;
		if (description) this.Description = description;
		if (color != null) this.Color = color;
		if (image) this.Image = image;

		Log.Info(`Editing gang ${this.Id} with new values: ${name ? `[Name: ${this.Name}]` : ""} ${acronym ? `[Acronym: ${this.Acronym}]` : ""} ${description ? `[Description: ${this.Description}]` : ""} ${color ? `[Color: ${this.Color}]` : ""} ${image ? `[Image: ${this.Image}]` : ""}`);

		return await this.Update();
	}

	// Criar um novo cargo
	async CreateRole(creatorId: string, name: string, permissions: GangPermission[]): Promise<boolean> {
		// Apenas o líder pode criar cargos
		if (creatorId !== this.LeaderId) {
			return false;
		}

		try {
			await GangRoles.create({
				gangId: this.Id,
				name,
				canInvite: permissions.includes(GangPermission.Invite),
				canKick: permissions.includes(GangPermission.Kick),
				canPromote: permissions.includes(GangPermission.Promote),
				canEditGang: permissions.includes(GangPermission.EditGang),
			});

			await this.LoadRoles();
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to create role ${name} for gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	// Sair da gangue
	async LeaveGang(user: User): Promise<boolean> {
		// O líder não pode sair, deve transferir a liderança primeiro
		if (user.Id === this.LeaderId) {
			return false;
		}

		try {
			const deleted = await GangMembers.destroy({
				where: {
					gangId: this.Id,
					userId: user.Id,
				},
			});

			if (deleted) {
				Log.Success(`User ${user.Nickname} (Id: ${user.Id}) left gang ${this.Name} (Id: ${this.Id})`);

				await Promise.all([
					this.ComunicateAllMembers(user, {
						[Language.English]: `**${user.GetNameWithImage()}** left the gang.`,
						[Language.Portuguese]: `**${user.GetNameWithImage()}** saiu da gangue.`,
						[Language.Spanish]: `**${user.GetNameWithImage()}** dejó la cuadrilla.`,
					}),
					Notification.Dismiss(user.Id, NotificationType.GangDepositAgain),
				]);

				return true;
			}
			return false;
		}
		catch (err) {
			Log.Warning(`Failed for user ${user.Nickname} (Id: ${user.Id}) to leave gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	// Deletar a gangue (apenas o líder pode fazer isso)
	async DeleteGang(userId: string): Promise<boolean> {
		if (userId !== this.LeaderId) {
			return false;
		}

		try {
			// Remover todos os membros
			await GangMembers.destroy({
				where: { gangId: this.Id },
			});

			// Remover todos os cargos
			await GangRoles.destroy({
				where: { gangId: this.Id },
			});

			// Remover a gangue
			await Gangs.destroy({
				where: { id: this.Id },
			});

			return true;
		}
		catch (err) {
			Log.Warning(`Failed to delete gang ${this.Id}: ${err}`);
			return false;
		}
	}

	GetExpBar(emoteCount: number, language: Language) {
		const exp = Gang.GetXpForNextLevel(this.Level);
		const ratio = this.Experience / exp;

		const color = {
			left: EmoteString.ExpBarLeftFull,
			center: EmoteString.ExpBarMidFull,
			right: ratio >= 1 ? EmoteString.ExpBarRightFull : EmoteString.ExpBarRightEmpty,
		};

		if (ratio <= 0) {
			color.left = EmoteString.ExpBarLeftEmpty;
			color.center = EmoteString.ExpBarMidEmpty;
		}

		let emptyBars = Math.ceil((1 - ratio) * (emoteCount));
		emptyBars = Math.max(0, Math.min(emptyBars, emoteCount));

		const bars = color.left + color.center.repeat(emoteCount - emptyBars) + EmoteString.ExpBarMidEmpty.repeat(emptyBars) + color.right;

		if (this.Level === 10) {
			return `${bars} MAX`;
		}

		return `${bars} ${this.Experience} / ${formatMoney(exp, language, "")} (${Math.round(ratio * 100)}%)`;
	}

	CanCommunicate(senderId: string): boolean {
		// Verifica se o remetente é o líder ou tem permissão de comunicação
		if (senderId === this.LeaderId) {
			return true;
		}

		const member = this.Members.find(m => m.UserId === senderId);
		if (!member) {
			return false;
		}

		const role = this.Roles.find(r => r.Id === member.RoleId);
		if (!role) {
			return false;
		}

		return role.Permissions.includes(GangPermission.EditGang);
	}

	async OfficialCommunication(sender: User, message: IDescription | string) {

		Log.Info(`Gang ${this.Name} (Id: ${this.Id}) official communication from ${sender.Nickname} (Id: ${sender.Id}): ${message}`);

		return await this.ComunicateAllMembers(sender, message, {
			[Language.English]: "Official communication",
			[Language.Portuguese]: "Comunicado oficial",
			[Language.Spanish]: "Comunicado oficial",
		});
	}

	async ComunicateMember(sender: User, member: GangMember, message: string, specialMessage?: string) {
		const container = new CustomContainerBuilder()
			.setAccentColor(GangColor[this.Color].Color)
			.addTexts([
				message,
			])
			.addLargeSeparator()
			.addTexts([
				`-# ${sender.GetNameWithImage()} • ${EmoteString.Gang} ${this.Name} (${this.Acronym})${specialMessage ? ` • **${specialMessage}**` : ""}`,
			]);

		return await sendComplexPrivateMessage(member.UserId, {
			components: [container],
			flags: [MessageFlags.IsComponentsV2],
		});
	}

	async ComunicateAllMembers(sender: User, message: IDescription | string, specialMessage?: IDescription) {
		const promises: Promise<Message<false> | undefined>[] = [];

		for (const member of this.Members) {
			const user = await Users.findByPk(member.UserId, {
				attributes: ["language"],
			});
			if (!user) continue;

			const messateText = typeof message === "string" ? message : message[user.language];

			promises.push(this.ComunicateMember(sender, member, messateText, specialMessage?.[user.language]));
		}

		return await Promise.all(promises);
	}

	GetMemberEmote(member: GangMember): string {
		const isLeader = this.LeaderId == member.UserId;
		const role = this.Roles.find(r => r.Id === member.RoleId);
		let emote = EmoteString.NoPermission;

		if (role?.Permissions?.length === 1) {
			emote = EmoteString.OnePermission;
		}
		if (role?.Permissions?.length === 2) {
			emote = EmoteString.TwoPermission;
		}
		if (role?.Permissions?.length === 3) {
			emote = EmoteString.ThreePermission;
		}
		if (role?.Permissions?.length === 4) {
			emote = EmoteString.FourPermission;
		}
		if (isLeader) {
			emote = EmoteString.AllPermission;
		}
		return emote;
	}

	async CanDeposit(user: User, amount: number) {
		const s = Strings[user.Language];
		let canDeposit = true;
		let text = "";

		const member = await GangMembers.findOne({
			where: { userId: user.Id, gangId: this.Id },
		});

		if (!member) {
			canDeposit = false;
		}
		else if (member.depositTime > new Date()) {
			text = `${s.depositCooldown} ${showTime(member.depositTime.getTime(), true)}`;
			canDeposit = false;
		}

		const maxDeposit = Gang.MAX_DEPOSIT_PER_DAY * this.Level;

		if (amount > maxDeposit) {
			text = s.maxDepositReached(formatMoney(maxDeposit, user.Language));
			canDeposit = false;
		}

		if (user.Money < amount) {
			text = s.notEnoughMoneyDeposit(formatMoney(amount, user.Language));
			canDeposit = false;
		}

		return { canDeposit, text };
	}

	async Deposit(user: User, amount: number) {
		user.Money -= amount;
		this.Money += amount;
		await this.AddExperience(Math.floor(amount * 0.001));

		const member = await GangMembers.findOne({
			where: { userId: user.Id, gangId: this.Id },
		});

		if (member) {
			member.depositTime = addHours(new Date(), Gang.TIME_BETWEEN_DEPOSITS);
			member.depositAmount += amount;

			Log.Success(`User ${user.Nickname} (Id: ${user.Id}) deposited ${formatMoney(amount, user.Language)} in gang ${this.Name} (Id: ${this.Id})`);

			await Promise.all([
				member.save(),
				Notification.GangDepositAgain(user, member.depositTime),
				user.Update(),
				this.Update(),
			]);
		}
		else {
			Log.Warning(`User ${user.Nickname} (Id: ${user.Id}) tried to deposit ${formatMoney(amount, user.Language)} but an error occurred (not member)`);
		}
	}
}

const Strings = {
	[Language.English]: {
		acceptText: "Accept",
		declineText: "Decline",
		invitation: {
			description: (gangName: string, gangAcronym: string) => `I'm inviting you to join the gang **${gangName}** (${gangAcronym})!\n-# Accepting this invite will cost you **${formatMoney(Gang.JOIN_COST, Language.English)}**.`,
			footer: "You have 3 minutes to accept or decline the invitation.",
		},
		notEnoughMoney: {
			private: (gangName: string, gangAcronym: string) => `You don't have enough money to accept the invitation of **${gangName}** (${gangAcronym}). You need **${formatMoney(Gang.JOIN_COST, Language.English)}**.`,
			channel: (name: string) => `**${name}** tried to accept the invitation, but doesn't have enough money.`,
		},
		success: {
			private: (gangName: string, gangAcronym: string) => `You have successfully joined the gang **${gangName}** (${gangAcronym})!`,
			channel: (name: string) => `**${name}** has successfully joined the gang!`,
		},
		notSuccess: {
			private: (gangName: string, gangAcronym: string) => `Failed to accept the invitation of **${gangName}** (${gangAcronym}). Maybe you are already in a gang?`,
			channel: (name: string) => `**${name}** failed to accept the invitation.`,
		},
		decline: {
			private: (gangName: string, gangAcronym: string) => `You declined the invitation of **${gangName}** (${gangAcronym})!`,
			channel: (name: string) => `**${name}** has declined the invitation!`,
		},
		timeout: {
			private: (gangName: string, gangAcronym: string) => `I've invited you to join the gang **${gangName}** (${gangAcronym}), but you didn't respond in time.`,
			channel: (name: string, gangName: string, gangAcronym: string) => `**${name}** did not respond to the invitation to join the gang **${gangName}** (${gangAcronym}).`,
		},
		depositCooldown: `You can deposit again`,
		notEnoughMoneyDeposit: (amount: string) => `You don't have **${amount}** to deposit`,
		maxDepositReached: (max: string) => `You can only deposit up to **${max}**`,
	},
	[Language.Portuguese]: {
		acceptText: "Aceitar",
		declineText: "Recusar",
		invitation: {
			description: (gangName: string, gangAcronym: string) => `Estou convidando você para entrar na gangue **${gangName}** (${gangAcronym})!\n-# Aceitar este convite custará **${formatMoney(Gang.JOIN_COST, Language.Portuguese)}**.`,
			footer: "Você tem 3 minutos para aceitar ou recusar o convite.",
		},
		notEnoughMoney: {
			private: (gangName: string, gangAcronym: string) => `Você não tem dinheiro suficiente para aceitar o convite da gangue **${gangName}** (${gangAcronym}). Você precisa de **${formatMoney(Gang.JOIN_COST, Language.Portuguese)}**.`,
			channel: (name: string) => `**${name}** tentou aceitar o convite, mas não tem dinheiro suficiente.`,
		},
		success: {
			private: (gangName: string, gangAcronym: string) => `Você entrou com sucesso na gangue **${gangName}** (${gangAcronym})!`,
			channel: (name: string) => `**${name}** entrou com sucesso na gangue!`,
		},
		notSuccess: {
			private: (gangName: string, gangAcronym: string) => `Falha ao aceitar o convite da gangue **${gangName}** (${gangAcronym}). Talvez você já esteja em uma gangue?`,
			channel: (name: string) => `**${name}** falhou ao aceitar o convite.`,
		},
		decline: {
			private: (gangName: string, gangAcronym: string) => `Você recusou o convite da gangue **${gangName}** (${gangAcronym})!`,
			channel: (name: string) => `**${name}** recusou o convite!`,
		},
		timeout: {
			private: (gangName: string, gangAcronym: string) => `Eu te convidei para entrar na gangue **${gangName}** (${gangAcronym}), mas você não respondeu a tempo.`,
			channel: (name: string, gangName: string, gangAcronym: string) => `**${name}** não respondeu ao convite para entrar na gangue **${gangName}** (${gangAcronym}).`,
		},
		depositCooldown: `Você pode depositar novamente`,
		notEnoughMoneyDeposit: (amount: string) => `Você não tem **${amount}** para depositar`,
		maxDepositReached: (max: string) => `Você só pode depositar até **${max}**`,
	},
	[Language.Spanish]: {
		acceptText: "Aceptar",
		declineText: "Rechazar",
		invitation: {
			description: (gangName: string, gangAcronym: string) => `Te estoy invitando a unirte a la cuadrilla **${gangName}** (${gangAcronym})!\n-# Aceptar esta invitación te costará **${formatMoney(Gang.JOIN_COST, Language.Spanish)}**.`,
			footer: "Tienes 3 minutos para aceptar o rechazar la invitación.",
		},
		notEnoughMoney: {
			private: (gangName: string, gangAcronym: string) => `No tienes suficiente dinero para aceptar la invitación de **${gangName}** (${gangAcronym}). Necesitas **${formatMoney(Gang.JOIN_COST, Language.Spanish)}**.`,
			channel: (name: string) => `**${name}** intentó aceptar la invitación, pero no tiene suficiente dinero.`,
		},
		success: {
			private: (gangName: string, gangAcronym: string) => `¡Has aceptado con éxito unirte a la cuadrilla **${gangName}** (${gangAcronym})!`,
			channel: (name: string) => `**${name}** ha aceptado con éxito unirse a la cuadrilla!`,
		},
		notSuccess: {
			private: (gangName: string, gangAcronym: string) => `No se pudo aceptar la invitación de **${gangName}** (${gangAcronym}). ¿Quizás ya estás en una cuadrilla?`,
			channel: (name: string) => `**${name}** falló al aceptar la invitación.`,
		},
		decline: {
			private: (gangName: string, gangAcronym: string) => `¡Has rechazado la invitación de **${gangName}** (${gangAcronym})!`,
			channel: (name: string) => `**${name}** rechazó la invitación!`,
		},
		timeout: {
			private: (gangName: string, gangAcronym: string) => `Te invité a unirte a la cuadrilla **${gangName}** (${gangAcronym}), pero no respondiste a tiempo.`,
			channel: (name: string, gangName: string, gangAcronym: string) => `**${name}** no respondió a la invitación para unirse a la cuadrilla **${gangName}** (${gangAcronym}).`,
		},
		depositCooldown: `Puedes depositar de nuevo`,
		notEnoughMoneyDeposit: (amount: string) => `No tienes **${amount}** para depositar`,
		maxDepositReached: (max: string) => `Solo puedes depositar hasta **${max}**`,
	},
} as const;