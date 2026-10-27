"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResolvers = void 0;
const graphql_1 = require("graphql");
const User_1 = require("#core/models/User");
const UserRepository_1 = require("#core/repositories/UserRepository");
const GangMemberRepository_1 = require("#core/repositories/GangMemberRepository");
const GangRepository_1 = require("#core/repositories/GangRepository");
const AvatarDecorations_1 = require("#core/types/AvatarDecorations");
const BackgroundDecorations_1 = require("#core/types/BackgroundDecorations");
const Language_1 = require("#core/models/Language");
const GangColors_1 = require("#core/types/GangColors");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
const Robbery_1 = require("#core/types/Robbery");
const Locations_1 = require("#core/types/Locations");
const Investments_1 = require("#core/types/Investments");
const ui_1 = require("#bot/utils/ui");
const UserBadge_1 = require("#core/models/UserBadge");
const client_1 = require("#bot/client");
const helpers_1 = require("./helpers");
function formatAvatarDecoration(decorationId) {
    return AvatarDecorations_1.AvatarDecorationList[decorationId].Description[Language_1.Language.English]
        .toLowerCase()
        .replaceAll(" ", "_");
}
function formatBackgroundDecoration(decorationId) {
    return BackgroundDecorations_1.BackgroundDecorationList[decorationId].Description[Language_1.Language.English]
        .toLowerCase()
        .replaceAll(" ", "_");
}
exports.userResolvers = {
    UserDetail: {
        investment: (parent, _, context) => {
            const user = parent;
            if (!user.investment) {
                return null;
            }
            const viewer = (0, helpers_1.assertAuthenticated)(context);
            if (viewer.role === "DEVELOPER" || viewer.userId === user.id) {
                return user.investment;
            }
            return {
                ...user.investment,
                defense: null,
                nextPaymentValue: null,
                henchmanEndsAt: null,
            };
        },
    },
    Query: {
        users: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            if (authUser.role === "PLAYER" && args.vipOnly) {
                throw new graphql_1.GraphQLError("Acesso negado: Filtragem VIP é restrita a administradores.", {
                    extensions: { code: "FORBIDDEN" },
                });
            }
            const { users, total } = await UserRepository_1.UserRepository.SearchUsers({
                search: args.search,
                limit: args.limit,
                offset: args.offset,
                vipOnly: args.vipOnly,
                sortBy: args.sortBy,
                sortOrder: args.sortOrder,
            });
            const client = (0, client_1.getClient)();
            const mappedUsers = users.map(async (u) => {
                const user = await new User_1.User(u.id).GetSimpleInfo(u);
                if (!user) {
                    return;
                }
                const [, isDev, isMod, isHelper] = await Promise.all([
                    user.GetSituation(),
                    UserBadge_1.UserBadge.IsDeveloper(user.Id),
                    UserBadge_1.UserBadge.IsModerator(user.Id),
                    UserBadge_1.UserBadge.IsHelper(user.Id),
                ]);
                let avatarUrl;
                try {
                    avatarUrl = (await client.users.fetch(user.Id)).avatarURL();
                }
                catch {
                    avatarUrl = null;
                }
                return {
                    id: user.Id,
                    nickname: user.Nickname,
                    avatarUrl,
                    avatarDecoration: formatAvatarDecoration(user.AvatarDecoration.Id),
                    backgroundDecoration: formatBackgroundDecoration(user.BackgroundDecoration.Id),
                    class: user.Class,
                    isVip: authUser.role !== "PLAYER" && user.IsVip(),
                    vipEternal: authUser.role !== "PLAYER" && user.VipEternal,
                    vipTime: authUser.role === "PLAYER" ? null : user.VipTime?.toISOString() ?? null,
                    situationId: authUser.role === "PLAYER" ? 0 : user.Situation.Id,
                    createdAt: authUser.role === "PLAYER" ? "" : user.CreatedAt.toISOString(),
                    updatedAt: authUser.role === "PLAYER" ? "" : user.UpdatedAt.toISOString(),
                    isDeveloper: authUser.role !== "PLAYER" && isDev,
                    isModerator: authUser.role !== "PLAYER" && isMod,
                    isHelper: authUser.role !== "PLAYER" && isHelper,
                };
            });
            return {
                users: mappedUsers,
                total,
            };
        },
        topUsers: async (_, args, context) => {
            (0, helpers_1.assertAuthenticated)(context);
            const ranking = helpers_1.topUserRankings[args.ranking];
            const limit = args.limit ?? 15;
            const offset = args.offset ?? 0;
            if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
                throw new graphql_1.GraphQLError("Paginação de ranking inválida.", {
                    extensions: { code: "BAD_USER_INPUT" },
                });
            }
            const [users, total] = await Promise.all([
                UserRepository_1.UserRepository.FindTopUsers(ranking.orderField, limit, offset),
                UserRepository_1.UserRepository.CountTopUsers(ranking.orderField),
            ]);
            const memberships = await GangMemberRepository_1.GangMemberRepository.FindAllByUserIds(users.map(user => user.id));
            const gangs = await GangRepository_1.GangRepository.FindAllByIds([...new Set(memberships.map(member => member.gangId))]);
            const gangNames = new Map(gangs.map(gang => [gang.id, gang.name]));
            const gangAcronyms = new Map(gangs.map(gang => [gang.id, gang.acronym]));
            const gangColors = new Map(gangs.map(gang => [gang.id, (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[gang.color].Color)]));
            const gangByUserId = new Map(memberships.map(member => [member.userId, gangNames.get(member.gangId) ?? null]));
            const gangAcronymByUserId = new Map(memberships.map(member => [member.userId, gangAcronyms.get(member.gangId) ?? null]));
            const gangColorByUserId = new Map(memberships.map(member => [member.userId, gangColors.get(member.gangId) ?? null]));
            const client = (0, client_1.getClient)();
            const entries = await Promise.all(users.map(async (user) => {
                let avatarUrl = null;
                try {
                    avatarUrl = (await client.users.fetch(user.id)).avatarURL();
                }
                catch {
                    avatarUrl = null;
                }
                return {
                    id: user.id,
                    nickname: user.nickname || "(Sem Nick)",
                    avatarUrl,
                    avatarDecoration: formatAvatarDecoration(user.avatarDecoration),
                    backgroundDecoration: formatBackgroundDecoration(user.backgroundDecoration),
                    gangName: gangByUserId.get(user.id) ?? null,
                    gangAcronym: gangAcronymByUserId.get(user.id) ?? null,
                    gangColor: gangColorByUserId.get(user.id) ?? null,
                    value: Number(user[ranking.orderField]),
                    count: ranking.countField ? Number(user[ranking.countField]) : null,
                };
            }));
            return { entries, total };
        },
        user: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const user = new User_1.User(args.id);
            const found = await user.GetInfo(undefined, Language_1.Language.Portuguese);
            if (!found) {
                return null;
            }
            const detail = await (0, helpers_1.mapUserDetail)(user);
            if (authUser.role !== "PLAYER" || authUser.userId === user.Id) {
                return detail;
            }
            return {
                ...detail,
                specialCoin: null,
                automaticGrenade: null,
                language: "",
                voteCount: 0,
                createdAt: "",
                updatedAt: "",
            };
        },
        userHistory: async (_, args, context) => {
            (0, helpers_1.assertAuthenticated)(context);
            const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 50);
            const offset = Math.max(Math.trunc(args.offset ?? 0), 0);
            const [records, total] = await Promise.all([
                RobHistoryRepository_1.RobHistoryRepository.GetList(args.userId, limit, offset),
                RobHistoryRepository_1.RobHistoryRepository.Count(args.userId),
            ]);
            const userIds = new Set();
            for (const rec of records) {
                if (rec.attackerId)
                    userIds.add(rec.attackerId);
                if (rec.defenderId)
                    userIds.add(rec.defenderId);
            }
            const users = await Promise.all(Array.from(userIds).map(async (id) => [
                id,
                await UserRepository_1.UserRepository.FindById(id, ["id", "class", "nickname"]),
            ]));
            const userById = new Map(users);
            const client = (0, client_1.getClient)();
            const entries = Promise.all(records.map(async (rob) => {
                const attackerUser = rob.attackerId ? userById.get(rob.attackerId) : null;
                const defenderUser = rob.defenderId ? userById.get(rob.defenderId) : null;
                const [attackAvatarUrl, defendAvatarUrl] = await Promise.all([
                    client.users.fetch(rob.attackerId)
                        .then(user => user.avatarURL())
                        .catch(() => null),
                    rob.defenderId
                        ? client.users.fetch(rob.defenderId)
                            .then(user => user.avatarURL())
                            .catch(() => null)
                        : null,
                ]);
                let locationName = null;
                if (rob.type === Robbery_1.ClashType.Location && rob.locationId != null) {
                    const loc = Locations_1.LocationList[rob.locationId];
                    if (loc) {
                        locationName = loc.Name[Language_1.Language.Portuguese];
                    }
                }
                else if (rob.type === Robbery_1.ClashType.Investment && rob.locationId != null) {
                    const investment = Investments_1.InvestmentList[rob.locationId];
                    if (investment) {
                        locationName = investment.Name[Language_1.Language.Portuguese];
                    }
                }
                return {
                    id: String(rob.id),
                    attackerId: rob.attackerId,
                    defenderId: rob.defenderId ?? null,
                    attacker: attackerUser
                        ? {
                            id: attackerUser.id,
                            nickname: attackerUser.nickname || "(Sem Nick)",
                            avatarUrl: attackAvatarUrl,
                        }
                        : null,
                    defender: defenderUser
                        ? {
                            id: defenderUser.id,
                            nickname: defenderUser.nickname || "(Sem Nick)",
                            avatarUrl: defendAvatarUrl,
                        }
                        : null,
                    locationId: rob.locationId ?? null,
                    locationName,
                    type: rob.type,
                    success: Boolean(rob.success),
                    money: Number(rob.money),
                    createdAt: rob.createdAt instanceof Date ? rob.createdAt.toISOString() : String(rob.createdAt),
                };
            }));
            return {
                entries,
                total,
            };
        },
        hospitalizedUsers: async (_, args, context) => {
            (0, helpers_1.assertAuthenticated)(context);
            const { users, total } = await UserRepository_1.UserRepository.FindHospitalized({
                search: args.search,
                limit: args.limit,
                offset: args.offset,
                sortBy: args.sortBy,
                sortOrder: args.sortOrder,
            });
            const client = (0, client_1.getClient)();
            const entries = users.map(async (user) => {
                let avatarUrl = null;
                try {
                    avatarUrl = (await client.users.fetch(user.id)).avatarURL();
                }
                catch {
                    avatarUrl = null;
                }
                return {
                    id: user.id,
                    nickname: user.nickname || "(Sem Nick)",
                    avatarUrl: avatarUrl,
                    avatarDecoration: formatAvatarDecoration(user.avatarDecoration),
                    class: user.class,
                    hospitalTime: user.hospitalTime instanceof Date ? user.hospitalTime.toISOString() : String(user.hospitalTime),
                    hospitalCount: Number(user.hospitalCount),
                };
            });
            return { entries, total };
        },
        deadUsers: async (_, __, context) => {
            (0, helpers_1.assertAuthenticated)(context);
            const users = await UserRepository_1.UserRepository.FindAllDead();
            const client = (0, client_1.getClient)();
            return Promise.all(users.map(async (user) => {
                let avatarUrl = null;
                try {
                    avatarUrl = (await client.users.fetch(user.id)).avatarURL();
                }
                catch {
                    avatarUrl = null;
                }
                return {
                    id: user.id,
                    nickname: user.nickname || "(Sem Nick)",
                    avatarUrl,
                    avatarDecoration: formatAvatarDecoration(user.avatarDecoration),
                    class: user.class,
                    deadUntil: user.deadUntil instanceof Date ? user.deadUntil.toISOString() : String(user.deadUntil),
                };
            }));
        },
        prisoners: async (_, args, context) => {
            (0, helpers_1.assertAuthenticated)(context);
            const { users, total } = await UserRepository_1.UserRepository.FindPrisoners({
                search: args.search,
                limit: args.limit,
                offset: args.offset,
                sortBy: args.sortBy,
                sortOrder: args.sortOrder,
            });
            const client = (0, client_1.getClient)();
            const entries = users.map(async (user) => {
                let avatarUrl = null;
                try {
                    avatarUrl = (await client.users.fetch(user.id)).avatarURL();
                }
                catch {
                    avatarUrl = null;
                }
                return {
                    id: user.id,
                    nickname: user.nickname || "(Sem Nick)",
                    avatarUrl: avatarUrl,
                    avatarDecoration: formatAvatarDecoration(user.avatarDecoration),
                    class: user.class,
                    prisonTime: user.prisonTime instanceof Date ? user.prisonTime.toISOString() : String(user.prisonTime),
                    robberyFailureCount: Number(user.robberyFailureCount),
                    escapeCount: Number(user.escapeCount),
                };
            });
            return { entries, total };
        },
    },
};
//# sourceMappingURL=users.js.map