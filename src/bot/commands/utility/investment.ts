import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferReply, deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney, showTime } from "#bot/utils/ui";
import { InvestmentManager } from "#core/models/InvestmentManager";
import { Language, type Localization } from "#core/models/Language";
import { Pagination } from "#core/models/Pagination";
import { type User } from "#core/models/User";
import { getInvestmentYieldClassModifier } from "#core/types/Classes";
import { InvestmentList, type InvestmentActionReason, type InvestmentId } from "#core/types/Investments";
import {
	ButtonBuilder,
	ButtonStyle,
	Colors,
	Locale,
	SlashCommandBuilder,
	type ChatInputCommandInteraction,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("investment")
		.setDescription("Manage or buy an investment")
		.setNameLocalization(Locale.PortugueseBR, "investimento")
		.setDescriptionLocalization(Locale.PortugueseBR, "Gerencie ou compre um investimento")
		.addSubcommand((sub) => sub
			.setName("buy")
			.setDescription("Buy a new investment")
			.setNameLocalization(Locale.PortugueseBR, "comprar")
			.setDescriptionLocalization(Locale.PortugueseBR, "Compre um novo investimento"),
		)
		.addSubcommand((sub) => sub
			.setName("manage")
			.setDescription("Manage your current investment")
			.setNameLocalization(Locale.PortugueseBR, "gerenciar")
			.setDescriptionLocalization(Locale.PortugueseBR, "Gerencie o seu investimento atual"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === "buy") {
			return await handleBuy(interaction, user, language);
		}
		else if (subcommand === "manage") {
			return await handleManage(interaction, user, language);
		}
	},
};

async function handleBuy(interaction: ChatInputCommandInteraction, user: User, language: Language) {
	const s = Strings[language];
	const investments = Object.values(InvestmentList).sort((a, b) => a.Price - b.Price);
	const userHasInvestment = user.Investment.Id != null;

	const pagination = new Pagination(interaction, language);
	pagination.Limit = 3;
	pagination.HowManyRecords = investments.length;

	pagination.CustomizeContainer = async () => {
		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Investment)
			.addSectionComponents(section => section
				.addTexts([
					`# ${s.buyTitle}`,
					`-# ${s.durationInfo}`,
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1491106544643997928/Investment.png"),
				),
			)
			.addLargeSeparator();

		if (userHasInvestment) {
			container.addTexts([`⚠️ **${s.alreadyOwnsInvestment}**`]);
			container.addLargeSeparator();
		}

		const currentPageItems = investments.slice(pagination.Offset, pagination.Offset + pagination.Limit);

		for (let i = 0; i < currentPageItems.length; i++) {
			const item = currentPageItems[i];
			const classModifier = getInvestmentYieldClassModifier(user.Class);
			const hourly = formatMoney(Math.round(item.HourlyYield * classModifier), language);

			container
				.addSectionComponents(section => section
					.addTexts([
						`### ${item.Name[language]}`,
						`-# ${item.Description[language]}`,
						`${s.profit}: **${hourly}/h**`,
					])
					.setThumbnailAccessory(thumb => thumb.setURL(item.ImageUrl)),
				)
				.addSectionComponents(section => section
					.addTexts([
						`${EmoteString.Defense}${item.BaseDefense} DEF`,
						`-# ${EmoteString.Henchman} -${item.HenchmanFee}% ${s.henchmanFee}`,
					])
					.setButtonAccessory(new ButtonBuilder()
						.setLabel(formatMoney(item.Price, language))
						.setCustomId(`buy${item.Id}`)
						.setDisabled(item.Price > user.Money || userHasInvestment)
						.setStyle(ButtonStyle.Secondary),
					),
				);

			if (i !== currentPageItems.length - 1) {
				container.addLargeSeparator();
			}
		}

		return container;
	};

	function addBuyHeader() {
		return new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Investment)
			.addTexts([
				`-# ${EmoteString.InvestmentActive} ${s.buyTitle}`,
			])
			.addLargeSeparator();
	}

	const { collector } = await pagination.GenerateContainer();

	collector?.on("collect", async btn => {
		if (btn.customId.startsWith("buy")) {
			await deferUpdate(btn);
			const itemId = Number(btn.customId.replace("buy", "")) as InvestmentId;
			const item = InvestmentList[itemId];

			const buyConfirmContainer = addBuyHeader()
				.addTexts([
					s.buyConfirmationTitle,
					s.buyConfirmationDesc(item.Name[language], formatMoney(item.Price, language)),
				])
				.addButtonRow(
					(btn) => btn
						.setLabel(s.confirmBuy)
						.setStyle(ButtonStyle.Success)
						.setCustomId(`confirm_buy${itemId}`),
					(btn) => btn
						.setLabel(s.cancelBuy)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("cancel_buy"),
				)
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			return replyWithContainer(interaction, buyConfirmContainer);

		}
		else if (btn.customId.startsWith("confirm_buy")) {
			await deferUpdate(btn);
			const itemId = Number(btn.customId.replace("confirm_buy", "")) as InvestmentId;
			const item = InvestmentList[itemId];

			await user.GetInfo();

			if (!user.IsIdling()) {
				return replyWithContainer(interaction, new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(Colors.Red)
					.addTexts([s.notIdlingBuy])
					.addFooter());
			}


			// Process buy
			const result = await InvestmentManager.Buy(user, itemId);

			if (!result.success) {
				const errorContainer = addBuyHeader()
					.setAccentColor(Colors.Red)
					.addTexts([
						s.buyError(result.reason!),
					])
					.addFooter({
						text: formatMoney(user.Money, language),
					});

				return replyWithContainer(interaction, errorContainer);
			}

			// Success
			const successContainer = addBuyHeader()
				.addTexts([
					`${s.buySuccess} **${item.Name[language]}**!`,
				])
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			pagination.UserHasInteractedOutside = true;
			collector.stop();
			return replyWithContainer(interaction, successContainer);

		}
		else if (btn.customId === "cancel_buy") {
			await deferUpdate(btn);
			const container = await pagination.BuildContainerWithRow();
			return replyWithContainer(interaction, container);
		}
	});
}

