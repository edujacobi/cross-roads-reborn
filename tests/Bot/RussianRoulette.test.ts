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

const { outputText } = ts.transpileModule(
	readFileSync("src\\bot\\commands\\utility\\russianroulette.ts", "utf8"),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

async function startLobby(language = Language.English) {
	const host = {
		Id: "host", GangId: null, Nickname: "Host", Money: 50_000,
		GetInfo: vi.fn(), GetNameWithImage: () => "Host",
	};
	const session: MultiplayerSessionView = {
		id: "roulette", kind: "russianRoulette", source: "discord", phase: "lobby",
		ownerId: host.Id, targetId: null, targetNickname: null, gangId: null,
		gangName: null, investmentName: null, investmentImageUrl: null,
		investmentYield: null, hasHenchman: false,
		participants: [{ userId: host.Id, nickname: host.Nickname, attack: 10, classId: 0 }],
		maxParticipants: 5, bet: 5_000, missionId: null, expiresAt: null,
		response: null, allowedResponses: [], events: [], aliveUserIds: [], result: null,
		duelDetails: null,
	};
	const handlers = new Map<string, (button: unknown) => Promise<void>>();
	let listener: (view: MultiplayerSessionView) => void = vi.fn();
	const replies: ReturnType<CustomContainerBuilder["toJSON"]>[] = [];
	const join = vi.fn().mockResolvedValue({ success: true });
	const joiningUser = { Id: "guest", Language: language };
	const checkUser = vi.fn().mockResolvedValue(joiningUser);
	const error = vi.fn();
	const dependencies: Record<string, unknown> = {
		"discord.js": discord,
		"#bot/ui/builders/CustomContainerBuilder": { CustomContainerBuilder },
		"#bot/utils/colors": { CrColors },
		"#bot/utils/emotes": { EmoteString },
		"#core/models/Language": { Language },
		"#core/types/Classes": { ClassId: { Attorney: 0 }, ClassList: [{ Modifier: { Casino: { Positive: 1 } } }] },
		"#bot/utils/collectors": { disableButtons: vi.fn() },
		"#bot/utils/discordInteractions": {
			deferUpdate: vi.fn(),
			replyWithContainer: async (_interaction: unknown, container: CustomContainerBuilder) => {
				replies.push(container.toJSON());
				return {
					createMessageComponentCollector: () => ({
						on: (event: string, handler: (button: unknown) => Promise<void>) => handlers.set(event, handler),
					}),
				};
			},
		},
		"#bot/utils/ui": { formatMoney: String },
		"#bot/utils/userUtils": { checkUser },
		"#shared/log": { Log: { Error: error } },
		"#core/models/MultiplayerSession": {
			MultiplayerSession: {
				GetVisibleSessions: () => [],
				StartRussianRoulette: async () => ({ success: true, session }),
				GetVisibleSession: () => session,
				WaitForCompletion: () => new Promise(vi.fn()),
				JoinRussianRoulette: join,
				Subscribe: (_id: string, _gangId: number | null, callback: typeof listener) => {
					listener = callback;
					return vi.fn();
				},
			},
		},
	};
	const sandbox = {
		exports: {},
		module: { exports: { execute: vi.fn() } },
		require: (name: string) => {
			if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
			return dependencies[name];
		},
	};
	runInNewContext(outputText, sandbox);
	await sandbox.module.exports.execute({ options: { getNumber: () => 5_000 } }, host, language);
	await handlers.get("collect")!({ customId: "start", user: { id: host.Id } });
	await vi.waitFor(() => expect(replies).toHaveLength(2));
	return { session, replies, listener, handlers, join, joiningUser, error };
}

describe("Russian Roulette shared Discord lobby", () => {
	it("keeps a valid Participate button on the host's message and routes other players to the session", async () => {
		const { replies, handlers, join, joiningUser, error } = await startLobby();
		const lobby = replies.at(-1)!;
		const section = lobby.components.find(component =>
			component.type === discord.ComponentType.Section &&
			component.accessory.type === discord.ComponentType.Button,
		);
		expect(section).toMatchObject({
			accessory: { type: discord.ComponentType.Button, custom_id: "participate", label: "Participate" },
		});
		await handlers.get("collect")!({ customId: "participate", user: { id: joiningUser.Id } });
		expect(join).toHaveBeenCalledWith("roulette", joiningUser, Language.English);
		expect(error).not.toHaveBeenCalled();
	});

	it.each([
		[Language.English, "Time expired"],
		[Language.Portuguese, "Tempo esgotado"],
		[Language.Spanish, "Tiempo agotado"],
	])("shows only the localized timeout, not player results, when a lobby expires (%s)", async (language, timeout) => {
		const { session, replies, listener, error } = await startLobby(language);
		for (const phase of ["aborting", "aborted"] as const) {
			const previousReplies = replies.length;
			listener({ ...session, phase, result: JSON.stringify({ reason: "lobby-timeout" }) });
			await vi.waitFor(() => expect(replies.length).toBeGreaterThan(previousReplies));
			const terminal = replies.at(-1)!;
			const text = terminal.components
				.filter(component => component.type === discord.ComponentType.TextDisplay)
				.map(component => component.content);
			expect(text).toContain(timeout);
			expect(text.join("\n")).not.toContain(EmoteString.Hospital);
			expect(JSON.stringify(terminal)).not.toContain("\"custom_id\":\"participate\"");
		}
		expect(error).not.toHaveBeenCalled();
	});
});
