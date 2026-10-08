import { Dashboard } from "#core/models/Dashboard";
import { Vault } from "#core/models/Vault";
import { Language } from "#core/models/Language";
import { ItemList } from "#core/types/Items";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import type { GraphQLContext } from "#api/types";
import { assertAdmin } from "./helpers";
import type { ResolverFn } from "./helpers";

export const dashboardResolvers: {
	Query: Record<string, ResolverFn>;
} = {
	Query: {
		dashboardStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAdmin(context);
			const [stats, vaultBalances] = await Promise.all([
				Dashboard.GetCurrentStats(),
				Vault.GetBalances(),
			]);
			return {
				...stats,
				date: stats.date.toISOString(),
				bankVaultValue: vaultBalances.bank,
				casinoVaultValue: vaultBalances.casino,
			};
		},

		dashboardHistory: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAdmin(context);
			const history = await Dashboard.GetLast30Days();
			return history.map((snapshot) => ({
				id: (snapshot as { id?: number }).id || null,
				date: snapshot.date instanceof Date ? snapshot.date.toISOString() : String(snapshot.date),
				totalPlayers: snapshot.totalPlayers,
				allUsers: snapshot.allUsers,
				classCounts: snapshot.classCounts === null ? null : JSON.parse(snapshot.classCounts),
				totalGangs: snapshot.totalGangs,
				prisonCount: snapshot.prisonCount,
				hospitalCount: snapshot.hospitalCount,
				jobCount: snapshot.jobCount,
				scavengeCount: snapshot.scavengeCount,
				casinoCount: snapshot.casinoCount,
				robberyCount: snapshot.robberyCount,
				beatUpCount: snapshot.beatUpCount,
				idleCount: snapshot.idleCount,
				englishCount: snapshot.englishCount,
				portugueseCount: snapshot.portugueseCount,
				spanishCount: snapshot.spanishCount,
			}));
		},

		dashboardItemPopularity: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAdmin(context);
			return await Promise.all(
				Object.values(ItemList).map(async (item) => ({
					itemId: item.Id,
					name: item.Description[Language.Portuguese],
					userCount: await UserItemRepository.CountUsersWithItem(item.Id),
				})),
			);
		},
	},
};

