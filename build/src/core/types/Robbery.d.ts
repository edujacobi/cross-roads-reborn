export declare enum ClashType {
    User = 1,
    Location = 2,
    BeatUp = 3,
    Investment = 4
}
export interface RobberyInitData {
    attackerTimeInPrison: number;
    attackerAditionalTimeCallPolice: number;
    defenderTimeInHospital: number;
    cannotReact: boolean;
    cannotCallPolice: boolean;
    usedGunSkin: string;
    usedGunName: string;
    usedGrenade: boolean;
}
export interface RobberyOutcomeData {
    success: boolean;
    moneyRobbed: number;
    willBeBeatenUp: boolean;
    attackerPrisonTime?: Date;
    defenderHospitalTime?: Date;
    attackerWantedTime?: Date;
}
export interface RobberyLocationOutcomeData {
    success: boolean;
    moneyRobbed: number;
    attackerPrisonTime?: Date;
    attackerWantedTime?: Date;
}
