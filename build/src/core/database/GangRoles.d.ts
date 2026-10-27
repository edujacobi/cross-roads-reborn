import { type CreationOptional, type ForeignKey, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { Gangs } from "./Gangs";
export declare class GangRoles extends Model<InferAttributes<GangRoles>, InferCreationAttributes<GangRoles>> {
    id: CreationOptional<number>;
    gangId: ForeignKey<Gangs["id"]>;
    name: string;
    canInvite: boolean;
    canKick: boolean;
    canPromote: boolean;
    canEditGang: boolean;
    canImportShipments: boolean;
}
export default GangRoles;
