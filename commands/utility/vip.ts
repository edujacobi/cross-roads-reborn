import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { replyInteraction } from "../../utils/logic";
import { EmoteString } from "../../utils/ui";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vip")
		.setDescription("Adquire VIP, get benefits and contribute to development!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adquira VIP, tenha vantagens e contribua com o desenvolvimento"),

	async execute(interaction: ChatInputCommandInteraction) {

		const embed = new CustomEmbedBuilder()
			.setTitle(`${EmoteString.VIP} Be VIP`)
			.setThumbnail("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png")
			.setColor(Colors.Gold)
			.setDescription(`## Benefits
Exclusive badge in \`/user\`
50% bonus in \`/daily\`
New images for your rooster in \`/setimage\`
Access to development channel
Access to VIP category in Battle Roosters Arena server
VIP role in Battle Roosters Arena server
Battle messages in Portuguese
Find wild roosters in Portuguese and faster
Duration of trainings reduced by 25%
Many more to come!
## How to adquire
Send a DM to \`ejacobi\`. If you can't, join the Battle Roosters Arena server.
R$ 10,00 = 1 month. R$ 25,00 = 3 months.`)
			.setDefaultFooter(interaction);

		await replyInteraction(interaction, { embeds: [embed] });
	},
};


// module.exports = {
// 	data: new SlashCommandBuilder()
// 		.setName("vip")
// 		.setDescription("Adquira VIP, tenha vantagens e contribua com o desenvolvimento!"),
//
// 	async execute(interaction: ChatInputCommandInteraction) {
//
// 		const embed = new CustomEmbedBuilder()
// 			.setTitle(`${EmoteString.VIP} Seja VIP`)
// 			.setThumbnail("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png")
// 			.setColor(Colors.Gold)
// 			.setDescription(`## Beneficios
// Badge exclusiva no \`/user\`
// Bônus de 50% no \`/daily\`
// Novas imagens para seu galo no \`/setimage\`
// Acesso ao canal de desenvolvimento
// Acesso à categoria VIP do servidor Battle Roosters Arena
// Cargo VIP no servidor Battle Roosters Arena
// Muito mais a vir!
// ## Como adquirir
// Mande uma DM pro \`ejacobi\`. Caso não consiga, entre no servidor do Battle Roosters Arena.
// R$ 10,00 = 1 mês. R$ 25,00 = 3 meses.
// `)
// 			.setDefaultFooter(interaction);
//
// 		await replyInteraction(interaction, {embeds: [embed]});
// 	},
// };
