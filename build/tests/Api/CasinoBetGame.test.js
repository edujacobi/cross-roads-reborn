"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_vm_1 = require("node:vm");
const typescript_1 = __importDefault(require("typescript"));
const vitest_1 = require("vitest");
const component = (0, node_fs_1.readFileSync)("web-interface\\components\\Casino\\CasinoBetGame.vue", "utf8");
const script = component.slice(component.indexOf(">") + 1, component.indexOf("</script>"));
const { outputText } = typescript_1.default.transpileModule(`${script}
globalThis.game = { play, isPlaying, cooldownSeconds };
`, { compilerOptions: { module: typescript_1.default.ModuleKind.CommonJS } });
function setupGame(success = true) {
    vitest_1.vi.spyOn(Math, "random").mockReturnValue(0);
    const mutate = vitest_1.vi.fn().mockResolvedValue({
        data: {
            playCoinFlip: {
                success, money: 9_500, won: false, amount: 500,
                resultSide: "TAILS", selectedSide: "HEADS", message: "Resultado",
            },
        },
    });
    const showToast = vitest_1.vi.fn();
    const refetch = vitest_1.vi.fn().mockResolvedValue(undefined);
    const state = new Map();
    const sandbox = {
        exports: {},
        require: (name) => {
            if (name === "@vue/apollo-composable") {
                return {
                    useMutation: () => ({ mutate, loading: { value: false } }),
                    useQuery: () => ({
                        result: { value: { myCasinoStatus: { money: 10_000 } } },
                        loading: { value: false }, error: { value: null }, refetch,
                    }),
                };
            }
            if (name.endsWith("useMoneyFormat"))
                return { useMoneyFormat: () => ({ formatMoney: String }) };
            if (name.endsWith("useToast"))
                return { useToast: () => ({ showToast }) };
            return {};
        },
        ref: (value) => ({ value }),
        computed: (getter) => ({ get value() {
                return getter();
            } }),
        useState: (key, init) => {
            if (!state.has(key))
                state.set(key, { value: init() });
            return state.get(key);
        },
        watch: vitest_1.vi.fn(),
        onMounted: vitest_1.vi.fn(),
        onUnmounted: vitest_1.vi.fn(),
        setTimeout,
        clearInterval,
        setInterval,
        Date,
        Math,
    };
    (0, node_vm_1.runInNewContext)(outputText, sandbox);
    const game = sandbox.game;
    return { game, mutate, showToast, refetch };
}
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.useRealTimers();
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.describe)("Casino bet submission", () => {
    (0, vitest_1.it)("blocks overlapping bets and waits exactly ten seconds after the result", async () => {
        vitest_1.vi.useFakeTimers();
        const { game, mutate } = setupGame();
        const first = game.play();
        await game.play();
        (0, vitest_1.expect)(mutate).toHaveBeenCalledTimes(1);
        await vitest_1.vi.advanceTimersByTimeAsync(2_000);
        await first;
        (0, vitest_1.expect)(game.isPlaying.value).toBe(false);
        (0, vitest_1.expect)(game.cooldownSeconds.value).toBe(10);
        await vitest_1.vi.advanceTimersByTimeAsync(9_999);
        await game.play();
        (0, vitest_1.expect)(mutate).toHaveBeenCalledTimes(1);
        await vitest_1.vi.advanceTimersByTimeAsync(1);
        const second = game.play();
        (0, vitest_1.expect)(mutate).toHaveBeenCalledTimes(2);
        await vitest_1.vi.advanceTimersByTimeAsync(2_000);
        await second;
    });
    (0, vitest_1.it)("does not start a cooldown when the server rejects the bet", async () => {
        vitest_1.vi.useFakeTimers();
        const { game, mutate } = setupGame(false);
        const first = game.play();
        await vitest_1.vi.advanceTimersByTimeAsync(2_000);
        await first;
        (0, vitest_1.expect)(game.cooldownSeconds.value).toBe(0);
        const second = game.play();
        (0, vitest_1.expect)(mutate).toHaveBeenCalledTimes(2);
        await vitest_1.vi.advanceTimersByTimeAsync(2_000);
        await second;
    });
    (0, vitest_1.it)("rejects invalid amounts before sending a mutation", async () => {
        const { game, mutate } = setupGame();
        for (const amount of [NaN, Infinity, 0, 499, 10_001])
            await game.play(amount);
        (0, vitest_1.expect)(mutate).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=CasinoBetGame.test.js.map