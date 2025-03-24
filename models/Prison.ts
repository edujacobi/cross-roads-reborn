import { User } from "./User";
import { Language } from "./Language";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	MessageComponentInteraction,
} from "discord.js";
import { ItemId, ItemList } from "./Item";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { CrColors } from "../utils/colors";
import { Users } from "../database/Users";
import { CreationOptional, Op } from "sequelize";
import { defaultEmbed, formatMoney, showTime } from "../utils/ui";
import { EmoteId, EmoteString } from "../utils/emotes";
import { removeEmbedComponents, replyInteraction } from "../utils/logic";
import { ClassList } from "./Class";
import { setTimeout as wait } from "timers/promises";
import { addMinutes, addSeconds } from "date-fns";
import { Log } from "../utils/log";
import { Notification, NotificationType } from "./Notification";
import { BadgeString } from "../utils/badges";
import { Pagination } from "./Pagination";

export class Prison {
	User: User;
	Interaction: ChatInputCommandInteraction;

	Bribe = {
		BaseValue: 20_000,
		Value: 0,
	};
	Escape = {
		HasJetpack: false,
		BaseChance: 20,
		BaseJetpackChance: 30,
		UserChance: 0,
		TotalChance: 0,
		DefaultDuration: 40,
		TimeInMinutesWanted: 30,
	};

	constructor(user: User, interaction: ChatInputCommandInteraction) {
		this.User = user;
		this.Interaction = interaction;
	}

	async GenerateEmbed() {
		const s = Strings[this.User.Language];

		this.Escape.HasJetpack = await this.User.GetItems()
			.then(items => items.some(item => item.Id === ItemId.Jetpack));

		this.Escape.UserChance = this.Escape.HasJetpack ? this.Escape.BaseJetpackChance : 0;
		this.Escape.TotalChance = this.Escape.BaseChance + this.Escape.UserChance;

		let text = `${s.userFree}`;
		if (this.User.IsWanted()) {
			text = s.userWanted(this.User.Wanted.Time);
		}
		if (this.User.IsInPrison()) {
			text = s.userPrison(this.User.Prison.Time);
		}

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png")
			.setDescription(`# ${s.title}\n${s.description(this.Escape.BaseChance, this.Escape.BaseJetpackChance + this.Escape.BaseChance, text)}`)
			.setColor(CrColors.Police)
			.setUserFooter({
				nickname: this.User.Nickname,
				image: this.Interaction.user.avatarURL(),
				text: `${s.currentChance}: ${this.Escape.TotalChance}%`
			});

		const prisoners = await this.GetPrisoners();

		const buttonPrisoners = new ButtonBuilder()
			.setCustomId("prisoners")
			.setLabel(s.prisoners)
			.setDisabled(prisoners.length === 0)
			.setStyle(ButtonStyle.Secondary);

		const buttonEscape = new ButtonBuilder()
			.setCustomId("escape")
			.setLabel(s.escape)
			.setEmoji(this.Escape.HasJetpack ? ItemList[ItemId.Jetpack].Skin.Default.Emote.Id : EmoteId.Escape)
			.setDisabled(this.User.Escape.HasTried)
			.setStyle(ButtonStyle.Secondary);

		const buttonBribe = new ButtonBuilder()
			.setCustomId("bribe")
			.setLabel(s.bribe)
			.setEmoji(BadgeString.Season6.Politician)
			.setDisabled(this.User.Prison.HasPaidBribe)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonPrisoners);

		if (this.User.IsInPrison()) {
			row.addComponents(buttonEscape, buttonBribe);
		}

