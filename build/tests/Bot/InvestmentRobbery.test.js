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
const colors_1 = require("#bot/utils/colors");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const source = (0, node_fs_1.readFileSync)("src\\bot\\commands\\utility\\gang.ts", "utf8");
const functionSource = source.slice(source.indexOf("async function runInvestmentRobberySession("));
const { outputText } = typescript_1.default.transpileModule(`${functionSource}\nmodule.exports = runInvestmentRobberySession;`, {
    compilerOptions: { module: typescript_1.default.ModuleKind.CommonJS },
});
(0, vitest_1.describe)("investment robbery collector", () => {
    (0, vitest_1.it)("disables the latest participant list without overwriting subsequent session updates", async () => {
        const user = { Id: "leader", Language: Language_1.Language.English, GetNameWithImage: () => "Leader" };
        const target = { Id: "target", Investment: { Id: null }, GetNameWithImage: () => "Target" };
        const session = {
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
        const messages = [];
        const handlers = new Map();
        let listener = vitest_1.vi.fn();
        let finish;
        const completion = new Promise(resolve => {
            finish = resolve;
        });
        const record = (container, disabled) => {
            messages.push({ disabled, content: JSON.stringify(container.toJSON()) });
        };
        const sandbox = {
            module: { exports: {} },
            Strings: {
                [Language_1.Language.English]: {
                    robInvestment: "Robbery", inProgress: "in progress", finished: "finished",
                    robberyInitiated: () => "Organizing", robberyAttempting: () => "Attempting",
                    participants: (count) => `${count} participants`, autoStartRobbery: () => "Starting",
                    participate: "Participate", abortRobbery: "Abort", robberyAborted: () => "Aborted",
                },
            },
            Gang: { GetByUserId: async () => ({ Id: 1, Color: 0, Name: "Gang" }) },
            GangColor: [{ Color: 0 }],
            MultiplayerSession: {
                GetVisibleSessions: () => [],
                StartInvestmentRobbery: async () => ({ success: true, session }),
                GetVisibleSession: () => session,
                Subscribe: (_id, _gangId, callback) => {
                    listener = callback;
                    return vitest_1.vi.fn();
                },
                WaitForCompletion: () => completion,
            },
            CustomContainerBuilder: CustomContainerBuilder_1.CustomContainerBuilder,
            CrColors: colors_1.CrColors,
            EmoteString: emotes_1.EmoteString,
            ButtonStyle: discord.ButtonStyle,
            replyWithContainer: async (_interaction, container) => {
                record(container, false);
                return { createMessageComponentCollector: () => ({
                        on: (event, handler) => handlers.set(event, handler),
                    }) };
            },
            disableButtons: async (_interaction, container) => record(container, true),
            Log: { Error: vitest_1.vi.fn() },
        };
        (0, node_vm_1.runInNewContext)(outputText, sandbox);
        const run = sandbox.module.exports;
        const running = run({}, user, target);
        await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(handlers.has("end")).toBe(true));
        listener(joined);
        handlers.get("end")();
        await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(messages.at(-1)?.disabled).toBe(true));
        (0, vitest_1.expect)(messages.at(-1)?.content).toContain("Guest");
        (0, vitest_1.expect)(messages.at(-1)?.content).toContain("2 participants");
        listener({ ...joined, phase: "resolving" });
        await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(messages.at(-1)?.content).toContain("Attempting"));
        (0, vitest_1.expect)(messages.at(-1)?.disabled).toBe(true);
        (0, vitest_1.expect)(messages.at(-1)?.content).toContain("Guest");
        finish({ ...joined, phase: "aborted" });
        await running;
        (0, vitest_1.expect)(messages.at(-1)?.content).toContain("Aborted");
        (0, vitest_1.expect)(messages.at(-1)?.disabled).toBe(true);
        (0, vitest_1.expect)(sandbox.Log.Error).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=InvestmentRobbery.test.js.map