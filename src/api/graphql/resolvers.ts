import { GraphQLError } from "graphql";
import { Dashboard } from "#core/models/Dashboard";
import { Vault } from "#core/models/Vault";
import { User } from "#core/models/User";
import { UserRepository } from "#core/repositories/UserRepository";
import { ClassList } from "#core/types/Classes";
import { Language } from "#core/models/Language";
import { ItemList } from "#core/types/Items";
import type { AuthUser, GraphQLContext } from "#api/types";
import { convertHexNumberToString, formatMoney } from "#bot/utils/ui";
import { UserBadge } from "#core/models/UserBadge";
import { getClient } from "#bot/client";
import { InvestmentList } from "#core/types/Investments";
import { GangColor } from "#core/types/GangColors";
import { subMinutes } from "date-fns";

function assertAuthenticated(context: GraphQLContext): AuthUser {
	if (!context.user) {
		throw new GraphQLError("Authentication required to perform this action.", {
			extensions: { code: "UNAUTHORIZED" },
		});
	}
	return context.user;
}

function assertDeveloper(context: GraphQLContext): AuthUser {
	const user = assertAuthenticated(context);
	if (user.role !== "DEVELOPER") {
		throw new GraphQLError("Forbidden: Moderators have read-only access.", {
			extensions: { code: "FORBIDDEN" },
		});
	}
	return user;
}

async function mapUserDetail(user: User) {
	const now = new Date();
	const isInHospital = user.Hospital.Time > now;
	const isInPrison = user.Prison.Time > now;
	const isWorking = user.Job.EndsIn > now && user.Job.Id !== null;
	const isScavenging = user.Scavenge.Time > now && user.Scavenge.IsScavengingId !== null;
	const isWanted = user.Wanted.Time > now;

	const items = (user.Items || []).map((item) => {
		const itemDef = ItemList[item.Id];
		return {
			id: item.Id,
			name: itemDef?.Description?.[user.Language] || itemDef?.Description?.[Language.English] || `Item #${item.Id}`,
			type: item.Type,
			quantity: item.Quantity,
			skin: item.SelectedSkin,
			remainingTime: item.RemainingTime ? item.RemainingTime.toISOString() : null,
		};
	});

	const className = ClassList[user.Class]?.Name?.[Language.Portuguese] || "None";

	const client = getClient();

	// eslint-disable-next-line prefer-const
	let [badges, discordUser, gang] = await Promise.all([
		UserBadge.GetList(user.Id),
		client.users.fetch(user.Id),
		user.GetGang(),
	]);

	if (user.IsVip()) {
		badges = UserBadge.AddVIPBadgeInList(badges, user);
	}

	const badgeList = badges.map(b => {
		return {
			id: b.BadgeId,
			name: b.Name,
			description: b.Description,
		};
	});

	let investment = null;

	if (user.Investment.Id) {
		const investInfo = InvestmentList[user.Investment.Id];
		investment = {
			id: user.Investment.Id,
			name: investInfo.Name[Language.Portuguese],
			expiresAt: user.Investment.ExpiresAt?.toISOString(),
			defense: investInfo.BaseDefense,
			nextPaymentValue: formatMoney(user.Investment.AccumulatedYield, Language.Portuguese),
			henchmanEndsAt: user.Investment.HenchmanEndsAt?.toISOString(),
		};
	}

	let gangInfo = null;

	if (gang) {
		const roleText = gang.Members.find(member => member.UserId === user.Id)!.RoleName;

		gangInfo = {
			id: gang.Id,
			name: gang.Name,
			level: gang.Level,
			role: roleText,
			imageUrl: gang.Image,
			color: convertHexNumberToString(GangColor[gang.Color].Color),
		};
	}

	const lastCommand = client.userLastCommand.get(user.Id) || 0;
	const isOnline = new Date(lastCommand) > subMinutes(new Date(), 15);

	return {
		id: user.Id,
		nickname: user.Nickname,
		online: isOnline,
		money: user.Money,
		avatarUrl: discordUser.avatarURL(),
		avatarDecoration: user.AvatarDecoration.Description[Language.English].toLowerCase().replaceAll(" ", "_"),
		specialCoin: user.SpecialCoin,
		gang: gangInfo,
		class: user.Class,
		className,
		attack: user.Attributes.Attack,
		defense: user.Attributes.Defense,
		isVip: user.IsVip(),
		vipEternal: user.VipEternal,
		vipTime: user.VipTime ? user.VipTime.toISOString() : null,
		language: user.Language,
		isInHospital,
		hospitalTime: isInHospital ? user.Hospital.Time.toISOString() : null,
		isInPrison,
		prisonTime: isInPrison ? user.Prison.Time.toISOString() : null,
		isWorking,
		jobEndsIn: isWorking ? user.Job.EndsIn.toISOString() : null,
		isScavenging,
		isWanted,
		isInCasino: user.Casino.IsInGame,
		investment: investment,
		situationId: user.Situation.Id,
		situationText: user.Situation.ComplexUI,
		items,
		dailyStreak: user.Daily.CurrentStreak,
		voteCount: user.Vote.Count,
		badges: badgeList,
		createdAt: user.CreatedAt.toISOString(),
		updatedAt: user.UpdatedAt.toISOString(),
	};
}

