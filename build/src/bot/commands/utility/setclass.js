"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const badges_1 = require("#bot/utils/badges");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setclass")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "mudaclasse")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "clase")
        .setDescription("Set a class for you")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Muda a sua classe")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Elige una clase para ti"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const availableClasses = [
            Classes_1.ClassList[Classes_1.ClassId.Attorney],
            Classes_1.ClassList[Classes_1.ClassId.Entrepreneur],
            Classes_1.ClassList[Classes_1.ClassId.Hobo],
            Classes_1.ClassList[Classes_1.ClassId.Thief],
        ];
        function getModifierText(modifier) {
            const text = [];
            const getMultiplicative = (value) => Math.round(value * 100) - 100;
            if (!modifier) {
                return s.noModifier;
            }
            // POSITIVE
            if (modifier.Casino?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${getMultiplicative(modifier.Casino?.Positive)}%\` ${s.casinoModifier}`);
            }
            if (modifier.Job?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${getMultiplicative(modifier.Job?.Positive)}%\` ${s.jobModifier}`);
            }
            if (modifier.InvestmentYield?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${getMultiplicative(modifier.InvestmentYield?.Positive)}%\` ${s.investmentYieldModifier}`);
            }
            if (modifier.Robbery?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${getMultiplicative(modifier.Robbery?.Positive)}%\` ${s.robberyModifier}`);
            }
            if (modifier.ScavengeDuration?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${getMultiplicative(modifier.ScavengeDuration?.Positive)}%\` ${s.scavengeDurationModifier}`);
            }
            if (modifier.PrisonBribe?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${modifier.PrisonBribe?.Positive}%\` ${s.prisonBribeModifier}`);
            }
            if (modifier.PrisonEscape?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${modifier.PrisonEscape?.Positive}%\` ${s.prisonEscapeModifier}`);
            }
            if (modifier.ScavengeChance?.Positive) {
                text.push(`${emotes_1.EmoteString.Victory} \`+${modifier.ScavengeChance?.Positive}%\` ${s.scavengeChanceModifier}`);
            }
            // NEGATIVE
            if (modifier.Casino?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${getMultiplicative(modifier.Casino?.Negative)}%\` ${s.casinoModifier}`);
            }
            if (modifier.Job?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${getMultiplicative(modifier.Job?.Negative)}%\` ${s.jobModifier}`);
            }
            if (modifier.InvestmentYield?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${getMultiplicative(modifier.InvestmentYield?.Negative)}%\` ${s.investmentYieldModifier}`);
            }
            if (modifier.Robbery?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${getMultiplicative(modifier.Robbery?.Negative)}%\` ${s.robberyModifier}`);
            }
            if (modifier.ScavengeDuration?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${getMultiplicative(modifier.ScavengeDuration?.Negative)}%\` ${s.scavengeDurationModifier}`);
            }
            if (modifier.PrisonBribe?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${modifier.PrisonBribe?.Negative}%\` ${s.prisonBribeModifier}`);
            }
            if (modifier.PrisonEscape?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${modifier.PrisonEscape?.Negative}%\` ${s.prisonEscapeModifier}`);
            }
            if (modifier.ScavengeChance?.Negative) {
                text.push(`${emotes_1.EmoteString.Defeat} \`${modifier.ScavengeChance?.Negative}%\` ${s.scavengeChanceModifier}`);
            }
            return text.join("\n");
        }
        function getClassDataText(classData) {
            return [
                `### ${classData.Image.Emote.String} ${classData.Name[language]}`,
                `-# _${classData.Description[language]}_`,
                ``,
                `${getModifierText(classData.Modifier)}`,
            ].join("\n");
        }
        function addContainerHeader() {
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Default)
                .addTexts([
                `# ${s.title}`,
                s.description,
            ])
                .addLargeSeparator();
        }
        function addContainerBody(container) {
            for (let i = 0; i < availableClasses.length; i++) {
                const classData = availableClasses[i];
                container.addSectionComponents(section => section
                    .addTexts([
                    getClassDataText(classData),
                ])
                    .setButtonAccessory(new discord_js_1.ButtonBuilder()
                    .setLabel(s.select)
                    .setDisabled(classData.Id === user.Class)
                    .setCustomId(`class${classData.Id}`)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)));
                if (i !== availableClasses.length - 1) {
                    container.addLargeSeparator();
                }
            }
            container.addFooter({
                text: (0, ui_1.formatMoney)(user.Money, user.Language),
            });
            return container;
        }
        let container = addContainerHeader();
        container = addContainerBody(container);
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === "back") {
                let container = addContainerHeader();
                container = addContainerBody(container);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("class")) {
                const classId = Number(btn.customId.replace("class", ""));
                const classData = Classes_1.ClassList[classId];
                await user.GetInfo();
                const oldClass = user.Class;
                if (oldClass === classId) {
                    return (0, collectors_1.disableButtons)(interaction, container);
                }
                const hasClass = user.Class !== Classes_1.ClassId.None;
                container = addContainerHeader()
                    .addTexts([
                    getClassDataText(classData),
                ])
                    .addLargeSeparator()
                    .addTexts([
                    hasClass ? s.costToChange(user.GetClassChangeCost()) : s.firstFree,
                ])
                    .addButtonRow(btn => btn
                    .setCustomId("back")
                    .setLabel(s.back)
                    .setStyle(discord_js_1.ButtonStyle.Secondary), btn => btn
                    .setCustomId(`confirm${classId}`)
                    .setDisabled(user.Money < user.GetClassChangeCost())
                    .setLabel(hasClass ? (0, ui_1.formatMoney)(user.GetClassChangeCost(), language) : s.confirm)
                    .setStyle(discord_js_1.ButtonStyle.Success))
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("confirm")) {
                const newClass = Number(btn.customId.replace("confirm", ""));
                await user.GetInfo();
                const oldClass = user.Class;
                if (oldClass === newClass) {
                    return (0, collectors_1.disableButtons)(interaction, container);
                }
                const currentCost = user.GetClassChangeCost();
                const success = await user.SetClass(newClass, currentCost || undefined);
                container = addContainerHeader()
                    .addTexts([
                    success ? s.classChanged(oldClass, newClass) : s.errorChange,
                ])
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Classes",
        description: "The roads of Cross City offer diverse opportunities for its residents, but if you want to stand out here, you'll need to choose one of the following careers!",
        noModifier: "No modifiers",
        casinoModifier: `winnings from gambling at the casino ${emotes_1.EmoteString.Casino}`,
        jobModifier: `earnings received from jobs ${emotes_1.EmoteString.Jobs}`,
        investmentYieldModifier: `profit from investments ${emotes_1.EmoteString.InvestmentActive}`,
        robberyModifier: `stolen from users and locations ${emotes_1.EmoteString.Robbery}`,
        scavengeDurationModifier: `money and duration of items found by scavenging ${emotes_1.EmoteString.Scavenge}`,
        prisonBribeModifier: `chance of the bribe being accepted ${badges_1.EmoteBadgeString.Season6.Politician}`,
        prisonEscapeModifier: `chance of escaping from prison ${emotes_1.EmoteString.Escape}`,
        scavengeChanceModifier: `chance of finding items by scavenging ${emotes_1.EmoteString.Scavenge}`,
        select: "Select",
        back: "Back",
        firstFree: "The first time you choose a class it's free, but subsequent changes will have a cost.",
        costToChange: (cost) => `The cost for you to change your class is ${(0, ui_1.formatMoney)(cost, Language_1.Language.English)}.\n-# Confirm the change?`,
        confirm: "Confirm",
        setting: "Setting class",
        classChanged: (oldClass, newClass) => `You now have the class ${Classes_1.ClassList[oldClass].Image.Emote.String} → ${Classes_1.ClassList[newClass].Image.Emote.String} **${Classes_1.ClassList[newClass].Name[Language_1.Language.English]}**!`,
        errorChange: "You don't have enough money to change your class.",
    },
    [Language_1.Language.Portuguese]: {
        title: "Classes",
        description: "As Ruas de Cidade da Cruz oferecem diversas oportunidades para seus residentes, mas se você quer ser alguém aqui, precisará escolher uma das seguintes carreiras!",
        noModifier: "Sem modificadores",
        casinoModifier: `ganhos em apostas no cassino ${emotes_1.EmoteString.Casino}`,
        jobModifier: `recebidos de trabalhos ${emotes_1.EmoteString.Jobs}`,
        investmentYieldModifier: `lucro de investimentos ${emotes_1.EmoteString.InvestmentActive}`,
        robberyModifier: `roubados de usuários e locais ${emotes_1.EmoteString.Robbery}`,
        scavengeDurationModifier: `grana e duração de itens encontrados vasculhando ${emotes_1.EmoteString.Scavenge}`,
        prisonBribeModifier: `chance do suborno ser aceito ${badges_1.EmoteBadgeString.Season6.Politician}`,
        prisonEscapeModifier: `chance de fugir da prisão ${emotes_1.EmoteString.Escape}`,
        scavengeChanceModifier: `chance de encontrar vasculhando ${emotes_1.EmoteString.Scavenge}`,
        select: "Selecionar",
        back: "Voltar",
        firstFree: "A primeira vez que você escolhe uma classe é de graça, mas as próximas trocas terão um custo.",
        costToChange: (cost) => `O custo para você alterar sua classe é ${(0, ui_1.formatMoney)(cost, Language_1.Language.Portuguese)}.\n-# Confirmar troca?`,
        confirm: "Confirmar",
        setting: "Configurando classe",
        classChanged: (oldClass, newClass) => `Agora você possui a classe ${Classes_1.ClassList[oldClass].Image.Emote.String} → ${Classes_1.ClassList[newClass].Image.Emote.String} **${Classes_1.ClassList[newClass].Name[Language_1.Language.Portuguese]}**!`,
        errorChange: "Você não possui dinheiro suficiente para alterar sua classe.",
    },
    [Language_1.Language.Spanish]: {
        title: "Clases",
        description: "Las calles de Ciudad de la Cruz ofrecen diversas oportunidades para sus residentes, pero si quieres destacar aquí, ¡necesitarás elegir una de las siguientes carreras!",
        noModifier: "Sin modificadores",
        casinoModifier: `ganancias por jugar en el casino ${emotes_1.EmoteString.Casino}`,
        jobModifier: `ganancias recibidas de trabajos ${emotes_1.EmoteString.Jobs}`,
        investmentYieldModifier: `lucro de inversiones ${emotes_1.EmoteString.InvestmentActive}`,
        robberyModifier: `robado de usuarios y ubicaciones ${emotes_1.EmoteString.Robbery}`,
        scavengeDurationModifier: `dinero y duración de los objetos encontrados al buscar en la cárcel ${emotes_1.EmoteString.Scavenge}`,
        prisonBribeModifier: `probabilidad de aceptar el soborno ${badges_1.EmoteBadgeString.Season6.Politician}`,
        prisonEscapeModifier: `probabilidad de escapar de la cárcel ${emotes_1.EmoteString.Escape}`,
        scavengeChanceModifier: `probabilidad de encontrar objetos al buscar en la cárcel ${emotes_1.EmoteString.Scavenge}`,
        select: "Seleccionar",
        back: "Volver",
        firstFree: "La primera vez que eliges una clase es gratis, pero los cambios subsiguientes tendrán un costo.",
        costToChange: (cost) => `El costo para que usted cambie su clase es ${(0, ui_1.formatMoney)(cost, Language_1.Language.Spanish)}.\n-# ¿Confirmar el cambio?`,
        confirm: "Confirmar",
        setting: "Configurando clase",
        classChanged: (oldClass, newClass) => `Ahora tienes la clase ${Classes_1.ClassList[oldClass].Image.Emote.String} → ${Classes_1.ClassList[newClass].Image.Emote.String} **${Classes_1.ClassList[newClass].Name[Language_1.Language.Spanish]}**!`,
        errorChange: "No tienes suficiente dinero para cambiar de clase.",
    },
};
//# sourceMappingURL=setclass.js.map