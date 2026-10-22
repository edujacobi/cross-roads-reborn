import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "./Database";

export class TimedActions extends Model<InferAttributes<TimedActions>, InferCreationAttributes<TimedActions>> {
	declare id: string;
	declare userId: string;
	declare kind: "scavenge" | "robbery";
	declare referenceId: number;
	declare dueAt: Date;
	declare result: string | null;
}

TimedActions.init({
	id: { type: DataTypes.STRING, primaryKey: true },
	userId: { type: DataTypes.STRING, allowNull: false },
	kind: { type: DataTypes.STRING, allowNull: false },
	referenceId: { type: DataTypes.INTEGER, allowNull: false },
	dueAt: { type: DataTypes.DATE, allowNull: false },
	result: { type: DataTypes.TEXT, allowNull: true },
}, {
	sequelize,
	tableName: "timedActions",
	timestamps: false,
	indexes: [{ fields: ["userId", "kind"], unique: true }, { fields: ["dueAt"], where: { result: null } }],
});
