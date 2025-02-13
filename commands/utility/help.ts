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

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		let title = "Help";
		let description = `## Cross City!
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
Confused about something? Found a bug? Contact us on the [official server](https://discord.com/invite/sNf8avn).`;

		if (user?.Language === Language.Portuguese) {
			title = "Ajuda";
			description = `## Cidade da Cruz!
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
Ficou confuso com algo? Encontrou um bug? Entre em contato conosco no [servidor oficial](https://discord.com/invite/sNf8avn).`;
		}

		const embed = new CustomEmbedBuilder()
			.setTitle(title)
			.setColor(CrColors.Default)
			.setThumbnail("https://media.discordapp.net/attachments/531174573463306240/854876909564461066/Interrogacao.png")
			.setDescription(description)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL());

		await replyInteraction(interaction, { embeds: [embed] });
	},
};
