import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class Vault extends Model<InferAttributes<Vault>, InferCreationAttributes<Vault>> {
    id: CreationOptional<number>;
    bankBalance: number;
    casinoBalance: number;
    mainHeistAllowed: boolean;
}
export default Vault;
