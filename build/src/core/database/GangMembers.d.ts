import { type CreationOptional, type ForeignKey, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { Users } from "./Users";
import { Gangs } from "./Gangs";
export declare class GangMembers extends Model<InferAttributes<GangMembers>, InferCreationAttributes<GangMembers>> {
    id: CreationOptional<number>;
    gangId: ForeignKey<Gangs["id"]>;
    userId: ForeignKey<Users["id"]>;
    roleId: number;
    joinedAt: CreationOptional<Date>;
    depositTime: CreationOptional<Date>;
    depositAmount: CreationOptional<number>;
}
export default GangMembers;
