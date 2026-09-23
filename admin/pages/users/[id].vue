<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Coins,
	DollarSign,
	HeartPulse,
	Lock,
	Package,
	RotateCw,
} from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import {
	GET_USER_DETAIL,
	MUTATION_CURE_USER,
	MUTATION_FREE_USER,
	MUTATION_REMOVE_ACTION,
	MUTATION_RESET_COOLDOWN,
	MUTATION_SET_MONEY,
	type UserDetailsDto,
} from "~/graphql/operations";

const route = useRoute();
const auth = useAuth();
const userId = computed(() => String(route.params.id));

const { result, loading, refetch } = useQuery(GET_USER_DETAIL, () => ({ id: userId.value }));

const user = computed<UserDetailsDto>(() => result.value?.user);
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
const { mutate: mutateCure, loading: cureLoading } = useMutation(MUTATION_CURE_USER);
const { mutate: mutateFree, loading: freeLoading } = useMutation(MUTATION_FREE_USER);
const { mutate: mutateSetMoney, loading: moneyLoading } = useMutation(MUTATION_SET_MONEY);
const { mutate: mutateResetCooldown, loading: cdLoading } = useMutation(MUTATION_RESET_COOLDOWN);
const { mutate: mutateRemoveAction, loading: actionLoading } = useMutation(MUTATION_REMOVE_ACTION);

// Modal States
const isMoneyModalOpen = ref(false);
const moneyAmount = ref(10000);
const moneyMode = ref<"ADD" | "SET">("ADD");

const isCooldownModalOpen = ref(false);
const selectedCooldown = ref<"scavenge" | "robbery" | "beatup">("scavenge");

const isActionModalOpen = ref(false);
const selectedAction = ref<"job" | "scavenge" | "robbery" | "beatup" | "casino" | "gangaction">("job");

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
					<span>Voltar para Lista</span>
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
			<span>{{ feedback.message }}</span>
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
					<div class="avatar-placeholder">
						<Coins :size="32" />
					</div>
					<div>
						<div class="name-row">
							<h1 class="user-name">{{ user.nickname || "(Sem Nick)" }}</h1>
							<BaseBadge
								v-if="user.vipEternal"
								variant="vip"
								>VIP Eterno</BaseBadge
							>
							<BaseBadge
								v-else-if="user.isVip"
								variant="vip"
								>VIP</BaseBadge
							>
						</div>
						<p class="user-id">ID: <code>{{ user.id }}</code></p>
					</div>
				</div>

				<div class="profile-meta-grid">
					<div class="meta-item">
						<span class="meta-label">Classe</span>
						<span class="meta-value">{{ user.className }}</span>
					</div>

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
						variant="danger"
						:disabled="!auth.isDeveloper.value || !user.isInHospital || cureLoading"
						@click="handleCure()"
					>
						<HeartPulse :size="16" />
						Curar do Hospital
					</BaseButton>

					<!-- Soltar -->
					<BaseButton
						variant="secondary"
						:disabled="!auth.isDeveloper.value || !user.isInPrison || freeLoading"
						@click="handleFree()"
					>
						<Lock :size="16" />
						Soltar da Prisão
					</BaseButton>

					<!-- Ajustar Dinheiro -->
					<BaseButton
						variant="primary"
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
						<RotateCw :size="16" />
						Remover de Ação
					</BaseButton>
				</div>
			</BaseCard>

			<!-- Status & Economy Grid -->
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
								v-if="user.isInHospital"
								variant="danger"
							>
								Hospitalizado até {{ new Date(user.hospitalTime).toLocaleTimeString() }}
							</BaseBadge>
							<BaseBadge
								v-else
								variant="success"
								>Livre</BaseBadge
							>
						</div>

						<div class="status-row">
							<span class="row-label">Prisão</span>
							<BaseBadge
								v-if="user.isInPrison"
								variant="neutral"
							>
								Preso até {{ new Date(user.prisonTime).toLocaleTimeString() }}
							</BaseBadge>
							<BaseBadge
								v-else
								variant="success"
								>Livre</BaseBadge
							>
						</div>

						<div class="status-row">
							<span class="row-label">Emprego</span>
							<BaseBadge
								v-if="user.isWorking"
								variant="warning"
								>Trabalhando</BaseBadge
							>
							<BaseBadge
								v-else
								variant="neutral"
								>Sem trabalho ativo</BaseBadge
							>
						</div>

						<div class="status-row">
							<span class="row-label">Vasculho</span>
							<BaseBadge
								v-if="user.isScavenging"
								variant="warning"
								>Vasculhando</BaseBadge
							>
							<BaseBadge
								v-else
								variant="neutral"
								>Inativo</BaseBadge
							>
						</div>

						<div class="status-row">
							<span class="row-label">Procurado pela Polícia</span>
							<BaseBadge
								v-if="user.isWanted"
								variant="danger"
								>Procurado</BaseBadge
							>
							<BaseBadge
								v-else
								variant="success"
								>Ficha Limpa</BaseBadge
							>
						</div>
					</div>
				</BaseCard>

				<!-- Economy Card -->
				<BaseCard
					title="Economia"
					class="economy-summary-card"
				>
					<div class="economy-rows">
						<div class="economy-item">
							<div class="icon-wrap success">
								<DollarSign :size="20" />
							</div>
							<div class="economy-info">
								<span class="label">Saldo em Carteira</span>
								<span class="val success">Cr$ {{ user.money.toLocaleString() }}</span>
							</div>
						</div>

						<div class="economy-item">
							<div class="icon-wrap gold">
								<Coins :size="20" />
							</div>
							<div class="economy-info">
								<span class="label">Special Coins</span>
								<span class="val gold">{{ user.specialCoin.toLocaleString() }}</span>
							</div>
						</div>
					</div>
				</BaseCard>
			</div>

			<!-- Inventory Section -->
			<BaseCard
				:title="`Inventário (${user.items.length} Itens)`"
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
						<div class="item-header">
							<span class="item-name">{{ item.name }}</span>
							<span class="item-qty">x{{ item.quantity }}</span>
						</div>

						<div class="item-stats">
							<span
								v-if="item.attack > 0"
								class="stat atk"
								>ATK: +{{ item.attack }}</span
							>
							<span
								v-if="item.defense > 0"
								class="stat def"
								>DEF: +{{ item.defense }}</span
							>
							<span class="stat price">Cr$ {{ item.price.toLocaleString() }}</span>
						</div>
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
					>Cancelar</BaseButton
				>
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
					>Cancelar</BaseButton
				>
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
					>Cancelar</BaseButton
				>
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
		border-bottom: 1px solid $border-subtle;

		.avatar-placeholder {
			@include flex-center;
			width: 56px;
			height: 56px;
			border-radius: 50%;
			background-color: rgba($color-brand, 0.15);
			border: 1px solid rgba($color-brand, 0.3);
			color: $color-brand;
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
	}

	.profile-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 16px;
		padding-top: 20px;

		.meta-item {
			display: flex;
			flex-direction: column;
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

				&.uppercase {
					text-transform: uppercase;
				}
			}
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
		flex-wrap: wrap;
		gap: 12px;
	}
}

