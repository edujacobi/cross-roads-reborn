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
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	type ChatInputCommandInteraction
} from "discord.js";
import { deferUpdate, replyInteraction, replyWithContainer } from "./discordInteractions";
import { EmoteId, EmoteString } from "./emotes";
import { defaultComponent } from "./ui";
import { CrColors } from "./colors";

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
	IsCallerDevOrMod: boolean = false;
	ActiveMenu: "removeAction" | "resetCooldown" | null = null;

	constructor(interaction: ChatInputCommandInteraction, target: User, discordUser: DiscordUser, language: Language) {
		this.Interaction = interaction;
		this.Target = target;
		this.DiscordUser = discordUser;
		this.Language = language;
	}

	public async Load() {
		const callerId = this.Interaction.user.id;
		const [badges, gang, isDev, isMod] = await Promise.all([
			UserBadge.GetList(this.Target.Id),
			this.Target.GetGang(),
			UserBadge.IsDeveloper(callerId),
			UserBadge.IsModerator(callerId),
		]);

		this.Badges = badges;
		this.Gang = gang;
		this.IsCallerDevOrMod = isDev || isMod;

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

		let row: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>;

		if (this.ActiveMenu === "removeAction") {
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId("selectRemoveAction")
				.setPlaceholder(s.selectActionPlaceholder)
				.addOptions([
					new StringSelectMenuOptionBuilder().setLabel(s.actionJob).setValue("job").setEmoji(EmoteId.Jobs),
					new StringSelectMenuOptionBuilder().setLabel(s.actionScavenge).setValue("scavenge").setEmoji(EmoteId.Scavenge),
					new StringSelectMenuOptionBuilder().setLabel(s.actionRobbery).setValue("robbery").setEmoji(EmoteId.Robbery),
					new StringSelectMenuOptionBuilder().setLabel(s.actionBeatUp).setValue("beatup").setEmoji(EmoteId.Beat),
					new StringSelectMenuOptionBuilder().setLabel(s.actionCasino).setValue("casino").setEmoji(EmoteId.Casino),
					new StringSelectMenuOptionBuilder().setLabel(s.actionGangAction).setValue("gangaction").setEmoji(EmoteId.Gang),
					new StringSelectMenuOptionBuilder().setLabel(s.cancel).setValue("cancel"),
				]);
			row = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu);
		}
		else if (this.ActiveMenu === "resetCooldown") {
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId("selectResetCooldown")
				.setPlaceholder(s.selectCooldownPlaceholder)
				.addOptions([
					new StringSelectMenuOptionBuilder().setLabel(s.cooldownScavenge).setValue("scavenge").setEmoji(EmoteId.Scavenge),
					new StringSelectMenuOptionBuilder().setLabel(s.cooldownRobbery).setValue("robbery").setEmoji(EmoteId.Police),
					new StringSelectMenuOptionBuilder().setLabel(s.cooldownBeatUp).setValue("beatup").setEmoji(EmoteId.Beat),
					new StringSelectMenuOptionBuilder().setLabel(s.cancel).setValue("cancel"),
				]);
			row = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu);
		}
		else {
			const button = new ButtonBuilder()
				.setCustomId(this.FullSize ? "lessInfo" : "moreInfo")
				.setLabel(this.FullSize ? s.closeInv : s.openInv)
				.setEmoji(this.FullSize ? EmoteId.CloseInv : EmoteId.OpenInv)
				.setStyle(ButtonStyle.Secondary);

			const defaultRow = new ActionRowBuilder<ButtonBuilder>().setComponents(button);

			if (this.IsCallerDevOrMod) {
				const healButton = new ButtonBuilder()
					.setCustomId("adminHeal")
					.setLabel(s.heal)
					.setEmoji(EmoteId.Hospital)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(!this.Target.IsInHospital());

				const freeButton = new ButtonBuilder()
					.setCustomId("adminFree")
					.setLabel(s.free)
					.setEmoji(EmoteId.Prison)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(!this.Target.IsInPrison());

				const removeActionButton = new ButtonBuilder()
					.setCustomId("triggerRemoveAction")
					.setLabel(s.removeActionBtn)
					.setStyle(ButtonStyle.Secondary);

				const resetCooldownButton = new ButtonBuilder()
					.setCustomId("triggerResetCooldown")
					.setLabel(s.resetCooldownBtn)
					.setStyle(ButtonStyle.Secondary);

				defaultRow.addComponents(healButton, freeButton, removeActionButton, resetCooldownButton);
			}

			row = defaultRow;
		}

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

		if (!response) {
			return;
		}

		const collector = response.createMessageComponentCollector({
			filter: i => i.user.id === this.Interaction.user.id,
			idle: 60_000,
		});

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			if (btn.customId === "moreInfo") {
				this.FullSize = true;
			}
			else if (btn.customId === "lessInfo") {
				this.FullSize = false;
			}
			else if (btn.customId === "adminHeal") {
				await this.Target.Cure(this.Interaction.user.id);
				const container = defaultComponent({
					color: CrColors.Hospital,
					description: `User **${this.Target.GetNameWithImage()}** is now free from ${EmoteString.Hospital} Hospital.`,
				});

				return replyWithContainer(btn, container);
			}
			else if (btn.customId === "adminFree") {
				await this.Target.Free(this.Interaction.user.id);
				const container = defaultComponent({
					color: CrColors.Police,
					description: `User **${this.Target.GetNameWithImage()}** is now free from ${EmoteString.Prison} Prison.`,
				});

				return replyWithContainer(btn, container);
			}
			else if (btn.customId === "triggerRemoveAction") {
				this.ActiveMenu = "removeAction";
			}
			else if (btn.customId === "triggerResetCooldown") {
				this.ActiveMenu = "resetCooldown";
			}
			else if (btn.isStringSelectMenu()) {
				const selectedValue = btn.values[0];
				this.ActiveMenu = null;

				if (selectedValue !== "cancel") {
					if (btn.customId === "selectRemoveAction") {
						await this.Target.RemoveAction(selectedValue, this.Interaction.user.id);
					}
					else if (btn.customId === "selectResetCooldown") {
						await this.Target.ResetCooldown(selectedValue, this.Interaction.user.id);
					}
				}
			}

			const { row } = await this.Render();

			return replyInteraction(this.Interaction, {
				files: this.Attachments,
				components: [...this.Medias, row],
			});
		});

		collector?.on("end", async () => {
			this.ActiveMenu = null;
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
		heal: "Heal",
		free: "Free",
		selectActionPlaceholder: "Choose action to remove...",
		selectCooldownPlaceholder: "Choose cooldown to reset...",
		actionJob: "Job",
		actionScavenge: "Scavenge",
		actionRobbery: "Robbery",
		actionBeatUp: "Beat Up",
		actionCasino: "Casino",
		actionGangAction: "Gang Action",
		cancel: "Cancel",
		cooldownScavenge: "Scavenge",
		cooldownRobbery: "Robbery (Wanted)",
		cooldownBeatUp: "Beat Up",
		removeActionBtn: "Remove action",
		resetCooldownBtn: "Reset cooldown",
	},

	[Language.Portuguese]: {
		inventoryOf: "Inventário de",
		closeInv: "Fechar",
		openInv: "Abrir",
		heal: "Curar",
		free: "Libertar",
		selectActionPlaceholder: "Escolha a ação para remover...",
		selectCooldownPlaceholder: "Escolha o tempo de recarga para zerar...",
		actionJob: "Trabalho",
		actionScavenge: "Vasculhar",
		actionRobbery: "Roubar",
		actionBeatUp: "Espancar",
		actionCasino: "Cassino",
		actionGangAction: "Ação de Gangue",
		cancel: "Cancelar",
		cooldownScavenge: "Vasculhar",
		cooldownRobbery: "Roubar (Procurado)",
		cooldownBeatUp: "Espancar",
		removeActionBtn: "Remover ação",
		resetCooldownBtn: "Zerar cooldown",
	},

	[Language.Spanish]: {
		inventoryOf: "Inventario de",
		closeInv: "Cerrar",
		openInv: "Abrir",
		heal: "Curar",
		free: "Liberar",
		selectActionPlaceholder: "Elige la acción a eliminar...",
		selectCooldownPlaceholder: "Elige el tiempo de recarga a reiniciar...",
		actionJob: "Trabajo",
		actionScavenge: "Buscar",
		actionRobbery: "Robar",
		actionBeatUp: "Golpear",
		actionCasino: "Casino",
		actionGangAction: "Acción de Banda",
		cancel: "Cancelar",
		cooldownScavenge: "Buscar",
		cooldownRobbery: "Robar (Buscado)",
		cooldownBeatUp: "Golpear",
		removeActionBtn: "Eliminar acción",
		resetCooldownBtn: "Reiniciar cooldown",
	},
} as const satisfies Localization;