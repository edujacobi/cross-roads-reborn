<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { Check, History, Search, Send } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSelector, { type SelectorOption } from "~/components/ui/BaseSelector.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { usePagination } from "~/composables/usePagination";
import { type SortColumn, useSorting } from "~/composables/useSorting";
import { imagePaths } from "~/constants/imagePaths";
import {
	ApplyToGangDocument,
	CancelGangJoinRequestDocument,
	CreateGangDocument,
	GangJoinRequestStatus,
	GangRecruitmentBoardDocument,
	type GangRecruitmentBoardEntry,
	GangRecruitmentType,
	JoinOpenGangDocument,
	MyActiveGangJoinRequestDocument,
	MyGangJoinRequestsHistoryDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Gangues",
});

const auth = useAuth();
const { showToast } = useToast();
const { formatMoney } = useMoneyFormat();
const { getGangBaseImageUrl } = useGangBase();

const userGang = computed(() => auth.user?.value?.gangId ?? 0);

// Filter & Search states
const BOARD_PAGE_SIZE = 25;
const { page, pageSize: boardPageSize, offset, resetPage } = usePagination(1, BOARD_PAGE_SIZE);
const { sortColumn, sortDirection, toggleSort } = useSorting();
const boardColumns: SortColumn[] = [
	{ key: "name", label: "Gangue", sortable: true, class: "col-gang" },
	{ key: "base", label: "Base", sortable: true },
	{ key: "membersCount", label: "Membros", sortable: true },
	{ key: "recruitmentType", label: "Adesão", sortable: true },
	{ key: "action", label: "Ação", class: "col-action" },
];
const searchQuery = ref("");
const selectedRecruitmentFilter = ref("ALL");

const recruitmentFilterOptions: SelectorOption[] = [
	{ label: "Todos os tipos", value: "ALL" },
	{ label: "Aberto", value: "OPEN" },
	{ label: "Aprovação", value: "APPROVAL" },
];

const filterTypeArg = computed(() => {
	if (selectedRecruitmentFilter.value === "OPEN") return GangRecruitmentType.Open;
	if (selectedRecruitmentFilter.value === "APPROVAL") return GangRecruitmentType.Approval;
	return undefined;
});

// Board Query
const {
	result: boardData,
	loading: loadingBoard,
	refetch: refetchBoard,
} = useQuery(
	GangRecruitmentBoardDocument,
	() => ({
		search: searchQuery.value.trim() || undefined,
		type: filterTypeArg.value,
		sortBy: sortColumn.value || undefined,
		sortOrder: sortDirection.value?.toUpperCase() || undefined,
		limit: boardPageSize.value,
		offset: offset.value,
	}),
	{ debounce: 300 },
);

const recruitingBoard = computed(() => boardData.value?.gangRecruitmentBoard);
const recruitingGangs = computed<GangRecruitmentBoardEntry[]>(() => recruitingBoard.value?.entries ?? []);
const totalGangs = computed(() => recruitingBoard.value?.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalGangs.value / boardPageSize.value)));

watch([searchQuery, selectedRecruitmentFilter], () => {
	resetPage();
});

function handleSort(column: string) {
	toggleSort(column);
	resetPage();
}

function previousPage() {
	if (!loadingBoard.value && page.value > 1) page.value--;
}

function nextPage() {
	if (!loadingBoard.value && page.value < totalPages.value) page.value++;
}

watch([page, totalPages], () => {
	if (page.value > totalPages.value) page.value = totalPages.value;
});

// Active request query
const { result: activeRequestData, refetch: refetchActiveRequest } = useQuery(MyActiveGangJoinRequestDocument);

const activeRequest = computed(() => activeRequestData.value?.myActiveGangJoinRequest);

// History query & modal
const isHistoryModalOpen = ref(false);
const {
	result: historyData,
	loading: loadingHistory,
	refetch: refetchHistory,
} = useQuery(MyGangJoinRequestsHistoryDocument, { limit: 20 }, () => ({
	enabled: isHistoryModalOpen.value,
}));

const requestStatusBadges = {
	[GangJoinRequestStatus.Pending]: { variant: "warning", label: "Pendente" },
	[GangJoinRequestStatus.Accepted]: { variant: "success", label: "Aceita" },
	[GangJoinRequestStatus.Rejected]: { variant: "danger", label: "Recusada" },
	[GangJoinRequestStatus.Cancelled]: { variant: "neutral", label: "Cancelada" },
} as const;

