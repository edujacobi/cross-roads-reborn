import { GangRoles } from "#core/database/GangRoles";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class GangRoleRepository {
    static FindById(id: number): Promise<GangRoles | null>;
    static FindAllByGangId(gangId: number): Promise<GangRoles[]>;
    static Create(values: Optional<InferCreationAttributes<GangRoles>, NullishPropertiesOf<InferCreationAttributes<GangRoles>>>): Promise<GangRoles>;
    static Update(id: number, values: Partial<InferAttributes<GangRoles>>): Promise<[number]>;
    static Destroy(id: number): Promise<number>;
    static DestroyAllByGangId(gangId: number): Promise<number>;
    static DestroyAll(): Promise<number>;
}
