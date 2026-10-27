"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const vitest_1 = require("vitest");
const schema_1 = require("#api/graphql/schema");
(0, vitest_1.describe)("GraphQL schema", () => {
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