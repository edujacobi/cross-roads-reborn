import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import type { User } from "#core/models/User";
import { Hospital, HospitalFailureReason } from "#core/models/Hospital";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { EmoteBadgeString } from "#bot/utils/badges";
import { EmoteString } from "#bot/utils/emotes";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { Pagination } from "#core/models/Pagination";
import { ClassList } from "#core/types/Classes";
import { defaultComponent, formatMoney, showTime } from "#bot/utils/ui";
import { Language, type Localization } from "#core/models/Language";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("hospital")
		.setDescription("Visit the hospital and meet the sick, broken and bedridden")
		.setNameLocalization(Locale.PortugueseBR, "hospital")
		.setDescriptionLocalization(Locale.PortugueseBR, "Visite o hospital e conheça os doentes, os quebrados e os acamados"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const hospital = new Hospital(user);
		let container = new CustomContainerBuilder();

		const addContainerHeader = () => {
			const s = Strings[user.Language];

			container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Hospital)
				.addSectionComponents(header => header
					.addTexts([
						`# Hospital`,
						s.subtitle,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1460599175900168388/Hospital_New.png"),
					),
				)
				.addLargeSeparator();
		};

		const generateContainer = async () => {
			const s = Strings[user.Language];

			let text = `${s.userFree}`;
			if (user.IsInHospital()) {
				text = s.userInHospital(user.Hospital.Time);
			}

			const hospitalized = await hospital.GetHospitalized();

			const buttonHospitalized = new ButtonBuilder()
				.setCustomId("hospitalized")
				.setLabel(s.hospitalized)
				.setDisabled(hospitalized.length === 0)
				.setStyle(ButtonStyle.Secondary);

			const buttonPrivate = new ButtonBuilder()
				.setCustomId("private")
				.setLabel(s.payPrivateCare)
				.setEmoji(EmoteBadgeString.Season6.Hypochondriac)
				.setDisabled(!user.IsInHospital())
				.setStyle(ButtonStyle.Secondary);

			addContainerHeader();

			container
				.addTexts([
					s.descriptionPublic,
				])
				.addLargeSeparator()
				.addSectionComponents(section => section
					.addTexts([
						s.descriptionPrivate,
					])
					.setButtonAccessory(buttonPrivate),
				)
				.addLargeSeparator()
				.addTexts([
					`-# ${text}`,
				])
				.addFooter({
					button: buttonHospitalized,
				});

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				if (btn.customId === "hospitalized") {
					buttonHospitalized.setDisabled(true);

					const pagination = new Pagination(interaction, user.Language);

					pagination.HowManyRecords = hospitalized.length;
					pagination.Limit = 10;

					const containerHospitalized = new CustomContainerBuilder()
						.setUser(user)
						.addTexts([
							`# ${s.hospitalized}`,
						])
						.addLargeSeparator();

					pagination.CustomizeContainer = async () => {
						const users = hospitalized.slice(pagination.Offset, pagination.Offset + pagination.Limit);

						for (let i = 0; i < users.length; i++) {
							const u = users[i];
							containerHospitalized.addTexts([
								`### ${ClassList[u.class].Image.Emote.String} ${u.nickname}`,
								`${s.healed} ${showTime(new Date(u.hospitalTime).getTime(), true)} • ${s.howManyTimes(u.hospitalCount)}`,
							]);

							if (i !== users.length - 1) {
								containerHospitalized.addSmallSeparator();
							}
						}

						return containerHospitalized;
					};

					await pagination.GenerateContainer(container);
				}

				else if (btn.customId === "private") {
					buttonPrivate.setDisabled(true);

					await user.GetInfo();

					const { canPay, reason } = await hospital.CanPayPrivate();

					if (!canPay) {
						let message = "";
						if (reason === HospitalFailureReason.UserFree) {
							message = s.userFree;
						}
						else if (reason === HospitalFailureReason.NextInLine) {
							message = s.nextInLine;
						}
						else if (reason === HospitalFailureReason.WithoutMoney) {
							message = s.withoutMoney(hospital.PrivatePrice);
						}

						container = defaultComponent({
							user: user,
							color: CrColors.Hospital,
							description: `${message} ${EmoteString.Hospital}`,
						});

						return replyWithContainer(interaction, container);
					}

					addContainerHeader();

					container
						.addTexts([
							`### ${EmoteBadgeString.Season6.Hypochondriac} ${s.privateCare}`,
							`${s.treatmentCost(hospital.PrivatePrice)}`,
							`-# ${s.confirmPayment}`,
						])
						.addButtonRow(btn => btn
							.setCustomId("confirm")
							.setLabel(s.confirm)
							.setStyle(ButtonStyle.Success),
						)
						.addFooter({
							text: formatMoney(user.Money, user.Language),
						});

					return replyWithContainer(interaction, container);
				}

				else if (btn.customId === "confirm") {
					await user.GetInfo();

					const { canPay, reason } = await hospital.CanPayPrivate();

					if (!canPay) {
						let message = "";
						if (reason === HospitalFailureReason.UserFree) {
							message = s.userFree;
						}
						else if (reason === HospitalFailureReason.NextInLine) {
							message = s.nextInLine;
						}
						else if (reason === HospitalFailureReason.WithoutMoney) {
							message = s.withoutMoney(hospital.PrivatePrice);
						}

						container = defaultComponent({
							user: user,
							color: CrColors.Hospital,
							description: `${message} ${EmoteString.Hospital}`,
						});

						return replyWithContainer(interaction, container);
					}

					await hospital.PayPrivate();

					addContainerHeader();

					container
						.addTexts([
							`### ${EmoteBadgeString.Season6.Hypochondriac} ${s.privateCare}`,
							`${s.privateHealed}`,
						])
						.addFooter({
							text: formatMoney(user.Money, user.Language),
						});

					return replyWithContainer(interaction, container);
				}
			});
		};

		await generateContainer();
	},
};

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
} as const satisfies Localization;
