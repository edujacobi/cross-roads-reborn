<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import DashboardClassDistribution from "~/components/Dashboard/DashboardClassDistribution.vue";
import DashboardItemPopularity from "~/components/Dashboard/DashboardItemPopularity.vue";
import DashboardStatusBox from "~/components/Dashboard/DashboardStatusBox.vue";
import DashboardUserChart from "~/components/Dashboard/DashboardUserChart.vue";
import DashboardUserHistory from "~/components/Dashboard/DashboardUserHistory.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { imagePaths } from "~/constants/imagePaths";
import {
	GetDashboardHistoryDocument,
	type GetDashboardHistoryQuery,
	GetDashboardItemPopularityDocument,
	type GetDashboardItemPopularityQuery,
	GetDashboardStatsDocument,
	type GetDashboardStatsQuery,
	SetVaultBalanceDocument,
	VaultType,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Dashboard",
});

const auth = useAuth();
const { showToast } = useToast();
const { result: statsResult, loading: statsLoading, refetch: refetchStats } = useQuery(GetDashboardStatsDocument);
const { mutate: setVaultBalance, loading: savingVault } = useMutation(SetVaultBalanceDocument);
const selectedVault = ref<VaultType | null>(null);
const vaultAmount = ref<string | number>("");
const {
	result: itemPopularityResult,
	loading: itemPopularityLoading,
	refetch: refetchItemPopularity,
} = useQuery(GetDashboardItemPopularityDocument);

const {
	result: historyResult,
	loading: historyLoading,
	refetch: refetchHistory,
} = useQuery(GetDashboardHistoryDocument);

const stats = computed<GetDashboardStatsQuery["dashboardStats"] | undefined>(() => statsResult.value?.dashboardStats);
const { formatMoney } = useMoneyFormat();
const itemPopularity = computed<GetDashboardItemPopularityQuery["dashboardItemPopularity"]>(
	() => itemPopularityResult.value?.dashboardItemPopularity || [],
);
const history = computed<GetDashboardHistoryQuery["dashboardHistory"]>(
	() => historyResult.value?.dashboardHistory || [],
);

function refreshData() {
	refetchStats();
	refetchHistory();
	refetchItemPopularity();
}

function openVault(vault: VaultType) {
	if (!stats.value) return;
	selectedVault.value = vault;
	vaultAmount.value = vault === VaultType.Bank ? stats.value.bankVaultValue : stats.value.casinoVaultValue;
}

function updateVaultModal(open: boolean) {
	if (!open) selectedVault.value = null;
}

async function saveVault() {
	const amount = Number(vaultAmount.value);
	if (vaultAmount.value === "" || !Number.isSafeInteger(amount) || amount < 0 || !selectedVault.value) {
		showToast({ variant: "error", text: "Informe um saldo inteiro igual ou maior que zero." });
		return;
	}
	try {
		const response = await setVaultBalance({ vault: selectedVault.value, amount });
		const result = response?.data?.setVaultBalance;
		if (!result?.success) {
			showToast({ variant: "error", text: result?.message || "Não foi possível atualizar o cofre." });
			return;
		}
		selectedVault.value = null;
		showToast({ variant: "success", text: result.message });
		await refetchStats();
	} catch (error: unknown) {
		showToast({ variant: "error", text: error instanceof Error ? error.message : "Erro ao atualizar o cofre." });
	}
}
</script>

