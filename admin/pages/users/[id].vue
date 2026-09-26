<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { format, formatDistance, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, DollarSign, Package, Unlock } from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import {
	CureUserDocument,
	FreeUserDocument,
	GetUserDetailDocument,
	RemoveActionDocument,
	ResetCooldownDocument,
	SetMoneyDocument,
	SetMoneyMode,
} from "~/graphql/generated";
import { BadgeId, BundleId, ItemId } from "../../../src/core/types/Ids";
import { ItemType } from "../../../src/core/types/ItemType";

const route = useRoute();
const auth = useAuth();
const userId = computed(() => String(route.params.id));

const { result, loading, refetch } = useQuery(GetUserDetailDocument, () => ({ id: userId.value }));

const user = computed(() => result.value?.user);

const { getClassImageUrl } = useClasses();
const { getSituationImageUrl } = useSituation();

const language = computed(() => {
	switch (user.value?.language) {
		case "0":
			return "Inglês";
		case "1":
			return "Português";
		case "2":
			return "Espanhol";
		default:
			return user.value?.language;
	}
});

// Notification feedback state
const feedback = ref<{ type: "success" | "error"; message: string } | null>(null);

function showFeedback(type: "success" | "error", message: string) {
	feedback.value = { type, message };
	setTimeout(() => {
		feedback.value = null;
	}, 4000);
}

// Mutations
const { mutate: mutateCure, loading: cureLoading } = useMutation(CureUserDocument);
const { mutate: mutateFree, loading: freeLoading } = useMutation(FreeUserDocument);
const { mutate: mutateSetMoney, loading: moneyLoading } = useMutation(SetMoneyDocument);
const { mutate: mutateResetCooldown, loading: cdLoading } = useMutation(ResetCooldownDocument);
const { mutate: mutateRemoveAction, loading: actionLoading } = useMutation(RemoveActionDocument);

// Modal States
const isMoneyModalOpen = ref(false);
const moneyAmount = ref(10000);
const moneyMode = ref<SetMoneyMode.Add | SetMoneyMode.Set>(SetMoneyMode.Add);

const isCooldownModalOpen = ref(false);
const selectedCooldown = ref<"scavenge" | "robbery" | "beatup">("scavenge");

const isActionModalOpen = ref(false);
const selectedAction = ref<"job" | "scavenge" | "robbery" | "beatup" | "casino" | "gangaction">("job");

const gangColor = computed(() => user.value?.gang?.color);

// Handlers
async function handleCure() {
	try {
		const res = await mutateCure({ userId: userId.value });
		if (res?.data?.cureUser?.success) {
			showFeedback("success", res.data.cureUser.message);
			refetch();
		} else {
			showFeedback("error", res?.data?.cureUser?.message || "Erro ao curar jogador.");
		}
	} catch (err: unknown) {
		const hasMessage = err && typeof err === "object" && "message" in err;
		const message = hasMessage ? String(err.message) : "Erro inesperado.";
		showFeedback("error", message);
	}
}

async function handleFree() {
	try {
		const res = await mutateFree({ userId: userId.value });
		if (res?.data?.freeUser?.success) {
			showFeedback("success", res.data.freeUser.message);
			refetch();
		} else {
			showFeedback("error", res?.data?.freeUser?.message || "Erro ao soltar jogador.");
		}
	} catch (err: unknown) {
		const hasMessage = err && typeof err === "object" && "message" in err;
		const message = hasMessage ? String(err.message) : "Erro inesperado.";
		showFeedback("error", message);
	}
}

async function handleSetMoney() {
	try {
		const res = await mutateSetMoney({
			userId: userId.value,
			amount: Number(moneyAmount.value),
			mode: moneyMode.value,
		});
		if (res?.data?.setMoney?.success) {
			showFeedback("success", res.data.setMoney.message);
			isMoneyModalOpen.value = false;
			refetch();
		} else {
			showFeedback("error", res?.data?.setMoney?.message || "Erro ao atualizar dinheiro.");
		}
	} catch (err: unknown) {
		const hasMessage = err && typeof err === "object" && "message" in err;
		const message = hasMessage ? String(err.message) : "Erro inesperado.";
		showFeedback("error", message);
	}
}

