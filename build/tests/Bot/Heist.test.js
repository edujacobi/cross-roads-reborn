"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_vm_1 = require("node:vm");
const discord = __importStar(require("discord.js"));
const typescript_1 = __importDefault(require("typescript"));
const vitest_1 = require("vitest");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const Heist_1 = require("#core/types/Heist");
const source = (0, node_fs_1.readFileSync)("src\\bot\\commands\\utility\\heist.ts", "utf8");
const functionStart = source.indexOf("\t\t\tconst getLobbyContainer = async");
const functionEnd = source.indexOf("\n\t\t\tcurrentContainer = await getLobbyContainer(session);", functionStart);
if (functionStart < 0 || functionEnd < 0)
    throw new Error("Could not locate the heist lobby container.");
const { outputText } = typescript_1.default.transpileModule(`${source.slice(functionStart, functionEnd)}\nmodule.exports = getLobbyContainer;`, { compilerOptions: { module: typescript_1.default.ModuleKind.CommonJS } });
function makeSession(participants) {
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
        missionId: Heist_1.HeistMissionId.Blueprint,
        expiresAt: null,
        response: null,
        allowedResponses: [],
        events: [],
        aliveUserIds: [],
        result: null,
        duelDetails: null,
    };
}
async function buildLobby(session) {
    const sandbox = {
        module: { exports: {} },
        user: { Id: "leader", GetNameWithImage: () => "Leader" },
        sessionGang: { Color: 0, Name: "Gang" },
        lobbyName: "Blueprint",
        s: {
            lobbyTitle: (name) => name,
            lobbyDescription: () => "Members joined",
            participate: "Participate",
            leave: "Leave",
            abort: "Abort",
            gang: "Gang",
        },
        HeistMissionId: Heist_1.HeistMissionId,
        isMainHeistDay: Heist_1.isMainHeistDay,
        CustomContainerBuilder: CustomContainerBuilder_1.CustomContainerBuilder,
        GangColor: [{ Color: 0 }],
        ButtonStyle: discord.ButtonStyle,
    };
    (0, node_vm_1.runInNewContext)(outputText, sandbox);
    const getLobbyContainer = sandbox.module.exports;
    return JSON.stringify((await getLobbyContainer(session)).toJSON());
}
(0, vitest_1.describe)("heist Discord lobby controls", () => {
    (0, vitest_1.it)("shows Participate on the creator's lobby and preserves Leave and Abort", async () => {
        const participants = [{ userId: "leader", nickname: "Leader", attack: 10, classId: 0 }];
        const emptyLobby = await buildLobby(makeSession(participants));
        (0, vitest_1.expect)(emptyLobby).toContain("\"custom_id\":\"join_lobby\"");
        (0, vitest_1.expect)(emptyLobby).toContain("\"custom_id\":\"abort_lobby\"");
        const occupiedLobby = await buildLobby(makeSession([
            ...participants,
            { userId: "guest", nickname: "Guest", attack: 10, classId: 0 },
        ]));
        (0, vitest_1.expect)(occupiedLobby).toContain("\"custom_id\":\"join_lobby\"");
        (0, vitest_1.expect)(occupiedLobby).toContain("\"custom_id\":\"leave_lobby\"");
        (0, vitest_1.expect)(occupiedLobby).toContain("\"custom_id\":\"abort_lobby\"");
    });
});
//# sourceMappingURL=Heist.test.js.map