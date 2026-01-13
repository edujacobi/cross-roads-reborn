import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	MessageComponentInteraction,
	MessageFlags,
} from "discord.js";
import { User } from "./User";
import { CrColors } from "../utils/colors";
import { EmoteString } from "../utils/emotes";
import { disableButtons, replyInteraction } from "../utils/logic";
import { EmoteBadgeString } from "../utils/badges";
import { Users } from "../database/Users";
import { Op } from "sequelize";
import { ClassList } from "../interfaces/Classes";
import { defaultComponent, formatMoney, showTime } from "../utils/ui";
import { Language } from "./Language";
import { differenceInMinutes } from "date-fns";
import { Notification, NotificationType } from "./Notification";
import { Log } from "../utils/log";
import { Pagination } from "./Pagination";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

export class Hospital {
	User: User;
	Interaction: ChatInputCommandInteraction;
	PrivatePrice: number;
	PrivateBasePrice = 3_000;
	Container = new CustomContainerBuilder();

	constructor(user: User, interaction: ChatInputCommandInteraction) {
		this.User = user;
		this.Interaction = interaction;

		const defFactor = this.User.Attributes.Defense ** 3 / 16;
		const moneyFactor = this.User.Money * 0.05;

		this.PrivatePrice = Math.floor(this.PrivateBasePrice + defFactor + moneyFactor);
	}

