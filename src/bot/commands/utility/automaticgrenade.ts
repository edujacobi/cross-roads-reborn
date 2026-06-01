import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("automaticgrenade")
		.setNameLocalization(Locale.PortugueseBR, "granadaautomatica")
		.setNameLocalization(Locale.SpanishES, "granadaautomatica")
		.setDescription("Enable or disable automatically using grenades in rob and beatup commands")
		.setDescriptionLocalization(Locale.PortugueseBR, "Ativa ou desativa o uso automático de granadas nos comandos roubar e espancar")
		.setDescriptionLocalization(Locale.SpanishES, "Activa o desactiva el uso automático de granadas en los comandos de robo y golpear"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		function getStatusText(enabled: boolean, lang: Language) {
			const s = Strings[lang];
			return enabled ? `${EmoteString.Online} **${s.enabled}**` : `${EmoteString.Offline} **${s.disabled}**`;
		}

		function buildContainer(currentUser: User, lang: Language) {
			const s = Strings[lang];
			return new CustomContainerBuilder()
				.setUser(currentUser)
				.setAccentColor(CrColors.Default)
				.addTexts([
					`# ${s.title}`,
					s.explanation,
					"",
					`${s.currentStatus}: ${getStatusText(currentUser.AutomaticGrenade, lang)}`,
				])
				.addButtonRow(
					btn => btn
						.setCustomId("enable")
						.setLabel(s.enableButton)
						.setStyle(ButtonStyle.Success)
						.setDisabled(currentUser.AutomaticGrenade),
					btn => btn
						.setCustomId("disable")
						.setLabel(s.disableButton)
						.setStyle(ButtonStyle.Danger)
						.setDisabled(!currentUser.AutomaticGrenade),
				)
				.addFooter();
		}

		let container = buildContainer(user, language);

		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response);

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			const isEnable = btn.customId === "enable";

			await user.GetInfo();
			await user.SetAutomaticGrenade(isEnable);

			container = buildContainer(user, language);
			return replyWithContainer(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		title: "Automatic Grenade",
		explanation: `By enabling this option, whenever you try to ${EmoteString.Robbery} **Rob** or ${EmoteString.Beat} **Beat Up** another user, and you have a ${EmoteString.Granade} **Grenade** in your inventory, you will automatically consume it to gain the advantage, without receiving a confirmation dialog.`,
		currentStatus: "Current status",
		enabled: "Enabled",
		disabled: "Disabled",
		enableButton: "Enable",
		disableButton: "Disable",
	},
	[Language.Portuguese]: {
		title: "Granada Automática",
		explanation: `Ao ativar esta opção, sempre que você tentar ${EmoteString.Robbery} **Roubar** ou ${EmoteString.Beat} **Espancar** outro usuário, e tiver uma ${EmoteString.Granade} **Granada** em seu inventário, você a consumirá automaticamente para obter a vantagem, sem precisar confirmar na tela.`,
		currentStatus: "Status atual",
		enabled: "Ativado",
		disabled: "Desativado",
		enableButton: "Ativar",
		disableButton: "Desativar",
	},
	[Language.Spanish]: {
		title: "Granada Automática",
		explanation: `Al activar esta opción, cada vez que intentes ${EmoteString.Robbery} **Robar** o ${EmoteString.Beat} **Golpear** a otro usuario, y tengas una ${EmoteString.Granade} **Granada** en tu inventario, la consumirás automáticamente para obtener ventaja, sin tener que confirmar en pantalla.`,
		currentStatus: "Estado actual",
		enabled: "Activado",
		disabled: "Desactivado",
		enableButton: "Activar",
		disableButton: "Desactivar",
	},
} as const satisfies Localization;
