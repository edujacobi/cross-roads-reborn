import { User } from "./User";
import { Language } from "./Language";
import { UserRepository } from "#core/repositories/UserRepository";
import { formatMoney } from "#bot/utils/ui";
import { ClassId, getPrisonBribeClassModifier, getPrisonEscapeClassModifier } from "#core/types/Classes";
import { addMinutes, addSeconds } from "date-fns";
import { Log } from "#shared/log";
import { Notification, NotificationType } from "./Notification";
import { ItemId } from "#core/types/Ids";
import { ItemList } from "#core/types/Items";
import { GangBases } from "#core/types/GangBases";
import { Gang } from "./Gang";
import { Event, EventType } from "./Event";

export enum PrisonFailureReason {
	BribeNotInPrison,
	EscapeHasTried,
	EscapeEscaping,
	AttackerIsBeingRobbedById,
	AttackerIsBeatingId,
	AttackerIsBeingBeatedById,
	BribeHasPaid,
	BribeEscaping,
	EscapeInHospital,
	BribeInHospital,
}

const activeEscapes = new Map<string, { userId: string; timer: NodeJS.Timeout }>();

export function cleanupActiveEscapes() {
	for (const [userId, data] of activeEscapes.entries()) {
		clearTimeout(data.timer);
		activeEscapes.delete(userId);
	}
}

