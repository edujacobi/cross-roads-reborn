"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const Notification_1 = require("#core/models/Notification");
const log_1 = require("#shared/log");
const utils_1 = require("#shared/utils");
const date_fns_1 = require("date-fns");
const Drinks_1 = require("#core/types/Drinks");
const discord_js_1 = require("discord.js");
const drinkCountMessageLanguages = {
    [Language_1.Language.English]: "English",
    [Language_1.Language.Portuguese]: "Portuguese",
    [Language_1.Language.Spanish]: "Spanish",
};
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("drink")
        .setDescription("Drinks a refreshing beverage!")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "beber")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "beber")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Bebe uma refrescante bebida!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Bebe una bebida refrescante!"),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const s = Strings[language];
        const isHappyHour = (0, Drinks_1.isHappyHour)();
        const cantDrink = user.IsInPrison() || user.IsInHospital() || user.IsWorking() || user.IsInBeatUp() || user.IsInRobbery() || user.IsInCasinoGame();
        const channelName = interaction.guild?.name || s.fishcutterSt;
        const adjectives = {
            [Language_1.Language.Portuguese]: ["campeão", "guerreiro", "meu bruxo", "meu amigo", "meu chapa", "cliente", "comparsa", "parceiro", "meu cupinxa"],
            [Language_1.Language.English]: ["champion", "warrior", "my wizard", "my friend", "my pal", "customer", "accomplice", "partner", "my buddy"],
            [Language_1.Language.Spanish]: ["campeón", "guerrero", "mi brujo", "mi amigo", "mi colega", "cliente", "cómplice", "socio", "mi compañero"],
        };
        const chosenAdjective = (0, utils_1.getRandomItemFromArray)(adjectives[language]);
        const drinkButton = new discord_js_1.ButtonBuilder()
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setLabel(`${s.drink}!`)
            .setDisabled(cantDrink)
            .setCustomId("drink");
        function getButtonLabel(currentLabel) {
            if (currentLabel === `${s.drink}!`) {
                return `${s.drinkMore}!`;
            }
            if (currentLabel.length < 32) {
                return currentLabel + "!";
            }
            return currentLabel;
        }
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Bar)
            .addTexts([
            isHappyHour ? `-# ${s.happyHour}` : `-# Happy Hour ${s.happyHourPeriods}`,
        ])
            .addSmallSeparator()
            .addTexts([
            `# ${emotes_1.EmoteString.Idle} ${s.barOf} ${channelName}`,
            s.barmanDescription(chosenAdjective),
        ])
            .addLargeSeparator(false)
            .addTexts([
            `-# ${s.drankNothing}`,
        ], 1)
            .addFooter({
            button: drinkButton,
        });
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        let count = 1;
        const anotherAdjective = (0, utils_1.getRandomItemFromArray)(adjectives[language]);
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === "drink") {
                await user.GetInfo();
                const cantDrink = user.IsInPrison() || user.IsInHospital() || user.IsWorking() || user.IsInBeatUp() || user.IsInRobbery() || user.IsInCasinoGame();
                if (cantDrink) {
                    drinkButton.setDisabled(true);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                const beverages = {
                    [Language_1.Language.Portuguese]: [
                        "whisky", "vodka", "vinho", "gin", "tônica", "amarula", "caipirinha", "cerveja", "sakê",
                        "cachaça", "água da torneira", "rum", "caipiroska", "sidra", "cerveja", "catuaba", "corote",
                        "champanha", "licor", "água sanitária", "cerveja", "tequila", "tubaína", "água do miojo",
                        "absinto", "Jägermeister", "cerveja", "gasolina", "cerveja artesanal", "Red Ale",
                        "American Pale Ale", "Belgian Wheat Ale", "cerveja",
                    ],
                    [Language_1.Language.English]: [
                        "whiskey", "vodka", "wine", "gin", "tonic", "amarula", "caipirinha", "beer", "sake",
                        "cachaça", "tap water", "rum", "caipiroska", "cider", "beer", "catuaba", "corote", "champagne",
                        "liqueur", "bleach", "beer", "tequila", "tubaína", "noodle water", "absinthe", "Jägermeister",
                        "beer", "gasoline", "craft beer", "Red Ale", "American Pale Ale", "Belgian Wheat Ale", "beer",
                    ],
                    [Language_1.Language.Spanish]: [
                        "whisky", "vodka", "vino", "ginebra", "tónica", "amarula", "caipirinha", "cerveza", "sake",
                        "cachaça", "agua del grifo", "ron", "caipiroska", "sidra", "cerveza", "catuaba", "corote",
                        "champán", "licor", "lejía", "cerveza", "tequila", "tubaína", "agua de fideos", "absenta",
                        "Jägermeister", "cerveza", "gasolina", "cerveza artesanal", "Red Ale", "American Pale Ale",
                        "Belgian Wheat Ale", "cerveza",
                    ],
                };
                const sensations = {
                    [Language_1.Language.Portuguese]: [
                        "forte", "vigoroso", "potente", "poderoso", "ativo", "dinâmico", "robusto", "másculo",
                        "viril", "masculino", "firme", "decidido", "resoluto", "enfático", "veemente", "expressivo",
                        "drástico", "radical", "vivo", "vivaz", "incansável", "incisivo", "caloroso", "agradável",
                        "jovial", "álacre", "animado", "animoso", "aprazerado", "bem-disposto", "bem-humorado",
                        "contente", "divertido", "exultante", "feliz", "festejador", "festivo", "folgazão", "foliador",
                        "fortunoso", "galhardo", "jubiloso", "jucundo", "ledo", "lépido", "prazenteiro", "radiante",
                        "risonho", "satisfeito", "sorridente", "abatido", "apático", "indiferente", "desinteressado",
                        "desempolgado", "parado", "caído", "cabisbaixo", "prostrado", "desencorajado", "desestimulado",
                        "desalentado", "desapontado", "desiludido", "deprimido", "triste", "esmorecido", "entorpecido",
                        "sucumbido", "desacoroçoado", "descorçoado", "derrotado", "feminino",
                    ],
                    [Language_1.Language.English]: [
                        "strong", "vigorous", "potent", "powerful", "active", "dynamic", "robust", "masculine",
                        "virile", "manly", "firm", "decided", "resolute", "emphatic", "vehement", "expressive",
                        "drastic", "radical", "lively", "vivacious", "tireless", "incisive", "warm", "pleasant",
                        "jovial", "cheerful", "animated", "spirited", "pleased", "well-disposed", "good-humored",
                        "content", "amused", "exultant", "happy", "celebratory", "festive", "jolly", "reveler",
                        "fortunate", "gallant", "jubilant", "joyful", "glad", "nimble", "pleasant", "radiant",
                        "smiling", "satisfied", "grinning", "downcast", "apathetic", "indifferent", "uninterested",
                        "unenthusiastic", "still", "fallen", "crestfallen", "prostrate", "discouraged", "demotivated",
                        "disheartened", "disappointed", "disillusioned", "depressed", "sad", "faint-hearted", "numbed",
                        "succumbed", "discouraged", "dispirited", "defeated", "feminine",
                    ],
                    [Language_1.Language.Spanish]: [
                        "fuerte", "vigoroso", "potente", "poderoso", "activo", "dinámico", "robusto", "masculino",
                        "viril", "varonil", "firme", "decidido", "resuelto", "enfático", "vehemente", "expresivo",
                        "drástico", "radical", "vivo", "vivaz", "incansable", "incisivo", "cálido", "agradable",
                        "jovial", "alegre", "animado", "animoso", "complacido", "bien dispuesto", "de buen humor",
                        "contento", "divertido", "exultante", "feliz", "festejador", "festivo", "juguetón", "juerguista",
                        "afortunado", "galante", "jubiloso", "jocoso", "alegre", "ágil", "placentero", "radiante",
                        "sonriente", "satisfecho", "sonriente", "abatido", "apático", "indiferente", "desinteresado",
                        "desanimado", "parado", "caído", "cabizbajo", "postrado", "desalentado", "desestimulado",
                        "descorazonado", "decepcionado", "desilusionado", "deprimido", "triste", "desanimado",
                        "entumecido", "sucumbido", "desalentado", "descorazonado", "derrotado", "femenino",
                    ],
                };
                const chosenBeverage = (0, utils_1.getRandomItemFromArray)(beverages[user.Language]);
                const chosenSensation = (0, utils_1.getRandomItemFromArray)(sensations[user.Language]);
                const coma = {
                    chance: isHappyHour ? 15 : 5,
                    text: "",
                    inComa: false,
                };
                count += 1;
                if (Math.random() * 100 < coma.chance) {
                    const minutes = Math.floor(Math.random() * 5) + 1;
                    user.Hospital.Count += 1;
                    user.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), minutes);
                    user.Drink.DrunkCount += 1;
                    await Notification_1.Notification.Hospital(user);
                    if (isHappyHour) {
                        if (count > user.Drink.HappyHour) {
                            user.Drink.HappyHour = count;
                        }
                    }
                    else if (count > user.Drink.Normal) {
                        user.Drink.Normal = count;
                    }
                    await user.Update({
                        hospitalCount: user.Hospital.Count,
                        hospitalTime: user.Hospital.Time,
                        drunkCount: user.Drink.DrunkCount,
                        drinkNormal: user.Drink.Normal,
                        drinkHappyHour: user.Drink.HappyHour,
                    });
                    log_1.Log.Info(`${user.Nickname} (${user.Id}) drank too much and fell into an alcoholic coma. Will be hospitalized for ${minutes} minutes. Drank ${count} times.`);
                    coma.inComa = true;
                    coma.text = `\n${emotes_1.EmoteString.Hospital} ${s.toHospital(user.Hospital.Time)}`;
                }
                function getDrinkCountText(currentCount, lang, adj) {
                    const messages = (0, Drinks_1.getDrinkCountMessages)(currentCount, adj, drinkCountMessageLanguages[lang]);
                    return messages.length
                        ? `\n\n${messages.map((message) => `-# "${message}"`).join("\n")}\n`
                        : "";
                }
                const countText = getDrinkCountText(count, user.Language, anotherAdjective);
                const textComponent = container.components.find(component => component.data?.id === 1);
                if (textComponent && textComponent instanceof discord_js_1.TextDisplayBuilder) {
                    textComponent.setContent(`${s.youDrank(chosenBeverage, chosenSensation)}${countText}${coma.text}`);
                }
                container.changeFooterText(`${s.drinkCount} ${count - 1}`);
                if ("label" in drinkButton.data) {
                    drinkButton.setLabel(getButtonLabel(drinkButton.data.label));
                }
                if (coma.inComa) {
                    drinkButton
                        .setLabel(s.drankToMuch)
                        .setDisabled(true);
                    container.setAccentColor(colors_1.CrColors.Hospital);
                }
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        fishcutterSt: "Fishcutter Street",
        drink: "Drink",
        drinkMore: "Drink more",
        happyHour: "Happy Hour! Chance of getting drunk x3",
        happyHourPeriods: "from 9pm to 11pm",
        drankNothing: "You haven't drunk anything yet",
        barOf: "Bar of",
        barmanDescription: (adjective) => `Come on in, ${adjective}, would you like something to drink?`,
        toHospital: (timer) => `You drank too much and fell into an alcoholic coma.\n-# You will be healed ${(0, discord_js_1.time)(timer, discord_js_1.TimestampStyles.RelativeTime)}`,
        youDrank: (beverage, sensation) => `You drank **${beverage}** and feel **${sensation}**!`,
        drinkCount: "You drank",
        drankToMuch: "You drank too much.",
    },
    [Language_1.Language.Portuguese]: {
        fishcutterSt: "Rua da Peixeira",
        drink: "Beber",
        drinkMore: "Beber mais",
        happyHour: "Happy Hour! Chance de se embebedar x3",
        happyHourPeriods: "das 18h às 20h",
        drankNothing: "Você ainda não bebeu nada",
        barOf: "Bar de",
        barmanDescription: (adjective) => `Chega aí, ${adjective}, gostaria de beber alguma coisa?`,
        toHospital: (timer) => `Você bebeu demais e entrou em coma alcoólico.\n-# Será curado ${(0, discord_js_1.time)(timer, discord_js_1.TimestampStyles.RelativeTime)}`,
        youDrank: (beverage, sensation) => `Você bebeu **${beverage}** e se sente **${sensation}**!`,
        drinkCount: "Você bebeu",
        drankToMuch: "Você já bebeu demais.",
    },
    [Language_1.Language.Spanish]: {
        fishcutterSt: "Calle del Cortapescado",
        drink: "Beber",
        drinkMore: "Beber más",
        happyHour: "¡Happy Hour! Posibilidad de emborracharse x3",
        happyHourPeriods: "de 21h a 23h (UTC)",
        drankNothing: "Aún no has bebido nada",
        barOf: "Bar de",
        barmanDescription: (adjective) => `Pase, ${adjective}, ¿le gustaría beber algo?`,
        toHospital: (timer) => `Te emborrachaste y caíste en un coma alcohólico.\n-# Serás curado ${(0, discord_js_1.time)(timer, discord_js_1.TimestampStyles.RelativeTime)}`,
        youDrank: (beverage, sensation) => `¡Bebiste **${beverage}** y te sientes **${sensation}**!`,
        drinkCount: "Has bebido",
        drankToMuch: "Te emborrachaste.",
    },
};
//# sourceMappingURL=drink.js.map