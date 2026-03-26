import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { replyWithContainer } from "@bot/utils/discordInteractions";
import { EmoteString } from "@bot/utils/emotes";
import { Language, type Localization } from "@core/models/Language";
import type { User } from "@core/models/User";
import { type ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vip")
		.setDescription("Acquire VIP, get benefits and contribute to development!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adquira VIP, tenha vantagens e contribua com o desenvolvimento"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(Colors.Gold)
			.addSectionComponents(section => section
				.addTexts([
					`# ${EmoteString.VIP} ${s.title}`,
					s.benefits,
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png"),
				),
			)
			.addLargeSeparator()
			.addTexts([
				s.howToAcquire,
			])
			.addFooter();

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		title: "VIP",
		benefits: `## Benefits
- Exclusive badge and avatar decoration in \`/user\` and \`/inv\`
- 50% bonus in \`/daily\`
- Access to development channel
- Less cooldown between commands
- 50% larger alms delivery
- 25% discount on Class and Nickname change
- ~~Exclusive Prize Ticket draws~~
- Access to VIP category in Cross Roads Reborn server
- VIP role in Cross Roads Reborn server
- Many more to come!`,
		howToAcquire: `## How to acquire
In \`/specialshop\`, using the ${EmoteString.SpecialCoinShop}Special Coins!`,
	},
	[Language.Portuguese]: {
		title: "VIP",
		benefits: `## Benefícios
- Insígnia e decoração de avatar exclusivas no \`/usuario\` e \`/inv\`
- 50% de bônus no \`/daily\`
- Acesso ao canal de desenvolvimento
- Menos cooldown entre comandos
- Entrega esmolas 50% maiores
- 25% de desconto na troca de Classe e Nickname
- ~~Sorteios do Bilhete premiado exclusivos~~
- Acesso à categoria VIP no servidor Cross Roads Reborn
- Cargo VIP no servidor Cross Roads Reborn
- Muitos mais por vir!`,
		howToAcquire: `## Como adquirir
Na \`/lojaespecial\`, utilizando as ${EmoteString.SpecialCoinShop}Moedas Especiais!`,
	},
	[Language.Spanish]: {
		title: "VIP",
		benefits: `## Beneficios
- Insignia y decoración de avatar exclusivas en \`/user\` y \`/inv\`
- 50% de bonificación en \`/daily\`
- Acceso al canal de desarrollo
- Menos tiempo de espera entre comandos
- Entrega de limosnas 50% mayores
- 25% de descuento en el cambio de Clase y Nickname
- ~~Sorteos exclusivos del Billete premiado~~
- Acceso a la categoría VIP en el servidor Cross Roads Reborn
- Rol VIP en el servidor Cross Roads Reborn
- ¡Muchos más por venir!`,
		howToAcquire: `## Cómo adquirir
En \`/specialshop\`, usando ¡${EmoteString.SpecialCoinShop}Monedas especiales!`,
	},
} as const satisfies Localization;