async function handleManage(interaction: ChatInputCommandInteraction, user: User, language: Language) {
	const s = Strings[language];
	const investmentId = user.Investment.Id;

	if (investmentId == null) {
		return replyWithContainer(interaction, new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Investment)
			.addTexts([s.noInvestment]));
	}

	const investment = InvestmentList[investmentId];

	await user.GetInfo(); // Ensure state is fresh

	function addContainerHeader() {
		return new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Default)
			.addTexts([
				`-# ${EmoteString.InvestmentActive} ${s.manageTitle}`,
			])
			.addLargeSeparator();
	}

	function generateManageContainer() {
		const classModifier = getInvestmentYieldClassModifier(user.Class);
		const hourly = formatMoney(Math.round(investment.HourlyYield * classModifier), language);
		const henchmanBonus = InvestmentManager.HasActiveHenchman(user) ? 10 : 0;

		const container = addContainerHeader()
			.addTexts([
				`# ${investment.Name[language]}`,
				`-# ${investment.Description[language]}`,
				`### ${hourly}/h`,
				`${EmoteString.Defense}${investment.BaseDefense + henchmanBonus} DEF`,
			])
			.addLargeSeparator();

		const accumulated = formatMoney(user.Investment.AccumulatedYield, language);
		let hasHenchman = false;
		let henchmanText = `${s.henchmanInactive}`;

		if (InvestmentManager.HasContractHenchman(user)) {
			hasHenchman = true;
			const timeObj = showTime(new Date(user.Investment.HenchmanEndsAt!).getTime(), true);
			henchmanText = `${s.henchmanActive} ${timeObj}` + (user.Investment.HenchmanHospitalized
				? `\n-# ${EmoteString.Hospital} ${s.henchmanHospitalized}`
				: "");
		}

		container
			.addSectionComponents(henchmanSection => henchmanSection
				.addTexts([
					`${EmoteString.Henchman} **${s.henchmanLabel}**: ${henchmanText}`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setLabel(s.hireHenchmanBtn)
					.setCustomId("hire_henchman")
					.setDisabled(hasHenchman)
					.setStyle(hasHenchman ? ButtonStyle.Secondary : ButtonStyle.Success),
				),
			)
			.addLargeSeparator();

		// Remaining time until expiration
		let expiresAtText = "";
		if (user.Investment.ExpiresAt) {
			const remaining = showTime(user.Investment.ExpiresAt.getTime(), true);
			expiresAtText = `**${s.expiresAt}**: ${remaining}`;
		}

		// Next payment: based on InvestmentManager's last processed hour
		const nextPaymentDate = InvestmentManager.GetNextPaymentTime();

		const infoTexts = [
			`**${s.accumulatedYield}**: ${accumulated}`,
			`**${s.nextPayment}**: ${showTime(nextPaymentDate.getTime(), true)}`,
			expiresAtText ?? undefined,
		].filter(Boolean);

		container
			.addTexts(infoTexts)
			.addImage(investment.ImageUrl);


		const notifyLabel = user.Investment.NotifyYield ? s.deactivateNotification : s.activateNotification;

		container.addButtonRow(
			(btn) => btn
				.setLabel(s.abandonInvestment)
				.setStyle(ButtonStyle.Danger)
				.setCustomId("abandon"),
			(btn) => btn
				.setLabel(notifyLabel)
				.setEmoji(user.Investment.NotifyYield ? "🔕" : "🔔")
				.setStyle(ButtonStyle.Secondary)
				.setCustomId("toggle_notify"),
		);

		container.addFooter({
			text: formatMoney(user.Money, language),
		});

		return container;
	}

	let container = generateManageContainer();
	const response = await replyWithContainer(interaction, container);
	const collector = createButtonCollector(interaction, response);

	collector?.on("collect", async btn => {
		await deferUpdate(btn);

		if (btn.customId === "hire_henchman") {
			// Show confirmation
			const feePercent = investment.HenchmanFee;
			const confirmContainer = addContainerHeader()
				.addTexts([
					`### ${s.hireHenchmanConfirmTitle}`,
					s.hireHenchmanConfirmDesc(feePercent),
				])
				.addButtonRow(
					(btn) => btn
						.setLabel(s.confirmHire)
						.setStyle(ButtonStyle.Success)
						.setEmoji(EmoteString.Henchman)
						.setCustomId("confirm_hire"),
					(btn) => btn
						.setLabel(s.cancelAction)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("cancel_hire"),
				)
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			return replyWithContainer(interaction, confirmContainer);

		}
		else if (btn.customId === "confirm_hire") {
			const result = await InvestmentManager.HireHenchman(user);
			if (!result.success) {
				const errorContainer = addContainerHeader()
					.setAccentColor(Colors.Red)
					.addTexts([s.hireHenchmanError(result.reason || "unknown")])
					.addFooter({
						text: formatMoney(user.Money, language),
					});
				return replyWithContainer(interaction, errorContainer);
			}

			await user.GetInfo(); // Refresh state from DB
			container = generateManageContainer();
			return replyWithContainer(interaction, container);

		}
		else if (btn.customId === "cancel_hire") {
			container = generateManageContainer();
			return replyWithContainer(interaction, container);

		}
		else if (btn.customId === "toggle_notify") {
			await InvestmentManager.ToggleNotifyYield(user);
			container = generateManageContainer();
			return replyWithContainer(interaction, container);

		}
		else if (btn.customId === "abandon") {
			const abandonConfirmation = addContainerHeader()
				.addTexts([
					`### ${s.abandonConfirmationTitle}`,
					s.abandonWarning,
				])
				.addButtonRow(
					(btn) => btn
						.setLabel(s.confirmAbandon)
						.setStyle(ButtonStyle.Danger)
						.setCustomId("confirm_abandon"),
					(btn) => btn
						.setLabel(s.cancelAction)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("cancel_abandon"),
				)
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			return replyWithContainer(interaction, abandonConfirmation);

		}
		else if (btn.customId === "confirm_abandon") {
			await user.GetInfo();

			if (!user.IsIdling()) {
				return replyWithContainer(interaction, new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(Colors.Red)
					.addTexts([s.notIdlingAbandon])
					.addFooter(),
				);
			}

			const result = await InvestmentManager.Abandon(user);

			if (!result.success) {
				const errorContainer = addContainerHeader()
					.setAccentColor(Colors.Red)
					.addTexts([s.abandonError(result.reason || "unknown")])
					.addFooter({
						text: formatMoney(user.Money, language),
					});
				return replyWithContainer(interaction, errorContainer);
			}

			const successContainer = addContainerHeader()
				.addTexts([s.abandonSuccess])
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			collector?.stop();
			return replyWithContainer(interaction, successContainer);

		}
		else if (btn.customId === "cancel_abandon") {
			container = generateManageContainer();
			return replyWithContainer(interaction, container);
		}
	});

	collector?.on("end", async () => {
		await disableButtons(interaction, container);
	});
}