async function handleResetCooldown() {
	try {
		const res = await mutateResetCooldown({
			userId: userId.value,
			cooldown: selectedCooldown.value,
		});
		if (res?.data?.resetCooldown?.success) {
			showFeedback("success", res.data.resetCooldown.message);
			isCooldownModalOpen.value = false;
			refetch();
		} else {
			showFeedback("error", res?.data?.resetCooldown?.message || "Erro ao resetar cooldown.");
		}
	} catch (err: unknown) {
		const hasMessage = err && typeof err === "object" && "message" in err;
		const message = hasMessage ? String(err.message) : "Erro inesperado.";
		showFeedback("error", message);
	}
}

async function handleRemoveAction() {
	try {
		const res = await mutateRemoveAction({
			userId: userId.value,
			action: selectedAction.value,
		});
		if (res?.data?.removeAction?.success) {
			showFeedback("success", res.data.removeAction.message);
			isActionModalOpen.value = false;
			refetch();
		} else {
			showFeedback("error", res?.data?.removeAction?.message || "Erro ao remover ação.");
		}
	} catch (err: unknown) {
		const hasMessage = err && typeof err === "object" && "message" in err;
		const message = hasMessage ? String(err.message) : "Erro inesperado.";
		showFeedback("error", message);
	}
}

function getBadgeImage(badgeId: BadgeId): string {
	// biome-ignore lint/suspicious/noDoubleEquals: GraphQl brings as number, not as BadgeId
	if (badgeId == BadgeId.VIP || badgeId == BadgeId.VIPEternal) {
		return "badges/vip.png";
	}
	return `badges/${BadgeId[badgeId]}.png`;
}

function getItemImage(itemId: ItemId, bundleId: BundleId = 0) {
	let filename = `${itemId}_${ItemId[itemId]}.png`;
	if (bundleId !== 0) filename = `${itemId}_${ItemId[itemId]}_${BundleId[bundleId]}.png`;
	return `items/${filename}`;
}
</script>

