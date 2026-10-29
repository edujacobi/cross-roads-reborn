"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strings = exports.BeatUp = void 0;
const log_1 = require("#shared/log");
const Notification_1 = require("./Notification");
const date_fns_1 = require("date-fns");
const Language_1 = require("./Language");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Classes_1 = require("#core/types/Classes");
const Jobs_1 = require("#core/types/Jobs");
const Locations_1 = require("#core/types/Locations");
const Scavenge_1 = require("#core/types/Scavenge");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
const emotes_1 = require("#bot/utils/emotes");
const discord_js_1 = require("discord.js");
class BeatUp {
    Id = 0;
    Attacker;
    Defender;
    TimeInHospital = {
        Base: 0,
        Aditional: 0,
    };
    Date;
    Success = false;
    UsedConsumables = [];
    constructor(attacker, defender) {
        this.Attacker = attacker;
        this.Defender = defender;
        this.Date = new Date();
        this.Attacker.GetAttributes(true);
        this.Defender.GetAttributes(true);
    }
    async CanBeatUser() {
        const s = exports.Strings[this.Attacker.Language];
        let canBeat = true;
        let message = "";
        if (this.Defender.Id === this.Attacker.Id) {
            message = s.sameId;
            canBeat = false;
        }
        if (this.Defender.GangId && this.Attacker.GangId && this.Defender.GangId === this.Attacker.GangId) {
            message = s.sameGang;
            canBeat = false;
        }
        if (!this.Defender.Nickname) {
            message = s.withoutNick;
            canBeat = false;
        }
        if (this.Defender.Class === Classes_1.ClassId.None) {
            message = s.withoutClass;
            canBeat = false;
        }
        if (!this.Attacker.BestGun) {
            message = s.withoutItem;
            canBeat = false;
        }
        if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
            message = s.lowAtk(this.Defender.GetNameWithImage());
            canBeat = false;
        }
        if (this.Attacker.BeatUp.Time > new Date()) {
            message = s.isWaitingBeat(this.Attacker.BeatUp.Time);
            canBeat = false;
        }
        if (canBeat) {
            const bothInPrison = this.Attacker.IsInPrison() && this.Defender.IsInPrison();
            const attackerIgnore = bothInPrison ? ["prison"] : [];
            const attackerCheck = this.Attacker.CheckAvailability(attackerIgnore);
            if (!attackerCheck.available) {
                canBeat = false;
                switch (attackerCheck.reason) {
                    case "scavenging":
                        message = s.scavengingA(attackerCheck.referenceId);
                        break;
                    case "working":
                        message = s.inJobA(attackerCheck.time, attackerCheck.referenceId);
                        break;
                    case "prison":
                        message = s.inPrison(attackerCheck.time);
                        break;
                    case "wanted":
                        message = s.isWanted(attackerCheck.time);
                        break;
                    case "hospital":
                        message = s.isInHospital(attackerCheck.time);
                        break;
                    case "escaping":
                        message = s.isEscapingA;
                        break;
                    case "casino":
                        message = s.casinoAttacker;
                        break;
                    case "defendingInvestment":
                        message = Language_1.globalStrings[this.Attacker.Language].attackerIsDefendingInvestment;
                        break;
                    case "gangAction":
                        message = Language_1.globalStrings[this.Attacker.Language].attackerIsParticipatingInGangAction;
                        break;
                    case "beating": {
                        const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                        message = Language_1.globalStrings[this.Attacker.Language].attackerIsBeatingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                        break;
                    }
                    case "beingBeatUp": {
                        const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                        message = Language_1.globalStrings[this.Attacker.Language].attackerIsBeingBeatedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                        break;
                    }
                    case "robbing": {
                        const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                        message = Language_1.globalStrings[this.Attacker.Language].attackerIsRobbingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                        break;
                    }
                    case "beingRobbed": {
                        const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                        message = Language_1.globalStrings[this.Attacker.Language].attackerIsBeingRobbedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                        break;
                    }
                    case "robbingLocation": {
                        const location = Locations_1.LocationList[attackerCheck.referenceId];
                        message = Language_1.globalStrings[this.Attacker.Language].attackerIsRobbingId(location.Name[this.Attacker.Language]);
                        break;
                    }
                }
            }
        }
        if (canBeat) {
            const bothInPrison = this.Attacker.IsInPrison() && this.Defender.IsInPrison();
            const defenderIgnore = bothInPrison ? ["prison", "wanted"] : ["wanted"];
            const defenderCheck = this.Defender.CheckAvailability(defenderIgnore);
            if (!defenderCheck.available) {
                canBeat = false;
                const defName = this.Defender.GetNameWithImage();
                switch (defenderCheck.reason) {
                    case "scavenging":
                        message = `**${defName}** ${s.scavengingD(defenderCheck.referenceId)}`;
                        break;
                    case "working":
                        message = `**${defName}** ${s.inJobD(defenderCheck.time, defenderCheck.referenceId)}`;
                        break;
                    case "prison":
                        message = `**${defName}** ${s.inPrisonDefender(defenderCheck.time)}`;
                        break;
                    case "hospital":
                        message = s.isInHospitalDefender(defName, defenderCheck.time);
                        break;
                    case "escaping":
                        message = `**${defName}** ${s.isEscapingD}`;
                        break;
                    case "casino":
                        message = `${defName} ${s.casinoDefender}`;
                        break;
                    case "defendingInvestment":
                        message = Language_1.globalStrings[this.Attacker.Language].defenderIsDefendingInvestment(defName);
                        break;
                    case "gangAction":
                        message = Language_1.globalStrings[this.Attacker.Language].defenderIsParticipatingInGangAction(defName);
                        break;
                    case "beating": {
                        const user = await UserRepository_1.UserRepository.FindById(defenderCheck.targetId, ["class", "nickname"]);
                        message = `**${defName}** ${Language_1.globalStrings[this.Attacker.Language].defenderIsBeatingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`)}`;
                        break;
                    }
                    case "beingBeatUp": {
                        const user = await UserRepository_1.UserRepository.FindById(defenderCheck.targetId, ["class", "nickname"]);
                        message = `**${defName}** ${Language_1.globalStrings[this.Attacker.Language].defenderIsBeingBeatedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`)}`;
                        break;
                    }
                    case "robbing": {
                        const user = await UserRepository_1.UserRepository.FindById(defenderCheck.targetId, ["class", "nickname"]);
                        message = `**${defName}** ${Language_1.globalStrings[this.Attacker.Language].defenderIsRobbingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`)}`;
                        break;
                    }
                    case "beingRobbed": {
                        const user = await UserRepository_1.UserRepository.FindById(defenderCheck.targetId, ["class", "nickname"]);
                        message = `**${defName}** ${Language_1.globalStrings[this.Attacker.Language].defenderIsBeingRobbedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`)}`;
                        break;
                    }
                    case "robbingLocation": {
                        const location = Locations_1.LocationList[defenderCheck.referenceId];
                        message = `**${defName}** ${Language_1.globalStrings[this.Attacker.Language].defenderIsRobbingId(location.Name[this.Attacker.Language])}`;
                        break;
                    }
                }
            }
        }
        return { canBeat, message };
    }
    async LockStates(useGrenade) {
        if (useGrenade) {
            const consumed = await this.Attacker.ConsumeItem(Ids_1.ItemId.Grenade);
            if (consumed) {
                this.UsedConsumables.push(Ids_1.ItemId.Grenade);
                await this.Attacker.GetAttributes(true, this.UsedConsumables);
            }
        }
        this.TimeInHospital = {
            Base: 45 + this.Defender.Attributes.Attack,
            Aditional: 5 + this.Defender.Attributes.Attack,
        };
        if (this.Defender.Attributes.Defense <= 0) {
            this.Attacker.Attributes.Attack *= 1.35;
        }
        this.Attacker.BeatUp.IsBeatingId = this.Defender.Id;
        this.Defender.BeatUp.IsBeingBeatUpById = this.Attacker.Id;
        await Promise.all([
            this.Attacker.Update({
                beatingUserId: this.Attacker.BeatUp.IsBeatingId,
            }),
            this.Defender.Update({
                beingBeatUpByUserId: this.Defender.BeatUp.IsBeingBeatUpById,
            }),
        ]);
        log_1.Log.Info(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) locked states for beating up user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);
        const cannotRun = this.Defender.Attributes.Attack < 5;
        const usedGunSkin = this.Attacker.GetItemSkin(this.Attacker.BestGun);
        const usedGunName = this.Attacker.BestGun?.Description[this.Defender.Language] || "";
        return {
            cannotRun,
            usedGunSkin,
            usedGunName,
            usedGrenade: this.UsedConsumables.includes(Ids_1.ItemId.Grenade),
            timeInHospitalBase: this.TimeInHospital.Base,
            timeInHospitalAditional: this.TimeInHospital.Aditional,
        };
    }
    async Resolve(defenderReaction) {
        try {
            await Promise.all([
                this.Attacker.GetInfo(),
                this.Defender.GetInfo(),
            ]);
            await this.Attacker.GetAttributes(true, this.UsedConsumables);
            if (defenderReaction === "fight") {
                this.Defender.Attributes.Attack += 5;
                this.TimeInHospital.Base += this.TimeInHospital.Aditional;
            }
            else if (defenderReaction === "run") {
                this.Defender.Attributes.Attack -= 5;
                this.TimeInHospital.Base -= this.TimeInHospital.Aditional;
            }
            const attackerChance = Math.random() * this.Attacker.Attributes.Attack;
            const defenderChance = Math.random() * this.Defender.Attributes.Attack;
            this.Success = attackerChance > defenderChance;
            if (this.Success) {
                this.Attacker.BeatUp.SuccessCount += 1;
                this.Defender.BeatUp.BeatedUpCount += 1;
                this.Attacker.BeatUp.Time = (0, date_fns_1.addMinutes)(new Date(), 60);
                this.Attacker.Wanted.Time = (0, date_fns_1.addMinutes)(new Date(), 60);
                this.Attacker.Wanted.Count += 1;
                this.Defender.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), this.TimeInHospital.Base);
                this.Defender.Hospital.Count += 1;
                await Promise.all([
                    Notification_1.Notification.Hospital(this.Defender),
                    Notification_1.Notification.BeatAgain(this.Attacker),
                ]);
                log_1.Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) successfully beated user ${this.Defender.Nickname} (Id: ${this.Defender.Id})`);
                return {
                    success: true,
                    attackerBeatUpTime: this.Attacker.BeatUp.Time,
                    defenderHospitalTime: this.Defender.Hospital.Time,
                };
            }
            else {
                this.Attacker.BeatUp.BeatedUpCount += 1;
                this.Attacker.BeatUp.FailureCount += 1;
                this.Defender.BeatUp.SuccessCount += 1;
                this.Attacker.Hospital.Count += 1;
                this.Attacker.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), this.TimeInHospital.Base);
                this.Attacker.BeatUp.Time = (0, date_fns_1.addMinutes)(new Date(), 60);
                await Promise.all([
                    Notification_1.Notification.Hospital(this.Attacker),
                    Notification_1.Notification.BeatAgain(this.Attacker),
                ]);
                log_1.Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) failed to beat user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);
                return {
                    success: false,
                    attackerHospitalTime: this.Attacker.Hospital.Time,
                    attackerBeatUpTime: this.Attacker.BeatUp.Time,
                };
            }
        }
        finally {
            await Promise.all([
                this.Attacker.Update({
                    beatUpBeatedUpCount: this.Attacker.BeatUp.BeatedUpCount,
                    beatUpFailureCount: this.Attacker.BeatUp.FailureCount,
                    beatUpSuccessCount: this.Attacker.BeatUp.SuccessCount,
                    hospitalCount: this.Attacker.Hospital.Count,
                    hospitalTime: this.Attacker.Hospital.Time,
                    beatUpTime: this.Attacker.BeatUp.Time,
                    wantedCount: this.Attacker.Wanted.Count,
                    wantedTime: this.Attacker.Wanted.Time,
                }),
                this.Defender.Update({
                    beatUpBeatedUpCount: this.Defender.BeatUp.BeatedUpCount,
                    beatUpFailureCount: this.Defender.BeatUp.FailureCount,
                    beatUpSuccessCount: this.Defender.BeatUp.SuccessCount,
                    hospitalCount: this.Defender.Hospital.Count,
                    hospitalTime: this.Defender.Hospital.Time,
                    beatUpTime: this.Defender.BeatUp.Time,
                }),
            ]);
            await RobHistoryRepository_1.RobHistoryRepository.CreateUserBeatUpHistory(this);
        }
    }
    async ReleaseLocks() {
        this.Attacker.BeatUp.IsBeatingId = null;
        this.Defender.BeatUp.IsBeingBeatUpById = null;
        await Promise.all([
            this.Attacker.Update({
                beatingUserId: null,
            }),
            this.Defender.Update({
                beingBeatUpByUserId: null,
            }),
        ]);
    }
}
exports.BeatUp = BeatUp;
exports.Strings = {
    [Language_1.Language.English]: {
        sameId: `You can't beat yourself up, idiot! ${emotes_1.EmoteString.Beat}`,
        sameGang: `You can't beat up a member of your own gang! ${emotes_1.EmoteString.Beat}`,
        withoutNick: `This user hasn't set a nickname yet! ${emotes_1.EmoteString.Beat}`,
        withoutClass: `This user hasn't chosen a class yet! ${emotes_1.EmoteString.Beat}`,
        withoutItem: `You can't beat someone up without a weapon! ${emotes_1.EmoteString.Beat}`,
        lowAtk: (nick) => `You can't beat up ${nick} using your current weapons! ${emotes_1.EmoteString.Beat}\n-# Get a better weapon. You need at least 15 difference`,
        scavengingA: (placeId) => `You can't beat someone up while scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}** ${emotes_1.EmoteString.Scavenge}`,
        scavengingD: (placeId) => `is scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}**. Wait a few more seconds to start your action! ${emotes_1.EmoteString.Scavenge}`,
        inJobA: (jobTime, jobId) => `You can't beat someone up while working! ${emotes_1.EmoteString.Jobs}\n-# Will finish your **${Jobs_1.JobList[jobId].Description[Language_1.Language.English]}** job ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inJobD: (jobTime, jobId) => `is working. You won't be able to beat him! ${emotes_1.EmoteString.Jobs}\n-# Will finish his **${Jobs_1.JobList[jobId].Description[Language_1.Language.English]}** job ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `You can't beat someone up while you're in prison! ${emotes_1.EmoteString.Prison}\n-# Will be released ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrisonDefender: (prisonTime) => `is in prison and will be released ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}\n-# You will be able to beat them up if you're in prison too.`,
        isWanted: (wantedTime) => `You can't beat someone up while you're wanted by the police! ${emotes_1.EmoteString.Police}\n-# Will be able to beat someone up again ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `You can't beat someone up while you're hospitalized! ${emotes_1.EmoteString.Hospital}\n-# Will be healed ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospitalDefender: (nickname, hospitalTime) => `You can't beat someone who is hospitalized! ${emotes_1.EmoteString.Hospital}\n-# **${nickname}** will be healed ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWaitingBeat: (beatTime) => `You can beat again ${(0, discord_js_1.time)(beatTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Beat}`,
        isEscapingA: `You are trying to escape and cannot beat up! ${emotes_1.EmoteString.Escape}\n-# Focus!`,
        isEscapingD: `is trying to escape prison and cannot be beaten! ${emotes_1.EmoteString.Escape}`,
        casinoAttacker: `You can't beat someone up while you're in a casino game! ${emotes_1.EmoteString.Casino}`,
        casinoDefender: `is in a casino game and cannot be beaten! ${emotes_1.EmoteString.Casino}`,
        // Defender
        hands: "I'll break your face!",
        tryingToBeatYou: "is trying to beat you up using",
        andAGrenade: `and a ${emotes_1.EmoteString.Granade} **Grenade**`,
        decide: "Decide what to do",
        fight: "Fight",
        fightDescription: (time) => `${emotes_1.EmoteString.Attack}+5 ATK, but whoever gets beaten will stay ${time} more minutes in the hospital`,
        fighting: "Fighting",
        run: "Run",
        runDescription: (time) => `${emotes_1.EmoteString.Attack}-5 ATK, but whoever gets beaten will stay ${time} fewer minutes in the hospital`,
        running: "Running",
        doNothing: "Do nothing",
        doNothingDescription: "No additional effect",
        doingNothing: "Doing nothing",
        secondsToRespond: "You have 45 seconds to respond",
        wereBeated: (attackerNick, date) => `You were beaten up by **${attackerNick}** and will stay in the hospital! ${emotes_1.EmoteString.Hospital}\n-# Will be healed ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        finishedBeatUpDefender: "Beating finished",
        // Attacker
        beatingInProgress: `Beating in progress`,
        tryingToBeatUp: "Trying to beat up",
        isFighting: "wants to fight",
        isRunning: "wants to run",
        isDoingNothing: "is doing nothing",
        youBeated: (defenderNick, date) => {
            const words = [
                "beat up",
                "thrashed",
                "punched hard",
                "kicked the balls of",
                "slaughtered",
                "destroyed",
                "showed who's boss to",
                "battered",
                "tightened",
                "hammered",
                "beat to a pulp",
            ];
            const word = words[Math.round(Math.random() * (words.length - 1))];
            return `You ${word} **${defenderNick}**!\n-# They will stay in the hospital until ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`;
        },
        success: "Success",
        failure: "Failure",
        willBeAbleAgain: "Will be able to beat up again",
        youFailed: (date) => `You tried, but you were the one beaten up!\n-# Will stay in the hospital until ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)} ${emotes_1.EmoteString.Hospital}`,
        finishedBeatUpAttacker: (success) => `Beating ${success ? "successful" : "unsuccessful"}`,
        preparingToBeat: (nick) => `Preparing to beat **${nick}**`,
        useGrenadeDescription: (quantity) => `You have ${quantity} ${quantity === 1 ? "grenade" : "grenades"}`,
        useGrenade: "Use Grenade",
        useGrenadeEffect: `${emotes_1.EmoteString.Attack}+${Items_1.ItemList[Ids_1.ItemId.Grenade].MoreAttack} ATK`,
        dontUseGrenade: "Don't use",
        dontUseGrenadeDescription: "Save it for later",
    },
    [Language_1.Language.Portuguese]: {
        // CanBeat
        sameId: `Você não pode espancar a si mesmo, idiota! ${emotes_1.EmoteString.Beat}`,
        sameGang: `Você não pode espancar um membro da sua própria gangue! ${emotes_1.EmoteString.Beat}`,
        withoutNick: `Este usuário ainda não cadastrou um nickname! ${emotes_1.EmoteString.Beat}`,
        withoutClass: `Este usuário ainda não escolheu uma classe! ${emotes_1.EmoteString.Beat}`,
        withoutItem: `Você não pode espancar sem uma arma! ${emotes_1.EmoteString.Beat}`,
        lowAtk: (nick) => `Você não pode espancar ${nick} usando suas armas atuais! ${emotes_1.EmoteString.Beat}\n-# Consiga uma arma melhor. Você precisa de pelo menos 15 de diferença`,
        scavengingA: (placeId) => `Você não pode espancar enquanto está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}** ${emotes_1.EmoteString.Scavenge}`,
        scavengingD: (placeId) => `está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}**. Espere mais alguns segundos para iniciar sua ação! ${emotes_1.EmoteString.Scavenge}`,
        inJobA: (jobTime, jobId) => `Você não pode espancar enquanto está trabalhando! ${emotes_1.EmoteString.Jobs}\n-# Terminará seu trabalho de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Portuguese]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inJobD: (jobTime, jobId) => `está trabalhando. Você não conseguirá espancá-lo! ${emotes_1.EmoteString.Jobs}\n-# Terminará o trabalho de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Portuguese]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `Você não pode espancar enquanto está preso! ${emotes_1.EmoteString.Prison}\n-# Será solto ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrisonDefender: (prisonTime) => `está preso e será solto ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}\n-# Você conseguirá espancá-lo se estiver preso também.`,
        isWanted: (wantedTime) => `Você não pode espancar enquanto está sendo procurado pela polícia! ${emotes_1.EmoteString.Police}\n-# Poderá espancar novamente ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `Você não pode espancar enquanto está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospitalDefender: (nickname, hospitalTime) => `Você não pode espancar alguém hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# **${nickname}** será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWaitingBeat: (beatTime) => `Você poderá espancar novamente ${(0, discord_js_1.time)(beatTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Beat}`,
        isEscapingA: `Você está tentando escapar da prisão e não pode espancar! ${emotes_1.EmoteString.Escape}\n-# "Foco!"`,
        isEscapingD: `está tentando escapar da prisão e não pode ser espancado! ${emotes_1.EmoteString.Escape}`,
        casinoAttacker: `Você não pode espancar enquanto está em um jogo de cassino! ${emotes_1.EmoteString.Casino}`,
        casinoDefender: `está em um jogo de cassino e não pode ser espancado! ${emotes_1.EmoteString.Casino}`,
        // Defender
        hands: "Vou quebrar a tua cara!",
        tryingToBeatYou: "está tentando espancar você utilizando",
        andAGrenade: `e uma ${emotes_1.EmoteString.Granade} **Granada**`,
        decide: "Decida o que fazer",
        fight: "Lutar",
        fightDescription: (time) => `${emotes_1.EmoteString.Attack}+5 ATK, mas quem apanhar ficará mais ${time} minutos hospitalizado`,
        fighting: "Lutando",
        run: "Correr",
        runDescription: (time) => `${emotes_1.EmoteString.Attack}-5 ATK, mas quem apanhar ficará menos ${time} minutos hospitalizado`,
        running: "Correndo",
        doNothing: "Não fazer nada",
        doNothingDescription: "Nenhum efeito adicional",
        doingNothing: "Fazendo nada",
        secondsToRespond: "Você tem 45 segundos para responder",
        wereBeated: (attackerNick, date) => `Você foi espancado por **${attackerNick}** e ficará hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        finishedBeatUpDefender: "Espancamento finalizado",
        // Attacker
        beatingInProgress: `Espancamento em andamento`,
        tryingToBeatUp: "Tentando espancar",
        isFighting: "quer brigar",
        isRunning: "quer correr",
        isDoingNothing: "não está fazendo nada",
        youBeated: (defenderNick, date) => {
            const words = [
                "espancou",
                "surrou",
                "socou com muita força",
                "chutou as bolas de",
                "trucidou",
                "acabou com a raça de",
                "mostrou quem é que manda para",
                "escadeirou",
                "arrochou",
                "marretou",
                "moeu a pau",
            ];
            const word = words[Math.round(Math.random() * (words.length - 1))];
            return `Você ${word} **${defenderNick}**!\n-# Ele ficará hospitalizado até ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`;
        },
        success: "Sucesso",
        failure: "Falha",
        willBeAbleAgain: "Poderá espancar novamente",
        youFailed: (date) => `Você até tentou, mas o espancado foi você!\n-# Ficará hospitalizado até ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)} ${emotes_1.EmoteString.Hospital}`,
        finishedBeatUpAttacker: (success) => `Espancamento ${success ? "bem" : "mal"}-sucedido`,
        preparingToBeat: (nick) => `Preparando-se para espancar **${nick}**`,
        useGrenadeDescription: (quantity) => `Você tem ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
        useGrenade: "Usar Granada",
        useGrenadeEffect: `${emotes_1.EmoteString.Attack}+${Items_1.ItemList[Ids_1.ItemId.Grenade].MoreAttack} ATK`,
        dontUseGrenade: "Não usar",
        dontUseGrenadeDescription: "Guardar para depois",
    },
    [Language_1.Language.Spanish]: {
        // CanBeat
        sameId: `¡No puedes golpearte a ti mismo, idiota! ${emotes_1.EmoteString.Beat}`,
        sameGang: `¡No puedes golpear a un miembro de tu propia cuadrilla! ${emotes_1.EmoteString.Beat}`,
        withoutNick: `¡Este usuario no ha configurado un apodo todavía! ${emotes_1.EmoteString.Beat}`,
        withoutClass: `¡Este usuario no ha elegido una clase todavía! ${emotes_1.EmoteString.Beat}`,
        withoutItem: `¡No puedes golpear a alguien sin un arma! ${emotes_1.EmoteString.Beat}`,
        lowAtk: (nick) => `¡No puedes golpear a ${nick} usando tus armas actuales! ${emotes_1.EmoteString.Beat}\n-# Consigue un arma mejor. ¡Necesitas al menos 15 de diferencia!`,
        scavengingA: (placeId) => `¡No puedes golpear a alguien mientras buscas en ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}** ${emotes_1.EmoteString.Scavenge}`,
        scavengingD: (placeId) => `está buscando en ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}**. ¡Espera unos segundos más para iniciar tu acción! ${emotes_1.EmoteString.Scavenge}`,
        inJobA: (jobTime, jobId) => `¡No puedes golpear a alguien mientras trabajas! ${emotes_1.EmoteString.Jobs}\n-# Terminarás tu trabajo de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Spanish]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inJobD: (jobTime, jobId) => `está trabajando. ¡No podrás golpearlo! ${emotes_1.EmoteString.Jobs}\n-# Terminará el trabajo de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Spanish]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `¡No puedes golpear a alguien mientras estás en prisión! ${emotes_1.EmoteString.Prison}\n-# Serás liberado ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrisonDefender: (prisonTime) => `está en prisión y será liberado ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}\n-# Podrás golpearlo si tú también estás en prisión.`,
        isWanted: (wantedTime) => `¡No puedes golpear a alguien mientras eres buscado por la policía! ${emotes_1.EmoteString.Police}\n-# Podrás golpear a alguien de nuevo ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `¡No puedes golpear a alguien mientras estás hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Serás curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospitalDefender: (nickname, hospitalTime) => `¡No puedes golpear a alguien que está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# **${nickname}** será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWaitingBeat: (beatTime) => `Puedes golpear de nuevo ${(0, discord_js_1.time)(beatTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Beat}`,
        isEscapingA: `¡Estás intentando escapar de la prisión y no puedes golpear! ${emotes_1.EmoteString.Escape}\n-# "¡Enfócate!"`,
        isEscapingD: `está intentando escapar de la prisión y no puede ser golpeado. ${emotes_1.EmoteString.Escape}`,
        casinoAttacker: `¡No puedes golpear mientras estás en un juego de casino! ${emotes_1.EmoteString.Casino}`,
        casinoDefender: `está en un juego de casino y no puede ser golpeado! ${emotes_1.EmoteString.Casino}`,
        // Defender
        hands: "¡Te voy a romper la cara!",
        tryingToBeatYou: "está intentando golpearte usando",
        andAGrenade: `y una ${emotes_1.EmoteString.Granade} **Granada**`,
        decide: "Decide qué hacer",
        fight: "Luchar",
        fightDescription: (time) => `${emotes_1.EmoteString.Attack}+5 ATK, pero quien sea golpeado permanecerá ${time} minutos más en el hospital`,
        fighting: "Luchando",
        run: "Correr",
        runDescription: (time) => `${emotes_1.EmoteString.Attack}-5 ATK, pero quien sea golpeado permanecerá ${time} minutos menos en el hospital`,
        running: "Corriendo",
        doNothing: "No hacer nada",
        doNothingDescription: "Sin efecto adicional",
        doingNothing: "No haciendo nada",
        secondsToRespond: "Tienes 45 segundos para responder",
        wereBeated: (attackerNick, date) => `¡Fuiste golpeado por **${attackerNick}** y permanecerás en el hospital! ${emotes_1.EmoteString.Hospital}\n-# Serás curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        finishedBeatUpDefender: "Golpiza terminada",
        // Attacker
        beatingInProgress: `Golpiza en progreso`,
        tryingToBeatUp: "Intentando golpear a",
        isFighting: "quiere luchar",
        isRunning: "quiere correr",
        isDoingNothing: "no está haciendo nada",
        youBeated: (defenderNick, date) => {
            const words = [
                "Golpeaste a",
                "Golpeó",
                "Apaleó",
                "Golpeó con fuerza",
                "Pateó las bolas de",
                "Masacró",
                "Acabó con la raza de",
                "Mostró quién manda a",
                "Apretó",
                "Martilló",
                "Molió a golpes",
            ];
            const word = words[Math.round(Math.random() * (words.length - 1))];
            return `¡${word} **${defenderNick}**!\n-# Permanecerá en el hospital hasta ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`;
        },
        success: "Éxito",
        failure: "Fracaso",
        willBeAbleAgain: "Podrás golpear de nuevo",
        youFailed: (date) => `¡Lo intentaste, pero tú fuiste el golpeado!\n-# Permanecerás en el hospital hasta ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)} ${emotes_1.EmoteString.Hospital}`,
        finishedBeatUpAttacker: (success) => `Golpiza ${success ? "exitosa" : "fallida"}`,
        preparingToBeat: (nick) => `Preparándose para golpear a **${nick}**`,
        useGrenadeDescription: (quantity) => `Tienes ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
        useGrenade: "Usar Granada",
        useGrenadeEffect: `${emotes_1.EmoteString.Attack}+${Items_1.ItemList[Ids_1.ItemId.Grenade].MoreAttack} ATK`,
        dontUseGrenade: "No usar",
        dontUseGrenadeDescription: "Guardar para después",
    },
};
//# sourceMappingURL=BeatUp.js.map