<template>
	<main class="dashboard-page">
		<PageTitle
			title="Dashboard"
			subtitle="Visão geral em tempo real da economia e jogadores"
		>
			<template #actions>
				<RefreshButton
					variant="secondary"
					:loading="statsLoading || historyLoading || itemPopularityLoading"
					@refresh="refreshData()"
				/>
			</template>
		</PageTitle>

		<section
			class="status-grid"
			aria-labelledby="player-status-heading"
		>
			<DashboardStatusBox
				variant="idle"
				:value="stats?.idleCount"
			/>
			<DashboardStatusBox
				variant="working"
				:value="stats?.jobCount"
			/>
			<DashboardStatusBox
				variant="scavenge"
				:value="stats?.scavengeCount"
			/>
			<DashboardStatusBox
				variant="casino"
				:value="stats?.casinoCount"
			/>
			<DashboardStatusBox
				variant="hospital"
				:value="stats?.hospitalCount"
			/>
			<DashboardStatusBox
				variant="prison"
				:value="stats?.prisonCount"
			/>
			<DashboardStatusBox
				variant="robbery"
				:value="stats?.robberyCount"
			/>
			<DashboardStatusBox
				variant="beatup"
				:value="stats?.beatUpCount"
			/>
		</section>

		<section
			class="vault-grid"
			aria-label="Valores dos cofres"
		>
			<BaseCard
				title="Cofre do Banco"
				:icon="imagePaths.uiElements.vaultBank"
				no-body
			>
				<template #actions>
					{{ formatMoney(stats?.bankVaultValue ?? 0) }}
					<BaseButton v-if="auth.canWrite.value" variant="secondary" size="sm" :disabled="!stats || savingVault" @click="openVault(VaultType.Bank)">Alterar</BaseButton>
				</template>
			</BaseCard>
			<BaseCard
				title="Cofre do Cassino"
				:icon="imagePaths.uiElements.vaultCasino"
				no-body
			>
				<template #actions>
					{{ formatMoney(stats?.casinoVaultValue ?? 0) }}
					<BaseButton v-if="auth.canWrite.value" variant="secondary" size="sm" :disabled="!stats || savingVault" @click="openVault(VaultType.Casino)">Alterar</BaseButton>
				</template>
			</BaseCard>
		</section>

		<BaseModal
			:open="selectedVault !== null"
			:title="selectedVault === VaultType.Bank ? 'Alterar cofre do Banco' : 'Alterar cofre do Cassino'"
			description="Defina o novo saldo do cofre."
			:dismissible="!savingVault"
			@update:open="updateVaultModal"
		>
			<BaseInput id="vault-balance" v-model="vaultAmount" label="Saldo (Cr$)" type="number" :min="0" :step="1" />
			<template #footer>
				<BaseButton variant="ghost" :disabled="savingVault" @click="selectedVault = null">Cancelar</BaseButton>
				<BaseButton :disabled="savingVault" @click="saveVault">Confirmar alteração</BaseButton>
			</template>
		</BaseModal>

		<div class="details-row">
			<DashboardUserChart
				:history="history"
				:current-stats="stats"
				:history-loading="historyLoading"
			/>
			<DashboardCountData
				:total-players="stats?.totalPlayers"
				:all-users="stats?.allUsers"
				:total-gangs="stats?.totalGangs"
				:english-count="stats?.englishCount"
				:portuguese-count="stats?.portugueseCount"
				:spanish-count="stats?.spanishCount"
			/>
		</div>

		<DashboardClassDistribution
			:history="history"
			:current-stats="stats"
			:history-loading="historyLoading"
			:stats-loading="statsLoading"
		/>

		<div class="two-collumns">
			<DashboardItemPopularity
				:items="itemPopularity"
				:loading="itemPopularityLoading"
			/>
			<DashboardUserHistory
				:history="history"
				:history-loading="historyLoading"
			/>
		</div>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.dashboard-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
	container-name: page;
	container-type: inline-size;

	> * {
		animation: reveal-up 0.45s $motion-ease-out both;
	}

	@for $index from 1 through 6 {
		> *:nth-child(#{$index}) {
			animation-delay: #{$index * 35}ms;
		}
	}
}

.status-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-auto-rows: 1fr;
	gap: $spacing-md;

	// ponytail: responsive columns for dashboard status boxes
	@container page (max-width: 900px) {
		grid-template-columns: repeat(3, 1fr);
	}

	@container page (max-width: 650px) {
		grid-template-columns: repeat(2, 1fr);
	}
	@container page (max-width: 480px) {
		gap: $spacing-sm;
	}
}

.vault-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: $spacing-md;

	@container page (max-width: 600px) {
		grid-template-columns: 1fr;
	}
}

.details-row {
	display: grid;
	grid-template-columns: 1fr 320px ;
	gap: 20px;

	@container page (max-width: 900px) {
		grid-template-columns: 1fr;
	}
}

.two-collumns {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;

	@container page (max-width: 900px) {
		grid-template-columns: 1fr;
	}
}
</style>