<template>
	<div class="user-detail-page">
		<div class="nav-back">
			<NuxtLink to="/users">
				<BaseButton
					variant="ghost"
					size="sm"
				>
					<ArrowLeft :size="16" />
					Voltar para Lista
				</BaseButton>
			</NuxtLink>
		</div>

		<!-- Alert Banner -->
		<div
			v-if="feedback"
			:class="['feedback-banner', feedback.type]"
		>
			<CheckCircle2
				v-if="feedback.type === 'success'"
				:size="18"
			/>
			<AlertCircle
				v-else
				:size="18"
			/>
			{{ feedback.message }}
		</div>

		<div
			v-if="loading"
			class="loading-state"
		>
			<p>Carregando perfil e inventário do jogador...</p>
		</div>

		<div
			v-else-if="!user"
			class="not-found"
		>
			<h2>Jogador não encontrado</h2>
			<p>O ID {{ userId }} não possui registro na base de dados do jogo.</p>
		</div>

		<div
			v-else
			class="user-content"
		>
			<!-- Header Card -->
			<BaseCard class="profile-header-card">
				<div class="profile-main-info">
					<NuxtImg
						class="profile-img"
						:src="user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
					/>
					<div>
						<div class="name-row">
							<h1 class="user-name">{{ user.nickname || "(Sem Nick)" }}</h1>
						</div>
						<p class="user-id"><code> ID: {{ user.id }}</code></p>
					</div>
					<div class="user-economy">
						<p class="user-money">Cr$ {{ user.money.toLocaleString() }}</p>
						<p class="user-coins">{{ user.specialCoin.toLocaleString() }} Moedas especiais</p>
					</div>
				</div>
				<section class="user-badges-grid">
					<NuxtImg
						v-for="b in user.badges"
						class="user-badge-img"
						:key="b.id"
						:src="getBadgeImage(b.id as BadgeId)"
						:title="b.name"
					/>
				</section>

				<p class="situation">
					<NuxtImg
						:src="getSituationImageUrl(user.situationId)"
						class="situation-img"
					/>
					{{ user.situationText }}
				</p>

				<div class="user-info-grid">
					<div class="user-info-left">
						<NuxtImg
							:src="getClassImageUrl(user.class)"
							class="img-class"
						/>
						{{ user.className }}
					</div>

					<div class="user-info-right">
						<span class="attribute">
							<NuxtImg
								src="attributes/attack.png"
								class="img-attribute"
							/>
							{{ user.attack || 0 }}
							ATK
						</span>
						<span class="attribute">
							<NuxtImg
								src="attributes/defense.png"
								class="img-attribute"
							/>
							{{ user.defense || 0 }}
							DEF
						</span>
					</div>
				</div>
			</BaseCard>

			<!-- Inventory Section -->
			<BaseCard
				title="Inventário"
				icon="ui_elements/inventory"
				class="inventory-card"
			>
				<div
					v-if="user.items.length === 0"
					class="empty-inv"
				>
					<Package :size="32" />
					<p>O jogador não possui itens no inventário.</p>
				</div>

				<div
					v-else
					class="items-grid"
				>
					<div
						v-for="item in user.items"
						:key="item.id"
						class="item-card"
					>
						<NuxtImg
							class="item-img"
							:src="getItemImage(item.id, item.skin)"
						/>
						<div class="item-header">
							<span class="item-name">{{ item.name }}</span>
							<span
								v-if="item.type === ItemType.Consumable"
								class="item-qty"
							>
								{{ item.quantity }}
								un
							</span>
							<span
								v-else-if="item.remainingTime"
								class="item-qty"
							>
								{{ formatDistanceToNow(new Date(item.remainingTime), { locale: ptBR }) }}
							</span>
						</div>
					</div>
				</div>
			</BaseCard>

			<BaseCard
				v-if="user.investment"
				title="Investimento"
				icon="situations/defending-investment"
			>
				<div class="user-investment">
					<div class="investment-left">
						<NuxtImg :src="user.investment.imageUrl" />
						<p class="text">{{ user.investment.name }}</p>
						<p class="text-muted">• {{ formatDistance(user.investment.expiresAt, new Date(), { locale: ptBR }) }}</p>
					</div>
					<p class="investment-right">
						<NuxtImg
							class="investment-def"
							src="attributes/defense.png"
						/>
						{{ user.investment.defense }} DEF
					</p>
				</div>
			</BaseCard>

			<BaseCard
				v-if="user.gang"
				title="Gangue"
				icon="situations/gang-action"
				class="gang-card"
			>
				<div class="user-gang">
					<NuxtImg
						class="gang-img"
						:src="user.gang.imageUrl || 'https://i.imgur.com/xOUjOlZ.png'"
					/>
					<p class="text">
						{{ user.gang.role }} de <span :style="{color: user.gang.color}">{{ user.gang.name }}</span>
					</p>
					<p class="gang-level">Nível {{ user.gang?.level }}</p>
				</div>
			</BaseCard>

			<!-- Status Grid -->
			<div class="info-columns">
				<!-- Status Card -->
				<BaseCard
					title="Situação & Estados"
					class="status-summary-card"
				>
					<div class="status-rows">
						<div class="status-row">
							<span class="row-label">Hospital</span>
							<BaseBadge
								v-if="user.isInHospital && user.hospitalTime"
								variant="danger"
							>
								<NuxtImg
									src="situations/hospital.png"
									width="18"
								/>
								Hospitalizado até {{ new Date(user.hospitalTime).toLocaleTimeString() }}
							</BaseBadge>
							<BaseBadge
								v-else
								variant="neutral"
							>
								Não
							</BaseBadge>
						</div>

						<div class="status-row">
							<span class="row-label">Prisão</span>
							<BaseBadge
								v-if="user.isInPrison && user.prisonTime"
								variant="danger"
							>
								<NuxtImg
									src="situations/prison.png"
									width="18"
								/>
								Preso até {{ new Date(user.prisonTime).toLocaleTimeString() }}
							</BaseBadge>
							<BaseBadge
								v-else
								variant="neutral"
							>
								Não
							</BaseBadge>
						</div>

						<div class="status-row">
							<span class="row-label">Trabalho</span>
							<BaseBadge
								v-if="user.isWorking"
								variant="success"
							>
								<NuxtImg
									src="situations/job.png"
									width="18"
								/>
								Trabalhando
							</BaseBadge>
							<BaseBadge
								v-else
								variant="neutral"
							>
								Não
							</BaseBadge>
						</div>

						<div class="status-row">
							<span class="row-label">Vasculho</span>
							<BaseBadge
								v-if="user.isScavenging"
								variant="success"
							>
								<NuxtImg
									src="situations/scavenge.png"
									width="18"
								/>
								Vasculhando
							</BaseBadge>
							<BaseBadge
								v-else
								variant="neutral"
							>
								Não
							</BaseBadge>
						</div>

						<div class="status-row">
							<span class="row-label">Procurado</span>
							<BaseBadge
								v-if="user.isWanted"
								variant="danger"
							>
								<NuxtImg
									src="situations/police.png"
									width="18"
								/>
								Procurado
							</BaseBadge>
							<BaseBadge
								v-else
								variant="neutral"
							>
								Não
							</BaseBadge>
						</div>
						<div class="status-row">
							<span class="row-label">Cassino</span>
							<BaseBadge
								v-if="user.isInCasino"
								variant="success"
							>
								<NuxtImg
									src="situations/casino.png"
									width="18"
								/>
								Apostando
							</BaseBadge>
							<BaseBadge
								v-else
								variant="neutral"
							>
								Não
							</BaseBadge>
						</div>
					</div>
				</BaseCard>
				<!-- Admin Actions Toolbar -->
				<BaseCard
					title="Ações Administrativas"
					class="actions-card"
				>
					<template #actions>
						<span
							v-if="!auth.isDeveloper.value"
							class="read-only-badge"
						>
							Modo Somente Leitura (Apenas Developers podem executar ações)
						</span>
					</template>

					<div class="actions-grid">
						<!-- Curar -->
						<BaseButton
							variant="secondary"
							:disabled="!auth.isDeveloper.value || !user.isInHospital || cureLoading"
							@click="handleCure()"
						>
							<NuxtImg
								src="situations/hospital.png"
								width="18"
							/>
							Curar do Hospital
						</BaseButton>

						<!-- Soltar -->
						<BaseButton
							variant="secondary"
							:disabled="!auth.isDeveloper.value || !user.isInPrison || freeLoading"
							@click="handleFree()"
						>
							<NuxtImg
								src="situations/prison.png"
								width="18"
							/>
							Soltar da Prisão
						</BaseButton>

						<!-- Ajustar Dinheiro -->
						<BaseButton
							variant="secondary"
							:disabled="!auth.isDeveloper.value || moneyLoading"
							@click="isMoneyModalOpen = true"
						>
							<DollarSign :size="16" />
							Alterar Dinheiro
						</BaseButton>

						<!-- Resetar Cooldown -->
						<BaseButton
							variant="secondary"
							:disabled="!auth.isDeveloper.value || cdLoading"
							@click="isCooldownModalOpen = true"
						>
							<Clock :size="16" />
							Resetar Cooldown
						</BaseButton>

						<!-- Remover de Ação -->
						<BaseButton
							variant="secondary"
							:disabled="!auth.isDeveloper.value || actionLoading"
							@click="isActionModalOpen = true"
						>
							<Unlock :size="16" />
							Remover de Ação
						</BaseButton>
					</div>
				</BaseCard>
			</div>

			<BaseCard class="more-info-card">
				<div class="meta-grid">
					<div class="meta-item">
						<span class="meta-label">Idioma</span>
						<span class="meta-value">{{ language }}</span>
					</div>

					<div class="meta-item">
						<span class="meta-label">Sequência diária</span>
						<span class="meta-value">{{ user.dailyStreak }} dias</span>
					</div>

					<div class="meta-item">
						<span class="meta-label">Votos (Top.gg)</span>
						<span class="meta-value">{{ user.voteCount }}</span>
					</div>

					<div class="meta-item">
						<span class="meta-label">Criado em</span>
						<span class="meta-value">{{ format(user.createdAt, "dd/MM/yyyy hh:mm") }}</span>
					</div>

					<div class="meta-item">
						<span class="meta-label">Última atualização</span>
						<span class="meta-value">{{ format(user.updatedAt, "dd/MM/yyyy hh:mm") }}</span>
					</div>
				</div>
			</BaseCard>
		</div>

		<!-- Modal: Alterar Dinheiro -->
		<BaseModal
			:open="isMoneyModalOpen"
			title="Alterar Dinheiro do Jogador"
			description="Adicione ou defina o saldo da carteira do jogador."
			@update:open="isMoneyModalOpen = $event"
		>
			<div class="modal-form">
				<div class="form-group">
					<p class="text-muted">Modo de Operação</p>
					<div class="radio-group">
						<label class="radio-label">
							<input
								v-model="moneyMode"
								type="radio"
								value="ADD"
							>
							Adicionar ao saldo atual
						</label>
						<label class="radio-label">
							<input
								v-model="moneyMode"
								type="radio"
								value="SET"
							>
							Definir valor exato
						</label>
					</div>
				</div>

				<BaseInput
					id="money-ammount"
					v-model="moneyAmount"
					type="number"
					label="Quantidade (Cr$)"
					placeholder="Ex: 50000"
				/>
			</div>

			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isMoneyModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="moneyLoading"
					@click="handleSetMoney()"
				>
					Confirmar Alteração
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Resetar Cooldown -->
		<BaseModal
			:open="isCooldownModalOpen"
			title="Resetar Cooldown de Ação"
			description="Zere o tempo de espera de uma ação para que o jogador possa executá-la imediatamente."
			@update:open="isCooldownModalOpen = $event"
		>
			<div class="modal-form">
				<div class="form-group">
					<label for="select-cooldown"> Escolha o Cooldown </label>
					<select
						id="select-cooldown"
						v-model="selectedCooldown"
						class="form-select"
					>
						<option value="scavenge">Vasculho (Scavenge)</option>
						<option value="robbery">Roubo / Procurado (Robbery)</option>
						<option value="beatup">Espancamento (Beat Up)</option>
					</select>
				</div>
			</div>

			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isCooldownModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="cdLoading"
					@click="handleResetCooldown()"
				>
					Resetar Cooldown
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Modal: Remover de Ação -->
		<BaseModal
			:open="isActionModalOpen"
			title="Remover de Ação Travada"
			description="Destrave o estado do jogador caso tenha ocorrido timeout ou erro durante uma ação."
			@update:open="isActionModalOpen = $event"
		>
			<div class="modal-form">
				<div class="form-group">
					<label for="select-action"> Escolha a Ação </label>
					<select
						id="select-action"
						v-model="selectedAction"
						class="form-select"
					>
						<option value="job">Trabalho (Job)</option>
						<option value="scavenge">Vasculho (Scavenge)</option>
						<option value="robbery">Roubo (Robbery)</option>
						<option value="beatup">Espancamento (Beat Up)</option>
						<option value="casino">Jogo de Cassino</option>
						<option value="gangaction">Ação de Gangue</option>
					</select>
				</div>
			</div>

			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isActionModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="actionLoading"
					@click="handleRemoveAction()"
				>
					Remover da Ação
				</BaseButton>
			</template>
		</BaseModal>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.user-detail-page {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.nav-back {
	margin-bottom: 4px;
}

.feedback-banner {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 16px;
	border-radius: $radius-sm;
	font-size: 0.875rem;

	&.success {
		background-color: rgba($color-success, 0.15);
		border: 1px solid rgba($color-success, 0.4);
		color: color.adjust($color-success, $lightness: 15%);
	}

	&.error {
		background-color: rgba($color-danger, 0.15);
		border: 1px solid rgba($color-danger, 0.4);
		color: color.adjust($color-danger, $lightness: 15%);
	}
}

.loading-state,
.not-found {
	@include flex-center;
	flex-direction: column;
	gap: 12px;
	padding: 60px 20px;
	color: $text-secondary;
}

.user-content {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.profile-header-card {
	.profile-main-info {
		display: flex;
		align-items: center;
		gap: 18px;
		padding-bottom: 20px;

		.profile-img {
			@include flex-center;
			width: 56px;
			height: 56px;
			border-radius: 50%;
			background-color: rgba($bg-input, 0.15);
			border: 1px solid rgba($bg-input, 0.3);
			color: $bg-input;
		}

		.name-row {
			display: flex;
			align-items: center;
			gap: 12px;

			.user-name {
				font-size: 1.5rem;
				font-weight: 800;
				color: $text-primary;
			}
		}

		.user-id {
			font-size: 0.8125rem;
			color: $text-muted;
			margin-top: 2px;

			code {
				color: $text-secondary;
			}
		}

		.user-economy {
			margin-left: auto;
			display: flex;
			flex-direction: column;
			align-items: end;

			.user-money {
				font-size: 2rem;
				font-weight: 700;
			}

			.user-coins{
				font-size: 0.8rem;
				@include text-gradient;
			}
		}
	}

	.user-badges-grid {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 1px solid $border-subtle;
		padding-bottom: 1rem;

		.user-badge-img{
			width: 40px;
		}
	}

	.situation {
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		font-weight: 600;
		gap: 6px;
		margin: 0.5rem 0;

		.situation-img {
			width: 40px;
		}
	}

	.user-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 16px;
		padding-top: 20px;

		.user-info-left {
			display: flex;
			font-weight: 600;
			color: $text-primary;
			align-items: center;

			.img-class {
				width: 32px;
				border-radius: $radius-full;
				background-color: $border-card;
				margin-right: 0.5rem;
			}
		}

		.user-info-right {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.img-attribute {
				width: 24px;
			}

			.attribute {
				display: flex;
				align-items: center;
				font-size: 0.9375rem;
				font-weight: 600;
				color: $color-attribute;
			}

			&:has(> .attribute) {
				margin-left: auto;
			}
		}
	}
}

.meta-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 16px;
	padding-top: 20px;

	.meta-item {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 4px;

		.meta-label {
			font-size: 0.75rem;
			color: $text-muted;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		.meta-value {
			font-size: 0.9375rem;
			font-weight: 600;
			color: $text-primary;
			display: flex;
			align-items: center;

			&.uppercase {
				text-transform: uppercase;
			}
		}
	}
}

.user-investment {
	display: flex;
	gap: 0.5rem;
	align-items: center;
	justify-content: space-between;

	.investment-left {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}

	.investment-right {
		display: flex;
		align-items: center;
		color: $color-attribute;
		font-weight: 600;
		font-size: 0.9375rem;

		img {
			width: 24px;
		}
	}
}

.gang-card {
	border-color: color-mix(in lab, $border-card 100%, v-bind(gangColor) 75%);
	background-color:  color-mix(in lab, $bg-card 100%, v-bind(gangColor) 15%);

	:deep(.card-header){
		border-color: color-mix(in lab, $border-card 100%, v-bind(gangColor) 75%)
	}

	.user-gang {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-weight: 600;

		.gang-img {
			border-radius: 100%;
			aspect-ratio: 1;
			object-fit: cover;
			width: 60px;
		}

		.gang-level {
			color: $text-secondary;
			margin-left: auto;
		}
	}
}

.info-columns {
	display: grid;
	grid-template-columns: 3fr 1fr;
	gap: 20px;

	@media (max-width: 850px) {
		grid-template-columns: 1fr;
	}

	.status-rows {
		display: flex;
		flex-direction: column;

		.status-row {
			@include flex-between;
			padding: 12px 0px;
			font-size: 0.875rem;

			.row-label {
				color: $text-secondary;
			}

			&:not(:last-child){
				border-bottom: 1px solid $border-card
			}
		}
	}

	.actions-card {
		.read-only-badge {
			font-size: 0.75rem;
			color: $color-warning;
		}

		.actions-grid {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
	}
}

.inventory-card {
	.empty-inv {
		@include flex-center;
		flex-direction: column;
		gap: 10px;
		padding: 40px;
		color: $text-muted;
		font-size: 0.875rem;
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
		gap: 14px;

		.item-card {
			padding: 14px;
			background-color: $bg-input;
			border: 1px solid $border-subtle;
			border-radius: $radius-sm;
			display: flex;
			flex-direction: column;
			gap: 8px;

			.item-img {
				//width: 128px;
			}

			.item-header {
				@include flex-between;
				flex-direction: column;
				gap: 0.25rem;
				align-items: start;
				flex-grow: 1;

				.item-name {
					font-size: 0.875rem;
					font-weight: 600;
					color: $text-primary;
				}

				.item-qty {
					font-size: 0.75rem;
					font-weight: 700;
					color: $color-brand;
					background-color: rgba($color-brand, 0.15);
					padding: 2px 6px;
					border-radius: $radius-xs;
				}
			}

			.item-stats {
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
				font-size: 0.75rem;

				.stat {
					padding: 2px 6px;
					border-radius: $radius-xs;
					background-color: rgba($bg-main, 0.5);

					&.atk {
						color: $color-danger;
					}

					&.def {
						color: $color-info;
					}
				}
			}
		}
	}
}

.modal-form {
	display: flex;
	flex-direction: column;
	gap: 16px;

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;

		label {
			font-size: 0.8125rem;
			font-weight: 500;
			color: $text-secondary;
		}

		.radio-group {
			display: flex;
			flex-direction: column;
			gap: 8px;

			.radio-label {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 0.875rem;
				color: $text-primary;
				cursor: pointer;
			}
		}

		.form-select {
			width: 100%;
			padding: 10px 14px;
			background-color: $bg-input;
			border: 1px solid $border-subtle;
			border-radius: $radius-sm;
			color: $text-primary;
			outline: none;

			&:focus {
				border-color: $color-brand;
			}
		}
	}
}
</style>
