"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seasonResolvers = void 0;
const Season_1 = require("#core/models/Season");
const Vault_1 = require("#core/models/Vault");
const AdminAuditLog_1 = require("#core/types/AdminAuditLog");
const helpers_1 = require("./helpers");
exports.seasonResolvers = {
    Query: {
        seasonInfo: async (_, __, context) => {
            (0, helpers_1.assertAdmin)(context);
            const [season, mainHeistAllowed] = await Promise.all([
                Season_1.Season.GetCurrent(),
                Vault_1.Vault.IsMainHeistAllowed(),
            ]);
            return {
                number: season.Number,
                startDate: season.StartDate.toISOString(),
                endDate: season.EndDate.toISOString(),
                daysRemaining: season.GetDaysRemaining(),
                mainHeistAllowed,
            };
        },
        seasonEndPreview: async (_, __, context) => {
            (0, helpers_1.assertDeveloper)(context);
            const [[topMoney, topGambler, topSpender, topThiefProfit, topThiefQuantity, topWorker, topBeater, topScavenger, topHospital, topBriber, topEscaper, topDrunk, topInvestor, topGang,], [activeUsers, activeGangs, gangMembers, gangRoles, gangHeists, items, robberies, notifications, lotteryTickets, investments, horseRaceBets,],] = await Promise.all([
                Season_1.Season.GetEndSeasonRankingData(),
                Season_1.Season.GetEndSeasonStats(),
            ]);
            const mapUsers = (users, value) => users.map(user => ({
                id: user.id,
                nickname: user.nickname,
                class: user.class,
                value: value(user),
            }));
            return {
                topMoney: mapUsers(topMoney, user => user.money),
                topGambler: mapUsers(topGambler, user => user.casinoWinSum),
                topSpender: mapUsers(topSpender, user => user.shopSpentSum),
                topThiefProfit: mapUsers(topThiefProfit, user => user.robberySuccessRobbedSum),
                topThiefQuantity: mapUsers(topThiefQuantity, user => user.robberySuccessCount),
                topWorker: mapUsers(topWorker, user => user.jobReceivedSum),
                topBeater: mapUsers(topBeater, user => user.beatUpSuccessCount),
                topScavenger: mapUsers(topScavenger, user => user.scavengeFoundTotal),
                topHospital: mapUsers(topHospital, user => user.hospitalTreatmentSum),
                topBriber: mapUsers(topBriber, user => user.prisonBriberySum),
                topEscaper: mapUsers(topEscaper, user => user.escapeCount),
                topDrunk: mapUsers(topDrunk, user => user.drinkHappyHour),
                topInvestor: mapUsers(topInvestor, user => user.investmentTotalProfit),
                topGang,
                stats: {
                    activeUsers,
                    activeGangs,
                    gangMembers,
                    gangRoles,
                    gangHeists,
                    items,
                    robberies,
                    notifications,
                    lotteryTickets,
                    investments,
                    horseRaceBets,
                },
            };
        },
    },
    Mutation: {
        setMainHeistAllowed: async (_, args, context) => {
            const admin = (0, helpers_1.assertDeveloper)(context);
            const previousValue = await Vault_1.Vault.IsMainHeistAllowed();
            await Vault_1.Vault.SetMainHeistAllowed(args.allowed);
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_1.AdminAuditActionId.SetMainHeistAllowed, { settingId: AdminAuditLog_1.AdminAuditSettingId.MainHeist }, previousValue, args.allowed);
            return {
                success: true,
                message: `Golpe principal ${args.allowed ? "ativado" : "desativado"}.`,
            };
        },
        endSeason: async (_, args, context) => {
            const admin = (0, helpers_1.assertDeveloper)(context);
            const previousSeason = await Season_1.Season.GetCurrent();
            await Season_1.Season.EndCurrentSeason(args.isPreSeason);
            const newSeason = await Season_1.Season.GetCurrent();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_1.AdminAuditActionId.EndSeason, { settingId: AdminAuditLog_1.AdminAuditSettingId.Season }, { number: previousSeason.Number, startDate: previousSeason.StartDate, endDate: previousSeason.EndDate }, {
                number: newSeason.Number,
                startDate: newSeason.StartDate,
                endDate: newSeason.EndDate,
                isPreSeason: args.isPreSeason,
            });
            return {
                success: true,
                message: args.isPreSeason
                    ? "Valores da pré-temporada resetados e uma nova temporada iniciada."
                    : "Temporada encerrada, vencedores premiados, anúncios enviados e uma nova temporada iniciada.",
            };
        },
    },
};
//# sourceMappingURL=season.js.map