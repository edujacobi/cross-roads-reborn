<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { GetMyHorseRaceStatusDocument, PlaceHorseRaceBetDocument } from "~/graphql/generated";

const { formatMoney } = useMoneyFormat();
const { showToast } = useToast();
const {
	result: statusResult,
	loading: statusLoading,
	error: statusError,
	refetch: refetchStatus,
} = useQuery(GetMyHorseRaceStatusDocument, {}, { fetchPolicy: "cache-and-network" });
const status = computed(() => statusResult.value?.myHorseRaceStatus);
const amount = ref(5_000);
const selectedHorseId = ref<number | null>(null);
const { mutate: placeBet, loading: betting } = useMutation(PlaceHorseRaceBetDocument);
const horseImages: Record<number, string> = {
	1: "/images/casino/horse-race/Lightning.png",
	2: "/images/casino/horse-race/Thunder.png",
	3: "/images/casino/horse-race/Ghost.png",
	4: "/images/casino/horse-race/Shadow.png",
	5: "/images/casino/horse-race/Mystic.png",
};

watch(status, (value) => {
	if (!selectedHorseId.value && value?.horses.length) {
		selectedHorseId.value = value.horses[0]?.id ?? null;
	}
});

async function submitBet() {
	if (!status.value?.raceId || selectedHorseId.value === null) return;
	try {
		const response = await placeBet({
			raceId: status.value.raceId,
			horseId: selectedHorseId.value,
			amount: amount.value,
		});
		const result = response?.data?.placeHorseRaceBet;
		if (!result) {
			showToast({ text: "Não foi possível registrar a aposta.", variant: "error" });
			return;
		}
		showToast({ text: result.message, variant: result.success ? "success" : "error" });
		await refetchStatus();
	} catch {
		showToast({ text: "Não foi possível registrar a aposta. Tente novamente.", variant: "error" });
	}
}

function formatDate(date: string | null | undefined) {
	return date ? new Date(date).toLocaleString("pt-BR") : "Indisponível";
}
</script>

<template>
	<BaseCard
		title="Aposte na próxima corrida"
		subtitle="Escolha seu cavalo e aposte antes do fechamento."
	>
		<BaseSkeleton
			v-if="statusLoading && !status"
			height="7rem"
		/>
		<p
			v-else-if="statusError"
			class="casino-game__error"
			role="alert"
		>
			Não foi possível carregar os dados da corrida. Tente novamente mais tarde.
		</p>
		<template v-else-if="status">
			<p class="casino-game__balance">Saldo: {{ formatMoney(status.money) }}</p>
			<p>Próxima corrida: {{ formatDate(status.raceTime) }}</p>
			<p>Apostas: {{ status.totalBets }}</p>
			<p
				v-if="status.hasBet"
				class="casino-game__success"
				role="status"
			>
				Sua aposta de {{ formatMoney(status.betAmount ?? 0) }} em
				{{ status.horses.find((horse) => horse.id === status.betHorseId)?.name ?? "seu cavalo" }} foi registrada.
			</p>
			<p
				v-else-if="!status.isBettingOpen"
				class="casino-game__hint"
			>
				As apostas desta corrida estão encerradas.
			</p>
			<form
				v-else
				class="casino-game__form"
				@submit.prevent="submitBet"
			>
				<fieldset class="casino-game__horses">
					<legend>Escolha seu cavalo</legend>
					<label
						v-for="horse in status.horses"
						:key="horse.id"
					>
						<input
							v-model="selectedHorseId"
							type="radio"
							:value="horse.id"
							required
						>
						<NuxtImg
							:src="horseImages[horse.id] ?? '/images/casino/horse-race/HorseRacing.png'"
							alt=""
							width="120"
							height="120"
						/>
						<span>{{ horse.name }} — {{ horse.multiplier }}×</span>
					</label>
				</fieldset>
				<p
					v-if="selectedHorseId"
					class="casino-game__description"
				>
					{{ status.horses.find((horse) => horse.id === selectedHorseId)?.description }}
				</p>
				<label>
					Valor (mínimo {{ formatMoney(5_000) }})
					<input
						v-model.number="amount"
						type="number"
						min="5000"
						:max="status.maxBet"
						step="1"
						required
					>
				</label>
				<BaseButton
					type="submit"
					:disabled="betting || amount < 5_000 || amount > status.maxBet"
				>
					{{ betting ? "Registrando..." : "Apostar" }}
				</BaseButton>
			</form>
		</template>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.casino-game {
	&__balance,
	&__description,
	&__hint {
		color: $text-secondary;
		margin: $spacing-sm 0;
	}

	&__error {
		color: $color-danger;
	}

	&__success {
		color: $color-success;
		margin-top: $spacing-md;
	}

	&__form {
		display: grid;
		max-width: 24rem;
		gap: $spacing-md;
		margin-top: $spacing-md;

		label {
			display: grid;
			gap: $spacing-xs;
			font-size: 0.875rem;
			font-weight: 600;
		}

		input[type="number"] {
			width: 100%;
			padding: $spacing-sm;
			color: $text-primary;
			background: $bg-card;
			border: 1px solid $border-subtle;
			border-radius: $radius-sm;
		}
	}

	&__horses {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: $spacing-sm;
		border: 0;
		padding: 0;

		legend {
			grid-column: 1 / -1;
			margin-bottom: $spacing-sm;
			font-weight: 600;
		}

		label {
			display: grid;
			justify-items: center;
			gap: $spacing-xs;
			padding: $spacing-sm;
			border: 1px solid $border-subtle;
			border-radius: $radius-sm;
			cursor: pointer;
			text-align: center;

			&:has(input:checked) {
				border-color: $color-brand;
			}

			img {
				width: 6rem;
				height: 6rem;
				object-fit: contain;
			}

			input {
				width: auto;
			}
		}
	}
}
</style>