const Strings = {
	[Language.English]: {
		buyTitle: "Investments for Sale",
		durationInfo: `All investments have a duration of 7 days. You will receive profits every hour, but only if you are ${EmoteString.Idle} Idling.\n-# Pay attention! Investments can be attacked by ${EmoteString.Gang} gangs.`,
		alreadyOwnsInvestment: "You already own an investment. Abandon it first to buy a new one.",
		previous: "Previous",
		next: "Next",
		profit: "Profit",
		henchmanFee: "Henchman fee",
		buyError: (reason: InvestmentActionReason) => {
			if (reason === "insufficient_funds") return "You do not have enough money.";
			if (reason === "already_has_investment") return "You already own an investment. Abandon it first.";
			return "Error purchasing investment.";
		},
		buySuccess: "You successfully bought",
		noInvestment: "You do not own any investments.",
		manageTitle: "Managing Investment",
		accumulatedYield: "Accumulated profit",
		hourlyYield: "Hourly profit",
		defense: "Defense",
		henchmanLabel: "Henchman",
		henchmanActive: "Contract ends",
		henchmanInactive: "Inactive",
		henchmanHospitalized: "Hospitalized",
		expiresAt: "Expires",
		nextPayment: "Next payment",
		hireHenchmanBtn: "Hire henchman",
		hireHenchmanConfirmTitle: "Hire henchman?",
		hireHenchmanConfirmDesc: (feePercent: number) => `The henchman will protect your investment for 12 hours, adding ${EmoteString.Defense}+10 DEF.\nHowever, the henchman takes **${feePercent}%** of your hourly profit as a fee.`,
		confirmHire: "Confirm hire",
		cancelAction: "Cancel",
		hireHenchmanError: (reason: InvestmentActionReason) => {
			if (reason === "already_has_henchman") return "You already have an active henchman contract.";
			if (reason === "no_investment") return "You do not own an investment.";
			return "Error hiring henchman.";
		},
		abandonInvestment: "Abandon",
		abandonWarning: "Are you sure you want to abandon this investment? You will lose it entirely, including any accumulated profits. There is no refund.",
		confirmAbandon: "Yes, abandon",
		abandonSuccess: "You have successfully abandoned your investment.",
		abandonError: (reason: InvestmentActionReason) => {
			if (reason === "no_investment") return "You do not own an investment.";
			return "Error abandoning investment.";
		},
		activateNotification: "Activate notifications",
		deactivateNotification: "Deactivate notifications",
		buyConfirmationTitle: "Confirm purchase?",
		buyConfirmationDesc: (name: string, price: string) => `Are you sure you want to buy the investment **${name}** for **${price}**?`,
		confirmBuy: "Confirm purchase",
		cancelBuy: "Cancel",
		abandonConfirmationTitle: "Abandon investment?",
		notIdlingBuy: `You must be ${EmoteString.Idle} Idling to buy an investment!`,
		notIdlingAbandon: `You must be ${EmoteString.Idle} Idling to abandon your investment!`,
	},
	[Language.Portuguese]: {
		buyTitle: "Investimentos à Venda",
		durationInfo: `Todos os investimentos possuem duração de 7 dias. Você receberá lucros a cada hora, mas somente se estiver ${EmoteString.Idle} Vadiando.\n-# Fique atento! Investimentos podem ser atacados por ${EmoteString.Gang} gangues.`,
		alreadyOwnsInvestment: "Você já possui um investimento. Abandone-o antes de comprar um novo.",
		previous: "Anterior",
		next: "Próximo",
		profit: "Lucro",
		henchmanFee: "Taxa capanga",
		buyError: (reason: InvestmentActionReason) => {
			if (reason === "insufficient_funds") return "Você não tem dinheiro suficiente.";
			if (reason === "already_has_investment") return "Você já possui um investimento. Abandone-o primeiro.";
			return "Erro ao comprar investimento.";
		},
		buySuccess: "Você comprou com sucesso",
		noInvestment: "Você não possui nenhum investimento no momento.",
		manageTitle: "Gerenciando Investimento",
		accumulatedYield: "Lucros acumulados",
		hourlyYield: "Lucro por hora",
		defense: "Defesa",
		henchmanLabel: "Capanga",
		henchmanActive: "Contrato termina",
		henchmanInactive: "Inativo",
		henchmanHospitalized: "Hospitalizado",
		expiresAt: "Expira",
		nextPayment: "Próximo pagamento",
		hireHenchmanBtn: "Contratar capanga",
		hireHenchmanConfirmTitle: "Contratar capanga?",
		hireHenchmanConfirmDesc: (feePercent: number) => `O capanga protegerá seu investimento por 12 horas, adicionando ${EmoteString.Defense}+10 DEF.\nPorém, o capanga fica com **${feePercent}%** do lucro por hora como taxa.`,
		confirmHire: "Confirmar",
		cancelAction: "Cancelar",
		hireHenchmanError: (reason: InvestmentActionReason) => {
			if (reason === "already_has_henchman") return "Você já possui um contrato de capanga ativo.";
			if (reason === "no_investment") return "Você não possui um investimento.";
			return "Erro ao contratar capanga.";
		},
		abandonInvestment: "Abandonar",
		abandonWarning: "Tem certeza que deseja abandonar o investimento? Você perderá o patrimônio e os lucros não recolhidos. Não há reembolso.",
		confirmAbandon: "Sim, abandonar",
		abandonSuccess: "Você abandonou seu investimento.",
		abandonError: (reason: InvestmentActionReason) => {
			if (reason === "no_investment") return "Você não possui um investimento.";
			return "Erro ao abandonar investimento.";
		},
		activateNotification: "Ativar notificações",
		deactivateNotification: "Desativar notificações",
		buyConfirmationTitle: "Confirmar compra?",
		buyConfirmationDesc: (name: string, price: string) => `Tem certeza que deseja comprar o investimento **${name}** por **${price}**?`,
		confirmBuy: "Confirmar compra",
		cancelBuy: "Cancelar",
		abandonConfirmationTitle: "Abandonar investimento?",
		notIdlingBuy: `Você precisa estar ${EmoteString.Idle} Vadiando para comprar um investimento!`,
		notIdlingAbandon: `Você precisa estar ${EmoteString.Idle} Vadiando para abandonar seu investimento!`,
	},
	[Language.Spanish]: {
		buyTitle: "Inversiones en Venta",
		durationInfo: `Todas las inversiones tienen una duración de 7 días. Recibirás lucros cada hora, mas solo si estás ${EmoteString.Idle} Vagando.\n-# ¡Presta atención! Las inversiones pueden ser atacadas por ${EmoteString.Gang} cuadrillas.`,
		alreadyOwnsInvestment: "Ya posees una inversión. Abandónala antes de comprar una nueva.",
		previous: "Anterior",
		next: "Siguiente",
		profit: "Lucro",
		henchmanFee: "Comisión secuaz",
		buyError: (reason: InvestmentActionReason) => {
			if (reason === "insufficient_funds") return "No tienes suficiente dinero.";
			if (reason === "already_has_investment") return "Ya posees una inversión. Abandónala primero.";
			return "Error al comprar la inversión.";
		},
		buySuccess: "Compraste con éxito",
		noInvestment: "No tienes ninguna inversión en este momento.",
		manageTitle: "Gestionando Inversión",
		accumulatedYield: "Lucros acumulados",
		hourlyYield: "Lucro por hora",
		defense: "Defensa",
		henchmanLabel: "Secuaz",
		henchmanActive: "Contrato termina",
		henchmanInactive: "Inactivo",
		henchmanHospitalized: "Hospitalizado",
		expiresAt: "Expira",
		nextPayment: "Próximo pago",
		hireHenchmanBtn: "Contratar secuaz",
		hireHenchmanConfirmTitle: "¿Contratar secuaz?",
		hireHenchmanConfirmDesc: (feePercent: number) => `El secuaz protegerá tu inversión por 12 horas, añadiendo ${EmoteString.Defense}+10 DEF.\nSin embargo, el secuaz se lleva el **${feePercent}%** de tu lucro por hora como comisión.`,
		confirmHire: "Confirmar",
		cancelAction: "Cancelar",
		hireHenchmanError: (reason: InvestmentActionReason) => {
			if (reason === "already_has_henchman") return "Ya tienes un contrato de secuaz activo.";
			if (reason === "no_investment") return "No posees una inversión.";
			return "Error al contratar al secuaz.";
		},
		abandonInvestment: "Abandonar",
		abandonWarning: "¿Estás seguro de abandonar la inversión? Perderás todo y los lucros. No hay reembolso.",
		confirmAbandon: "Sí, abandonar",
		abandonSuccess: "Abandonaste la inversión.",
		abandonError: (reason: InvestmentActionReason) => {
			if (reason === "no_investment") return "No posees una inversión.";
			return "Error al abandonar la inversión.";
		},
		activateNotification: "Activar notificaciones",
		deactivateNotification: "Desactivar notificaciones",
		buyConfirmationTitle: "¿Confirmar compra?",
		buyConfirmationDesc: (name: string, price: string) => `¿Seguro que quieres comprar la inversión **${name}** por **${price}**?`,
		confirmBuy: "Confirmar compra",
		cancelBuy: "Cancelar",
		abandonConfirmationTitle: "¿Abandonar inversión?",
		notIdlingBuy: `¡Debes estar ${EmoteString.Idle} Vagando para comprar una inversión!`,
		notIdlingAbandon: `¡Debes estar ${EmoteString.Idle} Vagando para abandonar tu inversión!`,
	},
} as const satisfies Localization;
