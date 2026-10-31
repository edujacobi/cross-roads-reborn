"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const badges_1 = require("#bot/utils/badges");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Hospital_1 = require("#core/models/Hospital");
const Language_1 = require("#core/models/Language");
const Pagination_1 = require("#core/models/Pagination");
const Classes_1 = require("#core/types/Classes");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("hospital")
        .setDescription("Visit the hospital and meet the sick, broken and bedridden")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "hospital")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "hospital")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Visite o hospital e conheça os doentes, os quebrados e os acamados")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Visita el hospital y conoce a los enfermos, los rotos y los encamados"),
    async execute(interaction, user) {
        const hospital = new Hospital_1.Hospital(user);
        let container = new CustomContainerBuilder_1.CustomContainerBuilder();
        const addContainerHeader = () => {
            const s = Strings[user.Language];
            container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Hospital)
                .addSectionComponents(header => header
                .addTexts([
                `# Hospital`,
                s.subtitle,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/1233604589064818808/1460599175900168388/Hospital_New.png")))
                .addLargeSeparator();
        };
        const generateContainer = async () => {
            const s = Strings[user.Language];
            let text = `${s.userFree}`;
            if (user.IsInHospital()) {
                text = s.userInHospital(user.Hospital.Time);
            }
            const hospitalized = await hospital.GetHospitalized();
            const buttonHospitalized = new discord_js_1.ButtonBuilder()
                .setCustomId("hospitalized")
                .setLabel(s.hospitalized)
                .setDisabled(hospitalized.length === 0)
                .setStyle(discord_js_1.ButtonStyle.Secondary);
            const buttonPrivate = new discord_js_1.ButtonBuilder()
                .setCustomId("private")
                .setLabel(s.payPrivateCare)
                .setEmoji(badges_1.EmoteBadgeString.Season6.Hypochondriac)
                .setDisabled(!user.IsInHospital())
                .setStyle(discord_js_1.ButtonStyle.Secondary);
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
                .setButtonAccessory(buttonPrivate))
                .addLargeSeparator()
                .addTexts([
                `-# ${text}`,
            ])
                .addFooter({
                text: (0, ui_1.formatMoney)(user.Money, user.Language),
                button: buttonHospitalized,
            });
            const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            const collector = (0, collectors_1.createButtonCollector)(interaction, response);
            collector?.on("end", async () => {
                await (0, collectors_1.disableButtons)(interaction, container);
            });
            let isProcessing = false;
            collector?.on("collect", async (btn) => {
                if (isProcessing)
                    return;
                isProcessing = true;
                try {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    if (btn.customId === "hospitalized") {
                        buttonHospitalized.setDisabled(true);
                        const pagination = new Pagination_1.Pagination(interaction, user.Language);
                        pagination.HowManyRecords = hospitalized.length;
                        pagination.Limit = 10;
                        const containerHospitalized = new CustomContainerBuilder_1.CustomContainerBuilder()
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
                                    `### ${Classes_1.ClassList[u.class].Image.Emote.String} ${u.nickname}`,
                                    `${s.healed} ${(0, discord_js_1.time)(u.hospitalTime, discord_js_1.TimestampStyles.RelativeTime)} • ${s.howManyTimes(u.hospitalCount)}`,
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
                            if (reason === Hospital_1.HospitalFailureReason.UserFree) {
                                message = s.userFree;
                            }
                            else if (reason === Hospital_1.HospitalFailureReason.NextInLine) {
                                message = s.nextInLine;
                            }
                            else if (reason === Hospital_1.HospitalFailureReason.WithoutMoney) {
                                message = s.withoutMoney(hospital.PrivatePrice);
                            }
                            container = (0, ui_1.defaultComponent)({
                                user: user,
                                color: colors_1.CrColors.Hospital,
                                description: `${message} ${emotes_1.EmoteString.Hospital}`,
                                footer: (0, ui_1.formatMoney)(user.Money, user.Language),
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        addContainerHeader();
                        container
                            .addTexts([
                            `### ${badges_1.EmoteBadgeString.Season6.Hypochondriac} ${s.privateCare}`,
                            `${s.treatmentCost(hospital.PrivatePrice)}`,
                            `-# ${s.confirmPayment}`,
                        ])
                            .addButtonRow(btn => btn
                            .setCustomId("confirm")
                            .setLabel(s.confirm)
                            .setStyle(discord_js_1.ButtonStyle.Success))
                            .addFooter({
                            text: (0, ui_1.formatMoney)(user.Money, user.Language),
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    else if (btn.customId === "confirm") {
                        await user.GetInfo();
                        const { canPay, reason } = await hospital.CanPayPrivate();
                        if (!canPay) {
                            let message = "";
                            if (reason === Hospital_1.HospitalFailureReason.UserFree) {
                                message = s.userFree;
                            }
                            else if (reason === Hospital_1.HospitalFailureReason.NextInLine) {
                                message = s.nextInLine;
                            }
                            else if (reason === Hospital_1.HospitalFailureReason.WithoutMoney) {
                                message = s.withoutMoney(hospital.PrivatePrice);
                            }
                            container = (0, ui_1.defaultComponent)({
                                user: user,
                                color: colors_1.CrColors.Hospital,
                                description: `${message} ${emotes_1.EmoteString.Hospital}`,
                                footer: (0, ui_1.formatMoney)(user.Money, user.Language),
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        await hospital.PayPrivate();
                        addContainerHeader();
                        container
                            .addTexts([
                            `### ${badges_1.EmoteBadgeString.Season6.Hypochondriac} ${s.privateCare}`,
                            `${s.privateHealed}`,
                        ])
                            .addFooter({
                            text: (0, ui_1.formatMoney)(user.Money, user.Language),
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                }
                finally {
                    isProcessing = false;
                }
            });
        };
        await generateContainer();
    },
};
const Strings = {
    [Language_1.Language.English]: {
        userFree: "You are not hospitalized! Want a little injection?",
        userInHospital: (date) => `You are hospitalized! You will be treated ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        subtitle: `_Public, Free and Quality!_\n\n-# Hospitalized users have ${emotes_1.EmoteString.Defense}-5 DEF and ${emotes_1.EmoteString.Defense}-5% $DEF!.`,
        descriptionPublic: `### Public service\nUnfortunately we have no more free beds, so you will have to wait in the hallway until you are seen.`,
        descriptionPrivate: `### ${badges_1.EmoteBadgeString.Season6.Hypochondriac} Private care\nIf you pay a certain amount, we will be able to treat you faster!`,
        hospitalized: "Hospitalized",
        healed: "Healed",
        privateCare: "Private care",
        payPrivateCare: `Pay private care`,
        treatmentCost: (price) => `Your treatment will cost **${(0, ui_1.formatMoney)(price, Language_1.Language.English)}**.`,
        confirmPayment: "Confirm payment?",
        confirm: "Confirm",
        privateHealed: "You are healed!",
        nextInLine: "You are next in line, wait your turn.\n-# A little sting doesn't hurt.",
        withoutMoney: (money) => `You don't have enough money! You need ${(0, ui_1.formatMoney)(money, Language_1.Language.English)} for private care!`,
        howManyTimes: (times) => `Hospitalized \`${times}\` times`,
    },
    [Language_1.Language.Portuguese]: {
        userFree: "Você não está hospitalizado! Quer uma injeçãozinha?",
        userInHospital: (date) => `Você está hospitalizado! Será atendido ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        subtitle: `_Público, Gratuito e de Qualidade!_\n\n-#	Usuários hospitalizados possuem ${emotes_1.EmoteString.Defense}-5 DEF e ${emotes_1.EmoteString.Defense}-5% $DEF!.`,
        descriptionPublic: `###	Serviço público\nInfelizmente não temos mais leitos livres, então você precisará esperar no corredor até ser atendido.`,
        descriptionPrivate: `### ${badges_1.EmoteBadgeString.Season6.Hypochondriac} Atendimento particular\nCaso você pague uma certa quantia, poderemos tratá-lo mais rapidamente!`,
        hospitalized: "Hospitalizados",
        healed: "Curado",
        privateCare: "Atendimento particular",
        payPrivateCare: `Pagar particular`,
        treatmentCost: (price) => `Seu tratamento custará **${(0, ui_1.formatMoney)(price, Language_1.Language.Portuguese)}**.`,
        confirmPayment: "Confirmar pagamento?",
        confirm: "Confirmar",
        privateHealed: "Você está curado!",
        nextInLine: `Você é o próximo da fila, aguarde sua vez.\n-# Uma picadinha não dói.`,
        withoutMoney: (money) => `Você não tem dinheiro suficiente! Você precisa de ${(0, ui_1.formatMoney)(money, Language_1.Language.Portuguese)} para atendimento particular!`,
        howManyTimes: (times) => `Hospitalizado \`${times}\` vezes`,
    },
    [Language_1.Language.Spanish]: {
        userFree: "No estás hospitalizado! ¿Quieres una pequeña inyección?",
        userInHospital: (date) => `¡Estás hospitalizado! ¡Se servirá ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        subtitle: `_¡Público, gratuito y de calidad!_\n\n-# Los usuarios hospitalizados tienen ${emotes_1.EmoteString.Defense}-5 DEF y ${emotes_1.EmoteString.Defense}-5% $DEF!.`,
        descriptionPublic: `### Servicio público\nLamentablemente, no tenemos más camas libres, por lo que deberá esperar en el pasillo hasta que le atiendan.`,
        descriptionPrivate: `### ${badges_1.EmoteBadgeString.Season6.Hypochondriac} Atención privada\n¡Si pagas una cierta cantidad, podemos atenderte más rápido!`,
        hospitalized: "Hospitalizados",
        healed: "Curado",
        privateCare: "Atención privada",
        payPrivateCare: `Pagar atención privada`,
        treatmentCost: (price) => `Tu tratamiento costará **${(0, ui_1.formatMoney)(price, Language_1.Language.Spanish)}**.`,
        confirmPayment: "¿Confirmar pago?",
        confirm: "Confirmar",
        privateHealed: "¡Estás curado!",
        nextInLine: "Eres el siguiente en la fila, espera tu turno.\n-# Una picadura no duele.",
        withoutMoney: (money) => `¡No tienes suficiente dinero! ¡Necesitas ${(0, ui_1.formatMoney)(money, Language_1.Language.Spanish)} para la atención privada!`,
        howManyTimes: (times) => `Hospitalizado \`${times}\` veces`,
    },
};
//# sourceMappingURL=hospital.js.map