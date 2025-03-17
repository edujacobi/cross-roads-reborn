import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction, Colors, ComponentType, EmbedBuilder,
	MessageComponentInteraction,
} from "discord.js";
import { User } from "./User";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { CrColors } from "../utils/colors";
import { EmoteString } from "../utils/emotes";
import { replyInteraction } from "../utils/logic";
import { BadgeString } from "../utils/badges";
import { Users } from "../database/Users";
import { Op } from "sequelize";
import { ClassList } from "./Class";
import { defaultEmbed, formatMoney, showTime } from "../utils/ui";
import { Language } from "./Language";
import { addMinutes, differenceInMinutes } from "date-fns";
import { Notification, NotificationType } from "./Notification";
import { Log } from "../utils/log";
import { Pagination } from "./Pagination";

export class Hospital {
	User: User;
	Interaction: ChatInputCommandInteraction;
	PrivatePrice: number;
	PrivateBasePrice = 3_000;

	constructor(user: User, interaction: ChatInputCommandInteraction) {
		this.User = user;
		this.Interaction = interaction;

		const defFactor = this.User.Attributes.Defense ** 3 / 16;
		const moneyFactor = this.User.Money * 0.05;

		this.PrivatePrice = Math.floor(this.PrivateBasePrice + defFactor + moneyFactor);
	}


	async GenerateEmbed() {
		const s = Strings[this.User.Language];

		let text = `${s.userFree}`;
		if (this.User.IsInHospital()) {
			text = s.userInHospital(this.User.Hospital.Time);
		}

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1346499466588328017/hospital5.png")
			.setDescription(`# Hospital
${s.description}

-# ${text}`)
			.setColor(CrColors.Hospital)
			.setUserFooter({
				nickname: this.User.Nickname,
				image: this.Interaction.user.avatarURL()
			});

		const hospitalized = await this.GetHospitalized();

		const buttonHospitalized = new ButtonBuilder()
			.setCustomId("hospitalized")
			.setLabel(s.hospitalized)
			.setDisabled(hospitalized.length === 0)
			.setStyle(ButtonStyle.Secondary);

		const buttonPrivate = new ButtonBuilder()
			.setCustomId("private")
			.setLabel(s.payPrivateCare)
			.setEmoji(BadgeString.Season6.Hypocondriach)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonHospitalized);

		if (this.User.IsInHospital()) {
			row.addComponents(buttonPrivate);
		}

		const response = await replyInteraction(this.Interaction, {
			embeds: [embed],
			components: [row],
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			if (btn.customId === "hospitalized") {
				buttonHospitalized.setDisabled(true);

				const pagination = new Pagination(this.Interaction, this.User.Language);

				pagination.HowManyRecords = hospitalized.length;
				pagination.Limit = 15;

				const embedHospitalized = new EmbedBuilder()
					.setColor(Colors.DarkButNotBlack)
					.setTitle(s.hospitalized);

				pagination.CustomizeEmbed = async () => {
					const users = hospitalized.slice(pagination.Offset, pagination.Offset + pagination.Limit);

					users.forEach(user => {
						embedHospitalized.addFields({
							name: `${ClassList[user.class].Image.Emote.String} ${user.nickname}`,
							value: `${s.healed} ${showTime(new Date(user.hospitalTime).getTime(), true)}\n${s.howManyTimes(user.hospitalCount)}`,
							inline: true,
						});
					});

					return embedHospitalized
						.setFooter({ text: pagination.Showing() });
				};

				await pagination.GenerateEmbed(embed);
			}
			else if (btn.customId === "private") {
				buttonPrivate.setDisabled(true);

				await this.User.GetInfo();

				const { canPay, message } = await this.CanPayPrivate();

				if (!canPay) {
					return await replyInteraction(this.Interaction, {
						embeds: [defaultEmbed({
							interaction: this.Interaction,
							description: message,
							color: CrColors.Hospital,
							nickname: this.User.Nickname,
						})],
						components: [],
					});
				}

				embed
					.setDescription(`## ${s.privateCare}
${s.treatmentCost(this.PrivatePrice)}
-# ${s.confirmPayment}`)
					.setUserFooter({
						nickname: this.User.Nickname,
						image: this.Interaction.user.avatarURL(),
						text: formatMoney(this.User.Money, this.User.Language)
					});

				const buttonConfirm = new ButtonBuilder()
					.setCustomId("confirm")
					.setLabel(s.confirm)
					.setStyle(ButtonStyle.Success);

				row.setComponents([buttonConfirm]);

				await replyInteraction(this.Interaction, { embeds: [embed], components: [row] });
			}
			else if (btn.customId === "confirm") {
				await this.User.GetInfo();

				const { canPay, message } = await this.CanPayPrivate();

				if (!canPay) {
					return await replyInteraction(this.Interaction, {
						embeds: [defaultEmbed({
							interaction: this.Interaction,
							description: message,
							color: CrColors.Hospital,
							nickname: this.User.Nickname,
						})],
						components: [],
					});
				}

				await this.PayPrivate();

				embed
					.setDescription(`## ${s.privateCare}\n### ${s.privateHealed}`)
					.setUserFooter({
						nickname: this.User.Nickname,
						image: this.Interaction.user.avatarURL(),
						text: formatMoney(this.User.Money, this.User.Language)
					});

				await replyInteraction(this.Interaction, {
					embeds: [embed],
					components: [],
				});
			}
		});
	}

	async CanPayPrivate() {
		const s = Strings[this.User.Language];
		let canPay = true;
		let message = "";

		if (!this.User.IsInHospital()) {
			message = s.userFree;
			canPay = false;
		}
		if (differenceInMinutes(this.User.Hospital.Time, new Date()) < 5) {
			message = s.nextInLine;
			canPay = false;
		}
		if (this.User.Money < this.PrivatePrice) {
			message = s.withoutMoney(this.PrivatePrice);
			canPay = false;
		}

		return { canPay, message };
	}

	async PayPrivate() {
		this.User.Money -= this.PrivatePrice;
		this.User.Hospital.TreatmentSum += this.PrivatePrice;
		this.User.Hospital.TreatmentCount += 1;
		this.User.Hospital.Time = new Date();

		await Notification.Dismiss(this.User.Id, NotificationType.Hospital);
		await this.User.Update();

		Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) paid ${formatMoney(this.PrivatePrice, Language.English)} for private care in Hospital`);
	}

	private async GetHospitalized() {
		// Todo melhorar sistema de paginação
		return await Users.findAll({
			attributes: ["nickname", "class", "hospitalTime", "hospitalCount"],
			order: [["hospitalTime", "DESC"]],
			where: {
				hospitalTime: {
					[Op.gt]: new Date(),
				},
			},
		});
	}
}

const Strings = {
	[Language.English]: {
		userFree: "You are not hospitalized! Want a little injection?",
		userInHospital: (time: Date) => `You are hospitalized! You will be treated ${showTime(time.getTime(), true)}!`,
		description: `_Public, Free and Quality!_

