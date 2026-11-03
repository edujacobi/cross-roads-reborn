import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as discord from "discord.js";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { EmoteString } from "#bot/utils/emotes";
import { Language } from "#core/models/Language";
import type { MultiplayerSessionView } from "#core/models/MultiplayerSession";

const source = readFileSync("src\\bot\\commands\\utility\\gang.ts", "utf8");
const functionSource = source.slice(source.indexOf("async function runInvestmentRobberySession("));
const { outputText } = ts.transpileModule(`${functionSource}\nmodule.exports = runInvestmentRobberySession;`, {
	compilerOptions: { module: ts.ModuleKind.CommonJS },
});

describe("investment robbery collector", () => {
	it("disables the latest participant list without overwriting subsequent session updates", async () => {
		const user = { Id: "leader", Language: Language.English, GetNameWithImage: () => "Leader" };
		const target = { Id: "target", Investment: { Id: null }, GetNameWithImage: () => "Target" };
		const session: MultiplayerSessionView = {
			id: "robbery", kind: "investmentRobbery", source: "discord", phase: "lobby",
			ownerId: user.Id, targetId: target.Id, targetNickname: "Target", gangId: 1,
			gangName: "Gang", investmentName: "Investment", investmentImageUrl: "https://example.com/image.png",
			investmentYield: 100, hasHenchman: false,
			participants: [{ userId: user.Id, nickname: "Leader", attack: 10, classId: 0 }],
			maxParticipants: 5, bet: null, missionId: null, expiresAt: null,
			response: null, allowedResponses: [], events: [], aliveUserIds: [], result: null, duelDetails: null,
		};
		const joined = {
			...session,
			participants: [...session.participants, { userId: "guest", nickname: "Guest", attack: 20, classId: 0 }],
		};
		const messages: { disabled: boolean; content: string }[] = [];
		const handlers = new Map<string, () => void>();
		let listener: (view: MultiplayerSessionView) => void = vi.fn();
		let finish!: (view: MultiplayerSessionView) => void;
		const completion = new Promise<MultiplayerSessionView>(resolve => {
			finish = resolve;
		});
		const record = (container: CustomContainerBuilder, disabled: boolean) => {
			messages.push({ disabled, content: JSON.stringify(container.toJSON()) });
		};
		const sandbox = {
			module: { exports: {} },
			Strings: {
				[Language.English]: {
					robInvestment: "Robbery", inProgress: "in progress", finished: "finished",
					robberyInitiated: () => "Organizing", robberyAttempting: () => "Attempting",
					participants: (count: number) => `${count} participants`, autoStartRobbery: () => "Starting",
					participate: "Participate", abortRobbery: "Abort", robberyAborted: () => "Aborted",
				},
			},
			Gang: { GetByUserId: async () => ({ Id: 1, Color: 0, Name: "Gang" }) },
			GangColor: [{ Color: 0 }],
			MultiplayerSession: {
				GetVisibleSessions: () => [],
				StartInvestmentRobbery: async () => ({ success: true, session }),
				GetVisibleSession: () => session,
				Subscribe: (_id: string, _gangId: number, callback: (view: MultiplayerSessionView) => void) => {
					listener = callback;
					return vi.fn();
				},
				WaitForCompletion: () => completion,
			},
			CustomContainerBuilder, CrColors, EmoteString, ButtonStyle: discord.ButtonStyle,
			replyWithContainer: async (_interaction: unknown, container: CustomContainerBuilder) => {
				record(container, false);
				return { createMessageComponentCollector: () => ({
					on: (event: string, handler: () => void) => handlers.set(event, handler),
				}) };
			},
			disableButtons: async (_interaction: unknown, container: CustomContainerBuilder) => record(container, true),
			Log: { Error: vi.fn() },
		};
		runInNewContext(outputText, sandbox);
		const run = sandbox.module.exports as (interaction: object, user: object, target: object) => Promise<void>;
		const running = run({}, user, target);
		await vi.waitFor(() => expect(handlers.has("end")).toBe(true));

		listener(joined);
		handlers.get("end")!();
		await vi.waitFor(() => expect(messages.at(-1)?.disabled).toBe(true));
		expect(messages.at(-1)?.content).toContain("Guest");
		expect(messages.at(-1)?.content).toContain("2 participants");

		listener({ ...joined, phase: "resolving" });
		await vi.waitFor(() => expect(messages.at(-1)?.content).toContain("Attempting"));
		expect(messages.at(-1)?.disabled).toBe(true);
		expect(messages.at(-1)?.content).toContain("Guest");

		finish({ ...joined, phase: "aborted" });
		await running;
		expect(messages.at(-1)?.content).toContain("Aborted");
		expect(messages.at(-1)?.disabled).toBe(true);
		expect(sandbox.Log.Error).not.toHaveBeenCalled();
	});
});
