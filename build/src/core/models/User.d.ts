import type { Users } from "#core/database/Users";
import { type UserUpdateParam } from "#core/repositories/UserRepository";
import { type AvatarDecorations } from "#core/types/AvatarDecorations";
import { type BackgroundDecorations } from "#core/types/BackgroundDecorations";
import { ClassId } from "#core/types/Classes";
import type { GangColorId } from "#core/types/GangColors";
import { AvatarDecorationId, BackgroundDecorationId, BundleId, ItemId } from "#core/types/Ids";
import { type Items, type UserItem } from "#core/types/Items";
import { type JobId } from "#core/types/Jobs";
import { type LocationId } from "#core/types/Locations";
import { type ScavengeId } from "#core/types/Scavenge";
import { type SkinBundles } from "#core/types/Skins";
import type { Gang } from "./Gang";
import { Language } from "./Language";
import { type InvestmentId } from "#core/types/Investments";
export { SituationId } from "#core/types/Ids";
export type AvailabilityReason = "scavenging" | "working" | "prison" | "wanted" | "hospital" | "escaping" | "casino" | "defendingInvestment" | "gangAction" | "beating" | "beingBeatUp" | "robbing" | "beingRobbed" | "robbingLocation" | "dead";
export type AvailabilityResult = {
    available: true;
} | {
    available: false;
    reason: AvailabilityReason;
    time?: Date;
    targetId?: string;
    referenceId?: string | number;
};
export declare class User {
    static VIP_BASE_PRICE: number;
    static VIP_PRICE_PER_DAY: number;
    static VIP_MIN_DAYS: number;
    Id: string;
    CreatedAt: Date;
    UpdatedAt: Date;
    VipTime: Date | null;
    VipEternal: boolean;
    Language: Language;
    Nickname: string;
    Money: number;
    Class: ClassId;
    GangId: number | null;
    SpecialCoin: number;
    AvatarDecoration: AvatarDecorations;
    BackgroundDecoration: BackgroundDecorations;
    NicknameChangeCount: number;
    ClassChangeCount: number;
    Vote: {
        LastClaim: Date | null;
        Count: number;
    };
    Daily: {
        CurrentStreak: number;
        MaxStreak: number;
        LastReceived: Date | null;
    };
    Job: {
        Id: JobId | null;
        EndsIn: Date;
        ReceivedSum: number;
        ReceivedCount: number;
    };
    Robbery: {
        SuccessCount: number;
        FailureCount: number;
        BeingRobbedCount: number;
        SuccessRobbedSum: number;
        BeingRobbedSum: number;
        IsRobbingId: string | null;
        IsBeingRobbedById: string | null;
        IsRobbingLocationId: LocationId | null;
        InvestmentIsDefending: boolean;
        ParticipatingInGangAction: boolean;
    };
    Prison: {
        Count: number;
        BriberySum: number;
        BriberyCount: number;
        HasPaidBribe: boolean;
        Time: Date;
    };
    Escape: {
        Count: number;
        Time: Date;
        HasTried: boolean;
    };
    Wanted: {
        Count: number;
        Time: Date;
    };
    DeadUntil: Date;
    Hospital: {
        Count: number;
        TreatmentCount: number;
        TreatmentSum: number;
        Time: Date;
    };
    Casino: {
        IsInGame: boolean;
        WinCount: number;
        LoseCount: number;
        WinSum: number;
        LoseSum: number;
    };
    Shop: {
        SpentSum: number;
        SpentCount: number;
    };
    BeatUp: {
        IsBeatingId: string | null;
        IsBeingBeatUpById: string | null;
        SuccessCount: number;
        FailureCount: number;
        BeatedUpCount: number;
        Time: Date;
    };
    Attributes: {
        Attack: number;
        Defense: number;
        MoneyAttack: number;
        MoneyDefense: number;
    };
    Situation: {
        Id: number;
        Simple: string;
        SimpleEmote: string;
        Complex: string;
        ComplexUI: string;
        EmoteId: string;
    };
    BestGun: UserItem | null;
    Alms: {
        GiveTime: Date;
        ReceiveTime: Date;
        GivenSum: number;
        GivenCount: number;
        ReceivedSum: number;
        ReceivedCount: number;
    };
    Scavenge: {
        IsScavengingId: ScavengeId | null;
        Count: number;
        Time: Date;
        Found: {
            Total: number;
            Items: number;
            MoneyCount: number;
            MoneySum: number;
            Failures: number;
            FailureWithHospital: number;
            FailureWithPrison: number;
        };
    };
    Drink: {
        Normal: number;
        HappyHour: number;
        DrunkCount: number;
    };
    Investment: {
        Id: InvestmentId | null;
        AccumulatedYield: number;
        HenchmanEndsAt: Date | null;
        HenchmanHospitalized: boolean;
        ExpiresAt: Date | null;
        PurchasedAt: Date | null;
        NotifyYield: boolean;
        TotalProfit: number;
    };
    Items: UserItem[];
    AutomaticGrenade: boolean;
    /**
     * Creates a new instance of User.
     * @param id The user's Id (usually Discord Id).
     * @param language The user's preferred language.
     */
    constructor(id: string, language?: Language);
    /**
     * Creates the user in the database.
     */
    Create(): Promise<void>;
    /**
     * Loads user information from the database.
     * @param fromUser Optional Users model instance to load from.
     * @param language Optional language to override.
     * @returns The User instance or null if not found.
     */
    GetInfo(fromUser?: Users, language?: Language): Promise<this | null>;
    /**
     * Loads basic user information from the database without expensive lookups.
     * @param fromUser Optional Users model instance to load from.
     * @param language Optional language to override.
     * @returns The User instance or null if not found.
     */
    GetSimpleInfo(fromUser?: Users, language?: Language, options?: {
        skipGangLookup?: boolean;
    }): Promise<this | null>;
    /**
     * Sets the user's nickname.
     * @param nickname The new nickname.
     * @param cost Optional cost to change the nickname.
     * @returns True if successful, false if not enough money.
     */
    SetNickname(nickname: string, cost?: number): Promise<boolean>;
    /**
     * Sets the user's class.
     * @param classId The new class Id.
     * @param cost Optional cost to change the class.
     * @returns True if successful, false if not enough money.
     */
    SetClass(classId: ClassId, cost?: number): Promise<boolean>;
    /**
     * Gets the cost to change the nickname.
     * @returns The cost.
     */
    GetNicknameChangeCost(): number;
    /**
     * Gets the cost to change the class.
     * @returns The cost.
     */
    GetClassChangeCost(): number;
    /**
     * Gets the localized text of the user's class.
     * @returns The class name.
     */
    GetClassText(): string;
    /**
     * Gets the user's name with the class image emote.
     * @returns The formatted string.
     */
    GetNameWithImage(): string;
    /**
     * Checks if the user is a VIP.
     * @returns True if VIP, false otherwise.
     */
    IsVip(): boolean;
    /**
     * Buys VIP time using special coins.
     * @param months Number of months to buy.
     */
    BuyVip(months: number): Promise<void>;
    BuyVipForDays(days: number): Promise<boolean>;
    GiftVipForDays(receiver: User, days: number): Promise<boolean>;
    /**
     * Adds VIP time to the user.
     * @param days Number of days to add.
     */
    AddVip(days: number, setAvatarDecoration?: boolean): Promise<void>;
    /**
     * Sets eternal VIP status, or toggles it when no value is provided.
     */
    SetEternalVip(eternal?: boolean): Promise<void>;
    /**
     * Adds special coins to the user.
     * @param coins Number of coins to add.
     */
    AddSpecialCoin(coins: number): Promise<void>;
    /**
     * Checks if the user can receive the daily reward.
     * @returns True if eligible, false otherwise.
     */
    CanReceiveDaily(): boolean;
    /**
     * Receives the daily reward.
     * @param options Options for the daily reward.
     * @param options.isBooster Whether the user is a server booster.
     * @returns The money received and any bonus items.
     */
    ReceiveDaily({ isBooster }: {
        isBooster: boolean;
    }): Promise<{
        money: number;
        bonusItems: {
            item: Items;
            quantity?: number;
            days?: number;
        }[];
    }>;
    /**
     * Checks if the user can claim a new vote reward.
     * @returns True if eligible, false otherwise.
     */
    CanClaimVote(): boolean;
    /**
     * Claims the vote reward from Top.gg.
     * @param votedAt Optional timestamp of the vote from Top.gg.
     */
    ClaimVoteReward(votedAt?: Date): Promise<void>;
    /**
     * Gives an item to the user without charging money.
     * @param item The item to give.
     * @param quantity Optional quantity for consumables.
     * @param days Optional duration in days for non-consumables.
     */
    GiveItem(item: Items, quantity?: number, days?: number): Promise<void>;
    /**
     * Buys an item for the user.
     * @param item The item to buy.
     * @returns True if successful.
     */
    BuyItem(item: Items): Promise<boolean>;
    /**
     * Consumes an item from the user's inventory.
     * @param itemId The item Id to consume.
     * @param quantity The quantity to consume.
     * @returns True if successful.
     */
    ConsumeItem(itemId: ItemId, quantity?: number): Promise<boolean>;
    /**
     * Get all items from user that are greater than 0 and or are not expired
     */
    private GetItems;
    /**
     * Get all items from user, even if quantity is 0 and remaining time is less than now (expired)
     */
    GetAllItems(): Promise<UserItem[]>;
    /**
     * Get the Item data, even if user doesnot have it in database (blank values)
     * @param itemId
     */
    GetSpecificItem(itemId: number): Promise<UserItem>;
    /**
     * Gets the skin string for a specific item.
     * @param item The item to get the skin for.
     * @returns The skin string.
     */
    GetItemSkin(item: Items): string;
    /**
     * Sets the skin for a specific item.
     * @param item The item to set the skin for.
     * @param bundle The skin bundle.
     */
    SetItemSkin(item: Items, bundle: SkinBundles): Promise<void>;
    /**
     * Sets the skin for all items in a bundle.
     * @param bundle The skin bundle.
     */
    SetBundleSkin(bundle: SkinBundles): Promise<void>;
    /**
     * Sets the avatar decoration for the user.
     * @param decoration The avatar decoration.
     */
    SetAvatarDecoration(decoration: AvatarDecorations): Promise<boolean>;
    /**
     * Calculates the user's attributes based on items and other factors.
     * @param isBeatUp Whether the user is in a beat-up situation.
     * @param usedConsumables List of consumable items used in the current action.
     */
    GetAttributes(isBeatUp?: boolean, usedConsumables?: ItemId[]): Promise<void>;
    /**
     * Determines the current situation of the user.
     * @param language Optional language to override.
     */
    GetSituation(language?: Language): Promise<void>;
    /**
     * Check if the user is not doing any action
     * Note: "Wanted" does not affect Idling
     */
    IsIdling(): boolean;
    /**
     * Checks user availability to perform actions based on active states.
     * Allows bypassing specific checks via ignoreReasons array.
     */
    CheckAvailability(ignoreReasons?: AvailabilityReason[]): AvailabilityResult;
    /**
     * Checks if the user is working.
     */
    IsWorking(): boolean;
    /**
     * Checks if the user is dead.
     */
    IsDead(): boolean;
    /**
     * Checks if the user is in prison.
     */
    IsInPrison(): boolean;
    /**
     * Checks if the user is wanted.
     */
    IsWanted(): boolean;
    /**
     * Checks if an escape is in progress or still awaiting a persisted result.
     */
    IsEscaping(): boolean;
    /**
     * Checks if the user is in hospital.
     */
    IsInHospital(): boolean;
    /**
     * Checks if the user is scavenging.
     */
    IsScavenging(): boolean;
    /**
     * Checks if the user is in a robbery situation.
     */
    IsInRobbery(): boolean;
    /**
     * Checks if the user is defending an investment.
     */
    IsDefendingInvestment(): boolean;
    /**
     * Checks if the user is participating in a gang action.
     */
    IsParticipatingInGangAction(): boolean;
    /**
     * Checks if the user is in a beat-up situation.
     */
    IsInBeatUp(): boolean;
    /**
     * Checks if the user is in a Casino game
     */
    IsInCasinoGame(): boolean;
    static IsHappyHour(date?: Date): boolean;
    CanDrinkAtBar(): boolean;
    DrinkAtBar(drinkCount: number, happyHour?: boolean): Promise<{
        success: boolean;
        message: string;
        beverage: string | null;
        sensation: string | null;
        drinkCount: number;
        happyHour: boolean;
        hospitalized: boolean;
        hospitalTime: Date | null;
        normalRecord: number;
        happyHourRecord: number;
        drunkCount: number;
    }>;
    /**
     * Starts a job for the user.
     * @param jobId The job Id.
     */
    StartJob(jobId: JobId): Promise<void>;
    /**
     * Cancels the current job.
     */
    CancelJob(): Promise<void>;
    /**
     * Ends the current job and gives the reward.
     */
    EndJob(): Promise<void>;
    /**
     * Buys a skin bundle.
     * @param bundleId The bundle Id.
     * @returns True if successful.
     */
    BuySkinBundle(bundleId: BundleId): Promise<boolean>;
    /**
     * Buys an avatar decoration.
     * @param avatarDecorationId The avatar decoration Id.
     * @returns True if successful.
     */
    BuyAvatarDecoration(avatarDecorationId: AvatarDecorationId): Promise<boolean>;
    /**
     * Buys a background decoration.
     * @param backgroundDecorationId The background decoration Id.
     * @returns True if successful.
     */
    BuyBackgroundDecoration(backgroundDecorationId: BackgroundDecorationId): Promise<boolean>;
    /**
     * Sets the user's background decoration.
     * @param decoration The background decoration.
     */
    SetBackgroundDecoration(decoration: BackgroundDecorations): Promise<boolean>;
    /**
     * Updates the user in the database.
     */
    Update(values: UserUpdateParam): Promise<boolean>;
    /**
     * Updates the user's language.
     * @param language The new language.
     */
    UpdateLanguage(language: Language): Promise<void>;
    /**
     * Checks if the user is in a gang.
     */
    IsInGang(): boolean;
    /**
     * Gets the user's gang.
     * @returns The gang or null if not in one.
     */
    GetGang(): Promise<Gang | null>;
    /**
     * Creates a new gang.
     * @param name Gang name.
     * @param acronym Gang acronym.
     * @param description Gang description.
     * @param color Gang color.
     * @param image Gang image URL.
     * @returns The created gang or null if failed.
     */
    CreateGang(name: string, acronym: string, description: string, color: GangColorId, image?: string | null): Promise<Gang | null>;
    /**
     * Leaves the current gang.
     * @returns True if successful.
     */
    LeaveGang(): Promise<boolean>;
    /**
     * Searches for a user by name or Id.
     * @param nameOrId The name or Id to search for.
     * @param language Optional language.
     * @returns The User instance or null if not found.
     */
    static Search(nameOrId: string, language?: Language): Promise<User | null>;
    /**
     * Sets the user's automatic grenade option.
     * @param value The new value.
     */
    SetAutomaticGrenade(value: boolean): Promise<void>;
    /**
     * Kills the user for a specified number of days.
     * @param days The number of days to kill the user for.
     * @returns The time the user will be dead until.
     */
    Kill(days: number): Promise<Date>;
    /**
     * Cures the user from the hospital.
     */
    Cure(adminId: string): Promise<void>;
    /**
     * Frees the user from prison.
     */
    Free(adminId: string): Promise<void>;
    /**
     * Removes the user from a specific action.
     * @param action The action type ('job', 'scavenge', 'robbery', 'beatup', 'casino', 'gangaction')
     * @param adminId The ID of the admin who performed the action (for logging)
     */
    RemoveAction(action: string, adminId: string): Promise<void>;
    /**
     * Resets a specific cooldown for the user.
     * @param cooldown The cooldown type ('scavenge', 'robbery', 'beatup')
     * @param adminId The ID of the admin who performed the action (for logging)
     */
    ResetCooldown(cooldown: string, adminId: string): Promise<void>;
}
