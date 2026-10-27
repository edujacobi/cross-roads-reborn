import type { User } from "./User";
export declare enum HospitalFailureReason {
    UserFree = 0,
    NextInLine = 1,
    WithoutMoney = 2
}
export declare class Hospital {
    User: User;
    PrivatePrice: number;
    PrivateBasePrice: number;
    constructor(user: User);
    CanPayPrivate(): Promise<{
        canPay: boolean;
        reason: HospitalFailureReason;
    } | {
        reason?: undefined;
        canPay: boolean;
    }>;
    PayPrivate(): Promise<false | undefined>;
    GetHospitalized(): Promise<import("../database/Users").Users[]>;
}
