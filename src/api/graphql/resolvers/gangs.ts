import { GangRoleRepository } from "#core/repositories/GangRoleRepository";
import { GangJoinRequestsRepository } from "#core/repositories/GangJoinRequestsRepository";
import { GangRecruitmentType, GangJoinRequestStatus } from "#core/types/GangRecruitment";
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
				recruitmentType: gang.recruitmentType === GangRecruitmentType.Open ? "OPEN" : gang.recruitmentType === GangRecruitmentType.Approval ? "APPROVAL" : "DISABLED",
				createdAt: gang.createdAt.toISOString(),
			};
		},
	},

	Mutation: {
		gangRecruitmentBoard: async (
			_: unknown,
			args: { search?: string; type?: "DISABLED" | "APPROVAL" | "OPEN" },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			let filterType: number | undefined;
			if (args.type === "APPROVAL") filterType = GangRecruitmentType.Approval;
			else if (args.type === "OPEN") filterType = GangRecruitmentType.Open;
			else if (args.type === "DISABLED") filterType = GangRecruitmentType.Disabled;

			const recruitingGangs = await GangRepository.FindRecruitingGangs(filterType, args.search);

			const results = [];
			for (const gangEntity of recruitingGangs) {
				const gang = await Gang.GetInfo(gangEntity);
				if (!gang) continue;
				const membersCount = gang.Members.length;
				const maxMembers = gang.GetMaxMembers();

				// Exclude gangs that have reached their member cap
				if (membersCount >= maxMembers) continue;

				const baseConfig = gang.BaseId && gang.BaseId !== GangBaseId.None ? GangBases[gang.BaseId] : null;

				results.push({
					id: gang.Id.toString(),
					name: gang.Name,
					acronym: gang.Acronym,
					description: gang.Description,
					level: gang.Level,
					image: gang.Image,
					color: GangColor[gang.Color].Color,
					baseName: baseConfig ? baseConfig.Name[Language.Portuguese] : null,
					baseImage: baseConfig ? baseConfig.Image : null,
					membersCount,
					maxMembers,
					recruitmentType: gang.RecruitmentType === GangRecruitmentType.Open ? "OPEN" : "APPROVAL",
				});
			}

			return results;
		},

		myActiveGangJoinRequest: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const request = await GangJoinRequestsRepository.FindActiveByUser(authUser.userId);
			if (!request) return null;
			return {
				id: request.id.toString(),
				gangId: request.gangId.toString(),
				gangName: request.gangName,
				gangAcronym: request.gangAcronym,
				userId: request.userId,
				userName: request.userName,
				userAvatar: request.userAvatar,
				userLevel: request.userLevel,
				message: request.message,
				status: request.status,
				createdAt: request.createdAt.toISOString(),
			};
		},

		myGangJoinRequestsHistory: async (_: unknown, args: { limit?: number }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const limit = args.limit ? Math.min(Math.max(args.limit, 1), 50) : 20;
			const history = await GangJoinRequestsRepository.FindHistoryByUser(authUser.userId, limit);
			return history.map(h => ({
				id: h.id.toString(),
				gangId: h.gangId.toString(),
				gangName: h.gangName,
				gangAcronym: h.gangAcronym,
				userId: h.userId,
				userName: h.userName,
				userAvatar: h.userAvatar,
				userLevel: h.userLevel,
				message: h.message,
				status: h.status,
				createdAt: h.createdAt.toISOString(),
			}));
		},

		gangJoinRequests: async (_: unknown, args: { gangId: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number.parseInt(args.gangId, 10);
			if (Number.isNaN(gangId)) return [];

			const gangEntity = await GangRepository.FindById(gangId);
			if (!gangEntity) return [];
			const gang = await Gang.GetInfo(gangEntity);
			if (!gang) return [];

			const isLeader = gang.LeaderId === authUser.userId;
			const canInvite = gang.CanInvite(authUser.userId);
			if (!isLeader && !canInvite) {
				return [];
			}

			const requests = await GangJoinRequestsRepository.FindPendingByGang(gangId);
			return requests.map(r => ({
				id: r.id.toString(),
				gangId: r.gangId.toString(),
				gangName: r.gangName,
				gangAcronym: r.gangAcronym,
				userId: r.userId,
				userName: r.userName,
				userAvatar: r.userAvatar,
				userLevel: r.userLevel,
				message: r.message,
				status: r.status,
				createdAt: r.createdAt.toISOString(),
			}));
		},
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
				return { success: false, message: "Cor inv√°lida." };
			}

			// Validate input
			if (!args.name || args.name.length < 4 || args.name.length > 50) {
				return { success: false, message: "O nome deve ter entre 4 e 50 caracteres." };
			}
			if (!args.acronym || args.acronym.length < 2 || args.acronym.length > 3) {
				return { success: false, message: "O acr√¥nimo deve ter entre 2 e 3 caracteres." };
			}
			if (!args.description || args.description.length > 500) {
				return { success: false, message: "A descri√ß√£o n√£o pode exceder 500 caracteres." };
			}

			const user = await new User(authUser.userId).GetInfo();
			if (!user) {
				return { success: false, message: "Usu√°rio n√£o encontrado." };
			}

			const result = await Gang.Create(user, args.name, args.acronym.toLocaleUpperCase("en"), args.description, colorId, args.imageUrl || null);

			if (result.gang) {
				return { success: true, message: "Gangue criada com sucesso." };
			}

			const reasonMessages: Record<string, string> = {
				notEnoughMoney: "Voc√™ n√£o tem dinheiro suficiente para criar uma gangue.",
				alreadyInGang: "Voc√™ j√° est√° em uma gangue.",
				gangExists: "J√° existe uma gangue com este nome.",
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
				return { success: false, message: "Gangue n√£o encontrada." };
			}

			// Check edit permission: leader or role with canEditGang
			const canEdit = gang.CanEdit(authUser.userId);
			if (!canEdit) {
				return { success: false, message: "Voc√™ n√£o tem permiss√£o para editar esta gangue." };
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
					return { success: false, message: "Cor inv√°lida." };
				}
			}

			// Validate name if provided
			if (args.name && (args.name.length < 4 || args.name.length > 50)) {
				return { success: false, message: "O nome deve ter entre 4 e 50 caracteres." };
			}

			// Validate acronym if provided
			if (args.acronym && (args.acronym.length < 2 || args.acronym.length > 3)) {
				return { success: false, message: "O acr√¥nimo deve ter entre 2 e 3 caracteres." };
			}

			// Validate description if provided
			if (args.description && args.description.length > 500) {
				return { success: false, message: "A descri√ß√£o n√£o pode exceder 500 caracteres." };
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
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			if (!Number.isSafeInteger(args.amount)) {
				return { success: false, message: "O valor do dinheiro deve ser um n√∫mero inteiro v√°lido." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}

			const money = args.mode === "ADD" ? gang.Money + args.amount : args.amount;
			if (!Number.isSafeInteger(money)) {
				return { success: false, message: "O dinheiro atualizado deve ser um n√∫mero inteiro v√°lido." };
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
				return { success: false, message: "Gangue n√£o encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			if (!gang.CanImportShipments(authUser.userId)) {
				return { success: false, message: "Voc√™ n√£o tem permiss√£o para importar cargas." };
			}

			const check = await gang.CanStartImport();
			if (!check.can) {
				const messages: Record<GangImportFailureReason, string> = {
					[GangImportFailureReason.NoBase]: "Sua gangue precisa ter uma base para importar cargas.",
					[GangImportFailureReason.ActiveImport]: "J√° existe uma importa√ß√£o em tr√¢nsito.",
					[GangImportFailureReason.Cooldown]: "A importa√ß√£o est√° em per√≠odo de espera.",
					[GangImportFailureReason.CancelCooldown]: "A importa√ß√£o est√° em per√≠odo de espera ap√≥s um cancelamento.",
					[GangImportFailureReason.NotEnoughMoney]: "O banco da gangue n√£o tem dinheiro suficiente.",
				};
				return { success: false, message: check.reason === undefined ? "N√£o foi poss√≠vel iniciar a importa√ß√£o." : messages[check.reason] };
			}

			await gang.StartImport();
			return { success: true, message: "Importa√ß√£o iniciada com sucesso." };
		},

		cancelGangImport: async (
			_: unknown,
			args: { gangId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			if (!gang.CanImportShipments(authUser.userId)) {
				return { success: false, message: "Voc√™ n√£o tem permiss√£o para cancelar importa√ß√µes." };
			}
			if (!gang.IsImportActive()) {
				return { success: false, message: "N√£o h√° uma importa√ß√£o ativa para cancelar." };
			}

			const refund = await gang.CancelImport();
			return { success: true, message: `Importa√ß√£o cancelada. ${formatMoney(refund, Language.Portuguese)} foi reembolsado ao banco da gangue.` };
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
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			const name = args.name.trim();
			if (name.length < 2 || name.length > 20) {
				return { success: false, message: "O nome do cargo deve ter entre 2 e 20 caracteres." };
			}

			const success = await gang.CreateRole(authUser.userId, name, getGangRolePermissions(args));
			return success
				? { success: true, message: "Cargo criado com sucesso." }
				: { success: false, message: "Falha ao criar cargo. Verifique se o nome j√° est√° em uso." };
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
				return { success: false, message: "Cargo n√£o encontrado." };
			}
			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			const name = args.name.trim();
			if (name.length < 2 || name.length > 20) {
				return { success: false, message: "O nome do cargo deve ter entre 2 e 20 caracteres." };
			}

			const success = await gang.EditRole(authUser.userId, args.roleId, getGangRolePermissions(args), name);
			return success
				? { success: true, message: "Cargo atualizado com sucesso." }
				: { success: false, message: "Falha ao atualizar cargo. Verifique as permiss√µes e o nome." };
		},

		updateGangMemberRole: async (
			_: unknown,
			args: { gangId: string; targetUserId: string; roleId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gang = await Gang.GetById(Number(args.gangId));
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			const targetMember = gang.Members.find(member => member.UserId === args.targetUserId);
			const leaderRoleId = gang.Members.find(member => member.UserId === gang.LeaderId)?.RoleId;
			if (!targetMember || targetMember.UserId === gang.LeaderId || args.roleId === leaderRoleId) {
				return { success: false, message: "Membro ou cargo inv√°lido." };
			}

			const success = await gang.ChangeRole(authUser.userId, args.targetUserId, args.roleId);
			return success
				? { success: true, message: "Cargo do membro alterado com sucesso." }
				: { success: false, message: "Voc√™ n√£o tem permiss√£o para alterar este cargo." };
		},

		kickGangMember: async (
			_: unknown,
			args: { gangId: string; targetUserId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			if (!gang.CanKick(authUser.userId)) {
				return { success: false, message: "Voc√™ n√£o tem permiss√£o para expulsar membros." };
			}
			if (args.targetUserId === authUser.userId || args.targetUserId === gang.LeaderId) {
				return { success: false, message: "N√£o √© poss√≠vel expulsar este membro." };
			}
			if (!gang.Members.some(member => member.UserId === args.targetUserId)) {
				return { success: false, message: "Membro n√£o encontrado nesta gangue." };
			}

			const [kicker, target] = await Promise.all([
				new User(authUser.userId).GetInfo(),
				new User(args.targetUserId).GetInfo(),
			]);
			if (!kicker || !target) {
				return { success: false, message: "Membro ou usu√°rio n√£o encontrado." };
			}

			const success = await gang.KickMember(kicker, target);
			return success
				? { success: true, message: "Membro expulso da gangue." }
				: { success: false, message: "N√£o foi poss√≠vel expulsar este membro." };
		},

		communicateGang: async (
			_: unknown,
			args: { gangId: string; message: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gangId = Number(args.gangId);
			if (!Number.isSafeInteger(gangId)) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}

			const gang = await Gang.GetById(gangId);
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			if (!gang.CanCommunicate(authUser.userId)) {
				return { success: false, message: "Voc√™ n√£o tem permiss√£o para comunicar os membros." };
			}

			const message = args.message.trim();
			if (!message || message.length > 4_000) {
				return { success: false, message: "A mensagem deve ter entre 1 e 4.000 caracteres." };
			}

			const sender = await new User(authUser.userId).GetInfo();
			if (!sender) {
				return { success: false, message: "Usu√°rio n√£o encontrado." };
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
				return { success: false, message: "Gangue ou usu√°rio n√£o encontrado." };
			}

			const check = await gang.CanDeposit(user, args.amount);
			if (!check.canDeposit) {
				return { success: false, message: check.text || "N√£o √© poss√≠vel depositar agora." };
			}

			await gang.Deposit(user, args.amount);
			return { success: true, message: "Dep√≥sito realizado com sucesso." };
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
				return { success: false, message: "Voc√™ n√£o faz parte desta gangue." };
			}

			const success = await gang.LeaveGang(user);
			return success
				? { success: true, message: gang.LeaderId === user.Id ? "Gangue encerrada com sucesso." : "Voc√™ saiu da gangue." }
				: { success: false, message: "O l√≠der n√£o pode sair enquanto houver outros membros." };
		},

		transferGang: async (
			_: unknown,
			args: { gangId: string; targetUserId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gang = await Gang.GetById(Number(args.gangId));
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			const [currentUser, targetUser] = await Promise.all([
				new User(authUser.userId).GetInfo(),
				new User(args.targetUserId).GetInfo(),
			]);
			if (!currentUser || !targetUser || !gang.Members.some(member => member.UserId === targetUser.Id)) {
				return { success: false, message: "Membro inv√°lido para transfer√™ncia." };
			}

			const success = await gang.TransferLeadership(currentUser, targetUser);
			return success
				? { success: true, message: "Lideran√ßa transferida com sucesso." }
				: { success: false, message: "Apenas o l√≠der pode transferir a lideran√ßa." };
		},

		inviteGangMember: async (
			_: unknown,
			args: { gangId: string; targetUserId: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const gang = await Gang.GetById(Number(args.gangId));
			if (!gang) {
				return { success: false, message: "Gangue n√£o encontrada." };
			}
			if (!gang.CanInvite(authUser.userId)) {
				return { success: false, message: "Voc√™ n√£o tem permiss√£o para convidar membros." };
			}
			if (authUser.userId === args.targetUserId) {
				return { success: false, message: "Voc√™ n√£o pode convidar a si mesmo." };
			}

			const targetUser = await new User(args.targetUserId).GetInfo();
			if (!targetUser) {
				return { success: false, message: "Usu√°rio n√£o encontrado." };
			}
			const validation = await gang.CanInviteUser(targetUser);
			if (!validation.canInvite) {
				return { success: false, message: "Este usu√°rio n√£o pode entrar na gangue." };
			}

			const client = getClient();
			let inviteCooldown = client.invites.get(gang.Id);
			if (!inviteCooldown) {
				inviteCooldown = new Collection<string, number>();
				client.invites.set(gang.Id, inviteCooldown);
			}
			const lastInviteTime = inviteCooldown.get(targetUser.Id) ?? 0;
			if (Date.now() - lastInviteTime < 3 * 60_000) {
				return { success: false, message: "Aguarde antes de enviar outro convite para este usu√°rio." };
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
					invitation: `Voc√™ foi convidado para entrar na gangue **${gang.Name} [${gang.Acronym}]**.`,
					accept: "Aceitar",
					decline: "Recusar",
					accepted: "Voc√™ entrou na gangue.",
					declined: "Voc√™ recusou o convite da gangue.",
					failed: "Este convite n√£o √© mais v√°lido.",
					expired: "Este convite para a gangue expirou.",
				},
				[Language.Spanish]: {
					invitation: `Te invitaron a unirte a la cuadrilla **${gang.Name} [${gang.Acronym}]**.`,
					accept: "Aceptar",
					decline: "Rechazar",
					accepted: "Te uniste a la cuadrilla.",
					declined: "Rechazaste la invitaci√≥n.",
					failed: "La invitaci√≥n ya no es v√°lida.",
					expired: "La invitaci√≥n a la cuadrilla expir√≥.",
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
				return { success: false, message: "N√£o foi poss√≠vel enviar uma mensagem privada para este usu√°rio." };
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
							&& targetUser.Money >= currentGang.GetJoinCost()
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
		setGangRecruitmentType: async (
			_: unknown,
			args: { gangId: string; recruitmentType: "DISABLED" | "APPROVAL" | "OPEN" },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			assertCanWrite(authUser);
			const gangId = Number.parseInt(args.gangId, 10);
			if (Number.isNaN(gangId)) return { success: false, message: "ID da gangue inv·lido." };

			const gangEntity = await GangRepository.FindById(gangId);
			if (!gangEntity) return { success: false, message: "Gangue n„o encontrada." };
			const gang = await Gang.GetInfo(gangEntity);
			if (!gang) return { success: false, message: "Gangue n„o encontrada." };

			let mode = GangRecruitmentType.Disabled;
			if (args.recruitmentType === "APPROVAL") mode = GangRecruitmentType.Approval;
			else if (args.recruitmentType === "OPEN") mode = GangRecruitmentType.Open;

			const result = await gang.SetRecruitmentType(authUser.userId, mode);
			if (!result.success) {
				if (result.reason === "notLeader") return { success: false, message: "Apenas o lÌder pode alterar as configuraÁıes de recrutamento." };
				return { success: false, message: "N„o foi possÌvel atualizar o tipo de recrutamento." };
			}
			return { success: true, message: "Tipo de recrutamento atualizado com sucesso." };
		},

		joinOpenGang: async (_: unknown, args: { gangId: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			assertCanWrite(authUser);
			const gangId = Number.parseInt(args.gangId, 10);
			if (Number.isNaN(gangId)) return { success: false, message: "ID da gangue inv·lido." };

			const gangEntity = await GangRepository.FindById(gangId);
			if (!gangEntity) return { success: false, message: "Gangue n„o encontrada." };
			const gang = await Gang.GetInfo(gangEntity);
			if (!gang) return { success: false, message: "Gangue n„o encontrada." };

			const user = await new User(authUser.userId).GetInfo();
			if (!user) return { success: false, message: "Usu·rio n„o encontrado." };

			const result = await gang.JoinOpenGang(user);
			if (!result.success) {
				if (result.reason === "alreadyInGang") return { success: false, message: "VocÍ j· pertence a uma gangue." };
				if (result.reason === "gangFull") return { success: false, message: "Esta gangue atingiu o limite de membros." };
				if (result.reason === "notOpenRecruitment") return { success: false, message: "Esta gangue n„o est· com recrutamento aberto." };
				return { success: false, message: "N„o foi possÌvel entrar na gangue. Verifique se vocÍ tem o valor necess·rio." };
			}
			return { success: true, message: `VocÍ entrou na gangue ${gang.Name} com sucesso!` };
		},

		applyToGang: async (_: unknown, args: { gangId: string; message?: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			assertCanWrite(authUser);
			const gangId = Number.parseInt(args.gangId, 10);
			if (Number.isNaN(gangId)) return { success: false, message: "ID da gangue inv·lido." };

			const gangEntity = await GangRepository.FindById(gangId);
			if (!gangEntity) return { success: false, message: "Gangue n„o encontrada." };
			const gang = await Gang.GetInfo(gangEntity);
			if (!gang) return { success: false, message: "Gangue n„o encontrada." };

			const user = await new User(authUser.userId).GetInfo();
			if (!user) return { success: false, message: "Usu·rio n„o encontrado." };

			const result = await gang.ApplyToGang(user, args.message);
			if (!result.success) {
				if (result.reason === "alreadyInGang") return { success: false, message: "VocÍ j· pertence a uma gangue." };
				if (result.reason === "gangFull") return { success: false, message: "Esta gangue atingiu o limite de membros." };
				if (result.reason === "alreadyHasPendingRequest") return { success: false, message: "VocÍ j· possui uma solicitaÁ„o pendente." };
				if (result.reason === "notApprovalRecruitment") return { success: false, message: "Esta gangue n„o est· aceitando solicitaÁıes de ades„o." };
				return { success: false, message: "N„o foi possÌvel enviar a solicitaÁ„o." };
			}
			return { success: true, message: `SolicitaÁ„o enviada para a gangue ${gang.Name} com sucesso!` };
		},

		cancelGangJoinRequest: async (_: unknown, args: { requestId?: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			assertCanWrite(authUser);
			const reqId = args.requestId ? Number.parseInt(args.requestId, 10) : undefined;
			const result = await Gang.CancelJoinRequest(authUser.userId, reqId);
			if (!result.success) {
				return { success: false, message: "Nenhuma solicitaÁ„o pendente encontrada para cancelar." };
			}
			return { success: true, message: "SolicitaÁ„o cancelada com sucesso." };
		},

		resolveGangJoinRequest: async (
			_: unknown,
			args: { gangId: string; requestId: string; accept: boolean },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			assertCanWrite(authUser);
			const gangId = Number.parseInt(args.gangId, 10);
			const requestId = Number.parseInt(args.requestId, 10);
			if (Number.isNaN(gangId) || Number.isNaN(requestId)) {
				return { success: false, message: "Dados inv·lidos." };
			}

			const gangEntity = await GangRepository.FindById(gangId);
			if (!gangEntity) return { success: false, message: "Gangue n„o encontrada." };
			const gang = await Gang.GetInfo(gangEntity);
			if (!gang) return { success: false, message: "Gangue n„o encontrada." };

			const manager = await new User(authUser.userId).GetInfo();
			if (!manager) return { success: false, message: "Gerente n„o encontrado." };

			const result = await gang.ResolveJoinRequest(manager, requestId, args.accept);
			if (!result.success) {
				if (result.reason === "noPermission") return { success: false, message: "VocÍ n„o tem permiss„o para gerenciar solicitaÁıes." };
				if (result.reason === "gangFull") return { success: false, message: "A gangue j· atingiu o limite de membros." };
				if (result.reason === "alreadyInGang") return { success: false, message: "O usu·rio j· entrou em outra gangue." };
				if (result.reason === "requestNotFound") return { success: false, message: "SolicitaÁ„o n„o encontrada ou j· respondida." };
				return { success: false, message: "N„o foi possÌvel processar a solicitaÁ„o." };
			}
			return {
				success: true,
				message: args.accept ? "SolicitaÁ„o aceita com sucesso!" : "SolicitaÁ„o recusada com sucesso.",
			};
		},
	},
};
