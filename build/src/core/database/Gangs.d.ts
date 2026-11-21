import { type GangColorId } from "#core/types/GangColors";
import { GangRecruitmentType } from "#core/types/GangRecruitment";
import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class Gangs extends Model<InferAttributes<Gangs>, InferCreationAttributes<Gangs>> {
    id: CreationOptional<number>;
    name: string;
    acronym: string;
    money: number;
    baseId: CreationOptional<number>;
    color: GangColorId;
    image: string | null;
    description: string;
    experience: number;
    level: number;
    leaderId: string;
    recruitmentType: CreationOptional<GangRecruitmentType>;
    lastInvestmentRobbery: CreationOptional<Date | null>;
    shipmentArrivesAt: CreationOptional<Date | null>;
    lastShipmentSuccess: CreationOptional<Date | null>;
    lastShipmentCancelled: CreationOptional<Date | null>;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default Gangs;
