import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { defaultEmbed } from "../../utils/ui";
import { Users } from "../../database/Users";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

module.exports = {
	cooldown: 5,
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

		if (!/^[A-Za-z]+$/.test(newNick)) {
			return replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: s.setting,
					color: Colors.Red,
					interaction,
					description: s.invalidNick(newNick),
					footer: s.footer,
				})],
			});
		}

		const nickExists = await Users.findOne({
			where: {
				nickname: newNick,
			},
		});

		if (nickExists) {
			return replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: s.setting,
					color: Colors.Red,
					interaction,
					description: s.nickInUse(newNick, nickExists.id),
					footer: s.footer,
				})],
			});
		}

		const newUser = user.Nickname === "";

		const oldNick = user.Nickname || interaction.user.displayName;

		await user.SetNickname(newNick);

		const description = newUser ? s.newPlayer(newNick) : s.nickChanged(oldNick, newNick);

		const embed = defaultEmbed({
			nickname: user.Nickname,
			interaction: interaction,
			thumbnail: interaction.user.avatarURL() ?? undefined,
			color: Colors.Green,
			description,
		});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		setting: "Setting nickname",
		invalidNick: (newNick: string) => `The nickname **${newNick}** is invalid! It can only contain letters.`,
		nickInUse: (newNick: string, userId: string) => `The nickname **${newNick}** is already in use!\n-# by user with id \`${userId}\``,
		newPlayer: (newNick: string) => `A new player arrives! Welcome **${newNick}**!`,
		nickChanged: (oldNick: string, newNick: string) => `**${oldNick}** now has the nickname **${newNick}**!`,
		footer: "Please, choose another nickname!",
	},
	[Language.Portuguese]: {
		setting: "Configurando nickname",
		invalidNick: (newNick: string) => `O nickname **${newNick}** é inválido! Só pode conter letras.`,
		nickInUse: (newNick: string, userId: string) => `O nickname **${newNick}** já está em uso!\n-# pelo usuário com id \`${userId}\``,
		newPlayer: (newNick: string) => `Um novo jogador chegou! Bem-vindo **${newNick}**!`,
		nickChanged: (oldNick: string, newNick: string) => `**${oldNick}** agora tem o nickname **${newNick}**!`,
		footer: "Por favor, escolha outro nickname!",
	},
	[Language.Spanish]: {
		setting: "Configurando nickname",
		invalidNick: (newNick: string) => `El nickname **${newNick}** es inválido! Solo puede contener letras.`,
		nickInUse: (newNick: string, userId: string) => `El nickname **${newNick}** ya está en uso!\n-# por el usuario con id \`${userId}\``,
		newPlayer: (newNick: string) => `¡Un nuevo jugador ha llegado! Bienvenido **${newNick}**!`,
		nickChanged: (oldNick: string, newNick: string) => `**${oldNick}** ahora tiene el nickname **${newNick}**!`,
		footer: "¡Por favor, elige otro nickname!",
	},
} as const;