.info-columns {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;

	@media (max-width: 850px) {
		grid-template-columns: 1fr;
	}

	.status-rows {
		display: flex;
		flex-direction: column;
		gap: 12px;

		.status-row {
			@include flex-between;
			padding: 8px 12px;
			background-color: $bg-input;
			border-radius: $radius-sm;
			font-size: 0.875rem;

			.row-label {
				color: $text-secondary;
			}
		}
	}

	.economy-rows {
		display: flex;
		flex-direction: column;
		gap: 14px;

		.economy-item {
			display: flex;
			align-items: center;
			gap: 16px;
			padding: 16px;
			background-color: $bg-input;
			border-radius: $radius-sm;
			border: 1px solid $border-subtle;

			.icon-wrap {
				@include flex-center;
				width: 44px;
				height: 44px;
				border-radius: $radius-sm;

				&.success {
					background-color: rgba($color-success, 0.15);
					color: $color-success;
				}

				&.gold {
					background-color: rgba($color-gold, 0.15);
					color: $color-gold;
				}
			}

			.economy-info {
				display: flex;
				flex-direction: column;

				.label {
					font-size: 0.75rem;
					color: $text-muted;
					text-transform: uppercase;
				}

				.val {
					font-size: 1.25rem;
					font-weight: 800;

					&.success {
						color: $color-success;
					}

					&.gold {
						color: $color-gold;
					}
				}
			}
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
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 14px;

		.item-card {
			padding: 14px;
			background-color: $bg-input;
			border: 1px solid $border-subtle;
			border-radius: $radius-sm;
			display: flex;
			flex-direction: column;
			gap: 8px;

			.item-header {
				@include flex-between;

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

					&.price {
						color: $color-success;
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
