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
import { EmoteId, EmoteString } from "../../utils/emotes";
import { ItemId, ItemList } from "../../models/Item";
import { CrColors } from "../../utils/colors";
import { defaultEmbed, formatMoney, showTime } from "../../utils/ui";
import { Users } from "../../database/Users";
import { Op } from "sequelize";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { ClassList } from "../../models/Class";
import { addMinutes } from "date-fns";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("prison")
		.setDescription("Visit the prison and meet the inmates")
		.setNameLocalization(Locale.PortugueseBR, "prisao")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça a prisão e seus presidiários"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const hasJetpack = await user.GetItems().then(items => items.some(item => item.Id === ItemId.Jetpack));

		const baseChance = 20;
		const baseJetpackChance = 30;
		const userChance = hasJetpack ? baseJetpackChance : 0;

		const totalChance = baseChance + userChance;

		let text = `${s.userFree}`;
		if (user.IsWanted()) {
			text = s.userWanted(user.Wanted.Time);
		}
		if (user.IsInPrison()) {
			text = s.userPrison(user.Prison.Time);
		}

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png")
			.setDescription(s.description(baseChance, baseJetpackChance + baseChance, text))
			.setColor(CrColors.Police)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), `${s.currentChance}: ${totalChance}%`);

		const prisoners = await getPrisoners();

		const buttonPrisoners = new ButtonBuilder()
			.setCustomId("prisoners")
			.setLabel(s.prisoners)
			.setDisabled(prisoners.length === 0)
			.setStyle(ButtonStyle.Secondary);

		const buttonEscape = new ButtonBuilder()
			.setCustomId("escape")
			.setLabel(s.escape)
			.setEmoji(hasJetpack ? ItemList[ItemId.Jetpack].Skin.Default.Emote.String : EmoteId.Escape)
			.setDisabled(user.Escape.HasTried)
			.setStyle(ButtonStyle.Secondary);

		const buttonBribe = new ButtonBuilder()
			.setCustomId("bribe")
			.setLabel(s.bribe)
			.setEmoji(EmoteId.Politician)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonPrisoners);

		if (user.IsInPrison()) {
			row.addComponents(buttonEscape, buttonBribe);
		}

		const response = await replyInteraction(interaction, { embeds: [embed], components: [row] });

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		let bribeValue = 0;

		collector?.on("collect", async btn => {

			if (btn.customId === "prisoners") {
				buttonPrisoners.setDisabled(true);

				const embedPrisoners = new EmbedBuilder()
					.setColor(Colors.DarkButNotBlack)
					.setTitle(s.prisoners);

				prisoners.forEach(prisoner => {
					embedPrisoners.addFields({
						name: `${ClassList[prisoner.class].Image.Emote.String} ${prisoner.nickname}`,
						value: `${s.free} ${showTime(new Date(prisoner.prisonTime).getTime(), true)}\n${s.howManyTimes(prisoner.robberyFailureCount)}`,
						inline: true,
					});
				});

				await replyInteraction(interaction, { embeds: [embed, embedPrisoners], components: [row] });
			}
			else if (btn.customId === "escape") {
				buttonEscape.setDisabled(true);
				await replyInteraction(interaction, { components: [row] });
			}
			else if (btn.customId === "bribe") {
				buttonBribe.setDisabled(true);

				await user.GetInfo();

				const { canBribe, message } = await user.CanBribe();

				if (!canBribe) {
					return await replyInteraction(interaction, {
						embeds: [defaultEmbed({
							interaction,
							color: CrColors.Police,
							description: message,
							nickname: user.Nickname,
						})],
						components: [],
					});
				}

				const baseBribe = 20_000;
				const atkFactor = (user.Attributes.Attack * (user.Attributes.Attack / 20)) ** 2;
				const moneyFactor = user.Money * (user.Escape.HasTried ? 0.1 : 0.05);
				bribeValue = Math.floor(baseBribe + atkFactor + moneyFactor);

				const bribery = new CustomEmbedBuilder()
					.setTitle(`${EmoteString.Police} ${s.bribe}`)
					.setColor(CrColors.Police)
					.setDescription(`"Sabemos que você tem um certo dinheiro escondido aí... Nos dê **${formatMoney(bribeValue, user.Language)}** e deixaremos você sair de fininho."\n-# Confirmar pagamento?`)
					.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), formatMoney(user.Money, user.Language));

				const buttonConfirm = new ButtonBuilder()
					.setStyle(ButtonStyle.Success)
					.setLabel(s.confirm)
					.setDisabled(user.Money < bribeValue)
					.setCustomId("confirmBribe");

				row.setComponents(buttonConfirm);

				await replyInteraction(interaction, { embeds: [bribery], components: [row] });
			}
			else if (btn.customId === "confirmBribe") {
				await user.GetInfo();

				const success = await user.PayBribery(bribeValue);

				const responseEmbed = new CustomEmbedBuilder()
					.setColor(CrColors.Police);

				if (success) {
					responseEmbed
						.setTitle(`${EmoteString.Police} ${s.briberyAccepted}`)
						.setDescription(s.briberyAcceptedDescription)
						.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), s.briberyAcceptedFooter);
				}
				else {
					responseEmbed
						.setTitle(`${EmoteString.Police} ${s.briberyRejected}`)
						.setDescription(s.briberyRejectedDescription)
						.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), s.briberyRejectedFooter);
				}

				return await replyInteraction(interaction, { embeds: [responseEmbed], components: [] });
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
		attributes: ["nickname", "class", "prisonTime", "robberyFailureCount"],
		order: [["prisonTime", "DESC"]],
		where: {
			prisonTime: {
				[Op.gt]: new Date(),
			},
		},
	});
}

