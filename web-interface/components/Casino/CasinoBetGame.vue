<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { GetMyCasinoStatusDocument, PlayCoinFlipDocument } from "~/graphql/generated";

const { formatMoney } = useMoneyFormat();
const { showToast } = useToast();
const side = ref<"HEADS" | "TAILS">("HEADS");
const amount = ref(500);
const isBetModalOpen = ref(false);
const isPlaying = ref(false);
const nextBetAt = useState("casino-bet-next-play-at", () => 0);
const now = ref(Date.now());
const cooldownSeconds = computed(() => Math.max(0, Math.ceil((nextBetAt.value - now.value) / 1_000)));
let cooldownInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
	now.value = Date.now();
	cooldownInterval = setInterval(() => {
		now.value = Date.now();
	}, 250);
});
onUnmounted(() => clearInterval(cooldownInterval));

const startingBalance = ref<number | null>(null);
const displayedBalance = ref<number | null>(null);
const result = ref<{
	won: boolean;
	resultSide: string;
	selectedSide: string;
	amount: number;
	message: string;
} | null>(null);

const {
	result: statusResult,
	loading: statusLoading,
	error: statusError,
	refetch: refetchStatus,
} = useQuery(GetMyCasinoStatusDocument);
const queryBalance = computed(() => statusResult.value?.myCasinoStatus.money ?? null);
const money = computed(() => displayedBalance.value ?? queryBalance.value ?? 0);
const sessionBalance = computed(() => money.value - (startingBalance.value ?? money.value));
const { mutate: playCoinFlip, loading: playing } = useMutation(PlayCoinFlipDocument);

watch(
	queryBalance,
	(balance) => {
		if (balance === null) return;
		displayedBalance.value = balance;
		startingBalance.value ??= balance;
	},
	{ immediate: true },
);

const range = () => Math.floor(Math.random() * 1_001) + 2_000;
const wait = () => new Promise((resolve) => setTimeout(resolve, range()));

async function play(betAmount = amount.value, betSide = side.value) {
	now.value = Date.now();
	if (isPlaying.value || playing.value || cooldownSeconds.value > 0) return;
	if (
		statusLoading.value ||
		statusError.value ||
		!Number.isFinite(betAmount) ||
		betAmount < 500 ||
		betAmount > money.value
	)
		return;

	isPlaying.value = true;
	// Generate numbers between 2_000 and 3_000 (2s and 3s)

	try {
		const response = await playCoinFlip({ side: betSide, amount: betAmount });
		await wait();
		const playResult = response?.data?.playCoinFlip;
		if (!playResult) {
			showToast({ text: "Não foi possível jogar agora.", variant: "error" });
			return;
		}

		if (playResult.success) {
			now.value = Date.now();
			nextBetAt.value = now.value + 10_000;
			displayedBalance.value = playResult.money;
			result.value = {
				won: playResult.won ?? false,
				resultSide: playResult.resultSide ?? "",
				selectedSide: playResult.selectedSide ?? betSide,
				amount: playResult.amount ?? betAmount,
				message: playResult.message,
			};
		}
		showToast({ text: playResult.message, variant: playResult.success ? "success" : "error" });
		await refetchStatus();
	} catch {
		await wait();
		showToast({ text: "Não foi possível jogar agora. Tente novamente.", variant: "error" });
	} finally {
		isPlaying.value = false;
	}
}

function doubleBet() {
	amount.value *= 2;
}

function halfBet() {
	amount.value = Math.floor(amount.value / 2);
}

function goAllIn() {
	amount.value = money.value;
}

function sideName(value: string) {
	return value === "HEADS" ? "Cara" : "Coroa";
}
</script>

