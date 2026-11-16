import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as discord from "discord.js";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { HeistMissionId, isMainHeistDay } from "#core/types/Heist";
import type { MultiplayerSessionView } from "#core/models/MultiplayerSession";

const source = readFileSync("src\\bot\\commands\\utility\\heist.ts", "utf8");
const functionStart = source.indexOf("\t\t\tconst getLobbyContainer = async");
const functionEnd = source.indexOf("\n\t\t\tcurrentContainer = await getLobbyContainer(session);", functionStart);
if (functionStart < 0 || functionEnd < 0) throw new Error("Could not locate the heist lobby container.");

const { outputText } = ts.transpileModule(
	`${source.slice(functionStart, functionEnd)}\nmodule.exports = getLobbyContainer;`,
	{ compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

function makeSession(participants: MultiplayerSessionView["participants"]): MultiplayerSessionView {
	return {
		id: "heist",
		kind: "gangHeist",
		source: "discord",
		phase: "lobby",
		ownerId: "leader",
		targetId: null,
		targetNickname: null,
		gangId: 1,
		gangName: "Gang",
		investmentName: null,
		investmentImageUrl: null,
		investmentYield: null,
		hasHenchman: false,
		participants,
		maxParticipants: 5,
		bet: null,
		missionId: HeistMissionId.Blueprint,
		expiresAt: null,
		response: null,
		allowedResponses: [],
		events: [],
		aliveUserIds: [],
		result: null,
		duelDetails: null,
	};
}

async function buildLobby(session: MultiplayerSessionView) {
	const sandbox = {
		module: { exports: {} },
		user: { Id: "leader", GetNameWithImage: () => "Leader" },
		sessionGang: { Color: 0, Name: "Gang" },
		lobbyName: "Blueprint",
		s: {
			lobbyTitle: (name: string) => name,
			lobbyDescription: () => "Members joined",
			participate: "Participate",
			leave: "Leave",
			abort: "Abort",
			gang: "Gang",
		},
		HeistMissionId,
		isMainHeistDay,
		CustomContainerBuilder,
		GangColor: [{ Color: 0 }],
		ButtonStyle: discord.ButtonStyle,
	};
	runInNewContext(outputText, sandbox);
	const getLobbyContainer = sandbox.module.exports as (view: MultiplayerSessionView) => Promise<CustomContainerBuilder>;
	return JSON.stringify((await getLobbyContainer(session)).toJSON());
}

describe("heist Discord lobby controls", () => {
	it("shows Participate on the creator's lobby and preserves Leave and Abort", async () => {
		const participants = [{ userId: "leader", nickname: "Leader", attack: 10, classId: 0 }];
		const emptyLobby = await buildLobby(makeSession(participants));
		expect(emptyLobby).toContain("\"custom_id\":\"join_lobby\"");
		expect(emptyLobby).toContain("\"custom_id\":\"abort_lobby\"");

		const occupiedLobby = await buildLobby(makeSession([
			...participants,
			{ userId: "guest", nickname: "Guest", attack: 10, classId: 0 },
		]));
		expect(occupiedLobby).toContain("\"custom_id\":\"join_lobby\"");
		expect(occupiedLobby).toContain("\"custom_id\":\"leave_lobby\"");
		expect(occupiedLobby).toContain("\"custom_id\":\"abort_lobby\"");
	});
});
