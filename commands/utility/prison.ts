import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	EmbedBuilder,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString } from "../../utils/emotes";
import { ItemId, ItemList } from "../../models/Item";
import { CrColors } from "../../utils/colors";
import { showTime } from "../../utils/ui";
import { Users } from "../../database/Users";
import { Op } from "sequelize";
import { User } from "../../models/User";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("prison")
		.setDescription("Visit the prison and meet the inmates")
		.setNameLocalization(Locale.PortugueseBR, "prisao")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça a prisão e seus presidiários"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const hasJetpack = await user.GetItems().then(items => items.some(item => item.Id === ItemId.Jetpack));

		const baseChance = 20;
		const baseJetpackChance = 30;
		const userChance = hasJetpack ? baseJetpackChance : 0;
		const MULTIPLY_DISABLED = 1;

		const totalChance = (baseChance + userChance) * MULTIPLY_DISABLED;

		let texto = "Você está livre!";
		if (user.IsEscaping()) {
			texto = `Você está sendo procurado pela polícia! Poderá roubar novamente ${showTime(user.Timers.Escape.getTime(), true)}!`;
		}
		if (user.IsInPrison()) {
			texto = `Você está preso! Será solto ${showTime(user.Timers.Prison.getTime(), true)}!`;
		}

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://cdn.discordapp.com/attachments/531174573463306240/817102027183357992/prisao.png")
			.setDescription(`# Prisão
Ao tentar roubar alguém e falhar, você será preso por um tempo determinado pelo seu ${EmoteString.Attack}ATK.

-# Estar preso limita muitas de suas ações no jogo, como trabalhar, investir, apostar, vasculhar, e claro, roubar.
### ${EmoteString.Scapist} Fugir
Você tem ${baseChance * MULTIPLY_DISABLED}% (${baseJetpackChance * MULTIPLY_DISABLED}% se possuir uma ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[user.Language]}**) de chance de fugir da prisão!
### ${EmoteString.Politician} Subornar
Os guardas são gananciosos, e quanto maior o seu ${EmoteString.Attack}ATK, mais eles pedirão! Eles também podem recusar seu suborno, mas ficarão com seu dinheiro.

-# ${texto}`)
			.setColor(CrColors.Police)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), `Chance atual: ${totalChance}%`);

		const button = new ButtonBuilder()
			.setCustomId("prisoners")
			.setLabel("Prisioneiros")
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(button);

		const response = await replyInteraction(interaction, { embeds: [embed], components: [row] });

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {

			if (btn.customId === "prisoners") {
				const prisoners = await getPrisoners();

				const embedPrisoners = new EmbedBuilder()
					.setColor(Colors.DarkButNotBlack)
					.setTitle("Prisioneiros");

				if (prisoners.length === 0) {
					embedPrisoners.setDescription("Estamos meio vazios hoje...");
				}

				prisoners.forEach((prisoner, index) => {
					embedPrisoners.addFields({
						name: prisoner.nickname,
						value: `Livre ${showTime(new Date(prisoner.prisonTime).getTime(), true)}`,
					});
				});


				await replyInteraction(interaction, { embeds: [embed, embedPrisoners], components: [] });
			}
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});

	},
};

// Todo melhorar sistema de paginação
async function getPrisoners() {
	return await Users.findAll({
		attributes: ["nickname", "prisonTime"],
		order: [["prisonTime", "DESC"]],
		where: {
			prisonTime: {
				[Op.gt]: new Date(),
			},
		},
	});
}