<template>
	<BaseCard
		class="casino-game__card"
		title="Cara ou coroa"
		subtitle="Acerte o lado da moeda e ganhe 1,5x sua aposta."
		no-body
	>
		<template #actions>
			<BaseModal
				v-model:open="isBetModalOpen"
				title="Fazer aposta"
				:description="`Escolha um lado da moeda e defina o valor da aposta. Sua grana atual é ${formatMoney(money)}.`"
			>
				<template #trigger>
					<BaseButton
						type="button"
						:disabled="statusLoading || !!statusError"
					>
						Começar a apostar
					</BaseButton>
				</template>
				<div
					v-if="isPlaying"
					class="casino-game__playing"
					role="status"
					aria-live="polite"
				>
					<div
						class="casino-game__coin"
						aria-hidden="true"
					>
						<div class="casino-game__coin-faces">
							<NuxtImg
								class="casino-game__coin-face casino-game__coin-face--front"
								src="/images/casino/bet/Heads.png"
								alt=""
								width="96"
								height="96"
							/>
							<NuxtImg
								class="casino-game__coin-face casino-game__coin-face--back"
								src="/images/casino/bet/Tails.png"
								alt=""
								width="96"
								height="96"
							/>
						</div>
					</div>
					<span>Jogando a moeda...</span>
				</div>
				<form
					v-else
					class="casino-game__form"
					@submit.prevent="play()"
				>
					<fieldset class="casino-game__sides">
						<legend>Escolha um lado</legend>
						<label>
							<input
								v-model="side"
								type="radio"
								value="HEADS"
							>
							<NuxtImg
								src="/images/casino/bet/Heads.png"
								alt=""
								width="48"
								height="48"
							/>
							Cara
						</label>
						<label>
							<input
								v-model="side"
								type="radio"
								value="TAILS"
							>
							<NuxtImg
								src="/images/casino/bet/Tails.png"
								alt=""
								width="48"
								height="48"
							/>
							Coroa
						</label>
					</fieldset>
					<div class="casino-game__bet">
						<label
							class="casino-game__amount"
							for="bet-amount"
						>
							Valor da aposta
							<BaseInput
								v-model.number="amount"
								type="number"
								min="500"
								:max="money"
								step="1"
								required
								id="bet-amount"
							/>
						</label>
						<BaseButton
							type="submit"
							:disabled="statusLoading || !!statusError || isPlaying || playing || cooldownSeconds > 0 || !Number.isFinite(amount) || amount < 500 || amount > money"
						>
							{{
								isPlaying || playing ? "Jogando..." : cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s` : "Apostar"
							}}
						</BaseButton>
					</div>
					<p
						v-if="cooldownSeconds > 0"
						role="status"
					>
						Aguarde {{ cooldownSeconds }}s para apostar novamente.
					</p>
					<div class="casino-game__quick-actions">
						<BaseButton
							type="button"
							variant="secondary"
							:disabled="playing || amount <= 500"
							@click="halfBet"
						>
							Meia aposta
						</BaseButton>
						<BaseButton
							type="button"
							variant="success"
							:disabled="playing || amount * 2 > money"
							@click="doubleBet"
						>
							Dobrar aposta
						</BaseButton>
						<BaseButton
							type="button"
							variant="danger"
							:disabled="playing || money < 500"
							@click="goAllIn"
						>
							ALL IN!
						</BaseButton>
					</div>
				</form>
				<template #footer>
					<section
						v-if="result"
						class="casino-game__outcome"
						:class="result.won ? 'casino-game__outcome--win' : 'casino-game__outcome--lose'"
						role="status"
						aria-label="Resultado da aposta"
					>
						<strong class="casino-game__outcome-title">
							O resultado foi
							<NuxtImg
								:src="`/images/casino/bet/${result.resultSide === 'HEADS' ? 'Heads' : 'Tails'}.png`"
								alt=""
								width="24"
								height="24"
							/>
							{{ sideName(result.resultSide) }}
						</strong>
						<span>{{ result.message }}</span>
						<small>Você apostou {{ formatMoney(result.amount) }} em {{ sideName(result.selectedSide) }}.</small>
						<span class="casino-game__session-balance">Balanço atual: {{ formatMoney(sessionBalance) }}</span>
					</section>
				</template>
			</BaseModal>
		</template>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.casino-game {
	&__card {
		border: 1px solid rgba($color-gold, 0.2);
		background: linear-gradient(145deg, rgba(#153426, 0.44), $bg-card 54%);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);

		:deep(.card-title) {
			color: #fff0cb;
		}
	}

	&__playing {
		display: grid;
		justify-items: center;
		gap: $spacing-md;
		padding: $spacing-xl 0;
		color: $color-gold;
		font-weight: $font-weight-bold;
		perspective: 32rem;
	}

	&__coin {
		width: 6rem;
		height: 6rem;
	}

	&__coin-faces {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		animation: coin-spin 0.8s linear infinite;
	}

	&__coin-face {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		backface-visibility: hidden;
		filter: drop-shadow(0 0 12px rgba($color-gold, 0.25));

		&--back {
			transform: rotateY(180deg);
		}
	}

	&__form {
		display: flex;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: $spacing-md;
	}

	&__outcome {
		display: grid;
		gap: $spacing-md;
		color: $text-secondary;
		font-weight: $font-weight-normal;

		&--win .casino-game__outcome-title {
			color: $color-success;
		}

		&--lose .casino-game__outcome-title {
			color: $color-danger;
		}
	}

	&__outcome-title {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		color: $text-primary;
		font-size: 1.05rem;
		font-weight: $font-weight-bold;
	}

	&__session-balance {
		padding-top: $spacing-md;
		font-size: $font-size-14;
	}

	&__sides {
		display: grid;
		flex: 1 1 100%;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: $spacing-md;
		border: 0;
		padding: 0;


		@media (max-width: 425px) {
			grid-template-columns: 1fr;
		}

		legend {
			grid-column: 1 / -1;
			margin-bottom: $spacing-sm;
			font-weight: $font-weight-semibold;
		}

		label {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: $spacing-sm;
			padding: $spacing-sm $spacing-md;
			border: 1px solid $border-card;
			border-radius: $radius-md;
			background: rgba($bg-input, 0.65);
			cursor: pointer;
			transition: border-color $transition-fast ease, background $transition-fast ease;
			font-weight: $font-weight-semibold;
			color: $text-secondary;

			input {
				position: absolute;
				width: 1px;
				height: 1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
			}

			&:has(input:checked) {
				border-color: $color-gold;
				background: rgba($color-gold, 0.1);
				color: $color-gold;
			}

			&:has(input:focus-visible) {
				outline: 2px solid $color-brand;
				outline-offset: 2px;
			}

			img {
				width: 3rem;
				height: 3rem;
				object-fit: contain;
			}
		}
	}

	&__bet {
		display: grid;
		width: 100%;
		grid-template-columns: repeat(2, 1fr);
		align-items: end;
		gap: $spacing-md;

		@media (max-width: 425px) {
			grid-template-columns: 1fr;
		}

		button {
			margin-bottom: $spacing-xs;
		}
	}

	&__amount {
		display: grid;
		gap: $spacing-xs;
		color: #e7e0ce;
		font-size: $font-size-14;
		font-weight: $font-weight-semibold;
	}

	&__quick-actions {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;

		> * {
			flex: 1 1 auto;
		}
	}
}

@keyframes coin-spin {
	from {
		transform: rotateY(0);
	}
	to {
		transform: rotateY(360deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.casino-game__coin-faces {
		animation: none;
	}
}
</style>
