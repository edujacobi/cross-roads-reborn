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
const { outputText } = typescript_1.default.transpileModule((0, node_fs_1.readFileSync)("src\\bot\\commands\\utility\\russianroulette.ts", "utf8"), { compilerOptions: { module: typescript_1.default.ModuleKind.CommonJS } });
async function startLobby(language = Language_1.Language.English) {
    const host = {
        Id: "host", GangId: null, Nickname: "Host", Money: 50_000,
        GetInfo: vitest_1.vi.fn(), GetNameWithImage: () => "Host",
    };
    const session = {
        id: "roulette", kind: "russianRoulette", source: "discord", phase: "lobby",
        ownerId: host.Id, targetId: null, targetNickname: null, gangId: null,
        gangName: null, investmentName: null, investmentImageUrl: null,
        investmentYield: null, hasHenchman: false,
        participants: [{ userId: host.Id, nickname: host.Nickname, attack: 10, classId: 0 }],
        maxParticipants: 5, bet: 5_000, missionId: null, expiresAt: null,
        response: null, allowedResponses: [], events: [], aliveUserIds: [], result: null,
        duelDetails: null,
    };
    const handlers = new Map();
    let listener = vitest_1.vi.fn();
    const replies = [];
    const join = vitest_1.vi.fn().mockResolvedValue({ success: true });
    const joiningUser = { Id: "guest", Language: language };
    const checkUser = vitest_1.vi.fn().mockResolvedValue(joiningUser);
    const error = vitest_1.vi.fn();
    const dependencies = {
        "discord.js": discord,
        "#bot/ui/builders/CustomContainerBuilder": { CustomContainerBuilder: CustomContainerBuilder_1.CustomContainerBuilder },
        "#bot/utils/colors": { CrColors: colors_1.CrColors },
        "#bot/utils/emotes": { EmoteString: emotes_1.EmoteString },
        "#core/models/Language": { Language: Language_1.Language },
        "#core/types/Classes": { ClassId: { Attorney: 0 }, ClassList: [{ Modifier: { Casino: { Positive: 1 } } }] },
        "#bot/utils/collectors": { disableButtons: vitest_1.vi.fn() },
        "#bot/utils/discordInteractions": {
            deferUpdate: vitest_1.vi.fn(),
            replyWithContainer: async (_interaction, container) => {
                replies.push(container.toJSON());
                return {
                    createMessageComponentCollector: () => ({
                        on: (event, handler) => handlers.set(event, handler),
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
                WaitForCompletion: () => new Promise(vitest_1.vi.fn()),
                JoinRussianRoulette: join,
                Subscribe: (_id, _gangId, callback) => {
                    listener = callback;
                    return vitest_1.vi.fn();
                },
            },
        },
    };
    const sandbox = {
        exports: {},
        module: { exports: { execute: vitest_1.vi.fn() } },
        require: (name) => {
            if (!(name in dependencies))
                throw new Error(`Unexpected import: ${name}`);
            return dependencies[name];
        },
    };
    (0, node_vm_1.runInNewContext)(outputText, sandbox);
    await sandbox.module.exports.execute({ options: { getNumber: () => 5_000 } }, host, language);
    await handlers.get("collect")({ customId: "start", user: { id: host.Id } });
    await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(replies).toHaveLength(2));
    return { session, replies, listener, handlers, join, joiningUser, error };
}
(0, vitest_1.describe)("Russian Roulette shared Discord lobby", () => {
    (0, vitest_1.it)("keeps a valid Participate button on the host's message and routes other players to the session", async () => {
        const { replies, handlers, join, joiningUser, error } = await startLobby();
        const lobby = replies.at(-1);
        const section = lobby.components.find(component => component.type === discord.ComponentType.Section &&
            component.accessory.type === discord.ComponentType.Button);
        (0, vitest_1.expect)(section).toMatchObject({
            accessory: { type: discord.ComponentType.Button, custom_id: "participate", label: "Participate" },
        });
        await handlers.get("collect")({ customId: "participate", user: { id: joiningUser.Id } });
        (0, vitest_1.expect)(join).toHaveBeenCalledWith("roulette", joiningUser, Language_1.Language.English);
        (0, vitest_1.expect)(error).not.toHaveBeenCalled();
    });
    vitest_1.it.each([
        [Language_1.Language.English, "Time expired"],
        [Language_1.Language.Portuguese, "Tempo esgotado"],
        [Language_1.Language.Spanish, "Tiempo agotado"],
    ])("shows only the localized timeout, not player results, when a lobby expires (%s)", async (language, timeout) => {
        const { session, replies, listener, error } = await startLobby(language);
        for (const phase of ["aborting", "aborted"]) {
            const previousReplies = replies.length;
            listener({ ...session, phase, result: JSON.stringify({ reason: "lobby-timeout" }) });
            await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(replies.length).toBeGreaterThan(previousReplies));
            const terminal = replies.at(-1);
            const text = terminal.components
                .filter(component => component.type === discord.ComponentType.TextDisplay)
                .map(component => component.content);
            (0, vitest_1.expect)(text).toContain(timeout);
            (0, vitest_1.expect)(text.join("\n")).not.toContain(emotes_1.EmoteString.Hospital);
            (0, vitest_1.expect)(JSON.stringify(terminal)).not.toContain("\"custom_id\":\"participate\"");
        }
        (0, vitest_1.expect)(error).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=RussianRoulette.test.js.map