const requestHistory = computed(() => historyData.value?.myGangJoinRequestsHistory ?? []);

// Modals State
const isCreateModalOpen = ref(false);

const isApprovalModalOpen = ref(false);
const targetGangForApproval = ref<GangRecruitmentBoardEntry | null>(null);
const approvalMessage = ref("");

const isOpenJoinModalOpen = ref(false);
const targetGangForOpen = ref<GangRecruitmentBoardEntry | null>(null);

const isCancelModalOpen = ref(false);
const targetRequestIdToCancel = ref<string | undefined>(undefined);

// Mutations
const { mutate: createGangMutation, loading: creating } = useMutation(CreateGangDocument);
const { mutate: joinOpenMutation, loading: joiningOpen } = useMutation(JoinOpenGangDocument);
const { mutate: applyMutation, loading: applying } = useMutation(ApplyToGangDocument);
const { mutate: cancelMutation, loading: cancelling } = useMutation(CancelGangJoinRequestDocument);

// Gang Creation Draft
const draft = ref({
	name: "",
	acronym: "",
	description: "",
	color: "",
	imageUrl: "",
});

const gangColors = [
	{ value: "grey", label: "Cinza", colorHex: "#89999A" },
	{ value: "purple", label: "Roxo", colorHex: "#7345C4" },
	{ value: "blue", label: "Azul", colorHex: "#448aff" },
	{ value: "green", label: "Verde", colorHex: "#4caf50" },
	{ value: "yellow", label: "Amarelo", colorHex: "#fdd835" },
	{ value: "orange", label: "Laranja", colorHex: "#ff9100" },
	{ value: "red", label: "Vermelho", colorHex: "#e53935" },
	{ value: "pink", label: "Rosa", colorHex: "#EB459E" },
];

function resetDraft() {
	draft.value = {
		name: "",
		acronym: "",
		description: "",
		color: "",
		imageUrl: "",
	};
}

async function createGang() {
	const res = await createGangMutation({
		name: draft.value.name,
		acronym: draft.value.acronym,
		description: draft.value.description,
		color: draft.value.color,
		imageUrl: draft.value.imageUrl || null,
	});

	if (res?.errors?.[0]) {
		showToast({ text: res.errors[0].message ?? "Falha ao criar gangue.", variant: "error" });
		return;
	}
	if (res?.data?.createGang?.success) {
		showToast({ text: "Gangue criada com sucesso!", variant: "success" });
		isCreateModalOpen.value = false;
		resetDraft();
		await auth.fetchUser();
		void refetchBoard();
	} else {
		const message = res?.data?.createGang?.message ?? "Falha ao criar gangue.";
		showToast({ text: message, variant: "error" });
	}
}

// Handlers for Board Actions
function openApprovalModal(gang: GangRecruitmentBoardEntry) {
	targetGangForApproval.value = gang;
	approvalMessage.value = "";
	isApprovalModalOpen.value = true;
}

async function submitApprovalRequest() {
	if (!targetGangForApproval.value) return;
	const res = await applyMutation({
		gangId: targetGangForApproval.value.id,
		message: approvalMessage.value,
	});

	if (res?.data?.applyToGang?.success) {
		showToast({ text: res.data.applyToGang.message, variant: "success" });
		isApprovalModalOpen.value = false;
		void refetchActiveRequest();
		void refetchBoard();
	} else {
		showToast({ text: res?.data?.applyToGang?.message ?? "Falha ao enviar solicitação.", variant: "error" });
	}
}

function openJoinConfirmModal(gang: GangRecruitmentBoardEntry) {
	targetGangForOpen.value = gang;
	isOpenJoinModalOpen.value = true;
}

async function confirmJoinOpen() {
	if (!targetGangForOpen.value) return;
	const res = await joinOpenMutation({
		gangId: targetGangForOpen.value.id,
	});

	if (res?.data?.joinOpenGang?.success) {
		showToast({ text: res.data.joinOpenGang.message, variant: "success" });
		isOpenJoinModalOpen.value = false;
		await auth.fetchUser();
		void refetchActiveRequest();
		void refetchBoard();
	} else {
		showToast({ text: res?.data?.joinOpenGang?.message ?? "Falha ao entrar na gangue.", variant: "error" });
	}
}

