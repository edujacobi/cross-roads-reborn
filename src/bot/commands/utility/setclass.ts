import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { formatMoney } from "#bot/utils/ui";
import type { User } from "#core/models/User";
import { Language, type Localization } from "#core/models/Language";
import { type Class, ClassId, ClassList, type ClassModifier } from "#core/types/Classes";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { EmoteString } from "#bot/utils/emotes";
import { EmoteBadgeString } from "#bot/utils/badges";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setclass")
		.setNameLocalization(Locale.PortugueseBR, "mudaclasse")
		.setDescription("Set a class for you")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda a sua classe"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const availableClasses = [
			ClassList[ClassId.Attorney],
			ClassList[ClassId.Entrepreneur],
			ClassList[ClassId.Hobo],
			ClassList[ClassId.Thief],
		];

		const CHANGE_COST = user.IsVip() ? 75_000 : 100_000;

		function getModifierText(modifier?: ClassModifier) {
			const text = [];
			const getMultiplicative = (value: number) => Math.round(value * 100) - 100;

			if (!modifier) {
				return s.noModifier;
			}

			// POSITIVE
			if (modifier.Casino?.Positive) {
				text.push(`${EmoteString.Victory} \`+${getMultiplicative(modifier.Casino?.Positive)}%\` ${s.casinoModifier}`);
			}
			if (modifier.Job?.Positive) {
				text.push(`${EmoteString.Victory} \`+${getMultiplicative(modifier.Job?.Positive)}%\` ${s.jobModifier}`);
			}
			if (modifier.InvestmentYield?.Positive) {
				text.push(`${EmoteString.Victory} \`+${getMultiplicative(modifier.InvestmentYield?.Positive)}%\` ${s.investmentYieldModifier}`);
			}
			if (modifier.Robbery?.Positive) {
				text.push(`${EmoteString.Victory} \`+${getMultiplicative(modifier.Robbery?.Positive)}%\` ${s.robberyModifier}`);
			}
			if (modifier.ScavengeDuration?.Positive) {
				text.push(`${EmoteString.Victory} \`+${getMultiplicative(modifier.ScavengeDuration?.Positive)}%\` ${s.scavengeDurationModifier}`);
			}
			if (modifier.PrisonBribe?.Positive) {
				text.push(`${EmoteString.Victory} \`+${modifier.PrisonBribe?.Positive}%\` ${s.prisonBribeModifier}`);
			}
			if (modifier.PrisonEscape?.Positive) {
				text.push(`${EmoteString.Victory} \`+${modifier.PrisonEscape?.Positive}%\` ${s.prisonEscapeModifier}`);
			}
			if (modifier.ScavengeChance?.Positive) {
				text.push(`${EmoteString.Victory} \`+${modifier.ScavengeChance?.Positive}%\` ${s.scavengeChanceModifier}`);
			}
			// NEGATIVE
			if (modifier.Casino?.Negative) {
				text.push(`${EmoteString.Defeat} \`${getMultiplicative(modifier.Casino?.Negative)}%\` ${s.casinoModifier}`);
			}
			if (modifier.Job?.Negative) {
				text.push(`${EmoteString.Defeat} \`${getMultiplicative(modifier.Job?.Negative)}%\` ${s.jobModifier}`);
			}
			if (modifier.InvestmentYield?.Negative) {
				text.push(`${EmoteString.Defeat} \`${getMultiplicative(modifier.InvestmentYield?.Negative)}%\` ${s.investmentYieldModifier}`);
			}
			if (modifier.Robbery?.Negative) {
				text.push(`${EmoteString.Defeat} \`${getMultiplicative(modifier.Robbery?.Negative)}%\` ${s.robberyModifier}`);
			}
			if (modifier.ScavengeDuration?.Negative) {
				text.push(`${EmoteString.Defeat} \`${getMultiplicative(modifier.ScavengeDuration?.Negative)}%\` ${s.scavengeDurationModifier}`);
			}
			if (modifier.PrisonBribe?.Negative) {
				text.push(`${EmoteString.Defeat} \`${modifier.PrisonBribe?.Negative}%\` ${s.prisonBribeModifier}`);
			}
			if (modifier.PrisonEscape?.Negative) {
				text.push(`${EmoteString.Defeat} \`${modifier.PrisonEscape?.Negative}%\` ${s.prisonEscapeModifier}`);
			}
			if (modifier.ScavengeChance?.Negative) {
				text.push(`${EmoteString.Defeat} \`${modifier.ScavengeChance?.Negative}%\` ${s.scavengeChanceModifier}`);
			}
			return text.join("\n");
		}

		function getClassDataText(classData: Class) {
			return [
				`### ${classData.Image.Emote.String} ${classData.Name[language]}`,
				`-# _${classData.Description[language]}_`,
				``,
				`${getModifierText(classData.Modifier)}`,
			].join("\n");
		}

		function addContainerHeader() {
			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Default)
				.addTexts([
					`# ${s.title}`,
					s.description,
				])
				.addLargeSeparator();
		}

		function addContainerBody(container: CustomContainerBuilder) {
			for (let i = 0; i < availableClasses.length; i++) {
				const classData = availableClasses[i];

				container.addSectionComponents(section => section
					.addTexts([
						getClassDataText(classData),
					])
					.setButtonAccessory(new ButtonBuilder()
						.setLabel(s.select)
						.setDisabled(classData.Id === user.Class)
						.setCustomId(`class${classData.Id}`)
						.setStyle(ButtonStyle.Secondary),
					),
				);

				if (i !== availableClasses.length - 1) {
					container.addLargeSeparator();
				}
			}

			container.addFooter();

			return container;
		}

		let container = addContainerHeader();
		container = addContainerBody(container);

		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response);

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collector?.on("collect", async btn => {
			await btn.deferUpdate();

			if (btn.customId === "back") {
				let container = addContainerHeader();
				container = addContainerBody(container);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("class")) {
				const classId = Number(btn.customId.replace("class", ""));
				const classData = ClassList[classId];

				await user.GetInfo();

				const oldClass = user.Class;

				if (oldClass === classId) {
					return disableButtons(interaction, container);
				}

				// TODO: Aumentar custo de acordo com quantas mudanças já realizou
				const hasClass = user.Class !== ClassId.None;

				container = addContainerHeader()
					.addTexts([
						getClassDataText(classData),
					])
					.addLargeSeparator()
					.addTexts([
						hasClass ? s.costToChange(CHANGE_COST) : s.firstFree,
					])
					.addButtonRow(
						btn => btn
							.setCustomId("back")
							.setLabel(s.back)
							.setStyle(ButtonStyle.Secondary),
						btn => btn
							.setCustomId(`confirm${classId}`)
							.setDisabled(hasClass && user.Money < CHANGE_COST)
							.setLabel(hasClass ? formatMoney(CHANGE_COST, language) : s.confirm)
							.setStyle(ButtonStyle.Success),
					)
					.addFooter({
						text: formatMoney(user.Money, language),
					});

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("confirm")) {
				const newClass = Number(btn.customId.replace("confirm", ""));

				await user.GetInfo();

				const oldClass = user.Class;

				if (oldClass === newClass) {
					return disableButtons(interaction, container);
				}

				const hasClass = user.Class !== ClassId.None;

				const success = await user.SetClass(newClass, hasClass ? CHANGE_COST : undefined);

				container = addContainerHeader()
					.addTexts([
						success ? s.classChanged(oldClass, newClass) : s.errorChange,
					])
					.addFooter({
						text: formatMoney(user.Money, language),
					});

				return replyWithContainer(interaction, container);
			}

		});
	},
};

