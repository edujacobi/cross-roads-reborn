import { ItemId } from "./Ids";
import type { IDescription } from "./Interfaces";
export declare enum JobId {
    UberDriver = 0,// pedreiro
    Butcher = 1,// açougueiro
    Security = 2,// vigilante
    Gangster = 3,// segurança
    Hunter = 4,// caçador
    Funeral = 5,// funeral wrecker
    Militia = 6,// milicia
    Terrorist = 7,// mercenario
    CounterTerrorist = 8,// rei
    Spy = 9,// espiao
    Yakuza = 10,// yakuza
    Demolitionist = 11,// bomba pensar em outro
    Bodyguard = 12,// jacobi
    BlackMarket = 13,// informante
    Double = 14,// duble
    Extraditor = 15,// et
    Godfather = 16,// mafia
    Conqueror = 17
}
export interface Jobs {
    readonly Id: JobId;
    readonly Description: IDescription;
    readonly Duration: number;
    readonly Salary: number;
    readonly NeedItem: ItemId[] | null;
    readonly Special: boolean;
}
interface JobType {
    [string: string]: Jobs;
}
export declare const JobList: JobType;
export declare function getJobList(): Jobs[];
export {};
