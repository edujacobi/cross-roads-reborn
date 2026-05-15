import { InventoryCanvasBuilder } from "#bot/ui/builders/InventoryCanvasBuilder";
import { type Gang } from "#core/models/Gang";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { UserBadge } from "#core/models/UserBadge";
import { subMinutes } from "date-fns";
import type { User as DiscordUser } from "discord.js";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	MediaGalleryBuilder,
	MessageFlags,
	type ChatInputCommandInteraction
} from "discord.js";
import { createButtonCollector } from "./collectors";
import { deferUpdate, replyInteraction } from "./discordInteractions";
import { EmoteId } from "./emotes";

export class Inventory {
	Interaction: ChatInputCommandInteraction;
	Target: User;
	Language: Language;
	FullSize: boolean = false;
	Badges: UserBadge[] = [];
	DiscordUser: DiscordUser;
	Gang: Gang | null = null;
	IsOnline: boolean = false;
	Attachments: AttachmentBuilder[] = [];
	Medias: MediaGalleryBuilder[] = [];

	constructor(interaction: ChatInputCommandInteraction, target: User, discordUser: DiscordUser, language: Language) {
		this.Interaction = interaction;
		this.Target = target;
		this.DiscordUser = discordUser;
		this.Language = language;
	}

	public async Load() {
		[this.Badges, this.Gang] = await Promise.all([
			UserBadge.GetList(this.Target.Id),
			this.Target.GetGang(),
		]);

		if (this.Target.IsVip()) {
			this.Badges = UserBadge.AddVIPBadgeInList(this.Badges, this.Target, this.Language);
		}

		const lastCommand = this.Interaction.client.userLastCommand.get(this.Target.Id) || 0;
		this.IsOnline = new Date(lastCommand) > subMinutes(new Date(), 15);
	}

	private async Render() {
		const builder = new InventoryCanvasBuilder({
			User: this.Target,
			Badges: this.Badges,
			DiscordUser: this.DiscordUser,
			Language: this.Language,
			FullSize: this.FullSize,
			Gang: this.Gang,
			IsOnline: this.IsOnline,
		});

		const s = Strings[this.Language];

		const buffer = await builder.GenerateImage();
		const name = `inventory${this.FullSize ? "_full" : ""}.webp`;
		const media = new MediaGalleryBuilder().addItems(image => image
			.setDescription(s.inventoryOf + " " + this.Target.Nickname)
			.setURL(`attachment://${name}`),
		);

		const attachment = new AttachmentBuilder(buffer, { name });

		const button = new ButtonBuilder()
			.setCustomId(this.FullSize ? "lessInfo" : "moreInfo")
			.setLabel(this.FullSize ? s.closeInv : s.openInv)
			.setEmoji(this.FullSize ? EmoteId.CloseInv : EmoteId.OpenInv)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>().setComponents(button);

		this.Attachments = [attachment];
		this.Medias = [media];
		return { row };
	}

	public async Generate() {
		const render = await this.Render();

		const response = await replyInteraction(this.Interaction, {
			components: [...this.Medias, render.row],
			files: this.Attachments,
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = createButtonCollector(this.Interaction, response);

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			this.FullSize = btn.customId === "moreInfo";
			const { row } = await this.Render();

			return replyInteraction(this.Interaction, {
				files: this.Attachments,
				components: [...this.Medias, row],
			});
		});

		collector?.on("end", async () => {
			await replyInteraction(this.Interaction, {
				files: this.Attachments,
				components: this.Medias,
			});
		});
	}
}

const Strings = {
	[Language.English]: {
		inventoryOf: "Inventory of",
		closeInv: "Close",
		openInv: "Open",
	},

	[Language.Portuguese]: {
		inventoryOf: "Inventário de",
		closeInv: "Fechar",
		openInv: "Abrir",
	},

	[Language.Spanish]: {
		inventoryOf: "Inventario de",
		closeInv: "Cerrar",
		openInv: "Abrir",
	},
} as const satisfies Localization;