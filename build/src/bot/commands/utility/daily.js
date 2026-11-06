"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const officialServer_1 = require("#bot/utils/officialServer");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("daily")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "diario")
        .setDescription("Receives a small ammount of money. Keep a streak and the money grows!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Recebe uma pequena quantidade de grana. Mantenha uma sequência e a grana aumenta!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Recibe una pequeña cantidad de dinero. ¡Mantén una racha y el dinero aumenta!"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Default);
        if (!user.CanReceiveDaily()) {
            if (!user.Daily.LastReceived) {
                return;
            }
            container
                .addTexts([
                s.descriptionReceived((0, discord_js_1.time)((0, date_fns_1.addDays)(user.Daily.LastReceived, 1), discord_js_1.TimestampStyles.RelativeTime)),
            ])
                .addFooter({
                text: (0, ui_1.formatMoney)(user.Money, language),
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        const isBooster = await (0, officialServer_1.isUserBoosterInOfficialServer)(interaction);
        const { money, bonusItems } = await user.ReceiveDaily({ isBooster });
        const texts = [
            s.description(money, user.Daily.CurrentStreak),
        ];
        if (bonusItems && bonusItems.length > 0) {
            texts.push(`### ${s.bonusTitle}`);
            bonusItems.forEach(bonus => {
                const duration = bonus.days ? `(${bonus.days} ${s.days(bonus.days)})` : `(${bonus.quantity} ${s.units(bonus.quantity)})`;
                texts.push(`- ${user.GetItemSkin(bonus.item)} **${bonus.item.Description[language]}** ${duration}`);
            });
        }
        container
            .addTexts(texts)
            .addFooter({
            text: `${(0, ui_1.formatMoney)(user.Money, language)} • ${s.footer(user.Daily.MaxStreak)}`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        descriptionReceived: (userLastDaily) => `You already receive his daily money in the last 24 hours.\n-# Will be able to receive again ${userLastDaily}!`,
        description: (money, currentStreak) => `You received ${(0, ui_1.formatMoney)(money, Language_1.Language.English)}.\n-# Your current daily streak is **${currentStreak}**.`,
        footer: (maxStreak) => `Max daily streak: ${maxStreak}`,
        bonusTitle: "Bonus items received!",
        days: (quantity) => quantity == 1 ? "day" : "days",
        units: (quantity) => quantity == 1 ? "unit" : "units",
    },
    [Language_1.Language.Portuguese]: {
        descriptionReceived: (userLastDaily) => `Você já recebeu sua grana diária nas últimas 24 horas.\n-# Poderá receber novamente ${userLastDaily}!`,
        description: (money, currentStreak) => `Você recebeu ${(0, ui_1.formatMoney)(money, Language_1.Language.Portuguese)}.\n-# Sua sequência de diários atual é **${currentStreak}**.`,
        footer: (maxStreak) => `Sequência máxima: ${maxStreak}`,
        bonusTitle: "Itens bônus recebidos!",
        days: (quantity) => quantity == 1 ? "dia" : "dias",
        units: (quantity) => quantity == 1 ? "unidade" : "unidades",
    },
    [Language_1.Language.Spanish]: {
        descriptionReceived: (userLastDaily) => `Ya has recibido tu dinero diario en las últimas 24 horas.\n-# Podrá recibirla nuevamente ${userLastDaily}!`,
        description: (money, currentStreak) => `Usted recibió ${(0, ui_1.formatMoney)(money, Language_1.Language.Spanish)}.\n-# Tu racha diaria actual es **${currentStreak}**.`,
        footer: (maxStreak) => `Racha máxima: ${maxStreak}`,
        bonusTitle: "¡Artículos de bono recibidos!",
        days: (quantity) => quantity == 1 ? "día" : "días",
        units: (quantity) => quantity == 1 ? "unidad" : "unidades",
    },
};
//# sourceMappingURL=daily.js.map