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
import { imagePaths } from "~/constants/imagePaths";
import { BuyLotteryTicketDocument, GetMyLotteryStatusDocument } from "~/graphql/generated";

const { formatMoney } = useMoneyFormat();
const { showToast } = useToast();
const {
	result: statusResult,
	loading: statusLoading,
	error: statusError,
	refetch: refetchStatus,
} = useQuery(GetMyLotteryStatusDocument, {}, { fetchPolicy: "cache-and-network" });
const status = computed(() => statusResult.value?.myLotteryStatus);
const { mutate: buyTicket, loading: buying } = useMutation(BuyLotteryTicketDocument);

async function purchaseTicket() {
	try {
		const response = await buyTicket();
		const result = response?.data?.buyLotteryTicket;
		if (!result) {
			showToast({ text: "Não foi possível comprar o bilhete.", variant: "error" });
			return;
		}
		showToast({ text: result.message, variant: result.success ? "success" : "error" });
		await refetchStatus();
	} catch {
		showToast({ text: "Não foi possível comprar o bilhete. Tente novamente.", variant: "error" });
	}
}

function formatDate(date: string | null | undefined) {
	return date ? new Date(date).toLocaleString("pt-BR") : "Indisponível";
}
</script>

<template>
	<BaseCard
		class="casino-game__card"
		title="Seu bilhete"
		subtitle="Compre um bilhete para concorrer ao prêmio acumulado."
	>
		<template
			#actions
			v-if="status"
		>
			<p
				v-if="status.hasTicket"
				class="casino-game__success"
				role="status"
			>
				Você já tem o bilhete #{{ status.ticketId }}. Boa sorte!
			</p>
			<BaseButton
				v-else
				:disabled="buying || status.money < (status.ticketCost ?? 0)"
				@click="purchaseTicket"
			>
				{{ buying ? "Comprando..." : "Comprar bilhete" }}
			</BaseButton>
		</template>
		<BaseSkeleton
			v-if="statusLoading && !status"
			height="7rem"
		/>
		<p
			v-else-if="statusError"
			class="casino-game__error"
			role="alert"
		>
			Não foi possível carregar os dados do sorteio. Tente novamente mais tarde.
		</p>
		<template v-else-if="status">
			<p class="casino-game__balance">Sua grana: {{ formatMoney(status.money) }}</p>
			<section
				v-if="status.hasActiveDraw"
				class="casino-game__details"
				aria-label="Detalhes do sorteio"
			>
				<h3 :class="{ 'casino-game__mega-draw': status.isMegaDraw }">
					{{ status.isMegaDraw ? "Mega da Virada" : "Próximo sorteio" }}
				</h3>
				<dl class="casino-game__draw-stats">
					<div>
						<dt>Data</dt>
						<dd>{{ formatDate(status.drawTime) }}</dd>
					</div>
					<div>
						<dt>Preço do Bilhete</dt>
						<dd>{{ formatMoney(status.ticketCost ?? 0) }}</dd>
					</div>
					<div>
						<dt>Prêmio acumulado</dt>
						<dd>{{ formatMoney(status.prizePool) }} ({{ status.totalTickets }} bilhetes)</dd>
					</div>
				</dl>
				<p
					v-if="status.previousWinnerName"
					class="casino-game__last-winner"
					role="status"
				>
					<NuxtImg
						:src="imagePaths.badges.topCasinoWR"
						alt=""
						width="20"
					/>
					Último vencedor: {{ status.previousWinnerName }} ganhou
					{{ formatMoney(status.previousPrize ?? 0) }}
				</p>
			</section>
			<p v-else>Não há sorteio ativo no momento.</p>
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

	&__balance {
		display: inline-flex;
		margin-bottom: $spacing-md;
		padding: $spacing-xs $spacing-md;
		border: 1px solid rgba($color-gold, 0.25);
		border-radius: $radius-full;
		background: rgba($color-gold, 0.08);
		color: #ffe6a1;
		font-weight: $font-weight-bold;
	}

	&__details {
		display: grid;
		gap: $spacing-md;
		color: #d7d1bf;

		h3 {
			color: $color-gold;
			font-size: 1.1rem;
			line-height: 2;
		}
	}

	&__draw-stats {
		display: grid;
		gap: $spacing-sm;

		> div {
			display: flex;
			justify-content: space-between;
			gap: $spacing-md;
		}

		dt {
			color: $text-secondary;
		}

		dd {
			text-align: right;
		}
	}

	&__last-winner {
		font-size: $font-size-14;
		color: $text-secondary;
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__mega-draw {
		color: color-mix(in lab, $color-casino 100%, $text-primary 60%);
		font-size: $font-size-24;
	}

	&__error {
		color: $color-danger;
	}

	&__success {
		color: $color-success;
	}
}
</style>
