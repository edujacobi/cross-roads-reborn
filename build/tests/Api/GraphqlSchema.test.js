"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_yoga_1 = require("graphql-yoga");
const vitest_1 = require("vitest");
const client_1 = require("#bot/client");
const schema_1 = require("#api/graphql/schema");
const resolvers_1 = require("#api/graphql/resolvers");
const Gang_1 = require("#core/models/Gang");
const GangRepository_1 = require("#core/repositories/GangRepository");
const GangMemberRepository_1 = require("#core/repositories/GangMemberRepository");
const GangRoleRepository_1 = require("#core/repositories/GangRoleRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const GangBases_1 = require("#core/types/GangBases");
const GangColors_1 = require("#core/types/GangColors");
const GangRecruitment_1 = require("#core/types/GangRecruitment");
const Heist_1 = require("#core/types/Heist");
(0, vitest_1.describe)("GraphQL schema", () => {
    (0, vitest_1.it)("routes gang recruitment queries to their authenticated resolvers", async () => {
        const schema = (0, graphql_yoga_1.createSchema)({ typeDefs: schema_1.typeDefs, resolvers: resolvers_1.resolvers });
        for (const name of [
            "gangRecruitmentBoard",
            "myActiveGangJoinRequest",
            "myGangJoinRequestsHistory",
            "gangJoinRequests",
        ]) {
            const resolve = schema.getQueryType()?.getFields()[name].resolve;
            (0, vitest_1.expect)(resolve).toBeDefined();
            await (0, vitest_1.expect)(resolve(null, {}, { user: null }, undefined))
                .rejects.toThrow("Autenticação necessária para realizar esta ação.");
        }
    });
    (0, vitest_1.it)("returns paginated, available gangs using the web board data contract", async () => {
        const gang = {
            id: 2,
            name: "Gang 2",
            acronym: "G2",
            description: "Description",
            level: 1,
            image: null,
            color: GangColors_1.GangColorId.Blue,
            baseId: GangBases_1.GangBaseId.Bunker,
            recruitmentType: GangRecruitment_1.GangRecruitmentType.Open,
            membersCount: 2,
        };
        const findGangs = vitest_1.vi.spyOn(GangRepository_1.GangRepository, "FindRecruitingGangs").mockResolvedValue({
            entries: [gang],
            total: 1,
        });
        try {
            const result = await resolvers_1.resolvers.Query.gangRecruitmentBoard(null, { limit: 1, offset: 0, sortBy: "membersCount", sortOrder: "DESC" }, { user: { userId: "player", username: "Player", avatar: null, role: "PLAYER", situationId: 0 } });
            (0, vitest_1.expect)(result).toEqual({
                total: 1,
                entries: [
                    vitest_1.expect.objectContaining({
                        id: "2",
                        color: "#448AFF",
                        baseId: GangBases_1.GangBaseId.Bunker,
                        membersCount: 2,
                        maxMembers: 11,
                        recruitmentType: "OPEN",
                    }),
                ],
            });
            (0, vitest_1.expect)(findGangs).toHaveBeenCalledWith(undefined, undefined, "membersCount", "DESC", 1, 0);
        }
        finally {
            findGangs.mockRestore();
        }
    });
    (0, vitest_1.it)("only returns gang deposit details to members and developers", async () => {
        const depositTime = new Date("2026-10-30T12:00:00.000Z");
        const client = (0, client_1.setClient)();
        vitest_1.vi.spyOn(client.users, "fetch").mockResolvedValue({ avatarURL: () => null });
        vitest_1.vi.spyOn(GangRepository_1.GangRepository, "FindById").mockResolvedValue({
            id: 1,
            name: "Gang",
            acronym: "GNG",
            description: "Description",
            money: 0,
            level: 1,
            experience: 0,
            color: GangColors_1.GangColorId.Blue,
            baseId: GangBases_1.GangBaseId.None,
            leaderId: "leader",
            recruitmentType: GangRecruitment_1.GangRecruitmentType.Disabled,
            image: null,
            shipmentArrivesAt: null,
            lastShipmentSuccess: null,
            lastShipmentCancelled: null,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        vitest_1.vi.spyOn(GangMemberRepository_1.GangMemberRepository, "FindAllByGang").mockResolvedValue([
            { userId: "member", roleId: 1, depositAmount: 2_500, depositTime },
        ]);
        vitest_1.vi.spyOn(GangRoleRepository_1.GangRoleRepository, "FindAllByGangId").mockResolvedValue([
            {
                id: 1,
                name: "Member",
                canInvite: false,
                canKick: false,
                canPromote: false,
                canEditGang: false,
                canImportShipments: false,
            },
        ]);
        vitest_1.vi.spyOn(UserRepository_1.UserRepository, "FindById").mockImplementation(async (id) => ({
            id,
            nickname: id,
            money: 1_000,
            avatarDecoration: 0,
            backgroundDecoration: 0,
        }));
        const getGang = (userId, role) => resolvers_1.resolvers.Query.gang(null, { id: "1" }, {
            user: { userId, username: userId, avatar: null, role, situationId: 0 },
        });
        try {
            const outsider = await getGang("outsider", "PLAYER");
            const member = await getGang("member", "PLAYER");
            const developer = await getGang("developer", "DEVELOPER");
            (0, vitest_1.expect)(outsider.heistTarget).toBe((0, Heist_1.getWeeklyTarget)().VaultType.toUpperCase());
            (0, vitest_1.expect)(outsider.members[0]).toMatchObject({
                depositAmount: 0,
                depositTime: null,
                lastDepositAt: null,
            });
            for (const result of [member, developer]) {
                (0, vitest_1.expect)(result.members[0]).toMatchObject({
                    depositAmount: 2_500,
                    depositTime: depositTime.toISOString(),
                    lastDepositAt: new Date(depositTime.getTime() - Gang_1.Gang.TIME_BETWEEN_DEPOSITS * 3_600_000).toISOString(),
                });
            }
        }
        finally {
            vitest_1.vi.restoreAllMocks();
            client.destroy();
        }
    });
    (0, vitest_1.it)("accepts vault balances above the GraphQL Int limit", async () => {
        let received;
        const result = await (0, graphql_1.graphql)({
            schema: (0, graphql_1.buildSchema)(schema_1.typeDefs),
            source: `mutation ($vault: VaultType!, $amount: Float!) {
				setVaultBalance(vault: $vault, amount: $amount) { success }
			}`,
            variableValues: { vault: "BANK", amount: 3_085_113_585 },
            rootValue: {
                setVaultBalance: (args) => {
                    received = args;
                    return { success: true };
                },
            },
        });
        (0, vitest_1.expect)(result.errors).toBeUndefined();
        (0, vitest_1.expect)(received).toEqual({ vault: "BANK", amount: 3_085_113_585 });
    });
    (0, vitest_1.it)("serializes all money fields above the GraphQL Int limit", async () => {
        const schema = (0, graphql_1.buildSchema)(schema_1.typeDefs);
        const result = await (0, graphql_1.graphql)({
            schema,
            source: `{
				dashboardStats { bankVaultValue casinoVaultValue }
				user(id: "123") {
					money
					specialCoin
					activityStats {
						hospitalTreatmentSum
						prisonBriberySum
						robberySuccessRobbedSum
						robberyBeingRobbedSum
						casinoWinSum
						casinoLoseSum
						almsReceivedSum
						almsGivenSum
						jobReceivedSum
						investmentProfit
						shopSpentSum
					}
				}
			}`,
            rootValue: {
                dashboardStats: { bankVaultValue: 3_085_113_585, casinoVaultValue: 3_085_113_585 },
                user: {
                    money: 3_085_113_585,
                    specialCoin: 3_085_113_585,
                    activityStats: {
                        hospitalTreatmentSum: 3_085_113_585,
                        prisonBriberySum: 3_085_113_585,
                        robberySuccessRobbedSum: 3_085_113_585,
                        robberyBeingRobbedSum: 3_085_113_585,
                        casinoWinSum: 3_085_113_585,
                        casinoLoseSum: 3_085_113_585,
                        almsReceivedSum: 3_085_113_585,
                        almsGivenSum: 3_085_113_585,
                        jobReceivedSum: 3_085_113_585,
                        investmentProfit: 3_085_113_585,
                        shopSpentSum: 3_085_113_585,
                    },
                },
            },
        });
        (0, vitest_1.expect)(result.errors).toBeUndefined();
        (0, vitest_1.expect)(result.data).toEqual({
            dashboardStats: { bankVaultValue: 3_085_113_585, casinoVaultValue: 3_085_113_585 },
            user: {
                money: 3_085_113_585,
                specialCoin: 3_085_113_585,
                activityStats: {
                    hospitalTreatmentSum: 3_085_113_585,
                    prisonBriberySum: 3_085_113_585,
                    robberySuccessRobbedSum: 3_085_113_585,
                    robberyBeingRobbedSum: 3_085_113_585,
                    casinoWinSum: 3_085_113_585,
                    casinoLoseSum: 3_085_113_585,
                    almsReceivedSum: 3_085_113_585,
                    almsGivenSum: 3_085_113_585,
                    jobReceivedSum: 3_085_113_585,
                    investmentProfit: 3_085_113_585,
                    shopSpentSum: 3_085_113_585,
                },
            },
        });
    });
    (0, vitest_1.it)("accepts setMoney amounts above the GraphQL Int limit", async () => {
        let receivedAmount;
        const result = await (0, graphql_1.graphql)({
            schema: (0, graphql_1.buildSchema)(schema_1.typeDefs),
            source: `mutation ($amount: Float!) {
				setMoney(userId: "123", amount: $amount, mode: SET) { success }
			}`,
            variableValues: { amount: 3_085_113_585 },
            rootValue: {
                setMoney: ({ amount }) => {
                    receivedAmount = amount;
                    return { success: true };
                },
            },
        });
        (0, vitest_1.expect)(result.errors).toBeUndefined();
        (0, vitest_1.expect)(result.data).toEqual({ setMoney: { success: true } });
        (0, vitest_1.expect)(receivedAmount).toBe(3_085_113_585);
    });
    (0, vitest_1.it)("accepts special coin amounts above the GraphQL Int limit", async () => {
        let receivedAmount;
        const result = await (0, graphql_1.graphql)({
            schema: (0, graphql_1.buildSchema)(schema_1.typeDefs),
            source: `mutation ($amount: Float!) {
				addSpecialCoins(userId: "123", amount: $amount) { success }
			}`,
            variableValues: { amount: 3_085_113_585 },
            rootValue: {
                addSpecialCoins: ({ amount }) => {
                    receivedAmount = amount;
                    return { success: true };
                },
            },
        });
        (0, vitest_1.expect)(result.errors).toBeUndefined();
        (0, vitest_1.expect)(result.data).toEqual({ addSpecialCoins: { success: true } });
        (0, vitest_1.expect)(receivedAmount).toBe(3_085_113_585);
    });
});
//# sourceMappingURL=GraphqlSchema.test.js.map