"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gangResolvers = void 0;
const GangRoleRepository_1 = require("#core/repositories/GangRoleRepository");
const GangJoinRequestsRepository_1 = require("#core/repositories/GangJoinRequestsRepository");
const GangRecruitment_1 = require("#core/types/GangRecruitment");
const GangMemberRepository_1 = require("#core/repositories/GangMemberRepository");
const GangRepository_1 = require("#core/repositories/GangRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const AvatarDecorations_1 = require("#core/types/AvatarDecorations");
const BackgroundDecorations_1 = require("#core/types/BackgroundDecorations");
const Language_1 = require("#core/models/Language");
const Gang_1 = require("#core/models/Gang");
const User_1 = require("#core/models/User");
const GangBases_1 = require("#core/types/GangBases");
const GangColors_1 = require("#core/types/GangColors");
const Heist_1 = require("#core/types/Heist");
const ui_1 = require("#bot/utils/ui");
const client_1 = require("#bot/client");
const helpers_1 = require("./helpers");
const discord_js_1 = require("discord.js");
const log_1 = require("#shared/log");
const AdminAuditLog_1 = require("#core/types/AdminAuditLog");
const gangRecruitmentTypes = {
    DISABLED: GangRecruitment_1.GangRecruitmentType.Disabled,
    APPROVAL: GangRecruitment_1.GangRecruitmentType.Approval,
    OPEN: GangRecruitment_1.GangRecruitmentType.Open,
};
function getGangRolePermissions(args) {
    return [
        args.canInvite ? Gang_1.GangPermission.Invite : null,
        args.canKick ? Gang_1.GangPermission.Kick : null,
        args.canPromote ? Gang_1.GangPermission.Promote : null,
        args.canEditGang ? Gang_1.GangPermission.EditGang : null,
        args.canImport ? Gang_1.GangPermission.ImportShipments : null,
    ].filter((permission) => permission !== null);
}
exports.gangResolvers = {
    Query: {
        topGangs: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const limit = args.limit ?? 15;
            const offset = args.offset ?? 0;
            if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
                throw new Error("Invalid ranking pagination.");
            }
            const [gangs, total, member] = await Promise.all([
                GangRepository_1.GangRepository.FindTopGangs(limit, offset),
                GangRepository_1.GangRepository.CountAllGangs(),
                GangMemberRepository_1.GangMemberRepository.FindByUserId(authUser.userId),
            ]);
            const [memberRole, userGang] = await Promise.all([
                member ? GangRoleRepository_1.GangRoleRepository.FindById(member.roleId) : null,
                member ? GangRepository_1.GangRepository.FindById(member.gangId) : null,
            ]);
            const currentUserGangId = member?.gangId ?? null;
            return {
                total,
                currentUserGangId,
                currentUserGangName: userGang?.name ?? null,
                currentUserGangColor: userGang ? (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[userGang.color].Color) : null,
                entries: gangs.map(gang => ({
                    id: gang.id,
                    name: gang.name,
                    acronym: gang.acronym.toUpperCase(),
                    imageUrl: gang.image,
                    level: gang.level,
                    experience: gang.experience,
                    color: (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[gang.color].Color),
                    memberRole: gang.id === currentUserGangId ? memberRole?.name ?? "???" : null,
                })),
            };
        },
        gang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gang = await GangRepository_1.GangRepository.FindById(Number(args.id));
            if (!gang) {
                return null;
            }
            const xpForNextLevel = gang.level < 10 ? Gang_1.Gang.GetXpForNextLevel(gang.level) : gang.experience;
            const baseConfig = GangBases_1.GangBases[gang.baseId ?? GangBases_1.GangBaseId.None];
            const [members, roles, leader] = await Promise.all([
                GangMemberRepository_1.GangMemberRepository.FindAllByGang(gang.id),
                GangRoleRepository_1.GangRoleRepository.FindAllByGangId(gang.id),
                UserRepository_1.UserRepository.FindById(gang.leaderId, ["id", "nickname"]),
            ]);
            const currentUser = await UserRepository_1.UserRepository.FindById(authUser.userId, ["money"]);
            const importState = new Gang_1.Gang();
            importState.Level = gang.level;
            importState.BaseId = gang.baseId ?? GangBases_1.GangBaseId.None;
            importState.Money = gang.money;
            importState.ImportArrivesAt = gang.shipmentArrivesAt;
            importState.LastImportSuccess = gang.lastShipmentSuccess;
            importState.LastImportCancelled = gang.lastShipmentCancelled;
            const canStartImport = (await importState.CanStartImport()).can;
            const canViewGangPrivateInfo = authUser.role === "DEVELOPER"
                || gang.leaderId === authUser.userId
                || members.some(member => member.userId === authUser.userId);
            const canViewShipmentInfo = canViewGangPrivateInfo;
            const canImport = gang.leaderId === authUser.userId || members.some(member => member.userId === authUser.userId
                && roles.some(role => role.id === member.roleId && role.canImportShipments));
            const client = (0, client_1.getClient)();
            const memberDetails = await Promise.all(members.map(async (member) => {
                let avatarUrl = null;
                try {
                    avatarUrl = (await client.users.fetch(member.userId)).avatarURL();
                }
                catch {
                    avatarUrl = null;
                }
                const role = roles.find(r => r.id === member.roleId);
                const user = await UserRepository_1.UserRepository.FindById(member.userId, ["id", "nickname", "avatarDecoration", "backgroundDecoration"]);
                let permCount = 0;
                if (role) {
                    if (role.canInvite)
                        permCount++;
                    if (role.canKick)
                        permCount++;
                    if (role.canPromote)
                        permCount++;
                    if (role.canEditGang)
                        permCount++;
                    if (role.canImportShipments)
                        permCount++;
                }
                return {
                    userId: member.userId,
                    nickname: user?.nickname ?? member.userId,
                    avatarUrl,
                    avatarDecoration: AvatarDecorations_1.AvatarDecorationList[user?.avatarDecoration ?? 0].Description[Language_1.Language.English].toLowerCase().replaceAll(" ", "_"),
                    backgroundDecoration: BackgroundDecorations_1.BackgroundDecorationList[user?.backgroundDecoration ?? 0].Description[Language_1.Language.English].toLowerCase().replaceAll(" ", "_"),
                    roleId: member.roleId,
                    roleName: role?.name ?? "Unknown",
                    permissionCount: permCount,
                    depositAmount: canViewGangPrivateInfo ? member.depositAmount : 0,
                    depositTime: canViewGangPrivateInfo ? member.depositTime?.toISOString() ?? null : null,
                    lastDepositAt: canViewGangPrivateInfo && member.depositAmount > 0 && member.depositTime
                        ? new Date(member.depositTime.getTime() - Gang_1.Gang.TIME_BETWEEN_DEPOSITS * 60 * 60 * 1_000).toISOString()
                        : null,
                };
            }));
            return {
                id: gang.id,
                name: gang.name,
                acronym: gang.acronym.toUpperCase(),
                description: gang.description ?? "",
                money: gang.money,
                maxDepositAmount: Math.min(currentUser?.money ?? 0, Gang_1.Gang.MAX_DEPOSIT_PER_DAY * gang.level),
                level: gang.level,
                experience: gang.experience,
                xpForNextLevel,
                color: (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[gang.color].Color),
                imageUrl: gang.image,
                base: gang.baseId && gang.baseId !== GangBases_1.GangBaseId.None
                    ? {
                        id: gang.baseId,
                        name: baseConfig.Name[Language_1.Language.Portuguese],
                        modifierDefense: baseConfig.Modifier.Defense?.Positive ?? baseConfig.Modifier.Defense?.Negative ?? null,
                        modifierAttack: baseConfig.Modifier.Attack?.Positive ?? baseConfig.Modifier.Attack?.Negative ?? null,
                        modifierPrisonEscape: baseConfig.Modifier.PrisonEscape?.Positive ?? baseConfig.Modifier.PrisonEscape?.Negative ?? null,
                    }
                    : null,
                shipmentStartedAt: canViewShipmentInfo && gang.shipmentArrivesAt
                    ? new Date(gang.shipmentArrivesAt.getTime() - Gang_1.Gang.IMPORT_WAIT_HOURS * 3_600_000).toISOString()
                    : null,
                shipmentArrivesAt: canViewShipmentInfo ? gang.shipmentArrivesAt?.toISOString() ?? null : null,
                importCost: canViewShipmentInfo ? importState.GetImportCost() : null,
                importSuccessChance: canViewShipmentInfo ? importState.GetImportSuccessChance() : null,
                canImport,
                canStartImport: canViewShipmentInfo ? canStartImport : null,
                canViewShipmentInfo,
                heistTarget: (0, Heist_1.getWeeklyTarget)().VaultType.toUpperCase(),
                leaderId: gang.leaderId,
                leaderNickname: leader?.nickname ?? null,
                leaderAvatarUrl: null,
                members: memberDetails,
                roles: roles.map(role => ({
                    id: role.id,
                    name: role.name,
                    canInvite: role.canInvite ?? false,
                    canKick: role.canKick ?? false,
                    canPromote: role.canPromote ?? false,
                    canEditGang: role.canEditGang ?? false,
                    canImport: role.canImportShipments ?? false,
                })),
                recruitmentType: gang.recruitmentType === GangRecruitment_1.GangRecruitmentType.Open ? "OPEN" : gang.recruitmentType === GangRecruitment_1.GangRecruitmentType.Approval ? "APPROVAL" : "DISABLED",
                createdAt: gang.createdAt.toISOString(),
            };
        },
        gangRecruitmentBoard: async (_, args, context) => {
            (0, helpers_1.assertAuthenticated)(context);
            const limit = args.limit ?? 25;
            const offset = args.offset ?? 0;
            if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0) {
                throw new Error("Invalid recruitment board pagination.");
            }
            let filterType;
            if (args.type === "APPROVAL") {
                filterType = GangRecruitment_1.GangRecruitmentType.Approval;
            }
            else if (args.type === "OPEN") {
                filterType = GangRecruitment_1.GangRecruitmentType.Open;
            }
            else if (args.type === "DISABLED") {
                filterType = GangRecruitment_1.GangRecruitmentType.Disabled;
            }
            const page = await GangRepository_1.GangRepository.FindRecruitingGangs(filterType, args.search, args.sortBy, args.sortOrder, limit, offset);
            return {
                total: page.total,
                entries: page.entries.map((gang) => {
                    const base = GangBases_1.GangBases[gang.baseId] ?? GangBases_1.GangBases[GangBases_1.GangBaseId.None];
                    return {
                        id: gang.id.toString(),
                        name: gang.name,
                        acronym: gang.acronym,
                        description: gang.description,
                        level: gang.level,
                        joinCost: Gang_1.Gang.GetJoinCostForLevel(gang.level),
                        image: gang.image,
                        color: (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[gang.color].Color),
                        baseName: base.Name[Language_1.Language.Portuguese],
                        baseId: base.Id,
                        membersCount: gang.membersCount,
                        maxMembers: 9 + gang.level + (gang.baseId === GangBases_1.GangBaseId.None ? 0 : 1),
                        recruitmentType: gang.recruitmentType === GangRecruitment_1.GangRecruitmentType.Open
                            ? "OPEN"
                            : gang.recruitmentType === GangRecruitment_1.GangRecruitmentType.Approval
                                ? "APPROVAL"
                                : "DISABLED",
                    };
                }),
            };
        },
        myActiveGangJoinRequest: async (_, __, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const request = await GangJoinRequestsRepository_1.GangJoinRequestsRepository.FindActiveByUser(authUser.userId);
            if (!request)
                return null;
            return {
                id: request.id.toString(),
                gangId: request.gangId.toString(),
                gangName: request.gangName,
                gangAcronym: request.gangAcronym,
                userId: request.userId,
                userName: request.userName,
                message: request.message,
                status: request.status,
                createdAt: request.createdAt.toISOString(),
            };
        },
        myGangJoinRequestsHistory: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const limit = args.limit ? Math.min(Math.max(args.limit, 1), 50) : 20;
            const history = await GangJoinRequestsRepository_1.GangJoinRequestsRepository.FindHistoryByUser(authUser.userId, limit);
            return history.map(h => ({
                id: h.id.toString(),
                gangId: h.gangId.toString(),
                gangName: h.gangName,
                gangAcronym: h.gangAcronym,
                gangImage: h.gangImage ?? null,
                gangColor: h.gangColor === undefined ? null : (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[h.gangColor].Color),
                userId: h.userId,
                userName: h.userName,
                message: h.message,
                status: h.status,
                createdAt: h.createdAt.toISOString(),
            }));
        },
        gangJoinRequests: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number.parseInt(args.gangId, 10);
            if (Number.isNaN(gangId))
                return [];
            const gangEntity = await GangRepository_1.GangRepository.FindById(gangId);
            if (!gangEntity)
                return [];
            const gang = await Gang_1.Gang.GetInfo(gangEntity);
            if (!gang)
                return [];
            const isLeader = gang.LeaderId === authUser.userId;
            const canInvite = gang.CanInvite(authUser.userId);
            if (!isLeader && !canInvite) {
                return [];
            }
            const requests = await GangJoinRequestsRepository_1.GangJoinRequestsRepository.FindPendingByGang(gangId);
            const client = (0, client_1.getClient)();
            return Promise.all(requests.map(async (r) => ({
                id: r.id.toString(),
                gangId: r.gangId.toString(),
                gangName: r.gangName,
                gangAcronym: r.gangAcronym,
                userId: r.userId,
                userName: r.userName,
                userAvatarUrl: await client.users.fetch(r.userId).then(discordUser => discordUser.avatarURL(), () => null),
                userAvatarDecoration: AvatarDecorations_1.AvatarDecorationList[r.userAvatarDecoration ?? 0].Description[Language_1.Language.English].toLowerCase().replaceAll(" ", "_"),
                message: r.message,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
            })));
        },
    },
    Mutation: {
        createGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            // Map color string to GangColorId enum
            const colorMap = {
                grey: GangColors_1.GangColorId.Grey,
                purple: GangColors_1.GangColorId.Purple,
                blue: GangColors_1.GangColorId.Blue,
                green: GangColors_1.GangColorId.Green,
                yellow: GangColors_1.GangColorId.Yellow,
                orange: GangColors_1.GangColorId.Orange,
                red: GangColors_1.GangColorId.Red,
                pink: GangColors_1.GangColorId.Pink,
            };
            const colorId = colorMap[args.color?.toLowerCase()];
            if (colorId === undefined) {
                return { success: false, message: "Cor inválida." };
            }
            // Validate input
            if (!args.name || args.name.length < 4 || args.name.length > 50) {
                return { success: false, message: "O nome deve ter entre 4 e 50 caracteres." };
            }
            if (!args.acronym || args.acronym.length < 2 || args.acronym.length > 3) {
                return { success: false, message: "O acrônimo deve ter entre 2 e 3 caracteres." };
            }
            if (!args.description || args.description.length > 500) {
                return { success: false, message: "A descrição não pode exceder 500 caracteres." };
            }
            const user = await new User_1.User(authUser.userId).GetInfo();
            if (!user) {
                return { success: false, message: "Usuário não encontrado." };
            }
            const result = await Gang_1.Gang.Create(user, args.name, args.acronym.toLocaleUpperCase("en"), args.description, colorId, args.imageUrl || null, gangRecruitmentTypes[args.recruitmentType]);
            if (result.gang) {
                return { success: true, message: "Gangue criada com sucesso." };
            }
            const reasonMessages = {
                notEnoughMoney: "Você não tem dinheiro suficiente para criar uma gangue.",
                alreadyInGang: "Você já está em uma gangue.",
                gangExists: "Já existe uma gangue com este nome.",
            };
            const message = result.reason ? (reasonMessages[result.reason] ?? "Falha ao criar gangue.") : "Falha ao criar gangue.";
            return { success: false, message };
        },
        updateGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gang = await Gang_1.Gang.GetById(Number(args.id));
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            // Check edit permission: leader or role with canEditGang
            const canEdit = gang.CanEdit(authUser.userId);
            if (!canEdit) {
                return { success: false, message: "Você não tem permissão para editar esta gangue." };
            }
            const recruitmentType = args.recruitmentType ? gangRecruitmentTypes[args.recruitmentType] : null;
            if (recruitmentType !== null && recruitmentType !== gang.RecruitmentType && authUser.userId !== gang.LeaderId) {
                return {
                    success: false,
                    message: "Apenas o líder pode alterar as configurações de recrutamento.",
                };
            }
            // Map color string to GangColorId enum if provided
            let colorId = null;
            if (args.color) {
                const colorMap = {
                    grey: GangColors_1.GangColorId.Grey,
                    purple: GangColors_1.GangColorId.Purple,
                    blue: GangColors_1.GangColorId.Blue,
                    green: GangColors_1.GangColorId.Green,
                    yellow: GangColors_1.GangColorId.Yellow,
                    orange: GangColors_1.GangColorId.Orange,
                    red: GangColors_1.GangColorId.Red,
                    pink: GangColors_1.GangColorId.Pink,
                };
                colorId = colorMap[args.color?.toLowerCase()];
                if (colorId === undefined) {
                    return { success: false, message: "Cor inválida." };
                }
            }
            // Validate name if provided
            if (args.name && (args.name.length < 4 || args.name.length > 50)) {
                return { success: false, message: "O nome deve ter entre 4 e 50 caracteres." };
            }
            // Validate acronym if provided
            if (args.acronym && (args.acronym.length < 2 || args.acronym.length > 3)) {
                return { success: false, message: "O acrônimo deve ter entre 2 e 3 caracteres." };
            }
            // Validate description if provided
            if (args.description && args.description.length > 500) {
                return { success: false, message: "A descrição não pode exceder 500 caracteres." };
            }
            const success = await gang.Edit(args.name ?? null, args.acronym?.toLocaleUpperCase("en") ?? null, args.description ?? null, colorId, args.imageUrl ?? null, recruitmentType);
            if (success) {
                return { success: true, message: "Gangue atualizada com sucesso." };
            }
            return { success: false, message: "Falha ao atualizar gangue." };
        },
        setGangMoney: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const gangId = Number(args.gangId);
            if (!Number.isSafeInteger(gangId)) {
                return { success: false, message: "Gangue não encontrada." };
            }
            if (!Number.isSafeInteger(args.amount)) {
                return { success: false, message: "O valor do dinheiro deve ser um número inteiro válido." };
            }
            const gang = await Gang_1.Gang.GetById(gangId);
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const money = args.mode === "ADD" ? gang.Money + args.amount : args.amount;
            if (!Number.isSafeInteger(money)) {
                return { success: false, message: "O dinheiro atualizado deve ser um número inteiro válido." };
            }
            const previousMoney = gang.Money;
            gang.Money = money;
            const success = await gang.Update();
            if (success) {
                await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_1.AdminAuditActionId.SetGangMoney, { gangId }, previousMoney, money);
            }
            return success
                ? {
                    success: true,
                    message: `Dinheiro da gangue atualizado para ${(0, ui_1.formatMoney)(money, Language_1.Language.Portuguese)}.`,
                }
                : { success: false, message: "Falha ao atualizar o dinheiro da gangue." };
        },
        startGangImport: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number(args.gangId);
            if (!Number.isSafeInteger(gangId)) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const gang = await Gang_1.Gang.GetById(gangId);
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            if (!gang.CanImportShipments(authUser.userId)) {
                return { success: false, message: "Você não tem permissão para importar cargas." };
            }
            const check = await gang.CanStartImport();
            if (!check.can) {
                const messages = {
                    [Gang_1.GangImportFailureReason.NoBase]: "Sua gangue precisa ter uma base para importar cargas.",
                    [Gang_1.GangImportFailureReason.ActiveImport]: "Já existe uma importação em trânsito.",
                    [Gang_1.GangImportFailureReason.Cooldown]: "A importação está em período de espera.",
                    [Gang_1.GangImportFailureReason.CancelCooldown]: "A importação está em período de espera após um cancelamento.",
                    [Gang_1.GangImportFailureReason.NotEnoughMoney]: "O banco da gangue não tem dinheiro suficiente.",
                };
                return {
                    success: false,
                    message: check.reason === undefined ? "Não foi possível iniciar a importação." : messages[check.reason],
                };
            }
            await gang.StartImport();
            return { success: true, message: "Importação iniciada com sucesso." };
        },
        cancelGangImport: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number(args.gangId);
            if (!Number.isSafeInteger(gangId)) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const gang = await Gang_1.Gang.GetById(gangId);
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            if (!gang.CanImportShipments(authUser.userId)) {
                return { success: false, message: "Você não tem permissão para cancelar importações." };
            }
            if (!gang.IsImportActive()) {
                return { success: false, message: "Não há uma importação ativa para cancelar." };
            }
            const refund = await gang.CancelImport();
            return {
                success: true,
                message: `Importação cancelada. ${(0, ui_1.formatMoney)(refund, Language_1.Language.Portuguese)} foi reembolsado ao banco da gangue.`,
            };
        },
        createGangRole: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number(args.gangId);
            if (!Number.isSafeInteger(gangId)) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const gang = await Gang_1.Gang.GetById(gangId);
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const name = args.name.trim();
            if (name.length < 2 || name.length > 20) {
                return { success: false, message: "O nome do cargo deve ter entre 2 e 20 caracteres." };
            }
            const success = await gang.CreateRole(authUser.userId, name, getGangRolePermissions(args));
            return success
                ? { success: true, message: "Cargo criado com sucesso." }
                : { success: false, message: "Falha ao criar cargo. Verifique se o nome já está em uso." };
        },
        updateGangRole: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number(args.gangId);
            if (!Number.isSafeInteger(gangId) || !Number.isSafeInteger(args.roleId)) {
                return { success: false, message: "Cargo não encontrado." };
            }
            const gang = await Gang_1.Gang.GetById(gangId);
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const name = args.name.trim();
            if (name.length < 2 || name.length > 20) {
                return { success: false, message: "O nome do cargo deve ter entre 2 e 20 caracteres." };
            }
            const success = await gang.EditRole(authUser.userId, args.roleId, getGangRolePermissions(args), name);
            return success
                ? { success: true, message: "Cargo atualizado com sucesso." }
                : { success: false, message: "Falha ao atualizar cargo. Verifique as permissões e o nome." };
        },
        updateGangMemberRole: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gang = await Gang_1.Gang.GetById(Number(args.gangId));
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const targetMember = gang.Members.find(member => member.UserId === args.targetUserId);
            const leaderRoleId = gang.Members.find(member => member.UserId === gang.LeaderId)?.RoleId;
            if (!targetMember || targetMember.UserId === gang.LeaderId || args.roleId === leaderRoleId) {
                return { success: false, message: "Membro ou cargo inválido." };
            }
            const success = await gang.ChangeRole(authUser.userId, args.targetUserId, args.roleId);
            return success
                ? { success: true, message: "Cargo do membro alterado com sucesso." }
                : { success: false, message: "Você não tem permissão para alterar este cargo." };
        },
        kickGangMember: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number(args.gangId);
            if (!Number.isSafeInteger(gangId)) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const gang = await Gang_1.Gang.GetById(gangId);
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            if (!gang.CanKick(authUser.userId)) {
                return { success: false, message: "Você não tem permissão para expulsar membros." };
            }
            if (args.targetUserId === authUser.userId || args.targetUserId === gang.LeaderId) {
                return { success: false, message: "Não é possível expulsar este membro." };
            }
            if (!gang.Members.some(member => member.UserId === args.targetUserId)) {
                return { success: false, message: "Membro não encontrado nesta gangue." };
            }
            const [kicker, target] = await Promise.all([
                new User_1.User(authUser.userId).GetInfo(),
                new User_1.User(args.targetUserId).GetInfo(),
            ]);
            if (!kicker || !target) {
                return { success: false, message: "Membro ou usuário não encontrado." };
            }
            const success = await gang.KickMember(kicker, target);
            return success
                ? { success: true, message: "Membro expulso da gangue." }
                : { success: false, message: "Não foi possível expulsar este membro." };
        },
        communicateGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number(args.gangId);
            if (!Number.isSafeInteger(gangId)) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const gang = await Gang_1.Gang.GetById(gangId);
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            if (!gang.CanCommunicate(authUser.userId)) {
                return { success: false, message: "Você não tem permissão para comunicar os membros." };
            }
            const message = args.message.trim();
            if (!message || message.length > 4_000) {
                return { success: false, message: "A mensagem deve ter entre 1 e 4.000 caracteres." };
            }
            const sender = await new User_1.User(authUser.userId).GetInfo();
            if (!sender) {
                return { success: false, message: "Usuário não encontrado." };
            }
            await gang.OfficialCommunication(sender, message);
            return { success: true, message: "Comunicado enviado aos membros." };
        },
        depositGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            if (!Number.isSafeInteger(args.amount) || args.amount <= 0) {
                return { success: false, message: "Informe um valor inteiro maior que zero." };
            }
            const gang = await Gang_1.Gang.GetById(Number(args.gangId));
            const user = await new User_1.User(authUser.userId).GetInfo();
            if (!gang || !user) {
                return { success: false, message: "Gangue ou usuário não encontrado." };
            }
            const check = await gang.CanDeposit(user, args.amount);
            if (!check.canDeposit) {
                return { success: false, message: check.text || "Não é possível depositar agora." };
            }
            await gang.Deposit(user, args.amount);
            return { success: true, message: "Depósito realizado com sucesso." };
        },
        leaveGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gang = await Gang_1.Gang.GetById(Number(args.gangId));
            const user = await new User_1.User(authUser.userId).GetInfo();
            if (!gang || !user || !gang.Members.some(member => member.UserId === user.Id)) {
                return { success: false, message: "Você não faz parte desta gangue." };
            }
            const success = await gang.LeaveGang(user);
            return success
                ? {
                    success: true,
                    message: gang.LeaderId === user.Id ? "Gangue encerrada com sucesso." : "Você saiu da gangue.",
                }
                : { success: false, message: "O líder não pode sair enquanto houver outros membros." };
        },
        transferGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gang = await Gang_1.Gang.GetById(Number(args.gangId));
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            const [currentUser, targetUser] = await Promise.all([
                new User_1.User(authUser.userId).GetInfo(),
                new User_1.User(args.targetUserId).GetInfo(),
            ]);
            if (!currentUser || !targetUser || !gang.Members.some(member => member.UserId === targetUser.Id)) {
                return { success: false, message: "Membro inválido para transferência." };
            }
            const success = await gang.TransferLeadership(currentUser, targetUser);
            return success
                ? { success: true, message: "Liderança transferida com sucesso." }
                : { success: false, message: "Apenas o líder pode transferir a liderança." };
        },
        inviteGangMember: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gang = await Gang_1.Gang.GetById(Number(args.gangId));
            if (!gang) {
                return { success: false, message: "Gangue não encontrada." };
            }
            if (!gang.CanInvite(authUser.userId)) {
                return { success: false, message: "Você não tem permissão para convidar membros." };
            }
            if (authUser.userId === args.targetUserId) {
                return { success: false, message: "Você não pode convidar a si mesmo." };
            }
            const targetUser = await new User_1.User(args.targetUserId).GetInfo();
            if (!targetUser) {
                return { success: false, message: "Usuário não encontrado." };
            }
            const validation = await gang.CanInviteUser(targetUser);
            if (!validation.canInvite) {
                return { success: false, message: "Este usuário não pode entrar na gangue." };
            }
            const client = (0, client_1.getClient)();
            let inviteCooldown = client.invites.get(gang.Id);
            if (!inviteCooldown) {
                inviteCooldown = new discord_js_1.Collection();
                client.invites.set(gang.Id, inviteCooldown);
            }
            const lastInviteTime = inviteCooldown.get(targetUser.Id) ?? 0;
            if (Date.now() - lastInviteTime < 3 * 60_000) {
                return { success: false, message: "Aguarde antes de enviar outro convite para este usuário." };
            }
            const strings = {
                [Language_1.Language.English]: {
                    invitation: `You were invited to join **${gang.Name} [${gang.Acronym}]**.`,
                    accept: "Accept",
                    decline: "Decline",
                    accepted: "You joined the gang.",
                    declined: "You declined the gang invitation.",
                    failed: "The invitation is no longer valid.",
                    expired: "This gang invitation expired.",
                },
                [Language_1.Language.Portuguese]: {
                    invitation: `Você foi convidado para entrar na gangue **${gang.Name} [${gang.Acronym}]**.`,
                    accept: "Aceitar",
                    decline: "Recusar",
                    accepted: "Você entrou na gangue.",
                    declined: "Você recusou o convite da gangue.",
                    failed: "Este convite não é mais válido.",
                    expired: "Este convite para a gangue expirou.",
                },
                [Language_1.Language.Spanish]: {
                    invitation: `Te invitaron a unirte a la cuadrilla **${gang.Name} [${gang.Acronym}]**.`,
                    accept: "Aceptar",
                    decline: "Rechazar",
                    accepted: "Te uniste a la cuadrilla.",
                    declined: "Rechazaste la invitación.",
                    failed: "La invitación ya no es válida.",
                    expired: "La invitación a la cuadrilla expiró.",
                },
            }[targetUser.Language];
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("accept").setLabel(strings.accept).setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId("decline").setLabel(strings.decline).setStyle(discord_js_1.ButtonStyle.Secondary));
            inviteCooldown.set(targetUser.Id, Date.now());
            let invitation;
            try {
                const discordUser = await client.users.fetch(targetUser.Id);
                invitation = await discordUser.send({ content: strings.invitation, components: [row] });
            }
            catch (error) {
                log_1.logger.warn({ error, gangId: gang.Id, targetUserId: targetUser.Id }, "Failed to send gang invitation.");
                inviteCooldown.delete(targetUser.Id);
                return { success: false, message: "Não foi possível enviar uma mensagem privada para este usuário." };
            }
            const collector = invitation.createMessageComponentCollector({
                componentType: discord_js_1.ComponentType.Button,
                filter: interaction => interaction.user.id === targetUser.Id,
                max: 1,
                time: 3 * 60_000,
            });
            collector.on("collect", async (interaction) => {
                let message = strings.declined;
                try {
                    await interaction.deferUpdate();
                    if (interaction.customId === "accept") {
                        const [currentGang] = await Promise.all([
                            Gang_1.Gang.GetById(gang.Id),
                            targetUser.GetInfo(),
                        ]);
                        message = currentGang
                            && currentGang.CanInvite(authUser.userId)
                            && targetUser.Money >= currentGang.GetJoinCost()
                            && await currentGang.AcceptInvite(targetUser)
                            ? strings.accepted
                            : strings.failed;
                    }
                    await invitation.edit({ content: message, components: [] });
                }
                catch (error) {
                    log_1.logger.error({
                        error,
                        gangId: gang.Id,
                        targetUserId: targetUser.Id,
                    }, "Failed to process gang invitation response.");
                    await invitation.edit({ content: strings.failed, components: [] }).catch(editError => {
                        log_1.logger.warn({
                            error: editError,
                            gangId: gang.Id,
                            targetUserId: targetUser.Id,
                        }, "Failed to update gang invitation response.");
                    });
                }
            });
            collector.on("end", (collected) => {
                if (collected.size > 0)
                    return;
                void invitation.edit({ content: strings.expired, components: [] }).catch(error => {
                    log_1.logger.warn({
                        error,
                        gangId: gang.Id,
                        targetUserId: targetUser.Id,
                    }, "Failed to expire gang invitation.");
                });
            });
            return { success: true, message: "Convite enviado por mensagem privada." };
        },
        joinOpenGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number.parseInt(args.gangId, 10);
            if (Number.isNaN(gangId))
                return { success: false, message: "ID da gangue inválido." };
            const gangEntity = await GangRepository_1.GangRepository.FindById(gangId);
            if (!gangEntity)
                return { success: false, message: "Gangue não encontrada." };
            const gang = await Gang_1.Gang.GetInfo(gangEntity);
            if (!gang)
                return { success: false, message: "Gangue não encontrada." };
            const user = await new User_1.User(authUser.userId).GetInfo();
            if (!user)
                return { success: false, message: "Usuário não encontrado." };
            const result = await gang.JoinOpenGang(user);
            if (!result.success) {
                if (result.reason === "alreadyInGang") {
                    return {
                        success: false,
                        message: "Você já pertence a uma gangue.",
                    };
                }
                if (result.reason === "gangFull") {
                    return {
                        success: false,
                        message: "Esta gangue atingiu o limite de membros.",
                    };
                }
                if (result.reason === "notOpenRecruitment") {
                    return {
                        success: false,
                        message: "Esta gangue não está com recrutamento aberto.",
                    };
                }
                if (result.reason === "notEnoughMoney") {
                    return {
                        success: false,
                        message: `Você precisa de ${(0, ui_1.formatMoney)(gang.GetJoinCost(), Language_1.Language.Portuguese)} para entrar nesta gangue.`,
                    };
                }
                return {
                    success: false,
                    message: "Não foi possível entrar na gangue.",
                };
            }
            return { success: true, message: `Você entrou na gangue ${gang.Name} com sucesso!` };
        },
        applyToGang: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number.parseInt(args.gangId, 10);
            if (Number.isNaN(gangId))
                return { success: false, message: "ID da gangue inválido." };
            const gangEntity = await GangRepository_1.GangRepository.FindById(gangId);
            if (!gangEntity)
                return { success: false, message: "Gangue não encontrada." };
            const gang = await Gang_1.Gang.GetInfo(gangEntity);
            if (!gang)
                return { success: false, message: "Gangue não encontrada." };
            const user = await new User_1.User(authUser.userId).GetInfo();
            if (!user)
                return { success: false, message: "Usuário não encontrado." };
            const result = await gang.ApplyToGang(user, args.message);
            if (!result.success) {
                if (result.reason === "alreadyInGang") {
                    return {
                        success: false,
                        message: "Você já pertence a uma gangue.",
                    };
                }
                if (result.reason === "gangFull") {
                    return {
                        success: false,
                        message: "Esta gangue atingiu o limite de membros.",
                    };
                }
                if (result.reason === "alreadyHasPendingRequest") {
                    return {
                        success: false,
                        message: "Você já possui uma solicitção pendente.",
                    };
                }
                if (result.reason === "notApprovalRecruitment") {
                    return {
                        success: false,
                        message: "Esta gangue não está aceitando solicitações de adesão.",
                    };
                }
                if (result.reason === "notEnoughMoney") {
                    return {
                        success: false,
                        message: `Você precisa de ${(0, ui_1.formatMoney)(gang.GetJoinCost(), Language_1.Language.Portuguese)} para solicitar entrada nesta gangue.`,
                    };
                }
                return { success: false, message: "Não foi possível enviar a solicitação." };
            }
            return { success: true, message: `Solicitação enviada para a gangue ${gang.Name} com sucesso!` };
        },
        cancelGangJoinRequest: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const reqId = args.requestId ? Number.parseInt(args.requestId, 10) : undefined;
            const result = await Gang_1.Gang.CancelJoinRequest(authUser.userId, reqId);
            if (!result.success) {
                return { success: false, message: "Nenhuma solicitação pendente encontrada para cancelar." };
            }
            return { success: true, message: "Solicitação cancelada com sucesso." };
        },
        resolveGangJoinRequest: async (_, args, context) => {
            const authUser = (0, helpers_1.assertAuthenticated)(context);
            const gangId = Number.parseInt(args.gangId, 10);
            const requestId = Number.parseInt(args.requestId, 10);
            if (Number.isNaN(gangId) || Number.isNaN(requestId)) {
                return { success: false, message: "Dados inválidos." };
            }
            const gangEntity = await GangRepository_1.GangRepository.FindById(gangId);
            if (!gangEntity)
                return { success: false, message: "Gangue não encontrada." };
            const gang = await Gang_1.Gang.GetInfo(gangEntity);
            if (!gang)
                return { success: false, message: "Gangue não encontrada." };
            const manager = await new User_1.User(authUser.userId).GetInfo();
            if (!manager)
                return { success: false, message: "Gerente não encontrado." };
            const result = await gang.ResolveJoinRequest(manager, requestId, args.accept);
            if (!result.success) {
                if (result.reason === "noPermission") {
                    return {
                        success: false,
                        message: "Vocâ não tem permissão para gerenciar solicitações.",
                    };
                }
                if (result.reason === "gangFull") {
                    return {
                        success: false,
                        message: "A gangue já atingiu o limite de membros.",
                    };
                }
                if (result.reason === "alreadyInGang") {
                    return {
                        success: false,
                        message: "O usuário já entrou em outra gangue.",
                    };
                }
                if (result.reason === "requestNotFound") {
                    return {
                        success: false,
                        message: "Solicitação não encontrada ou já respondida.",
                    };
                }
                if (result.reason === "applicantNotEnoughMoney") {
                    return {
                        success: false,
                        message: `O jogador não tem os ${(0, ui_1.formatMoney)(gang.GetJoinCost(), Language_1.Language.Portuguese)} necessários para entrar na gangue.`,
                    };
                }
                return { success: false, message: "Não foi possível processar a solicitação." };
            }
            return {
                success: true,
                message: args.accept ? "Solicitação aceita com sucesso!" : "Solicitação recusada com sucesso.",
            };
        },
    },
};
//# sourceMappingURL=gangs.js.map