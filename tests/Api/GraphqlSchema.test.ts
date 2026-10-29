import { buildSchema, graphql } from "graphql";
import { createSchema } from "graphql-yoga";
import { describe, expect, it, vi } from "vitest";
import { typeDefs } from "#api/graphql/schema";
import { resolvers } from "#api/graphql/resolvers";
import { GangRepository } from "#core/repositories/GangRepository";
import { GangBaseId } from "#core/types/GangBases";
import { GangColorId } from "#core/types/GangColors";
import { GangRecruitmentType } from "#core/types/GangRecruitment";

describe("GraphQL schema", () => {
	it("routes gang recruitment queries to their authenticated resolvers", async () => {
		const schema = createSchema({ typeDefs, resolvers });

		for (const name of [
			"gangRecruitmentBoard",
			"myActiveGangJoinRequest",
			"myGangJoinRequestsHistory",
			"gangJoinRequests",
		]) {
			const resolve = schema.getQueryType()?.getFields()[name].resolve;
			expect(resolve).toBeDefined();
			await expect(resolve!(null, {}, { user: null }, undefined!))
				.rejects.toThrow("Autenticação necessária para realizar esta ação.");
		}
	});

	it("returns paginated, available gangs using the web board data contract", async () => {
		const gang = {
			id: 2,
			name: "Gang 2",
			acronym: "G2",
			description: "Description",
			level: 1,
			image: null,
			color: GangColorId.Blue,
			baseId: GangBaseId.Bunker,
			recruitmentType: GangRecruitmentType.Open,
			membersCount: 2,
		};
		const findGangs = vi.spyOn(GangRepository, "FindRecruitingGangs").mockResolvedValue({
			entries: [gang],
			total: 1,
		});

		try {
			const result = await resolvers.Query.gangRecruitmentBoard(
				null,
				{ limit: 1, offset: 0, sortBy: "membersCount", sortOrder: "DESC" },
				{ user: { userId: "player", username: "Player", avatar: null, role: "PLAYER", situationId: 0 } },
			);

			expect(result).toEqual({
				total: 1,
				entries: [
					expect.objectContaining({
						id: "2",
						color: "#448AFF",
						baseId: GangBaseId.Bunker,
						membersCount: 2,
						maxMembers: 11,
						recruitmentType: "OPEN",
					}),
				],
			});
			expect(findGangs).toHaveBeenCalledWith(undefined, undefined, "membersCount", "DESC", 1, 0);
		}
		finally {
			findGangs.mockRestore();
		}
	});

	it("accepts vault balances above the GraphQL Int limit", async () => {
		let received: { vault: string; amount: number } | undefined;
		const result = await graphql({
			schema: buildSchema(typeDefs),
			source: `mutation ($vault: VaultType!, $amount: Float!) {
				setVaultBalance(vault: $vault, amount: $amount) { success }
			}`,
			variableValues: { vault: "BANK", amount: 3_085_113_585 },
			rootValue: {
				setVaultBalance: (args: { vault: string; amount: number }) => {
					received = args;
					return { success: true };
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(received).toEqual({ vault: "BANK", amount: 3_085_113_585 });
	});

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
