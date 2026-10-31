import { GangHeists } from "#core/database/GangHeists";
import type { InferAttributes } from "sequelize";
export declare class GangHeistRepository {
    /**
     * Gets the heist state for a gang. If none exists, creates it.
     */
    static GetByGangId(gangId: number): Promise<GangHeists>;
    /**
     * Updates the heist state for a gang.
     */
    static Update(gangId: number, values: Partial<InferAttributes<GangHeists>>): Promise<void>;
}
