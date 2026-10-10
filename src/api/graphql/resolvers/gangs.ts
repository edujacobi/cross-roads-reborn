import { GangRoleRepository } from "#core/repositories/GangRoleRepository";
import { GangMemberRepository } from "#core/repositories/GangMemberRepository";
import { GangRepository } from "#core/repositories/GangRepository";
import { UserRepository } from "#core/repositories/UserRepository";
import { AvatarDecorationList } from "#core/types/AvatarDecorations";
import { BackgroundDecorationList } from "#core/types/BackgroundDecorations";
import { Language } from "#core/models/Language";
import { Gang } from "#core/models/Gang";
import { User } from "#core/models/User";
import { GangBases, GangBaseId } from "#core/types/GangBases";
import { GangColor, GangColorId } from "#core/types/GangColors";
import type { GraphQLContext } from "#api/types";
import { convertHexNumberToString } from "#bot/utils/ui";
import { getClient } from "#bot/client";
import { assertAuthenticated } from "./helpers";
import type { ResolverFn } from "./helpers";

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
			assertAuthenticated(context);

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
			if (!args.description || args.description.length > 200) {
				return { success: false, message: "A descrição não pode exceder 200 caracteres." };
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
	},
};