	AddContainerHeader() {
		const s = Strings[this.User.Language];

		this.Container = new CustomContainerBuilder()
			.setUser(this.User)
			.setAccentColor(CrColors.Hospital)
			.addSectionComponents(header => header
				.addTextDisplayComponents(content => content
					.setContent(`# Hospital\n${s.subtitle}`),
				)
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1460599175900168388/Hospital_New.png"),
				),
			)
			.addLargeSeparator();
	}

	async GenerateContainer() {
		const s = Strings[this.User.Language];

		let text = `${s.userFree}`;
		if (this.User.IsInHospital()) {
			text = s.userInHospital(this.User.Hospital.Time);
		}

		const hospitalized = await this.GetHospitalized();

		const buttonHospitalized = new ButtonBuilder()
			.setCustomId("hospitalized")
			.setLabel(s.hospitalized)
			.setDisabled(hospitalized.length === 0)
			.setStyle(ButtonStyle.Secondary);

		const buttonPrivate = new ButtonBuilder()
			.setCustomId("private")
			.setLabel(s.payPrivateCare)
			.setEmoji(EmoteBadgeString.Season6.Hypochondriac)
			.setDisabled(!this.User.IsInHospital())
			.setStyle(ButtonStyle.Secondary);

		this.AddContainerHeader();

		this.Container
			.addTexts([
				s.descriptionPublic,
			])
			.addLargeSeparator()
			.addSectionComponents(section => section
				.addTextDisplayComponents(text => text
					.setContent(s.descriptionPrivate),
				)
				.setButtonAccessory(buttonPrivate),
			)
			.addLargeSeparator()
			.addTexts([
				`-# ${text}`,
			])
			.addFooter({
				button: buttonHospitalized,
			});

		const response = await replyInteraction(this.Interaction, {
			components: [this.Container],
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collector?.on("end", async () => {
			await disableButtons(this.Interaction, this.Container);
		});

		collector?.on("collect", async btn => {
			await btn.deferUpdate();

			if (btn.customId === "hospitalized") {
				buttonHospitalized.setDisabled(true);

				const pagination = new Pagination(this.Interaction, this.User.Language);

				pagination.HowManyRecords = hospitalized.length;
				pagination.Limit = 10;

				const containerHospitalized = new CustomContainerBuilder()
					.setUser(this.User)
					.addTexts([
						`# ${s.hospitalized}`,
					])
					.addLargeSeparator();

				pagination.CustomizeContainer = async () => {
					const users = hospitalized.slice(pagination.Offset, pagination.Offset + pagination.Limit);

					for (let i = 0; i < users.length; i++) {
						const user = users[i];
						containerHospitalized.addTexts([
							`### ${ClassList[user.class].Image.Emote.String} ${user.nickname}`,
							`${s.healed} ${showTime(new Date(user.hospitalTime).getTime(), true)} • ${s.howManyTimes(user.hospitalCount)}`,
						]);

						if (i !== users.length - 1) {
							containerHospitalized.addSmallSeparator();
						}
					}

					return containerHospitalized;
				};

				await pagination.GenerateContainer(this.Container);
			}

			else if (btn.customId === "private") {
				buttonPrivate.setDisabled(true);

				await this.User.GetInfo();

				const { canPay, message } = await this.CanPayPrivate();

				if (!canPay) {
					this.Container = defaultComponent({
						user: this.User,
						color: CrColors.Hospital,
						description: `${message} ${EmoteString.Hospital}`,
					});

					return replyInteraction(this.Interaction, {
						components: [this.Container],
					});
				}

				this.AddContainerHeader();

				this.Container
					.addTexts([
						`### ${EmoteBadgeString.Season6.Hypochondriac} ${s.privateCare}`,
						`${s.treatmentCost(this.PrivatePrice)}`,
						`-# ${s.confirmPayment}`,
					])
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents(new ButtonBuilder()
							.setCustomId("confirm")
							.setLabel(s.confirm)
							.setStyle(ButtonStyle.Success),
						),
					)
					.addFooter({
						text: formatMoney(this.User.Money, this.User.Language),
					});

				await replyInteraction(this.Interaction, { components: [this.Container] });
			}

			else if (btn.customId === "confirm") {
				await this.User.GetInfo();

				const { canPay, message } = await this.CanPayPrivate();

				if (!canPay) {
					this.Container = defaultComponent({
						user: this.User,
						color: CrColors.Hospital,
						description: `${message} ${EmoteString.Hospital}`,
					});

					return replyInteraction(this.Interaction, {
						components: [this.Container],
						flags: MessageFlags.IsComponentsV2,
					});
				}

				await this.PayPrivate();

				this.AddContainerHeader();

				this.Container
					.addTexts([
						`### ${EmoteBadgeString.Season6.Hypochondriac} ${s.privateCare}`,
						`${s.privateHealed}`,
					])
					.addFooter({
						text: formatMoney(this.User.Money, this.User.Language),
					});

				await replyInteraction(this.Interaction, {
					components: [this.Container],
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
		subtitle: `_Public, Free and Quality!_\n\n-# Hospitalized users have ${EmoteString.Defense}-5 DEF and ${EmoteString.Defense}-5% $DEF!.`,
		descriptionPublic: `### Public service\nUnfortunately we have no more free beds, so you will have to wait in the hallway until you are seen.`,
		descriptionPrivate: `### ${EmoteBadgeString.Season6.Hypochondriac} Private care\nIf you pay a certain amount, we will be able to treat you faster!`,
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
		subtitle: `_Público, Gratuito e de Qualidade!_\n\n-#	Usuários hospitalizados possuem ${EmoteString.Defense}-5 DEF e ${EmoteString.Defense}-5% $DEF!.`,
		descriptionPublic: `###	Serviço público\nInfelizmente não temos mais leitos livres, então você precisará esperar no corredor até ser atendido.`,
		descriptionPrivate: `### ${EmoteBadgeString.Season6.Hypochondriac} Atendimento particular\nCaso você pague uma certa quantia, poderemos tratá-lo mais rapidamente!`,
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
		subtitle: `_¡Público, gratuito y de calidad!_\n\n-# Los usuarios hospitalizados tienen ${EmoteString.Defense}-5 DEF y ${EmoteString.Defense}-5% $DEF!.`,
		descriptionPublic: `### Servicio público\nLamentablemente, no tenemos más camas libres, por lo que deberá esperar en el pasillo hasta que le atiendan.`,
		descriptionPrivate: `### ${EmoteBadgeString.Season6.Hypochondriac} Atención privada\n¡Si pagas una cierta cantidad, podemos atenderte más rápido!`,
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