import { UserBackgroundDecorations } from "#core/database/UserBackgroundDecorations";
import type { InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class UserBackgroundDecorationRepository {
    static FindOne(userId: string, backgroundDecorationId: number): Promise<UserBackgroundDecorations | null>;
    static FindAllByUserId(userId: string): Promise<UserBackgroundDecorations[]>;
    static Create(values: Optional<InferCreationAttributes<UserBackgroundDecorations>, NullishPropertiesOf<InferCreationAttributes<UserBackgroundDecorations>>>): Promise<UserBackgroundDecorations>;
    static Destroy(userId: string, backgroundDecorationId: number): Promise<number>;
    static DestroyAll(): Promise<number>;
}
