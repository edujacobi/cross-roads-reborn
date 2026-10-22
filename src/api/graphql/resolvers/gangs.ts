import { GangRoleRepository } from "#core/repositories/GangRoleRepository";
import { GangMemberRepository } from "#core/repositories/GangMemberRepository";
import { GangRepository } from "#core/repositories/GangRepository";
import { UserRepository } from "#core/repositories/UserRepository";
import { AvatarDecorationList } from "#core/types/AvatarDecorations";
import { BackgroundDecorationList } from "#core/types/BackgroundDecorations";
import { Language } from "#core/models/Language";
import { Gang, GangImportFailureReason, GangPermission } from "#core/models/Gang";
import { User } from "#core/models/User";
import { GangBases, GangBaseId } from "#core/types/GangBases";
import { GangColor, GangColorId } from "#core/types/GangColors";
import type { GraphQLContext } from "#api/types";
import { convertHexNumberToString, formatMoney } from "#bot/utils/ui";
import { getClient } from "#bot/client";
import { assertAuthenticated, assertCanWrite, recordAdminAction } from "./helpers";
import type { ResolverFn } from "./helpers";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, ComponentType, type Message } from "discord.js";
import { logger } from "#shared/log";
import { AdminAuditActionId } from "#core/types/AdminAuditLog";

function getGangRolePermissions(args: {
	canInvite: boolean;
	canKick: boolean;
	canPromote: boolean;
	canEditGang: boolean;
	canImport: boolean;
}): GangPermission[] {
	return [
		args.canInvite ? GangPermission.Invite : null,
		args.canKick ? GangPermission.Kick : null,
		args.canPromote ? GangPermission.Promote : null,
		args.canEditGang ? GangPermission.EditGang : null,
		args.canImport ? GangPermission.ImportShipments : null,
	].filter((permission): permission is GangPermission => permission !== null);
}