		const response = await replyInteraction(this.Interaction, { embeds: [embed], components: [row] });

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			idle: 30_000,
		});

		collector?.on("collect", async btn => {
			if (btn.customId === "prisoners") {
				buttonPrisoners.setDisabled(true);

				const pagination = new Pagination(this.Interaction, this.User.Language);

				pagination.HowManyRecords = prisoners.length;
				pagination.Limit = 15;

				const embedPrisoners = new CustomEmbedBuilder()
					.setTitle(s.prisoners);

				pagination.CustomizeEmbed = async () => {
					const users = prisoners.slice(pagination.Offset, pagination.Offset + pagination.Limit);

					users.forEach(prisoner => {
						embedPrisoners.addFields({
							name: `${ClassList[prisoner.class].Image.Emote.String} ${prisoner.nickname}`,
							value:`${s.free} ${showTime(new Date(prisoner.prisonTime).getTime(), true)}
-# ${s.howManyTimesPrison(prisoner.robberyFailureCount)}
-# ${s.howManyTimesEscape(prisoner.escapeCount)}`,
							inline: true,
						});
					});

					return embedPrisoners
						.setFooter({ text: pagination.Showing() });
				};

				await pagination.GenerateEmbed(embed);
			}
			else if (btn.customId === "escape") {
				buttonEscape.setDisabled(true);

				await this.User.GetInfo();

				const { canEscape, message } = await this.CanEscape();

				if (!canEscape) {
					return await replyInteraction(this.Interaction, {
						embeds: [defaultEmbed({
							interaction: this.Interaction,
							color: CrColors.Police,
							description: message,
							nickname: this.User.Nickname,
						})],
						components: [],
					});
				}

				const embed = await this.StartEscape();

				await wait(this.Escape.DefaultDuration * 1000);

				await this.EndEscape(embed);
			}
			else if (btn.customId === "bribe") {
				buttonBribe.setDisabled(true);

				await this.User.GetInfo();

				const { canBribe, message } = await this.CanBribe();

				if (!canBribe) {
					return await replyInteraction(this.Interaction, {
						embeds: [defaultEmbed({
							interaction: this.Interaction,
							color: CrColors.Police,
							description: message,
							nickname: this.User.Nickname,
						})],
						components: [],
					});
				}

				const atkFactor = (this.User.Attributes.Attack * (this.User.Attributes.Attack / 20)) ** 2;
				const moneyFactor = this.User.Money * (this.User.Escape.HasTried ? 0.1 : 0.05);
				this.Bribe.Value = Math.floor(this.Bribe.BaseValue + atkFactor + moneyFactor);

				const bribery = new CustomEmbedBuilder()
					.setAuthor({
						iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png",
						name: s.title,
					})
					.setColor(CrColors.Police)
					.setDescription(`### ${EmoteString.Police} ${s.bribe}\n${s.briberyStart(this.Bribe.Value)}`)
					.setUserFooter({
						nickname: this.User.Nickname,
						image: this.Interaction.user.avatarURL(),
						text: formatMoney(this.User.Money, this.User.Language)
					});

				const buttonConfirm = new ButtonBuilder()
					.setStyle(ButtonStyle.Success)
					.setLabel(s.confirm)
					.setDisabled(this.User.Money < this.Bribe.Value)
					.setCustomId("confirmBribe");

				row.setComponents(buttonConfirm);

				await replyInteraction(this.Interaction, { embeds: [bribery], components: [row] });
			}
			else if (btn.customId === "confirmBribe") {
				await this.User.GetInfo();

				const { canBribe, message } = await this.CanBribe();

				if (!canBribe) {
					return await replyInteraction(this.Interaction, {
						embeds: [defaultEmbed({
							interaction: this.Interaction,
							color: CrColors.Police,
							description: message,
							nickname: this.User.Nickname,
						})],
						components: [],
					});
				}

				const success = await this.PayBribery(this.Bribe.Value);

				const responseEmbed = new CustomEmbedBuilder()
					.setColor(CrColors.Police);

				if (success) {
					responseEmbed
						.setDescription(`### ${EmoteString.Police} ${s.briberyAccepted}\n${s.briberyAcceptedDescription}`)
						.setUserFooter({
							nickname: this.User.Nickname,
							image: this.Interaction.user.avatarURL(),
							text: s.briberyAcceptedFooter
						});
				}
				else {
					responseEmbed
						.setDescription(`### ${EmoteString.Police} ${s.briberyRejected}\n${s.briberyRejectedDescription}`)
						.setUserFooter({
							nickname: this.User.Nickname,
							image: this.Interaction.user.avatarURL(),
							text: s.briberyRejectedFooter
						});
				}

				return await replyInteraction(this.Interaction, { embeds: [responseEmbed], components: [] });
			}
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(this.Interaction);
		});
	}

	private async GetPrisoners() {
		return await Users.findAll({
			attributes: ["nickname", "class", "prisonTime", "robberyFailureCount", "escapeCount"],
			order: [["prisonTime", "DESC"]],
			where: {
				prisonTime: {
					[Op.gt]: new Date(),
				},
			},
		});
	}

	async CanEscape() {
		const s = Strings[this.User.Language];
		let canEscape = true;
		let message = "";

		if (!this.User.IsInPrison()) {
			message = s.bribeNotInPrison;
			canEscape = false;
		}
		if (this.User.Escape.HasTried) {
			message = s.escapeHasTried;
			canEscape = false;
		}
		if (this.User.IsEscaping()) {
			message = s.escapeEscaping;
			canEscape = false;
		}
		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById);
			message = s.escapeBeingRobbedBy(user?.nickname);
			canEscape = false;
		}

		return { canEscape, message };
	}

	async StartEscape() {
		const s = Strings[this.User.Language];
		const emote = this.Escape.HasJetpack ? ItemList[ItemId.Jetpack].Skin.Default.Emote.String : EmoteString.Escape;

		const escapeEmbed = new CustomEmbedBuilder()
			.setDescription(`### ${emote} ${s.escapeInProgress}`)
			.setAuthor({
				iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png",
				name: s.title,
			})
			// .setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png")
			.setColor(CrColors.Police)
			.setUserFooter({
				nickname: this.User.Nickname,
				image: this.Interaction.user.avatarURL(),
			});

		await replyInteraction(this.Interaction, { embeds: [escapeEmbed], components: [] });

		this.User.Escape.HasTried = true;
		this.User.Escape.Time = addSeconds(new Date(), this.Escape.DefaultDuration);

		await this.User.Update();
		Log.Info(`User ${this.User.Nickname} (ID: ${this.User.Id}) started a escape attempt from prison ${this.Escape.HasJetpack ? "with a jetpack" : ""}.`);

		return escapeEmbed;
	}

	async EndEscape(embed: CustomEmbedBuilder) {
		const s = Strings[this.User.Language];
		const emote = this.Escape.HasJetpack ? ItemList[ItemId.Jetpack].Skin.Default.Emote.String : EmoteString.Escape;

		await Notification.Dismiss(this.User.Id, NotificationType.Free);

		const baseTime = 15;
		const additionalTime = this.User.Attributes.Attack * 0.5;
		const totalTime = baseTime + additionalTime;

		const jetpack = `${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} ${ItemList[ItemId.Jetpack].Description[this.User.Language]}`;

		const chance = Math.floor(Math.random() * 101);
		const success = chance < this.Escape.TotalChance;

		const successTexts = {
			[Language.English]: [
				"During sunbathing, you take advantage of the distraction of the police and manage to escape by jumping over the prison wall.",
				"You dug a small tunnel, but with great effort, it allows you to escape.",
				"You noticed that your cellmate is digging a hole in the floor. Together you manage to escape.",
				"While being transferred from your cell, you notice some open gates and manage to escape.",
				"A detainee started a riot, and in the midst of the confusion, you manage to escape.",
			],
			[Language.Portuguese]: [
				"Durante o banho de sol você aproveita a distração dos policiais e consegue fugir pulando o muro da prisão",
				"Você cavou um túnel pequeno, mas que com muito esforço, te permite fugir",
				"Você percebeu que seu parceiro de cela está cavando um buraco no piso. Juntos vocês conseguiram fugir",
				"Enquanto te transferiam de cela, você percebe alguns portões abertos e consegue fugir",
				"Um detento começou uma rebelião, e no meio da confusão você consegue fugir",
			],
			[Language.Spanish]: [
				"Durante el baño de sol, aprovechas la distracción de los policías y logras escapar saltando el muro de la prisión.",
				"Cavaste un pequeño túnel, pero con mucho esfuerzo, te permite escapar.",
				"Notaste que tu compañero de celda está cavando un agujero en el piso. Juntos logran escapar.",
				"Durante tu traslado de celda, notas algunas puertas abiertas y logras escapar.",
				"Un detenido comenzó una revuelta, y en medio de la confusión, logras escapar.",
			],
		};

		const successTextsJetpack = {
			[Language.English]: [
				`Even with little fuel, your ${jetpack} worked very well, and you managed to escape`,
				`You used your ${jetpack}, and despite the difficulty, managed to escape without a scratch`,
				`Your ${jetpack} took a while to start and drew the attention of the police, but you managed to escape`,
				`During sunbathing, you simply turn on your ${jetpack} and fly away without any problems`,
				`You used the flames from your ${jetpack} to melt the iron bars of the window and managed to escape`,
			],
			[Language.Portuguese]: [
				`Mesmo com pouco combustível, sua ${jetpack} funcionou muito bem e você conseguiu fugir`,
				`Você utilizou sua ${jetpack} e apesar da dificuldade, consegue fugir sem sofrer nenhum arranhão`,
				`Sua ${jetpack} demorou pra pegar e chamou a atenção dos policiais, porém você consegue fugir`,
				`Durante o banho de sol você simplesmente liga sua ${jetpack} e foge voando sem problemas`,
				`Você usou as chamas da sua ${jetpack} para derreter as barras de ferro da janela e consegue fugir`,
			],
			[Language.Spanish]: [
				`A pesar de tener poco combustible, tu ${jetpack} funcionó muy bien y lograste escapar`,
				`Usaste tu ${jetpack} y, a pesar de la dificultad, lograste escapar sin ningún rasguño`,
				`Tu ${jetpack} tardó en arrancar y llamó la atención de la policía, pero lograste escapar`,
				`Durante el baño de sol, simplemente enciendes tu ${jetpack} y te escapas volando sin problemas`,
				`Usaste las llamas de tu ${jetpack} para derretir las barras de hierro de la ventana y lograste escapar`,
			],
		};

		const wantedTexts = {
			[Language.English]: [
				"but the police are on your tail!",
				"but the police have set the dogs to sniff you out!",
				"but the police are conducting searches!",
				"but the police have reported your disappearance!",
				"but the police are looking for you!",
			],
			[Language.Portuguese]: [
				"mas a polícia está na sua cola!",
				"mas a polícia colocou os cães para te farejar!",
				"mas a polícia está fazendo buscas!",
				"mas a polícia já informou seu desaparecimento!",
				"mas a polícia está te procurando!",
			],
			[Language.Spanish]: [
				"¡pero la policía está en tu cola!",
				"¡pero la policía ha puesto a los perros a olfatearte!",
				"¡pero la policía está haciendo búsquedas!",
				"¡pero la policía ya ha informado de tu desaparición!",
				"¡pero la policía te está buscando!",
			],
		};

		const failureTexts = {
			[Language.English]: [
				"You tried to start a riot to escape, but a snitch ratted you out",
				"You dug a small tunnel, but unfortunately the police discovered it",
				"You tried to take another inmate hostage, but he managed to escape and alert the police",
				"During sunbathing, you tried to cause a fight between gang members, the police did not like it",
				"You tried to saw the bars of the cell with a file, but ended up making too much noise and alerted the police",
			],
			[Language.Portuguese]: [
				"Você tentou iniciar uma rebelião para conseguir fugir, mas um X9 te denunciou",
				"Você cavou um túnel pequeno, mas infelizmente a polícia descobriu",
				"Você tentou fazer outro detento refém, mas ele conseguiu escapar e avisar os policiais",
				"Durante o banho de sol, você tentou causar uma briga entre membros de gangue, os policiais não gostaram",
				"Você tentou serrar as barras da cela com uma lima, mas acabou fazendo muito barulho e alertando os policiais",
			],
			[Language.Spanish]: [
				"Intentaste iniciar una revuelta para escapar, pero un chivato te delató",
				"Cavaste un pequeño túnel, pero lamentablemente la policía lo descubrió",
				"Intentaste tomar a otro detenido como rehén, pero logró escapar y avisar a los policías",
				"Durante el baño de sol, intentaste provocar una pelea entre miembros de bandas, a los policías no les gustó",
				"Intentaste serrar las barras de la celda con una lima, pero hiciste demasiado ruido y alertaste a los policías",
			],
		};

		const failureTextsJetpack = {
			[Language.English]: [
				`You tried to fly with your ${jetpack}, but it had little fuel, and you slowly descended to the police`,
				`You used your ${jetpack} to pass through the gates, but you were knocked down by a shock barrier`,
				`You try to start your ${jetpack} to escape, but alerted the police`,
				`You prepare to escape with your ${jetpack}, but another inmate alerted the police`,
				`You start to fly with the ${jetpack}, but other inmates cling to you in the hope of escaping together, and you are dragged to the ground`,
			],
			[Language.Portuguese]: [
				`Você tentou voar com sua ${jetpack}, mas ela estava com pouco combustível e você desceu lentamente até os policiais`,
				`Você usou sua ${jetpack} para passar pelos portões, mas foi derrubado por uma barreira de choque`,
				`Você tenta ligar sua ${jetpack} para fugir, mas alertou os policias`,
				`Você se prepara para fugir com sua ${jetpack}, mas outro detento avisou os policiais`,
				`Você começa a voar com a ${jetpack}, mas outros detentos se agarram em você na esperança de fugir juntos, mas você é arrastado para o chão`,
			],
			[Language.Spanish]: [
				`Intentaste volar con tu ${jetpack}, pero tenía poco combustible y descendiste lentamente hasta la policía`,
				`Usaste tu ${jetpack} para pasar por las puertas, pero fuiste derribado por una barrera de choque`,
				`Intentas encender tu ${jetpack} para escapar, pero alertaste a la policía`,
				`Te preparas para escapar con tu ${jetpack}, pero otro detenido avisó a la policía`,
				`Empiezas a volar con el ${jetpack}, pero otros detenidos se aferran a ti con la esperanza de escapar juntos, y eres arrastrado al suelo`,
			],
		};

		if (success) {
			this.User.Escape.Count += 1;
			this.User.Prison.Time = new Date();
			this.User.Wanted.Time = addMinutes(new Date(), this.Escape.TimeInMinutesWanted);

			await Notification.RobAgain(this.User);
			Log.Success(`User ${this.User.Nickname} (ID: ${this.User.Id}) successfully escaped from prison. Total escapes: ${this.User.Escape.Count}`);

			const arraySuccess = this.Escape.HasJetpack ? successTextsJetpack : successTexts;
			const textSuccess = arraySuccess[this.User.Language][Math.floor(Math.random() * arraySuccess[this.User.Language].length)];
			const textWanted = wantedTexts[this.User.Language][Math.floor(Math.random() * wantedTexts[this.User.Language].length)];

			embed
				.setDescription(`### ${emote} ${s.escapeSuccess}\n${textSuccess}\n-# ${textWanted}`)
				.setUserFooter({
					nickname: this.User.Nickname,
					image: this.Interaction.user.avatarURL(),
					text: s.escapeWaitMinutes(this.Escape.TimeInMinutesWanted)
				});
		}
		else {
			this.User.Prison.Time = addMinutes(this.User.Prison.Time, totalTime);

			await Notification.Free(this.User);
			Log.Success(`User ${this.User.Nickname} (ID: ${this.User.Id}) failed in his attempt to escape from prison. Will be in prison until ${this.User.Prison.Time}`);

			const arrayFailure = this.Escape.HasJetpack ? failureTextsJetpack : failureTexts;
			const textFailure = arrayFailure[this.User.Language][Math.floor(Math.random() * arrayFailure[this.User.Language].length)];

			embed.setDescription(`### ${emote} ${s.escapeFailure}\n${textFailure}. ${s.escapeWillBeInPrison(totalTime)}\n-# ${s.free} ${showTime(this.User.Prison.Time.getTime(), true)}`);
		}

		await this.User.Update();

		await replyInteraction(this.Interaction, { embeds: [embed] });
	}

	async CanBribe() {
		const s = Strings[this.User.Language];
		let canBribe = true;
		let message = "";

		if (this.User.Prison.HasPaidBribe) {
			message = s.bribeHasPaid;
			canBribe = false;
		}
		if (!this.User.IsInPrison()) {
			message = s.bribeNotInPrison;
			canBribe = false;
		}
		if (this.User.IsEscaping()) {
			message = s.bribeEscaping;
			canBribe = false;
		}
		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById);
			message = s.bribeBeingRobbedBy(user?.nickname);
			canBribe = false;
		}

		return { canBribe, message };
	}

	async PayBribery(bribeValue: number) {
		const chance = Math.floor(Math.random() * 101);
		const success = chance < 75;

		this.User.Money -= bribeValue;
		this.User.Prison.HasPaidBribe = true;
		this.User.Prison.BriberySum += bribeValue;
		this.User.Prison.BriberyCount += 1;

		if (success) {
			this.User.Prison.Time = new Date();
			this.User.Wanted.Time = addMinutes(new Date(), 30);

			await Promise.all([
				Notification.Dismiss(this.User.Id, NotificationType.Free),
				Notification.RobAgain(this.User),
			]);
		}

		await this.User.Update();
		Log.Success(`User ${this.User.Nickname} (ID: ${this.User.Id}) paid a bribe of ${formatMoney(bribeValue, Language.English)} to leave prison. Sucess: ${success}.`);

		return success;
	}
}

