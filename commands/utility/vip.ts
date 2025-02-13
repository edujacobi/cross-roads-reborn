import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { replyInteraction } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vip")
		.setDescription("Adquire VIP, get benefits and contribute to development!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adquira VIP, tenha vantagens e contribua com o desenvolvimento"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const embed = new CustomEmbedBuilder()
			.setTitle(`${EmoteString.VIP} Be VIP`)
			.setThumbnail("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png")
			.setColor(Colors.Gold)
			.setDescription(`## Benefits
Exclusive badge in \`/user\`
50% bonus in \`/daily\`
Access to development channel
- Recarga na alteração de nick
- Menos cooldown entre comandos
- Entrega esmolas 50% maiores
- 25% de desconto na troca de Classe
- Sorteios do Bilhete premiado exclusivos
- Pode selecionar Skins para armas
Access to VIP category in Cross Roads Reborn server
VIP role in Cross Roads Reborn server
Many more to come!
## How to adquire
Send a DM to \`ejacobi\`. If you can't, join the Cross Roads Reborn server.
R$ 10,00 = 1 month. R$ 25,00 = 3 months.`)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL());

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
