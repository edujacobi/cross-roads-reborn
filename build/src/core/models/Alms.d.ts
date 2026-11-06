import type { User } from "./User";
export declare class Alms {
    Giver: User;
    Receiver: User;
    Value: number;
    DefaultHours: number;
    BaseValue: number;
    VipValue: number;
    constructor(giver: User, receiver: User);
    CanGiveAlms(): {
        canGive: boolean;
        message: string;
    };
    GiveAlms(): Promise<void>;
}
