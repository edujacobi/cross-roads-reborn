import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { checkUser, replyInteraction } from "../../utils/logic";
import { EmoteString } from "../../utils/ui";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("A few tips to start your adventure!")
		.setNameLocalization(Locale.PortugueseBR, "ajuda")
		.setDescriptionLocalization(Locale.PortugueseBR, "Algumas dicas para começar a sua aventura"),

	async execute(interaction: ChatInputCommandInteraction) {

		const user = await checkUser(interaction.user.id, interaction);

		let title = "Help";
		let description = `## You've won a battle rooster!
			
Your journey as a **Rooster Trainer** has already begun!

You've received a rooster of random attributes. He will start at level 0 and will receive experience points after battles and trainings.
After each battle and training, your rooster will need to rest for a few minutes until it recovers.
Training and resting (after training) time increase based on your rooster's level.

The rarities of wild roosters are: ${EmoteString.Common} Common, ${EmoteString.Uncommon} Uncommon, ${EmoteString.Rare} Rare and ${EmoteString.Legendary} Legendary.

To see your rooster, use \`/rooster\`. To train it, use \`/train\`. You can receive a little bit o Exp each day using \`/daily\`.
## Customization
You can customize your rooster with the following:
Image and color: \`/setimage\`
Name: \`/setname [new name]\`
Title (aka Biography): \`/settitle [new title]\`
## Battles
Start a battle with \`/battle [@target]\`. You can only battle with roosters with 4 levels of difference.
These battles give ${EmoteString.Experience} Exp and counts towards your battle history (check it with \`/history\`) and ranking (\`/ranking\`).
You can duel in a spare (a training-fight). This type of fight does not gives Exp nor counts to history and ranking. But you can challenge any rooster with any level.
## Wild
You can find wild roosters in the wild! Use \`/wild\` to start an adventure and battle a wild rooster.
## Additional help
Got confused with something? Found a bug? Reach us at the [official server](https://discord.com/invite/sNf8avn).`;

		if (user?.Language === Language.Portuguese) {
			title = "Ajuda";
			description = `## Você ganhou um galo de batalha!

Sua jornada como **Treinador de Galos** já começou!

Você recebeu um galo com atributos aleatórios. Ele começará no nível 0 e receberá pontos de experiência após batalhas e treinamentos.
Após cada batalha e treinamento, seu galo precisará descansar por alguns minutos até se recuperar.
O tempo de treinamento e descanso (após o treinamento) aumenta com base no nível do seu galo.

As raridades dos galos selvagens são: ${EmoteString.Common} Comum, ${EmoteString.Uncommon} Incomum, ${EmoteString.Rare} Raro e ${EmoteString.Legendary} Lendário.

Para ver seu galo, use \`/galo\`. Para treiná-lo, use \`/treinar\`. Você pode receber um pouco de Exp todos os dias usando \`/daily\`.
## Customização
Você pode personalizar seu galo da seguinte maneira:
Imagem e cor: \`/mudaimagem\`
Nome: \`/mudanome [novo nome]\`
Título (ou Biografia): \`/mudatitulo [novo título]\`
## Batalhas
Inicie uma batalha com \`/batalhar [@alvo]\`. Você só pode batalhar com galos com uma diferença de até 4 níveis.
Essas batalhas dão ${EmoteString.Experience} Exp e contam para seu histórico de batalhas (verifique com \`/historico\`) e ranking (\`/ranking\`).
Você pode duelar em um treino (uma luta de treinamento). Esse tipo de luta não dá Exp nem conta para o histórico e ranking. Mas você pode desafiar qualquer galo de qualquer nível.
## Selva
Você pode encontrar galos selvagens na selva! Use \`/selva\` para começar uma aventura e batalhar com um galo selvagem.
## Ajuda adicional
Ficou confuso com algo? Encontrou um bug? Entre em contato conosco no [servidor oficial](https://discord.com/invite/sNf8avn).`;
		}

		const embed = new CustomEmbedBuilder()
			.setTitle(title)
			.setColor(Colors.Red)
			.setDescription(description)
			.setDefaultFooter(interaction);

		await replyInteraction(interaction, { embeds: [embed] });
	},
};
