export enum ClashType {
	User = 1,
	Location,
	BeatUp,
	Investment,
}

export interface RobberyInitData {
	attackerTimeInPrison: number;
	attackerAditionalTimeCallPolice: number;
	defenderTimeInHospital: number;
	cannotReact: boolean;
	cannotCallPolice: boolean;
	usedGunSkin: string;
	usedGunName: string;
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
