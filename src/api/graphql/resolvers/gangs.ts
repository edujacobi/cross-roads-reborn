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
import { assertAuthenticated } from "./helpers";
import type { ResolverFn } from "./helpers";

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
					};
				}),
			);

			return {
				id: gang.id,
				name: gang.name,
				acronym: gang.acronym.toUpperCase(),
				description: gang.description ?? "",
				money: gang.money,
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
	},
};
