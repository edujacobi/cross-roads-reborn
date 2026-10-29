"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.SituationId = void 0;
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const GangMemberRepository_1 = require("#core/repositories/GangMemberRepository");
const UserInvestmentRepository_1 = require("#core/repositories/UserInvestmentRepository");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const AvatarDecorations_1 = require("#core/types/AvatarDecorations");
const BackgroundDecorations_1 = require("#core/types/BackgroundDecorations");
const Classes_1 = require("#core/types/Classes");
const GangBases_1 = require("#core/types/GangBases");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
const Jobs_1 = require("#core/types/Jobs");
const Locations_1 = require("#core/types/Locations");
const Scavenge_1 = require("#core/types/Scavenge");
const Skins_1 = require("#core/types/Skins");
const log_1 = require("#shared/log");
const date_fns_1 = require("date-fns");
const addHours_1 = require("date-fns/addHours");
const Event_1 = require("./Event");
const Language_1 = require("./Language");
const Notification_1 = require("./Notification");
const UserAvatarDecoration_1 = require("./UserAvatarDecoration");
const UserBackgroundDecoration_1 = require("./UserBackgroundDecoration");
const UserBundle_1 = require("./UserBundle");
const Vault_1 = require("./Vault");
const discord_js_1 = require("discord.js");
const Ids_2 = require("#core/types/Ids");
const Drinks_1 = require("#core/types/Drinks");
const utils_1 = require("#shared/utils");
var Ids_3 = require("#core/types/Ids");
Object.defineProperty(exports, "SituationId", { enumerable: true, get: function () { return Ids_3.SituationId; } });
class User {
    static VIP_BASE_PRICE = 5_000; // special coins
    static VIP_PRICE_PER_DAY = 170;
    static VIP_MIN_DAYS = 7;
    Id;
    CreatedAt = new Date();
    UpdatedAt = new Date();
    VipTime = null;
    VipEternal = false;
    Language;
    Nickname = "";
    Money = 0;
    Class = Classes_1.ClassId.None;
    GangId = null;
    SpecialCoin = 0;
    AvatarDecoration = AvatarDecorations_1.AvatarDecorationList[Ids_1.AvatarDecorationId.Default];
    BackgroundDecoration = BackgroundDecorations_1.BackgroundDecorationList[Ids_1.BackgroundDecorationId.Default];
    NicknameChangeCount = 0;
    ClassChangeCount = 0;
    Vote = {
        LastClaim: null,
        Count: 0,
    };
    Daily = {
        CurrentStreak: 0,
        MaxStreak: 0,
        LastReceived: null,
    };
    Job = {
        Id: null,
        EndsIn: new Date(),
        ReceivedSum: 0,
        ReceivedCount: 0,
    };
    Robbery = {
        SuccessCount: 0,
        FailureCount: 0,
        BeingRobbedCount: 0,
        SuccessRobbedSum: 0,
        BeingRobbedSum: 0,
        IsRobbingId: null,
        IsBeingRobbedById: null,
        IsRobbingLocationId: null,
        InvestmentIsDefending: false,
        ParticipatingInGangAction: false,
    };
    Prison = {
        Count: 0,
        BriberySum: 0,
        BriberyCount: 0,
        HasPaidBribe: false,
        Time: new Date(),
    };
    Escape = {
        Count: 0,
        Time: new Date(),
        HasTried: false,
    };
    Wanted = {
        Count: 0,
        Time: new Date(),
    };
    DeadUntil = new Date();
    Hospital = {
        Count: 0,
        TreatmentCount: 0,
        TreatmentSum: 0,
        Time: new Date(),
    };
    Casino = {
        IsInGame: false,
        WinCount: 0,
        LoseCount: 0,
        WinSum: 0,
        LoseSum: 0,
    };
    Shop = {
        SpentSum: 0,
        SpentCount: 0,
    };
    BeatUp = {
        IsBeatingId: null,
        IsBeingBeatUpById: null,
        SuccessCount: 0,
        FailureCount: 0,
        BeatedUpCount: 0,
        Time: new Date(),
    };
    Attributes = {
        Attack: 0,
        Defense: 0,
        MoneyAttack: 0,
        MoneyDefense: 0,
    };
    Situation = {
        Id: 0,
        Simple: "",
        SimpleEmote: "",
        Complex: "",
        ComplexUI: "",
        EmoteId: "",
    };
    BestGun = null;
    Alms = {
        GiveTime: new Date(),
        ReceiveTime: new Date(),
        GivenSum: 0,
        GivenCount: 0,
        ReceivedSum: 0,
        ReceivedCount: 0,
    };
    Scavenge = {
        IsScavengingId: null,
        Count: 0,
        Time: new Date(),
        Found: {
            Total: 0,
            Items: 0,
            MoneyCount: 0,
            MoneySum: 0,
            Failures: 0,
            FailureWithHospital: 0,
            FailureWithPrison: 0,
        },
    };
    Drink = {
        Normal: 0,
        HappyHour: 0,
        DrunkCount: 0,
    };
    Investment = {
        Id: null,
        AccumulatedYield: 0,
        HenchmanEndsAt: null,
        HenchmanHospitalized: false,
        ExpiresAt: null,
        PurchasedAt: null,
        NotifyYield: true,
        TotalProfit: 0,
    };
    Items = [];
    AutomaticGrenade = false;
    /**
     * Creates a new instance of User.
     * @param id The user's Id (usually Discord Id).
     * @param language The user's preferred language.
     */
    constructor(id, language = Language_1.Language.English) {
        this.Id = id;
        this.Language = language;
    }
    /**
     * Creates the user in the database.
     */
    async Create() {
        try {
            await UserRepository_1.UserRepository.Create({
                id: this.Id,
                nickname: this.Nickname,
                money: this.Money,
                class: this.Class,
                language: this.Language,
                dailyStreak: this.Daily.CurrentStreak,
                maxDailyStreak: this.Daily.MaxStreak,
                lastDailyReceived: this.Daily.LastReceived,
                lastVoteClaim: this.Vote.LastClaim,
                voteCount: this.Vote.Count,
                specialCoin: 0,
                avatarDecoration: Ids_1.AvatarDecorationId.Default,
                backgroundDecoration: Ids_1.BackgroundDecorationId.Default,
                casinoIsInGame: false,
                casinoLoseCount: 0,
                casinoLoseSum: 0,
                casinoWinCount: 0,
                casinoWinSum: 0,
                escapeCount: 0,
                escapeHasTried: false,
                wantedCount: 0,
                hospitalCount: 0,
                hospitalTreatmentCount: 0,
                hospitalTreatmentSum: 0,
                jobReceivedCount: 0,
                jobReceivedSum: 0,
                prisonCount: 0,
                prisonBriberyCount: 0,
                prisonBriberySum: 0,
                prisonHasPaidBribe: false,
                robberyBeingRobbedCount: 0,
                robberyBeingRobbedSum: 0,
                robberyFailureCount: 0,
                robberySuccessCount: 0,
                robberySuccessRobbedSum: 0,
                robberyInvestmentDefending: false,
                robberyParticipatingInGangAction: false,
                beatUpSuccessCount: 0,
                beatUpFailureCount: 0,
                beatUpBeatedUpCount: 0,
                shopSpentCount: 0,
                shopSpentSum: 0,
                almsGivenSum: 0,
                almsGivenCount: 0,
                almsReceivedSum: 0,
                almsReceivedCount: 0,
                scavengeCount: 0,
                scavengeFoundTotal: 0,
                scavengeFoundItems: 0,
                scavengeMoneyCount: 0,
                scavengeMoneySum: 0,
                scavengeFailures: 0,
                scavengeFailureWithHospital: 0,
                scavengeFailureWithPrison: 0,
                drinkNormal: 0,
                drinkHappyHour: 0,
                drunkCount: 0,
                notifyInvestmentYield: true,
                investmentTotalProfit: 0,
                nicknameChangeCount: 0,
                classChangeCount: 0,
                automaticGrenade: false,
                deadUntil: null,
            });
            log_1.Log.Success(`User ${this.Id} created.`);
        }
        catch (err) {
            //
        }
    }
    /**
     * Loads user information from the database.
     * @param fromUser Optional Users model instance to load from.
     * @param language Optional language to override.
     * @returns The User instance or null if not found.
     */
    async GetInfo(fromUser, language) {
        let user;
        if (fromUser) {
            user = fromUser;
        }
        else {
            user = await UserRepository_1.UserRepository.FindById(this.Id);
        }
        if (!user) {
            return null;
        }
        this.Id = user.id;
        this.CreatedAt = user.createdAt;
        this.UpdatedAt = user.updatedAt;
        this.VipTime = user.vipTime;
        this.VipEternal = user.vipEternal;
        this.Nickname = user.nickname;
        this.Money = user.money;
        this.Class = user.class;
        this.SpecialCoin = user.specialCoin;
        this.AvatarDecoration = AvatarDecorations_1.AvatarDecorationList[user.avatarDecoration];
        this.BackgroundDecoration = BackgroundDecorations_1.BackgroundDecorationList[user.backgroundDecoration];
        this.NicknameChangeCount = user.nicknameChangeCount;
        this.ClassChangeCount = user.classChangeCount;
        // Verificar se o usuário está em uma gangue
        const gangMember = await GangMemberRepository_1.GangMemberRepository.FindByUserId(this.Id);
        this.GangId = gangMember ? gangMember.gangId : null;
        // Jobs
        this.Job.Id = user.jobId;
        this.Job.EndsIn = new Date(user.jobTime);
        this.Job.ReceivedCount = user.jobReceivedCount;
        this.Job.ReceivedSum = user.jobReceivedSum;
        // Vote
        this.Vote.LastClaim = user.lastVoteClaim;
        this.Vote.Count = user.voteCount;
        // Daily
        this.Daily.CurrentStreak = user.dailyStreak;
        this.Daily.MaxStreak = user.maxDailyStreak;
        this.Daily.LastReceived = user.lastDailyReceived;
        // Robberies
        this.Robbery.SuccessCount = user.robberySuccessCount;
        this.Robbery.FailureCount = user.robberyFailureCount;
        this.Robbery.SuccessRobbedSum = user.robberySuccessRobbedSum;
        this.Robbery.BeingRobbedCount = user.robberyBeingRobbedCount;
        this.Robbery.BeingRobbedSum = user.robberyBeingRobbedSum;
        if (user.robbingUserId) {
            this.Robbery.IsRobbingId = user.robbingUserId;
        }
        if (user.beingRobbedByUserId) {
            this.Robbery.IsBeingRobbedById = user.beingRobbedByUserId;
        }
        this.Robbery.IsRobbingLocationId = user.robbingLocationId;
        this.Robbery.InvestmentIsDefending = user.robberyInvestmentDefending;
        this.Robbery.ParticipatingInGangAction = user.robberyParticipatingInGangAction;
        // Beat-ups
        this.BeatUp.SuccessCount = user.beatUpSuccessCount;
        this.BeatUp.FailureCount = user.beatUpFailureCount;
        this.BeatUp.BeatedUpCount = user.beatUpBeatedUpCount;
        this.BeatUp.Time = new Date(user.beatUpTime);
        if (user.beatingUserId) {
            this.BeatUp.IsBeatingId = user.beatingUserId;
        }
        if (user.beingBeatUpByUserId) {
            this.BeatUp.IsBeingBeatUpById = user.beingBeatUpByUserId;
        }
        // Prison
        this.Prison.Count = user.prisonCount;
        this.Prison.BriberySum = user.prisonBriberySum;
        this.Prison.BriberyCount = user.prisonBriberyCount;
        this.Prison.HasPaidBribe = user.prisonHasPaidBribe;
        this.Prison.Time = new Date(user.prisonTime);
        // Escape
        this.Escape.Count = user.escapeCount;
        this.Escape.Time = new Date(user.escapeTime);
        this.Escape.HasTried = user.escapeHasTried;
        // Wanted
        this.Wanted.Count = user.wantedCount;
        this.Wanted.Time = new Date(user.wantedTime);
        // Dead
        this.DeadUntil = user.deadUntil ? new Date(user.deadUntil) : new Date(0);
        // Hospital
        this.Hospital.Count = user.hospitalCount;
        this.Hospital.Time = user.hospitalTime;
        this.Hospital.TreatmentCount = user.hospitalTreatmentCount;
        this.Hospital.TreatmentSum = user.hospitalTreatmentSum;
        // Casino
        this.Casino.IsInGame = user.casinoIsInGame;
        this.Casino.WinCount = user.casinoWinCount;
        this.Casino.LoseCount = user.casinoLoseCount;
        this.Casino.WinSum = user.casinoWinSum;
        this.Casino.LoseSum = user.casinoLoseSum;
        // Shop
        this.Shop.SpentSum = user.shopSpentSum;
        this.Shop.SpentCount = user.shopSpentCount;
        // Alms
        this.Alms.GiveTime = user.almsGiveTime;
        this.Alms.ReceiveTime = user.almsReceiveTime;
        this.Alms.GivenSum = user.almsGivenSum;
        this.Alms.GivenCount = user.almsGivenCount;
        this.Alms.ReceivedSum = user.almsReceivedSum;
        this.Alms.ReceivedCount = user.almsReceivedCount;
        // Scavenge
        this.Scavenge.IsScavengingId = user.scavengingId;
        this.Scavenge.Count = user.scavengeCount;
        this.Scavenge.Time = user.scavengeTime;
        this.Scavenge.Found.Total = user.scavengeFoundTotal;
        this.Scavenge.Found.Items = user.scavengeFoundItems;
        this.Scavenge.Found.MoneyCount = user.scavengeMoneyCount;
        this.Scavenge.Found.MoneySum = user.scavengeMoneySum;
        this.Scavenge.Found.Failures = user.scavengeFailures;
        this.Scavenge.Found.FailureWithHospital = user.scavengeFailureWithHospital;
        this.Scavenge.Found.FailureWithPrison = user.scavengeFailureWithPrison;
        // Drink
        this.Drink.Normal = user.drinkNormal;
        this.Drink.HappyHour = user.drinkHappyHour;
        this.Drink.DrunkCount = user.drunkCount;
        // Investment
        const investment = await UserInvestmentRepository_1.UserInvestmentRepository.FindByUserId(this.Id);
        if (investment) {
            this.Investment.Id = investment.investmentId;
            this.Investment.AccumulatedYield = investment.accumulatedYield;
            this.Investment.HenchmanEndsAt = investment.henchmanEndsAt;
            this.Investment.HenchmanHospitalized = investment.henchmanHospitalized;
            this.Investment.ExpiresAt = investment.expiresAt;
            this.Investment.PurchasedAt = investment.createdAt;
        }
        else {
            this.Investment.Id = null;
            this.Investment.AccumulatedYield = 0;
            this.Investment.HenchmanEndsAt = null;
            this.Investment.HenchmanHospitalized = false;
            this.Investment.ExpiresAt = null;
            this.Investment.PurchasedAt = null;
        }
        this.Investment.NotifyYield = user.notifyInvestmentYield;
        this.Investment.TotalProfit = user.investmentTotalProfit;
        this.AutomaticGrenade = user.automaticGrenade;
        await Promise.all([
            this.GetSituation(language),
            this.GetItems(),
        ]);
        // After GetItems
        await this.GetAttributes();
        this.Language = user.language;
        return this;
    }
    /**
     * Loads basic user information from the database without expensive lookups.
     * @param fromUser Optional Users model instance to load from.
     * @param language Optional language to override.
     * @returns The User instance or null if not found.
     */
    async GetSimpleInfo(fromUser, language, options) {
        let user;
        if (fromUser) {
            user = fromUser;
        }
        else {
            user = await UserRepository_1.UserRepository.FindById(this.Id);
        }
        if (!user) {
            return null;
        }
        this.Id = user.id;
        if (user.nickname !== undefined)
            this.Nickname = user.nickname;
        if (user.money !== undefined)
            this.Money = user.money;
        if (user.class !== undefined)
            this.Class = user.class;
        if (user.specialCoin !== undefined)
            this.SpecialCoin = user.specialCoin;
        if (user.avatarDecoration !== undefined)
            this.AvatarDecoration = AvatarDecorations_1.AvatarDecorationList[user.avatarDecoration];
        if (user.backgroundDecoration !== undefined)
            this.BackgroundDecoration = BackgroundDecorations_1.BackgroundDecorationList[user.backgroundDecoration];
        if (user.language !== undefined)
            this.Language = user.language;
        if (user.vipTime !== undefined)
            this.VipTime = user.vipTime;
        if (user.vipEternal !== undefined)
            this.VipEternal = user.vipEternal;
        if (user.createdAt !== undefined)
            this.CreatedAt = user.createdAt;
        if (user.updatedAt !== undefined)
            this.UpdatedAt = user.updatedAt;
        // Idling status fields mapping
        if (user.jobId !== undefined)
            this.Job.Id = user.jobId;
        if (user.prisonTime !== undefined)
            this.Prison.Time = user.prisonTime ? new Date(user.prisonTime) : new Date(0);
        if (user.hospitalTime !== undefined)
            this.Hospital.Time = user.hospitalTime ? new Date(user.hospitalTime) : new Date(0);
        if (user.scavengingId !== undefined)
            this.Scavenge.IsScavengingId = user.scavengingId;
        if (user.casinoIsInGame !== undefined)
            this.Casino.IsInGame = user.casinoIsInGame;
        if (user.robbingUserId !== undefined)
            this.Robbery.IsRobbingId = user.robbingUserId;
        if (user.robbingLocationId !== undefined)
            this.Robbery.IsRobbingLocationId = user.robbingLocationId;
        if (user.beingRobbedByUserId !== undefined)
            this.Robbery.IsBeingRobbedById = user.beingRobbedByUserId;
        if (user.beatingUserId !== undefined)
            this.BeatUp.IsBeatingId = user.beatingUserId;
        if (user.beingBeatUpByUserId !== undefined)
            this.BeatUp.IsBeingBeatUpById = user.beingBeatUpByUserId;
        if (user.robberyInvestmentDefending !== undefined)
            this.Robbery.InvestmentIsDefending = user.robberyInvestmentDefending;
        if (user.robberyParticipatingInGangAction !== undefined)
            this.Robbery.ParticipatingInGangAction = user.robberyParticipatingInGangAction;
        if (user.automaticGrenade !== undefined)
            this.AutomaticGrenade = user.automaticGrenade;
        // Verificar se o usuário está em uma gangue
        if (!options?.skipGangLookup) {
            const gangMember = await GangMemberRepository_1.GangMemberRepository.FindByUserId(this.Id);
            this.GangId = gangMember ? gangMember.gangId : null;
        }
        this.Language = language ?? this.Language;
        return this;
    }
    /**
     * Sets the user's nickname.
     * @param nickname The new nickname.
     * @param cost Optional cost to change the nickname.
     * @returns True if successful, false if not enough money.
     */
    async SetNickname(nickname, cost) {
        const oldNickname = this.Nickname;
        this.Nickname = nickname;
        if (cost) {
            if (this.Money < cost) {
                return false;
            }
            this.Money -= cost;
        }
        this.NicknameChangeCount += 1;
        await this.Update({
            nickname: this.Nickname,
            money: this.Money,
            nicknameChangeCount: this.NicknameChangeCount,
        });
        log_1.Log.Success(`User ${oldNickname} (Id: ${this.Id}) changed nickname to ${nickname}. ${cost ? ` for ${(0, ui_1.formatMoney)(cost, Language_1.Language.English)}` : ""}`);
        return true;
    }
    /**
     * Sets the user's class.
     * @param classId The new class Id.
     * @param cost Optional cost to change the class.
     * @returns True if successful, false if not enough money.
     */
    async SetClass(classId, cost) {
        const oldClass = this.Class;
        this.Class = classId;
        if (cost) {
            if (this.Money < cost) {
                return false;
            }
            this.Money -= cost;
        }
        this.ClassChangeCount += 1;
        await this.Update({
            class: this.Class,
            money: this.Money,
            classChangeCount: this.ClassChangeCount,
        });
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) changed class from ${Classes_1.ClassList[oldClass].Name[Language_1.Language.English]} to ${Classes_1.ClassList[classId].Name[Language_1.Language.English]}${cost ? ` for ${(0, ui_1.formatMoney)(cost, Language_1.Language.English)}` : ""}.`);
        return true;
    }
    /**
     * Gets the cost to change the nickname.
     * @returns The cost.
     */
    GetNicknameChangeCost() {
        if (this.Nickname === "") {
            return 0;
        }
        const base = 100_000;
        const multiplier = Math.pow(10, Math.max(0, this.NicknameChangeCount - 1));
        const discount = this.IsVip() ? 0.75 : 1;
        return Math.floor(base * multiplier * discount);
    }
    /**
     * Gets the cost to change the class.
     * @returns The cost.
     */
    GetClassChangeCost() {
        if (this.Class === Classes_1.ClassId.None) {
            return 0;
        }
        const base = 100_000;
        const multiplier = Math.pow(10, Math.max(0, this.ClassChangeCount - 1));
        const discount = this.IsVip() ? 0.75 : 1;
        return Math.floor(base * multiplier * discount);
    }
    /**
     * Gets the localized text of the user's class.
     * @returns The class name.
     */
    GetClassText() {
        return Classes_1.ClassList[this.Class].Name[this.Language];
    }
    /**
     * Gets the user's name with the class image emote.
     * @returns The formatted string.
     */
    GetNameWithImage() {
        return `${Classes_1.ClassList[this.Class].Image.Emote.String} ${this.Nickname}`;
    }
    /**
     * Checks if the user is a VIP.
     * @returns True if VIP, false otherwise.
     */
    IsVip() {
        if (this.VipEternal) {
            return true;
        }
        if (this.VipTime == null) {
            return false;
        }
        return this.VipTime > new Date();
    }
    /**
     * Buys VIP time using special coins.
     * @param months Number of months to buy.
     */
    async BuyVip(months) {
        const price = months * User.VIP_BASE_PRICE;
        this.SpecialCoin -= price;
        await this.Update({
            specialCoin: this.SpecialCoin,
        });
        await this.AddVip(months * 30);
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought VIP for ${months} months.`);
    }
    async BuyVipForDays(days) {
        if (!Number.isSafeInteger(days) || days < User.VIP_MIN_DAYS) {
            return false;
        }
        const price = days * User.VIP_PRICE_PER_DAY;
        if (!Number.isSafeInteger(price) || this.SpecialCoin < price) {
            return false;
        }
        this.SpecialCoin -= price;
        await this.Update({
            specialCoin: this.SpecialCoin,
        });
        await this.AddVip(days);
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought VIP for ${days} days.`);
        return true;
    }
    async GiftVipForDays(receiver, days) {
        const price = days * User.VIP_PRICE_PER_DAY;
        if (this.Id === receiver.Id || receiver.VipEternal ||
            !Number.isSafeInteger(days) || days < User.VIP_MIN_DAYS ||
            !Number.isSafeInteger(price) || this.SpecialCoin < price) {
            return false;
        }
        const gifted = await UserRepository_1.UserRepository.GiftVipForDays(this.Id, receiver.Id, days, price);
        if (gifted) {
            log_1.Log.Success(`User ${this.Id} gifted ${days} days of VIP to user ${receiver.Id} for ${price} special coins.`);
            await Notification_1.Notification.VipGift(receiver, this, days);
        }
        return gifted;
    }
    /**
     * Adds VIP time to the user.
     * @param days Number of days to add.
     */
    async AddVip(days, setAvatarDecoration = true) {
        if (this.VipTime == null || this.VipTime < new Date()) {
            this.VipTime = new Date();
        }
        if (setAvatarDecoration && this.AvatarDecoration.Id === Ids_1.AvatarDecorationId.Default) {
            this.AvatarDecoration = AvatarDecorations_1.AvatarDecorationList[Ids_1.AvatarDecorationId.VIP];
        }
        this.VipTime = (0, date_fns_1.addDays)(this.VipTime, days);
        await this.Update({
            vipTime: this.VipTime,
            avatarDecoration: this.AvatarDecoration.Id,
        });
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${days} days of VIP.`);
    }
    /**
     * Sets eternal VIP status, or toggles it when no value is provided.
     */
    async SetEternalVip(eternal = !this.VipEternal) {
        this.VipEternal = eternal;
        await this.Update({
            vipEternal: this.VipEternal,
        });
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) ${this.VipEternal ? "is now" : "is not anymore"} a eternal VIP.`);
    }
    /**
     * Adds special coins to the user.
     * @param coins Number of coins to add.
     */
    async AddSpecialCoin(coins) {
        this.SpecialCoin += coins;
        await this.Update({
            specialCoin: this.SpecialCoin,
        });
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${coins} special coins.`);
    }
    /**
     * Checks if the user can receive the daily reward.
     * @returns True if eligible, false otherwise.
     */
    CanReceiveDaily() {
        const today = new Date();
        return this.Daily.LastReceived == null || (0, date_fns_1.differenceInHours)(today, this.Daily.LastReceived) > 23;
    }
    /**
     * Receives the daily reward.
     * @param options Options for the daily reward.
     * @param options.isBooster Whether the user is a server booster.
     * @returns The money received and any bonus items.
     */
    async ReceiveDaily({ isBooster }) {
        const today = new Date();
        if (this.Daily.LastReceived != null && (0, date_fns_1.differenceInHours)(today, this.Daily.LastReceived) > 48) {
            this.Daily.CurrentStreak = 0;
        }
        this.Daily.LastReceived = today;
        this.Daily.CurrentStreak += 1;
        if (this.Daily.CurrentStreak > this.Daily.MaxStreak) {
            this.Daily.MaxStreak = this.Daily.CurrentStreak;
        }
        const streakMultiplier = this.Daily.CurrentStreak <= 7 ? this.Daily.CurrentStreak : 7;
        let baseValue = 300;
        if (this.IsVip() || isBooster) {
            baseValue *= 1.5;
        }
        const money = baseValue * streakMultiplier;
        this.Money += money;
        const bonusItems = [];
        if (this.Daily.CurrentStreak > 0 && this.Daily.CurrentStreak % 7 === 0) {
            const cycle = Math.floor(this.Daily.CurrentStreak / 7);
            if (cycle === 1) {
                // 7th day: 3 days of Knife, 2 days of Pistol, 1 day of Compact SMG
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.Knife], days: 3 });
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.Pistol], days: 2 });
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.CompactSMG], days: 1 });
            }
            else if (cycle === 2) {
                // 14th day: 3 days of Light Vest, 2 days of Baseball Bat, 1 day of best gun or Sawnoff
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.LightVest], days: 3 });
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.BaseballBat], days: 2 });
                const fallback = Items_1.ItemList[Ids_1.ItemId.Sawnoff];
                const best = this.BestGun && this.BestGun.Attack > fallback.Attack ? this.BestGun : fallback;
                bonusItems.push({ item: best, days: 1 });
            }
            else if (cycle === 3) {
                // 21st day: 3 days of Advanced Scope, 2 days of Heavy Vest, 1 day of best gun or Carbine
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.AdvancedScope], days: 3 });
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.HeavyVest], days: 2 });
                const fallback = Items_1.ItemList[Ids_1.ItemId.Carbine];
                const best = this.BestGun && this.BestGun.Attack > fallback.Attack ? this.BestGun : fallback;
                bonusItems.push({ item: best, days: 1 });
            }
            else {
                // 28th day and beyond: 7 days of Sunglasses, 2 Grenades, 1 day of best gun or Katana
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.Sunglasses], days: 7 });
                bonusItems.push({ item: Items_1.ItemList[Ids_1.ItemId.Grenade], quantity: 2 });
                const fallback = Items_1.ItemList[Ids_1.ItemId.Katana];
                const best = this.BestGun && this.BestGun.Attack > fallback.Attack ? this.BestGun : fallback;
                bonusItems.push({ item: best, days: 1 });
            }
            for (const bonus of bonusItems) {
                await this.GiveItem(bonus.item, bonus.quantity, bonus.days);
            }
        }
        await this.Update({
            money: this.Money,
            lastDailyReceived: this.Daily.LastReceived,
            dailyStreak: this.Daily.CurrentStreak,
            maxDailyStreak: this.Daily.MaxStreak,
        });
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${(0, ui_1.formatMoney)(money, Language_1.Language.English)} from daily. Streak: ${this.Daily.CurrentStreak}.`);
        await Notification_1.Notification.Daily(this);
        return { money, bonusItems };
    }
    /**
     * Checks if the user can claim a new vote reward.
     * @returns True if eligible, false otherwise.
     */
    CanClaimVote() {
        const today = new Date();
        // If last vote was over 11 hours ago, we allow them to check with top.gg again
        return this.Vote.LastClaim == null || (0, date_fns_1.differenceInHours)(today, this.Vote.LastClaim) >= 11;
    }
    /**
     * Claims the vote reward from Top.gg.
     * @param votedAt Optional timestamp of the vote from Top.gg.
     */
    async ClaimVoteReward(votedAt) {
        const reward = 10;
        this.Vote.LastClaim = votedAt || new Date();
        this.Vote.Count += 1;
        this.SpecialCoin += reward;
        await this.Update({
            lastVoteClaim: this.Vote.LastClaim,
            voteCount: this.Vote.Count,
            specialCoin: this.SpecialCoin,
        });
        await Notification_1.Notification.Vote(this, this.Vote.LastClaim);
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${reward} Special Coins for voting! Total votes: ${this.Vote.Count}`);
    }
    /**
     * Gives an item to the user without charging money.
     * @param item The item to give.
     * @param quantity Optional quantity for consumables.
     * @param days Optional duration in days for non-consumables.
     */
    async GiveItem(item, quantity, days) {
        const existingItem = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(this.Id, item.Id);
        const now = new Date();
        const isConsumable = item.Type === Items_1.ItemType.Consumable;
        if (!existingItem) {
            const remainingTime = !isConsumable ? (0, date_fns_1.addDays)(now, days ?? 3) : undefined;
            const currentQuantity = isConsumable ? (quantity ?? 1) : undefined;
            await UserItemRepository_1.UserItemRepository.Create({
                userId: this.Id,
                itemId: item.Id,
                remainingTime,
                quantity: currentQuantity,
                skin: Ids_1.BundleId.Default,
            });
        }
        else {
            let remaining = (0, date_fns_1.addDays)(existingItem.remainingTime, days ?? 3);
            if (now > existingItem.remainingTime) {
                remaining = (0, date_fns_1.addDays)(now, days ?? 3);
            }
            await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(this.Id, item.Id, {
                remainingTime: !isConsumable ? remaining : undefined,
                quantity: isConsumable ? existingItem.quantity + (quantity ?? 1) : undefined,
            });
        }
        // Update local items list from database to ensure consistency
        await this.GetItems();
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${isConsumable ? `${quantity}x` : `${days ?? 3} days`} of ${item.Description[Language_1.Language.English]} (Id: ${item.Id}).`);
    }
    /**
     * Buys an item for the user.
     * @param item The item to buy.
     * @returns True if successful.
     */
    async BuyItem(item) {
        this.Money -= item.Price;
        const tax = Math.floor(item.Price * 0.05);
        if (tax > 0) {
            await Vault_1.Vault.AddBankFunds(tax);
        }
        const existingItem = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(this.Id, item.Id);
        const now = new Date();
        const isConsumable = item.Type === Items_1.ItemType.Consumable;
        if (!existingItem) {
            const remainingTime = !isConsumable ? (0, addHours_1.addHours)(now, 72) : undefined;
            const quantity = isConsumable ? 1 : undefined;
            await UserItemRepository_1.UserItemRepository.Create({
                userId: this.Id,
                itemId: item.Id,
                remainingTime,
                quantity,
                skin: Ids_1.BundleId.Default,
            });
            log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought item ${item.Description[Language_1.Language.English]} (Id: ${item.Id}) for ${(0, ui_1.formatMoney)(item.Price, Language_1.Language.English)} [FIRST TIME!].`);
        }
        else {
            let remaining = (0, addHours_1.addHours)(existingItem.remainingTime, 72);
            if (now > existingItem.remainingTime) {
                remaining = (0, addHours_1.addHours)(now, 72);
            }
            await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(this.Id, item.Id, {
                remainingTime: !isConsumable ? remaining : undefined,
                quantity: isConsumable ? existingItem.quantity + 1 : undefined,
            });
            log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought item ${item.Description[Language_1.Language.English]} (Id: ${item.Id}) for ${(0, ui_1.formatMoney)(item.Price, Language_1.Language.English)}. Total time: ${(0, date_fns_1.differenceInHours)(remaining, new Date())}h.`);
        }
        this.Shop.SpentCount += 1;
        this.Shop.SpentSum += item.Price;
        // Refresh local items list to ensure UI shows correct values
        await this.GetItems();
        await this.Update({
            money: this.Money,
            shopSpentCount: this.Shop.SpentCount,
            shopSpentSum: this.Shop.SpentSum,
        });
        return true;
    }
    /**
     * Consumes an item from the user's inventory.
     * @param itemId The item Id to consume.
     * @param quantity The quantity to consume.
     * @returns True if successful.
     */
    async ConsumeItem(itemId, quantity = 1) {
        const item = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(this.Id, itemId);
        if (item && (item.quantity ?? 0) >= quantity) {
            await UserItemRepository_1.UserItemRepository.DecrementQuantity(this.Id, itemId, quantity);
            const localItem = this.Items.find(i => i.Id === itemId);
            if (localItem) {
                localItem.Quantity -= quantity;
            }
            return true;
        }
        return false;
    }
    /**
     * Get all items from user that are greater than 0 and or are not expired
     */
    async GetItems() {
        this.Items = [];
        const items = await UserItemRepository_1.UserItemRepository.FindActiveByUser(this.Id);
        for (const item of items) {
            const foundWeapon = { ...Items_1.ItemList[item.itemId] };
            foundWeapon.RemainingTime = item.remainingTime;
            foundWeapon.Quantity = item.quantity ?? 0;
            foundWeapon.SelectedSkin = item.skin;
            this.Items.push(foundWeapon);
        }
    }
    /**
     * Get all items from user, even if quantity is 0 and remaining time is less than now (expired)
     */
    async GetAllItems() {
        const items = await UserItemRepository_1.UserItemRepository.FindAllByUser(this.Id);
        const itemList = [];
        for (const item of items) {
            const foundWeapon = { ...Items_1.ItemList[item.itemId] };
            foundWeapon.RemainingTime = item?.remainingTime ?? 0;
            foundWeapon.Quantity = item?.quantity ?? 0;
            foundWeapon.SelectedSkin = item?.skin ?? Ids_1.BundleId.Default;
            itemList.push(foundWeapon);
        }
        return itemList;
    }
    /**
     * Get the Item data, even if user doesnot have it in database (blank values)
     * @param itemId
     */
    async GetSpecificItem(itemId) {
        const item = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(this.Id, itemId);
        const foundWeapon = { ...Items_1.ItemList[itemId] };
        foundWeapon.RemainingTime = item?.remainingTime ?? 0;
        foundWeapon.Quantity = item?.quantity ?? 0;
        foundWeapon.SelectedSkin = item?.skin ?? Ids_1.BundleId.Default;
        return foundWeapon;
    }
    /**
     * Gets the skin string for a specific item.
     * @param item The item to get the skin for.
     * @returns The skin string.
     */
    GetItemSkin(item) {
        const found = this.Items.find(i => i.Id === item.Id);
        if (found) {
            return item.Skin[found.SelectedSkin].String;
        }
        return item.Skin[Ids_1.BundleId.Default].String;
    }
    /**
     * Sets the skin for a specific item.
     * @param item The item to set the skin for.
     * @param bundle The skin bundle.
     */
    async SetItemSkin(item, bundle) {
        const existingItem = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(this.Id, item.Id);
        if (!existingItem) {
            await UserItemRepository_1.UserItemRepository.Create({
                userId: this.Id,
                itemId: item.Id,
                remainingTime: undefined,
                quantity: undefined,
                skin: bundle.Id,
            });
        }
        else {
            await UserItemRepository_1.UserItemRepository.UpdateSkin(this.Id, item.Id, bundle.Id);
        }
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) has set skin ${bundle.Description[Language_1.Language.English]} (Id: ${bundle.Id}) for item ${item.Description[Language_1.Language.English]} (Id: ${item.Id}).`);
    }
    /**
     * Sets the skin for all items in a bundle.
     * @param bundle The skin bundle.
     */
    async SetBundleSkin(bundle) {
        const itemsToCreate = [];
        const itemsToUpdate = [];
        const existingItems = await UserItemRepository_1.UserItemRepository.FindAllByUserAndItems(this.Id, bundle.Items);
        const existingItemIds = new Set(existingItems.map(item => item.itemId));
        for (const itemId of bundle.Items) {
            if (!existingItemIds.has(itemId)) {
                itemsToCreate.push({
                    userId: this.Id,
                    itemId: itemId,
                    skin: bundle.Id,
                });
            }
            else {
                itemsToUpdate.push(itemId);
            }
        }
        if (itemsToCreate.length > 0) {
            await UserItemRepository_1.UserItemRepository.BulkCreate(itemsToCreate);
        }
        if (itemsToUpdate.length > 0) {
            await UserItemRepository_1.UserItemRepository.UpdateBundleSkins(this.Id, itemsToUpdate, bundle.Id);
        }
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) has set skin ${bundle.Description[Language_1.Language.English]} (Id: ${bundle.Id}) for all items in bundle.`);
    }
    /**
     * Sets the avatar decoration for the user.
     * @param decoration The avatar decoration.
     */
    async SetAvatarDecoration(decoration) {
        this.AvatarDecoration = decoration;
        const updated = await this.Update({
            avatarDecoration: this.AvatarDecoration.Id,
        });
        if (!updated)
            return false;
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) has set avatar decoration ${decoration.Description[Language_1.Language.English]} (Id: ${decoration.Id}).`);
        return true;
    }
    /**
     * Calculates the user's attributes based on items and other factors.
     * @param isBeatUp Whether the user is in a beat-up situation.
     * @param usedConsumables List of consumable items used in the current action.
     */
    async GetAttributes(isBeatUp = false, usedConsumables = []) {
        this.Attributes.Attack = 0;
        this.Attributes.Defense = 0;
        this.Attributes.MoneyAttack = 0;
        this.Attributes.MoneyDefense = 0;
        this.BestGun = null;
        let moreATK = 0;
        let moreDEF = 0;
        let moreMoneyATK = 0;
        let moreMoneyDEF = 0;
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;
        const isNight = !isDay;
        for (const item of this.Items) {
            if (item.Type === Items_1.ItemType.BeatUp && !isBeatUp) {
                continue;
            }
            if (item.Type === Items_1.ItemType.Consumable) {
                continue;
            }
            if ((this.BestGun?.Attack ?? 0) < item.Attack) {
                this.BestGun = item;
            }
            this.Attributes.Attack = Math.max(this.Attributes.Attack, item.Attack);
            this.Attributes.Defense = Math.max(this.Attributes.Defense, item.Defense);
            this.Attributes.MoneyAttack = Math.max(this.Attributes.MoneyAttack, item.MoneyAttack);
            this.Attributes.MoneyDefense = Math.max(this.Attributes.MoneyDefense, item.MoneyDefense);
            if ((item.Special.Day && isDay) || (item.Special.Night && isNight) || (!item.Special.Night && !item.Special.Day)) {
                moreATK += item.MoreAttack;
                moreDEF += item.MoreDefense;
                moreMoneyATK += item.MoreMoneyATK;
                moreMoneyDEF += item.MoreMoneyDEF;
            }
        }
        for (const itemId of usedConsumables) {
            const item = Items_1.ItemList[itemId];
            if (item) {
                if ((item.Special.Day && isDay) || (item.Special.Night && isNight) || (!item.Special.Night && !item.Special.Day)) {
                    moreATK += item.MoreAttack;
                    moreDEF += item.MoreDefense;
                    moreMoneyATK += item.MoreMoneyATK;
                    moreMoneyDEF += item.MoreMoneyDEF;
                }
            }
        }
        this.Attributes.Attack += moreATK;
        this.Attributes.Defense += moreDEF;
        this.Attributes.MoneyAttack += moreMoneyATK;
        this.Attributes.MoneyDefense += moreMoneyDEF;
        if (this.IsInHospital()) {
            this.Attributes.Defense -= 5;
        }
        // Gang Modifiers
        if (this.GangId) {
            const { Gang } = await import("./Gang.js");
            const gang = await Gang.GetBasicById(this.GangId);
            if (gang) {
                this.Attributes.Attack += (GangBases_1.GangBases[gang.BaseId].Modifier?.Attack?.Positive || 0) * gang.Level;
                this.Attributes.Defense += (GangBases_1.GangBases[gang.BaseId].Modifier?.Defense?.Positive || 0) * gang.Level;
            }
        }
    }
    /**
     * Determines the current situation of the user.
     * @param language Optional language to override.
     */
    async GetSituation(language) {
        const lang = language ?? this.Language;
        const s = Strings[lang];
        // Default to Idling
        this.Situation = {
            Id: Ids_2.SituationId.Idling,
            Simple: s.idling,
            SimpleEmote: `${emotes_1.EmoteString.Idle} ${s.idling}`,
            Complex: `${emotes_1.EmoteString.Idle} ${s.idling}`,
            ComplexUI: s.idling,
            EmoteId: emotes_1.EmoteId.Lazy,
        };
        // Check situations by priority (highest to lowest)
        if (this.IsDead()) {
            this.Situation = {
                Id: Ids_2.SituationId.Dead,
                Simple: s.deadSimple,
                SimpleEmote: `${emotes_1.EmoteString.Cemetery} ${s.deadSimple}`,
                Complex: `${emotes_1.EmoteString.Cemetery} ${s.deadComplex} ${(0, discord_js_1.time)(this.DeadUntil, discord_js_1.TimestampStyles.ShortDateTime)}`,
                ComplexUI: `${s.deadComplex} ${(0, date_fns_1.formatDistanceToNow)(this.DeadUntil, {
                    locale: (0, Language_1.getLocaleFromLanguage)(lang),
                    includeSeconds: true,
                })}`,
                EmoteId: emotes_1.EmoteId.Lazy,
            };
        }
        else if (this.IsScavenging()) {
            this.Situation = {
                Id: Ids_2.SituationId.Scavenging,
                Simple: s.scavenging,
                SimpleEmote: `${emotes_1.EmoteString.Scavenge} ${s.scavenging}`,
                Complex: `${emotes_1.EmoteString.Scavenge} ${s.scavenging} ${Scavenge_1.ScavengeList[this.Scavenge.IsScavengingId].Emote.String} ${Scavenge_1.ScavengeList[this.Scavenge.IsScavengingId].Description[lang]}`,
                ComplexUI: `${s.scavenging} ${Scavenge_1.ScavengeList[this.Scavenge.IsScavengingId].Description[lang]}`,
                EmoteId: emotes_1.EmoteId.Scavenge,
            };
        }
        else if (this.IsInPrison() && this.IsInHospital()) {
            this.Situation = {
                Id: Ids_2.SituationId.PrisonAndHospital,
                Simple: s.imprisonedAndHospitalSimple,
                SimpleEmote: s.imprisonedAndHospitalSimpleEmote,
                Complex: s.imprisonedAndHospitalComplex(this.Prison.Time, this.Hospital.Time),
                ComplexUI: s.imprisonedAndHospitalComplexUI(this.Prison.Time, this.Hospital.Time),
                EmoteId: emotes_1.EmoteId.Prison,
            };
        }
        else if (this.IsInHospital()) {
            this.Situation = {
                Id: Ids_2.SituationId.Hospital,
                Simple: s.hospitalSimple,
                SimpleEmote: `${emotes_1.EmoteString.Hospital} ${s.hospitalSimple}`,
                Complex: `${emotes_1.EmoteString.Hospital} ${s.hospitalComplex} ${(0, discord_js_1.time)(this.Hospital.Time, discord_js_1.TimestampStyles.ShortDateTime)}`,
                ComplexUI: `${s.hospitalComplex} ${(0, date_fns_1.formatDistanceToNow)(this.Hospital.Time, {
                    locale: (0, Language_1.getLocaleFromLanguage)(lang),
                    includeSeconds: true,
                })}`,
                EmoteId: emotes_1.EmoteId.Hospital,
            };
        }
        else if (this.IsInPrison()) {
            this.Situation = {
                Id: Ids_2.SituationId.Prison,
                Simple: s.imprisonedSimple,
                SimpleEmote: `${emotes_1.EmoteString.Prison} ${s.imprisonedSimple}`,
                Complex: `${emotes_1.EmoteString.Prison} ${s.imprisonedComplex} ${(0, discord_js_1.time)(this.Prison.Time, discord_js_1.TimestampStyles.ShortDateTime)}`,
                ComplexUI: `${s.imprisonedComplex} ${(0, date_fns_1.formatDistanceToNow)(this.Prison.Time, {
                    locale: (0, Language_1.getLocaleFromLanguage)(lang),
                    includeSeconds: true,
                })}`,
                EmoteId: emotes_1.EmoteId.Prison,
            };
        }
        else if (this.BeatUp.IsBeingBeatUpById) {
            const user = await UserRepository_1.UserRepository.FindById(this.BeatUp.IsBeingBeatUpById, ["id", "nickname"]);
            this.Situation = {
                Id: Ids_2.SituationId.BeatUp,
                Simple: s.beingBeatedUpSimple,
                SimpleEmote: `${emotes_1.EmoteString.Beat} ${s.beingBeatedUpSimple}`,
                Complex: `${emotes_1.EmoteString.Beat} ${s.beingBeatedUpComplex} ${user?.nickname ?? "Unknown"}`,
                ComplexUI: `${s.beingBeatedUpComplex} ${user?.nickname ?? "Unknown"}`,
                EmoteId: emotes_1.EmoteId.Beat,
            };
        }
        else if (this.BeatUp.IsBeatingId) {
            const user = await UserRepository_1.UserRepository.FindById(this.BeatUp.IsBeatingId, ["id", "nickname"]);
            this.Situation = {
                Id: Ids_2.SituationId.BeatUp,
                Simple: s.beating,
                SimpleEmote: `${emotes_1.EmoteString.Beat} ${s.beating}`,
                Complex: `${emotes_1.EmoteString.Beat} ${s.beating} ${user?.nickname ?? "Unknown"}`,
                ComplexUI: `${s.beating} ${user?.nickname ?? "Unknown"}`,
                EmoteId: emotes_1.EmoteId.Beat,
            };
        }
        else if (this.IsDefendingInvestment()) {
            this.Situation = {
                Id: Ids_2.SituationId.DefendingInvestment,
                Simple: s.defendingInvestmentSimple,
                SimpleEmote: `${emotes_1.EmoteString.InvestmentActive} ${s.defendingInvestmentSimple}`,
                Complex: `${emotes_1.EmoteString.InvestmentActive} ${s.defendingInvestmentComplex}`,
                ComplexUI: s.defendingInvestmentComplex,
                EmoteId: emotes_1.EmoteId.InvestmentActive,
            };
        }
        else if (this.IsParticipatingInGangAction()) {
            this.Situation = {
                Id: Ids_2.SituationId.GangAction,
                Simple: s.gangActionSimple,
                SimpleEmote: `${emotes_1.EmoteString.Gang} ${s.gangActionSimple}`,
                Complex: `${emotes_1.EmoteString.Gang} ${s.gangActionComplex}`,
                ComplexUI: s.gangActionComplex,
                EmoteId: emotes_1.EmoteId.Gang,
            };
        }
        else if (this.Robbery.IsBeingRobbedById) {
            const user = await UserRepository_1.UserRepository.FindById(this.Robbery.IsBeingRobbedById, ["id", "nickname"]);
            this.Situation = {
                Id: Ids_2.SituationId.Robbery,
                Simple: s.beingRobbedSimple,
                SimpleEmote: `${emotes_1.EmoteString.Robbery} ${s.beingRobbedSimple}`,
                Complex: `${emotes_1.EmoteString.Robbery} ${s.beingRobbedComplex} ${user?.nickname ?? "Unknown"}`,
                ComplexUI: `${s.beingRobbedComplex} ${user?.nickname ?? "Unknown"}`,
                EmoteId: emotes_1.EmoteId.Robbery,
            };
        }
        else if (this.Robbery.IsRobbingLocationId != null) {
            const location = Locations_1.LocationList[this.Robbery.IsRobbingLocationId];
            this.Situation = {
                Id: Ids_2.SituationId.Robbery,
                Simple: s.robbing,
                SimpleEmote: `${emotes_1.EmoteString.Robbery} ${s.robbing}`,
                Complex: `${emotes_1.EmoteString.Robbery} ${s.robbing} ${location.Name[lang]}`,
                ComplexUI: `${s.robbing} ${location.Name[lang]}`,
                EmoteId: emotes_1.EmoteId.Robbery,
            };
        }
        else if (this.Robbery.IsRobbingId) {
            const user = await UserRepository_1.UserRepository.FindById(this.Robbery.IsRobbingId, ["id", "nickname"]);
            this.Situation = {
                Id: Ids_2.SituationId.Robbery,
                Simple: s.robbing,
                SimpleEmote: `${emotes_1.EmoteString.Robbery} ${s.robbing}`,
                Complex: `${emotes_1.EmoteString.Robbery} ${s.robbing} ${user?.nickname ?? "Unknown"}`,
                ComplexUI: `${s.robbing} ${user?.nickname ?? "Unknown"}`,
                EmoteId: emotes_1.EmoteId.Robbery,
            };
        }
        else if (this.Job.Id != null) {
            this.Situation = {
                Id: Ids_2.SituationId.Job,
                Simple: s.workingSimple,
                SimpleEmote: `${emotes_1.EmoteString.Jobs} ${s.workingSimple}`,
                Complex: `${emotes_1.EmoteString.Jobs} ${s.workingComplex(Jobs_1.JobList[this.Job.Id].Description[lang], this.Job.EndsIn)}`,
                ComplexUI: s.workingComplexUI(Jobs_1.JobList[this.Job.Id].Description[lang], this.Job.EndsIn),
                EmoteId: emotes_1.EmoteId.Jobs,
            };
        }
        else if (this.IsInCasinoGame()) {
            this.Situation = {
                Id: Ids_2.SituationId.Casino,
                Simple: s.casinoSimple,
                SimpleEmote: `${emotes_1.EmoteString.Casino} ${s.casinoSimple}`,
                Complex: `${emotes_1.EmoteString.Casino} ${s.casinoSimple}`,
                ComplexUI: s.casinoSimple,
                EmoteId: emotes_1.EmoteId.Casino,
            };
        }
        if (this.IsWanted()) {
            this.Situation = {
                Id: Ids_2.SituationId.Wanted,
                Simple: this.Situation.Simple + ` ${s.wantedSimple}`,
                SimpleEmote: this.Situation.SimpleEmote + ` ${s.wantedSimpleEmote}`,
                Complex: this.Situation.Complex + ` ${s.wantedComplex} ${(0, discord_js_1.time)(this.Wanted.Time, discord_js_1.TimestampStyles.ShortDateTime)}`,
                ComplexUI: this.Situation.ComplexUI + ` ${s.wantedComplexUI} ${(0, date_fns_1.formatDistanceToNow)(this.Wanted.Time, {
                    locale: (0, Language_1.getLocaleFromLanguage)(lang),
                    includeSeconds: true,
                })}`,
                EmoteId: this.Situation.EmoteId,
            };
        }
    }
    /**
     * Check if the user is not doing any action
     * Note: "Wanted" does not affect Idling
     */
    IsIdling() {
        return !this.IsWorking() &&
            !this.IsInPrison() &&
            !this.IsInHospital() &&
            !this.IsScavenging() &&
            !this.IsInCasinoGame() &&
            !this.IsInRobbery() &&
            !this.IsInBeatUp() &&
            !this.IsDefendingInvestment() &&
            !this.IsParticipatingInGangAction();
    }
    /**
     * Checks user availability to perform actions based on active states.
     * Allows bypassing specific checks via ignoreReasons array.
     */
    CheckAvailability(ignoreReasons = []) {
        if (!ignoreReasons.includes("dead") && this.IsDead()) {
            return { available: false, reason: "dead", time: this.DeadUntil };
        }
        if (!ignoreReasons.includes("scavenging") && this.IsScavenging()) {
            return { available: false, reason: "scavenging", referenceId: this.Scavenge.IsScavengingId };
        }
        if (!ignoreReasons.includes("working") && this.IsWorking()) {
            return { available: false, reason: "working", time: this.Job.EndsIn, referenceId: this.Job.Id };
        }
        if (!ignoreReasons.includes("prison") && this.IsInPrison()) {
            return { available: false, reason: "prison", time: this.Prison.Time };
        }
        if (!ignoreReasons.includes("wanted") && this.IsWanted()) {
            return { available: false, reason: "wanted", time: this.Wanted.Time };
        }
        if (!ignoreReasons.includes("hospital") && this.IsInHospital()) {
            return { available: false, reason: "hospital", time: this.Hospital.Time };
        }
        if (!ignoreReasons.includes("escaping") && this.IsEscaping()) {
            return { available: false, reason: "escaping", time: this.Escape.Time };
        }
        if (!ignoreReasons.includes("casino") && this.IsInCasinoGame()) {
            return { available: false, reason: "casino" };
        }
        if (!ignoreReasons.includes("defendingInvestment") && this.IsDefendingInvestment()) {
            return { available: false, reason: "defendingInvestment" };
        }
        if (!ignoreReasons.includes("gangAction") && this.IsParticipatingInGangAction()) {
            return { available: false, reason: "gangAction" };
        }
        if (!ignoreReasons.includes("beating") && this.BeatUp.IsBeatingId) {
            return { available: false, reason: "beating", targetId: this.BeatUp.IsBeatingId };
        }
        if (!ignoreReasons.includes("beingBeatUp") && this.BeatUp.IsBeingBeatUpById) {
            return { available: false, reason: "beingBeatUp", targetId: this.BeatUp.IsBeingBeatUpById };
        }
        if (!ignoreReasons.includes("robbing") && this.Robbery.IsRobbingId) {
            return { available: false, reason: "robbing", targetId: this.Robbery.IsRobbingId };
        }
        if (!ignoreReasons.includes("beingRobbed") && this.Robbery.IsBeingRobbedById) {
            return { available: false, reason: "beingRobbed", targetId: this.Robbery.IsBeingRobbedById };
        }
        if (!ignoreReasons.includes("robbingLocation") && this.Robbery.IsRobbingLocationId !== null) {
            return { available: false, reason: "robbingLocation", referenceId: this.Robbery.IsRobbingLocationId };
        }
        return { available: true };
    }
    /**
     * Checks if the user is working.
     */
    IsWorking() {
        return this.Job.Id != null;
    }
    /**
     * Checks if the user is dead.
     */
    IsDead() {
        return this.DeadUntil > new Date();
    }
    /**
     * Checks if the user is in prison.
     */
    IsInPrison() {
        return this.Prison.Time > new Date();
    }
    /**
     * Checks if the user is wanted.
     */
    IsWanted() {
        return this.Wanted.Time > new Date();
    }
    /**
     * Checks if an escape is in progress or still awaiting a persisted result.
     */
    IsEscaping() {
        return this.Escape.Time > new Date() || (this.Escape.HasTried && this.Escape.Time.getTime() > 0);
    }
    /**
     * Checks if the user is in hospital.
     */
    IsInHospital() {
        return this.Hospital.Time > new Date();
    }
    /**
     * Checks if the user is scavenging.
     */
    IsScavenging() {
        return this.Scavenge.IsScavengingId != null;
    }
    /**
     * Checks if the user is in a robbery situation.
     */
    IsInRobbery() {
        return this.Robbery.IsRobbingId != null || this.Robbery.IsRobbingLocationId != null || this.Robbery.IsBeingRobbedById != null;
    }
    /**
     * Checks if the user is defending an investment.
     */
    IsDefendingInvestment() {
        return this.Robbery.InvestmentIsDefending;
    }
    /**
     * Checks if the user is participating in a gang action.
     */
    IsParticipatingInGangAction() {
        return this.Robbery.ParticipatingInGangAction;
    }
    /**
     * Checks if the user is in a beat-up situation.
     */
    IsInBeatUp() {
        return this.BeatUp.IsBeatingId != null || this.BeatUp.IsBeingBeatUpById != null;
    }
    /**
     * Checks if the user is in a Casino game
     */
    IsInCasinoGame() {
        return this.Casino.IsInGame;
    }
    static IsHappyHour(date = new Date()) {
        return (0, Drinks_1.isHappyHour)(date);
    }
    CanDrinkAtBar() {
        return !this.IsInPrison() &&
            !this.IsInHospital() &&
            !this.IsWorking() &&
            !this.IsInBeatUp() &&
            !this.IsInRobbery() &&
            !this.IsInCasinoGame() &&
            !this.IsDefendingInvestment() &&
            !this.IsParticipatingInGangAction();
    }
    async DrinkAtBar(drinkCount, happyHour = User.IsHappyHour()) {
        const record = happyHour ? this.Drink.HappyHour : this.Drink.Normal;
        const result = {
            success: false,
            message: "",
            beverage: null,
            sensation: null,
            drinkCount,
            happyHour,
            hospitalized: false,
            hospitalTime: null,
            normalRecord: this.Drink.Normal,
            happyHourRecord: this.Drink.HappyHour,
            drunkCount: this.Drink.DrunkCount,
        };
        if (!this.CanDrinkAtBar()) {
            result.message = "Você não pode beber no momento.";
            return result;
        }
        if (!Number.isInteger(drinkCount) || drinkCount < 1 || drinkCount > record + 1) {
            result.message = "A contagem de bebidas é inválida.";
            return result;
        }
        const beverage = (0, utils_1.getRandomItemFromArray)(Drinks_1.BarBeverages);
        const sensation = (0, utils_1.getRandomItemFromArray)(Drinks_1.DrinkSensations);
        const comaChance = happyHour ? 15 : 5;
        const previousHospitalCount = this.Hospital.Count;
        const previousHospitalTime = this.Hospital.Time;
        this.Drink.Normal = happyHour ? this.Drink.Normal : Math.max(this.Drink.Normal, drinkCount);
        this.Drink.HappyHour = happyHour ? Math.max(this.Drink.HappyHour, drinkCount) : this.Drink.HappyHour;
        if (Math.random() * 100 < comaChance) {
            this.Hospital.Count += 1;
            this.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), Math.floor(Math.random() * 5) + 1);
            this.Drink.DrunkCount += 1;
            result.hospitalized = true;
            result.hospitalTime = this.Hospital.Time;
        }
        const updated = await this.Update({
            hospitalCount: this.Hospital.Count,
            hospitalTime: this.Hospital.Time,
            drunkCount: this.Drink.DrunkCount,
            drinkNormal: this.Drink.Normal,
            drinkHappyHour: this.Drink.HappyHour,
        });
        if (!updated) {
            this.Hospital.Count = previousHospitalCount;
            this.Hospital.Time = previousHospitalTime;
            this.Drink.Normal = result.normalRecord;
            this.Drink.HappyHour = result.happyHourRecord;
            this.Drink.DrunkCount = result.drunkCount;
            result.hospitalized = false;
            result.hospitalTime = null;
            result.message = "Não foi possível registrar sua bebida.";
            return result;
        }
        if (result.hospitalized) {
            await Notification_1.Notification.Hospital(this);
        }
        log_1.Log.Info(`${this.Nickname} (${this.Id}) drank ${beverage} and felt ${sensation}.${result.hospitalized ? " They fell into an alcoholic coma." : ""}`);
        return {
            ...result,
            success: true,
            message: result.hospitalized
                ? "Você bebeu demais e entrou em coma alcoólico."
                : "Você bebeu e se sente bem.",
            beverage,
            sensation,
            normalRecord: this.Drink.Normal,
            happyHourRecord: this.Drink.HappyHour,
            drunkCount: this.Drink.DrunkCount,
        };
    }
    /**
     * Starts a job for the user.
     * @param jobId The job Id.
     */
    async StartJob(jobId) {
        const job = Jobs_1.JobList[jobId];
        const eventActiveValue = await Event_1.Event.GetActiveFromType(Event_1.EventType.JOB_TIME_MULTIPLIER);
        const jobDuration = job.Duration * eventActiveValue;
        this.Job.Id = jobId;
        this.Job.EndsIn = (0, addHours_1.addHours)(new Date(), jobDuration);
        await Notification_1.Notification.Job(this);
        await this.Update({
            jobId: this.Job.Id,
            jobTime: this.Job.EndsIn,
        });
        log_1.Log.Info(`User ${this.Nickname} (Id: ${this.Id}) started job ${job.Description[Language_1.Language.English]} (Id: ${jobId}), will finish in ${(0, ui_1.formatDate)(this.Job.EndsIn, Language_1.Language.English)}.`);
    }
    /**
     * Cancels the current job.
     */
    async CancelJob() {
        if (this.Job.Id === null) {
            return;
        }
        const job = Jobs_1.JobList[this.Job.Id];
        this.Job.Id = null;
        await Promise.all([
            Notification_1.Notification.Dismiss(this.Id, Notification_1.NotificationType.Job),
            this.Update({
                jobId: this.Job.Id,
            }),
        ]);
        log_1.Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) canceled his job ${job.Description[this.Language]} (Id: ${job.Id}).`);
    }
    /**
     * Ends the current job and gives the reward.
     */
    async EndJob() {
        if (this.Job.Id === null) {
            return;
        }
        const job = Jobs_1.JobList[this.Job.Id];
        const userClassModifier = (0, Classes_1.getJobClassModifier)(this.Class);
        const salary = Math.round(job.Salary * userClassModifier);
        this.Money += salary;
        this.Job.Id = null;
        this.Job.ReceivedCount += 1;
        this.Job.ReceivedSum += salary;
        await this.Update({
            money: this.Money,
            jobId: this.Job.Id,
            jobReceivedCount: this.Job.ReceivedCount,
            jobReceivedSum: this.Job.ReceivedSum,
        });
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) finished his job ${job.Description[this.Language]} (Id: ${job.Id}) and received ${(0, ui_1.formatMoney)(salary, Language_1.Language.English)}.`);
    }
    /**
     * Buys a skin bundle.
     * @param bundleId The bundle Id.
     * @returns True if successful.
     */
    async BuySkinBundle(bundleId) {
        const success = await UserBundle_1.UserBundle.Create(this.Id, bundleId);
        if (success) {
            this.SpecialCoin -= Skins_1.BundleList[bundleId].Price;
            await this.Update({
                specialCoin: this.SpecialCoin,
            });
            log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought skin bundle ${Skins_1.BundleList[bundleId].Description[Language_1.Language.English]} (Id: ${bundleId}) for ${(0, ui_1.formatMoney)(Skins_1.BundleList[bundleId].Price, Language_1.Language.English, "")}.`);
        }
        else {
            log_1.Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to buy skin bundle ${Skins_1.BundleList[bundleId].Description[Language_1.Language.English]} (Id: ${bundleId}), but failed.`);
        }
        return success;
    }
    /**
     * Buys an avatar decoration.
     * @param avatarDecorationId The avatar decoration Id.
     * @returns True if successful.
     */
    async BuyAvatarDecoration(avatarDecorationId) {
        const success = await UserAvatarDecoration_1.UserAvatarDecoration.Create(this.Id, avatarDecorationId);
        if (success) {
            this.SpecialCoin -= AvatarDecorations_1.AvatarDecorationList[avatarDecorationId].Price;
            await this.Update({
                specialCoin: this.SpecialCoin,
            });
            log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought avatar decoration ${AvatarDecorations_1.AvatarDecorationList[avatarDecorationId].Description[Language_1.Language.English]} (Id: ${avatarDecorationId}) for ${(0, ui_1.formatMoney)(AvatarDecorations_1.AvatarDecorationList[avatarDecorationId].Price, Language_1.Language.English, "")}.`);
        }
        else {
            log_1.Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to buy avatar decoration ${AvatarDecorations_1.AvatarDecorationList[avatarDecorationId].Description[Language_1.Language.English]} (Id: ${avatarDecorationId}), but failed.`);
        }
        return success;
    }
    /**
     * Buys a background decoration.
     * @param backgroundDecorationId The background decoration Id.
     * @returns True if successful.
     */
    async BuyBackgroundDecoration(backgroundDecorationId) {
        const success = await UserBackgroundDecoration_1.UserBackgroundDecoration.Create(this.Id, backgroundDecorationId);
        if (success) {
            this.SpecialCoin -= BackgroundDecorations_1.BackgroundDecorationList[backgroundDecorationId].Price;
            await this.Update({
                specialCoin: this.SpecialCoin,
            });
            log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought background decoration ${BackgroundDecorations_1.BackgroundDecorationList[backgroundDecorationId].Description[Language_1.Language.English]} (Id: ${backgroundDecorationId}) for ${(0, ui_1.formatMoney)(BackgroundDecorations_1.BackgroundDecorationList[backgroundDecorationId].Price, Language_1.Language.English, "")}.`);
        }
        else {
            log_1.Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to buy background decoration ${BackgroundDecorations_1.BackgroundDecorationList[backgroundDecorationId].Description[Language_1.Language.English]} (Id: ${backgroundDecorationId}), but failed.`);
        }
        return success;
    }
    /**
     * Sets the user's background decoration.
     * @param decoration The background decoration.
     */
    async SetBackgroundDecoration(decoration) {
        this.BackgroundDecoration = decoration;
        const updated = await this.Update({
            backgroundDecoration: decoration.Id,
        });
        if (!updated)
            return false;
        log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) changed background decoration to ${decoration.Description[Language_1.Language.English]}.`);
        return true;
    }
    /**
     * Updates the user in the database.
     */
    async Update(values) {
        try {
            await UserRepository_1.UserRepository.Update(this.Id, values);
            return true;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with updating user Id: ${this.Id}.`);
            if (UserRepository_1.UserRepository.IsResolvingAction())
                throw err;
            return false;
        }
    }
    /**
     * Updates the user's language.
     * @param language The new language.
     */
    async UpdateLanguage(language) {
        try {
            await this.Update({
                language: language,
            });
            this.Language = language;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with updating language for user Id: ${this.Id}.`);
        }
    }
    // ==========================
    // Métodos relacionados a gangues
    // ==========================
    /**
     * Checks if the user is in a gang.
     */
    IsInGang() {
        return this.GangId !== null;
    }
    /**
     * Gets the user's gang.
     * @returns The gang or null if not in one.
     */
    async GetGang() {
        if (!this.IsInGang()) {
            return null;
        }
        const { Gang } = await import("./Gang.js");
        return await Gang.GetById(this.GangId);
    }
    /**
     * Creates a new gang.
     * @param name Gang name.
     * @param acronym Gang acronym.
     * @param description Gang description.
     * @param color Gang color.
     * @param image Gang image URL.
     * @returns The created gang or null if failed.
     */
    async CreateGang(name, acronym, description, color, image = null) {
        const { Gang } = await import("./Gang.js");
        if (this.IsInGang()) {
            log_1.Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to create a gang, but already is in one.`);
            return null;
        }
        if (this.Money < Gang.CREATION_COST) {
            log_1.Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to create a gang, but doesn't have money (user: ${(0, ui_1.formatMoney)(this.Money, Language_1.Language.English)} / cost: ${(0, ui_1.formatMoney)(Gang.CREATION_COST, Language_1.Language.English)}).`);
            return null;
        }
        const result = await Gang.Create(this, name, acronym, description, color, image);
        if (result.gang) {
            this.GangId = result.gang.Id;
        }
        return result.gang;
    }
    /**
     * Leaves the current gang.
     * @returns True if successful.
     */
    async LeaveGang() {
        if (!this.IsInGang()) {
            return false;
        }
        const { Gang } = await import("./Gang.js");
        const gang = await Gang.GetById(this.GangId);
        if (!gang) {
            // Situação estranha onde o usuário tem um Id de gangue, mas a gangue não existe
            // Vamos limpar o GangId para corrigir a inconsistência
            this.GangId = null;
            // No need to update Users table as GangId is not stored there
            return true;
        }
        // Se o usuário for o líder, ele não pode sair sem transferir a liderança
        if (this.Id === gang.LeaderId) {
            log_1.Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to leave gang ${gang.Name} (Id: ${gang.Id}), but is the leader.`);
            return false;
        }
        const success = await gang.LeaveGang(this);
        if (success) {
            this.GangId = null;
            log_1.Log.Success(`User ${this.Nickname} (Id: ${this.Id}) left gang ${gang.Name} (Id: ${gang.Id}).`);
        }
        return success;
    }
    /**
     * Searches for a user by name or Id.
     * @param nameOrId The name or Id to search for.
     * @param language Optional language.
     * @returns The User instance or null if not found.
     */
    static async Search(nameOrId, language) {
        const user = await UserRepository_1.UserRepository.SearchByNameOrId(nameOrId);
        if (!user) {
            return null;
        }
        return await new User(user.id).GetInfo(user, language);
    }
    /**
     * Sets the user's automatic grenade option.
     * @param value The new value.
     */
    async SetAutomaticGrenade(value) {
        this.AutomaticGrenade = value;
        await this.Update({
            automaticGrenade: value,
        });
        log_1.Log.Info(`User ${this.Nickname} (Id: ${this.Id}) set automaticGrenade to ${value}.`);
    }
    /**
     * Kills the user for a specified number of days.
     * @param days The number of days to kill the user for.
     * @returns The time the user will be dead until.
     */
    async Kill(days) {
        const deadUntil = (0, date_fns_1.addDays)(new Date(), days);
        this.DeadUntil = deadUntil;
        this.Hospital.Time = deadUntil;
        this.Money = 0;
        this.Job.Id = null;
        await this.Update({
            deadUntil: this.DeadUntil,
            hospitalTime: this.Hospital.Time,
            money: this.Money,
            jobId: this.Job.Id,
        });
        await Promise.all([
            Notification_1.Notification.Dismiss(this.Id, Notification_1.NotificationType.Job),
            Notification_1.Notification.Hospital(this),
        ]);
        return deadUntil;
    }
    /**
     * Cures the user from the hospital.
     */
    async Cure(adminId) {
        this.Hospital.Time = new Date();
        await this.Update({ hospitalTime: this.Hospital.Time });
        log_1.Log.Success(`Admin ${adminId} healed ${this.Nickname} (Id: ${this.Id}) from hospital.`);
    }
    /**
     * Frees the user from prison.
     */
    async Free(adminId) {
        this.Prison.Time = new Date();
        this.Prison.HasPaidBribe = false;
        this.Escape.HasTried = false;
        await this.Update({
            prisonTime: this.Prison.Time,
            prisonHasPaidBribe: this.Prison.HasPaidBribe,
            escapeHasTried: this.Escape.HasTried,
        });
        log_1.Log.Success(`Admin ${adminId} freed ${this.Nickname} (Id: ${this.Id}) from prison.`);
    }
    /**
     * Removes the user from a specific action.
     * @param action The action type ('job', 'scavenge', 'robbery', 'beatup', 'casino', 'gangaction')
     * @param adminId The ID of the admin who performed the action (for logging)
     */
    async RemoveAction(action, adminId) {
        switch (action) {
            case "job":
                this.Job.Id = null;
                await this.Update({ jobId: null });
                break;
            case "scavenge":
                this.Scavenge.IsScavengingId = null;
                await this.Update({ scavengingId: null });
                break;
            case "robbery":
                this.Robbery.IsRobbingId = null;
                this.Robbery.IsBeingRobbedById = null;
                this.Robbery.IsRobbingLocationId = null;
                this.Robbery.InvestmentIsDefending = false;
                await this.Update({
                    robbingUserId: null,
                    beingRobbedByUserId: null,
                    robbingLocationId: null,
                    robberyInvestmentDefending: false,
                    robberyParticipatingInGangAction: false,
                });
                break;
            case "beatup":
                this.BeatUp.IsBeatingId = null;
                this.BeatUp.IsBeingBeatUpById = null;
                await this.Update({
                    beatingUserId: null,
                    beingBeatUpByUserId: null,
                });
                break;
            case "casino":
                this.Casino.IsInGame = false;
                await this.Update({ casinoIsInGame: false });
                break;
            case "gangaction":
                this.Robbery.ParticipatingInGangAction = false;
                await this.Update({ robberyParticipatingInGangAction: false });
                break;
        }
        log_1.Log.Success(`Admin ${adminId} removed ${this.Nickname} (Id: ${this.Id}) from action ${action}.`);
    }
    /**
     * Resets a specific cooldown for the user.
     * @param cooldown The cooldown type ('scavenge', 'robbery', 'beatup')
     * @param adminId The ID of the admin who performed the action (for logging)
     */
    async ResetCooldown(cooldown, adminId) {
        switch (cooldown) {
            case "scavenge":
                this.Scavenge.Time = new Date();
                await this.Update({ scavengeTime: this.Scavenge.Time });
                break;
            case "robbery":
                this.Wanted.Time = new Date();
                await this.Update({ wantedTime: this.Wanted.Time });
                break;
            case "beatup":
                this.BeatUp.Time = new Date();
                await this.Update({ beatUpTime: this.BeatUp.Time });
                break;
        }
        log_1.Log.Success(`Admin ${adminId} reset ${cooldown} cooldown for ${this.Nickname} (Id: ${this.Id}).`);
    }
}
exports.User = User;
const Strings = {
    [Language_1.Language.English]: {
        idling: "Idling",
        workingSimple: "Working",
        workingComplex: (description, jobTime) => `Working as ${description}. Will finish ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        workingComplexUI: (description, jobTime) => `Working as ${description} until ${(0, ui_1.formatDate)(jobTime, Language_1.Language.English)}`,
        robbing: "Robbing",
        beingRobbedSimple: "Being robbed",
        beingRobbedComplex: "Being robbed by",
        defendingInvestmentSimple: "Defending investment",
        defendingInvestmentComplex: "Defending investment",
        beating: "Beating",
        beingBeatedUpSimple: "Being beaten up",
        beingBeatedUpComplex: "Being beaten up by",
        imprisonedSimple: "Imprisoned",
        imprisonedComplex: "Imprisoned until",
        imprisonedAndHospitalSimple: "Imprisoned and Hospitalized",
        imprisonedAndHospitalSimpleEmote: `${emotes_1.EmoteString.Prison} Imprisoned and ${emotes_1.EmoteString.Hospital} Hospitalized`,
        imprisonedAndHospitalComplex: (prisonTime, hospitalTime) => `${emotes_1.EmoteString.Prison} Imprisoned until ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.ShortDateTime)} and ${emotes_1.EmoteString.Hospital} Hospitalized until ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.ShortDateTime)}`,
        imprisonedAndHospitalComplexUI: (prisonTime, hospitalTime) => `Imprisoned until ${(0, ui_1.formatDate)(prisonTime, Language_1.Language.English)} and Hospitalized until ${(0, ui_1.formatDate)(hospitalTime, Language_1.Language.English)}`,
        scavenging: `Scavenging`,
        casinoSimple: `Playing in Casino`,
        wantedSimple: "and Wanted",
        wantedSimpleEmote: `and ${emotes_1.EmoteString.Police} Wanted`,
        wantedComplex: `and ${emotes_1.EmoteString.Police} Wanted until`,
        wantedComplexUI: `and Wanted until`,
        hospitalSimple: "Hospitalized",
        hospitalComplex: `Hospitalized until`,
        gangActionSimple: "Participating in gang action",
        gangActionComplex: "Participating in gang action",
        deadSimple: "Dead",
        deadComplex: "Dead until",
    },
    [Language_1.Language.Portuguese]: {
        idling: "Vadiando",
        workingSimple: "Trabalhando",
        workingComplex: (description, jobTime) => `Trabalhando como ${description}. Terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        workingComplexUI: (description, jobTime) => `Trabalhando como ${description} até ${(0, ui_1.formatDate)(jobTime, Language_1.Language.Portuguese)}`,
        robbing: "Roubando",
        beingRobbedSimple: "Sendo roubado",
        beingRobbedComplex: "Sendo roubado por",
        defendingInvestmentSimple: "Defending investimento",
        defendingInvestmentComplex: "Defendendo investimento",
        beating: "Espancando",
        beingBeatedUpSimple: "Sendo espancado",
        beingBeatedUpComplex: "Sendo espancado por",
        imprisonedSimple: "Preso",
        imprisonedComplex: "Preso até",
        imprisonedAndHospitalSimple: "Preso e Hospitalizado",
        imprisonedAndHospitalSimpleEmote: `${emotes_1.EmoteString.Prison} Preso e ${emotes_1.EmoteString.Hospital} Hospitalizado`,
        imprisonedAndHospitalComplex: (prisonTime, hospitalTime) => `${emotes_1.EmoteString.Prison} Preso até ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.ShortDateTime)} e ${emotes_1.EmoteString.Hospital} Hospitalizado até ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.ShortDateTime)}`,
        imprisonedAndHospitalComplexUI: (prisonTime, hospitalTime) => `Preso até ${(0, ui_1.formatDate)(prisonTime, Language_1.Language.Portuguese)} e Hospitalizado até ${(0, ui_1.formatDate)(hospitalTime, Language_1.Language.Portuguese)}`,
        scavenging: "Vasculhando",
        casinoSimple: `Jogando no Cassino`,
        wantedSimple: "e Procurado",
        wantedSimpleEmote: `e ${emotes_1.EmoteString.Police} Procurado`,
        wantedComplex: `e ${emotes_1.EmoteString.Police} Procurado até`,
        wantedComplexUI: `e Procurado até`,
        hospitalSimple: "Hospitalizado",
        hospitalComplex: `Hospitalizado até`,
        gangActionSimple: "Participando de ação em gangue",
        gangActionComplex: "Participando de ação em gangue",
        deadSimple: "Morto",
        deadComplex: "Morto até",
    },
    [Language_1.Language.Spanish]: {
        idling: "Vagando",
        workingSimple: "",
        workingComplex: (description, jobTime) => `Trabajando como ${description}. Terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        workingComplexUI: (description, jobTime) => `Trabajando como ${description} hasta ${(0, ui_1.formatDate)(jobTime, Language_1.Language.Spanish)}`,
        robbing: "Robando",
        beingRobbedSimple: "Siendo robado",
        beingRobbedComplex: "Siendo robado por",
        defendingInvestmentSimple: "Defendiendo inversión",
        defendingInvestmentComplex: "Defendiendo inversión",
        beating: "Golpeando",
        beingBeatedUpSimple: "Siendo golpeado",
        beingBeatedUpComplex: "Siendo golpeado por",
        imprisonedSimple: "Preso",
        imprisonedAndHospitalSimple: "Preso y Hospitalizado",
        imprisonedAndHospitalSimpleEmote: `${emotes_1.EmoteString.Prison} Preso y ${emotes_1.EmoteString.Hospital} Hospitalizado`,
        imprisonedAndHospitalComplex: (prisonTime, hospitalTime) => `${emotes_1.EmoteString.Prison} Preso hasta ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.ShortDateTime)} y ${emotes_1.EmoteString.Hospital} Hospitalizado hasta ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.ShortDateTime)}`,
        imprisonedAndHospitalComplexUI: (prisonTime, hospitalTime) => `Preso hasta ${(0, ui_1.formatDate)(prisonTime, Language_1.Language.Spanish)} y Hospitalizado hasta ${(0, ui_1.formatDate)(hospitalTime, Language_1.Language.Spanish)}`,
        imprisonedComplex: "Preso hasta",
        scavenging: "Buscando",
        casinoSimple: `Jugando en Casino`,
        wantedSimple: "y Buscado",
        wantedSimpleEmote: `y ${emotes_1.EmoteString.Police} Buscado`,
        wantedComplex: `y ${emotes_1.EmoteString.Police} Buscado hasta`,
        wantedComplexUI: `y Buscado hasta`,
        hospitalSimple: "Hospitalizado",
        hospitalComplex: `Hospitalizado hasta`,
        gangActionSimple: "Participando en acción de cuadrilla",
        gangActionComplex: "Participando en acción de cuadrilla",
        deadSimple: "Muerto",
        deadComplex: "Muerto hasta",
    },
};
//# sourceMappingURL=User.js.map