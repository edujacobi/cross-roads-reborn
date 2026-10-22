import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";

const component = readFileSync("web-interface\\components\\Casino\\CasinoBetGame.vue", "utf8");
const script = component.slice(component.indexOf(">") + 1, component.indexOf("</script>"));
const { outputText } = ts.transpileModule(`${script}
globalThis.game = { play, isPlaying, cooldownSeconds };
`, { compilerOptions: { module: ts.ModuleKind.CommonJS } });

function setupGame(success = true) {
	vi.spyOn(Math, "random").mockReturnValue(0);
	const mutate = vi.fn().mockResolvedValue({
		data: {
			playCoinFlip: {
				success, money: 9_500, won: false, amount: 500,
				resultSide: "TAILS", selectedSide: "HEADS", message: "Resultado",
			},
		},
	});
	const showToast = vi.fn();
	const refetch = vi.fn().mockResolvedValue(undefined);
	const state = new Map<string, { value: number }>();
	const sandbox = {
		exports: {},
		require: (name: string) => {
			if (name === "@vue/apollo-composable") {
				return {
					useMutation: () => ({ mutate, loading: { value: false } }),
					useQuery: () => ({
						result: { value: { myCasinoStatus: { money: 10_000 } } },
						loading: { value: false }, error: { value: null }, refetch,
					}),
				};
			}
			if (name.endsWith("useMoneyFormat")) return { useMoneyFormat: () => ({ formatMoney: String }) };
			if (name.endsWith("useToast")) return { useToast: () => ({ showToast }) };
			return {};
		},
		ref: <T>(value: T) => ({ value }),
		computed: <T>(getter: () => T) => ({ get value() {
			return getter(); 
		} }),
		useState: (key: string, init: () => number) => {
			if (!state.has(key)) state.set(key, { value: init() });
			return state.get(key);
		},
		watch: vi.fn(),
		onMounted: vi.fn(),
		onUnmounted: vi.fn(),
		setTimeout,
		clearInterval,
		setInterval,
		Date,
		Math,
	};
	runInNewContext(outputText, sandbox);
	const game = (sandbox as typeof sandbox & {
		game: {
			play: (amount?: number) => Promise<void>;
			isPlaying: { value: boolean };
			cooldownSeconds: { value: number };
		};
	}).game;
	return { game, mutate, showToast, refetch };
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("Casino bet submission", () => {
	it("blocks overlapping bets and waits exactly ten seconds after the result", async () => {
		vi.useFakeTimers();
		const { game, mutate } = setupGame();
		const first = game.play();
		await game.play();
		expect(mutate).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(2_000);
		await first;
		expect(game.isPlaying.value).toBe(false);
		expect(game.cooldownSeconds.value).toBe(10);

		await vi.advanceTimersByTimeAsync(9_999);
		await game.play();
		expect(mutate).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		const second = game.play();
		expect(mutate).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(2_000);
		await second;
	});

	it("does not start a cooldown when the server rejects the bet", async () => {
		vi.useFakeTimers();
		const { game, mutate } = setupGame(false);
		const first = game.play();
		await vi.advanceTimersByTimeAsync(2_000);
		await first;
		expect(game.cooldownSeconds.value).toBe(0);
		const second = game.play();
		expect(mutate).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(2_000);
		await second;
	});

	it("rejects invalid amounts before sending a mutation", async () => {
		const { game, mutate } = setupGame();
		for (const amount of [NaN, Infinity, 0, 499, 10_001]) await game.play(amount);
		expect(mutate).not.toHaveBeenCalled();
	});
});
