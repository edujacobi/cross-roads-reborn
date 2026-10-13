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
		title="Seu bilhete"
		subtitle="Compre um bilhete para concorrer ao prêmio acumulado."
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
	&__balance {
		margin-bottom: $spacing-md;
		color: $text-secondary;
	}

	&__details {
		display: grid;
		gap: $spacing-sm;
		color: $text-secondary;
	}

	&__error {
		color: $color-danger;
	}

	&__success {
		color: $color-success;
	}
}
</style>
