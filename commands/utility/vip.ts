import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { replyInteraction } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vip")
		.setDescription("Adquire VIP, get benefits and contribute to development!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adquira VIP, tenha vantagens e contribua com o desenvolvimento"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png")
			.setColor(Colors.Gold)
			.setDescription(`# ${EmoteString.VIP} ${s.title}
${s.benefits}
${s.howToAdquire}`)
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
			});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		title: "VIP",
		benefits: `## Benefits
Exclusive badge in \`/user\`
50% bonus in \`/daily\`
Access to development channel
Nickname change recharge
Less cooldown between commands
50% larger alms delivery
25% discount on Class change
Exclusive Prize Ticket draws
Can select Skins for weapons
Access to VIP category in Cross Roads Reborn server
VIP role in Cross Roads Reborn server
Many more to come!`,
		howToAdquire: `## How to adquire
Send a DM to \`ejacobi\`. If you can't, join the Cross Roads Reborn server.
$2.50 = 1 month. $6.00 = 3 months.`,
	},
	[Language.Portuguese]: {
		title: "VIP",
		benefits: `## Benefícios
Insígnia exclusiva no \`/inv\`
50% de bônus no \`/daily\`
Acesso ao canal de desenvolvimento
Recarga na alteração de nick
Menos cooldown entre comandos
Entrega esmolas 50% maiores
25% de desconto na troca de Classe
Sorteios do Bilhete premiado exclusivos
Pode selecionar Skins para armas
Acesso à categoria VIP no servidor Cross Roads Reborn
Cargo VIP no servidor Cross Roads Reborn
Muitos mais por vir!`,
		howToAdquire: `## Como adquirir
Envie uma DM para \`ejacobi\`. Se não conseguir, entre no servidor Cross Roads Reborn.
R$ 13,00 = 1 mês. R$ 31,00 = 3 meses.`,
	},
	[Language.Spanish]: {
		title: "VIP",
		benefits: `## Beneficios
Insignia exclusiva en \`/user\`
50% de bonificación en \`/daily\`
Acceso al canal de desarrollo
Recarga en el cambio de apodo
Menos tiempo de espera entre comandos
Entrega de limosnas 50% mayores
25% de descuento en el cambio de Clase
Sorteos exclusivos del Billete premiado
Puede seleccionar Skins para armas
Acceso a la categoría VIP en el servidor Cross Roads Reborn
Rol VIP en el servidor Cross Roads Reborn
¡Muchos más por venir!`,
		howToAdquire: `## Cómo adquirir
Envía un DM a \`ejacobi\`. Si no puedes, únete al servidor Cross Roads Reborn.
$2.50 = 1 mes. $6.00 = 3 meses.`,
	},
} as const;