function openCancelModal(requestId?: string) {
	targetRequestIdToCancel.value = requestId;
	isCancelModalOpen.value = true;
}

async function confirmCancelRequest() {
	const res = await cancelMutation({
		requestId: targetRequestIdToCancel.value,
	});

	if (res?.data?.cancelGangJoinRequest?.success) {
		showToast({ text: "Solicitação retirada com sucesso.", variant: "success" });
		isCancelModalOpen.value = false;
		void refetchActiveRequest();
		if (isHistoryModalOpen.value) void refetchHistory();
	} else {
		showToast({ text: res?.data?.cancelGangJoinRequest?.message ?? "Falha ao retirar solicitação.", variant: "error" });
	}
}

function openHistoryModal() {
	isHistoryModalOpen.value = true;
	void refetchHistory();
}

const bases = [
	{
		name: "Aeroporto Abandonado",
		description:
			"Um antigo aeroporto abandonado, um lugar perfeito para atividades ilícitas e para expandir sua influência.",
		image: imagePaths.gangBases.airport,
		modifier: "+0.5% chance de fugir da prisão por nível da gangue",
		imageModifier: imagePaths.uiElements.escape,
	},
	{
		name: "Bunker Subterrâneo",
		description:
			"Um bunker subterrâneo fortificado, ideal para planejar seus próximos movimentos e salvaguardar suas operações.",
		image: imagePaths.gangBases.bunker,
		modifier: "+1 DEF por nível da gangue",
		imageModifier: imagePaths.attributes.defense,
	},
	{
		name: "Motoclube Anarquista",
		description: "Um motoclube barulhento, um refúgio para foras da lei e um ponto estratégico para controlar as ruas.",
		image: imagePaths.gangBases.bikeclub,
		modifier: "+0.5 ATK por nível da gangue",
		imageModifier: imagePaths.attributes.attack,
	},
];
</script>

