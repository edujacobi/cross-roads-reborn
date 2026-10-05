<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { ScrollText } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseErrorState from "~/components/ui/BaseErrorState.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { GetAdminAuditLogsDocument, type GetAdminAuditLogsQuery } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Registro de auditoria",
});

const auth = useAuth();
const { shortDateTime } = useDateFormat();
const { page, pageSize, offset, resetPage } = usePagination(1, 25);
const isDeveloper = computed(() => auth.isDeveloper.value);
const selectedEntry = ref<GetAdminAuditLogsQuery["adminAuditLogs"]["entries"][number] | null>(null);
const selectedActionId = ref("");
const paginationLabels = {
	item: "ações",
	navigation: "Paginação do registro de auditoria",
};
const { result, loading, error } = useQuery(
	GetAdminAuditLogsDocument,
	() => ({
		limit: pageSize,
		offset: offset.value,
		actionId: selectedActionId.value ? Number(selectedActionId.value) : undefined,
	}),
	{ enabled: computed(() => auth.canWrite.value) },
);

const auditPage = computed(() => result.value?.adminAuditLogs);
const entries = computed<GetAdminAuditLogsQuery["adminAuditLogs"]["entries"]>(() => auditPage.value?.entries ?? []);
const total = computed(() => auditPage.value?.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

function prevPage() {
	if (page.value > 1) page.value--;
}

function nextPage() {
	if (page.value < totalPages.value) page.value++;
}

const actionNames: Record<number, string> = {
	1: "Alterar permissão do Golpe principal",
	2: "Encerrar temporada",
	3: "Criar evento",
	4: "Atualizar evento",
	5: "Excluir evento",
	6: "Alterar dinheiro",
	7: "Curar jogador",
	8: "Libertar jogador",
	9: "Redefinir tempo de espera",
	10: "Remover ação",
	11: "Alterar item",
	12: "Adicionar moedas especiais",
	13: "Alterar classe",
	14: "Alterar nickname",
	15: "Alterar VIP",
	16: "Matar jogador",
	17: "Adicionar insígnia",
	18: "Remover insígnia",
	19: "Trocar contas",
	20: "Excluir jogador",
};

const settingNames: Record<number, string> = {
	1: "Permissão do Golpe principal",
	2: "Temporada",
	3: "Eventos",
	4: "Contas de jogadores",
};

const actionOptions = Object.entries(actionNames).map(([id, name]) => ({ id, name }));

watch(selectedActionId, () => {
	resetPage();
});

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
	return shortDateTime(value);
}

function openEntry(entry: GetAdminAuditLogsQuery["adminAuditLogs"]["entries"][number]) {
	if (isDeveloper.value) selectedEntry.value = entry;
}

function setModalOpen(isOpen: boolean) {
	if (!isOpen) selectedEntry.value = null;
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
			<template #header>
				<label class="audit-filter">
					<span>Filtrar por ação</span>
					<select
						v-model="selectedActionId"
						aria-label="Filtrar por ação"
					>
						<option value="">Todas as ações</option>
						<option
							v-for="action in actionOptions"
							:key="action.id"
							:value="action.id"
						>
							{{ action.name }}
						</option>
					</select>
				</label>
			</template>
			<BaseTableSkeleton
				v-if="loading"
				:rows="pageSize"
				:columns="6"
				label="Carregando registro de auditoria"
			/>
			<BaseErrorState v-else-if="error">
				Não foi possível carregar o registro de auditoria.
			</BaseErrorState>
			<BaseEmptyState
				v-else-if="entries.length === 0"
				:icon="ScrollText"
			>
				Nenhuma ação administrativa registrada.
			</BaseEmptyState>
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
							:class="{ 'audit-row--clickable': isDeveloper }"
							:tabindex="isDeveloper ? 0 : undefined"
							@click="openEntry(entry)"
							@keydown.enter="openEntry(entry)"
							@keydown.space.prevent="openEntry(entry)"
						>
							<td>
								<div class="audit-person">
									<NuxtImg
										v-if="entry.adminAvatarUrl"
										:src="entry.adminAvatarUrl"
										class="audit-avatar"
										width="32"
										height="32"
										alt=""
									/>
									<div>
										<strong class="audit-user-name">{{ entry.adminName }}</strong>
										<small class="audit-secondary">{{ entry.adminId }}</small>
									</div>
								</div>
							</td>
							<td>{{ actionNames[entry.actionId] || `Ação #${entry.actionId}` }}</td>
							<td>
								<template v-if="entry.targetUserId">
									<div class="audit-person">
										<NuxtImg
											v-if="entry.targetUserAvatarUrl"
											:src="entry.targetUserAvatarUrl"
											class="audit-avatar"
											width="32"
											height="32"
											alt=""
										/>
										<div>
											<strong class="audit-user-name">{{ entry.targetUserName || entry.targetUserId }}</strong>
											<small class="audit-secondary">{{ entry.targetUserId }}</small>
										</div>
									</div>
								</template>
								<template v-else>
									{{ settingNames[entry.targetSettingId ?? 0] || `Funcionalidade #${entry.targetSettingId}` }}
								</template>
							</td>
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

		<BaseModal
			v-if="isDeveloper"
			:open="selectedEntry !== null"
			title="Dados do acesso administrativo"
			:description="selectedEntry ? `${selectedEntry.adminName} · ${formatDate(selectedEntry.createdAt)}` : undefined"
			@update:open="setModalOpen($event)"
		>
			<dl
				v-if="selectedEntry"
				class="audit-access-details"
			>
				<div>
					<dt>Endereço IP</dt>
					<dd>{{ selectedEntry.adminIpAddress || "Desconhecido" }}</dd>
				</div>
				<div>
					<dt>Dispositivo</dt>
					<dd>{{ selectedEntry.adminDeviceType || "Desconhecido" }}</dd>
				</div>
				<div>
					<dt>Sistema operacional</dt>
					<dd>{{ selectedEntry.adminOperatingSystem || "Desconhecido" }}</dd>
				</div>
				<div>
					<dt>Navegador</dt>
					<dd>{{ selectedEntry.adminBrowser || "Desconhecido" }}</dd>
				</div>
			</dl>
		</BaseModal>
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

.audit-filter {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: $text-secondary;
	font-size: 0.8125rem;

	select {
		padding: 0.5rem 0.75rem;
		border: 1px solid $border-subtle;
		border-radius: 0.375rem;
		background: $bg-input;
		color: $text-primary;
	}
}

.audit-person {
	display: flex;
	align-items: center;
	gap: 0.625rem;
}

.audit-avatar {
	flex: 0 0 36px;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	object-fit: cover;
}

.audit-user-name {
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

.audit-row--clickable {
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background-color: rgba($bg-input, 0.12);
	}

	&:focus-visible {
		outline: 2px solid $color-brand;
		outline-offset: -2px;
	}
}

.audit-access-details {
	display: grid;
	gap: $spacing-md;
	margin: 0;

	dt {
		color: $text-muted;
		font-size: 0.8125rem;
	}

	dd {
		margin: 0.25rem 0 0;
		color: $text-primary;
		font-family: monospace;
		overflow-wrap: anywhere;
	}
}
</style>