const Strings = {
	[Language.English]: {
		userFree: "You are free!",
		userWanted: (timerEscape: Date) => `You are being wanted by the police! You can steal again ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `You are in prison! You will be released ${showTime(timerPrison.getTime(), true)}!`,
		description: (chance: number, jetpackChance: number, text: string) => `# Prison
When trying to rob someone and failing, you will be imprisoned for a time determined by your ${EmoteString.Attack}ATK.

-# Being imprisoned limits many of your actions in the game, such as working, investing, betting, scavenging, and of course, stealing.
### ${EmoteString.Escape} Escape
You have a ${chance}% (${jetpackChance}% if you have a ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[Language.English]}**) chance of escaping from prison!
### ${EmoteString.Politician} Bribe
The guards are greedy, and the higher your ${EmoteString.Attack}ATK, the more they will ask for! They can also refuse your bribe, but they will keep your money.

-# ${text}`,
		currentChance: "Current chance",
		prisoners: "Prisoners",
		escape: "Escape",
		bribe: "Bribe",
		briberyAccepted: "Bribery accepted",
		briberyAcceptedDescription: "\"That's how it's done! Get out of here before anyone else sees you.\"",
		briberyAcceptedFooter: "Wait 30 minutes to do something stupid",
		briberyRejected: "Bribery rejected",
		briberyRejectedDescription: "\"Damn dude, you have to be really stupid to pay that amount and think we would release you.\"",
		briberyRejectedFooter: "You will remain imprisoned",
		free: "Free",
		confirm: "Confirm",
		howManyTimes: (times: number) => `Imprisoned \`${times}\` times`,
	},
	[Language.Portuguese]: {
		userFree: "Você está livre!",
		userWanted: (timerEscape: Date) => `Você está sendo procurado pela polícia! Poderá roubar novamente ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `Você está preso! Será solto ${showTime(timerPrison.getTime(), true)}!`,
		description: (chance: number, jetpackChance: number, text: string) => `# Prisão
Ao tentar roubar alguém e falhar, você será preso por um tempo determinado pelo seu ${EmoteString.Attack}ATK.

-# Estar preso limita muitas de suas ações no jogo, como trabalhar, investir, apostar, vasculhar, e claro, roubar.
### ${EmoteString.Escape} Fugir
Você tem ${chance}% (${jetpackChance}% se possuir uma ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[Language.Portuguese]}**) de chance de fugir da prisão!
### ${EmoteString.Politician} Subornar
Os guardas são gananciosos, e quanto maior o seu ${EmoteString.Attack}ATK, mais eles pedirão! Eles também podem recusar seu suborno, mas ficarão com seu dinheiro.

-# ${text}`,
		currentChance: "Chance atual",
		prisoners: "Prisioneiros",
		escape: "Fugir",
		bribe: "Subornar",
		briberyAccepted: "Suborno aceito",
		briberyAcceptedDescription: "\"Assim que se faz! Caia fora daqui antes que mais alguém te veja.\"",
		briberyAcceptedFooter: "Espere 30 minutos para fazer alguma besteira",
		briberyRejected: "Suborno recusado",
		briberyRejectedDescription: "\"Caralho mané, tu tem que ser muito burro pra pagar esse valor e achar que iríamos te liberar.\"",
		briberyRejectedFooter: "Você continuará preso",
		free: "Livre",
		confirm: "Confirmar",
		howManyTimes: (times: number) => `Preso \`${times}\` vezes`,
	},
	[Language.Spanish]: {
		userFree: "¡Estás libre!",
		userWanted: (timerEscape: Date) => `¡Estás siendo buscado por la policía! ¡Puedes robar de nuevo ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `¡Estás preso! ¡Serás liberado ${showTime(timerPrison.getTime(), true)}!`,
		description: (chance: number, jetpackChance: number, text: string) => `# Prisión
Al intentar robar a alguien y fallar, serás encarcelado por un tiempo determinado por tu ${EmoteString.Attack}ATK.

-# Estar encarcelado limita muchas de tus acciones en el juego, como trabajar, invertir, apostar, buscar, y por supuesto, robar.
### ${EmoteString.Escape} Escapar
Tienes un ${chance}% (${jetpackChance}% si tienes un ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[Language.Spanish]}**) de escapar de la prisión!
### ${EmoteString.Politician} Sobornar
Los guardias son codiciosos, y cuanto mayor sea tu ${EmoteString.Attack}ATK, más te pedirán! También pueden rechazar tu soborno, pero se quedarán con tu dinero.

-# ${text}`,
		currentChance: "Chance actual",
		prisoners: "Prisioneros",
		escape: "Escapar",
		bribe: "Sobornar",
		briberyAccepted: "Soborno aceptado",
		briberyAcceptedDescription: "\"¡Así se hace! ¡Lárgate de aquí antes de que alguien más te vea!\"",
		briberyAcceptedFooter: "Espera 30 minutos para hacer alguna tontería",
		briberyRejected: "Soborno rechazado",
		briberyRejectedDescription: "\"¡Joder tío, tienes que ser muy tonto para pagar esa cantidad y pensar que te liberaríamos!\"",
		briberyRejectedFooter: "Permanecerás encarcelado",
		free: "Libre",
		confirm: "Confirmar",
		howManyTimes: (times: number) => `Encarcelado \`${times}\` veces`,
	},
} as const;