<template>
	<main class="gangs-page">
		<PageTitle
			title="Gangues"
			subtitle="Encontre uma gangue disponível e faça parte dela"
		>
			<template #actions>
				<div class="gangs-page__header-actions">
					<BaseButton
						variant="secondary"
						@click="openHistoryModal()"
					>
						<History :size="16" />
						Minhas solicitações
					</BaseButton>

					<template v-if="userGang">
						<BaseButton
							variant="primary"
							:to="`/gangs/${userGang}`"
						>
							Ir para minha gangue
						</BaseButton>
					</template>
					<BaseButton
						v-else
						variant="primary"
						@click="isCreateModalOpen = true"
					>
						Criar gangue
					</BaseButton>
				</div>
			</template>
		</PageTitle>

		<!-- Active Request Banner if user has a pending request -->
		<div
			v-if="activeRequest && !userGang"
			class="gangs-page__active-banner"
		>
			<div class="gangs-page__active-banner-info">
				<span class="gangs-page__active-banner-tag">Solicitação pendente</span>
				<span>
					Você possui uma solicitação enviada para a gangue <strong>{{ activeRequest.gangName }}</strong> ({{
						activeRequest.gangAcronym
					}}).
				</span>
			</div>
			<BaseButton
				variant="danger"
				size="sm"
				@click="openCancelModal(activeRequest.id)"
			>
				Retirar solicitação
			</BaseButton>
		</div>

		<BaseCard
			class="gangs-board-card"
			title="Recrutamento"
			no-padding-y
			no-padding-x
		>
			<template #actions>
				<div class="gangs-board__filters">
					<div class="gangs-board__filter-selector">
						<BaseSelector
							id="recruitment-type-filter"
							:options="recruitmentFilterOptions"
							:model-value="selectedRecruitmentFilter"
							@update:model-value="selectedRecruitmentFilter = $event"
						/>
					</div>
					<div class="gangs-board__search">
						<BaseInput
							id="search-gang-board"
							type="search"
							aria-label="Buscar gangues por nome ou acrônimo"
							placeholder="Buscar por nome ou acrônimo..."
							:model-value="searchQuery"
							@update:model-value="searchQuery = String($event)"
						>
							<template #leading>
								<Search :size="16" />
							</template>
						</BaseInput>
					</div>
				</div>
			</template>
			<div class="gangs-board">
				<BaseTableSkeleton
					v-if="loadingBoard"
					:rows="6"
					:columns="5"
					label="Carregando gangues disponíveis"
				/>
				<BaseTable
					v-else
					class="gangs-board__table"
					:columns="boardColumns"
					:sort-column="sortColumn"
					:sort-direction="sortDirection"
					@sort="handleSort"
				>
					<tbody>
						<tr v-if="recruitingGangs.length === 0">
							<td
								colspan="5"
								class="gangs-board__empty"
							>
								Nenhuma gangue com recrutamento ativo encontrada.
							</td>
						</tr>
						<tr
							v-for="g in recruitingGangs"
							:key="g.id"
							class="gangs-board__row"
						>
							<td class="col-gang">
								<div class="gang-info-cell">
									<div class="gang-info-cell__avatar">
										<NuxtImg
											v-if="g.image"
											:src="g.image"
											alt=""
											width="48"
											height="48"
											class="gang-info-cell__img"
										/>
										<div
											v-else
											class="gang-info-cell__fallback"
											:style="{ color: g.color }"
										>
											{{ g.acronym }}
										</div>
									</div>
									<div class="gang-info-cell__details">
										<div class="gang-info-cell__header">
											<span class="gang-info-cell__name">
												<NuxtLink :to="`/gangs/${g.id}`">
													{{ g.name }}
												</NuxtLink>
											</span>
											<span class="gang-info-cell__level">Nv. {{ g.level }}</span>
										</div>
										<p class="gang-info-cell__desc">{{ g.description || "Sem descrição." }}</p>
									</div>
								</div>
							</td>
							<td>
								<div class="gang-base-cell">
									<NuxtImg
										v-if="g.baseId"
										:src="getGangBaseImageUrl(g.baseId)"
										alt=""
										width="48"
										height="48"
										class="gang-base-cell__img"
									/>
									<span>{{ g.baseName || "Nenhuma" }}</span>
								</div>
							</td>
							<td>
								<span class="gang-members-badge"> {{ g.membersCount }}/{{ g.maxMembers }} </span>
							</td>
							<td>
								<BaseBadge :variant="g.recruitmentType === 'OPEN' ? 'success' : 'helper'">
									{{ g.recruitmentType === "OPEN" ? "Aberto" : "Aprovação" }}
								</BaseBadge>
							</td>
							<td class="col-action">
								<template v-if="userGang">
									<span class="gang-action-muted">Já em gangue</span>
								</template>
								<template v-else-if="activeRequest && activeRequest.gangId === g.id">
									<BaseButton
										variant="danger"
										size="sm"
										@click="openCancelModal(activeRequest.id)"
									>
										Retirar
									</BaseButton>
								</template>
								<template v-else-if="activeRequest">
									<span
										class="gang-action-muted"
										title="Você já tem uma solicitação pendente"
									>
										Bloqueado
									</span>
								</template>
								<template v-else-if="g.recruitmentType === 'OPEN'">
									<BaseButton
										variant="primary"
										size="sm"
										class="btn-enter-green"
										@click="openJoinConfirmModal(g)"
									>
										Entrar
									</BaseButton>
								</template>
								<template v-else>
									<BaseButton
										variant="secondary"
										size="sm"
										@click="openApprovalModal(g)"
									>
										Solicitar
									</BaseButton>
								</template>
							</td>
						</tr>
					</tbody>
				</BaseTable>
			</div>

			<template
				v-if="totalGangs > 0"
				#footer
			>
				<BaseTableFooter
					label-item="gangues"
					label-navigation="Paginação das gangues em recrutamento"
					:index="recruitingGangs.length"
					:offset="offset"
					:total="totalGangs"
					:page="page"
					:pages="totalPages"
					@click-previous="previousPage()"
					@click-next="nextPage()"
				/>
			</template>
		</BaseCard>

		<PageTitle
			title="Informações"
			subtitle="Crie sua gangue e trabalhe em equipe! Participe de assaltos em grupo e lutas generalizadas!"
		/>

		<div class="gangs-page__list">
			<BaseCard title="Bases de gangue">
				<p class="gangs-page__list-description">
					Bases custam Cr$ 1.000.000 do caixa da gangue. A cada nível, todos os membros ganham bônus especiais.
				</p>
				<div class="gangs-page__bases-container">
					<section
						class="gangs-page__base"
						v-for="b in bases"
						:key="b.name"
					>
						<LazyNuxtImg
							:src="b.image"
							alt=""
							width="200"
							class="gangs-page__base-image"
						/>
						<h3 class="gangs-page__base-name">{{ b.name }}</h3>
						<p class="gangs-page__base-description">{{ b.description }}</p>
						<p class="gangs-page__base-modifier">
							<LazyNuxtImg
								:src="b.imageModifier"
								width="24"
								class="gangs-page__base-image-modifier"
							/>
							{{ b.modifier }}
						</p>
					</section>
				</div>
			</BaseCard>

			<BaseCard
				title="Importações"
				:icon="imagePaths.uiElements.imports"
			>
				<p class="gangs-page__list-description">
					Importe carregamentos de itens com sua gangue. A carga chega em 24 horas, se tudo der certo.
				</p>
				<p class="gangs-page__list-description">
					A chance de sucesso começa em 60% no nível 1 e dimiuni a cada nível (mínimo de 20%). Cada membro receberá
					itens conforme o nível da gangue, além de um bônus de sua melhor arma atual.
				</p>
			</BaseCard>

			<BaseCard
				title="Roubos à investimentos"
				:icon="imagePaths.situations.defendingInvestment"
			>
				<p class="gangs-page__list-description">
					Investimentos acumulam o valor a receber a cada hora, desde que seu proprietário esteja ocupado.
				</p>
				<p class="gangs-page__list-description">
					Gangues podem roubar estes investimentos, roubando parte do valor que o proprietário receberia, mas caso
					falhem, todos serão presos.
				</p>
			</BaseCard>

			<BaseCard
				title="Golpes"
				:icon="imagePaths.uiElements.vaultBank"
			>
				<p class="gangs-page__list-description">
					As ações dos jogadores aumentam os caixas do <strong>Banco Central</strong> e do <strong>Cassino</strong>.
				</p>
				<p class="gangs-page__list-description">
					As gangues podem tentar roubar estes caixas nas Segundas, Quartas e Sextas, com pouquíssimas chances de
					sucesso, mas com uma recompensa esmagadora.
				</p>
				<p class="gangs-page__list-description">
					Aumente sua chances de sucesso completando as <strong>Missões secundárias</strong> em qualquer dia da semana.
				</p>
			</BaseCard>
		</div>

		<BaseModal
			:open="isApprovalModalOpen"
			:title="`Solicitar adesão - ${targetGangForApproval?.name}`"
			description="Envie uma mensagem para os líderes avaliarem sua solicitação de entrada."
			@update:open="isApprovalModalOpen = $event"
		>
			<div class="approval-modal-body">
				<label
					for="approval-message-input"
					class="approval-modal-label"
				>
					Por que você quer entrar para esta gangue? (opcional)
				</label>
				<textarea
					id="approval-message-input"
					v-model="approvalMessage"
					class="approval-modal-textarea"
					maxlength="280"
					placeholder="Apresente-se e explique como pode ajudar a equipe..."
					rows="4"
				/>
				<span class="approval-modal-count">{{ approvalMessage.length }}/280 caracteres</span>
				<p class="gangs-page__modal-description">
					Taxa de adesão: <strong>{{ formatMoney(targetGangForApproval?.joinCost ?? 0) }}</strong>. Você precisa ter
					essa grana quando sua solicitação for aceita, ou ela não poderá ser aprovada.
				</p>
			</div>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="applying"
					@click="isApprovalModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="applying"
					@click="submitApprovalRequest()"
				>
					<Send :size="16" />
					{{ applying ? "Enviando..." : "Enviar solicitação" }}
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Confirmar Entrada (Open) -->
		<BaseModal
			:open="isOpenJoinModalOpen"
			title="Confirmar entrada"
			:description="`Deseja realmente entrar para a gangue ${targetGangForOpen?.name}?`"
			@update:open="isOpenJoinModalOpen = $event"
		>
			<p class="gangs-page__modal-description">
				Esta gangue está com recrutamento aberto. Ao confirmar, você se tornará membro imediatamente e
				<strong>{{ formatMoney(targetGangForOpen?.joinCost ?? 0) }}</strong>
				serão debitados da sua grana. Você precisa ter esse valor para entrar.
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="joiningOpen"
					@click="isOpenJoinModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					class="btn-enter-green"
					:disabled="joiningOpen"
					@click="confirmJoinOpen()"
				>
					<Check :size="16" />
					{{ joiningOpen ? "Entrando..." : "Confirmar e entrar" }}
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Retirar Solicitação -->
		<BaseModal
			:open="isCancelModalOpen"
			title="Retirar solicitação"
			description="Deseja realmente retirar sua solicitação de entrada?"
			@update:open="isCancelModalOpen = $event"
		>
			<p class="gangs-page__modal-description">
				Sua solicitação pendente será cancelada e os líderes da gangue não poderão mais aceitá-la.
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="cancelling"
					@click="isCancelModalOpen = false"
				>
					Voltar
				</BaseButton>
				<BaseButton
					variant="danger"
					:disabled="cancelling"
					@click="confirmCancelRequest()"
				>
					{{ cancelling ? "Retirando..." : "Sim, Retirar" }}
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Histórico de Solicitações -->
		<BaseModal
			:open="isHistoryModalOpen"
			title="Minhas solicitações de adesão"
			description="Acompanhe o status dos seus pedidos de recrutamento."
			@update:open="isHistoryModalOpen = $event"
		>
			<div class="history-modal-content">
				<div
					v-if="loadingHistory"
					class="gangs-page__history-state gangs-page__history-state--loading"
				>
					Carregando histórico...
				</div>
				<div
					v-else-if="requestHistory.length === 0"
					class="gangs-page__history-state gangs-page__history-state--empty"
				>
					Você ainda não realizou solicitações de adesão para nenhuma gangue.
				</div>
				<div
					v-else
					class="history-list"
				>
					<div
						v-for="item in requestHistory"
						:key="item.id"
						class="history-card"
					>
						<div class="history-card__header">
							<div class="history-card__identity">
								<div class="gang-info-cell__avatar history-card__avatar">
									<NuxtImg
										v-if="item.gangImage"
										:src="item.gangImage"
										alt=""
										width="64"
										height="64"
										class="gang-info-cell__img"
									/>
									<span
										v-else
										class="gang-info-cell__fallback"
										:style="{ color: item.gangColor ?? undefined }"
									>
										{{ item.gangAcronym }}
									</span>
								</div>
								<div>
									<span class="history-card__gang">{{ item.gangName }}</span>
									<span class="history-card__acronym">[{{ item.gangAcronym }}]</span>
								</div>
							</div>
							<BaseBadge
								class="history-card__status"
								:variant="requestStatusBadges[item.status].variant"
							>
								{{ requestStatusBadges[item.status].label }}
							</BaseBadge>
						</div>
						<p
							v-if="item.message"
							class="history-card__msg"
						>
							"{{ item.message }}"
						</p>
						<div class="history-card__footer">
							<span class="history-card__date">
								Enviada em {{ new Date(item.createdAt).toLocaleDateString("pt-BR") }}
							</span>
							<BaseButton
								v-if="item.status === 'PENDING'"
								variant="secondary"
								@click="openCancelModal(item.id)"
							>
								Retirar
							</BaseButton>
						</div>
					</div>
				</div>
			</div>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="isHistoryModalOpen = false"
				>
					Fechar
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Criar Gangue -->
		<BaseModal
			:open="isCreateModalOpen"
			title="Criar Gangue"
			description="Preencha as informações para criar sua nova gangue."
			@update:open="(open) => { isCreateModalOpen = open; if (!open) resetDraft(); }"
		>
			<form
				id="create-gang-form"
				class="gangs-page__create-form"
				@submit.prevent="createGang()"
			>
				<BaseInput
					id="gang-name"
					label="Nome"
					placeholder="Nome da gangue"
					:minlength="4"
					:maxlength="50"
					required
					:model-value="draft.name"
					@update:model-value="draft.name = String($event)"
				/>
				<BaseInput
					id="gang-acronym"
					label="Acrônimo"
					placeholder="Ex: GUN"
					:minlength="2"
					:maxlength="3"
					required
					:model-value="draft.acronym"
					@update:model-value="draft.acronym = String($event)"
				/>
				<div class="gangs-page__form-field">
					<label
						for="gang-description"
						class="gangs-page__input-label"
					>
						Descrição
					</label>
					<textarea
						id="gang-description"
						v-model="draft.description"
						class="gangs-page__textarea"
						placeholder="Descreva sua gangue"
						maxlength="500"
						required
					/>
				</div>
				<BaseSelector
					id="gang-color"
					label="Cor"
					placeholder="Selecione uma cor"
					:options="gangColors"
					:model-value="draft.color"
					required
					@update:model-value="draft.color = String($event)"
				/>
				<BaseInput
					id="gang-image"
					label="URL da imagem (opcional)"
					placeholder="https://..."
					:model-value="draft.imageUrl"
					@update:model-value="draft.imageUrl = String($event)"
				/>
			</form>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="creating"
					@click="isCreateModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					type="submit"
					form="create-gang-form"
					:disabled="creating"
				>
					{{ creating ? "Criando..." : "Criar gangue" }}
				</BaseButton>
			</template>
		</BaseModal>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.gangs-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
	container-type: inline-size;
	container-name: page;

	&__list {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;

		&-description {
			font-size: $font-size-14;
			color: $text-secondary;
			margin-bottom: $spacing-sm;
		}
	}

	&__bases-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: $spacing-md;
	}

	&__base {
		@include card-surface;
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		padding: $spacing-md;

		&-image {
			width: 100%;
			aspect-ratio: 8 / 4;
			object-fit: cover;
			border-radius: $radius-sm;
		}

		&-name {
			font-size: $font-size-16;
		}

		&-description {
			font-size: 0.85rem;
			color: $text-secondary;
		}

		&-modifier {
			display: inline-flex;
			align-items: center;
			margin-top: auto;
			font-size: $font-size-12;
			color: $text-primary;
			gap: $spacing-sm;
			font-weight: $font-weight-medium;
		}

		&-image-modifier {
			width: 24px;
			height: auto;
			border-radius: $radius-sm;
		}
	}

	&__header-actions {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		flex-wrap: wrap;
	}

	&__modal-description {
		font-size: 0.9rem;
		color: $text-secondary;
		line-height: 1.5;
	}

	&__history-state {
		padding: 1rem 0;
		text-align: center;

		&--loading {
			color: $text-secondary;
		}

		&--empty {
			color: $text-muted;
		}
	}

	&__active-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.875rem 1.25rem;
		background: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: $radius-md;
		gap: $spacing-md;

		&-info {
			display: flex;
			align-items: center;
			gap: $spacing-sm;
			font-size: $font-size-14;
			color: $text-primary;
			flex-wrap: wrap;
		}

		&-tag {
			background: #dc2626;
			color: #fff;
			font-size: $font-size-12;
			font-weight: $font-weight-semibold;
			padding: 0.15rem 0.5rem;
			border-radius: $radius-sm;
			text-transform: uppercase;
		}
	}

	&__create-form {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	&__form-field {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		width: 100%;
	}

	&__input-label {
		font-size: $font-size-12;
		font-weight: $font-weight-medium;
		color: $text-secondary;
	}

	&__textarea {
		width: 100%;
		padding: 0.625rem 0.875rem;
		background-color: $bg-input;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		color: $text-primary;
		outline: none;
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
		font-size: $font-size-14;
		transition: border-color $transition-fast ease-in-out;

		&::placeholder {
			color: $text-muted;
		}

		&:focus {
			border-color: $color-brand;
		}
	}
}

