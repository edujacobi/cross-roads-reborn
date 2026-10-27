import { Shop } from "./Shop";
import type { User } from "./User";
export declare class BlackMarket extends Shop {
    constructor(user: User);
    IsBlackMarketOpen(): {
        isOpen: boolean;
        message: string;
    };
}
