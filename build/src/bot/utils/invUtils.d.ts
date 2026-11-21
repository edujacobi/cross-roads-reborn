import { type Gang } from "#core/models/Gang";
import { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import { UserBadge } from "#core/models/UserBadge";
import { AttachmentBuilder, type ChatInputCommandInteraction, MediaGalleryBuilder, type User as DiscordUser } from "discord.js";
export declare class Inventory {
    Interaction: ChatInputCommandInteraction;
    Target: User;
    Language: Language;
    FullSize: boolean;
    Badges: UserBadge[];
    DiscordUser: DiscordUser;
    Gang: Gang | null;
    IsOnline: boolean;
    Attachments: AttachmentBuilder[];
    Medias: MediaGalleryBuilder[];
    IsCallerDevOrMod: boolean;
    ActiveMenu: "removeAction" | "resetCooldown" | null;
    constructor(interaction: ChatInputCommandInteraction, target: User, discordUser: DiscordUser, language: Language);
    Load(): Promise<void>;
    private Render;
    Generate(): Promise<void>;
}