.gangs-board-card :deep(.base-card__actions) {
	@container page (max-width: #{$bp-mobile}) {
		flex-basis: 100%;
	}
}

.gangs-board {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;

	&__toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: $spacing-md;
		padding-bottom: $spacing-sm;

		&-title h2 {
			font-size: 1.15rem;
			font-weight: $font-weight-semibold;
			color: $text-primary;
			margin: 0;
		}
	}

	&__filters {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		flex-wrap: wrap;

		@container page (max-width: #{$bp-mobile}) {
			width: 100%;

			> * {
				flex: 1 1 100%;
				min-width: 0;
			}
		}
	}

	&__filter-selector {
		min-width: 180px;
	}

	&__search {
		min-width: 320px;

		@container page (max-width: #{$bp-mobile}) {
			min-width: 0;
		}
	}

	&__table {
		td {
			vertical-align: middle;
		}

		.col-gang {
			width: 40%;
			min-width: 240px;
			white-space: normal;
		}

		.col-action {
			text-align: right;
		}

		@container page (max-width: #{$bp-mobile}) {
			:deep(thead) {
				display: none;
			}

			.gangs-board__row {
				display: grid;
				grid-template-columns: auto auto 1fr auto;
				grid-template-areas:
					"gang gang gang gang"
					"base members type action";
				align-items: center;
				gap: $spacing-sm $spacing-md;
				padding: $spacing-md;
				border-bottom: 1px solid $border-subtle;

				td {
					padding: 0;
					border: none;
				}

				td:nth-child(1) {
					grid-area: gang;
				}

				td:nth-child(2) {
					grid-area: base;
				}

				td:nth-child(3) {
					grid-area: members;
				}

				td:nth-child(4) {
					grid-area: type;
				}

				td:nth-child(5) {
					grid-area: action;
				}
			}

			.col-gang {
				width: auto;
				min-width: 0;
			}

			.gang-info-cell__avatar {
				width: 48px;
				height: 48px;
			}

			.gang-base-cell__img {
				width: 24px;
				height: 24px;
			}
		}
	}

	&__empty {
		text-align: center;
		padding: 2.5rem 1rem !important;
		color: $text-muted;
		font-size: $font-size-14;
	}
}

