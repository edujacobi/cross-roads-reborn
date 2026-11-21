import { DataTypes } from "sequelize";
export declare function createIdAttribute(): {
    id: {
        type: DataTypes.IntegerDataTypeConstructor;
        primaryKey: boolean;
        autoIncrement: boolean;
    };
};
export declare function createTimestampAttributes(): {
    createdAt: {
        type: DataTypes.DateDataTypeConstructor;
        allowNull: boolean;
        defaultValue: DataTypes.AbstractDataTypeConstructor;
    };
    updatedAt: {
        type: DataTypes.DateDataTypeConstructor;
        allowNull: boolean;
        defaultValue: DataTypes.AbstractDataTypeConstructor;
    };
};
