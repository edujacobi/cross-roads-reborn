import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { replyInteraction } from "../../utils/logic";
import { Language } from "../../models/Language";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("A few tips to start your adventure!")
		.setNameLocalization(Locale.PortugueseBR, "ajuda")
		.setDescriptionLocalization(Locale.PortugueseBR, "Algumas dicas para começar a sua aventura"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const embed = new CustomEmbedBuilder()
			.setTitle(s.title)
			.setColor(CrColors.Default)
			.setThumbnail("https://media.discordapp.net/attachments/531174573463306240/854876909564461066/Interrogacao.png")
			.setDescription(s.description)
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
			});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		title: "Help",
		description: `## Cross City!
Welcome to Cross City! Here, all paths cross, be them good or bad. Decide your path and shape your future in this RPG game!
## Play now
See your inventory using \`/inv\`.
You can use \`/daily\` daily to receive a small amount that increases if you don't forget any day!
## Earn money
There are many ways to earn money in the game. Working, ~~investing~~, betting, stealing and even ~~scavenging~~ through places.
## Commands
To see all commands, use \`/commands\`.
## Notifications and functioning
For everything to go smoothly, make sure you can receive private messages from users who are not on your friends list. If you put Cross Roads on your server, make sure the Manage Messages permission is active!
## Help the bot stay online
Get VIP! VIP does not make the game _pay-to-win_, the benefits are mostly cosmetic! Use \`/vip\` for more information.
## Additional help
Confused about something? Found a bug? Contact us on the [official server](https://discord.com/invite/sNf8avn).`,
	},
	[Language.Portuguese]: {
		title: "Ajuda",
		description: `## Cidade da Cruz!
Bem vindo à Cidade da Cruz! Aqui, todos os caminhos se cruzam, sejam eles bons ou ruins. Decida seu caminho e molde seu futuro nesse jogo de RPG!
## Jogue agora mesmo
Veja seu inventário usando \`/inv\`.
Você pode usar \`/daily\` diariamente para receber um pequeno valor que aumenta caso você não esqueça nenhum dia!
## Ganhe dinheiro
Há muitas maneiras de ganhar dinheiro no jogo. Trabalhando, ~~investindo~~, apostando, roubando e até ~~vasculhando~~ lugares.
## Comandos
Para ver todos os comandos, use \`/comandos\`.
## Notificações e funcionamento
Para tudo ocorrer belezinha, certifique-se que você pode receber mensagens privadas de usuários que não estão na sua lista de amigos. Se você colocou Cross Roads no seu servidor, certifique-se que a permissão Gerenciar Mensagens está ativa!
## Ajude o bot a continuar online
Adquira VIP! O VIP não torna o jogo _pay-to-win_, os benefícios são, em sua maioria, somente cosméticos! Use \`/vip\` para mais informações.
## Ajuda adicional
Ficou confuso com algo? Encontrou um bug? Entre em contato conosco no [servidor oficial](https://discord.com/invite/sNf8avn).`,
	},
	[Language.Spanish]: {
		title: "Ayuda",
		description: `## ¡Ciudad de la Cruz!
¡Bienvenido a la Ciudad de la Cruz! Aquí, todos los caminos se cruzan, sean buenos o malos. ¡Decide tu camino y moldea tu futuro en este juego de RPG!
## Juega ahora
Consulta tu inventario usando \`/inv\`.
Puedes usar \`/daily\` diariamente para recibir una pequeña cantidad que aumenta si no olvidas ningún día.
## Gana dinero
Hay muchas formas de ganar dinero en el juego. Trabajando, ~~invirtiendo~~, apostando, robando e incluso ~~rebuscando~~ por lugares.
## Comandos
Para ver todos los comandos, usa \`/comandos\`.
## Notificaciones y funcionamiento
Para que todo vaya sobre ruedas, asegúrate de que puedes recibir mensajes privados de usuarios que no están en tu lista de amigos. Si has puesto Cross Roads en tu servidor, ¡asegúrate de que la permiso de Gestionar Mensajes está activa!
## Ayuda al bot a mantenerse en línea
¡Consigue VIP! ¡El VIP no convierte el juego en _pay-to-win_, los beneficios son principalmente cosméticos! Usa \`/vip\` para más información.
## Ayuda adicional
¿Confundido con algo? ¿Encontraste un error? Contáctanos en el [servidor oficial](https://discord.com/invite/sNf8avn).`,
	},
} as const;