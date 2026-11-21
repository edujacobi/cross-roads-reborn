import { ActionRowBuilder, ButtonBuilder, type ChatInputCommandInteraction, type AttachmentBuilder } from "discord.js";
import { Language } from "./Language";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
export declare class Pagination {
    Interaction: ChatInputCommandInteraction;
    Language: Language;
    Offset: number;
    Limit: number;
    HowManyRecords: number;
    UserHasInteractedOutside: boolean;
    Attachments: AttachmentBuilder[];
    CustomizeContainer: (() => Promise<CustomContainerBuilder>);
    constructor(interaction: ChatInputCommandInteraction, language: Language);
    GenerateRow(): ActionRowBuilder<ButtonBuilder>;
    private Showing;
    BuildContainerWithRow(showFooter?: boolean): Promise<CustomContainerBuilder>;
    GenerateContainer(mainContainer?: CustomContainerBuilder): Promise<{
        response: import("discord.js").InteractionResponse<boolean> | import("discord.js").Message<boolean> | undefined;
        collector: import("discord.js").InteractionCollector<import("discord.js").ButtonInteraction<import("discord.js").CacheType>> | undefined;
    }>;
}
