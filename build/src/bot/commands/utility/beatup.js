"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const colors_1 = require("#bot/utils/colors");
const Language_1 = require("#core/models/Language");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const userUtils_1 = require("#bot/utils/userUtils");
const beatupHelper_1 = require("#bot/utils/beatupHelper");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("beatup")
        .setDescription("Beat a user and let it in Hospital")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "espancar")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "golpiza")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Espanque um usuário e deixe-o no Hospital")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Darle una paliza a un usuario y dejarlo en el Hospital")
        .addStringOption(target => target
        .setName("target")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "objetivo")
        .setDescription("The user to beat up")
        .setMinLength(3)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário para espancar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El usuario para golpear")),
    async execute(interaction, user, language) {
        const nameOrId = interaction.options.getString("target");
        await (0, discordInteractions_1.deferReply)(interaction);
        const target = nameOrId ? await (0, userUtils_1.searchUser)(nameOrId, interaction, language) : null;
        const s = Strings[language];
        let text = `${s.userFree}`;
        if (user.IsScavenging()) {
            text = s.userScavenging;
        }
        if (user.BeatUp.Time > new Date()) {
            text = s.userBeatWait(user.BeatUp.Time);
        }
        if (user.IsWorking()) {
            text = s.userWorking;
        }
        if (user.IsWanted()) {
            text = s.userEscaping(user.Wanted.Time);
        }
        if (user.IsInPrison()) {
            text = s.userPrison(user.Prison.Time);
        }
        if (user.IsInHospital()) {
            text = s.userHospital(user.Hospital.Time);
        }
        if (user.IsInCasinoGame()) {
            text = s.userCasino;
        }
        if (!nameOrId) {
            const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.BeatUp)
                .addSectionComponents(section => section
                .addTexts([
                s.description,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://cdn.discordapp.com/attachments/691019843159326757/820064474995621938/Espancar_20210312194139.png")))
                .addLargeSeparator()
                .addTexts([
                `-# ${text}`,
            ])
                .addFooter({
                text: user.Situation.Simple,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        if (!target) {
            return;
        }
        await (0, beatupHelper_1.runUserBeatUp)(interaction, user, target);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        userFree: "You can beat up!",
        userBeatWait: (beatTime) => `You will be able to beat up again ${(0, discord_js_1.time)(beatTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        userScavenging: `You can't beat up while scavenging! ${emotes_1.EmoteString.Scavenge}`,
        userWorking: `You can't beat up while working! ${emotes_1.EmoteString.Jobs}`,
        userEscaping: (timerEscape) => `You can't beat up while being wanted by the police! You can beat up again ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `You can't beat up while in prison! You will be released ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `You can't beat up while in hospital! You will be healed ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        userCasino: `You can't beat up while playing in casino! ${emotes_1.EmoteString.Casino}`,
        description: `# Beat Up
### Defeat your nemesis and show who's boss!
The loser of the fight will be hospitalized for a time determined by the defender player's ${emotes_1.EmoteString.Attack}ATK.
To beat up, the target must be ${emotes_1.EmoteString.Idle} **Idling**.
-# If you are ${emotes_1.EmoteString.Prison} Imprisoned, you can also beat up other prisoners.`,
        success: "Success",
    },
    [Language_1.Language.Portuguese]: {
        userFree: "Você pode espancar!",
        userBeatWait: (beatTime) => `Você poderá espancar novamente ${(0, discord_js_1.time)(beatTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        userScavenging: `Você não pode espancar enquanto vasculha! ${emotes_1.EmoteString.Scavenge}`,
        userWorking: `Você não pode espancar enquanto trabalha! ${emotes_1.EmoteString.Jobs}`,
        userEscaping: (timerEscape) => `Você não pode espancar enquanto estiver sendo procurado pela polícia! Poderá espancar novamente ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `Você não pode espancar enquanto está preso! Será solto ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `Você não pode espancar enquanto está hospitalizado! Será curado ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        userCasino: `Você não pode espancar enquanto está jogando no cassino! ${emotes_1.EmoteString.Casino}`,
        description: `# Espancar
### Derrote seu nêmesis e mostre quem é que manda!
Quem perder a luta, ficará hospitalizado por um tempo determinado pela ${emotes_1.EmoteString.Attack}ATK do jogador defensor.
Para conseguir espancar, o alvo deve estar ${emotes_1.EmoteString.Idle} **Vadiando**.
-# Caso você estiver ${emotes_1.EmoteString.Prison} Preso, você também pode espancar outros presos.`,
        success: "Sucesso",
    },
    [Language_1.Language.Spanish]: {
        userFree: "¡Puedes golpear!",
        userBeatWait: (beatTime) => `Podrás volver a golpear ${(0, discord_js_1.time)(beatTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        userScavenging: `¡No puedes golpear mientras buscas! ${emotes_1.EmoteString.Scavenge}`,
        userWorking: `¡No puedes golpear mientras trabajas! ${emotes_1.EmoteString.Jobs}`,
        userEscaping: (timerEscape) => `¡No puedes golpear mientras eres perseguido por la policía! ¡Puedes golpear de nuevo ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `¡No puedes golpear mientras estás en prisión! ¡Serás liberado ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `¡No puedes golpear mientras estás en el hospital! ¡Serás curado ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        userCasino: `¡No puedes golpear mientras estás jugando en el casino! ${emotes_1.EmoteString.Casino}`,
        description: `# Golpear
### ¡Derrota a tu némesis y demuestra quién manda!
El perdedor de la pelea será hospitalizado por un tiempo determinado por la ${emotes_1.EmoteString.Attack}ATK del jugador defensor.
Para golpear, el objetivo debe estar ${emotes_1.EmoteString.Idle} **Vagando**.
-# Si estás ${emotes_1.EmoteString.Prison} Encarcelado, también puedes golpear a otros prisioneros.`,
        success: "Éxito",
    },
};
//# sourceMappingURL=beatup.js.map