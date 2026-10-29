<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed, ref } from "vue";
import { History, Info, Plus, Search, Check, Send, X, Users as UsersIcon } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSelector, { type SelectorOption } from "~/components/ui/BaseSelector.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { imagePaths } from "~/constants/imagePaths";
import {
	ApplyToGangDocument,
	CancelGangJoinRequestDocument,
	CreateGangDocument,
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

const userGang = computed(() => auth.user?.value?.gangId ?? 0);

// Filter & Search states
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
} = useQuery(GangRecruitmentBoardDocument, () => ({
	search: searchQuery.value.trim() || undefined,
	type: filterTypeArg.value,
}));

const recruitingGangs = computed<GangRecruitmentBoardEntry[]>(() => boardData.value?.gangRecruitmentBoard ?? []);

// Active request query
const {
	result: activeRequestData,
	refetch: refetchActiveRequest,
} = useQuery(MyActiveGangJoinRequestDocument);

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

const requestHistory = computed(() => historyData.value?.myGangJoinRequestsHistory ?? []);

// Modals State
const isInfoModalOpen = ref(false);
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
			subtitle="Encontre uma gangue disponível e faça parte dela."
		>
			<template #actions>
				<div class="gangs-page__header-actions">
					<BaseButton
						variant="secondary"
						size="sm"
						@click="openHistoryModal()"
					>
						<History :size="16" />
						Minhas Solicitações
					</BaseButton>

					<BaseButton
						variant="secondary"
						size="sm"
						@click="isInfoModalOpen = true"
					>
						<Info :size="16" />
						Informação
					</BaseButton>

					<template v-if="userGang">
						<BaseButton
							variant="primary"
							size="sm"
							:to="`/gangs/${userGang}`"
						>
							Ir para minha gangue
						</BaseButton>
					</template>
					<BaseButton
						v-else
						variant="primary"
						size="sm"
						@click="isCreateModalOpen = true"
					>
						<Plus :size="16" />
						Criar Gangue
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
				<span class="gangs-page__active-banner-tag">Solicitação Pendente</span>
				<span>
					Você possui uma solicitação enviada para a gangue <strong>{{ activeRequest.gangName }}</strong> ({{ activeRequest.gangAcronym }}).
				</span>
			</div>
			<BaseButton
				variant="danger"
				size="sm"
				@click="openCancelModal(activeRequest.id)"
			>
				Retirar Solicitação
			</BaseButton>
		</div>

		<!-- Recruitment Board Section -->
		<BaseCard>
			<div class="gangs-board">
				<div class="gangs-board__toolbar">
					<div class="gangs-board__toolbar-title">
						<h2>Gangues</h2>
					</div>
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
								placeholder="Buscar por nome da gangue..."
								:model-value="searchQuery"
								@update:model-value="searchQuery = String($event)"
							>
								<template #leading>
									<Search :size="16" class="gangs-board__search-icon" />
								</template>
							</BaseInput>
						</div>
					</div>
				</div>

				<div class="gangs-board__table-container">
					<table class="gangs-board__table">
						<thead>
							<tr>
								<th class="col-gang">GANGUE</th>
								<th class="col-base">BASE</th>
								<th class="col-members">MEMBROS</th>
								<th class="col-type">ADESÃO</th>
								<th class="col-action">AÇÃO</th>
							</tr>
						</thead>
						<tbody>
							<tr v-if="loadingBoard">
								<td colspan="5" class="gangs-board__empty">Carregando gangues disponíveis...</td>
							</tr>
							<tr v-else-if="recruitingGangs.length === 0">
								<td colspan="5" class="gangs-board__empty">Nenhuma gangue com recrutamento ativo encontrada.</td>
							</tr>
							<tr
								v-for="g in recruitingGangs"
								:key="g.id"
								class="gangs-board__row"
							>
								<!-- Gang Col -->
								<td class="col-gang">
									<div class="gang-info-cell">
										<div class="gang-info-cell__avatar" :style="{ borderColor: g.color }">
											<NuxtImg
												v-if="g.image"
												:src="g.image"
												alt=""
												width="44"
												height="44"
												class="gang-info-cell__img"
											/>
											<div v-else class="gang-info-cell__fallback" :style="{ color: g.color }">
												{{ g.acronym }}
											</div>
										</div>
										<div class="gang-info-cell__details">
											<div class="gang-info-cell__header">
												<span class="gang-info-cell__name">{{ g.name }}</span>
												<span class="gang-info-cell__level">Nv. {{ g.level }}</span>
											</div>
											<p class="gang-info-cell__desc">{{ g.description || 'Sem descrição.' }}</p>
										</div>
									</div>
								</td>

								<!-- Base Col -->
								<td class="col-base">
									<div class="gang-base-cell">
										<NuxtImg
											v-if="g.baseImage"
											:src="g.baseImage"
											alt=""
											width="32"
											height="32"
											class="gang-base-cell__img"
										/>
										<span>{{ g.baseName || 'Nenhuma' }}</span>
									</div>
								</td>

								<!-- Members Col -->
								<td class="col-members">
									<span class="gang-members-badge">
										{{ g.membersCount }}/{{ g.maxMembers }}
									</span>
								</td>

								<!-- Recruitment Type Col -->
								<td class="col-type">
									<span
										class="gang-type-pill"
										:class="g.recruitmentType === 'OPEN' ? 'gang-type-pill--open' : 'gang-type-pill--approval'"
									>
										{{ g.recruitmentType === 'OPEN' ? 'Aberto' : 'Aprovação' }}
									</span>
								</td>

								<!-- Action Col -->
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
										<span class="gang-action-muted" title="Você já tem uma solicitação pendente">Bloqueado</span>
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
					</table>
				</div>
			</div>
		</BaseCard>

		<!-- Modal: Solicitar Adesão (Approval) -->
		<BaseModal
			:open="isApprovalModalOpen"
			:title="`Solicitar Adesão - ${targetGangForApproval?.name}`"
			description="Envie uma mensagem para os líderes avaliarem sua solicitação de entrada."
			@update:open="isApprovalModalOpen = $event"
		>
			<div class="approval-modal-body">
				<label for="approval-message-input" class="approval-modal-label">
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
					{{ applying ? "Enviando..." : "Enviar Solicitação" }}
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Confirmar Entrada (Open) -->
		<BaseModal
			:open="isOpenJoinModalOpen"
			title="Confirmar Entrada"
			:description="`Deseja realmente entrar para a gangue ${targetGangForOpen?.name}?`"
			@update:open="isOpenJoinModalOpen = $event"
		>
			<p style="font-size: 0.9rem; color: #a1a1aa; line-height: 1.5;">
				Esta gangue está com recrutamento aberto. Ao confirmar, você se tornará membro imediatamente.
				A taxa de adesão padrão será debitada do seu saldo.
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
					{{ joiningOpen ? "Entrando..." : "Confirmar e Entrar" }}
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Retirar Solicitação -->
		<BaseModal
			:open="isCancelModalOpen"
			title="Retirar Solicitação"
			description="Deseja realmente retirar sua solicitação de entrada?"
			@update:open="isCancelModalOpen = $event"
		>
			<p style="font-size: 0.9rem; color: #a1a1aa;">
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
			title="Minhas Solicitações de Adesão"
			description="Acompanhe o status dos seus pedidos de recrutamento."
			@update:open="isHistoryModalOpen = $event"
		>
			<div class="history-modal-content">
				<div v-if="loadingHistory" style="color: #a1a1aa; padding: 1rem 0; text-align: center;">
					Carregando histórico...
				</div>
				<div v-else-if="requestHistory.length === 0" style="color: #71717a; padding: 1rem 0; text-align: center;">
					Você ainda não realizou solicitações de adesão para nenhuma gangue.
				</div>
				<div v-else class="history-list">
					<div
						v-for="item in requestHistory"
						:key="item.id"
						class="history-card"
					>
						<div class="history-card__header">
							<div>
								<span class="history-card__gang">{{ item.gangName }}</span>
								<span class="history-card__acronym">({{ item.gangAcronym }})</span>
							</div>
							<span
								class="history-card__status"
								:class="`history-card__status--${item.status.toLowerCase()}`"
							>
								{{
									item.status === 'PENDING' ? 'Pendente' :
									item.status === 'ACCEPTED' ? 'Aceita' :
									item.status === 'REJECTED' ? 'Recusada' : 'Cancelada'
								}}
							</span>
						</div>
						<p v-if="item.message" class="history-card__msg">"{{ item.message }}"</p>
						<div class="history-card__footer">
							<span class="history-card__date">
								Enviada em {{ new Date(item.createdAt).toLocaleDateString('pt-BR') }}
							</span>
							<BaseButton
								v-if="item.status === 'PENDING'"
								variant="danger"
								size="sm"
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

		<!-- Modal: Informação sobre Bases & Gangues -->
		<BaseModal
			:open="isInfoModalOpen"
			title="Informações sobre Gangues e Bases"
			description="Saiba como funcionam as gangues, bases e vantagens em equipe."
			@update:open="isInfoModalOpen = $event"
		>
			<div class="gangs-info-modal">
				<div class="gangs-info-modal__section">
					<h3>Bases de Gangue</h3>
					<p>Bases custam Cr$ 1.000.000 do caixa da gangue. A cada nível, todos os membros ganham bônus especiais e desbloqueiam importações.</p>
					<div class="gangs-info-modal__bases">
						<div v-for="b in bases" :key="b.name" class="gangs-info-modal__base-item">
							<NuxtImg :src="b.image" alt="" width="80" height="80" class="base-img" />
							<div>
								<strong>{{ b.name }}</strong>
								<p>{{ b.description }}</p>
								<span class="base-mod">{{ b.modifier }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="isInfoModalOpen = false"
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
					<label for="gang-description" class="gangs-page__input-label">
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

	&__header-actions {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		flex-wrap: wrap;
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
	}

	&__filter-selector {
		min-width: 180px;
	}

	&__search {
		min-width: 240px;
		position: relative;

		&-icon {
			color: $text-muted;
		}
	}

	&__table-container {
		width: 100%;
		overflow-x: auto;
		@include scrollbar-custom;
	}

	&__table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;

		th {
			padding: 0.75rem 1rem;
			font-size: 0.75rem;
			font-weight: $font-weight-semibold;
			color: $text-muted;
			text-transform: uppercase;
			border-bottom: 1px solid $border-subtle;
		}

		td {
			padding: 1rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.05);
			vertical-align: middle;
		}

		.col-gang { width: 40%; min-width: 240px; }
		.col-base { width: 22%; min-width: 150px; }
		.col-members { width: 12%; min-width: 80px; }
		.col-type { width: 14%; min-width: 110px; }
		.col-action { width: 12%; min-width: 100px; text-align: right; }
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
		width: 44px;
		height: 44px;
		border-radius: $radius-sm;
		border: 2px solid $border-subtle;
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

.gang-type-pill {
	display: inline-block;
	padding: 0.2rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: $font-weight-semibold;

	&--open {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	&--approval {
		background: rgba(168, 85, 247, 0.15);
		color: #c084fc;
		border: 1px solid rgba(168, 85, 247, 0.3);
	}
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

.history-modal-content {
	max-height: 400px;
	overflow-y: auto;
	@include scrollbar-custom;
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

.gangs-info-modal {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;

	&__bases {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		margin-top: $spacing-sm;
	}

	&__base-item {
		display: flex;
		gap: $spacing-md;
		align-items: center;
		background: rgba(255, 255, 255, 0.02);
		padding: 0.75rem;
		border-radius: $radius-sm;

		.base-img {
			border-radius: 4px;
			flex-shrink: 0;
		}

		p {
			font-size: 0.8rem;
			color: $text-secondary;
			margin: 0.25rem 0;
		}

		.base-mod {
			font-size: 0.75rem;
			color: #10b981;
			font-weight: $font-weight-medium;
		}
	}
}
</style>
