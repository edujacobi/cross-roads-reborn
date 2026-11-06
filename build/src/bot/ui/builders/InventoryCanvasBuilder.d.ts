import { BaseCanvasBuilder } from "#bot/ui/builders/BaseCanvasBuilder";
import { type Gang } from "#core/models/Gang";
import { Language } from "#core/models/Language";
import { type User } from "#core/models/User";
import { type UserBadge } from "#core/models/UserBadge";
import { type InvestmentId } from "#core/types/Investments";
import { type User as DUser } from "discord.js";
export interface InventoryCanvasBuilderOptions {
    User: User;
    Badges: UserBadge[];
    DiscordUser: DUser;
    Gang: Gang | null;
    Language: Language;
    FullSize: boolean;
    IsOnline: boolean;
}
export declare enum FooterType {
    None = 0,
    GangOnly = 1,
    InvestmentOnly = 2,
    Both = 3
}
export declare class InventoryCanvasBuilder extends BaseCanvasBuilder {
    User: User;
    Badges: UserBadge[];
    DiscordUser: DUser;
    Gang: Gang | null;
    FullSize: boolean;
    IsOnline: boolean;
    static readonly MAX_ITEMS_PER_ROW = 8;
    static readonly MAX_ITEMS_PER_ROW_FULL_SIZE = 3;
    static readonly GRID_ITEM_HEIGHT = 127;
    static readonly GRID_ITEM_WIDTH_SMALL = 127;
    static readonly GRID_ITEM_WIDTH_LARGE = 378;
    private static readonly Layout;
    constructor(params: InventoryCanvasBuilderOptions);
    static getFooterType(params: {
        User: {
            Investment: {
                Id: InvestmentId | null;
            };
        };
        Gang: Gang | null;
    }): FooterType;
    /**
     * Calculates the required canvas height (changes based on FullSize and lenght of items)
     */
    private static calculateHeight;
    /**
     * Builds the inventory canvas.
     */
    GetCanvas(): Promise<import("@napi-rs/canvas").Canvas>;
    /**
     * Adds the background to the canvas.
     * NOT USED (DEFAULT TO TRANSPARENT BACKGROUND)
     */
    AddBackground(): this;
    /**
     * Adds the header to the canvas.
     * Header: Name, Badges, Money, Avatar, Online Indicator
     */
    AddHeader(): Promise<this>;
    /**
     * Splits into two decomposition paths, addressing review point #3.
     */
    AddSubHeader(): Promise<this>;
    /**
     * Adds the sub-header to the canvas (full size).
     * Sub-header: Situation (Complex), Class, Attributes (ATK, DEF)
     */
    private AddSubHeaderOpen;
    /**
     * Adds the sub-header to the canvas (closed).
     * Sub-header: Class, Attributes (ATK, DEF), Situation (Simple)
     */
    private AddSubHeaderClosed;
    /**
     * Adds the item grid to the canvas.
     * Item can have Skin.
     * Yellow Warning if below 24 hours or 2 or less quantity.
     * Red Warning if below 12 hours or 1 or less quantity.
     */
    AddItemGrid(): Promise<this>;
    /**
     * Adds the footers to the canvas.
     * Footer can be clear (no gang and no investment), with gang (on the right) and with investment (on the left), or with both
     */
    AddFooters(): Promise<this>;
    /**
     * Draws the investment bar.
     * Investment bar can be full size (64px height, with remaining time) or small size (32px height, without remaining time).
     */
    private DrawInvestmentBar;
}
