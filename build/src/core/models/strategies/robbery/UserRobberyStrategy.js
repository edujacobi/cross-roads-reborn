"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strings = exports.UserRobberyStrategy = void 0;
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Event_1 = require("#core/models/Event");
const Language_1 = require("#core/models/Language");
const Notification_1 = require("#core/models/Notification");
const Classes_1 = require("#core/types/Classes");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
const Jobs_1 = require("#core/types/Jobs");
const Locations_1 = require("#core/types/Locations");
const Robbery_1 = require("#core/types/Robbery");
const Scavenge_1 = require("#core/types/Scavenge");
const log_1 = require("#shared/log");
const utils_1 = require("#shared/utils");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
const Prison_1 = require("#core/models/Prison");
class UserRobberyStrategy {
    Attacker;
    Defender;
    Date;
    Type = Robbery_1.ClashType.User;
    Success = false;
    MoneyRobbed = 0;
    Chance = 0;
    AttackerTimeInPrison = 0;
    AttackerAditionalTimeCallPolice = 0;
    DefenderTimeInHospital = 0;
    BeatUpChance = 0.25;
    UsedConsumables = [];
    constructor(attacker, defender) {
        this.Attacker = attacker;
        this.Defender = defender;
        this.Date = new Date();
    }
    async CanRob() {
        const s = exports.Strings[this.Attacker.Language];
        let canRob = true;
        let message = "";
        if (this.Defender.Id === this.Attacker.Id) {
            message = `${s.sameId} ${emotes_1.EmoteString.Robbery}`;
            canRob = false;
        }
        if (this.Defender.GangId && this.Attacker.GangId && this.Defender.GangId === this.Attacker.GangId) {
            message = `${s.sameGang} ${emotes_1.EmoteString.Robbery}`;
            canRob = false;
        }
        if (!this.Defender.Nickname) {
            message = `${s.withoutNick} ${emotes_1.EmoteString.Robbery}`;
            canRob = false;
        }
        if (this.Defender.Class === Classes_1.ClassId.None) {
            message = `${s.withoutClass} ${emotes_1.EmoteString.Robbery}`;
            canRob = false;
        }
        if (!this.Attacker.BestGun) {
            message = `${s.withoutItem} ${emotes_1.EmoteString.Robbery}`;
            canRob = false;
        }
        if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
            message = s.lowAtk(this.Defender.GetNameWithImage());
            canRob = false;
        }
        const attackerCheck = this.Attacker.CheckAvailability();
        if (!attackerCheck.available) {
            canRob = false;
            switch (attackerCheck.reason) {
                case "scavenging":
                    message = s.scavengingA(attackerCheck.referenceId);
                    break;
                case "working":
                    message = s.inJob(attackerCheck.time, attackerCheck.referenceId);
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
        if (canRob) {
            const defenderCheck = this.Defender.CheckAvailability(["prison", "hospital", "wanted", "escaping", "working"]);
            if (!defenderCheck.available) {
                canRob = false;
                const defName = this.Defender.GetNameWithImage();
                switch (defenderCheck.reason) {
                    case "scavenging":
                        message = `**${defName}** ${s.scavengingD(defenderCheck.referenceId)}`;
                        break;
                    case "casino":
                        message = `**${defName}** ${s.casinoDefender}`;
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
        return { canRob, message };
    }
    async LockStates(useGrenade = false) {
        if (useGrenade) {
            const consumed = await this.Attacker.ConsumeItem(Ids_1.ItemId.Grenade);
            if (consumed) {
                this.UsedConsumables.push(Ids_1.ItemId.Grenade);
                await this.Attacker.GetAttributes(false, this.UsedConsumables);
            }
        }
        this.AttackerTimeInPrison = 10 + 1.5 * this.Attacker.Attributes.Attack;
        this.AttackerAditionalTimeCallPolice = Math.floor(25 + 0.5 * this.Attacker.Attributes.Attack);
        this.DefenderTimeInHospital = 25 + this.Defender.Attributes.Defense / 2;
        if (this.Defender.Attributes.Defense <= 0) {
            this.Attacker.Attributes.Attack *= 1.35;
        }
        this.Attacker.Robbery.IsRobbingId = this.Defender.Id;
        this.Defender.Robbery.IsBeingRobbedById = this.Attacker.Id;
        await Promise.all([
            this.Attacker.Update({
                robbingUserId: this.Attacker.Robbery.IsRobbingId,
            }),
            this.Defender.Update({
                beingRobbedByUserId: this.Defender.Robbery.IsBeingRobbedById,
            }),
        ]);
        log_1.Log.Info(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) locked states for robbing user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);
        const cannotReact = this.Defender.IsWorking() ||
            this.Defender.IsInPrison() ||
            this.Defender.IsInHospital() ||
            this.Defender.Attributes.Attack === 0;
        const cannotCallPolice = this.Defender.IsInHospital() || this.Defender.Attributes.Defense < 5;
        const usedGunSkin = this.Attacker.GetItemSkin(this.Attacker.BestGun);
        const usedGunName = this.Attacker.BestGun?.Description[this.Defender.Language] || "";
        return {
            attackerTimeInPrison: this.AttackerTimeInPrison,
            attackerAditionalTimeCallPolice: this.AttackerAditionalTimeCallPolice,
            defenderTimeInHospital: this.DefenderTimeInHospital,
            cannotReact,
            cannotCallPolice,
            usedGunSkin,
            usedGunName,
            usedGrenade: this.UsedConsumables.includes(Ids_1.ItemId.Grenade),
        };
    }
    async Resolve(defenderReaction = "nothing") {
        try {
            await Promise.all([
                this.Attacker.GetInfo(),
                this.Defender.GetInfo(),
            ]);
            // Re-apply consumables bonuses because GetInfo resets attributes
            await this.Attacker.GetAttributes(false, this.UsedConsumables);
            if (defenderReaction === "react") {
                this.Defender.Attributes.Defense += 5;
                this.BeatUpChance = 1;
            }
            else if (defenderReaction === "police") {
                this.Defender.Attributes.Defense -= 5;
                this.AttackerTimeInPrison += this.AttackerAditionalTimeCallPolice;
            }
            this.Attacker.Attributes.Attack -= (0, utils_1.getPercent)(this.Defender.Attributes.Defense, this.Attacker.Attributes.Attack);
            this.Chance = Math.random() * 100;
            this.Success = this.Chance < this.Attacker.Attributes.Attack;
            if (this.Success) {
                if (this.Defender.Attributes.Defense > 0) {
                    this.Attacker.Attributes.MoneyAttack -= (0, utils_1.getPercent)(this.Defender.Attributes.MoneyDefense, this.Attacker.Attributes.MoneyAttack);
                }
                this.MoneyRobbed = Math.floor((0, utils_1.getPercent)(this.Attacker.Attributes.MoneyAttack, this.Defender.Money));
                const userClassModifier = (0, Classes_1.getRobberyClassModifier)(this.Attacker.Class);
                this.MoneyRobbed = Math.floor(this.MoneyRobbed * userClassModifier);
                this.Attacker.Money += this.MoneyRobbed;
                this.Attacker.Robbery.SuccessCount += 1;
                this.Attacker.Robbery.SuccessRobbedSum += this.MoneyRobbed;
                const wantedTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.WANTED_TIME_MULTIPLIER);
                this.Attacker.Wanted.Time = (0, date_fns_1.addMinutes)(new Date(), 60 * wantedTimeMultiplier);
                this.Defender.Money -= this.MoneyRobbed;
                this.Defender.Robbery.BeingRobbedCount += 1;
                this.Defender.Robbery.BeingRobbedSum += this.MoneyRobbed;
                const willBeBeatenUp = Math.random() < this.BeatUpChance &&
                    !this.Defender.IsWorking() &&
                    !this.Defender.IsInPrison() &&
                    !this.Defender.IsInHospital();
                if (willBeBeatenUp) {
                    this.Defender.Hospital.Count += 1;
                    const hospitalTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.HOSPITAL_TIME_MULTIPLIER);
                    this.Defender.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), this.DefenderTimeInHospital * hospitalTimeMultiplier);
                    this.Defender.BeatUp.BeatedUpCount += 1;
                    this.Attacker.BeatUp.SuccessCount += 1;
                    await Notification_1.Notification.Hospital(this.Defender);
                }
                await Notification_1.Notification.RobAgain(this.Attacker);
                log_1.Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) successfully robbed user ${this.Defender.Nickname} (Id: ${this.Defender.Id}) and got ${(0, ui_1.formatMoney)(this.MoneyRobbed, Language_1.Language.English)}. ${willBeBeatenUp ? "The defender was beaten up." : ""}`);
                return {
                    success: true,
                    moneyRobbed: this.MoneyRobbed,
                    willBeBeatenUp,
                    attackerWantedTime: this.Attacker.Wanted.Time,
                    defenderHospitalTime: willBeBeatenUp ? this.Defender.Hospital.Time : undefined,
                };
            }
            else {
                await Prison_1.Prison.Arrest(this.Attacker, this.AttackerTimeInPrison);
                await Notification_1.Notification.Free(this.Attacker);
                log_1.Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) failed to rob user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);
                return {
                    success: false,
                    moneyRobbed: 0,
                    willBeBeatenUp: false,
                    attackerPrisonTime: this.Attacker.Prison.Time,
                };
            }
        }
        finally {
            await Promise.all([
                this.Attacker.Update({
                    money: this.Attacker.Money,
                    robberySuccessCount: this.Attacker.Robbery.SuccessCount,
                    robberySuccessRobbedSum: this.Attacker.Robbery.SuccessRobbedSum,
                    wantedTime: this.Attacker.Wanted.Time,
                    beatUpSuccessCount: this.Attacker.BeatUp.SuccessCount,
                }),
                this.Defender.Update({
                    money: this.Defender.Money,
                    robberyBeingRobbedCount: this.Defender.Robbery.BeingRobbedCount,
                    robberyBeingRobbedSum: this.Defender.Robbery.BeingRobbedSum,
                    hospitalCount: this.Defender.Hospital.Count,
                    hospitalTime: this.Defender.Hospital.Time,
                    beatUpBeatedUpCount: this.Defender.BeatUp.BeatedUpCount,
                }),
            ]);
            await RobHistoryRepository_1.RobHistoryRepository.CreateUserRobberyHistory(this);
        }
    }
    async ReleaseLocks() {
        this.Attacker.Robbery.IsRobbingId = null;
        this.Defender.Robbery.IsBeingRobbedById = null;
        await Promise.all([
            this.Attacker.Update({
                robbingUserId: null,
            }),
            this.Defender.Update({
                beingRobbedByUserId: null,
            }),
        ]);
    }
}
exports.UserRobberyStrategy = UserRobberyStrategy;
exports.Strings = {
    [Language_1.Language.English]: {
        sameId: "You can't rob yourself, idiot!",
        sameGang: "You can't rob a member of your own gang!",
        withoutNick: "This user hasn't set a nickname yet!",
        withoutClass: "This user hasn't choose a class yet!",
        withoutItem: "You can't rob without a weapon!",
        lowAtk: (nick) => `You can't rob ${nick} with your current weapons! ${emotes_1.EmoteString.Robbery}\n-# Get a better weapon. You need at least 15 difference!`,
        scavengingA: (placeId) => `You can't rob while scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}** ${emotes_1.EmoteString.Scavenge}`,
        scavengingD: (placeId) => `is scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}**. Wait a few more seconds to start your action! ${emotes_1.EmoteString.Scavenge}`,
        inJob: (jobTime, jobId) => `You can't rob while working! ${emotes_1.EmoteString.Jobs}\n-# Will finish your **${Jobs_1.JobList[jobId].Description[Language_1.Language.English]}** job ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `You can't rob while you're in prison! ${emotes_1.EmoteString.Prison}\n-# Will be released ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (wantedTime) => `You can't rob while you're wanted by the police! ${emotes_1.EmoteString.Police}\n-# Will be able to rob again ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `You can't rob while you're hospitalized! ${emotes_1.EmoteString.Hospital}\n-# Will be healed ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        casinoAttacker: `You can't rob while you're in a casino game! ${emotes_1.EmoteString.Casino}`,
        hands: "Hands up!",
        tryingToRobYou: "is trying to rob you using",
        andAGrenade: `and a ${emotes_1.EmoteString.Granade} **Grenade**`,
        decide: "Decide what to do",
        react: "React",
        reactDescription: (time) => `${emotes_1.EmoteString.Defense}+5 DEF, but you will be hospitalized for ${time} minutes if you get robbed`,
        reacting: "Reacting",
        callPolice: "Call the police",
        callPoliceDescription: (time) => `${emotes_1.EmoteString.Defense}-5 DEF, but he will be inprisoned for ${time} aditional minutes if he fails`,
        callingPolice: "Calling the police",
        doNothing: "Do nothing",
        doNothingDescription: "No additional effect",
        doingNothing: "Doing nothing",
        secondsToRespond: "You have 60 seconds to respond",
        wereRobbed: (formattedMoney, attackerNick) => `You were robbed and lost ${formattedMoney} to **${attackerNick}**!`,
        beatedUp: (date) => `You were beaten up and will be hospitalized until ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        robFailed: "tried to rob you, but the police caught him!",
        prisonUntil: (date) => `He will be in prison until ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyDefender: "Robbery finished",
        casinoDefender: `is in a casino game and cannot be robbed! ${emotes_1.EmoteString.Casino}`,
        robberyInProgress: `Robbery in progress`,
        tryingToRob: "Trying to rob",
        isReacting: "is reacting",
        isCallingPolice: "is calling the police",
        isDoingNothing: "is doing nothing",
        success: "Success",
        failure: "Failure",
        willBeAbleAgain: "Will be able to rob again",
        beatenUp: (date) => `You beat him up and he will be hospitalized until ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        youFailed: "You failed in your attempt",
        prisonTime: (date) => `Will be in prison until ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyAttacker: (success) => `Robbery ${success ? "successful" : "unsuccessful"}`,
        preparingToRob: (nick) => `Preparing to rob **${nick}**`,
        useGrenadeDescription: (quantity) => `You have ${quantity} ${quantity === 1 ? "grenade" : "grenades"}`,
        useGrenade: "Use Grenade",
        useGrenadeEffect: `${emotes_1.EmoteString.Attack}+${Items_1.ItemList[Ids_1.ItemId.Grenade].MoreAttack} ATK`,
        dontUseGrenade: "Don't use",
        dontUseGrenadeDescription: "Save it for later",
        failureMessages: [
            "The police arrived faster than you anticipated.",
            "Someone saw your gun, reacted, and drew everyone's attention.",
            "A bystander intervened and called the authorities.",
            "You heard sirens nearby and panicked.",
            "Security cameras caught your face, forcing you to run.",
            "You forgot to load your weapon. Rookie mistake.",
            "You had stolen so much money that you fainted with joy.",
            "You tried to look cool but just ended up looking suspicious to a nearby cop.",
            "A rabid stray dog attacked you, giving the police time to arrive.",
            "While trying to escape, you tripped and dropped all the money.",
        ],
        successMessages: [
            (formattedMoney, defenderNick) => `You robbed ${formattedMoney} from **${defenderNick}**!`,
            (formattedMoney, defenderNick) => `Easy money! You took ${formattedMoney} from **${defenderNick}**.`,
            (formattedMoney, defenderNick) => `**${defenderNick}** didn't stand a chance. You got away with ${formattedMoney}!`,
            (formattedMoney, defenderNick) => `Another successful heist! You pocketed ${formattedMoney} from **${defenderNick}**.`,
            (formattedMoney, defenderNick) => `You now have ${formattedMoney} more, courtesy of **${defenderNick}**.`,
        ],
    },
    [Language_1.Language.Portuguese]: {
        sameId: "Você não pode roubar a si mesmo, idiota!",
        sameGang: "Você não pode roubar um membro da sua própria gangue!",
        withoutNick: "Este usuário ainda não cadastrou um nickname!",
        withoutClass: "Este usuário ainda não escolheu uma classe!",
        withoutItem: "Você não pode roubar sem uma arma!",
        lowAtk: (nick) => `Você não pode roubar ${nick} usando suas armas atuais! ${emotes_1.EmoteString.Robbery}\n-# Consiga uma arma melhor. Você precisa de no mínimo 15 de diferença!`,
        scavengingA: (placeId) => `Você não pode roubar enquanto está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}** ${emotes_1.EmoteString.Scavenge}`,
        scavengingD: (placeId) => `está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}**. Espere mais alguns segundos para iniciar sua ação! ${emotes_1.EmoteString.Scavenge}`,
        inJob: (jobTime, jobId) => `Você não pode roubar enquanto está trabalhando! ${emotes_1.EmoteString.Jobs}\n-# Terminará seu trabalho de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Portuguese]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `Você não pode roubar enquanto está preso! ${emotes_1.EmoteString.Prison}\n-# Será solto ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (wantedTime) => `Você não pode roubar enquanto está sendo procurado pela polícia! ${emotes_1.EmoteString.Police}\n-# Poderá roubar novamente ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `Você não pode roubar enquanto está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        casinoAttacker: `Você não pode roubar enquanto está em um jogo de cassino! ${emotes_1.EmoteString.Casino}`,
        hands: "Mãos ao alto!",
        tryingToRobYou: "está tentando roubar você utilizando",
        andAGrenade: `e uma ${emotes_1.EmoteString.Granade} **Granada**`,
        decide: "Decida o que fazer",
        react: "Reagir",
        reactDescription: (time) => `${emotes_1.EmoteString.Defense}+5 DEF, mas você ficará hospitalizado por ${time} minutos caso seja roubado`,
        reacting: "Reagindo",
        callPolice: "Chamar a polícia",
        callPoliceDescription: (time) => `${emotes_1.EmoteString.Defense}-5 DEF, mas ele ficará preso por ${time} minutos adicionais caso falhe`,
        callingPolice: "Chamando a polícia",
        doNothing: "Não fazer nada",
        doNothingDescription: "Nenhum efeito adicional",
        doingNothing: "Fazendo nada",
        secondsToRespond: "Você tem 60 segundos para responder",
        wereRobbed: (formattedMoney, attackerNick) => `Você foi roubado e perdeu ${formattedMoney} para **${attackerNick}**!`,
        beatedUp: (date) => `Você tomou uma coça e ficará hospitalizado até ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        robFailed: "tentou lhe roubar, mas a polícia o capturou!",
        prisonUntil: (date) => `Ele ficará preso até ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyDefender: "Roubo finalizado",
        casinoDefender: `está em um jogo de cassino e não pode ser roubado! ${emotes_1.EmoteString.Casino}`,
        robberyInProgress: `Roubo em andamento`,
        tryingToRob: "Tentando roubar",
        isReacting: "está reagindo",
        isCallingPolice: "está chamando a polícia",
        isDoingNothing: "não está fazendo nada",
        success: "Sucesso",
        failure: "Falha",
        willBeAbleAgain: "Poderá roubar novamente",
        beatenUp: (date) => `Você detonou e ele ficará hospitalizado até ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        youFailed: "Você falhou na sua tentativa",
        prisonTime: (date) => `Ficará preso até ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyAttacker: (success) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
        preparingToRob: (nick) => `Preparando-se para roubar **${nick}**`,
        useGrenadeDescription: (quantity) => `Você tem ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
        useGrenade: "Usar Granada",
        useGrenadeEffect: `${emotes_1.EmoteString.Attack}+${Items_1.ItemList[Ids_1.ItemId.Grenade].MoreAttack} ATK`,
        dontUseGrenade: "Não usar",
        dontUseGrenadeDescription: "Guardar para depois",
        failureMessages: [
            "A polícia chegou mais rápido do que você esperava.",
            "Uma pessoa viu sua arma, reagiu e chamou a atenção de todos.",
            "Uma testemunha interveio e chamou as autoridades.",
            "Você ouviu sirenes próximas e entrou em pânico.",
            "Câmeras de segurança flagraram seu rosto, forçando você a fugir.",
            "Você esqueceu de carregar sua arma. Erro de principiante.",
            "Você havia roubado tanto dinheiro que desmaiou de alegria.",
            "Você tentou parecer durão, mas acabou parecendo suspeito para um guarda próximo.",
            "Um cão de rua raivoso te atacou, dando tempo para a polícia chegar.",
            "Enquanto tentava fugir, você tropeçou e deixou cair toda a grana.",
        ],
        successMessages: [
            (formattedMoney, defenderNick) => `Você roubou ${formattedMoney} de **${defenderNick}**!`,
            (formattedMoney, defenderNick) => `Dinheiro fácil! Você pegou ${formattedMoney} de **${defenderNick}**.`,
            (formattedMoney, defenderNick) => `**${defenderNick}** não teve chance. Você escapou com ${formattedMoney}!`,
            (formattedMoney, defenderNick) => `Mais um roubo bem-sucedido! Você embolsou ${formattedMoney} de **${defenderNick}**.`,
            (formattedMoney, defenderNick) => `Você agora tem ${formattedMoney} a mais, cortesia de **${defenderNick}**.`,
        ],
    },
    [Language_1.Language.Spanish]: {
        sameId: "¡No puedes robarte a ti mesmo, idiota!",
        sameGang: "¡No puedes robar a un miembro de tu propia cuadrilla!",
        withoutNick: "¡Este usuario aún no ha establecido un apodo!",
        withoutClass: "¡Este usuario aún no ha elegido una clase!",
        withoutItem: "¡No puedes robar sin un arma!",
        lowAtk: (nick) => `¡No puedes robar a ${nick} con tus armas actuales! ${emotes_1.EmoteString.Robbery}\n-# Consigue un arma mejor. ¡Necesitas al menos 15 de diferencia!`,
        scavengingA: (placeId) => `No puedes robar mientras estás buscando en ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}** ${emotes_1.EmoteString.Scavenge}`,
        scavengingD: (placeId) => `está buscando en ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}**. ¡Espere unos segundos más para iniciar su acción! ${emotes_1.EmoteString.Scavenge}`,
        inJob: (jobTime, jobId) => `¡No puedes robar mientras trabajas! ${emotes_1.EmoteString.Jobs}\n-# ¡Terminará tu trabajo de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Spanish]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `¡No puedes robar mientras estás en prisión! ${emotes_1.EmoteString.Prison}\n-# Será liberado ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (wantedTime) => `¡No puedes robar mientras estás siendo buscado por la policía! ${emotes_1.EmoteString.Police}\n-# Podrá robar nuevamente ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `¡No puedes robar mientras estás hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# ¡Será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        casinoAttacker: `¡No puedes robar mientras estás en un juego de casino! ${emotes_1.EmoteString.Casino}`,
        hands: "¡Manos arriba!",
        tryingToRobYou: "está intentando robarte utilizando",
        andAGrenade: `y una ${emotes_1.EmoteString.Granade} **Granada**`,
        decide: "Decide qué hacer",
        react: "Reaccionar",
        reactDescription: (time) => `${emotes_1.EmoteString.Defense}+5 DEF, pero estarás hospitalizado por ${time} minutos si te roban`,
        reacting: "Reaccionando",
        callPolice: "Llamar a la policía",
        callPoliceDescription: (time) => `${emotes_1.EmoteString.Defense}-5 DEF, pero estará en prisión por ${time} minutos adicionales si falla`,
        callingPolice: "Llamando a la policía",
        doNothing: "No hacer nada",
        doNothingDescription: "Ningún efecto adicional",
        doingNothing: "Haciendo nada",
        secondsToRespond: "Tienes 60 segundos para responder",
        wereRobbed: (formattedMoney, attackerNick) => `¡Fuiste robado y perdiste ${formattedMoney} con **${attackerNick}**!`,
        beatedUp: (date) => `Fuiste golpeado y estarás hospitalizado hasta ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        robFailed: "intentó robarte, ¡pero la policía lo atrapó!",
        prisonUntil: (date) => `Estará en prisión hasta ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyDefender: "Robo finalizado",
        casinoDefender: `está en un juego de casino y no puede ser robado! ${emotes_1.EmoteString.Casino}`,
        robberyInProgress: `Robo en progreso`,
        tryingToRob: "Intentando robar",
        isReacting: "está reaccionando",
        isCallingPolice: "está llamando a la policía",
        isDoingNothing: "no está haciendo nada",
        success: "Éxito",
        failure: "Fracaso",
        willBeAbleAgain: "Podrás robar de nuevo",
        beatenUp: (date) => `Lo golpeaste y estará hospitalizado hasta ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        youFailed: `Fallaste en tu intento`,
        prisonTime: (date) => `Estará en prisión hasta ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyAttacker: (success) => `Robo ${success ? "exitoso" : "fallido"}`,
        preparingToRob: (nick) => `Preparándose para robar a **${nick}**`,
        useGrenadeDescription: (quantity) => `Tienes ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
        useGrenade: "Usar Granada",
        useGrenadeEffect: `${emotes_1.EmoteString.Attack}+${Items_1.ItemList[Ids_1.ItemId.Grenade].MoreAttack} ATK`,
        dontUseGrenade: "No usar",
        dontUseGrenadeDescription: "Guardar para después",
        failureMessages: [
            "La policía llegó más rápido de lo que esperabas.",
            "Alguien vio tu arma, reaccionó y atrajo la atención de todos.",
            "Un transeúnte intervino y llamó a las autoridades.",
            "Escuchaste sirenas cerca y entraste en pánico.",
            "Las cámaras de seguridad captaron tu rostro, obligándote a huir.",
            "Olvidaste cargar tu arma. Error de novato.",
            "Habías robado tanto dinero que te desmayaste de alegría.",
            "Intentaste parecer rudo pero terminaste pareciendo sospechoso para un policía cercano.",
            "Un perro callejero rabioso te atacou, lo que le dio tiempo a la policía para que llegara.",
            "Al intentar escapar, tropezaste y se te cayó todo el dinero.",
        ],
        successMessages: [
            (formattedMoney, defenderNick) => `¡Robaste ${formattedMoney} de **${defenderNick}**!`,
            (formattedMoney, defenderNick) => `¡Dinero fácil! Le quitaste ${formattedMoney} a **${defenderNick}**.`,
            (formattedMoney, defenderNick) => `**${defenderNick}** no tuvo ninguna oportunidad. ¡Te escapaste con ${formattedMoney}!`,
            (formattedMoney, defenderNick) => `¡Otro atraco exitoso! Te embolsaste ${formattedMoney} de **${defenderNick}**.`,
            (formattedMoney, defenderNick) => `Ahora tienes ${formattedMoney} más, cortesía de **${defenderNick}**.`,
        ],
    },
};
//# sourceMappingURL=UserRobberyStrategy.js.map