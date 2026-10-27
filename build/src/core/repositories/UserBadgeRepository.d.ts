import { UserBadges } from "#core/database/UserBadges";
import type { InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class UserBadgeRepository {
    static FindOne(userId: string, badgeId: number): Promise<UserBadges | null>;
    static FindAllByUserId(userId: string): Promise<UserBadges[]>;
    static Create(values: Optional<InferCreationAttributes<UserBadges>, NullishPropertiesOf<InferCreationAttributes<UserBadges>>>): Promise<UserBadges>;
    static Destroy(userId: string, badgeId: number): Promise<number>;
    static DestroyAll(): Promise<number>;
}
