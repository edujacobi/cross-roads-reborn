"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminResolvers = void 0;
const graphql_1 = require("graphql");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const AdminAuditLog_2 = require("#core/types/AdminAuditLog");
const User_1 = require("#core/models/User");
const UserRepository_1 = require("#core/repositories/UserRepository");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const Language_1 = require("#core/models/Language");
const Items_1 = require("#core/types/Items");
const Items_2 = require("#core/types/Items");
const Ids_1 = require("#core/types/Ids");
const Classes_1 = require("#core/types/Classes");
const UserBadge_1 = require("#core/models/UserBadge");
const date_fns_1 = require("date-fns");
const node_crypto_1 = require("node:crypto");
const log_1 = require("#shared/log");
const ui_1 = require("#bot/utils/ui");
const GangRepository_1 = require("#core/repositories/GangRepository");
const helpers_1 = require("./helpers");
exports.adminResolvers = {
    Query: {
        adminAuditLogs: async (_, args, context) => {
            const user = (0, helpers_1.assertAuthenticated)(context);
            if (user.role !== "DEVELOPER" && user.role !== "MODERATOR") {
                throw new graphql_1.GraphQLError("Forbidden: Audit log access required.", {
                    extensions: { code: "FORBIDDEN" },
                });
            }
            const limit = Math.min(Math.max(Math.trunc(args.limit ?? 25), 1), 100);
            const offset = Math.max(Math.trunc(args.offset ?? 0), 0);
            const page = await AdminAuditLog_1.AdminAuditLog.GetPage(limit, offset, args.actionId ?? undefined);
            const adminIds = [...new Set(page.entries.map(entry => entry.adminId))];
            const targetUserIds = [...new Set(page.entries.flatMap(entry => entry.targetUserId ? [entry.targetUserId] : []))];
            const targetGangIds = [...new Set(page.entries.flatMap(entry => entry.targetGangId !== null ? [entry.targetGangId] : []))];
            const discordUserIds = [...new Set([...adminIds, ...targetUserIds])];
            const gameUsers = await Promise.all(targetUserIds.map(async (userId) => [
                userId,
                await UserRepository_1.UserRepository.FindById(userId, ["id", "nickname"]),
            ]));
            const gameUserById = new Map(gameUsers);
            const gangs = await Promise.all(targetGangIds.map(async (gangId) => [
                gangId,
                await GangRepository_1.GangRepository.FindById(gangId, ["id", "name"]),
            ]));
            const gangById = new Map(gangs);
            const discordProfiles = await Promise.all(discordUserIds.map(async (userId) => [userId, await (0, helpers_1.getCurrentDiscordProfile)(userId)]));
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
                    targetGangName: entry.targetGangId === null ? null : gangById.get(entry.targetGangId)?.name ?? null,
                    createdAt: entry.createdAt.toISOString(),
                })),
            };
        },
    },
    Mutation: {
        setMoney: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            if (!Number.isSafeInteger(args.amount)) {
                return { success: false, message: "O valor do dinheiro deve ser um número inteiro válido.", user: null };
            }
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const money = args.mode === "ADD" ? target.Money + args.amount : args.amount;
            if (!Number.isSafeInteger(money)) {
                return { success: false, message: "O dinheiro atualizado deve ser um número inteiro válido.", user: null };
            }
            const previousMoney = target.Money;
            target.Money = money;
            await target.Update({ money });
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.SetMoney, { userId: target.Id }, previousMoney, target.Money);
            return {
                success: true,
                message: `Dinheiro atualizado para ${(0, ui_1.formatMoney)(target.Money, Language_1.Language.Portuguese)} de ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        cureUser: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = target.Hospital.Time;
            await target.Cure(admin.userId);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.CureUser, { userId: target.Id }, previousValue, target.Hospital.Time);
            return {
                success: true,
                message: `Usuário ${target.Nickname} foi curado do hospital.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        freeUser: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = {
                prisonTime: target.Prison.Time,
                hasPaidBribe: target.Prison.HasPaidBribe,
                hasTriedEscape: target.Escape.HasTried,
            };
            await target.Free(admin.userId);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.FreeUser, { userId: target.Id }, previousValue, {
                prisonTime: target.Prison.Time,
                hasPaidBribe: target.Prison.HasPaidBribe,
                hasTriedEscape: target.Escape.HasTried,
            });
            return {
                success: true,
                message: `Usuário ${target.Nickname} foi libertado da prisão.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        resetCooldown: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = (0, helpers_1.getCooldownValue)(target, args.cooldown);
            await target.ResetCooldown(args.cooldown, admin.userId);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.ResetCooldown, { userId: target.Id }, { cooldown: args.cooldown, value: previousValue }, { cooldown: args.cooldown, value: (0, helpers_1.getCooldownValue)(target, args.cooldown) });
            return {
                success: true,
                message: `Cooldown ${args.cooldown} resetado para ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        removeAction: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = (0, helpers_1.getActionValue)(target, args.action);
            await target.RemoveAction(args.action, admin.userId);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.RemoveAction, { userId: target.Id }, { action: args.action, value: previousValue }, { action: args.action, value: (0, helpers_1.getActionValue)(target, args.action) });
            return {
                success: true,
                message: `Ação ${args.action} removida para ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        setItem: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const itemData = Items_1.ItemList[args.itemId];
            if (!itemData) {
                return { success: false, message: `Item com Id ${args.itemId} não encontrado.`, user: null };
            }
            if (itemData.Type === Items_2.ItemType.Consumable && (!Number.isInteger(args.hoursOrQuantity) || args.hoursOrQuantity < 0)) {
                return { success: false, message: "A quantidade do consumível deve ser um número inteiro não negativo.", user: null };
            }
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const existingItem = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(args.userId, args.itemId);
            const previousValue = existingItem
                ? { quantity: existingItem.quantity, remainingTime: existingItem.remainingTime }
                : null;
            const now = new Date();
            if (itemData.Type !== Items_2.ItemType.Consumable) {
                const newExpiry = (0, date_fns_1.addHours)(now, args.hoursOrQuantity);
                if (args.mode === "SET") {
                    if (existingItem) {
                        await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: newExpiry });
                    }
                    else {
                        await UserItemRepository_1.UserItemRepository.Create({
                            userId: args.userId,
                            itemId: args.itemId,
                            remainingTime: newExpiry,
                            skin: Ids_1.BundleId.Default,
                        });
                    }
                }
                else {
                    const baseDate = existingItem && existingItem.remainingTime > now ? existingItem.remainingTime : now;
                    const extendedExpiry = (0, date_fns_1.addHours)(baseDate, args.hoursOrQuantity);
                    if (existingItem) {
                        await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: extendedExpiry });
                    }
                    else {
                        await UserItemRepository_1.UserItemRepository.Create({
                            userId: args.userId,
                            itemId: args.itemId,
                            remainingTime: extendedExpiry,
                            skin: Ids_1.BundleId.Default,
                        });
                    }
                }
            }
            else if (args.mode === "SET") {
                if (existingItem) {
                    await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: args.hoursOrQuantity });
                }
                else {
                    await UserItemRepository_1.UserItemRepository.Create({
                        userId: args.userId,
                        itemId: args.itemId,
                        quantity: args.hoursOrQuantity,
                        skin: Ids_1.BundleId.Default,
                    });
                }
            }
            else {
                const newQuantity = (existingItem?.quantity || 0) + args.hoursOrQuantity;
                if (existingItem) {
                    await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: newQuantity });
                }
                else {
                    await UserItemRepository_1.UserItemRepository.Create({
                        userId: args.userId,
                        itemId: args.itemId,
                        quantity: newQuantity,
                        skin: Ids_1.BundleId.Default,
                    });
                }
            }
            await target.GetInfo();
            const updatedItem = target.Items.find(item => item.Id === args.itemId);
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.SetItem, { userId: target.Id }, previousValue, updatedItem ? { quantity: updatedItem.Quantity, remainingTime: updatedItem.RemainingTime } : null);
            return {
                success: true,
                message: `Item ${itemData.Description[Language_1.Language.Portuguese]} atualizado para ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        addSpecialCoins: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            if (!Number.isSafeInteger(args.amount)) {
                return { success: false, message: "O valor de moedas especiais deve ser um número inteiro válido.", user: null };
            }
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            if (!Number.isSafeInteger(target.SpecialCoin + args.amount)) {
                return { success: false, message: "As moedas especiais atualizadas devem ser um número inteiro válido.", user: null };
            }
            const previousValue = target.SpecialCoin;
            await target.AddSpecialCoin(args.amount);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.AddSpecialCoins, { userId: target.Id }, previousValue, target.SpecialCoin);
            return {
                success: true,
                message: `Adicionado ${args.amount} Moedas Especiais a ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        setClass: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = target.Class;
            await target.SetClass(args.classId);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.SetClass, { userId: target.Id }, previousValue, target.Class);
            const className = Classes_1.ClassList[args.classId]?.Name[Language_1.Language.Portuguese] || "Desconhecido";
            return {
                success: true,
                message: `Classe atualizada para ${className} de ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        setNickname: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = target.Nickname;
            await target.SetNickname(args.nickname);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.SetNickname, { userId: target.Id }, previousValue, target.Nickname);
            return {
                success: true,
                message: `Apelido alterado para ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        setVip: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const wasEternalVip = target.VipEternal;
            const previousValue = { eternal: target.VipEternal, expiresAt: target.VipTime };
            await target.SetEternalVip(args.eternal);
            if (!args.eternal) {
                await target.AddVip(args.days, !wasEternalVip);
            }
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.SetVip, { userId: target.Id }, previousValue, { eternal: target.VipEternal, expiresAt: target.VipTime });
            return {
                success: true,
                message: args.eternal
                    ? `${target.Nickname} foi definido como VIP eterno.`
                    : `Adicionado ${args.days} dias de VIP a ${target.Nickname}.`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        killUser: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = target.DeadUntil;
            const deadUntil = await target.Kill(args.days);
            await target.GetInfo();
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.KillUser, { userId: target.Id }, previousValue, deadUntil);
            return {
                success: true,
                message: `${target.Nickname} foi morto por ${args.days} dias (Morto até ${deadUntil.toISOString()}).`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        addBadge: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = (await UserBadge_1.UserBadge.GetList(args.userId)).some(badge => badge.BadgeId === args.badgeId);
            const success = await UserBadge_1.UserBadge.Create(args.userId, args.badgeId);
            await target.GetInfo();
            if (success) {
                await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.AddBadge, { userId: target.Id }, previousValue, true);
            }
            return {
                success,
                message: success ? `Badge ${args.badgeId} adicionado a ${target.Nickname}.` : `Falha ao adicionar badge (ou já existe).`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        removeBadge: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const target = new User_1.User(args.userId);
            const found = await target.GetInfo();
            if (!found) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            const previousValue = (await UserBadge_1.UserBadge.GetList(args.userId)).some(badge => badge.BadgeId === args.badgeId);
            const success = await UserBadge_1.UserBadge.Delete(args.userId, args.badgeId);
            await target.GetInfo();
            if (success) {
                await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.RemoveBadge, { userId: target.Id }, previousValue, false);
            }
            return {
                success,
                message: success ? `Badge ${args.badgeId} removido de ${target.Nickname}.` : `Falha ao remover badge (não encontrado).`,
                user: (0, helpers_1.mapUserDetail)(target),
            };
        },
        swapUsers: async (_, args, context) => {
            const admin = (0, helpers_1.assertDeveloper)(context);
            if (args.firstUserId === args.secondUserId) {
                return { success: false, message: "Escolha dois usuários diferentes.", user: null };
            }
            const [firstUser, secondUser] = await Promise.all([
                UserRepository_1.UserRepository.FindById(args.firstUserId, ["id", "nickname"]),
                UserRepository_1.UserRepository.FindById(args.secondUserId, ["id", "nickname"]),
            ]);
            if (!firstUser || !secondUser) {
                return { success: false, message: "Um ou ambos os usuários não foram encontrados.", user: null };
            }
            const previousValue = {
                firstUser: { id: firstUser.id, nickname: firstUser.nickname },
                secondUser: { id: secondUser.id, nickname: secondUser.nickname },
            };
            const temporaryId = `TEMP_${(0, node_crypto_1.randomBytes)(6).toString("hex")}`;
            const updatedTables = await UserRepository_1.UserRepository.SwapUsers(args.firstUserId, args.secondUserId, temporaryId);
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.SwapUsers, { userId: firstUser.id }, previousValue, {
                firstUserId: args.secondUserId,
                secondUserId: args.firstUserId,
                updatedTableCount: updatedTables.length,
            });
            log_1.logger.info(`Developer ${admin.username} (${admin.userId}) swapped users ${firstUser.nickname} (${args.firstUserId}) and ${secondUser.nickname} (${args.secondUserId}).`);
            return {
                success: true,
                message: `Todos os dados da conta entre ${firstUser.nickname} e ${secondUser.nickname} foram trocados. ${updatedTables.length} referências de tabela atualizadas.`,
                user: null,
            };
        },
        deleteUser: async (_, args, context) => {
            const admin = (0, helpers_1.assertDeveloper)(context);
            const target = await UserRepository_1.UserRepository.FindById(args.userId, ["id", "nickname"]);
            const deleted = await UserRepository_1.UserRepository.DeleteUser(args.userId);
            if (!deleted) {
                return { success: false, message: "Usuário não encontrado.", user: null };
            }
            await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_2.AdminAuditActionId.DeleteUser, { userId: args.userId }, target ? { id: target.id, nickname: target.nickname } : args.userId, null);
            log_1.logger.warn(`Developer ${admin.username} (${admin.userId}) deleted user ${args.userId} and all related data.`);
            return {
                success: true,
                message: "Usuário e todos os dados relacionados foram excluídos.",
                user: null,
            };
        },
    },
};
//# sourceMappingURL=admin.js.map