const Strings = {
	[Language.English]: {
		userFree: "You are free!",
		userWanted: (timerEscape: Date) => `You are being wanted by the police! You can rob again ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `You are in prison! You will be released ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		title: "Prison",
		description: (chance: number, jetpackChance: number, text: string) => `When trying to rob someone and failing, you will be imprisoned for a time determined by your ${EmoteString.Attack}ATK.

-# Being imprisoned limits many of your actions in the game, such as working, investing, betting, scavenging, and of course, stealing.
### ${EmoteString.Escape} Escape
You have a ${chance}% (${jetpackChance}% if you have a ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[Language.English]}**) chance of escaping from prison!
### ${BadgeString.Season6.Politician} Bribe
The guards are greedy, and the higher your ${EmoteString.Attack}ATK, the more they will ask for! They can also refuse your bribe, but they will keep your money.

-# ${text}`,
		currentChance: "Current chance",
		prisoners: "Prisoners",
		escape: "Escape",
		bribe: "Bribe",
		briberyStart: (value: number) => `_"We know you have some money hidden there... Give us **${formatMoney(value, Language.English)}** and we'll let you out quietly."_\n-# Confirm payment?`,
		briberyAccepted: "Bribery accepted",
		briberyAcceptedDescription: "_\"That's how it's done! Get out of here before anyone else sees you.\"_",
		briberyAcceptedFooter: "Wait 30 minutes to do something stupid",
		briberyRejected: "Bribery rejected",
		briberyRejectedDescription: "_\"Damn dude, you have to be really stupid to pay that amount and think we would release you.\"_",
		briberyRejectedFooter: "You will remain imprisoned",
		free: "Free",
		confirm: "Confirm",
		howManyTimesPrison: (times: number) => `Imprisoned \`${times}\` times`,
		howManyTimesEscape: (times: number) => `Escaped \`${times}\` times`,
		escapeHasTried: `The police are watching you! ${EmoteString.Police}\n-# You won't be able to escape`,
		escapeEscaping: `You are already trying to escape! ${EmoteString.Escape}\n-# This kind of thing requires patience`,
		escapeBeingRobbedBy: (nickname: CreationOptional<string> | undefined) => `You are being robbed by **${nickname}** and cannot escape! ${EmoteString.Robbery}`,
		bribeHasPaid: `We won't accept anything from you, smartass! ${EmoteString.Police}\n-# "Maybe next time you stop being an idiot"`,
		bribeNotInPrison: `You are not in prison! ${EmoteString.Prison}\n-# "But we can lock you in. What do you think?"`,
		bribeEscaping: `You are trying to escape and cannot bribe! ${EmoteString.Escape}\n-# Focus!`,
		bribeBeingRobbedBy: (nickname: CreationOptional<string> | undefined) => `You are being robbed by **${nickname}** and cannot bribe! ${EmoteString.Robbery}`,
		escapeInProgress: "Escape in progress...",
		escapeSuccess: "Successful escape!",
		escapeFailure: "Failed escape!",
		escapeWaitMinutes: (minutes: number) => `Wait ${minutes} minutes to steal again`,
		escapeWillBeInPrison: (minutes: number) => `You will be imprisoned for another ${minutes} minutes.`,
	},
	[Language.Portuguese]: {
		userFree: "Você está livre!",
		userWanted: (timerEscape: Date) => `Você está sendo procurado pela polícia! Poderá roubar novamente ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `Você está preso! Será solto ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		title: "Prisão",
		description: (chance: number, jetpackChance: number, text: string) => `Ao tentar roubar alguém e falhar, você será preso por um tempo determinado pelo seu ${EmoteString.Attack}ATK.

-# Estar preso limita muitas de suas ações no jogo, como trabalhar, investir, apostar, vasculhar, e claro, roubar.
### ${EmoteString.Escape} Fugir
Você tem ${chance}% (${jetpackChance}% se possuir uma ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[Language.Portuguese]}**) de chance de fugir da prisão!
### ${BadgeString.Season6.Politician} Subornar
Os guardas são gananciosos, e quanto maior o seu ${EmoteString.Attack}ATK, mais eles pedirão! Eles também podem recusar seu suborno, mas ficarão com seu dinheiro.

-# ${text}`,
		currentChance: "Chance atual",
		prisoners: "Prisioneiros",
		escape: "Fugir",
		bribe: "Subornar",
		briberyStart: (value: number) => `_"Sabemos que você tem um certo dinheiro escondido aí... Nos dê **${formatMoney(value, Language.Portuguese)}** e deixaremos você sair de fininho."_\n-# Confirmar pagamento?`,
		briberyAccepted: "Suborno aceito",
		briberyAcceptedDescription: "_\"Assim que se faz! Caia fora daqui antes que mais alguém te veja.\"_",
		briberyAcceptedFooter: "Espere 30 minutos para fazer alguma besteira",
		briberyRejected: "Suborno recusado",
		briberyRejectedDescription: "_\"Caralho mané, tu tem que ser muito burro pra pagar esse valor e achar que iríamos te liberar.\"_",
		briberyRejectedFooter: "Você continuará preso",
		free: "Livre",
		confirm: "Confirmar",
		howManyTimesPrison: (times: number) => `Preso \`${times}\` vezes`,
		howManyTimesEscape: (times: number) => `Fugiu \`${times}\` vezes`,
		escapeHasTried: `Os policiais estão te observando! ${EmoteString.Police}\n-# Você não conseguirá fugir`,
		escapeEscaping: `Você já está tentando fugir! ${EmoteString.Escape}\n-# Este tipo de coisa pede paciência`,
		escapeBeingRobbedBy: (nickname: CreationOptional<string> | undefined) => `Você está sendo roubado por **${nickname}** e não pode fugir! ${EmoteString.Robbery}`,
		bribeHasPaid: `Não aceitaremos nada vindo de você, espertalhão! ${EmoteString.Police}\n-# "Quem sabe na próxima tu deixa de ser idiota"`,
		bribeNotInPrison: `Você não está preso! ${EmoteString.Prison}\n-# "Mas podemos te prender. O que acha?"`,
		bribeEscaping: `Você está tentando escapar e não pode subornar! ${EmoteString.Escape}\n-# "Foco!"`,
		bribeBeingRobbedBy: (nickname: CreationOptional<string> | undefined) => `Você está sendo roubado por **${nickname}** e não pode subornar! ${EmoteString.Robbery}`,
		escapeInProgress: "Fuga em andamento...",
		escapeSuccess: "Fuga bem-sucedida!",
		escapeFailure: "Fuga fracassada!",
		escapeWaitMinutes: (minutes: number) => `Espere ${minutes} minutos para roubar novamente`,
		escapeWillBeInPrison: (minutes: number) => `Você ficará preso por mais ${minutes} minutos.`,
	},
	[Language.Spanish]: {
		userFree: "¡Estás libre!",
		userWanted: (timerEscape: Date) => `¡Estás siendo buscado por la policía! ¡Puedes robar de nuevo ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `¡Estás preso! ¡Serás liberado ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		title: "Prisión",
		description: (chance: number, jetpackChance: number, text: string) => `Al intentar robar a alguien y fallar, serás encarcelado por un tiempo determinado por tu ${EmoteString.Attack}ATK.

-# Estar encarcelado limita muchas de tus acciones en el juego, como trabajar, invertir, apostar, buscar, y por supuesto, robar.
### ${EmoteString.Escape} Escapar
Tienes un ${chance}% (${jetpackChance}% si tienes un ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[Language.Spanish]}**) de escapar de la prisión!
### ${BadgeString.Season6.Politician} Sobornar
Los guardias son codiciosos, y cuanto mayor sea tu ${EmoteString.Attack}ATK, más te pedirán! También pueden rechazar tu soborno, pero se quedarán con tu dinero.

-# ${text}`,
		currentChance: "Chance actual",
		prisoners: "Prisioneros",
		escape: "Escapar",
		bribe: "Sobornar",
		briberyStart: (value: number) => `_"Sabemos que tienes algo de dinero escondido ahí... Danos **${formatMoney(value, Language.Spanish)}** y te dejaremos salir en silencio."_\n-# ¿Confirmar pago?`,
		briberyAccepted: "Soborno aceptado",
		briberyAcceptedDescription: "_\"¡Así se hace! ¡Lárgate de aquí antes de que alguien más te vea!\"_",
		briberyAcceptedFooter: "Espera 30 minutos para hacer alguna tontería",
		briberyRejected: "Soborno rechazado",
		briberyRejectedDescription: "_\"¡Joder tío, tienes que ser muy tonto para pagar esa cantidad y pensar que te liberaríamos!\"_",
		briberyRejectedFooter: "Permanecerás encarcelado",
		free: "Libre",
		confirm: "Confirmar",
		howManyTimesPrison: (times: number) => `Encarcelado \`${times}\` veces`,
		howManyTimesEscape: (times: number) => `Huyó \`${times}\` veces`,
		escapeHasTried: `¡La policía te está observando! ${EmoteString.Police}\n-# No podrás escapar`,
		escapeEscaping: `¡Ya estás intentando escapar! ${EmoteString.Escape}\n-# Este tipo de cosas requiere paciencia`,
		escapeBeingRobbedBy: (nickname: CreationOptional<string> | undefined) => `¡Estás siendo robado por **${nickname}** y no puedes escapar! ${EmoteString.Robbery}`,
		bribeHasPaid: `¡No aceptaremos nada de ti, listillo! ${EmoteString.Police}\n-# "Quizás la próxima vez dejas de ser idiota"`,
		bribeNotInPrison: `¡No estás en la cárcel! ${EmoteString.Prison}\n-# "Pero podemos encerrarte. ¿Qué te parece?"`,
		bribeEscaping: `¡Estás intentando escapar y no puedes sobornar! ${EmoteString.Escape}\n-# "¡Enfócate!"`,
		bribeBeingRobbedBy: (nickname: CreationOptional<string> | undefined) => `¡Estás siendo robado por **${nickname}** y no puedes sobornar! ${EmoteString.Robbery}`,
		escapeInProgress: "¡Fuga en progreso...",
		escapeSuccess: "Fuga exitosa!",
		escapeFailure: "Fuga fallida!",
		escapeWaitMinutes: (minutes: number) => `Espera ${minutes} minutos para robar de nuevo`,
		escapeWillBeInPrison: (minutes: number) => `Permanecerás encarcelado por otros ${minutes} minutos.`,
	},
} as const;