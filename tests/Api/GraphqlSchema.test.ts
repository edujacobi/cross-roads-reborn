import { buildSchema, graphql } from "graphql";
import { describe, expect, it } from "vitest";
import { typeDefs } from "#api/graphql/schema";

describe("GraphQL schema", () => {
	it("serializes all money fields above the GraphQL Int limit", async () => {
		const schema = buildSchema(typeDefs);
		const result = await graphql({
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

		expect(result.errors).toBeUndefined();
		expect(result.data).toEqual({
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

	it("accepts setMoney amounts above the GraphQL Int limit", async () => {
		let receivedAmount: number | undefined;
		const result = await graphql({
			schema: buildSchema(typeDefs),
			source: `mutation ($amount: Float!) {
				setMoney(userId: "123", amount: $amount, mode: SET) { success }
			}`,
			variableValues: { amount: 3_085_113_585 },
			rootValue: {
				setMoney: ({ amount }: { amount: number }) => {
					receivedAmount = amount;
					return { success: true };
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data).toEqual({ setMoney: { success: true } });
		expect(receivedAmount).toBe(3_085_113_585);
	});

	it("accepts special coin amounts above the GraphQL Int limit", async () => {
		let receivedAmount: number | undefined;
		const result = await graphql({
			schema: buildSchema(typeDefs),
			source: `mutation ($amount: Float!) {
				addSpecialCoins(userId: "123", amount: $amount) { success }
			}`,
			variableValues: { amount: 3_085_113_585 },
			rootValue: {
				addSpecialCoins: ({ amount }: { amount: number }) => {
					receivedAmount = amount;
					return { success: true };
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data).toEqual({ addSpecialCoins: { success: true } });
		expect(receivedAmount).toBe(3_085_113_585);
	});
});
