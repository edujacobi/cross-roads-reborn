"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Investment_1 = require("#core/models/Investment");
const Language_1 = require("#core/models/Language");
const Pagination_1 = require("#core/models/Pagination");
const Classes_1 = require("#core/types/Classes");
const Investments_1 = require("#core/types/Investments");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("investment")
        .setDescription("Manage or buy an investment")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "investimento")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "inversion")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Gerencie ou compre um investimento")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Gestiona o compra una inversión")
        .addSubcommand((sub) => sub
        .setName("buy")
        .setDescription("Buy a new investment")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "comprar")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Compre um novo investimento"))
        .addSubcommand((sub) => sub
        .setName("manage")
        .setDescription("Manage your current investment")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "gerenciar")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Gerencie o seu investimento atual")),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "buy") {
            return await handleBuy(interaction, user, language);
        }
        else if (subcommand === "manage") {
            return await handleManage(interaction, user, language);
        }
    },
};
async function handleBuy(interaction, user, language) {
    const s = Strings[language];
    const investments = Object.values(Investments_1.InvestmentList).sort((a, b) => a.Price - b.Price);
    const userHasInvestment = user.Investment.Id != null;
    const pagination = new Pagination_1.Pagination(interaction, language);
    pagination.Limit = 3;
    pagination.HowManyRecords = investments.length;
    pagination.CustomizeContainer = async () => {
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Investment)
            .addSectionComponents(section => section
            .addTexts([
            `# ${s.buyTitle}`,
            `-# ${s.durationInfo}`,
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL("https://media.discordapp.net/attachments/1233604589064818808/1491106544643997928/Investment.png")))
            .addLargeSeparator();
        if (userHasInvestment) {
            container.addTexts([`⚠️ **${s.alreadyOwnsInvestment}**`]);
            container.addLargeSeparator();
        }
        const currentPageInvestments = investments.slice(pagination.Offset, pagination.Offset + pagination.Limit);
        for (let i = 0; i < currentPageInvestments.length; i++) {
            const investment = currentPageInvestments[i];
            const classModifier = (0, Classes_1.getInvestmentYieldClassModifier)(user.Class);
            const hourly = (0, ui_1.formatMoney)(Math.round(investment.HourlyYield * classModifier), language);
            container
                .addSectionComponents(section => section
                .addTexts([
                `### ${investment.Name[language]}`,
                `-# ${investment.Description[language]}`,
                `${s.profit}: **${hourly}/h**`,
            ])
                .setThumbnailAccessory(thumb => thumb.setURL(investment.ImageUrl)))
                .addSectionComponents(section => section
                .addTexts([
                `${emotes_1.EmoteString.Defense}${investment.BaseDefense} DEF`,
                `-# ${emotes_1.EmoteString.Henchman} -${investment.HenchmanFee}% ${s.henchmanFee}`,
            ])
                .setButtonAccessory(new discord_js_1.ButtonBuilder()
                .setLabel((0, ui_1.formatMoney)(investment.Price, language))
                .setCustomId(`buy${investment.Id}`)
                .setDisabled(investment.Price > user.Money || userHasInvestment)
                .setStyle(discord_js_1.ButtonStyle.Secondary)));
            if (i !== currentPageInvestments.length - 1) {
                container.addLargeSeparator();
            }
        }
        return container;
    };
    function addBuyHeader() {
        return new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Investment)
            .addTexts([
            `-# ${emotes_1.EmoteString.InvestmentActive} ${s.buyTitle}`,
        ])
            .addLargeSeparator();
    }
    const { collector } = await pagination.GenerateContainer();
    let isProcessing = false;
    collector?.on("collect", async (btn) => {
        if (isProcessing)
            return;
        isProcessing = true;
        try {
            if (btn.customId.startsWith("buy")) {
                await (0, discordInteractions_1.deferUpdate)(btn);
                const investmentId = Number(btn.customId.replace("buy", ""));
                const investment = Investments_1.InvestmentList[investmentId];
                const buyConfirmContainer = addBuyHeader()
                    .addTexts([
                    s.buyConfirmationTitle,
                    s.buyConfirmationDesc(investment.Name[language], (0, ui_1.formatMoney)(investment.Price, language)),
                ])
                    .addButtonRow((btn) => btn
                    .setLabel(s.confirmBuy)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setCustomId(`confirm_buy${investmentId}`), (btn) => btn
                    .setLabel(s.cancelBuy)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("cancel_buy"))
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, buyConfirmContainer);
            }
            else if (btn.customId.startsWith("confirm_buy")) {
                await (0, discordInteractions_1.deferUpdate)(btn);
                const investmentId = Number(btn.customId.replace("confirm_buy", ""));
                const investment = Investments_1.InvestmentList[investmentId];
                await user.GetInfo();
                if (!user.IsIdling()) {
                    return (0, discordInteractions_1.replyWithContainer)(interaction, new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor(discord_js_1.Colors.Red)
                        .addTexts([s.notIdlingBuy])
                        .addFooter());
                }
                // Process buy
                const result = await Investment_1.Investment.Buy(user, investmentId);
                if (!result.success) {
                    const errorContainer = addBuyHeader()
                        .setAccentColor(discord_js_1.Colors.Red)
                        .addTexts([
                        s.buyError(result.reason),
                    ])
                        .addFooter({
                        text: (0, ui_1.formatMoney)(user.Money, language),
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, errorContainer);
                }
                // Success
                const successContainer = addBuyHeader()
                    .addTexts([
                    `${s.buySuccess} **${investment.Name[language]}**!`,
                ])
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                pagination.UserHasInteractedOutside = true;
                collector.stop();
                return (0, discordInteractions_1.replyWithContainer)(interaction, successContainer);
            }
            else if (btn.customId === "cancel_buy") {
                await (0, discordInteractions_1.deferUpdate)(btn);
                const container = await pagination.BuildContainerWithRow();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        }
        finally {
            isProcessing = false;
        }
    });
}
async function handleManage(interaction, user, language) {
    const s = Strings[language];
    const investmentId = user.Investment.Id;
    if (investmentId == null) {
        return (0, discordInteractions_1.replyWithContainer)(interaction, new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Investment)
            .addTexts([s.noInvestment]));
    }
    const investment = Investments_1.InvestmentList[investmentId];
    await user.GetInfo(); // Ensure state is fresh
    function addContainerHeader() {
        return new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Default)
            .addTexts([
            `-# ${emotes_1.EmoteString.InvestmentActive} ${s.manageTitle}`,
        ])
            .addLargeSeparator();
    }
    function generateManageContainer() {
        const classModifier = (0, Classes_1.getInvestmentYieldClassModifier)(user.Class);
        const hourly = (0, ui_1.formatMoney)(Math.round(investment.HourlyYield * classModifier), language);
        const henchmanBonus = Investment_1.Investment.HasActiveHenchman(user) ? 10 : 0;
        const container = addContainerHeader()
            .addTexts([
            `# ${investment.Name[language]}`,
            `-# ${investment.Description[language]}`,
            `### ${hourly}/h`,
            `${emotes_1.EmoteString.Defense}${investment.BaseDefense + henchmanBonus} DEF`,
        ])
            .addLargeSeparator();
        const accumulated = (0, ui_1.formatMoney)(user.Investment.AccumulatedYield, language);
        let hasHenchman = false;
        let henchmanText = `${s.henchmanInactive}`;
        if (Investment_1.Investment.HasContractHenchman(user)) {
            hasHenchman = true;
            const timeObj = (0, discord_js_1.time)(user.Investment.HenchmanEndsAt, discord_js_1.TimestampStyles.RelativeTime);
            henchmanText = `${s.henchmanActive} ${timeObj}` + (user.Investment.HenchmanHospitalized
                ? `\n-# ${emotes_1.EmoteString.Hospital} ${s.henchmanHospitalized}`
                : "");
        }
        container
            .addSectionComponents(henchmanSection => henchmanSection
            .addTexts([
            `${emotes_1.EmoteString.Henchman} **${s.henchmanLabel}**: ${henchmanText}`,
        ])
            .setButtonAccessory(new discord_js_1.ButtonBuilder()
            .setLabel(s.hireHenchmanBtn)
            .setCustomId("hire_henchman")
            .setDisabled(hasHenchman)
            .setStyle(hasHenchman ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Success)))
            .addLargeSeparator();
        // Remaining time until expiration
        let expiresAtText = "";
        if (user.Investment.ExpiresAt) {
            const remaining = (0, discord_js_1.time)(user.Investment.ExpiresAt, discord_js_1.TimestampStyles.RelativeTime);
            expiresAtText = `**${s.expiresAt}**: ${remaining}`;
        }
        // Next payment: based on InvestmentManager's last processed hour
        const nextPaymentDate = Investment_1.Investment.GetNextPaymentTime();
        const infoTexts = [
            `**${s.accumulatedYield}**: ${accumulated}`,
            `**${s.nextPayment}**: ${(0, discord_js_1.time)(nextPaymentDate, discord_js_1.TimestampStyles.RelativeTime)}`,
            expiresAtText ?? undefined,
        ].filter(Boolean);
        container
            .addTexts(infoTexts)
            .addImage(investment.ImageUrl);
        const notifyLabel = user.Investment.NotifyYield ? s.deactivateNotification : s.activateNotification;
        container.addButtonRow((btn) => btn
            .setLabel(s.abandonInvestment)
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setCustomId("abandon"), (btn) => btn
            .setLabel(notifyLabel)
            .setEmoji(user.Investment.NotifyYield ? "🔕" : "🔔")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setCustomId("toggle_notify"));
        container.addFooter({
            text: (0, ui_1.formatMoney)(user.Money, language),
        });
        return container;
    }
    let container = generateManageContainer();
    const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
    const collector = (0, collectors_1.createButtonCollector)(interaction, response);
    let isProcessing = false;
    collector?.on("collect", async (btn) => {
        if (isProcessing)
            return;
        isProcessing = true;
        try {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === "hire_henchman") {
                // Show confirmation
                const feePercent = investment.HenchmanFee;
                const confirmContainer = addContainerHeader()
                    .addTexts([
                    `### ${s.hireHenchmanConfirmTitle}`,
                    s.hireHenchmanConfirmDesc(feePercent),
                ])
                    .addButtonRow((btn) => btn
                    .setLabel(s.confirmHire)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji(emotes_1.EmoteString.Henchman)
                    .setCustomId("confirm_hire"), (btn) => btn
                    .setLabel(s.cancelAction)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("cancel_hire"))
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, confirmContainer);
            }
            else if (btn.customId === "confirm_hire") {
                const result = await Investment_1.Investment.HireHenchman(user);
                if (!result.success) {
                    const errorContainer = addContainerHeader()
                        .setAccentColor(discord_js_1.Colors.Red)
                        .addTexts([s.hireHenchmanError(result.reason || "unknown")])
                        .addFooter({
                        text: (0, ui_1.formatMoney)(user.Money, language),
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, errorContainer);
                }
                await user.GetInfo(); // Refresh state from DB
                container = generateManageContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "cancel_hire") {
                container = generateManageContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "toggle_notify") {
                await Investment_1.Investment.ToggleNotifyYield(user);
                container = generateManageContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "abandon") {
                const abandonConfirmation = addContainerHeader()
                    .addTexts([
                    `### ${s.abandonConfirmationTitle}`,
                    s.abandonWarning,
                ])
                    .addButtonRow((btn) => btn
                    .setLabel(s.confirmAbandon)
                    .setStyle(discord_js_1.ButtonStyle.Danger)
                    .setCustomId("confirm_abandon"), (btn) => btn
                    .setLabel(s.cancelAction)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("cancel_abandon"))
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, abandonConfirmation);
            }
            else if (btn.customId === "confirm_abandon") {
                await user.GetInfo();
                if (!user.IsIdling()) {
                    return (0, discordInteractions_1.replyWithContainer)(interaction, new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor(discord_js_1.Colors.Red)
                        .addTexts([s.notIdlingAbandon])
                        .addFooter());
                }
                const result = await Investment_1.Investment.Abandon(user);
                if (!result.success) {
                    const errorContainer = addContainerHeader()
                        .setAccentColor(discord_js_1.Colors.Red)
                        .addTexts([s.abandonError(result.reason || "unknown")])
                        .addFooter({
                        text: (0, ui_1.formatMoney)(user.Money, language),
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, errorContainer);
                }
                const successContainer = addContainerHeader()
                    .addTexts([s.abandonSuccess])
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                collector?.stop();
                return (0, discordInteractions_1.replyWithContainer)(interaction, successContainer);
            }
            else if (btn.customId === "cancel_abandon") {
                container = generateManageContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        }
        finally {
            isProcessing = false;
        }
    });
    collector?.on("end", async () => {
        await (0, collectors_1.disableButtons)(interaction, container);
    });
}
const Strings = {
    [Language_1.Language.English]: {
        buyTitle: "Investments for Sale",
        durationInfo: `All investments have a duration of 7 days. You will receive profits every hour, but only if you are ${emotes_1.EmoteString.Idle} Idling.\n-# Pay attention! Investments can be attacked by ${emotes_1.EmoteString.Gang} gangs.`,
        alreadyOwnsInvestment: "You already own an investment. Abandon it first to buy a new one.",
        previous: "Previous",
        next: "Next",
        profit: "Profit",
        henchmanFee: "Henchman fee",
        buyError: (reason) => {
            if (reason === "insufficient_funds")
                return "You do not have enough money.";
            if (reason === "already_has_investment")
                return "You already own an investment. Abandon it first.";
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
        hireHenchmanConfirmDesc: (feePercent) => `The henchman will protect your investment for 12 hours, adding ${emotes_1.EmoteString.Defense}+10 DEF.\nHowever, the henchman takes **${feePercent}%** of your hourly profit as a fee.`,
        confirmHire: "Confirm hire",
        cancelAction: "Cancel",
        hireHenchmanError: (reason) => {
            if (reason === "already_has_henchman")
                return "You already have an active henchman contract.";
            if (reason === "no_investment")
                return "You do not own an investment.";
            return "Error hiring henchman.";
        },
        abandonInvestment: "Abandon",
        abandonWarning: "Are you sure you want to abandon this investment? You will lose it entirely, including any accumulated profits. There is no refund.",
        confirmAbandon: "Yes, abandon",
        abandonSuccess: "You have successfully abandoned your investment.",
        abandonError: (reason) => {
            if (reason === "no_investment")
                return "You do not own an investment.";
            return "Error abandoning investment.";
        },
        activateNotification: "Activate notifications",
        deactivateNotification: "Deactivate notifications",
        buyConfirmationTitle: "Confirm purchase?",
        buyConfirmationDesc: (name, price) => `Are you sure you want to buy the investment **${name}** for **${price}**?`,
        confirmBuy: "Confirm purchase",
        cancelBuy: "Cancel",
        abandonConfirmationTitle: "Abandon investment?",
        notIdlingBuy: `You must be ${emotes_1.EmoteString.Idle} Idling to buy an investment!`,
        notIdlingAbandon: `You must be ${emotes_1.EmoteString.Idle} Idling to abandon your investment!`,
    },
    [Language_1.Language.Portuguese]: {
        buyTitle: "Investimentos à Venda",
        durationInfo: `Todos os investimentos possuem duração de 7 dias. Você receberá lucros a cada hora, mas somente se estiver ${emotes_1.EmoteString.Idle} Vadiando.\n-# Fique atento! Investimentos podem ser atacados por ${emotes_1.EmoteString.Gang} gangues.`,
        alreadyOwnsInvestment: "Você já possui um investimento. Abandone-o antes de comprar um novo.",
        previous: "Anterior",
        next: "Próximo",
        profit: "Lucro",
        henchmanFee: "Taxa capanga",
        buyError: (reason) => {
            if (reason === "insufficient_funds")
                return "Você não tem dinheiro suficiente.";
            if (reason === "already_has_investment")
                return "Você já possui um investimento. Abandone-o primeiro.";
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
        hireHenchmanConfirmDesc: (feePercent) => `O capanga protegerá seu investimento por 12 horas, adicionando ${emotes_1.EmoteString.Defense}+10 DEF.\nPorém, o capanga fica com **${feePercent}%** do lucro por hora como taxa.`,
        confirmHire: "Confirmar",
        cancelAction: "Cancelar",
        hireHenchmanError: (reason) => {
            if (reason === "already_has_henchman")
                return "Você já possui um contrato de capanga ativo.";
            if (reason === "no_investment")
                return "Você não possui um investimento.";
            return "Erro ao contratar capanga.";
        },
        abandonInvestment: "Abandonar",
        abandonWarning: "Tem certeza que deseja abandonar o investimento? Você perderá o patrimônio e os lucros não recolhidos. Não há reembolso.",
        confirmAbandon: "Sim, abandonar",
        abandonSuccess: "Você abandonou seu investimento.",
        abandonError: (reason) => {
            if (reason === "no_investment")
                return "Você não possui um investimento.";
            return "Erro ao abandonar investimento.";
        },
        activateNotification: "Ativar notificações",
        deactivateNotification: "Desativar notificações",
        buyConfirmationTitle: "Confirmar compra?",
        buyConfirmationDesc: (name, price) => `Tem certeza que deseja comprar o investimento **${name}** por **${price}**?`,
        confirmBuy: "Confirmar compra",
        cancelBuy: "Cancelar",
        abandonConfirmationTitle: "Abandonar investimento?",
        notIdlingBuy: `Você precisa estar ${emotes_1.EmoteString.Idle} Vadiando para comprar um investimento!`,
        notIdlingAbandon: `Você precisa estar ${emotes_1.EmoteString.Idle} Vadiando para abandonar seu investimento!`,
    },
    [Language_1.Language.Spanish]: {
        buyTitle: "Inversiones en Venta",
        durationInfo: `Todas las inversiones tienen una duración de 7 días. Recibirás lucros cada hora, mas solo si estás ${emotes_1.EmoteString.Idle} Vagando.\n-# ¡Presta atención! Las inversiones pueden ser atacadas por ${emotes_1.EmoteString.Gang} cuadrillas.`,
        alreadyOwnsInvestment: "Ya posees una inversión. Abandónala antes de comprar una nueva.",
        previous: "Anterior",
        next: "Siguiente",
        profit: "Lucro",
        henchmanFee: "Comisión secuaz",
        buyError: (reason) => {
            if (reason === "insufficient_funds")
                return "No tienes suficiente dinero.";
            if (reason === "already_has_investment")
                return "Ya posees una inversión. Abandónala primero.";
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
        hireHenchmanConfirmDesc: (feePercent) => `El secuaz protegerá tu inversión por 12 horas, añadiendo ${emotes_1.EmoteString.Defense}+10 DEF.\nSin embargo, el secuaz se lleva el **${feePercent}%** de tu lucro por hora como comisión.`,
        confirmHire: "Confirmar",
        cancelAction: "Cancelar",
        hireHenchmanError: (reason) => {
            if (reason === "already_has_henchman")
                return "Ya tienes un contrato de secuaz activo.";
            if (reason === "no_investment")
                return "No posees una inversión.";
            return "Error al contratar al secuaz.";
        },
        abandonInvestment: "Abandonar",
        abandonWarning: "¿Estás seguro de abandonar la inversión? Perderás todo y los lucros. No hay reembolso.",
        confirmAbandon: "Sí, abandonar",
        abandonSuccess: "Abandonaste la inversión.",
        abandonError: (reason) => {
            if (reason === "no_investment")
                return "No posees una inversión.";
            return "Error al abandonar la inversión.";
        },
        activateNotification: "Activar notificaciones",
        deactivateNotification: "Desactivar notificaciones",
        buyConfirmationTitle: "¿Confirmar compra?",
        buyConfirmationDesc: (name, price) => `¿Seguro que quieres comprar la inversión **${name}** por **${price}**?`,
        confirmBuy: "Confirmar compra",
        cancelBuy: "Cancelar",
        abandonConfirmationTitle: "¿Abandonar inversión?",
        notIdlingBuy: `¡Debes estar ${emotes_1.EmoteString.Idle} Vagando para comprar una inversión!`,
        notIdlingAbandon: `¡Debes estar ${emotes_1.EmoteString.Idle} Vagando para abandonar tu inversión!`,
    },
};
//# sourceMappingURL=investment.js.map