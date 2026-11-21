"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuditSettingId = exports.AdminAuditActionId = void 0;
var AdminAuditActionId;
(function (AdminAuditActionId) {
    AdminAuditActionId[AdminAuditActionId["SetMainHeistAllowed"] = 1] = "SetMainHeistAllowed";
    AdminAuditActionId[AdminAuditActionId["EndSeason"] = 2] = "EndSeason";
    AdminAuditActionId[AdminAuditActionId["CreateEvent"] = 3] = "CreateEvent";
    AdminAuditActionId[AdminAuditActionId["UpdateEvent"] = 4] = "UpdateEvent";
    AdminAuditActionId[AdminAuditActionId["DeleteEvent"] = 5] = "DeleteEvent";
    AdminAuditActionId[AdminAuditActionId["SetMoney"] = 6] = "SetMoney";
    AdminAuditActionId[AdminAuditActionId["CureUser"] = 7] = "CureUser";
    AdminAuditActionId[AdminAuditActionId["FreeUser"] = 8] = "FreeUser";
    AdminAuditActionId[AdminAuditActionId["ResetCooldown"] = 9] = "ResetCooldown";
    AdminAuditActionId[AdminAuditActionId["RemoveAction"] = 10] = "RemoveAction";
    AdminAuditActionId[AdminAuditActionId["SetItem"] = 11] = "SetItem";
    AdminAuditActionId[AdminAuditActionId["AddSpecialCoins"] = 12] = "AddSpecialCoins";
    AdminAuditActionId[AdminAuditActionId["SetClass"] = 13] = "SetClass";
    AdminAuditActionId[AdminAuditActionId["SetNickname"] = 14] = "SetNickname";
    AdminAuditActionId[AdminAuditActionId["SetVip"] = 15] = "SetVip";
    AdminAuditActionId[AdminAuditActionId["KillUser"] = 16] = "KillUser";
    AdminAuditActionId[AdminAuditActionId["AddBadge"] = 17] = "AddBadge";
    AdminAuditActionId[AdminAuditActionId["RemoveBadge"] = 18] = "RemoveBadge";
    AdminAuditActionId[AdminAuditActionId["SwapUsers"] = 19] = "SwapUsers";
    AdminAuditActionId[AdminAuditActionId["DeleteUser"] = 20] = "DeleteUser";
    AdminAuditActionId[AdminAuditActionId["SetGangMoney"] = 21] = "SetGangMoney";
    AdminAuditActionId[AdminAuditActionId["SetVaultBalance"] = 22] = "SetVaultBalance";
})(AdminAuditActionId || (exports.AdminAuditActionId = AdminAuditActionId = {}));
var AdminAuditSettingId;
(function (AdminAuditSettingId) {
    AdminAuditSettingId[AdminAuditSettingId["MainHeist"] = 1] = "MainHeist";
    AdminAuditSettingId[AdminAuditSettingId["Season"] = 2] = "Season";
    AdminAuditSettingId[AdminAuditSettingId["Events"] = 3] = "Events";
    AdminAuditSettingId[AdminAuditSettingId["UserAccounts"] = 4] = "UserAccounts";
    AdminAuditSettingId[AdminAuditSettingId["BankVault"] = 5] = "BankVault";
    AdminAuditSettingId[AdminAuditSettingId["CasinoVault"] = 6] = "CasinoVault";
})(AdminAuditSettingId || (exports.AdminAuditSettingId = AdminAuditSettingId = {}));
//# sourceMappingURL=AdminAuditLog.js.map