.gang-info-cell {
	display: flex;
	align-items: center;
	gap: 0.875rem;

	&__avatar {
		width: 64px;
		height: 64px;
		border-radius: $radius-xs;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $bg-input;
		overflow: hidden;
		flex-shrink: 0;
	}

	&__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	&__fallback {
		font-weight: $font-weight-bold;
		font-size: $font-size-14;
	}

	&__details {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	&__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	&__name {
		font-size: 0.95rem;
		font-weight: $font-weight-bold;
		color: $text-primary;
	}

	&__level {
		font-size: 0.75rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 4px;
		padding: 0.1rem 0.35rem;
		color: $text-secondary;
		font-weight: $font-weight-medium;
	}

	&__desc {
		font-size: 0.8rem;
		color: $text-secondary;
		margin: 0;
		line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
}

.gang-base-cell {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: $text-primary;

	&__img {
		border-radius: 4px;
		object-fit: cover;
	}
}

.gang-members-badge {
	font-size: 0.875rem;
	font-weight: $font-weight-semibold;
	color: $text-primary;
}

.btn-enter-green {
	background-color: #10b981 !important;
	border-color: #10b981 !important;
	color: #ffffff !important;

	&:hover:not(:disabled) {
		background-color: #059669 !important;
	}
}

.gang-action-muted {
	font-size: 0.75rem;
	color: $text-muted;
	font-style: italic;
}

.approval-modal-body {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.approval-modal-label {
	font-size: 0.85rem;
	color: $text-secondary;
}

.approval-modal-textarea {
	width: 100%;
	padding: 0.75rem;
	background: $bg-input;
	border: 1px solid $border-subtle;
	border-radius: $radius-sm;
	color: $text-primary;
	font-family: inherit;
	font-size: 0.875rem;
	resize: vertical;
	outline: none;

	&:focus {
		border-color: $color-brand;
	}
}

.approval-modal-count {
	font-size: 0.75rem;
	color: $text-muted;
	text-align: right;
}

.history-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.history-card {
	padding: 0.875rem 1rem;
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid $border-subtle;
	border-radius: $radius-sm;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $spacing-sm;
	}

	&__identity {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	&__avatar {
		width: 64px;
		height: 64px;
	}

	&__gang {
		font-weight: $font-weight-bold;
		font-size: 0.95rem;
		color: $text-primary;
	}

	&__acronym {
		font-size: 0.8rem;
		color: $text-secondary;
		margin-left: 0.25rem;
	}

	&__msg {
		font-size: 0.8rem;
		color: #d4d4d8;
		font-style: italic;
		margin: 0;
	}

	&__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
	}

	&__date {
		font-size: 0.7rem;
		color: $text-muted;
	}

	&__status {
		font-size: 0.75rem;
		font-weight: $font-weight-semibold;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;

		&--pending {
			background: rgba(234, 179, 8, 0.15);
			color: #eab308;
		}

		&--accepted {
			background: rgba(16, 185, 129, 0.15);
			color: #10b981;
		}

		&--rejected {
			background: rgba(239, 68, 68, 0.15);
			color: #ef4444;
		}

		&--cancelled {
			background: rgba(156, 163, 175, 0.15);
			color: #9ca3af;
		}
	}
}

</style>
