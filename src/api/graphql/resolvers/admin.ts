import { GraphQLError } from "graphql";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import { AdminAuditActionId } from "#core/types/AdminAuditLog";
import { User } from "#core/models/User";
import { UserRepository } from "#core/repositories/UserRepository";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import { Language } from "#core/models/Language";
import { ItemList } from "#core/types/Items";
import { ItemType } from "#core/types/Items";
import { BundleId } from "#core/types/Ids";
import { ClassList } from "#core/types/Classes";
import { UserBadge } from "#core/models/UserBadge";
import { addHours } from "date-fns";
import { randomBytes } from "node:crypto";
import { logger } from "#shared/log";
import type { GraphQLContext } from "#api/types";
import { formatMoney } from "#bot/utils/ui";
import {
	assertAuthenticated,
	assertCanWrite,
	assertDeveloper,
	recordAdminAction,
	getCooldownValue,
	getActionValue,
	mapUserDetail,
	getCurrentDiscordProfile,
} from "./helpers";
import type { ResolverFn } from "./helpers";

export const adminResolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		adminAuditLogs: async (
			_: unknown,
			args: { limit?: number; offset?: number; actionId?: number | null },
			context: GraphQLContext,
		) => {
			const user = assertAuthenticated(context);
			if (user.role !== "DEVELOPER" && user.role !== "MODERATOR") {
				throw new GraphQLError("Forbidden: Audit log access required.", {
					extensions: { code: "FORBIDDEN" },
				});
			}
			const limit = Math.min(Math.max(Math.trunc(args.limit ?? 25), 1), 100);
			const offset = Math.max(Math.trunc(args.offset ?? 0), 0);
			const page = await AdminAuditLog.GetPage(limit, offset, args.actionId ?? undefined);
			const adminIds = [...new Set(page.entries.map(entry => entry.adminId))];
			const targetUserIds = [...new Set(page.entries.flatMap(entry => entry.targetUserId ? [entry.targetUserId] : []))];
			const discordUserIds = [...new Set([...adminIds, ...targetUserIds])];
			const gameUsers = await Promise.all(targetUserIds.map(async userId => [
				userId,
				await UserRepository.FindById(userId, ["id", "nickname"]),
			] as const));
			const gameUserById = new Map(gameUsers);
			const discordProfiles = await Promise.all(
				discordUserIds.map(async userId => [userId, await getCurrentDiscordProfile(userId)] as const),
			);
			const discordProfileById = new Map(discordProfiles);
			return {
				...page,
				entries: page.entries.map(entry => ({
					...entry,
					adminIpAddress: user.role === "DEVELOPER" ? entry.adminIpAddress : null,
					adminDeviceType: user.role === "DEVELOPER" ? entry.adminDeviceType : null,
					adminOperatingSystem: user.role === "DEVELOPER" ? entry.adminOperatingSystem : null,
					adminBrowser: user.role === "DEVELOPER" ? entry.adminBrowser : null,
					adminName: discordProfileById.get(entry.adminId)?.name ?? entry.adminId,
					adminAvatarUrl: discordProfileById.get(entry.adminId)?.avatarUrl ?? null,
					targetUserName: entry.targetUserId
						? gameUserById.get(entry.targetUserId)?.nickname ?? discordProfileById.get(entry.targetUserId)?.name ?? entry.targetUserId
						: null,
					targetUserAvatarUrl: entry.targetUserId
						? discordProfileById.get(entry.targetUserId)?.avatarUrl ?? null
						: null,
					createdAt: entry.createdAt.toISOString(),
				})),
			};
		},
	},

	Mutation: {
		setMoney: async (
			_: unknown,
			args: { userId: string; amount: number; mode: "ADD" | "SET" },
			context: GraphQLContext,
		) => {
			const admin = assertCanWrite(context);
			if (!Number.isSafeInteger(args.amount)) {
				return { success: false, message: "Money amount must be a safe integer.", user: null };
			}

			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const money = args.mode === "ADD" ? target.Money + args.amount : args.amount;
			if (!Number.isSafeInteger(money)) {
				return { success: false, message: "Updated money must be a safe integer.", user: null };
			}

			const previousMoney = target.Money;
			target.Money = money;
			await target.Update({ money });
			await target.GetInfo();
			await recordAdminAction(admin, AdminAuditActionId.SetMoney, { userId: target.Id }, previousMoney, target.Money);

			return {
				success: true,
				message: `Money successfully updated to ${formatMoney(target.Money, Language.English)} for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		cureUser: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const previousValue = target.Hospital.Time;
			await target.Cure(admin.userId);
			await target.GetInfo();
			await recordAdminAction(admin, AdminAuditActionId.CureUser, { userId: target.Id }, previousValue, target.Hospital.Time);

			return {
				success: true,
				message: `User ${target.Nickname} has been cured from the hospital.`,
				user: mapUserDetail(target),
			};
		},

		freeUser: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const previousValue = {
				prisonTime: target.Prison.Time,
				hasPaidBribe: target.Prison.HasPaidBribe,
				hasTriedEscape: target.Escape.HasTried,
			};
			await target.Free(admin.userId);
			await target.GetInfo();
			await recordAdminAction(
				admin,
				AdminAuditActionId.FreeUser,
				{ userId: target.Id },
				previousValue,
				{
					prisonTime: target.Prison.Time,
					hasPaidBribe: target.Prison.HasPaidBribe,
					hasTriedEscape: target.Escape.HasTried,
				},
			);

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
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const previousValue = getCooldownValue(target, args.cooldown);
			await target.ResetCooldown(args.cooldown, admin.userId);
			await target.GetInfo();
			await recordAdminAction(
				admin,
				AdminAuditActionId.ResetCooldown,
				{ userId: target.Id },
				{ cooldown: args.cooldown, value: previousValue },
				{ cooldown: args.cooldown, value: getCooldownValue(target, args.cooldown) },
			);

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
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const previousValue = getActionValue(target, args.action);
			await target.RemoveAction(args.action, admin.userId);
			await target.GetInfo();
			await recordAdminAction(
				admin,
				AdminAuditActionId.RemoveAction,
				{ userId: target.Id },
				{ action: args.action, value: previousValue },
				{ action: args.action, value: getActionValue(target, args.action) },
			);

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
			const admin = assertCanWrite(context);
			const itemData = ItemList[args.itemId];
			if (!itemData) {
				return { success: false, message: `Item with Id ${args.itemId} was not found.`, user: null };
			}
			if (itemData.Type === ItemType.Consumable && (!Number.isInteger(args.hoursOrQuantity) || args.hoursOrQuantity < 0)) {
				return { success: false, message: "Consumable quantity must be a non-negative integer.", user: null };
			}
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const existingItem = await UserItemRepository.FindByUserAndItem(args.userId, args.itemId);
			const previousValue = existingItem
				? { quantity: existingItem.quantity, remainingTime: existingItem.remainingTime }
				: null;
			const now = new Date();

			if (itemData.Type !== ItemType.Consumable) {
				const newExpiry = addHours(now, args.hoursOrQuantity);
				if (args.mode === "SET") {
					if (existingItem) {
						await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: newExpiry });
					}
					else {
						await UserItemRepository.Create({
							userId: args.userId,
							itemId: args.itemId,
							remainingTime: newExpiry,
							skin: BundleId.Default,
						});
					}
				}
				else {
					const baseDate = existingItem && existingItem.remainingTime > now ? existingItem.remainingTime : now;
					const extendedExpiry = addHours(baseDate, args.hoursOrQuantity);
					if (existingItem) {
						await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: extendedExpiry });
					}
					else {
						await UserItemRepository.Create({
							userId: args.userId,
							itemId: args.itemId,
							remainingTime: extendedExpiry,
							skin: BundleId.Default,
						});
					}
				}
			}
			else if (args.mode === "SET") {
				if (existingItem) {
					await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: args.hoursOrQuantity });
				}
				else {
					await UserItemRepository.Create({
						userId: args.userId,
						itemId: args.itemId,
						quantity: args.hoursOrQuantity,
						skin: BundleId.Default,
					});
				}
			}
			else {
				const newQuantity = (existingItem?.quantity || 0) + args.hoursOrQuantity;
				if (existingItem) {
					await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: newQuantity });
				}
				else {
					await UserItemRepository.Create({
						userId: args.userId,
						itemId: args.itemId,
						quantity: newQuantity,
						skin: BundleId.Default,
					});
				}
			}

			await target.GetInfo();
			const updatedItem = target.Items.find(item => item.Id === args.itemId);
			await recordAdminAction(
				admin,
				AdminAuditActionId.SetItem,
				{ userId: target.Id },
				previousValue,
				updatedItem ? { quantity: updatedItem.Quantity, remainingTime: updatedItem.RemainingTime } : null,
			);
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
			const admin = assertCanWrite(context);
			if (!Number.isSafeInteger(args.amount)) {
				return { success: false, message: "Special coin amount must be a safe integer.", user: null };
			}

			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			if (!Number.isSafeInteger(target.SpecialCoin + args.amount)) {
				return { success: false, message: "Updated special coins must be a safe integer.", user: null };
			}

			const previousValue = target.SpecialCoin;
			await target.AddSpecialCoin(args.amount);
			await target.GetInfo();
			await recordAdminAction(admin, AdminAuditActionId.AddSpecialCoins, { userId: target.Id }, previousValue, target.SpecialCoin);
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
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const previousValue = target.Class;
			await target.SetClass(args.classId);
			await target.GetInfo();
			await recordAdminAction(admin, AdminAuditActionId.SetClass, { userId: target.Id }, previousValue, target.Class);
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
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const previousValue = target.Nickname;
			await target.SetNickname(args.nickname);
			await target.GetInfo();
			await recordAdminAction(admin, AdminAuditActionId.SetNickname, { userId: target.Id }, previousValue, target.Nickname);
			return {
				success: true,
				message: `Nickname changed to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setVip: async (
			_: unknown,
			args: { userId: string; days: number; eternal: boolean },
			context: GraphQLContext,
		) => {
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const wasEternalVip = target.VipEternal;
			const previousValue = { eternal: target.VipEternal, expiresAt: target.VipTime };
			await target.SetEternalVip(args.eternal);
			if (!args.eternal) {
				await target.AddVip(args.days, !wasEternalVip);
			}
			await target.GetInfo();
			await recordAdminAction(
				admin,
				AdminAuditActionId.SetVip,
				{ userId: target.Id },
				previousValue,
				{ eternal: target.VipEternal, expiresAt: target.VipTime },
			);
			return {
				success: true,
				message: args.eternal
					? `Set ${target.Nickname} as an eternal VIP.`
					: `Added ${args.days} days of VIP to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		killUser: async (
			_: unknown,
			args: { userId: string; days: number },
			context: GraphQLContext,
		) => {
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const previousValue = target.DeadUntil;
			const deadUntil = await target.Kill(args.days);
			await target.GetInfo();
			await recordAdminAction(admin, AdminAuditActionId.KillUser, { userId: target.Id }, previousValue, deadUntil);
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
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const previousValue = (await UserBadge.GetList(args.userId)).some(badge => badge.BadgeId === args.badgeId);
			const success = await UserBadge.Create(args.userId, args.badgeId);
			await target.GetInfo();
			if (success) {
				await recordAdminAction(admin, AdminAuditActionId.AddBadge, { userId: target.Id }, previousValue, true);
			}
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
			const admin = assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const previousValue = (await UserBadge.GetList(args.userId)).some(badge => badge.BadgeId === args.badgeId);
			const success = await UserBadge.Delete(args.userId, args.badgeId);
			await target.GetInfo();
			if (success) {
				await recordAdminAction(admin, AdminAuditActionId.RemoveBadge, { userId: target.Id }, previousValue, false);
			}
			return {
				success,
				message: success ? `Badge ${args.badgeId} removed from ${target.Nickname}.` : `Failed to remove badge (not found).`,
				user: mapUserDetail(target),
			};
		},

		swapUsers: async (
			_: unknown,
			args: { firstUserId: string; secondUserId: string },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			if (args.firstUserId === args.secondUserId) {
				return { success: false, message: "Choose two different users.", user: null };
			}

			const [firstUser, secondUser] = await Promise.all([
				UserRepository.FindById(args.firstUserId, ["id", "nickname"]),
				UserRepository.FindById(args.secondUserId, ["id", "nickname"]),
			]);
			if (!firstUser || !secondUser) {
				return { success: false, message: "One or both users were not found.", user: null };
			}

			const previousValue = {
				firstUser: { id: firstUser.id, nickname: firstUser.nickname },
				secondUser: { id: secondUser.id, nickname: secondUser.nickname },
			};
			const temporaryId = `TEMP_${randomBytes(6).toString("hex")}`;
			const updatedTables = await UserRepository.SwapUsers(args.firstUserId, args.secondUserId, temporaryId);
			await recordAdminAction(
				admin,
				AdminAuditActionId.SwapUsers,
				{ userId: firstUser.id },
				previousValue,
				{
					firstUserId: args.secondUserId,
					secondUserId: args.firstUserId,
					updatedTableCount: updatedTables.length,
				},
			);
			logger.info(
				`Developer ${admin.username} (${admin.userId}) swapped users ${firstUser.nickname} (${args.firstUserId}) and ${secondUser.nickname} (${args.secondUserId}).`,
			);

			return {
				success: true,
				message: `Swapped all account data between ${firstUser.nickname} and ${secondUser.nickname}. Updated ${updatedTables.length} table references.`,
				user: null,
			};
		},

		deleteUser: async (
			_: unknown,
			args: { userId: string },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			const target = await UserRepository.FindById(args.userId, ["id", "nickname"]);
			const deleted = await UserRepository.DeleteUser(args.userId);
			if (!deleted) {
				return { success: false, message: "User not found.", user: null };
			}

			await recordAdminAction(
				admin,
				AdminAuditActionId.DeleteUser,
				{ userId: args.userId },
				target ? { id: target.id, nickname: target.nickname } : args.userId,
				null,
			);
			logger.warn(`Developer ${admin.username} (${admin.userId}) deleted user ${args.userId} and all related data.`);
			return {
				success: true,
				message: "User and all related data deleted.",
				user: null,
			};
		},
	},
};