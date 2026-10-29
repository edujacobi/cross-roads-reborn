"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("vip")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "vip")
        .setDescription("Acquire VIP, get benefits and contribute to development!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Adquira VIP, tenha vantagens e contribua com o desenvolvimento")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Adquiere VIP, obtén beneficios y contribuye al desarrollo!"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(discord_js_1.Colors.Gold)
            .addSectionComponents(section => section
            .addTexts([
            `# ${emotes_1.EmoteString.VIP} ${s.title}`,
            s.benefits,
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png")))
            .addLargeSeparator()
            .addTexts([
            s.howToAcquire,
        ])
            .addFooter();
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "VIP",
        benefits: `## Benefits
- Exclusive badge and avatar decoration in \`/user\`, \`/inv\` and \`/top\`
- 50% bonus in \`/daily\`
- Access to development channel
- Less cooldown between commands
- 50% larger alms delivery
- 25% discount on Prize Tickets
- 25% discount on Class and Nickname change
- Access to VIP category in Cross Roads Reborn server
- VIP role in Cross Roads Reborn server
- Many more to come!`,
        howToAcquire: `## How to acquire
In \`/specialshop\`, using the ${emotes_1.EmoteString.SpecialCoinShop}Special Coins!`,
    },
    [Language_1.Language.Portuguese]: {
        title: "VIP",
        benefits: `## Benefícios
- Insígnia e decoração de avatar exclusivas no \`/usuario\`, \`/inv\` e \`/top\`
- 50% de bônus no \`/daily\`
- Acesso ao canal de desenvolvimento
- Menos cooldown entre comandos
- Entrega esmolas 50% maiores
- 25% de desconto no Bilhete Premiado
- 25% de desconto na troca de Classe e Nickname
- Acesso à categoria VIP no servidor Cross Roads Reborn
- Cargo VIP no servidor Cross Roads Reborn
- Muitos mais por vir!`,
        howToAcquire: `## Como adquirir
Na \`/lojaespecial\`, utilizando as ${emotes_1.EmoteString.SpecialCoinShop}Moedas Especiais!`,
    },
    [Language_1.Language.Spanish]: {
        title: "VIP",
        benefits: `## Beneficios
- Insignia y decoración de avatar exclusivas en \`/user\`, \`/inv\` y \`/top\`
- 50% de bonificación en \`/daily\`
- Acceso al canal de desarrollo
- Menos tiempo de espera entre comandos
- Entrega de limosnas 50% mayores
- 25% de descuento en el Billete Premiado
- 25% de descuento en el cambio de Clase y Nickname
- Acceso a la categoría VIP en el servidor Cross Roads Reborn
- Rol VIP en el servidor Cross Roads Reborn
- ¡Muchos más por venir!`,
        howToAcquire: `## Cómo adquirir
En \`/specialshop\`, usando ¡${emotes_1.EmoteString.SpecialCoinShop}Monedas especiales!`,
    },
};
//# sourceMappingURL=vip.js.map