-# Hospitalized users have ${EmoteString.Defense}-5 DEF and ${EmoteString.Defense}-5% $DEF!.
### Public service
Unfortunately we have no more free beds, so you will have to wait in the hallway until you are seen.
### ${BadgeString.Season6.Hypocondriach} Private care
If you pay a certain amount, we will be able to treat you faster!`,
		hospitalized: "Hospitalized",
		healed: "Healed",
		privateCare: "Private care",
		payPrivateCare: `Pay private care`,
		treatmentCost: (price: number) => `Your treatment will cost **${formatMoney(price, Language.English)}**.`,
		confirmPayment: "Confirm payment?",
		confirm: "Confirm",
		privateHealed: "You are healed!",
		nextInLine: "You are next in line, wait your turn.\n-# A little sting doesn't hurt.",
		withoutMoney: (money: number) => `You don't have enough money! You need ${formatMoney(money, Language.English)} for private care!`,
		howManyTimes: (times: number) => `Hospitalized \`${times}\` times`,
	},
	[Language.Portuguese]: {
		userFree: "Você não está hospitalizado! Quer uma injeçãozinha?",
		userInHospital: (time: Date) => `Você está hospitalizado! Será atendido ${showTime(time.getTime(), true)}!`,
		description: `_Público, Gratuito e de Qualidade!_

-#	Usuários hospitalizados	possuem	${EmoteString.Defense}-5 DEF e ${EmoteString.Defense}-5 % $DEF!.
###	Serviço	público
Infelizmente não temos mais leitos livres, então você precisará esperar no corredor até ser atendido.
### ${BadgeString.Season6.Hypocondriach} Atendimento particular
Caso você pague uma certa quantia, poderemos tratá-lo mais rapidamente!`,
		hospitalized: "Hospitalizados",
		healed: "Curado",
		privateCare: "Atendimento particular",
		payPrivateCare: `Pagar particular`,
		treatmentCost: (price: number) => `Seu tratamento custará **${formatMoney(price, Language.Portuguese)}**.`,
		confirmPayment: "Confirmar pagamento?",
		confirm: "Confirmar",
		privateHealed: "Você está curado!",
		nextInLine: `Você é o próximo da fila, aguarde sua vez.\n-# Uma picadinha não dói.`,
		withoutMoney: (money: number) => `Você não tem dinheiro suficiente! Você precisa de ${formatMoney(money, Language.Portuguese)} para atendimento particular!`,
		howManyTimes: (times: number) => `Hospitalizado \`${times}\` vezes`,
	},
	[Language.Spanish]: {
		userFree: "No estás hospitalizado! ¿Quieres una pequeña inyección?",
		userInHospital: (time: Date) => `¡Estás hospitalizado! ¡Se servirá ${showTime(time.getTime(), true)}!`,
		description: `_¡Público, gratuito y de calidad!_

	-# Los usuarios hospitalizados tienen ${EmoteString.Defense}-5 DEF y ${EmoteString.Defense}-5% $DEF!.
	### Servicio público
	Lamentablemente, no tenemos más camas libres, por lo que deberá esperar en el pasillo hasta que le atiendan.
	### ${BadgeString.Season6.Hypocondriach} Atención privada
	¡Si pagas una cierta cantidad, podemos atenderte más rápido!`,
		hospitalized: "Hospitalizados",
		healed: "Curado",
		privateCare: "Atención privada",
		payPrivateCare: `Pagar atención privada`,
		treatmentCost: (price: number) => `Tu tratamiento costará **${formatMoney(price, Language.Spanish)}**.`,
		confirmPayment: "¿Confirmar pago?",
		confirm: "Confirmar",
		privateHealed: "¡Estás curado!",
		nextInLine: "Eres el siguiente en la fila, espera tu turno.\n-# Una picadura no duele.",
		withoutMoney: (money: number) => `¡No tienes suficiente dinero! ¡Necesitas ${formatMoney(money, Language.Spanish)} para la atención privada!`,
		howManyTimes: (times: number) => `Hospitalizado \`${times}\` veces`,
	},
} as const;