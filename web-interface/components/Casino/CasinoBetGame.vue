<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { GetMyCasinoStatusDocument, PlayCoinFlipDocument } from "~/graphql/generated";

const { formatMoney } = useMoneyFormat();
const { showToast } = useToast();
const side = ref<"HEADS" | "TAILS">("HEADS");
const amount = ref(500);
const result = ref<{ won: boolean; resultSide: string; message: string } | null>(null);

const {
	result: statusResult,
	loading: statusLoading,
	error: statusError,
	refetch: refetchStatus,
} = useQuery(GetMyCasinoStatusDocument);
const money = computed(() => statusResult.value?.myCasinoStatus.money ?? 0);
const { mutate: playCoinFlip, loading: playing } = useMutation(PlayCoinFlipDocument);

async function play() {
	try {
		const response = await playCoinFlip({ side: side.value, amount: amount.value });
		const playResult = response?.data?.playCoinFlip;
		if (!playResult) {
			showToast({ text: "Não foi possível jogar agora.", variant: "error" });
			return;
		}

		if (playResult.success) {
			result.value = {
				won: playResult.won ?? false,
				resultSide: playResult.resultSide ?? "",
				message: playResult.message,
			};
		}
		showToast({ text: playResult.message, variant: playResult.success ? "success" : "error" });
		await refetchStatus();
	} catch {
		showToast({ text: "Não foi possível jogar agora. Tente novamente.", variant: "error" });
	}
}
</script>

<template>
	<BaseCard
		class="casino-game__card"
		title="Fazer aposta"
		subtitle="Acerte o lado da moeda e ganhe 1,5x sua aposta."
	>
		<p class="casino-game__balance">Saldo: {{ formatMoney(money) }}</p>
		<p
			v-if="statusError"
			class="casino-game__error"
			role="alert"
		>
			Não foi possível carregar seu saldo.
		</p>
		<form
			class="casino-game__form"
			@submit.prevent="play"
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
			<label class="casino-game__amount">
				Valor da aposta
				<input
					v-model.number="amount"
					type="number"
					min="500"
					:max="money"
					step="1"
					required
				>
			</label>
			<BaseButton
				type="submit"
				:disabled="statusLoading || playing || amount < 500 || amount > money"
			>
				{{ playing ? "Jogando..." : "Jogar" }}
			</BaseButton>
		</form>
		<p
			v-if="result"
			class="casino-game__result"
			:class="{ 'casino-game__result--win': result.won }"
			role="status"
		>
			{{ result.message }} Resultado: {{ result.resultSide === "HEADS" ? "cara" : "coroa" }}.
		</p>
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

	&__balance,
	&__result {
		color: #d7d1bf;
		margin-bottom: $spacing-md;
	}

	&__balance {
		display: inline-flex;
		padding: $spacing-xs $spacing-md;
		border: 1px solid rgba($color-gold, 0.25);
		border-radius: $radius-full;
		background: rgba($color-gold, 0.08);
		color: #ffe6a1;
		font-weight: 700;
	}

	&__result--win {
		color: $color-success;
	}

	&__error {
		color: $color-danger;
		margin-bottom: $spacing-md;
	}

	&__form {
		display: flex;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: $spacing-md;
	}

	&__sides {
		display: flex;
		gap: $spacing-md;
		border: 0;
		padding: 0;

		legend {
			margin-bottom: $spacing-sm;
			font-weight: 600;
		}

		label {
			display: inline-flex;
			align-items: center;
			gap: $spacing-xs;
			padding: $spacing-sm $spacing-md;
			border: 1px solid $border-card;
			border-radius: $radius-md;
			background: rgba($bg-input, 0.65);
			cursor: pointer;
			transition: border-color $transition-fast ease, background $transition-fast ease;

			&:has(input:checked) {
				border-color: $color-gold;
				background: rgba($color-gold, 0.1);
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

	&__amount {
		display: grid;
		gap: $spacing-xs;
		color: #e7e0ce;
		font-size: 0.875rem;
		font-weight: 600;

		input {
			width: 10rem;
			padding: $spacing-sm;
			color: $text-primary;
			background: $bg-card;
			border: 1px solid $border-subtle;
			border-radius: $radius-sm;

			&:focus-visible {
				border-color: $color-gold;
				outline: 2px solid rgba($color-gold, 0.35);
				outline-offset: 1px;
			}
		}
	}
}
</style>
