import { Gangs } from "@core/database/Gangs";
import { GangMembers } from "@core/database/GangMembers";
import { GangRoles } from "@core/database/GangRoles";
import { Log } from "@shared/log";
import type { User } from "./User";
import { Language, type Localization } from "./Language";
import { defaultComponent, formatMoney, showTime } from "@bot/utils/ui";
import { Users } from "@core/database/Users";
import { Op } from "sequelize";
import { GangColor, GangColorId } from "@bot/utils/colors";
import { sendComplexPrivateMessage } from "@bot/utils/discordInteractions";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Collection,
	ComponentType,
	type Message,
	type MessageComponentInteraction,
	MessageFlags,
} from "discord.js";
import { getClient } from "@bot/client";
import { EmoteString } from "@bot/utils/emotes";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { GangBaseId } from "@core/types/GangBases";
import type { IDescription } from "@core/types/Interfaces";
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

	static LEADER_ROLE_NAMES = ["Leader", "Líder"];
	static MEMBER_ROLE_NAMES = ["Member", "Membro", "Miembro"];
	static RESERVED_ROLE_NAMES = [...Gang.LEADER_ROLE_NAMES, ...Gang.MEMBER_ROLE_NAMES];

	/**
	 * Calculates the maximum number of members based on the gang level.
	 * @returns The maximum number of members.
	 */
	GetMaxMembers(): number {
		return 9 + this.Level; // Level 1: 10 members, +1 per additional level (max 19 at level 10)
	}

	/**
	 * Checks if a user can be added to the gang.
	 * @returns True if the gang has space for more members, false otherwise.
	 */
	CanAddMember(): boolean {
		return this.Members.length < this.GetMaxMembers();
	}

	/**
	 * Calculates the experience required for the next level.
	 * @param level The current level.
	 * @returns The experience required for the next level.
	 */
	static GetXpForNextLevel(level: number): number {
		if (level === 1) {
			return Math.floor(level * 1_000);
		}

		return Math.floor(level * 1000 ** (1 + ((level - 1) / 10)));
	}

	/**
	 * Adds experience to the gang and checks if it leveled up.
	 * @param xp The amount of experience to add.
	 * @returns True if the gang leveled up, false otherwise.
	 */
	async AddExperience(xp: number): Promise<boolean> {
		this.Experience += xp;

		const xpNeeded = Gang.GetXpForNextLevel(this.Level);
		let leveledUp = false;

		Log.Success(`Gang ${this.Name} (Id: ${this.Id}) gained ${xp} experience.`);

		if (this.Experience >= xpNeeded && this.Level < 10) { // Max level 10
			this.Level += 1;
			this.Experience -= xpNeeded;
			leveledUp = true;
			Log.Success(`Gang ${this.Name} (Id ${this.Id}) leveled up to level ${this.Level}!`);

			const levelUpMessages = {
				[Language.English]: `**${this.Name}** leveled up to level ${this.Level}!`,
				[Language.Portuguese]: `**${this.Name}** subiu para o nível ${this.Level}!`,
				[Language.Spanish]: `**${this.Name}** ¡ha subido al nivel ${this.Level}!`,
			};
			await this.ComunicateAllMembers(levelUpMessages);
		}

		await this.Update();
		return leveledUp;
	}

	/**
	 * Creates a new gang.
	 * @param user The user creating the gang.
	 * @param name The name of the gang.
	 * @param acronym The acronym of the gang.
	 * @param description The description of the gang.
	 * @param color The color of the gang.
	 * @param image The image URL of the gang (optional).
	 * @returns The created gang object, or null if creation failed.
	 */
	static async Create(user: User, name: string, acronym: string, description: string, color: GangColorId, image: string | null = null): Promise<Gang | null> {
		if (user.Money < Gang.CREATION_COST) {
			return null;
		}

		// Check if user is already in a gang
		const existingMembership = await GangMembers.findOne({
			where: { userId: user.Id },
		});

		if (existingMembership) {
			return null;
		}

		// Check if gang with same name exists
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
			// Charge creation cost
			user.Money -= Gang.CREATION_COST;
			await user.Update({
				money: user.Money,
			});

			// Create gang
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

			// Create leader role
			const leaderRole = await GangRoles.create({
				gangId: gang.id,
				name: names.leader[user.Language],
				canInvite: true,
				canKick: true,
				canPromote: true,
				canEditGang: true,
			});

			// Create member role
			await GangRoles.create({
				gangId: gang.id,
				name: names.member[user.Language],
				canInvite: false,
				canKick: false,
				canPromote: false,
				canEditGang: false,
			});

			// Add leader as member
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

	/**
	 * Gets a gang by its ID.
	 * @param gangId The ID of the gang.
	 * @returns The gang object, or null if not found.
	 */
	static async GetById(gangId: number): Promise<Gang | null> {
		try {
			const gang = await Gangs.findByPk(gangId);

			if (!gang) {
				return null;
			}

			return Gang.GetInfo(gang);
		}
		catch (err) {
			Log.Warning(`Failed to get gang by Id ${gangId}: ${err}`);
			return null;
		}
	}

	/**
	 * Gets basic gang info without loading members and roles.
	 * Useful for performance when only basic data is needed.
	 * @param gangId The gang ID.
	 * @returns The gang object with basic info, or null if not found.
	 */
	static async GetBasicById(gangId: number): Promise<Gang | null> {
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

			return result;
		}
		catch (err) {
			Log.Warning(`Failed to get basic gang by Id ${gangId}: ${err}`);
			return null;
		}
	}

	/**
	 * Helper method to populate a Gang object from a Gangs database model.
	 * Loads members and roles.
	 * @param gang The Gangs database model.
	 * @returns The populated Gang object.
	 */
	static async GetInfo(gang: Gangs) {
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

	/**
	 * Gets the gang a user belongs to.
	 * @param userId The ID of the user.
	 * @returns The gang object, or null if the user is not in a gang.
	 */
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

	/**
	 * Checks if a gang with the given name exists.
	 * @param name The name to check.
	 * @returns True if a gang with the name exists, false otherwise.
	 */
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

	/**
	 * Checks if a gang with the given acronym exists.
	 * @param acronym The acronym to check.
	 * @returns True if a gang with the acronym exists, false otherwise.
	 */
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

	/**
	 * Finds a gang by its name or acronym.
	 * @param name The name or acronym to search for.
	 * @returns The gang object, or null if not found.
	 */
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

			return Gang.GetInfo(gang);
		}
		catch (err) {
			Log.Warning(`Failed to find gang by name '${name}': ${err}`);
			return null;
		}
	}

	/**
	 * Loads the members of the gang from the database.
	 */
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

	/**
	 * Loads the roles of the gang from the database.
	 */
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

	/**
	 * Checks if a user has permission to invite others to the gang.
	 * @param inviterId The ID of the user attempting to invite.
	 * @returns True if the user has permission, false otherwise.
	 */
	CanInvite(inviterId: string) {
		// Check if inviter has permission
		const inviter = this.Members.find(m => m.UserId === inviterId);
		if (!inviter) return false;

		const inviterRole = this.Roles.find(r => r.Id === inviter.RoleId);
		if (!inviterRole) {
			return false;
		}

		return inviterRole.Permissions.includes(GangPermission.Invite);
	}

	/**
	 * Invites a user to the gang.
	 * @param inviter The user sending the invite.
	 * @param targetUser The user being invited.
	 * @returns True if the invite was sent successfully, false otherwise.
	 */
	async InviteUser(inviter: User, targetUser: User): Promise<boolean> {
		const COOLDOWN_INVITE = 3 * 60_000;
		const sI = Strings[inviter.Language];
		const sT = Strings[targetUser.Language];

		// Check if target is already in a gang
		const existingMembership = await GangMembers.findOne({
			where: { userId: targetUser.Id },
		});

		if (existingMembership) {
			return false;
		}

		// Check if gang has space
		if (!this.CanAddMember()) {
			return false;
		}

		// Check cooldown
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
				return false; // Still in cooldown
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

	/**
	 * Accepts an invite to the gang.
	 * @param user The user accepting the invite.
	 * @returns True if the user successfully joined, false otherwise.
	 */
	async AcceptInvite(user: User): Promise<boolean> {
		try {

			// Check if user is already in a gang
			const existingMembership = await GangMembers.findOne({
				where: { userId: user.Id },
			});

			if (existingMembership) {
				return false;
			}

			// Check if gang has space
			if (!this.CanAddMember()) {
				return false;
			}

			// Find member role (lowest ID that is not leader)
			// Assuming "Membro" is the default role name for members
			const memberRole = this.Roles.find(r => Gang.MEMBER_ROLE_NAMES.includes(r.Name));

			if (!memberRole) {
				return false;
			}

			user.Money -= Gang.JOIN_COST;
			this.Money += Gang.JOIN_COST;

			await Promise.all([
				user.Update({
					money: user.Money,
				}),
				this.Update(),
				GangMembers.create({
					gangId: this.Id,
					userId: user.Id,
					roleId: memberRole.Id,
					depositTime: addHours(new Date(), Gang.TIME_BETWEEN_DEPOSITS * 2),
				}),
			]);

			await this.LoadMembers();

			Log.Success(`User ${user.Nickname} (Id: ${user.Id}) joined gang ${this.Name} (Id: ${this.Id})`);
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to add user${user.Nickname} (Id: ${user.Id}) to gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	/**
	 * Checks if a user has permission to kick others from the gang.
	 * @param kickerId The ID of the user attempting to kick.
	 * @returns True if the user has permission, false otherwise.
	 */
	CanKick(kickerId: string): boolean {
		// Check if kicker has permission
		const kicker = this.Members.find(m => m.UserId === kickerId);
		if (!kicker) return false;

		const kickerRole = this.Roles.find(r => r.Id === kicker.RoleId);
		if (!kickerRole) {
			return false;
		}

		return kickerRole.Permissions.includes(GangPermission.Kick);
	}

	/**
	 * Kicks a member from the gang.
	 * @param kicker The user performing the kick.
	 * @param targetUser The user being kicked.
	 * @returns True if the user was kicked successfully, false otherwise.
	 */
	async KickMember(kicker: User, targetUser: User): Promise<boolean> {
		// Cannot kick self
		if (kicker.Id === targetUser.Id) {
			return false;
		}

		// Cannot kick leader
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

				Log.Success(`User ${targetUser.Nickname} (Id: ${targetUser.Id}) was kicked from gang ${this.Name} (Id: ${this.Id}) by ${kicker.Nickname} (Id: ${kicker.Id})`);

				await Promise.all([
					this.ComunicateAllMembers({
						[Language.English]: `**${kicker.GetNameWithImage()}** kicked **${targetUser.GetNameWithImage()}** from the gang.`,
						[Language.Portuguese]: `**${kicker.GetNameWithImage()}** expulsou **${targetUser.GetNameWithImage()}** da gangue.`,
						[Language.Spanish]: `**${kicker.GetNameWithImage()}** expulsó a **${targetUser.GetNameWithImage()}** de la cuadrilla.`,
					}),
					this.ComunicateMember(kickedMember!, {
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

	/**
	 * Changes the role of a gang member.
	 * @param changerId The ID of the user performing the change.
	 * @param targetUserId The ID of the user whose role is being changed.
	 * @param newRoleId The ID of the new role.
	 * @returns True if the role was changed successfully, false otherwise.
	 */
	async ChangeRole(changerId: string, targetUserId: string, newRoleId: number): Promise<boolean> {
		// Check if changer has permission
		const changer = this.Members.find(m => m.UserId === changerId);
		if (!changer) return false;

		const changerRole = this.Roles.find(r => r.Id === changer.RoleId);
		if (!changerRole || !changerRole.Permissions.includes(GangPermission.Promote)) {
			return false;
		}

		// Check if new role exists
		const newRole = this.Roles.find(r => r.Id === newRoleId);
		if (!newRole) {
			return false;
		}

		// Cannot change the leader's role
		if (targetUserId === this.LeaderId) {
			return false;
		}

		try {
			await GangMembers.update(
				{ roleId: newRoleId },
				{ where: { gangId: this.Id, userId: targetUserId } },
			);

			await this.LoadMembers();

			Log.Success(`User ${targetUserId} had their role changed to ${newRole.Name} in gang ${this.Name} (Id: ${this.Id}) by ${changerId}`);
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to change role for user ${targetUserId} in gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	/**
	 * Updates the gang's information in the database.
	 * @returns True if the update was successful, false otherwise.
	 */
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

	/**
	 * Checks if a user has permission to edit the gang.
	 * @param editorId The ID of the user attempting to edit.
	 * @returns True if the user has permission, false otherwise.
	 */
	CanEdit(editorId: string): boolean {
		const editor = this.Members.find(m => m.UserId === editorId);
		if (!editor) return false;

		const editorRole = this.Roles.find(r => r.Id === editor.RoleId);
		if (!editorRole) return false;

		return editorRole.Permissions.includes(GangPermission.EditGang);
	}

	/**
	 * Edits the gang's details.
	 * @param name New name (optional).
	 * @param acronym New acronym (optional).
	 * @param description New description (optional).
	 * @param color New color (optional).
	 * @param image New image URL (optional).
	 * @returns True if the edit was successful, false otherwise.
	 */
	async Edit(name: string | null, acronym: string | null, description: string | null, color: GangColorId | null, image: string | null): Promise<boolean> {

		if (name) this.Name = name;
		if (acronym) this.Acronym = acronym;
		if (description) this.Description = description;
		if (color != null) this.Color = color;
		if (image) this.Image = image;

		Log.Success(`Editing gang ${this.Id} with new values: ${name ? `[Name: ${this.Name}]` : ""} ${acronym ? `[Acronym: ${this.Acronym}]` : ""} ${description ? `[Description: ${this.Description}]` : ""} ${color ? `[Color: ${this.Color}]` : ""} ${image ? `[Image: ${this.Image}]` : ""}`);

		return await this.Update();
	}

	/**
	 * Creates a new role in the gang.
	 * @param creatorId The ID of the user creating the role (must be leader).
	 * @param name The name of the new role.
	 * @param permissions The permissions assigned to the role.
	 * @returns True if the role was created successfully, false otherwise.
	 */
	async CreateRole(creatorId: string, name: string, permissions: GangPermission[]): Promise<boolean> {
		// Only leader can create roles
		if (creatorId !== this.LeaderId) {
			return false;
		}

		if (Gang.RESERVED_ROLE_NAMES.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
			return false;
		}

		if (this.Roles.some(r => r.Name.toLowerCase() === name.toLowerCase())) {
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

			Log.Success(`Role ${name} created in gang ${this.Name} (Id: ${this.Id}) by ${creatorId}`);
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to create role ${name} for gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	/**
	 * Edits an existing role in the gang.
	 * @param editorId The ID of the user editing the role (must be leader).
	 * @param roleId The ID of the role to edit.
	 * @param permissions The new permissions for the role.
	 * @param name The new name for the role.
	 * @returns True if the role was edited successfully, false otherwise.
	 */
	async EditRole(editorId: string, roleId: number, permissions: GangPermission[], name: string | null): Promise<boolean> {
		// Only leader can edit roles
		if (editorId !== this.LeaderId) {
			return false;
		}

		if (name) {
			if (Gang.RESERVED_ROLE_NAMES.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
				return false;
			}

			if (this.Roles.some(r => r.Name.toLowerCase() === name.toLowerCase() && r.Id !== roleId)) {
				return false;
			}
		}

		try {
			const role = await GangRoles.findOne({
				where: { id: roleId, gangId: this.Id },
			});

			if (!role) {
				return false;
			}

			await role.update({
				name: name || role.name,
				canInvite: permissions.includes(GangPermission.Invite),
				canKick: permissions.includes(GangPermission.Kick),
				canPromote: permissions.includes(GangPermission.Promote),
				canEditGang: permissions.includes(GangPermission.EditGang),
			});

			await this.LoadRoles();

			Log.Success(`Role ${role.name} (Id: ${roleId}) in gang ${this.Name} (Id: ${this.Id}) was edited by ${editorId}`);
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to edit role ${name} for gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	/**
	 * Deletes a role from the gang.
	 * @param deleterId The ID of the user deleting the role (must be leader).
	 * @param roleId The ID of the role to delete.
	 * @returns True if the role was deleted successfully, false otherwise.
	 */
	async DeleteRole(deleterId: string, roleId: number): Promise<boolean> {
		// Only leader can delete roles
		if (deleterId !== this.LeaderId) {
			return false;
		}

		const roleToDelete = this.Roles.find(r => r.Id === roleId);
		if (!roleToDelete) {
			return false; // Role doesn't exist
		}

		// Cannot delete the role the leader has
		const leaderMember = this.Members.find(m => m.UserId === this.LeaderId);
		if (leaderMember?.RoleId === roleId) {
			return false;
		}

		// Cannot delete default member role
		if (Gang.RESERVED_ROLE_NAMES.map(n => n.toLowerCase()).includes(roleToDelete.Name.toLowerCase())) {
			return false;
		}

		try {
			const defaultRole = this.Roles.find(r => Gang.MEMBER_ROLE_NAMES.includes(r.Name));
			if (!defaultRole) {
				// This should ideally not happen in a valid gang setup
				Log.Warning(`Could not find a default role for gang ${this.Name} (Id: ${this.Id}) during role deletion.`);
				return false;
			}

			// Reassign members with the deleted role to the default role
			await GangMembers.update(
				{ roleId: defaultRole.Id },
				{ where: { gangId: this.Id, roleId: roleId } },
			);

			// Delete the role
			await GangRoles.destroy({
				where: { id: roleId, gangId: this.Id },
			});

			// Reload roles and members to reflect changes
			await this.LoadRoles();
			await this.LoadMembers();

			Log.Success(`Role ${roleToDelete.Name} (Id: ${roleId}) from gang ${this.Name} (Id: ${this.Id}) was deleted by ${deleterId}.`);

			return true;
		}
		catch (err) {
			Log.Warning(`Failed to delete role ${roleId} for gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	/**
	 * Allows a user to leave the gang.
	 * @param user The user leaving the gang.
	 * @returns True if the user left successfully, false otherwise.
	 */
	async LeaveGang(user: User): Promise<boolean> {
		// Leader cannot leave, must transfer leadership first
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
					this.ComunicateAllMembers({
						[Language.English]: `**${user.GetNameWithImage()}** left the gang.`,
						[Language.Portuguese]: `**${user.GetNameWithImage()}** saiu da gangue.`,
						[Language.Spanish]: `**${user.GetNameWithImage()}** dejó la cuadrilla.`,
					}),
					Notification.Dismiss(user.Id, NotificationType.GangDepositAgain),
				]);

				return true;
			}

			Log.Warning(`User ${user.Nickname} (Id: ${user.Id}) tried to leave gang ${this.Name} (Id: ${this.Id}) but failed.`);
			return false;
		}
		catch (err) {
			Log.Warning(`Failed for user ${user.Nickname} (Id: ${user.Id}) to leave gang ${this.Name} (Id: ${this.Id}): ${err}`);
			return false;
		}
	}

	/**
	 * Deletes the gang.
	 * @param userId The ID of the user deleting the gang (must be leader).
	 * @returns True if the gang was deleted successfully, false otherwise.
	 */
	async DeleteGang(userId: string): Promise<boolean> {
		if (userId !== this.LeaderId) {
			return false;
		}

		try {
			// Remove all members
			await GangMembers.destroy({
				where: { gangId: this.Id },
			});

			// Remove all roles
			await GangRoles.destroy({
				where: { gangId: this.Id },
			});

			// Remove gang
			await Gangs.destroy({
				where: { id: this.Id },
			});

			Log.Success(`Gang ${this.Name} (Id: ${this.Id}) was deleted by ${userId}.`);
			return true;
		}
		catch (err) {
			Log.Warning(`Failed to delete gang ${this.Id}: ${err}`);
			return false;
		}
	}

	/**
	 * Generates a visual experience bar for the gang.
	 * @param emoteCount The number of emotes to use for the bar.
	 * @param language The language for formatting.
	 * @returns A string representing the experience bar.
	 */
	GetExpBar(emoteCount: number, language: Language) {
		const exp = Gang.GetXpForNextLevel(this.Level);
		const ratio = this.Experience / exp;

		let emptyBars = Math.round((1 - ratio) * (emoteCount));
		emptyBars = Math.max(0, Math.min(emptyBars, emoteCount));

		const color = {
			left: EmoteString.ExpBarLeftFull,
			center: EmoteString.ExpBarMidFull,
			right: emptyBars === 0 ? EmoteString.ExpBarRightFull : EmoteString.ExpBarRightEmpty,
		};

		if (ratio <= 0) {
			color.left = EmoteString.ExpBarLeftEmpty;
			color.center = EmoteString.ExpBarMidEmpty;
		}

		const bars = color.left + color.center.repeat(emoteCount - emptyBars) + EmoteString.ExpBarMidEmpty.repeat(emptyBars) + color.right;

		if (this.Level === 10) {
			return `${bars} MAX`;
		}

		return `${bars} ${formatMoney(this.Experience, language, "")} / ${formatMoney(exp, language, "")} (${Math.round(ratio * 100)}%)`;
	}

	/**
	 * Checks if a user can send official communications.
	 * @param senderId The ID of the user.
	 * @returns True if the user can communicate, false otherwise.
	 */
	CanCommunicate(senderId: string): boolean {
		// Check if sender is leader or has permission
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

	/**
	 * Sends an official communication to all gang members.
	 * @param sender The user sending the communication.
	 * @param message The message content.
	 * @returns A promise that resolves when the communication is sent.
	 */
	async OfficialCommunication(sender: User, message: IDescription | string) {

		Log.Info(`Gang ${this.Name} (Id: ${this.Id}) official communication from ${sender.Nickname} (Id: ${sender.Id}): ${message}`);

		return await this.ComunicateAllMembers(message, sender, {
			[Language.English]: "Official communication",
			[Language.Portuguese]: "Comunicado oficial",
			[Language.Spanish]: "Comunicado oficial",
		});
	}

	/**
	 * Sends a private message to a specific gang member.
	 * @param member The target member.
	 * @param message The message content (can be localized).
	 * @param sender The user sending the message (optional).
	 * @param specialMessage An special message/header (optional) (can be localized).
	 * @returns A promise that resolves when the message is sent.
	 */
	async ComunicateMember(member: GangMember, message: IDescription | string, sender?: User, specialMessage?: IDescription | string) {
		const language = (await Users.findByPk(member.UserId, { attributes: ["language"] }))?.language ?? Language.English;

		const messageText = typeof message === "string" ? message : message[language];
		let specialMessageText = "";
		if (specialMessage) {
			specialMessageText = typeof specialMessage === "string" ? specialMessage : specialMessage[language];
		}

		const container = new CustomContainerBuilder()
			.setAccentColor(GangColor[this.Color].Color)
			.addTexts([
				messageText,
			])
			.addLargeSeparator()
			.addTexts([
				`-# ${sender ? `${sender.GetNameWithImage()} • ` : ""}${EmoteString.Gang} ${this.Name} (${this.Acronym})${specialMessageText ? ` • **${specialMessageText}**` : ""}`,
			]);

		return await sendComplexPrivateMessage(member.UserId, {
			components: [container],
			flags: [MessageFlags.IsComponentsV2],
		});
	}

	/**
	 * Sends a message to all gang members.
	 * @param message The message content (can be localized).
	 * @param sender The user sending the message (optional)
	 * @param specialMessage An optional special message/header (can be localized).
	 * @returns A promise that resolves when all messages are sent.
	 */
	async ComunicateAllMembers(message: IDescription | string, sender?: User, specialMessage?: IDescription | string) {
		const promises: Promise<Message<false> | undefined>[] = [];

		for (const member of this.Members) {
			promises.push(this.ComunicateMember(member, message, sender, specialMessage));
		}

		return await Promise.all(promises);
	}

	/**
	 * Gets the emote representing a member's permission level.
	 * @param member The gang member.
	 * @returns The emote string.
	 */
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

	/**
	 * Checks if a user can deposit money into the gang.
	 * @param user The user attempting to deposit.
	 * @param amount The amount to deposit.
	 * @returns An object containing whether the deposit is allowed and a reason text.
	 */
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
		else if (!user.IsIdling()) {
			text = s.mustBeIdling;
			canDeposit = false;
		}

		return { canDeposit, text };
	}

	/**
	 * Deposits money into the gang.
	 * @param user The user depositing money.
	 * @param amount The amount to deposit.
	 */
	async Deposit(user: User, amount: number) {
		user.Money -= amount;
		this.Money += amount;

		const member = await GangMembers.findOne({
			where: { userId: user.Id, gangId: this.Id },
		});

		if (member) {
			member.depositTime = addHours(new Date(), Gang.TIME_BETWEEN_DEPOSITS);
			member.depositAmount += amount;

			Log.Success(`User ${user.Nickname} (Id: ${user.Id}) deposited ${formatMoney(amount, user.Language)} in gang ${this.Name} (Id: ${this.Id})`);

			const leaderMember = this.Members.find(m => m.UserId === this.LeaderId);

			const messageToLeader = {
				[Language.English]: `**${user.GetNameWithImage()}** deposited ${formatMoney(amount, Language.English)}`,
				[Language.Portuguese]: `**${user.GetNameWithImage()}** depositou ${formatMoney(amount, Language.Portuguese)}`,
				[Language.Spanish]: `**${user.GetNameWithImage()}** depositó ${formatMoney(amount, Language.Spanish)}`,
			};

			await Promise.all([
				member.save(),
				Notification.GangDepositAgain(user, member.depositTime),
				user.Update({
					money: user.Money,
				}),
				leaderMember && user.Id !== this.LeaderId ? this.ComunicateMember(leaderMember, messageToLeader) : null,
				this.AddExperience(Math.floor(amount * 0.001)),
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
		mustBeIdling: `You must be ${EmoteString.Idle} Idling to deposit`,
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
		mustBeIdling: `Você precisa estar ${EmoteString.Idle} Vadiando para depositar`,
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
		mustBeIdling: `Debes estar ${EmoteString.Idle} Vagando para depositar`,
	},
} as const satisfies Localization;