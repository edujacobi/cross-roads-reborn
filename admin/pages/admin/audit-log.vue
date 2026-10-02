<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { ScrollText } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { GetAdminAuditLogsDocument, type GetAdminAuditLogsQuery } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Registro de auditoria",
});

const auth = useAuth();
const page = ref(1);
const pageSize = 25;
const paginationLabels = {
	item: "ações",
	navigation: "Paginação do registro de auditoria",
};
const offset = computed(() => (page.value - 1) * pageSize);
const { result, loading, error } = useQuery(
	GetAdminAuditLogsDocument,
	() => ({ limit: pageSize, offset: offset.value }),
	{ enabled: computed(() => auth.isDeveloper.value) },
);

const auditPage = computed(() => result.value?.adminAuditLogs);
const entries = computed<GetAdminAuditLogsQuery["adminAuditLogs"]["entries"]>(() => auditPage.value?.entries ?? []);
const total = computed(() => auditPage.value?.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

const actionNames: Record<string, string> = {
	setMainHeistAllowed: "Alterar permissão do Golpe principal",
	endSeason: "Encerrar temporada",
	createEvent: "Criar evento",
	updateEvent: "Atualizar evento",
	deleteEvent: "Excluir evento",
	setMoney: "Alterar dinheiro",
	cureUser: "Curar jogador",
	freeUser: "Libertar jogador",
	resetCooldown: "Redefinir tempo de espera",
	removeAction: "Remover ação",
	setItem: "Alterar item",
	addSpecialCoins: "Adicionar moedas especiais",
	setClass: "Alterar classe",
	setNickname: "Alterar nickname",
	setVip: "Alterar VIP",
	killUser: "Matar jogador",
	addBadge: "Adicionar insígnia",
	removeBadge: "Remover insígnia",
	swapUsers: "Trocar contas",
	deleteUser: "Excluir jogador",
};

function formatValue(value: string): string {
	try {
		const parsed: unknown = JSON.parse(value);
		if (parsed === null) return "—";
		return typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
	} catch {
		return value;
	}
}

function formatDate(value: string): string {
	return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

function prevPage() {
	if (page.value > 1) page.value--;
}

function nextPage() {
	if (page.value < totalPages.value) page.value++;
}
</script>

<template>
	<main class="audit-log-page">
		<PageTitle
			title="Registro de auditoria"
			subtitle="Histórico das alterações administrativas realizadas no jogo"
		/>

		<BaseCard
			title="Ações administrativas"
			no-padding-x
			no-padding-y
		>
			<div
				v-if="loading"
				class="audit-state"
				role="status"
			>
				Carregando registro de auditoria...
			</div>
			<div
				v-else-if="error"
				class="audit-state audit-state--error"
				role="alert"
			>
				Não foi possível carregar o registro de auditoria.
			</div>
			<div
				v-else-if="entries.length === 0"
				class="audit-state"
			>
				<ScrollText
					:size="32"
					aria-hidden="true"
				/>
				Nenhuma ação administrativa registrada.
			</div>
			<BaseTable v-else>
				<table>
					<caption class="visually-hidden">
						Histórico das ações administrativas
					</caption>
					<thead>
						<tr>
							<th scope="col">Administrador</th>
							<th scope="col">Ação</th>
							<th scope="col">Alvo</th>
							<th scope="col">Valor anterior</th>
							<th scope="col">Novo valor</th>
							<th scope="col">Data</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="entry in entries"
							:key="entry.id"
						>
							<td>
								<strong class="audit-admin-name">{{ entry.adminName }}</strong>
								<small class="audit-secondary">{{ entry.adminId }}</small>
							</td>
							<td>{{ actionNames[entry.action] || entry.action }}</td>
							<td>{{ entry.target }}</td>
							<td class="audit-value">{{ formatValue(entry.previousValue) }}</td>
							<td class="audit-value">{{ formatValue(entry.newValue) }}</td>
							<td>
								<time :datetime="entry.createdAt">{{ formatDate(entry.createdAt) }}</time>
							</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template
				v-if="total > 0"
				#footer
			>
				<BaseTableFooter
					:labels="paginationLabels"
					:index="entries.length"
					:offset="offset"
					:total="total"
					:page="page"
					:pages="totalPages"
					@click-previous="prevPage()"
					@click-next="nextPage()"
				/>
			</template>
		</BaseCard>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.audit-log-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.audit-state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-sm;
	padding: 3rem 1.25rem;
	color: $text-secondary;
	text-align: center;
}

.audit-state--error {
	color: $color-danger;
}

.audit-admin-name {
	color: $text-primary;
}

.audit-secondary {
	display: block;
	margin-top: 0.2rem;
	color: $text-muted;
	font-size: 0.75rem;
	font-family: monospace;
}

.audit-value {
	max-width: 24rem;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
</style>
