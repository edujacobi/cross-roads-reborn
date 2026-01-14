import {
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from "discord.js";
import { disableButtons, replyInteraction } from "../../utils/logic";
import { defaultComponent, formatMoney } from "../../utils/ui";
import { Users } from "../../database/Users";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { Op } from "sequelize";
import { CrColors } from "../../utils/colors";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setnick")
		.setNameLocalization(Locale.PortugueseBR, "mudanick")
		.setDescription("Set a nickname for you")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda o seu nick")
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("nick")
				.setDescription("The new nickname")
				.setDescriptionLocalization(Locale.PortugueseBR, "O novo nick")
				.setMinLength(3)
				.setMaxLength(18)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const newNick = interaction.options.getString("nick", true);

		const s = Strings[language];

		const CHANGE_COST = user.IsVip() ? 75_000 : 100_000;

		if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(newNick)) {
			const tempUser = new User("0");
			tempUser.Nickname = s.setting;

			const container = defaultComponent({
				user: tempUser,
				color: Colors.Red,
				description: s.invalidNick(newNick),
				footer: s.footer,
			});

			return replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const nickExists = await Users.findOne({
			where: {
				nickname: {
					[Op.like]: newNick,
				},
			},
		});

		if (nickExists) {
			const tempUser = new User("0");
			tempUser.Nickname = s.setting;

			const container = defaultComponent({
				user: tempUser,
				color: Colors.Red,
				description: s.nickInUse(newNick, nickExists.id),
				footer: s.footer,
			});

			return replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const newUser = user.Nickname === "";

		if (newUser) {
			await user.SetNickname(newNick);

			const container = defaultComponent({
				user,
				color: CrColors.Default,
				description: s.newPlayer(newNick),
			});

			return replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const oldNick = user.Nickname || interaction.user.displayName;

		let container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Default)
			.addSectionComponents(section => section
				.addTexts([
					s.costToChange(CHANGE_COST, newNick, oldNick),
				])
				.setButtonAccessory(btn => btn
					.setCustomId(`confirm`)
					.setDisabled(user.Money < CHANGE_COST)
					.setLabel(formatMoney(CHANGE_COST, language))
					.setStyle(ButtonStyle.Success),
				),
			)
			.addFooter({
				text: formatMoney(user.Money, language),
			});

		const response = await replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		const collectorButton = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collectorButton?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collectorButton?.on("collect", async btn => {
			await btn.deferUpdate();

			if (btn.customId === "confirm") {
				await user.GetInfo();

				const success = await user.SetNickname(newNick, CHANGE_COST);

				const description = success ? s.nickChanged(oldNick, newNick) : s.errorChange;

				container = defaultComponent({
					user,
					color: CrColors.Default,
					description,
					footer: formatMoney(user.Money, language),
				});

				return replyInteraction(interaction, {
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		});
	},
};

const Strings = {
	[Language.English]: {
		setting: "Setting nickname",
		invalidNick: (newNick: string) => `The nickname **${newNick}** is invalid! It can only contain letters and one space between words.`,
		nickInUse: (newNick: string, userId: string) => `The nickname **${newNick}** is already in use!\n-# by user with id \`${userId}\``,
		newPlayer: (newNick: string) => `-# A new player arrives!\n## Welcome **${newNick}**!\n-# Now, choose your class: \`/setclass\``,
		nickChanged: (oldNick: string, newNick: string) => `**${oldNick}** now has the nickname **${newNick}**!`,
		footer: "Please, choose another nickname!",
		costToChange: (cost: number, newNick: string, oldNick: string) => `The cost for you to change your nickname is ${formatMoney(cost, Language.English)}.\n-# Confirm the change from **${oldNick}** to **${newNick}**?`,
		errorChange: "You don't have enough money to change your nickname.",
	},
	[Language.Portuguese]: {
		setting: "Configurando nickname",
		invalidNick: (newNick: string) => `O nickname **${newNick}** é inválido! Só pode conter letras e um espaço entre palavras.`,
		nickInUse: (newNick: string, userId: string) => `O nickname **${newNick}** já está em uso!\n-# pelo usuário com id \`${userId}\``,
		newPlayer: (newNick: string) => `-# Um novo jogador chegou!\n## Bem-vindo **${newNick}**!\n-# Agora, escolha sua classe: \`/mudaclasse\``,
		nickChanged: (oldNick: string, newNick: string) => `**${oldNick}** agora tem o nickname **${newNick}**!`,
		footer: "Por favor, escolha outro nickname!",
		costToChange: (cost: number, newNick: string, oldNick: string) => `O custo para você alterar seu nickname é ${formatMoney(cost, Language.Portuguese)}.\n-# Confirmar troca de **${oldNick}** para **${newNick}**?`,
		errorChange: "Você não possui dinheiro suficiente para alterar seu nickname.",
	},
	[Language.Spanish]: {
		setting: "Configurando nickname",
		invalidNick: (newNick: string) => `El nickname **${newNick}** es inválido! Solo puede contener letras y un espacio entre palabras.`,
		nickInUse: (newNick: string, userId: string) => `El nickname **${newNick}** ya está en uso!\n-# por el usuario con id \`${userId}\``,
		newPlayer: (newNick: string) => `-# ¡Un nuevo jugador ha llegado!\n## Bienvenido **${newNick}**!\n-# Ahora, elige tu clase: \`/setclass\``,
		nickChanged: (oldNick: string, newNick: string) => `**${oldNick}** ahora tiene el nickname **${newNick}**!`,
		footer: "¡Por favor, elige otro nickname!",
		costToChange: (cost: number, newNick: string, oldNick: string) => `El costo para que usted cambie su nickname es ${formatMoney(cost, Language.Spanish)}.\n-# ¿Confirmar el cambio de **${oldNick}** a **${newNick}**?`,
		errorChange: "No tienes suficiente dinero para cambiar su nickname.",
	},
} as const;