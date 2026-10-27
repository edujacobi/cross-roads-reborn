"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heist = void 0;
const Vault_js_1 = require("./Vault.js");
const Prison_js_1 = require("./Prison.js");
const GangHeistRepository_1 = require("#core/repositories/GangHeistRepository");
const Heist_1 = require("#core/types/Heist");
const GangBases_1 = require("#core/types/GangBases");
const Classes_1 = require("#core/types/Classes");
const date_fns_1 = require("date-fns");
class Heist {
    static GETAWAY_CARS_COST = 8_000_000;
    /**
     * Gets the heist state for a gang.
     */
    static async GetHeistState(gangId) {
        return await GangHeistRepository_1.GangHeistRepository.GetByGangId(gangId);
    }
    /**
     * Validates if the leader can start a heist or mission.
     */
    static async ValidateStart(user, gang, missionId) {
        // 1. Must be leader
        if (user.Id !== gang.LeaderId) {
            return { success: false, reason: "onlyLeader" };
        }
        // 2. Must have a base
        if (gang.BaseId === GangBases_1.GangBaseId.None) {
            return { success: false, reason: "noBase" };
        }
        const heistState = await GangHeistRepository_1.GangHeistRepository.GetByGangId(gang.Id);
        // 3. Check cooldowns/completed based on mission
        const now = new Date();
        if (missionId === Heist_1.HeistMissionId.Blueprint) {
            if (heistState.mission1Completed) {
                return { success: false, reason: "missionCompleted" };
            }
            if (heistState.mission1CooldownUntil && (0, date_fns_1.isFuture)(heistState.mission1CooldownUntil)) {
                return { success: false, reason: "missionCooldown", time: heistState.mission1CooldownUntil };
            }
        }
        else if (missionId === Heist_1.HeistMissionId.GetawayCars) {
            if (heistState.mission2Completed) {
                return { success: false, reason: "missionCompleted" };
            }
            if (gang.Money < this.GETAWAY_CARS_COST) {
                return { success: false, reason: "noMoney" };
            }
        }
        else if (missionId === Heist_1.HeistMissionId.HackCameras) {
            if (heistState.mission3Completed) {
                return { success: false, reason: "missionCompleted" };
            }
            if (heistState.mission3CooldownUntil && (0, date_fns_1.isFuture)(heistState.mission3CooldownUntil)) {
                return { success: false, reason: "missionCooldown", time: heistState.mission3CooldownUntil };
            }
        }
        else if (missionId === Heist_1.HeistMissionId.MainHeist) {
            // Schedule restriction: Mon, Wed, Fri
            const day = now.getDay(); // 0 Sunday, 1 Monday, etc.
            const isAllowedDay = day === 1 || day === 3 || day === 5;
            const isMainAllowed = await Vault_js_1.Vault.IsMainHeistAllowed();
            if (!isMainAllowed || !isAllowedDay) {
                return { success: false, reason: "scheduleBlock" };
            }
            if (heistState.heistCooldownUntil && (0, date_fns_1.isFuture)(heistState.heistCooldownUntil)) {
                return { success: false, reason: "heistCooldown", time: heistState.heistCooldownUntil };
            }
        }
        return { success: true };
    }
    /**
     * Validates if a member can join a heist or mission lobby.
     */
    static async ValidateJoin(user, gang) {
        if (!user.GangId) {
            return { success: false, reason: "notInGang" };
        }
        if (user.GangId !== gang.Id) {
            return { success: false, reason: "notInSameGang" };
        }
        // Check availability (cannot join if working, hospitalized, imprisoned, wanted, etc.)
        const avail = user.CheckAvailability();
        if (!avail.available) {
            return { success: false, reason: avail.reason, time: avail.time };
        }
        return { success: true };
    }
    /**
     * Bulk locks states for participants.
     */
    static async LockStates(users) {
        for (const user of users) {
            user.Robbery.ParticipatingInGangAction = true;
            await user.Update({
                robberyParticipatingInGangAction: true,
            });
        }
    }
    /**
     * Bulk releases states for participants.
     */
    static async ReleaseLocks(users) {
        for (const user of users) {
            user.Robbery.ParticipatingInGangAction = false;
            await user.Update({
                robberyParticipatingInGangAction: false,
            });
        }
    }
    /**
     * Resolves Mission 1 (Rob Bank Blueprint).
     */
    static async ResolveMission1(gang, players) {
        const baseChance = 10;
        const chancePerMember = 2.0;
        const chance = Math.min(100, baseChance + players.length * chancePerMember);
        const roll = Math.random() * 100;
        const now = new Date();
        const cooldown = (0, date_fns_1.addHours)(now, 6);
        if (roll < chance) {
            // Success
            await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
                mission1Completed: true,
                mission1CooldownUntil: cooldown,
            });
            for (const p of players) {
                const factor = p.Class === Classes_1.ClassId.Thief ? 1.15 : (p.Class === Classes_1.ClassId.Attorney ? 0.85 : 1.0);
                const wantedMins = Math.round(45 * factor);
                p.Wanted.Time = (0, date_fns_1.addMinutes)(now, wantedMins);
                p.Robbery.SuccessCount += 1;
                await p.Update({
                    wantedTime: p.Wanted.Time,
                    robberySuccessCount: p.Robbery.SuccessCount,
                });
            }
            return { success: true, chance, isArrested: false, time: 0 };
        }
        else {
            // Failure
            await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
                mission1Completed: false,
                mission1CooldownUntil: cooldown,
            });
            // Jail time: random 4h to 5h
            const baseJailTime = Math.floor(Math.random() * (5 - 4 + 1) + 4);
            const jailMinutes = baseJailTime * 60;
            for (const p of players) {
                await Prison_js_1.Prison.Arrest(p, jailMinutes);
            }
            return { success: false, chance, isArrested: true, time: baseJailTime };
        }
    }
    /**
     * Resolves Mission 2 (Buy Getaway Cars).
     */
    static async ResolveMission2(gang) {
        if (gang.Money < Heist.GETAWAY_CARS_COST)
            return false;
        gang.Money -= Heist.GETAWAY_CARS_COST;
        await gang.Update();
        await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
            mission2Completed: true,
            mission2CooldownUntil: (0, date_fns_1.addHours)(new Date(), 6),
        });
        return true;
    }
    /**
     * Resolves Mission 3 (Hack Security Cameras).
     */
    static async ResolveMission3(gang, players) {
        const baseChance = 15;
        const chancePerMember = 1.0;
        const chance = Math.min(100, baseChance + players.length * chancePerMember);
        const roll = Math.random() * 100;
        const now = new Date();
        const cooldown = (0, date_fns_1.addHours)(now, 6);
        if (roll < chance) {
            // Success
            await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
                mission3Completed: true,
                mission3CooldownUntil: cooldown,
            });
            for (const p of players) {
                const factor = p.Class === Classes_1.ClassId.Thief ? 1.15 : (p.Class === Classes_1.ClassId.Attorney ? 0.85 : 1.0);
                const wantedMins = Math.round(45 * factor);
                p.Wanted.Time = (0, date_fns_1.addMinutes)(now, wantedMins);
                p.Robbery.SuccessCount += 1;
                await p.Update({
                    wantedTime: p.Wanted.Time,
                    robberySuccessCount: p.Robbery.SuccessCount,
                });
            }
            return { success: true, chance, isArrested: false, time: 0 };
        }
        else {
            // Failure
            await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
                mission3Completed: false,
                mission3CooldownUntil: cooldown,
            });
            // Jail time: random 4h to 5h
            const baseJailTime = Math.floor(Math.random() * (5 - 4 + 1) + 4);
            const jailMinutes = baseJailTime * 60;
            for (const p of players) {
                await Prison_js_1.Prison.Arrest(p, jailMinutes);
            }
            return { success: false, chance, isArrested: true, time: baseJailTime };
        }
    }
    /**
     * Resolves the Main Heist.
     */
    static async ResolveMainHeist(gang, players) {
        const target = (0, Heist_1.getWeeklyTarget)();
        const balances = await Vault_js_1.Vault.GetBalances();
        const vaultBalance = target.VaultType === "bank" ? balances.bank : balances.casino;
        // Calculate total attack and base heist chance
        let totalAtk = 0;
        for (const p of players) {
            let playerAtk = p.Attributes.Attack;
            if (p.Class === Classes_1.ClassId.Hobo)
                playerAtk *= 0.9;
            else if (p.Class === Classes_1.ClassId.Assassin)
                playerAtk *= 1.1;
            totalAtk += playerAtk;
        }
        const divisor = 50;
        let chance = totalAtk / divisor;
        // Add mission bonuses
        const heistState = await GangHeistRepository_1.GangHeistRepository.GetByGangId(gang.Id);
        if (heistState.mission1Completed)
            chance += 4;
        if (heistState.mission2Completed)
            chance += 2;
        if (heistState.mission3Completed)
            chance += 5;
        chance = Math.min(100, Math.max(0, chance));
        const roll = Math.random() * 100;
        const now = new Date();
        const cooldown = (0, date_fns_1.addHours)(now, 24);
        // Reset all missions
        await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
            mission1Completed: false,
            mission2Completed: false,
            mission3Completed: false,
            heistCooldownUntil: cooldown,
        });
        if (roll < chance) {
            // Success!
            // Stolen percent: 10-20%
            const minPercent = 10;
            const maxPercent = 20;
            const stolenPercent = Math.floor(Math.random() * (maxPercent - minPercent + 1) + minPercent);
            const stolenAmount = Math.floor(vaultBalance * stolenPercent / 100);
            const shares = players.length + 1; // +1 share for gang bank
            const baseShare = Math.floor(stolenAmount / shares);
            for (const p of players) {
                const factor = p.Class === Classes_1.ClassId.Thief ? 1.15 : (p.Class === Classes_1.ClassId.Attorney ? 0.85 : 1.0);
                const wantedMins = Math.round(45 * factor);
                p.Wanted.Time = (0, date_fns_1.addMinutes)(now, wantedMins);
                // Thief class gets a 10% bonus on their share payout
                const payout = p.Class === Classes_1.ClassId.Thief ? Math.floor(baseShare * 1.10) : baseShare;
                p.Money += payout;
                p.Robbery.SuccessCount += 1;
                await p.Update({
                    money: p.Money,
                    wantedTime: p.Wanted.Time,
                    robberySuccessCount: p.Robbery.SuccessCount,
                });
            }
            // Payout gang share
            gang.Money += baseShare;
            await gang.Update();
            // Deduct from Vault
            if (target.VaultType === "bank") {
                await Vault_js_1.Vault.DeductBankFunds(stolenAmount);
            }
            else {
                await Vault_js_1.Vault.DeductCasinoFunds(stolenAmount);
            }
            // Update stats
            await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
                heistWins: heistState.heistWins + 1,
                totalStolen: heistState.totalStolen + stolenAmount,
            });
            return {
                success: true,
                chance,
                stolenAmount,
                shareAmount: baseShare,
                jailHours: 0,
            };
        }
        else {
            // Failure!
            // Jail time: random 8h to 10h
            const baseJailTime = Math.floor(Math.random() * (10 - 8 + 1) + 8);
            const jailMinutes = baseJailTime * 60;
            for (const p of players) {
                await Prison_js_1.Prison.Arrest(p, jailMinutes);
            }
            await GangHeistRepository_1.GangHeistRepository.Update(gang.Id, {
                heistLosses: heistState.heistLosses + 1,
            });
            return {
                success: false,
                chance,
                stolenAmount: 0,
                shareAmount: 0,
                jailHours: baseJailTime,
            };
        }
    }
}
exports.Heist = Heist;
//# sourceMappingURL=Heist.js.map