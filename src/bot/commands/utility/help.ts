import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "@bot/utils/discordInteractions";
import { Language, Localization } from "@core/models/Language";
import { CrColors } from "@bot/utils/colors";
import { User } from "@core/models/User";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { EmoteString } from "@bot/utils/emotes";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("A few tips to start your adventure!")
		.setNameLocalization(Locale.PortugueseBR, "ajuda")
		.setDescriptionLocalization(Locale.PortugueseBR, "Algumas dicas para começar a sua aventura"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];
		// .setThumbnail("https://media.discordapp.net/attachments/531174573463306240/854876909564461066/Interrogacao.png")

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Default)
			.addTexts([
				`# ${s.title}`
			])
			.addLargeSeparator()
			.addTexts([s.description1])
			.addLargeSeparator()
			.addTexts([s.description2])
			.addLargeSeparator()
			.addTexts([s.description3])
			.addLargeSeparator()
			.addTexts([s.description4])
			.addLargeSeparator()
			.addTexts([s.description5])
			.addLargeSeparator()
			.addTexts([s.description6])
			.addLargeSeparator()
			.addTexts([s.description7])
			.addFooter();

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		title: "Help",
		description1: `## Cross City!
Welcome to Cross City! Here, all paths cross, be them good or bad. Decide your path and shape your future in this RPG game!`,
		description2: `## Play now
See your inventory using \`/inv\`.
You can use \`/daily\` daily to receive a small amount that increases if you don't forget any day!`,
		description3: `## Earn money
There are many ways to earn money in the game. ${EmoteString.Jobs} Working, ~~investing~~, ${EmoteString.Casino} betting, ${EmoteString.Robbery} stealing and even ${EmoteString.Scavenge} scavenging through places.`,
		description4: `## Commands
To see all commands, use \`/commands\`.`,
		description5: `## Notifications and functioning
For everything to go smoothly, make sure you can receive private messages from users who are not on your friends list. If you put Cross Roads on your server, make sure the Manage Messages permission is active!`,
		description6: `## Help the bot stay online
Get ${EmoteString.VIP} **VIP**! VIP does not make the game _pay-to-win_, the benefits are mostly cosmetic! Use \`/vip\` for more information.`,
		description7: `## Additional help
Confused about something? Found a bug? Contact us on the [official server](https://discord.com/invite/sNf8avn).`,
	},
	[Language.Portuguese]: {
		title: "Ajuda",
		description1: `## Cidade da Cruz!
Bem vindo à Cidade da Cruz! Aqui, todos os caminhos se cruzam, sejam eles bons ou ruins. Decida seu caminho e molde seu futuro nesse jogo de RPG!`,
		description2: `## Jogue agora mesmo
Veja seu inventário usando \`/inv\`.
Você pode usar \`/daily\` diariamente para receber um pequeno valor que aumenta caso você não esqueça nenhum dia!`,
		description3: `## Ganhe dinheiro
Há muitas maneiras de ganhar dinheiro no jogo. ${EmoteString.Jobs} Trabalhando, ~~investindo~~, ${EmoteString.Casino} apostando, ${EmoteString.Robbery} roubando e até ${EmoteString.Scavenge} vasculhando lugares.`,
		description4: `## Comandos
Para ver todos os comandos, use \`/comandos\`.`,
		description5: `## Notificações e funcionamento
Para tudo ocorrer belezinha, certifique-se que você pode receber mensagens privadas de usuários que não estão na sua lista de amigos. Se você colocou Cross Roads no seu servidor, certifique-se que a permissão Gerenciar Mensagens está ativa!`,
		description6: `## Ajude o bot a continuar online
Adquira ${EmoteString.VIP} **VIP**! O VIP não torna o jogo _pay-to-win_, os benefícios são, em sua maioria, somente cosméticos! Use \`/vip\` para mais informações.`,
		description7: `## Ajuda adicional
Ficou confuso com algo? Encontrou um bug? Entre em contato conosco no [servidor oficial](https://discord.com/invite/sNf8avn).`,
	},
	[Language.Spanish]: {
		title: "Ayuda",
		description1: `## ¡Ciudad de la Cruz!
¡Bienvenido a la Ciudad de la Cruz! Aquí, todos los caminos se cruzan, sean buenos o malos. ¡Decide tu camino y moldea tu futuro en este juego de RPG!`,
		description2: `## Juega ahora
Consulta tu inventario usando \`/inv\`.
Puedes usar \`/daily\` diariamente para recibir una pequeña cantidad que aumenta si no olvidas ningún día.`,
		description3: `## Gana dinero
Hay muchas formas de ganar dinero en el juego. ${EmoteString.Jobs} Trabajando, ~~invirtiendo~~, ${EmoteString.Casino} apostando, ${EmoteString.Robbery} robando e incluso ${EmoteString.Scavenge} rebuscando por lugares.`,
		description4: `## Comandos
Para ver todos los comandos, usa \`/comandos\`.`,
		description5: `## Notificaciones y funcionamiento
Para que todo vaya sobre ruedas, asegúrate de que puedes recibir mensajes privados de usuarios que no están en tu lista de amigos. Si has puesto Cross Roads en tu servidor, ¡asegúrate de que la permiso de Gestionar Mensajes está activa!`,
		description6: `## Ayuda al bot a mantenerse en línea
¡Consigue ${EmoteString.VIP} **VIP**! ¡El VIP no convierte el juego en _pay-to-win_, los beneficios son principalmente cosméticos! Usa \`/vip\` para más información.`,
		description7: `## Ayuda adicional
¿Confundido con algo? ¿Encontraste un error? Contáctanos en el [servidor oficial](https://discord.com/invite/sNf8avn).`,
	},
} as const satisfies Localization;