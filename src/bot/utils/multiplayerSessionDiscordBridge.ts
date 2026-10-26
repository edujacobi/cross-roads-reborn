import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { getClient } from "#bot/client";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney } from "#bot/utils/ui";
import {
	buildBeatUpDefenderPrompt,
	buildBeatUpDefenderResponse,
	buildBeatUpDefenderResult,
} from "#bot/utils/beatupHelper";
import {
	buildRobberyDefenderPrompt,
	buildRobberyDefenderResponse,
	buildRobberyDefenderResult,
} from "#bot/utils/robberyHelper";
import type { BeatUp as BeatUpModel } from "#core/models/BeatUp";
import type { InvestmentRobbery } from "#core/models/InvestmentRobbery";
import { Language } from "#core/models/Language";
import { User } from "#core/models/User";
import { MultiplayerSession, type MultiplayerSessionView } from "#core/models/MultiplayerSession";
import type { UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";
import { Log } from "#shared/log";
import { ButtonStyle, ComponentType, MessageFlags, type Message } from "discord.js";

const promptedSessions = new Set<string>();
const shownResponses = new Set<string>();
const defenderMessages = new Map<string, Message>();

export function initializeMultiplayerSessionDiscordBridge(): () => void {
	return MultiplayerSession.SubscribeAll(session => {
		if (session.source !== "web" || !session.targetId) return;
		if (
			(session.kind === "beatUp" || session.kind === "userRobbery" || session.kind === "investmentRobbery") &&
			session.phase === "awaitingDefender" &&
			!promptedSessions.has(session.id)
		) {
			promptedSessions.add(session.id);
			void sendPrompt(session).catch(error => {
				Log.Warning(`Failed to send Discord prompt for multiplayer session ${session.id}: ${error}`);
			});
		}

		if (session.response && !shownResponses.has(session.id)) {
			shownResponses.add(session.id);
			void showResponse(session).catch(error => {
				Log.Warning(`Failed to update Discord response for multiplayer session ${session.id}: ${error}`);
			});
		}

		if (session.phase === "completed" || session.phase === "aborted") {
			void showResult(session).catch(error => {
				Log.Warning(`Failed to send Discord result for multiplayer session ${session.id}: ${error}`);
			});
		}
	});
}

async function sendPrompt(session: MultiplayerSessionView): Promise<void> {
	const target = new User(session.targetId!);
	if (!await target.GetInfo()) return;
	const attacker = new User(session.ownerId);
	if (!await attacker.GetInfo()) return;
	const client = getClient();
	const discordTarget = await client.users.fetch(target.Id);

	let prompt: CustomContainerBuilder;
	if (session.kind === "beatUp" || session.kind === "userRobbery") {
		const details = session.duelDetails;
		if (!details) throw new Error(`Missing duel details for session ${session.id}`);

		const data = {
			usedGunSkin: details.weaponEmoji,
			usedGunName: details.weaponName,
			usedGrenade: details.usedGrenade,
			allowedResponses: session.allowedResponses,
		};
		prompt = session.kind === "beatUp"
			? buildBeatUpDefenderPrompt(attacker, target, {
				...data,
				timeInHospitalAditional: details.hospitalMinutesDelta,
			})
			: buildRobberyDefenderPrompt(attacker, target, {
				...data,
				defenderTimeInHospital: details.hospitalMinutes,
				attackerAditionalTimeCallPolice: details.prisonMinutesDelta,
			});
	}
	else {
		prompt = buildInvestmentPrompt(session, attacker, target);
	}

	const message = await discordTarget.send({
		components: [prompt],
		flags: MessageFlags.IsComponentsV2,
	});
	defenderMessages.set(session.id, message);

	const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : Date.now() + 60_000;
	const collector = message.createMessageComponentCollector({
		filter: interaction => interaction.user.id === target.Id,
		componentType: ComponentType.Button,
		time: Math.max(1, expiresAt - Date.now()),
	});
	collector.on("collect", async interaction => {
		await deferUpdate(interaction);
		const result = await MultiplayerSession.Respond(session.id, target.Id, interaction.customId, target.Language);
		if (!result.success) {
			await interaction.followUp({ content: result.message, flags: MessageFlags.Ephemeral });
		}
	});
}

function buildInvestmentPrompt(session: MultiplayerSessionView, attacker: User, target: User) {
	const language = target.Language;
	const title = {
		[Language.English]: "Investment attack",
		[Language.Portuguese]: "Ataque ao investimento",
		[Language.Spanish]: "Ataque a la inversión",
	}[language];
	const defendLabel = {
		[Language.English]: "Defend",
		[Language.Portuguese]: "Defender",
		[Language.Spanish]: "Defender",
	}[language];
	const attackDescription = {
		[Language.English]: `Your investment is under attack by ${attacker.GetNameWithImage()}.`,
		[Language.Portuguese]: `Seu investimento está sendo atacado por ${attacker.GetNameWithImage()}.`,
		[Language.Spanish]: `Tu inversión está siendo atacada por ${attacker.GetNameWithImage()}.`,
	}[language];
	return new CustomContainerBuilder()
		.setUser(target)
		.setAccentColor(CrColors.Robbery)
		.addTexts([
			`${EmoteString.InvestmentActive} ${title}`,
			`${attackDescription} ${session.investmentName ?? ""}`,
		])
		.addLargeSeparator()
		.addButtonRow(button => button
			.setCustomId("defend")
			.setLabel(defendLabel)
			.setStyle(ButtonStyle.Secondary),
		);
}

async function showResponse(session: MultiplayerSessionView): Promise<void> {
	const message = defenderMessages.get(session.id);
	if (!message) return;
	const target = new User(session.targetId!);
	if (!await target.GetInfo()) return;
	if (session.kind === "beatUp") {
		await message.edit({ components: [buildBeatUpDefenderResponse(target, session.response!)] });
		return;
	}
	if (session.kind === "userRobbery") {
		await message.edit({ components: [buildRobberyDefenderResponse(target, session.response!)] });
		return;
	}

	const responseText = {
		[Language.English]: "Your response was recorded. Wait for the result.",
		[Language.Portuguese]: "Sua resposta foi registrada. Aguarde o resultado.",
		[Language.Spanish]: "Tu respuesta fue registrada. Espera el resultado.",
	}[target.Language];
	const container = new CustomContainerBuilder()
		.setUser(target)
		.setAccentColor(CrColors.Robbery)
		.addTexts([responseText]);
	await message.edit({ components: [container] });
}

async function showResult(session: MultiplayerSessionView): Promise<void> {
	const message = defenderMessages.get(session.id);
	if (!message) return;
	const target = new User(session.targetId!);
	if (!await target.GetInfo()) return;
	const attacker = new User(session.ownerId);
	if (!await attacker.GetInfo()) return;

	if (session.phase === "completed" && session.result) {
		if (session.kind === "beatUp") {
			const outcome = MultiplayerSession.DecodeResult<Awaited<ReturnType<BeatUpModel["Resolve"]>>>(session.result);
			await message.edit({ components: [buildBeatUpDefenderResult(attacker, target, outcome)] });
			defenderMessages.delete(session.id);
			promptedSessions.delete(session.id);
			shownResponses.delete(session.id);
			return;
		}
		if (session.kind === "userRobbery") {
			const outcome = MultiplayerSession.DecodeResult<Awaited<ReturnType<UserRobberyStrategy["Resolve"]>>>(session.result);
			await message.edit({ components: [buildRobberyDefenderResult(attacker, target, outcome)] });
			defenderMessages.delete(session.id);
			promptedSessions.delete(session.id);
			shownResponses.delete(session.id);
			return;
		}
	}

	const actionComplete = {
		[Language.English]: "The action is complete.",
		[Language.Portuguese]: "A ação foi concluída.",
		[Language.Spanish]: "La acción fue completada.",
	}[target.Language];
	const actionAborted = {
		[Language.English]: "This action was cancelled.",
		[Language.Portuguese]: "Esta ação foi cancelada.",
		[Language.Spanish]: "Esta acción fue cancelada.",
	}[target.Language];
	let text = session.phase === "aborted" ? actionAborted : actionComplete;
	if (session.phase === "completed" && session.result && session.kind === "investmentRobbery") {
		const messages = {
			[Language.English]: {
				success: (amount: number) => `Your investment was robbed for ${formatMoney(amount, target.Language)}.`,
				remaining: (amount: number) => `Remaining yield: ${formatMoney(amount, target.Language)}.`,
				failure: "The gang was caught; your investment was defended.",
			},
			[Language.Portuguese]: {
				success: (amount: number) => `Seu investimento foi roubado em ${formatMoney(amount, target.Language)}.`,
				remaining: (amount: number) => `Rendimento restante: ${formatMoney(amount, target.Language)}.`,
				failure: "A gangue foi pega; seu investimento foi defendido.",
			},
			[Language.Spanish]: {
				success: (amount: number) => `Robaron ${formatMoney(amount, target.Language)} de tu inversión.`,
				remaining: (amount: number) => `Rendimiento restante: ${formatMoney(amount, target.Language)}.`,
				failure: "La cuadrilla fue atrapada; defendiste tu inversión.",
			},
		};
		const result = MultiplayerSession.DecodeResult<Awaited<ReturnType<InvestmentRobbery["CalculateAndApplyOutcome"]>>>(session.result);
		text = result.win
			? `${messages[target.Language].success(result.robbedAmount)}\n${messages[target.Language].remaining(result.remainingYield)}`
			: messages[target.Language].failure;
	}
	const container = new CustomContainerBuilder()
		.setUser(target)
		.setAccentColor(session.kind === "beatUp" ? CrColors.BeatUp : CrColors.Robbery)
		.addTexts([text]);
	await message.edit({ components: [container] });
	defenderMessages.delete(session.id);
	promptedSessions.delete(session.id);
	shownResponses.delete(session.id);
}