export const gangResolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		topGangs: async (
			_: unknown,
			args: { limit?: number; offset?: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const limit = args.limit ?? 15;
			const offset = args.offset ?? 0;
			if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
				throw new Error("Invalid ranking pagination.");
			}

			const [gangs, total, member] = await Promise.all([
				GangRepository.FindTopGangs(limit, offset),
				GangRepository.CountAllGangs(),
				GangMemberRepository.FindByUserId(authUser.userId),
			]);
			const [memberRole, userGang] = await Promise.all([
				member ? GangRoleRepository.FindById(member.roleId) : null,
				member ? GangRepository.FindById(member.gangId) : null,
			]);
			const currentUserGangId = member?.gangId ?? null;

			return {
				total,
				currentUserGangId,
				currentUserGangName: userGang?.name ?? null,
				currentUserGangColor: userGang ? convertHexNumberToString(GangColor[userGang.color].Color) : null,
				entries: gangs.map(gang => ({
					id: gang.id,
					name: gang.name,
					acronym: gang.acronym.toUpperCase(),
					imageUrl: gang.image,
					level: gang.level,
					experience: gang.experience,
					color: convertHexNumberToString(GangColor[gang.color].Color),
					memberRole: gang.id === currentUserGangId ? memberRole?.name ?? "???" : null,
				})),
			};
		},

		gang: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);

			const gang = await GangRepository.FindById(Number(args.id));
			if (!gang) {
				return null;
			}

			const xpForNextLevel = gang.level < 10 ? Gang.GetXpForNextLevel(gang.level) : gang.experience;
			const baseConfig = GangBases[gang.baseId ?? GangBaseId.None];

			const [members, roles, leader] = await Promise.all([
				GangMemberRepository.FindAllByGang(gang.id),
				GangRoleRepository.FindAllByGangId(gang.id),
				UserRepository.FindById(gang.leaderId, ["id", "nickname"]),
			]);
			const currentUser = await UserRepository.FindById(authUser.userId, ["money"]);

			const importState = new Gang();
			importState.Level = gang.level;
			importState.BaseId = gang.baseId ?? GangBaseId.None;
			importState.Money = gang.money;
			importState.ImportArrivesAt = gang.shipmentArrivesAt;
			importState.LastImportSuccess = gang.lastShipmentSuccess;
			importState.LastImportCancelled = gang.lastShipmentCancelled;
			const canStartImport = (await importState.CanStartImport()).can;
			const canViewShipmentInfo = authUser.role === "DEVELOPER"
				|| gang.leaderId === authUser.userId
				|| members.some(member => member.userId === authUser.userId);
			const canImport = gang.leaderId === authUser.userId || members.some(member =>
				member.userId === authUser.userId
				&& roles.some(role => role.id === member.roleId && role.canImportShipments),
			);

			const client = getClient();

			const memberDetails = await Promise.all(
				members.map(async (member) => {

					let avatarUrl: string | null = null;
					try {
						avatarUrl = (await client.users.fetch(member.userId)).avatarURL();
					}
					catch {
						avatarUrl = null;
					}

					const role = roles.find(r => r.id === member.roleId);
					const user = await UserRepository.FindById(member.userId, ["id", "nickname", "avatarDecoration", "backgroundDecoration"]);
					let permCount = 0;
					if (role) {
						if (role.canInvite) permCount++;
						if (role.canKick) permCount++;
						if (role.canPromote) permCount++;
						if (role.canEditGang) permCount++;
						if (role.canImportShipments) permCount++;
					}
					return {
						userId: member.userId,
						nickname: user?.nickname ?? member.userId,
						avatarUrl,
						avatarDecoration: AvatarDecorationList[user?.avatarDecoration ?? 0].Description[Language.English].toLowerCase().replaceAll(" ", "_"),
						backgroundDecoration: BackgroundDecorationList[user?.backgroundDecoration ?? 0].Description[Language.English].toLowerCase().replaceAll(" ", "_"),
						roleId: member.roleId,
						roleName: role?.name ?? "Unknown",
						permissionCount: permCount,
						depositAmount: member.depositAmount,
						depositTime: member.depositTime?.toISOString() ?? null,
						lastDepositAt: member.depositAmount > 0 && member.depositTime
							? new Date(member.depositTime.getTime() - Gang.TIME_BETWEEN_DEPOSITS * 60 * 60 * 1_000).toISOString()
							: null,
					};
				}),
			);

			return {
				id: gang.id,
				name: gang.name,
				acronym: gang.acronym.toUpperCase(),
				description: gang.description ?? "",
				money: gang.money,
				maxDepositAmount: Math.min(currentUser?.money ?? 0, Gang.MAX_DEPOSIT_PER_DAY * gang.level),
				level: gang.level,
				experience: gang.experience,
				xpForNextLevel,
				color: convertHexNumberToString(GangColor[gang.color].Color),
				imageUrl: gang.image,
				base: gang.baseId && gang.baseId !== GangBaseId.None
					? {
						id: gang.baseId,
						name: baseConfig.Name[Language.Portuguese],
						modifierDefense: baseConfig.Modifier.Defense?.Positive ?? baseConfig.Modifier.Defense?.Negative ?? null,
						modifierAttack: baseConfig.Modifier.Attack?.Positive ?? baseConfig.Modifier.Attack?.Negative ?? null,
						modifierPrisonEscape: baseConfig.Modifier.PrisonEscape?.Positive ?? baseConfig.Modifier.PrisonEscape?.Negative ?? null,
					}
					: null,
				shipmentStartedAt: canViewShipmentInfo && gang.shipmentArrivesAt
					? new Date(gang.shipmentArrivesAt.getTime() - Gang.IMPORT_WAIT_HOURS * 3_600_000).toISOString()
					: null,
				shipmentArrivesAt: canViewShipmentInfo ? gang.shipmentArrivesAt?.toISOString() ?? null : null,
				importCost: canViewShipmentInfo ? importState.GetImportCost() : null,
				importSuccessChance: canViewShipmentInfo ? importState.GetImportSuccessChance() : null,
				canImport,
				canStartImport: canViewShipmentInfo ? canStartImport : null,
				canViewShipmentInfo,
				leaderId: gang.leaderId,
				leaderNickname: leader?.nickname ?? null,
				leaderAvatarUrl: null,
				members: memberDetails,
				roles: roles.map(role => ({
					id: role.id,
					name: role.name,
					canInvite: role.canInvite ?? false,
					canKick: role.canKick ?? false,
					canPromote: role.canPromote ?? false,
					canEditGang: role.canEditGang ?? false,
					canImport: role.canImportShipments ?? false,
				})),
				createdAt: gang.createdAt.toISOString(),
			};
		},
	},

	Mutation: {
		createGang: async (
			_: unknown,
			args: { name: string; acronym: string; description: string; color: string; imageUrl?: string | null },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);

			// Map color string to GangColorId enum
			const colorMap: Record<string, GangColorId> = {
				grey: GangColorId.Grey,
				purple: GangColorId.Purple,
				blue: GangColorId.Blue,
				green: GangColorId.Green,
				yellow: GangColorId.Yellow,
				orange: GangColorId.Orange,
				red: GangColorId.Red,
				pink: GangColorId.Pink,
			};
			const colorId = colorMap[args.color?.toLowerCase()];
			if (colorId === undefined) {
				return { success: false, message: "Cor inválida." };
			}

			// Validate input
			if (!args.name || args.name.length < 4 || args.name.length > 50) {
				return { success: false, message: "O nome deve ter entre 4 e 50 caracteres." };
			}
			if (!args.acronym || args.acronym.length < 2 || args.acronym.length > 3) {
				return { success: false, message: "O acrônimo deve ter entre 2 e 3 caracteres." };
			}
			if (!args.description || args.description.length > 500) {
				return { success: false, message: "A descrição não pode exceder 500 caracteres." };
			}

			const user = await new User(authUser.userId).GetInfo();
			if (!user) {
				return { success: false, message: "Usuário não encontrado." };
			}

			const result = await Gang.Create(user, args.name, args.acronym.toLocaleUpperCase("en"), args.description, colorId, args.imageUrl || null);

			if (result.gang) {
				return { success: true, message: "Gangue criada com sucesso." };
			}

			const reasonMessages: Record<string, string> = {
				notEnoughMoney: "Você não tem dinheiro suficiente para criar uma gangue.",
				alreadyInGang: "Você já está em uma gangue.",
				gangExists: "Já existe uma gangue com este nome.",
			};
			const message = result.reason ? (reasonMessages[result.reason] ?? "Falha ao criar gangue.") : "Falha ao criar gangue.";
			return { success: false, message };
		},

		updateGang: async (
			_: unknown,
			args: {
				id: string;
				name?: string;
				acronym?: string;
				description?: string;
				color?: string;
				imageUrl?: string
			},
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);

			const gang = await Gang.GetById(Number(args.id));
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}

			// Check edit permission: leader or role with canEditGang
			const canEdit = gang.CanEdit(authUser.userId);
			if (!canEdit) {
				return { success: false, message: "Você não tem permissão para editar esta gangue." };
			}

			// Map color string to GangColorId enum if provided
			let colorId: GangColorId | null = null;
			if (args.color) {
				const colorMap: Record<string, GangColorId> = {
					grey: GangColorId.Grey,
					purple: GangColorId.Purple,
					blue: GangColorId.Blue,
					green: GangColorId.Green,
					yellow: GangColorId.Yellow,
					orange: GangColorId.Orange,
					red: GangColorId.Red,
					pink: GangColorId.Pink,
				};
				colorId = colorMap[args.color?.toLowerCase()];
				if (colorId === undefined) {
					return { success: false, message: "Cor inválida." };
				}
			}

			// Validate name if provided
			if (args.name && (args.name.length < 4 || args.name.length > 50)) {
				return { success: false, message: "O nome deve ter entre 4 e 50 caracteres." };
			}

			// Validate acronym if provided
			if (args.acronym && (args.acronym.length < 2 || args.acronym.length > 3)) {
				return { success: false, message: "O acrônimo deve ter entre 2 e 3 caracteres." };
			}

			// Validate description if provided
			if (args.description && args.description.length > 500) {
				return { success: false, message: "A descrição não pode exceder 500 caracteres." };
			}

			const success = await gang.Edit(
				args.name ?? null,
				args.acronym?.toLocaleUpperCase("en") ?? null,
				args.description ?? null,
				colorId,
				args.imageUrl ?? null,
			);

			if (success) {
				return { success: true, message: "Gangue atualizada com sucesso." };
			}
			return { success: false, message: "Falha ao atualizar gangue." };
		},

		setGangMoney: async (
			_: unknown,
			args: { gangId: string; amount: number; mode: "ADD" | "SET" },
			context: GraphQLContext,
		) => {
			const admin = assertCanWrite(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue não encontrada." };
			}
			if (!Number.isSafeInteger(args.amount)) {
				return { success: false, message: "O valor do dinheiro deve ser um número inteiro válido." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}

			const money = args.mode === "ADD" ? gang.Money + args.amount : args.amount;
			if (!Number.isSafeInteger(money)) {
				return { success: false, message: "O dinheiro atualizado deve ser um número inteiro válido." };
			}

			const previousMoney = gang.Money;
			gang.Money = money;
			const success = await gang.Update();
			if (success) {
				await recordAdminAction(admin, AdminAuditActionId.SetGangMoney, { gangId }, previousMoney, money);
			}
			return success
				? { success: true, message: `Dinheiro da gangue atualizado para ${formatMoney(money, Language.Portuguese)}.` }
				: { success: false, message: "Falha ao atualizar o dinheiro da gangue." };
		},

		startGangImport: async (
			_: unknown,
			args: { gangId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue não encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			if (!gang.CanImportShipments(authUser.userId)) {
				return { success: false, message: "Você não tem permissão para importar cargas." };
			}

			const check = await gang.CanStartImport();
			if (!check.can) {
				const messages: Record<GangImportFailureReason, string> = {
					[GangImportFailureReason.NoBase]: "Sua gangue precisa ter uma base para importar cargas.",
					[GangImportFailureReason.ActiveImport]: "Já existe uma importação em trânsito.",
					[GangImportFailureReason.Cooldown]: "A importação está em período de espera.",
					[GangImportFailureReason.CancelCooldown]: "A importação está em período de espera após um cancelamento.",
					[GangImportFailureReason.NotEnoughMoney]: "O banco da gangue não tem dinheiro suficiente.",
				};
				return { success: false, message: check.reason === undefined ? "Não foi possível iniciar a importação." : messages[check.reason] };
			}

			await gang.StartImport();
			return { success: true, message: "Importação iniciada com sucesso." };
		},

		cancelGangImport: async (
			_: unknown,
			args: { gangId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue não encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			if (!gang.CanImportShipments(authUser.userId)) {
				return { success: false, message: "Você não tem permissão para cancelar importações." };
			}
			if (!gang.IsImportActive()) {
				return { success: false, message: "Não há uma importação ativa para cancelar." };
			}

			const refund = await gang.CancelImport();
			return { success: true, message: `Importação cancelada. ${formatMoney(refund, Language.Portuguese)} foi reembolsado ao banco da gangue.` };
		},

		createGangRole: async (
			_: unknown,
			args: {
				gangId: string;
				name: string;
				canInvite: boolean;
				canKick: boolean;
				canPromote: boolean;
				canEditGang: boolean;
				canImport: boolean;
			},
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue não encontrada." };
			}
			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			const name = args.name.trim();
			if (name.length < 2 || name.length > 20) {
				return { success: false, message: "O nome do cargo deve ter entre 2 e 20 caracteres." };
			}

			const success = await gang.CreateRole(authUser.userId, name, getGangRolePermissions(args));
			return success
				? { success: true, message: "Cargo criado com sucesso." }
				: { success: false, message: "Falha ao criar cargo. Verifique se o nome já está em uso." };
		},

		updateGangRole: async (
			_: unknown,
			args: {
				gangId: string;
				roleId: number;
				name: string;
				canInvite: boolean;
				canKick: boolean;
				canPromote: boolean;
				canEditGang: boolean;
				canImport: boolean;
			},
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId) || !Number.isSafeInteger(args.roleId)) {
				return { success: false, message: "Cargo não encontrado." };
			}
			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			const name = args.name.trim();
			if (name.length < 2 || name.length > 20) {
				return { success: false, message: "O nome do cargo deve ter entre 2 e 20 caracteres." };
			}

			const success = await gang.EditRole(authUser.userId, args.roleId, getGangRolePermissions(args), name);
			return success
				? { success: true, message: "Cargo atualizado com sucesso." }
				: { success: false, message: "Falha ao atualizar cargo. Verifique as permissões e o nome." };
		},

		updateGangMemberRole: async (
			_: unknown,
			args: { gangId: string; targetUserId: string; roleId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gang = await Gang.GetById(Number(args.gangId));
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			const targetMember = gang.Members.find(member => member.UserId === args.targetUserId);
			const leaderRoleId = gang.Members.find(member => member.UserId === gang.LeaderId)?.RoleId;
			if (!targetMember || targetMember.UserId === gang.LeaderId || args.roleId === leaderRoleId) {
				return { success: false, message: "Membro ou cargo inválido." };
			}

			const success = await gang.ChangeRole(authUser.userId, args.targetUserId, args.roleId);
			return success
				? { success: true, message: "Cargo do membro alterado com sucesso." }
				: { success: false, message: "Você não tem permissão para alterar este cargo." };
		},

		kickGangMember: async (
			_: unknown,
			args: { gangId: string; targetUserId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue não encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			if (!gang.CanKick(authUser.userId)) {
				return { success: false, message: "Você não tem permissão para expulsar membros." };
			}
			if (args.targetUserId === authUser.userId || args.targetUserId === gang.LeaderId) {
				return { success: false, message: "Não é possível expulsar este membro." };
			}
			if (!gang.Members.some(member => member.UserId === args.targetUserId)) {
				return { success: false, message: "Membro não encontrado nesta gangue." };
			}

			const [kicker, target] = await Promise.all([
				new User(authUser.userId).GetInfo(),
				new User(args.targetUserId).GetInfo(),
			]);
			if (!kicker || !target) {
				return { success: false, message: "Membro ou usuário não encontrado." };
			}

			const success = await gang.KickMember(kicker, target);
			return success
				? { success: true, message: "Membro expulso da gangue." }
				: { success: false, message: "Não foi possível expulsar este membro." };
		},

		communicateGang: async (
			_: unknown,
			args: { gangId: string; message: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue não encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			if (!gang.CanCommunicate(authUser.userId)) {
				return { success: false, message: "Você não tem permissão para comunicar os membros." };
			}

			const message = args.message.trim();
			if (!message || message.length > 4_000) {
				return { success: false, message: "A mensagem deve ter entre 1 e 4.000 caracteres." };
			}

			const sender = await new User(authUser.userId).GetInfo();
			if (!sender) {
				return { success: false, message: "Usuário não encontrado." };
			}

			await gang.OfficialCommunication(sender, message);
			return { success: true, message: "Comunicado enviado aos membros." };
		},

		depositGang: async (
			_: unknown,
			args: { gangId: string; amount: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			if (!Number.isSafeInteger(args.amount) || args.amount <= 0) {
				return { success: false, message: "Informe um valor inteiro maior que zero." };
			}

			const gang = await Gang.GetById(Number(args.gangId));
			const user = await new User(authUser.userId).GetInfo();
			if (!gang || !user) {
				return { success: false, message: "Gangue ou usuário não encontrado." };
			}

			const check = await gang.CanDeposit(user, args.amount);
			if (!check.canDeposit) {
				return { success: false, message: check.text || "Não é possível depositar agora." };
			}

			await gang.Deposit(user, args.amount);
			return { success: true, message: "Depósito realizado com sucesso." };
		},

		leaveGang: async (
			_: unknown,
			args: { gangId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gang = await Gang.GetById(Number(args.gangId));
			const user = await new User(authUser.userId).GetInfo();
			if (!gang || !user || !gang.Members.some(member => member.UserId === user.Id)) {
				return { success: false, message: "Você não faz parte desta gangue." };
			}

			const success = await gang.LeaveGang(user);
			return success
				? { success: true, message: gang.LeaderId === user.Id ? "Gangue encerrada com sucesso." : "Você saiu da gangue." }
				: { success: false, message: "O líder não pode sair enquanto houver outros membros." };
		},

		transferGang: async (
			_: unknown,
			args: { gangId: string; targetUserId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gang = await Gang.GetById(Number(args.gangId));
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			const [currentUser, targetUser] = await Promise.all([
				new User(authUser.userId).GetInfo(),
				new User(args.targetUserId).GetInfo(),
			]);
			if (!currentUser || !targetUser || !gang.Members.some(member => member.UserId === targetUser.Id)) {
				return { success: false, message: "Membro inválido para transferência." };
			}

			const success = await gang.TransferLeadership(currentUser, targetUser);
			return success
				? { success: true, message: "Liderança transferida com sucesso." }
				: { success: false, message: "Apenas o líder pode transferir a liderança." };
		},

		inviteGangMember: async (
			_: unknown,
			args: { gangId: string; targetUserId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gang = await Gang.GetById(Number(args.gangId));
			if (!gang) {
				return { success: false, message: "Gangue não encontrada." };
			}
			if (!gang.CanInvite(authUser.userId)) {
				return { success: false, message: "Você não tem permissão para convidar membros." };
			}
			if (authUser.userId === args.targetUserId) {
				return { success: false, message: "Você não pode convidar a si mesmo." };
			}

			const targetUser = await new User(args.targetUserId).GetInfo();
			if (!targetUser) {
				return { success: false, message: "Usuário não encontrado." };
			}
			const validation = await gang.CanInviteUser(targetUser);
			if (!validation.canInvite) {
				return { success: false, message: "Este usuário não pode entrar na gangue." };
			}

			const client = getClient();
			let inviteCooldown = client.invites.get(gang.Id);
			if (!inviteCooldown) {
				inviteCooldown = new Collection<string, number>();
				client.invites.set(gang.Id, inviteCooldown);
			}
			const lastInviteTime = inviteCooldown.get(targetUser.Id) ?? 0;
			if (Date.now() - lastInviteTime < 3 * 60_000) {
				return { success: false, message: "Aguarde antes de enviar outro convite para este usuário." };
			}

			const strings = {
				[Language.English]: {
					invitation: `You were invited to join **${gang.Name} [${gang.Acronym}]**.`,
					accept: "Accept",
					decline: "Decline",
					accepted: "You joined the gang.",
					declined: "You declined the gang invitation.",
					failed: "The invitation is no longer valid.",
					expired: "This gang invitation expired.",
				},
				[Language.Portuguese]: {
					invitation: `Você foi convidado para entrar na gangue **${gang.Name} [${gang.Acronym}]**.`,
					accept: "Aceitar",
					decline: "Recusar",
					accepted: "Você entrou na gangue.",
					declined: "Você recusou o convite da gangue.",
					failed: "Este convite não é mais válido.",
					expired: "Este convite para a gangue expirou.",
				},
				[Language.Spanish]: {
					invitation: `Te invitaron a unirte a la cuadrilla **${gang.Name} [${gang.Acronym}]**.`,
					accept: "Aceptar",
					decline: "Rechazar",
					accepted: "Te uniste a la cuadrilla.",
					declined: "Rechazaste la invitación.",
					failed: "La invitación ya no es válida.",
					expired: "La invitación a la cuadrilla expiró.",
				},
			}[targetUser.Language];

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setCustomId("accept").setLabel(strings.accept).setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId("decline").setLabel(strings.decline).setStyle(ButtonStyle.Secondary),
			);
			inviteCooldown.set(targetUser.Id, Date.now());
			let invitation: Message<boolean>;
			try {
				const discordUser = await client.users.fetch(targetUser.Id);
				invitation = await discordUser.send({ content: strings.invitation, components: [row] });
			}
			catch (error) {
				logger.warn({ error, gangId: gang.Id, targetUserId: targetUser.Id }, "Failed to send gang invitation.");
				inviteCooldown.delete(targetUser.Id);
				return { success: false, message: "Não foi possível enviar uma mensagem privada para este usuário." };
			}

			const collector = invitation.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: interaction => interaction.user.id === targetUser.Id,
				max: 1,
				time: 3 * 60_000,
			});
			collector.on("collect", async interaction => {
				let message = strings.declined;
				try {
					await interaction.deferUpdate();
					if (interaction.customId === "accept") {
						const [currentGang] = await Promise.all([
							Gang.GetById(gang.Id),
							targetUser.GetInfo(),
						]);
						message = currentGang
							&& currentGang.CanInvite(authUser.userId)
							&& targetUser.Money >= Gang.JOIN_COST
							&& await currentGang.AcceptInvite(targetUser)
							? strings.accepted
							: strings.failed;
					}
					await invitation.edit({ content: message, components: [] });
				}
				catch (error) {
					logger.error({ error, gangId: gang.Id, targetUserId: targetUser.Id }, "Failed to process gang invitation response.");
					await invitation.edit({ content: strings.failed, components: [] }).catch(editError => {
						logger.warn({ error: editError, gangId: gang.Id, targetUserId: targetUser.Id }, "Failed to update gang invitation response.");
					});
				}
			});
			collector.on("end", (collected) => {
				if (collected.size > 0) return;
				void invitation.edit({ content: strings.expired, components: [] }).catch(error => {
					logger.warn({ error, gangId: gang.Id, targetUserId: targetUser.Id }, "Failed to expire gang invitation.");
				});
			});

			return { success: true, message: "Convite enviado por mensagem privada." };
		},
	},
};