export class Prison {
	User: User;

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
	};

	static BribeTimeInMinutesWanted = 40;
	static EscapeTimeInMinutesWanted = 40;

	static async Arrest(user: User, durationInMinutes: number, { isFromRobbery = true }: {
		isFromRobbery?: boolean
	} = {}) {
		const prisonTimeMultiplier = await Event.GetActiveFromType(EventType.PRISON_TIME_MULTIPLIER);

		const factor = user.Class === ClassId.Thief ? 1.15 : 1.0;
		const jailDuration = Math.floor(durationInMinutes * factor * prisonTimeMultiplier);

		user.Prison.Time = addMinutes(new Date(), jailDuration);
		user.Prison.Count += 1;
		user.Prison.HasPaidBribe = false;
		user.Escape.HasTried = false;

		if (isFromRobbery) {
			user.Robbery.FailureCount += 1;
		}

		await user.Update({
			prisonTime: user.Prison.Time,
			prisonCount: user.Prison.Count,
			robberyFailureCount: user.Robbery.FailureCount,
			escapeHasTried: user.Escape.HasTried,
			prisonHasPaidBribe: user.Prison.HasPaidBribe,
		});

		Log.Info(`User ${user.Nickname} (Id: ${user.Id}) was arrested for ${jailDuration} minutes. ${isFromRobbery ? "From robbery" : ""}`);
	}

	constructor(user: User) {
		this.User = user;
	}

	async getGangEscapeModifier(): Promise<number> {
		if (!this.User.GangId) return 0;
		const gang = await Gang.GetById(this.User.GangId);
		if (!gang) return 0;
		return (GangBases[gang.BaseId].Modifier?.PrisonEscape?.Positive || 0) * gang.Level;
	}

	calculateTotalTime(): number {
		const baseTime = 15;
		const additionalTime = this.User.Attributes.Attack * 0.5;
		return baseTime + additionalTime;
	}

	async CalculateEscapeChance() {
		const jetpack = await this.User.GetSpecificItem(ItemId.Jetpack);
		this.Escape.HasJetpack = jetpack.RemainingTime > new Date();

		const userClassModifier = getPrisonEscapeClassModifier(this.User.Class);
		const gangModifier = await this.getGangEscapeModifier();

		const prisonEscapeChanceBonus = await Event.GetActiveBonusFromType(EventType.PRISON_ESCAPE_CHANCE_BONUS);
		this.Escape.UserChance = this.Escape.HasJetpack ? this.Escape.BaseJetpackChance : 0;
		this.Escape.TotalChance = this.Escape.BaseChance + this.Escape.UserChance + userClassModifier + gangModifier + prisonEscapeChanceBonus;
	}

	async GetPrisoners() {
		return await UserRepository.FindAllPrisoners();
	}

	async CanEscape() {
		if (!this.User.IsInPrison()) {
			return { canEscape: false, reason: PrisonFailureReason.BribeNotInPrison };
		}
		if (this.User.IsInHospital()) {
			return { canEscape: false, reason: PrisonFailureReason.EscapeInHospital };
		}
		if (this.User.Escape.HasTried) {
			return { canEscape: false, reason: PrisonFailureReason.EscapeHasTried };
		}
		if (this.User.IsEscaping()) {
			return { canEscape: false, reason: PrisonFailureReason.EscapeEscaping };
		}
		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await UserRepository.FindById(this.User.Robbery.IsBeingRobbedById, ["nickname", "class"]);
			return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeingRobbedById, attacker: user };
		}
		if (this.User.BeatUp.IsBeatingId) {
			const user = await UserRepository.FindById(this.User.BeatUp.IsBeatingId, ["nickname", "class"]);
			return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeatingId, attacker: user };
		}
		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await UserRepository.FindById(this.User.BeatUp.IsBeingBeatUpById, ["nickname", "class"]);
			return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeingBeatedById, attacker: user };
		}

		return { canEscape: true };
	}

	async StartEscape() {
		this.User.Escape.HasTried = true;
		this.User.Escape.Time = addSeconds(new Date(), this.Escape.DefaultDuration);

		await this.User.Update({
			escapeHasTried: this.User.Escape.HasTried,
			escapeTime: this.User.Escape.Time,
		});
		Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) started a escape attempt from prison ${this.Escape.HasJetpack ? "with a jetpack" : ""}.`);

		// Schedule automatic escape end
		const userId = this.User.Id;
		const durationMs = this.Escape.DefaultDuration * 1_000;
		const timer = setTimeout(async () => {
			activeEscapes.delete(userId);
			try {
				const user = new User(userId);
				const found = await user.GetInfo();
				if (found && user.IsEscaping()) {
					const prison = new Prison(user);
					await prison.CalculateEscapeChance();
					await prison.EndEscape();
					Log.Info(`Auto-ended escape for user ${user.Nickname} (Id: ${userId})`);
				}
			}
			catch (err) {
				Log.Error(`Failed to auto-end escape for user ${userId}: ${err}`);
			}
		}, durationMs);
		activeEscapes.set(userId, { userId, timer });
	}

	async EndEscape(): Promise<{ success: boolean; totalTime: number; message: string }> {
		if (!this.User.IsEscaping()) {
			return { success: false, totalTime: 0, message: "Você não está tentando fugir." };
		}

		await Notification.Dismiss(this.User.Id, NotificationType.Free);

		const totalTime = this.calculateTotalTime();

		const chance = Math.floor(Math.random() * 101);
		const userClassModifier = getPrisonEscapeClassModifier(this.User.Class);
		const gangModifier = await this.getGangEscapeModifier();
		const ESCAPE_CHANCE = this.Escape.TotalChance + userClassModifier + gangModifier;
		const success = chance < ESCAPE_CHANCE;

		if (success) {
			this.User.Escape.Count += 1;
			this.User.Prison.Time = new Date();
			const wantedTimeMultiplier = await Event.GetActiveFromType(EventType.WANTED_TIME_MULTIPLIER);
			this.User.Wanted.Time = addMinutes(new Date(), Prison.EscapeTimeInMinutesWanted * wantedTimeMultiplier);

			await Notification.RobAgain(this.User);
			Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) successfully escaped from prison. Total escapes: ${this.User.Escape.Count}`);
		}
		else {
			const prisonTimeMultiplier = await Event.GetActiveFromType(EventType.PRISON_TIME_MULTIPLIER);
			this.User.Prison.Time = addMinutes(this.User.Prison.Time, totalTime * prisonTimeMultiplier);

			await Notification.Free(this.User);
			Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) failed in his attempt to escape from prison. Will be in prison until ${this.User.Prison.Time}`);
		}

		await this.User.Update({
			escapeCount: this.User.Escape.Count,
			prisonTime: this.User.Prison.Time,
			wantedTime: this.User.Wanted.Time,
		});

		const message = this.generateEscapeMessage(success, totalTime, this.User.Language);

		return { success, totalTime, message };
	}

	generateEscapeMessage(success: boolean, totalTime: number, language: Language): string {
		const jetpack = ItemList[ItemId.Jetpack].Description[language];

		const successTexts: Record<Language, string[]> = {
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

		const successTextsJetpack: Record<Language, string[]> = {
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

		const wantedTexts: Record<Language, string[]> = {
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

		const failureTexts: Record<Language, string[]> = {
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

		const failureTextsJetpack: Record<Language, string[]> = {
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

		const failureWillBeInPrison: Record<Language, string> = {
			[Language.English]: `You will be imprisoned for another ${totalTime} minutes.`,
			[Language.Portuguese]: `Você ficará preso por mais ${totalTime} minutos.`,
			[Language.Spanish]: `Permanecerás encarcelado por otros ${totalTime} minutos.`,
		};

		if (success) {
			const arraySuccess = this.Escape.HasJetpack ? successTextsJetpack : successTexts;
			const textSuccess = arraySuccess[language][Math.floor(Math.random() * arraySuccess[language].length)];
			const textWanted = wantedTexts[language][Math.floor(Math.random() * wantedTexts[language].length)];
			return `${textSuccess} ${textWanted}`;
		}

		const arrayFailure = this.Escape.HasJetpack ? failureTextsJetpack : failureTexts;
		const textFailure = arrayFailure[language][Math.floor(Math.random() * arrayFailure[language].length)];
		return `${textFailure}. ${failureWillBeInPrison[language]}`;
	}

	async CanBribe() {
		if (this.User.Prison.HasPaidBribe) {
			return { canBribe: false, reason: PrisonFailureReason.BribeHasPaid };
		}
		if (!this.User.IsInPrison()) {
			return { canBribe: false, reason: PrisonFailureReason.BribeNotInPrison };
		}
		if (this.User.IsInHospital()) {
			return { canBribe: false, reason: PrisonFailureReason.BribeInHospital };
		}
		if (this.User.IsEscaping()) {
			return { canBribe: false, reason: PrisonFailureReason.BribeEscaping };
		}
		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await UserRepository.FindById(this.User.Robbery.IsBeingRobbedById, ["nickname", "class"]);
			return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeingRobbedById, attacker: user };
		}
		if (this.User.BeatUp.IsBeatingId) {
			const user = await UserRepository.FindById(this.User.BeatUp.IsBeatingId, ["nickname", "class"]);
			return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeatingId, attacker: user };
		}
		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await UserRepository.FindById(this.User.BeatUp.IsBeingBeatUpById, ["nickname", "class"]);
			return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeingBeatedById, attacker: user };
		}

		return { canBribe: true };
	}

	CalculateBribeValue() {
		const atkFactor = (this.User.Attributes.Attack * (this.User.Attributes.Attack / 20)) ** 2;
		const moneyFactor = this.User.Money * (this.User.Escape.HasTried ? 0.1 : 0.05);
		this.Bribe.Value = Math.floor(this.Bribe.BaseValue + atkFactor + moneyFactor);
		return this.Bribe.Value;
	}

	async PayBribery(bribeValue: number) {
		if (this.User.Prison.HasPaidBribe || !this.User.IsInPrison()) {
			return false;
		}

		const chance = Math.floor(Math.random() * 101);
		const userClassModifier = getPrisonBribeClassModifier(this.User.Class);
		const BRIBE_CHANCE = 75 + userClassModifier;
		const success = chance < BRIBE_CHANCE;

		this.User.Money -= bribeValue;
		this.User.Prison.HasPaidBribe = true;
		this.User.Prison.BriberySum += bribeValue;
		this.User.Prison.BriberyCount += 1;

		if (success) {
			this.User.Prison.Time = new Date();
			const wantedTimeMultiplier = await Event.GetActiveFromType(EventType.WANTED_TIME_MULTIPLIER);
			this.User.Wanted.Time = addMinutes(new Date(), Prison.BribeTimeInMinutesWanted * wantedTimeMultiplier);

			await Promise.all([
				Notification.Dismiss(this.User.Id, NotificationType.Free),
				Notification.RobAgain(this.User),
			]);
		}

		await this.User.Update({
			money: this.User.Money,
			prisonHasPaidBribe: this.User.Prison.HasPaidBribe,
			prisonBriberySum: this.User.Prison.BriberySum,
			prisonBriberyCount: this.User.Prison.BriberyCount,
			prisonTime: this.User.Prison.Time,
			wantedTime: this.User.Wanted.Time,
		});
		Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) paid a bribe of ${formatMoney(bribeValue, Language.English)} to leave prison. Sucess: ${success}.`);

		return success;
	}
}
