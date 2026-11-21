"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prison = exports.PrisonFailureReason = void 0;
exports.cleanupActiveEscapes = cleanupActiveEscapes;
const User_1 = require("./User");
const Language_1 = require("./Language");
const UserRepository_1 = require("#core/repositories/UserRepository");
const ui_1 = require("#bot/utils/ui");
const Classes_1 = require("#core/types/Classes");
const date_fns_1 = require("date-fns");
const log_1 = require("#shared/log");
const Notification_1 = require("./Notification");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
const GangBases_1 = require("#core/types/GangBases");
const Gang_1 = require("./Gang");
const Event_1 = require("./Event");
var PrisonFailureReason;
(function (PrisonFailureReason) {
    PrisonFailureReason[PrisonFailureReason["BribeNotInPrison"] = 0] = "BribeNotInPrison";
    PrisonFailureReason[PrisonFailureReason["EscapeHasTried"] = 1] = "EscapeHasTried";
    PrisonFailureReason[PrisonFailureReason["EscapeEscaping"] = 2] = "EscapeEscaping";
    PrisonFailureReason[PrisonFailureReason["AttackerIsBeingRobbedById"] = 3] = "AttackerIsBeingRobbedById";
    PrisonFailureReason[PrisonFailureReason["AttackerIsBeatingId"] = 4] = "AttackerIsBeatingId";
    PrisonFailureReason[PrisonFailureReason["AttackerIsBeingBeatedById"] = 5] = "AttackerIsBeingBeatedById";
    PrisonFailureReason[PrisonFailureReason["BribeHasPaid"] = 6] = "BribeHasPaid";
    PrisonFailureReason[PrisonFailureReason["BribeEscaping"] = 7] = "BribeEscaping";
    PrisonFailureReason[PrisonFailureReason["EscapeInHospital"] = 8] = "EscapeInHospital";
    PrisonFailureReason[PrisonFailureReason["BribeInHospital"] = 9] = "BribeInHospital";
})(PrisonFailureReason || (exports.PrisonFailureReason = PrisonFailureReason = {}));
const activeEscapes = new Map();
let recoveryTimer;
let isRecovering = false;
function cleanupActiveEscapes() {
    clearInterval(recoveryTimer);
    recoveryTimer = undefined;
    for (const [userId, data] of activeEscapes.entries()) {
        clearTimeout(data.timer);
        activeEscapes.delete(userId);
    }
}
class Prison {
    User;
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
    static async Initialize() {
        if (recoveryTimer)
            return;
        recoveryTimer = setInterval(() => Prison.RecoverPendingEscapes(), 5_000);
        recoveryTimer.unref();
        await Prison.RecoverPendingEscapes();
    }
    static async RecoverPendingEscapes() {
        if (isRecovering)
            return;
        isRecovering = true;
        try {
            const pending = await UserRepository_1.UserRepository.FindOverdueEscapes();
            for (const { id } of pending) {
                try {
                    const user = await new User_1.User(id).GetInfo();
                    if (!user)
                        continue;
                    const prison = new Prison(user);
                    await prison.CalculateEscapeChance();
                    await prison.EndEscape();
                }
                catch (err) {
                    log_1.Log.Error(`Failed to recover escape for user ${id}: ${err}`);
                }
            }
        }
        catch (err) {
            log_1.Log.Error(`Failed to find overdue escapes: ${err}`);
        }
        finally {
            isRecovering = false;
        }
    }
    static async Arrest(user, durationInMinutes, { isFromRobbery = true } = {}) {
        const prisonTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.PRISON_TIME_MULTIPLIER);
        const factor = user.Class === Classes_1.ClassId.Thief ? 1.15 : 1.0;
        const jailDuration = Math.floor(durationInMinutes * factor * prisonTimeMultiplier);
        user.Prison.Time = (0, date_fns_1.addMinutes)(new Date(), jailDuration);
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
        log_1.Log.Info(`User ${user.Nickname} (Id: ${user.Id}) was arrested for ${jailDuration} minutes. ${isFromRobbery ? "From robbery" : ""}`);
    }
    constructor(user) {
        this.User = user;
    }
    async getGangEscapeModifier() {
        if (!this.User.GangId)
            return 0;
        const gang = await Gang_1.Gang.GetById(this.User.GangId);
        if (!gang)
            return 0;
        return (GangBases_1.GangBases[gang.BaseId].Modifier?.PrisonEscape?.Positive || 0) * gang.Level;
    }
    calculateTotalTime() {
        const baseTime = 15;
        const additionalTime = this.User.Attributes.Attack * 0.5;
        return baseTime + additionalTime;
    }
    async CalculateEscapeChance() {
        const jetpack = await this.User.GetSpecificItem(Ids_1.ItemId.Jetpack);
        this.Escape.HasJetpack = jetpack.RemainingTime > new Date();
        const userClassModifier = (0, Classes_1.getPrisonEscapeClassModifier)(this.User.Class);
        const gangModifier = await this.getGangEscapeModifier();
        const prisonEscapeChanceBonus = await Event_1.Event.GetActiveBonusFromType(Event_1.EventType.PRISON_ESCAPE_CHANCE_BONUS);
        this.Escape.UserChance = this.Escape.HasJetpack ? this.Escape.BaseJetpackChance : 0;
        this.Escape.TotalChance = this.Escape.BaseChance + this.Escape.UserChance + userClassModifier + gangModifier + prisonEscapeChanceBonus;
    }
    async GetPrisoners() {
        return await UserRepository_1.UserRepository.FindAllPrisoners();
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
            const user = await UserRepository_1.UserRepository.FindById(this.User.Robbery.IsBeingRobbedById, ["nickname", "class"]);
            return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeingRobbedById, attacker: user };
        }
        if (this.User.BeatUp.IsBeatingId) {
            const user = await UserRepository_1.UserRepository.FindById(this.User.BeatUp.IsBeatingId, ["nickname", "class"]);
            return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeatingId, attacker: user };
        }
        if (this.User.BeatUp.IsBeingBeatUpById) {
            const user = await UserRepository_1.UserRepository.FindById(this.User.BeatUp.IsBeingBeatUpById, ["nickname", "class"]);
            return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeingBeatedById, attacker: user };
        }
        return { canEscape: true };
    }
    async StartEscape() {
        const escapeTime = (0, date_fns_1.addSeconds)(new Date(), this.Escape.DefaultDuration);
        if (!await UserRepository_1.UserRepository.TryStartEscape(this.User.Id, escapeTime))
            return false;
        this.User.Escape.HasTried = true;
        this.User.Escape.Time = escapeTime;
        log_1.Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) started a escape attempt from prison ${this.Escape.HasJetpack ? "with a jetpack" : ""}.`);
        // Schedule automatic escape end
        const userId = this.User.Id;
        const durationMs = this.Escape.DefaultDuration * 1_000;
        const timer = setTimeout(async () => {
            activeEscapes.delete(userId);
            try {
                const user = new User_1.User(userId);
                const found = await user.GetInfo();
                if (found && user.Escape.HasTried && user.Escape.Time <= new Date()) {
                    const prison = new Prison(user);
                    await prison.CalculateEscapeChance();
                    const result = await prison.EndEscape();
                    if (result)
                        log_1.Log.Info(`Auto-ended escape for user ${user.Nickname} (Id: ${userId})`);
                }
            }
            catch (err) {
                log_1.Log.Error(`Failed to auto-end escape for user ${userId}: ${err}`);
            }
        }, durationMs);
        activeEscapes.set(userId, { userId, timer });
        return true;
    }
    async EndEscape() {
        const escapeTime = this.User.Escape.Time.getTime();
        if (!this.User.Escape.HasTried || escapeTime <= 0 || escapeTime > Date.now()) {
            return null;
        }
        let totalTime = this.calculateTotalTime();
        let prisonTime;
        let wantedTime = this.User.Wanted.Time;
        let escapeCount = this.User.Escape.Count;
        const chance = Math.floor(Math.random() * 101);
        const userClassModifier = (0, Classes_1.getPrisonEscapeClassModifier)(this.User.Class);
        const gangModifier = await this.getGangEscapeModifier();
        const ESCAPE_CHANCE = this.Escape.TotalChance + userClassModifier + gangModifier;
        const success = chance < ESCAPE_CHANCE;
        if (success) {
            escapeCount += 1;
            prisonTime = new Date();
            const wantedTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.WANTED_TIME_MULTIPLIER);
            wantedTime = (0, date_fns_1.addMinutes)(new Date(), Prison.EscapeTimeInMinutesWanted * wantedTimeMultiplier);
        }
        else {
            const prisonTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.PRISON_TIME_MULTIPLIER);
            totalTime *= prisonTimeMultiplier;
            prisonTime = (0, date_fns_1.addMinutes)(new Date(Math.max(Date.now(), this.User.Prison.Time.getTime())), totalTime);
        }
        const saved = await UserRepository_1.UserRepository.TryEndEscape(this.User.Id, this.User.Escape.Time, this.User.Prison.Time, {
            escapeCount,
            escapeTime: new Date(0),
            prisonTime,
            wantedTime,
        });
        if (!saved)
            return null;
        this.User.Escape.Count = escapeCount;
        this.User.Escape.Time = new Date(0);
        this.User.Prison.Time = prisonTime;
        this.User.Wanted.Time = wantedTime;
        if (success) {
            await Notification_1.Notification.Dismiss(this.User.Id, Notification_1.NotificationType.Free);
            await Notification_1.Notification.RobAgain(this.User);
            log_1.Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) successfully escaped from prison. Total escapes: ${escapeCount}`);
        }
        else {
            await Notification_1.Notification.Free(this.User);
            log_1.Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) failed in his attempt to escape from prison. Will be in prison until ${prisonTime}`);
        }
        const message = this.generateEscapeMessage(success, totalTime, this.User.Language);
        return { success, totalTime, message };
    }
    generateEscapeMessage(success, totalTime, language) {
        const jetpack = Items_1.ItemList[Ids_1.ItemId.Jetpack].Description[language];
        const successTexts = {
            [Language_1.Language.English]: [
                "During sunbathing, you take advantage of the distraction of the police and manage to escape by jumping over the prison wall.",
                "You dug a small tunnel, but with great effort, it allows you to escape.",
                "You noticed that your cellmate is digging a hole in the floor. Together you manage to escape.",
                "While being transferred from your cell, you notice some open gates and manage to escape.",
                "A detainee started a riot, and in the midst of the confusion, you manage to escape.",
            ],
            [Language_1.Language.Portuguese]: [
                "Durante o banho de sol você aproveita a distração dos policiais e consegue fugir pulando o muro da prisão",
                "Você cavou um túnel pequeno, mas que com muito esforço, te permite fugir",
                "Você percebeu que seu parceiro de cela está cavando um buraco no piso. Juntos vocês conseguiram fugir",
                "Enquanto te transferiam de cela, você percebe alguns portões abertos e consegue fugir",
                "Um detento começou uma rebelião, e no meio da confusão você consegue fugir",
            ],
            [Language_1.Language.Spanish]: [
                "Durante el baño de sol, aprovechas la distracción de los policías y logras escapar saltando el muro de la prisión.",
                "Cavaste un pequeño túnel, pero con mucho esfuerzo, te permite escapar.",
                "Notaste que tu compañero de celda está cavando un agujero en el piso. Juntos logran escapar.",
                "Durante tu traslado de celda, notas algunas puertas abiertas y logras escapar.",
                "Un detenido comenzó una revuelta, y en medio de la confusión, logras escapar.",
            ],
        };
        const successTextsJetpack = {
            [Language_1.Language.English]: [
                `Even with little fuel, your ${jetpack} worked very well, and you managed to escape`,
                `You used your ${jetpack}, and despite the difficulty, managed to escape without a scratch`,
                `Your ${jetpack} took a while to start and drew the attention of the police, but you managed to escape`,
                `During sunbathing, you simply turn on your ${jetpack} and fly away without any problems`,
                `You used the flames from your ${jetpack} to melt the iron bars of the window and managed to escape`,
            ],
            [Language_1.Language.Portuguese]: [
                `Mesmo com pouco combustível, sua ${jetpack} funcionou muito bem e você conseguiu fugir`,
                `Você utilizou sua ${jetpack} e apesar da dificuldade, consegue fugir sem sofrer nenhum arranhão`,
                `Sua ${jetpack} demorou pra pegar e chamou a atenção dos policiais, porém você consegue fugir`,
                `Durante o banho de sol você simplesmente liga sua ${jetpack} e foge voando sem problemas`,
                `Você usou as chamas da sua ${jetpack} para derreter as barras de ferro da janela e consegue fugir`,
            ],
            [Language_1.Language.Spanish]: [
                `A pesar de tener poco combustible, tu ${jetpack} funcionó muy bien y lograste escapar`,
                `Usaste tu ${jetpack} y, a pesar de la dificultad, lograste escapar sin ningún rasguño`,
                `Tu ${jetpack} tardó en arrancar y llamó la atención de la policía, pero lograste escapar`,
                `Durante el baño de sol, simplemente enciendes tu ${jetpack} y te escapas volando sin problemas`,
                `Usaste las llamas de tu ${jetpack} para derretir las barras de hierro de la ventana y lograste escapar`,
            ],
        };
        const wantedTexts = {
            [Language_1.Language.English]: [
                "but the police are on your tail!",
                "but the police have set the dogs to sniff you out!",
                "but the police are conducting searches!",
                "but the police have reported your disappearance!",
                "but the police are looking for you!",
            ],
            [Language_1.Language.Portuguese]: [
                "mas a polícia está na sua cola!",
                "mas a polícia colocou os cães para te farejar!",
                "mas a polícia está fazendo buscas!",
                "mas a polícia já informou seu desaparecimento!",
                "mas a polícia está te procurando!",
            ],
            [Language_1.Language.Spanish]: [
                "¡pero la policía está en tu cola!",
                "¡pero la policía ha puesto a los perros a olfatearte!",
                "¡pero la policía está haciendo búsquedas!",
                "¡pero la policía ya ha informado de tu desaparición!",
                "¡pero la policía te está buscando!",
            ],
        };
        const failureTexts = {
            [Language_1.Language.English]: [
                "You tried to start a riot to escape, but a snitch ratted you out",
                "You dug a small tunnel, but unfortunately the police discovered it",
                "You tried to take another inmate hostage, but he managed to escape and alert the police",
                "During sunbathing, you tried to cause a fight between gang members, the police did not like it",
                "You tried to saw the bars of the cell with a file, but ended up making too much noise and alerted the police",
            ],
            [Language_1.Language.Portuguese]: [
                "Você tentou iniciar uma rebelião para conseguir fugir, mas um X9 te denunciou",
                "Você cavou um túnel pequeno, mas infelizmente a polícia descobriu",
                "Você tentou fazer outro detento refém, mas ele conseguiu escapar e avisar os policiais",
                "Durante o banho de sol, você tentou causar uma briga entre membros de gangue, os policiais não gostaram",
                "Você tentou serrar as barras da cela com uma lima, mas acabou fazendo muito barulho e alertando os policiais",
            ],
            [Language_1.Language.Spanish]: [
                "Intentaste iniciar una revuelta para escapar, pero un chivato te delató",
                "Cavaste un pequeño túnel, pero lamentablemente la policía lo descubrió",
                "Intentaste tomar a otro detenido como rehén, pero logró escapar y avisar a los policías",
                "Durante el baño de sol, intentaste provocar una pelea entre miembros de bandas, a los policías no les gustó",
                "Intentaste serrar las barras de la celda con una lima, pero hiciste demasiado ruido y alertaste a los policías",
            ],
        };
        const failureTextsJetpack = {
            [Language_1.Language.English]: [
                `You tried to fly with your ${jetpack}, but it had little fuel, and you slowly descended to the police`,
                `You used your ${jetpack} to pass through the gates, but you were knocked down by a shock barrier`,
                `You try to start your ${jetpack} to escape, but alerted the police`,
                `You prepare to escape with your ${jetpack}, but another inmate alerted the police`,
                `You start to fly with the ${jetpack}, but other inmates cling to you in the hope of escaping together, and you are dragged to the ground`,
            ],
            [Language_1.Language.Portuguese]: [
                `Você tentou voar com sua ${jetpack}, mas ela estava com pouco combustível e você desceu lentamente até os policiais`,
                `Você usou sua ${jetpack} para passar pelos portões, mas foi derrubado por uma barreira de choque`,
                `Você tenta ligar sua ${jetpack} para fugir, mas alertou os policias`,
                `Você se prepara para fugir com sua ${jetpack}, mas outro detento avisou os policiais`,
                `Você começa a voar com a ${jetpack}, mas outros detentos se agarram em você na esperança de fugir juntos, mas você é arrastado para o chão`,
            ],
            [Language_1.Language.Spanish]: [
                `Intentaste volar con tu ${jetpack}, pero tenía poco combustible y descendiste lentamente hasta la policía`,
                `Usaste tu ${jetpack} para pasar por las puertas, pero fuiste derribado por una barrera de choque`,
                `Intentas encender tu ${jetpack} para escapar, pero alertaste a la policía`,
                `Te preparas para escapar con tu ${jetpack}, pero otro detenido avisó a la policía`,
                `Empiezas a volar con el ${jetpack}, pero otros detenidos se aferran a ti con la esperanza de escapar juntos, y eres arrastrado al suelo`,
            ],
        };
        const failureWillBeInPrison = {
            [Language_1.Language.English]: `You will be imprisoned for another ${totalTime} minutes.`,
            [Language_1.Language.Portuguese]: `Você ficará preso por mais ${totalTime} minutos.`,
            [Language_1.Language.Spanish]: `Permanecerás encarcelado por otros ${totalTime} minutos.`,
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
            const user = await UserRepository_1.UserRepository.FindById(this.User.Robbery.IsBeingRobbedById, ["nickname", "class"]);
            return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeingRobbedById, attacker: user };
        }
        if (this.User.BeatUp.IsBeatingId) {
            const user = await UserRepository_1.UserRepository.FindById(this.User.BeatUp.IsBeatingId, ["nickname", "class"]);
            return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeatingId, attacker: user };
        }
        if (this.User.BeatUp.IsBeingBeatUpById) {
            const user = await UserRepository_1.UserRepository.FindById(this.User.BeatUp.IsBeingBeatUpById, ["nickname", "class"]);
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
    async PayBribery(bribeValue) {
        if (this.User.Prison.HasPaidBribe || !this.User.IsInPrison()) {
            return false;
        }
        const chance = Math.floor(Math.random() * 101);
        const userClassModifier = (0, Classes_1.getPrisonBribeClassModifier)(this.User.Class);
        const BRIBE_CHANCE = 75 + userClassModifier;
        const success = chance < BRIBE_CHANCE;
        this.User.Money -= bribeValue;
        this.User.Prison.HasPaidBribe = true;
        this.User.Prison.BriberySum += bribeValue;
        this.User.Prison.BriberyCount += 1;
        if (success) {
            this.User.Prison.Time = new Date();
            const wantedTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.WANTED_TIME_MULTIPLIER);
            this.User.Wanted.Time = (0, date_fns_1.addMinutes)(new Date(), Prison.BribeTimeInMinutesWanted * wantedTimeMultiplier);
            await Promise.all([
                Notification_1.Notification.Dismiss(this.User.Id, Notification_1.NotificationType.Free),
                Notification_1.Notification.RobAgain(this.User),
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
        log_1.Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) paid a bribe of ${(0, ui_1.formatMoney)(bribeValue, Language_1.Language.English)} to leave prison. Sucess: ${success}.`);
        return success;
    }
}
exports.Prison = Prison;
//# sourceMappingURL=Prison.js.map