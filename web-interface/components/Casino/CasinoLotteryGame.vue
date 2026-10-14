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
		<template #actions>
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
			<p class="casino-game__balance">Saldo: {{ formatMoney(status.money) }}</p>
			<div
				v-if="status.hasActiveDraw"
				class="casino-game__details"
			>
				<p><strong>{{ status.isMegaDraw ? "Mega da Virada" : "Próximo sorteio" }}</strong></p>
				<p>Data: {{ formatDate(status.drawTime) }}</p>
				<p>Bilhete: {{ formatMoney(status.ticketCost ?? 0) }}</p>
				<p>Prêmio acumulado: {{ formatMoney(status.prizePool) }}</p>
				<p>Bilhetes vendidos: {{ status.totalTickets }}</p>
				<p v-if="status.previousWinnerName">
					Último vencedor: {{ status.previousWinnerName }} — {{ formatMoney(status.previousPrize ?? 0) }}
				</p>
			</div>
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
		font-weight: 700;
	}

	&__details {
		display: grid;
		gap: $spacing-sm;
		color: #d7d1bf;

		strong {
			color: $color-gold;
			font-size: 1.1rem;
		}

		p:not(:first-child) {
			padding-bottom: $spacing-xs;
			border-bottom: 1px solid rgba($border-subtle, 0.7);
		}
	}

	&__error {
		color: $color-danger;
	}

	&__success {
		color: $color-success;
	}
}
</style>