const Strings = {
	[Language.English]: {
		title: "Classes",
		description: "The roads of Cross City offer diverse opportunities for its residents, but if you want to stand out here, you'll need to choose one of the following careers!",
		noModifier: "No modifiers",
		casinoModifier: `winnings from gambling at the casino ${EmoteString.Casino}`,
		jobModifier: `earnings received from jobs ${EmoteString.Jobs}`,
		investmentYieldModifier: `profit from investments ${EmoteString.InvestmentActive}`,
		robberyModifier: `stolen from users and locations ${EmoteString.Robbery}`,
		scavengeDurationModifier: `money and duration of items found by scavenging ${EmoteString.Scavenge}`,
		prisonBribeModifier: `chance of the bribe being accepted ${EmoteBadgeString.Season6.Politician}`,
		prisonEscapeModifier: `chance of escaping from prison ${EmoteString.Escape}`,
		scavengeChanceModifier: `chance of finding items by scavenging ${EmoteString.Scavenge}`,
		select: "Select",
		back: "Back",
		firstFree: "The first time you choose a class it's free, but subsequent changes will have a cost.",
		costToChange: (cost: number) => `The cost for you to change your class is ${formatMoney(cost, Language.English)}.\n-# Confirm the change?`,
		confirm: "Confirm",
		setting: "Setting class",
		classChanged: (oldClass: ClassId, newClass: ClassId) => `You now have the class ${ClassList[oldClass].Image.Emote.String} → ${ClassList[newClass].Image.Emote.String} **${ClassList[newClass].Name[Language.English]}**!`,
		errorChange: "You don't have enough money to change your class.",
	},
	[Language.Portuguese]: {
		title: "Classes",
		description: "As Ruas de Cidade da Cruz oferecem diversas oportunidades para seus residentes, mas se você quer ser alguém aqui, precisará escolher uma das seguintes carreiras!",
		noModifier: "Sem modificadores",
		casinoModifier: `ganhos em apostas no cassino ${EmoteString.Casino}`,
		jobModifier: `recebidos de trabalhos ${EmoteString.Jobs}`,
		investmentYieldModifier: `lucro de investimentos ${EmoteString.InvestmentActive}`,
		robberyModifier: `roubados de usuários e locais ${EmoteString.Robbery}`,
		scavengeDurationModifier: `grana e duração de itens encontrados vasculhando ${EmoteString.Scavenge}`,
		prisonBribeModifier: `chance do suborno ser aceito ${EmoteBadgeString.Season6.Politician}`,
		prisonEscapeModifier: `chance de fugir da prisão ${EmoteString.Escape}`,
		scavengeChanceModifier: `chance de encontrar vasculhando ${EmoteString.Scavenge}`,
		select: "Selecionar",
		back: "Voltar",
		firstFree: "A primeira vez que você escolhe uma classe é de graça, mas as próximas trocas terão um custo.",
		costToChange: (cost: number) => `O custo para você alterar sua classe é ${formatMoney(cost, Language.Portuguese)}.\n-# Confirmar troca?`,
		confirm: "Confirmar",
		setting: "Configurando classe",
		classChanged: (oldClass: ClassId, newClass: ClassId) => `Agora você possui a classe ${ClassList[oldClass].Image.Emote.String} → ${ClassList[newClass].Image.Emote.String} **${ClassList[newClass].Name[Language.Portuguese]}**!`,
		errorChange: "Você não possui dinheiro suficiente para alterar sua classe.",
	},
	[Language.Spanish]: {
		title: "Clases",
		description: "Las calles de Ciudad de la Cruz ofrecen diversas oportunidades para sus residentes, pero si quieres destacar aquí, ¡necesitarás elegir una de las siguientes carreras!",
		noModifier: "Sin modificadores",
		casinoModifier: `ganancias por jugar en el casino ${EmoteString.Casino}`,
		jobModifier: `ganancias recibidas de trabajos ${EmoteString.Jobs}`,
		investmentYieldModifier: `lucro de inversiones ${EmoteString.InvestmentActive}`,
		robberyModifier: `robado de usuarios y ubicaciones ${EmoteString.Robbery}`,
		scavengeDurationModifier: `dinero y duración de los objetos encontrados al buscar en la cárcel ${EmoteString.Scavenge}`,
		prisonBribeModifier: `probabilidad de aceptar el soborno ${EmoteBadgeString.Season6.Politician}`,
		prisonEscapeModifier: `probabilidad de escapar de la cárcel ${EmoteString.Escape}`,
		scavengeChanceModifier: `probabilidad de encontrar objetos al buscar en la cárcel ${EmoteString.Scavenge}`,
		select: "Seleccionar",
		back: "Volver",
		firstFree: "La primera vez que eliges una clase es gratis, pero los cambios subsiguientes tendrán un costo.",
		costToChange: (cost: number) => `El costo para que usted cambie su clase es ${formatMoney(cost, Language.Spanish)}.\n-# ¿Confirmar el cambio?`,
		confirm: "Confirmar",
		setting: "Configurando clase",
		classChanged: (oldClass: ClassId, newClass: ClassId) => `Ahora tienes la clase ${ClassList[oldClass].Image.Emote.String} → ${ClassList[newClass].Image.Emote.String} **${ClassList[newClass].Name[Language.Spanish]}**!`,
		errorChange: "No tienes suficiente dinero para cambiar de clase.",
	},
} as const satisfies Localization;