// eslint-disable-next-line
export type ResolverFn = (_: unknown, args: any, context: GraphQLContext) => Promise<any> | any;

export const resolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		me: (_: unknown, __: unknown, context: GraphQLContext) => {
			return context.user;
		},

		dashboardStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
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
			assertAuthenticated(context);
			const history = await Dashboard.GetLast30Days();
			return history.map((snapshot) => ({
				id: (snapshot as { id?: number }).id || null,
				date: snapshot.date instanceof Date ? snapshot.date.toISOString() : String(snapshot.date),
				totalPlayers: snapshot.totalPlayers,
				allUsers: snapshot.allUsers,
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

		users: async (
			_: unknown,
			args: { search?: string; limit?: number; offset?: number },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			const { users, total } = await UserRepository.SearchUsers({
				search: args.search,
				limit: args.limit,
				offset: args.offset,
			});

			const client = getClient();

			const mappedUsers = users.map(async (u) => {
				const user = await new User(u.id).GetSimpleInfo(u);

				if (!user) {
					return;
				}

				const [, isDev, isMod, isHelper] = await Promise.all([
					user.GetSituation(),
					UserBadge.IsDeveloper(user.Id),
					UserBadge.IsModerator(user.Id),
					UserBadge.IsHelper(user.Id),
				]);

				let avatarUrl: string | null;

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
					class: user.Class,
					isVip: user.IsVip(),
					vipEternal: user.VipEternal,
					situationId: user.Situation.Id,
					createdAt: user.CreatedAt.toISOString(),
					updatedAt: user.UpdatedAt.toISOString(),
					isDeveloper: isDev,
					isModerator: isMod,
					isHelper: isHelper,
				};
			});

			return {
				users: mappedUsers,
				total,
			};
		},

		user: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
			assertAuthenticated(context);
			const user = new User(args.id);
			const found = await user.GetInfo(undefined, Language.Portuguese);
			if (!found) {
				return null;
			}
			return mapUserDetail(user);
		},
	},

	Mutation: {
		setMoney: async (
			_: unknown,
			args: { userId: string; amount: number; mode: "ADD" | "SET" },
			context: GraphQLContext,
		) => {
			assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			if (args.mode === "ADD") {
				target.Money += args.amount;
			}
			else {
				target.Money = args.amount;
			}

			await target.Update({ money: target.Money });
			await target.GetInfo();

			return {
				success: true,
				message: `Money successfully updated to ${formatMoney(target.Money, Language.English)} for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		cureUser: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.Cure(admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `User ${target.Nickname} has been cured from the hospital.`,
				user: mapUserDetail(target),
			};
		},

		freeUser: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.Free(admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `User ${target.Nickname} has been freed from prison.`,
				user: mapUserDetail(target),
			};
		},

		resetCooldown: async (
			_: unknown,
			args: { userId: string; cooldown: string },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.ResetCooldown(args.cooldown, admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `Cooldown ${args.cooldown} reset for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		removeAction: async (
			_: unknown,
			args: { userId: string; action: string },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.RemoveAction(args.action, admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `Action ${args.action} removed for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setItem: async (
			_: unknown,
			args: { userId: string; itemId: number; mode: "ADD" | "SET"; hoursOrQuantity: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const itemData = ItemList[args.itemId];
			if (!itemData) {
				return { success: false, message: `Item with Id ${args.itemId} was not found.`, user: null };
			}
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const existingItem = await UserItemRepository.FindByUserAndItem(args.userId, args.itemId);
			const now = new Date();

			if (itemData.Type !== ItemType.Consumable) {
				const newExpiry = addHours(now, args.hoursOrQuantity);
				if (args.mode === "SET") {
					if (existingItem) {
						await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: newExpiry });
					} else {
						await UserItemRepository.Create({ userId: args.userId, itemId: args.itemId, remainingTime: newExpiry, skin: BundleId.Default });
					}
				} else {
					const baseDate = existingItem && existingItem.remainingTime > now ? existingItem.remainingTime : now;
					const extendedExpiry = addHours(baseDate, args.hoursOrQuantity);
					if (existingItem) {
						await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: extendedExpiry });
					} else {
						await UserItemRepository.Create({ userId: args.userId, itemId: args.itemId, remainingTime: extendedExpiry, skin: BundleId.Default });
					}
				}
			} else if (args.mode === "SET") {
				if (existingItem) {
					await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: args.hoursOrQuantity });
				} else {
					await UserItemRepository.Create({ userId: args.userId, itemId: args.itemId, quantity: args.hoursOrQuantity, skin: BundleId.Default });
				}
			} else {
				const newQuantity = (existingItem?.quantity || 0) + args.hoursOrQuantity;
				if (existingItem) {
					await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: newQuantity });
				} else {
					await UserItemRepository.Create({ userId: args.userId, itemId: args.itemId, quantity: newQuantity, skin: BundleId.Default });
				}
			}

			await target.GetInfo();
			return {
				success: true,
				message: `Item ${itemData.Description[Language.English]} updated for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		addSpecialCoins: async (
			_: unknown,
			args: { userId: string; amount: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			await target.AddSpecialCoin(args.amount);
			await target.GetInfo();
			return {
				success: true,
				message: `Added ${args.amount} Special Coins to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setClass: async (
			_: unknown,
			args: { userId: string; classId: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			await target.SetClass(args.classId);
			await target.GetInfo();
			const className = ClassList[args.classId]?.Name[Language.English] || "Unknown";
			return {
				success: true,
				message: `Class updated to ${className} for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setNickname: async (
			_: unknown,
			args: { userId: string; nickname: string },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			await target.SetNickname(args.nickname);
			await target.GetInfo();
			return {
				success: true,
				message: `Nickname changed to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setVip: async (
			_: unknown,
			args: { userId: string; days: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			await target.AddVip(args.days);
			await target.GetInfo();
			return {
				success: true,
				message: `Added ${args.days} days of VIP to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		killUser: async (
			_: unknown,
			args: { userId: string; days: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const deadUntil = await target.Kill(args.days);
			await target.GetInfo();
			return {
				success: true,
				message: `Killed ${target.Nickname} for ${args.days} days (Dead until ${deadUntil.toISOString()}).`,
				user: mapUserDetail(target),
			};
		},

		addBadge: async (
			_: unknown,
			args: { userId: string; badgeId: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const success = await UserBadge.Create(args.userId, args.badgeId);
			await target.GetInfo();
			return {
				success,
				message: success ? `Badge ${args.badgeId} added to ${target.Nickname}.` : `Failed to add badge (or already exists).`,
				user: mapUserDetail(target),
			};
		},

		removeBadge: async (
			_: unknown,
			args: { userId: string; badgeId: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const success = await UserBadge.Delete(args.userId, args.badgeId);
			await target.GetInfo();
			return {
				success,
				message: success ? `Badge ${args.badgeId} removed from ${target.Nickname}.` : `Failed to remove badge (not found).`,
				user: mapUserDetail(target),
			};
		},
	},
};
