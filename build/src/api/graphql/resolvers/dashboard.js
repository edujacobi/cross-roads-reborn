"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardResolvers = void 0;
const Dashboard_1 = require("#core/models/Dashboard");
const Vault_1 = require("#core/models/Vault");
const Language_1 = require("#core/models/Language");
const Items_1 = require("#core/types/Items");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const helpers_1 = require("./helpers");
exports.dashboardResolvers = {
    Query: {
        dashboardStats: async (_, __, context) => {
            (0, helpers_1.assertAdmin)(context);
            const [stats, vaultBalances] = await Promise.all([
                Dashboard_1.Dashboard.GetCurrentStats(),
                Vault_1.Vault.GetBalances(),
            ]);
            return {
                ...stats,
                date: stats.date.toISOString(),
                bankVaultValue: vaultBalances.bank,
                casinoVaultValue: vaultBalances.casino,
            };
        },
        dashboardHistory: async (_, __, context) => {
            (0, helpers_1.assertAdmin)(context);
            const history = await Dashboard_1.Dashboard.GetLast30Days();
            return history.map((snapshot) => ({
                id: snapshot.id || null,
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
        dashboardItemPopularity: async (_, __, context) => {
            (0, helpers_1.assertAdmin)(context);
            return await Promise.all(Object.values(Items_1.ItemList).map(async (item) => ({
                itemId: item.Id,
                name: item.Description[Language_1.Language.Portuguese],
                userCount: await UserItemRepository_1.UserItemRepository.CountUsersWithItem(item.Id),
            })));
        },
    },
};
//# sourceMappingURL=dashboard.js.map