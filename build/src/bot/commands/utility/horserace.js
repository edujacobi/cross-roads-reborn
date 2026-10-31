"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const HorseRacing_1 = require("#core/models/HorseRacing");
const Language_1 = require("#core/models/Language");
const Horses_1 = require("#core/types/Horses");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("horserace")
        .setDescription("Bet on horse races and win big with fixed-odds payouts")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "corridadecavalos")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "carreradecaballos")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Aposte em corridas de cavalos e ganhe muito com prêmios fixos")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Apuesta en carreras de caballos y gana mucho con pagos fijos")
        .addIntegerOption(option => option
        .setName("amount")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "valor")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "cantidad")
        .setDescription(`Bet amount (min: $${HorseRacing_1.HorseRacing.MIN_BET.toLocaleString()}, max: $${HorseRacing_1.HorseRacing.MAX_BET_CAP.toLocaleString()})`)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, `Valor da aposta (mín: $${HorseRacing_1.HorseRacing.MIN_BET.toLocaleString()}, máx: $${HorseRacing_1.HorseRacing.MAX_BET_CAP.toLocaleString()})`)
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, `Cantidad de apuesta (mín: $${HorseRacing_1.HorseRacing.MIN_BET.toLocaleString()}, máx: $${HorseRacing_1.HorseRacing.MAX_BET_CAP.toLocaleString()})`)
        .setMinValue(HorseRacing_1.HorseRacing.MIN_BET)
        .setRequired(false)),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const racing = new HorseRacing_1.HorseRacing(user);
        const amount = interaction.options.getInteger("amount");
        function getContainerHeader(raceInfo) {
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Casino)
                .addSectionComponents(section => section
                .addTexts([
                `# ${s.title}`,
                `-# ${s.subtitle}`,
                raceInfo ? s.nextRace(raceInfo.race.raceTime) : s.noRace
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/1233604589064818808/1499581098408280096/HorseRacing.png")));
        }
        /**
         * Builds the main info container for the horse race command (without amount param)
         * @param raceInfo the time of the next race
         * @returns the container component
         */
        function buildInfoContainer(raceInfo) {
            const container = getContainerHeader(raceInfo);
            if (!raceInfo) {
                return container.addFooter({ text: (0, ui_1.formatMoney)(user.Money, user.Language) });
            }
            const { race, userBet, isBettingOpen } = raceInfo;
            const horseLines = Horses_1.HorseList.map(horse => {
                const name = horse.Name[user.Language];
                return `${horse.Emote} **${name}** — ${horse.Multiplier}× ${s.payout}`;
            }).join("\n");
            let betStatus = s.noBet;
            if (userBet) {
                const horse = Horses_1.HorseList.find(x => x.Id === userBet.horseNumber);
                const name = horse.Name[user.Language];
                betStatus = `${horse.Emote} **${name}** — ${(0, ui_1.formatMoney)(userBet.amount, user.Language)}`;
            }
            const statusLine = !isBettingOpen
                ? s.bettingClosed
                : userBet ? s.alreadyBet : s.hint;
            return container
                .addLargeSeparator()
                .addTexts([
                `### ${s.horses}`,
                horseLines,
            ])
                .addLargeSeparator()
                .addTexts([
                `### ${s.raceStats}`,
                `${s.totalBets}: **${race.totalBets}**`,
                `${s.yourBet}: ${betStatus}`,
                `-# ${statusLine}`,
            ])
                .addFooter({ text: (0, ui_1.formatMoney)(user.Money, user.Language) });
        }
        /**
         * Builds the horse selection container (with amount param)
         * @param amount the amount the user is betting
         * @param raceInfo the race info
         * @returns the container component with horse selection buttons
         */
        function buildHorseSelectContainer(amount, raceInfo) {
            const container = getContainerHeader(raceInfo)
                .addLargeSeparator()
                .addTexts([
                `### ${s.horses}`,
                s.choosingHorse((0, ui_1.formatMoney)(amount, user.Language)),
            ])
                .addLargeSeparator();
            for (let i = 0; i < Horses_1.HorseList.length; i += 1) {
                const horse = Horses_1.HorseList[i];
                const horseName = horse.Name[user.Language];
                container
                    .addSectionComponents(section => section
                    .addTexts([
                    `### ${horse.Emote} ${horseName}\n${horse.Description[user.Language]}\n-# ${horse.Multiplier}× → **${(0, ui_1.formatMoney)(Math.floor(amount * horse.Multiplier), user.Language)}**`
                ])
                    .setButtonAccessory(new discord_js_1.ButtonBuilder()
                    .setCustomId(`horse_${horse.Id}`)
                    .setLabel(horseName)
                    .setEmoji(horse.Emote)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)));
                if (i + 1 < Horses_1.HorseList.length) {
                    container.addLargeSeparator();
                }
            }
            container.addFooter({ text: (0, ui_1.formatMoney)(user.Money, user.Language) });
            return container;
        }
        // No amount → show race info only
        if (amount === null) {
            let raceInfo = await racing.GetRaceInfo();
            // No race in DB — create one and retry
            if (!raceInfo) {
                await HorseRacing_1.HorseRacing.ScheduleNextRace();
                raceInfo = await racing.GetRaceInfo();
            }
            const container = buildInfoContainer(raceInfo);
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        // Amount provided → validate, then show horse-selection buttons
        await user.GetInfo();
        const maxBet = racing.CalculateMaxBet();
        function warn(message) {
            return (0, discordInteractions_1.replyWithContainer)(interaction, (0, ui_1.defaultComponent)({
                user,
                color: discord_js_1.Colors.Red,
                description: message,
            }));
        }
        if (amount < HorseRacing_1.HorseRacing.MIN_BET) {
            return warn(s.betTooLow((0, ui_1.formatMoney)(HorseRacing_1.HorseRacing.MIN_BET, language)));
        }
        if (amount > maxBet) {
            return warn(s.betTooHigh((0, ui_1.formatMoney)(maxBet, language)));
        }
        const raceInfo = await racing.GetRaceInfo();
        if (!raceInfo) {
            return warn(s.noRace);
        }
        if (raceInfo.userBet) {
            return warn(s.alreadyBet);
        }
        if (!raceInfo.isBettingOpen) {
            return warn(s.bettingClosed);
        }
        // Show horse-selection buttons
        let container = buildHorseSelectContainer(amount, raceInfo);
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response, { maxClicks: 1 });
        collector?.on("collect", async (btn) => {
            const horseId = parseInt(btn.customId.replace("horse_", ""));
            await user.GetInfo();
            const result = await racing.PlaceBet(raceInfo.race.id, horseId, amount);
            if (!result.Success) {
                switch (result.Reason) {
                    case HorseRacing_1.BetFailureReason.BetTooLow:
                        return warn(s.betTooLow((0, ui_1.formatMoney)(HorseRacing_1.HorseRacing.MIN_BET, language)));
                    case HorseRacing_1.BetFailureReason.BetTooHigh:
                        return warn(s.betTooHigh(result.Message));
                    case HorseRacing_1.BetFailureReason.AlreadyBet:
                        return warn(s.alreadyBet);
                    case HorseRacing_1.BetFailureReason.RaceClosed:
                        return warn(s.bettingClosed);
                    default:
                        return warn(result.Message);
                }
            }
            // Success — show confirmation
            const { Horse: horse, RaceTime: raceTime } = result;
            const horseName = horse.Name[language];
            const prize = (0, ui_1.formatMoney)(Math.floor(amount * horse.Multiplier), language);
            container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Casino)
                .addSectionComponents(section => section
                .addTexts([
                s.betPlaced(horse.Emote, horseName, (0, ui_1.formatMoney)(amount, language), prize, horse.Multiplier, raceTime)
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/1233604589064818808/1499581098408280096/HorseRacing.png")))
                .addFooter({ text: (0, ui_1.formatMoney)(user.Money, language) });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Horse Racing",
        subtitle: "Pick your winner! Rarer horses offer higher multipliers but are harder to win.",
        noRace: "No race is currently scheduled. Check back shortly!",
        horses: "Horses & Payouts",
        payout: "payout",
        raceStats: "Current race",
        nextRace: (date) => `Next race ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        totalBets: "Total bets",
        yourBet: "Your bet",
        noBet: "None",
        hint: "Provide an amount with `/horserace <amount>` to place your bet.",
        alreadyBet: "You have already placed a bet on this race.",
        bettingClosed: "**Betting is closed** — the race starts in less than 5 minutes!",
        choosingHorse: (amount) => `You are betting **${amount}**. Select your horse below:`,
        betTooLow: (min) => `Minimum bet is **${min}** ${emotes_1.EmoteString.Casino}`,
        betTooHigh: (max) => `Your bet exceeds the maximum of **${max}** ${emotes_1.EmoteString.Casino}`,
        betPlaced: (emoji, name, amount, prize, multiplier, raceTime) => `# Bet placed!\n### ${emoji} ${name} (${multiplier}×)\n\nYou bet **${amount}** and can win **${prize}**!\n-# Race starts ${(0, discord_js_1.time)(raceTime, discord_js_1.TimestampStyles.RelativeTime)}. You will receive a DM with the result.`,
    },
    [Language_1.Language.Portuguese]: {
        title: "Corrida de Cavalos",
        subtitle: "Escolha seu vencedor! Cavalos mais raros oferecem multiplicadores maiores, mas são mais difíceis de ganhar.",
        noRace: "Nenhuma corrida agendada no momento. Volte em breve!",
        horses: "Cavalos & Multiplicadores",
        payout: "de retorno",
        raceStats: "Corrida atual",
        nextRace: (date) => `Próxima corrida ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        totalBets: "Total de apostas",
        yourBet: "Sua aposta",
        noBet: "Nenhuma",
        hint: "Use `/corridadecavalos <valor>` para fazer sua aposta.",
        alreadyBet: "Você já fez uma aposta nesta corrida.",
        bettingClosed: "**Apostas encerradas** — a corrida começa em menos de 5 minutos!",
        choosingHorse: (amount) => `Você está apostando **${amount}**. Escolha seu cavalo abaixo:`,
        betTooLow: (min) => `A aposta mínima é **${min}** ${emotes_1.EmoteString.Casino}`,
        betTooHigh: (max) => `Sua aposta ultrapassa o máximo de **${max}** ${emotes_1.EmoteString.Casino}`,
        betPlaced: (emoji, name, amount, prize, multiplier, raceTime) => `# Aposta realizada!\n### ${emoji} ${name} (${multiplier}×)\n\nVocê apostou **${amount}** e pode ganhar **${prize}**!\n-# A corrida começa ${(0, discord_js_1.time)(raceTime, discord_js_1.TimestampStyles.RelativeTime)}. Você receberá um DM com o resultado.`,
    },
    [Language_1.Language.Spanish]: {
        title: "Carrera de Caballos",
        subtitle: "¡Elige a tu ganador! Los caballos más raros ofrecen multiplicadores más altos, pero son más difíciles de ganar.",
        noRace: "No hay ninguna carrera programada. ¡Vuelve pronto!",
        horses: "Caballos & Multiplicadores",
        payout: "de retorno",
        raceStats: "Carrera actual",
        nextRace: (date) => `Próxima carrera ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        totalBets: "Total de apuestas",
        yourBet: "Tu apuesta",
        noBet: "Ninguna",
        hint: "Usa `/carreradecaballos <cantidad>` para realizar tu apuesta.",
        alreadyBet: "Ya has realizado una apuesta en esta carrera.",
        bettingClosed: "**Apuestas cerradas** — ¡la carrera comienza en menos de 5 minutos!",
        choosingHorse: (amount) => `Estás apostando **${amount}**. Selecciona tu caballo a continuación:`,
        betTooLow: (min) => `La apuesta mínima es **${min}** ${emotes_1.EmoteString.Casino}`,
        betTooHigh: (max) => `Tu apuesta supera el máximo de **${max}** ${emotes_1.EmoteString.Casino}`,
        betPlaced: (emoji, name, amount, prize, multiplier, raceTime) => `# ¡Apuesta realizada!\n###${emoji} ${name} (${multiplier}×)\n\n¡Apostaste **${amount}** y puedes ganar **${prize}**!\n-# La carrera comienza ${(0, discord_js_1.time)(raceTime, discord_js_1.TimestampStyles.RelativeTime)}. Recibirás un DM con el resultado.`,
    },
};
//# sourceMappingURL=horserace.js.map