import { UserBundles } from "#core/database/UserBundles";
import type { InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class UserBundleRepository {
    static FindOne(userId: string, bundleId: number): Promise<UserBundles | null>;
    static FindAllByUserId(userId: string): Promise<UserBundles[]>;
    static Create(values: Optional<InferCreationAttributes<UserBundles>, NullishPropertiesOf<InferCreationAttributes<UserBundles>>>): Promise<UserBundles>;
    static Destroy(userId: string, bundleId: number): Promise<number>;
    static DestroyAll(): Promise<number>;
}
