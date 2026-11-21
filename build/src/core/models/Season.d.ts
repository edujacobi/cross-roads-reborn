import { type Users } from "#core/database/Users";
export interface TopUserEntry {
    id: string;
    nickname: string;
    class: number;
    value: number;
}
export interface TopGangEntry {
    id: number;
    name: string;
    level: number;
}
export interface SeasonTopData {
    topMoney: TopUserEntry[];
    topGambler: TopUserEntry[];
    topSpender: TopUserEntry[];
    topThiefProfit: TopUserEntry[];
    topThiefQuantity: TopUserEntry[];
    topWorker: TopUserEntry[];
    topBeater: TopUserEntry[];
    topScavenger: TopUserEntry[];
    topHospital: TopUserEntry[];
    topBriber: TopUserEntry[];
    topEscaper: TopUserEntry[];
    topDrunk: TopUserEntry[];
    topInvestor: TopUserEntry[];
    topGang: TopGangEntry[];
}
export declare class Season {
    static readonly DEFAULT_DURATION_DAYS = 120;
    private static isTransitioning;
    private static readonly DefaultTopData;
    Id: number;
    Number: number;
    StartDate: Date;
    EndDate: Date;
    TopData: SeasonTopData;
    HowManyPlayers: number;
    static Initialize(): Promise<void>;
    static GetCurrent(): Promise<Season>;
    static GetByNumber(number: number): Promise<Season | null>;
    static GetAll(): Promise<Season[]>;
    static GetSeasonsList(): Promise<{
        number: number;
    }[]>;
    static GetEndSeasonRankingData(): Promise<[Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], import("../database/Gangs").Gangs[]]>;
    static GetEndSeasonStats(): Promise<[number, number, number, number, number, number, number, number, number, number, number]>;
    static GetActivePlayerCount(): Promise<number>;
    private static FromDatabase;
    Create(): Promise<void>;
    Update(): Promise<void>;
    get IsActive(): boolean;
    GetDaysRemaining(): number;
    UpdateTopPlayers(): Promise<void>;
    AwardTopPlayers(): Promise<void>;
    AnnounceToPlayers(): Promise<void>;
    static EndCurrentSeason(isPreSeason?: boolean): Promise<void>;
    static CheckForSeasonTransition(): Promise<void>;
}
