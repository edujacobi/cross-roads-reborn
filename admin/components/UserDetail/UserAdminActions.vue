<script
	setup
	lang="ts"
>
import { useMutation } from "@vue/apollo-composable";
import { Clock, DollarSign, Unlock } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import {
	CureUserDocument,
	FreeUserDocument,
	RemoveActionDocument,
	ResetCooldownDocument,
	SetMoneyDocument,
	SetMoneyMode,
} from "~/graphql/generated";

const props = defineProps<{
	userId: string;
	isDeveloper: boolean;
	isInHospital: boolean;
	isInPrison: boolean;
}>();

const emit = defineEmits<{
	feedback: [type: "success" | "error", message: string];
	refresh: [];
}>();

const { mutate: mutateCure, loading: cureLoading } = useMutation(CureUserDocument);
const { mutate: mutateFree, loading: freeLoading } = useMutation(FreeUserDocument);
const { mutate: mutateSetMoney, loading: moneyLoading } = useMutation(SetMoneyDocument);
const { mutate: mutateResetCooldown, loading: cdLoading } = useMutation(ResetCooldownDocument);
const { mutate: mutateRemoveAction, loading: actionLoading } = useMutation(RemoveActionDocument);

const isMoneyModalOpen = ref(false);
const moneyAmount = ref(10000);
const moneyMode = ref<SetMoneyMode.Add | SetMoneyMode.Set>(SetMoneyMode.Add);
const isCooldownModalOpen = ref(false);
const selectedCooldown = ref<"scavenge" | "robbery" | "beatup">("scavenge");
const isActionModalOpen = ref(false);
const selectedAction = ref<"job" | "scavenge" | "robbery" | "beatup" | "casino" | "gangaction">("job");

function showSuccess(message: string) {
	emit("feedback", "success", message);
	emit("refresh");
}

function showError(message: string) {
	emit("feedback", "error", message);
}

function getErrorMessage(error: unknown): string {
	const hasMessage = error && typeof error === "object" && "message" in error;
	return hasMessage ? String(error.message) : "Erro inesperado.";
}

async function handleCure() {
	try {
		const res = await mutateCure({ userId: props.userId });
		if (res?.data?.cureUser?.success) {
			showSuccess(res.data.cureUser.message);
		} else {
			showError(res?.data?.cureUser?.message || "Erro ao curar jogador.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleFree() {
	try {
		const res = await mutateFree({ userId: props.userId });
		if (res?.data?.freeUser?.success) {
			showSuccess(res.data.freeUser.message);
		} else {
			showError(res?.data?.freeUser?.message || "Erro ao soltar jogador.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleSetMoney() {
	try {
		const res = await mutateSetMoney({
			userId: props.userId,
			amount: Number(moneyAmount.value),
			mode: moneyMode.value,
		});
		if (res?.data?.setMoney?.success) {
			showSuccess(res.data.setMoney.message);
			isMoneyModalOpen.value = false;
		} else {
			showError(res?.data?.setMoney?.message || "Erro ao atualizar dinheiro.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleResetCooldown() {
	try {
		const res = await mutateResetCooldown({
			userId: props.userId,
			cooldown: selectedCooldown.value,
		});
		if (res?.data?.resetCooldown?.success) {
			showSuccess(res.data.resetCooldown.message);
			isCooldownModalOpen.value = false;
		} else {
			showError(res?.data?.resetCooldown?.message || "Erro ao resetar cooldown.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleRemoveAction() {
	try {
		const res = await mutateRemoveAction({
			userId: props.userId,
			action: selectedAction.value,
		});
		if (res?.data?.removeAction?.success) {
			showSuccess(res.data.removeAction.message);
			isActionModalOpen.value = false;
		} else {
			showError(res?.data?.removeAction?.message || "Erro ao remover ação.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}
</script>

<template>
	<div class="user-admin-actions">
		<BaseCard
			title="Ações Administrativas"
			class="user-admin-actions__card"
		>
			<template #actions>
				<span
					v-if="!isDeveloper"
					class="user-admin-actions__read-only"
				>
					Modo Somente Leitura (Apenas Developers podem executar ações)
				</span>
			</template>

			<div class="user-admin-actions__buttons">
				<BaseButton
					variant="secondary"
					:disabled="!isDeveloper || !isInHospital || cureLoading"
					@click="handleCure()"
				>
					<NuxtImg
						src="situations/hospital.png"
						width="18"
					/>
					Curar do Hospital
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!isDeveloper || !isInPrison || freeLoading"
					@click="handleFree()"
				>
					<NuxtImg
						src="situations/prison.png"
						width="18"
					/>
					Soltar da Prisão
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!isDeveloper || moneyLoading"
					@click="isMoneyModalOpen = true"
				>
					<DollarSign :size="16" />
					Alterar Dinheiro
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!isDeveloper || cdLoading"
					@click="isCooldownModalOpen = true"
				>
					<Clock :size="16" />
					Resetar Cooldown
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!isDeveloper || actionLoading"
					@click="isActionModalOpen = true"
				>
					<Unlock :size="16" />
					Remover de Ação
				</BaseButton>
			</div>
		</BaseCard>

		<BaseModal
			:open="isMoneyModalOpen"
			title="Alterar Dinheiro do Jogador"
			description="Adicione ou defina o saldo da carteira do jogador."
			@update:open="isMoneyModalOpen = $event"
		>
			<div class="user-admin-actions__modal-form">
				<div class="user-admin-actions__form-group">
					<p class="user-admin-actions__muted">Modo de Operação</p>
					<div class="user-admin-actions__radio-group">
						<label class="user-admin-actions__radio-label">
							<input
								v-model="moneyMode"
								type="radio"
								value="ADD"
							>
							Adicionar ao saldo atual
						</label>
						<label class="user-admin-actions__radio-label">
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

		<BaseModal
			:open="isCooldownModalOpen"
			title="Resetar Cooldown de Ação"
			description="Zere o tempo de espera de uma ação para que o jogador possa executá-la imediatamente."
			@update:open="isCooldownModalOpen = $event"
		>
			<div class="user-admin-actions__modal-form">
				<div class="user-admin-actions__form-group">
					<label
						class="user-admin-actions__label"
						for="select-cooldown"
						>Escolha o Cooldown</label
					>
					<select
						id="select-cooldown"
						v-model="selectedCooldown"
						class="user-admin-actions__select"
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

		<BaseModal
			:open="isActionModalOpen"
			title="Remover de Ação Travada"
			description="Destrave o estado do jogador caso tenha ocorrido timeout ou erro durante uma ação."
			@update:open="isActionModalOpen = $event"
		>
			<div class="user-admin-actions__modal-form">
				<div class="user-admin-actions__form-group">
					<label
						class="user-admin-actions__label"
						for="select-action"
						>Escolha a Ação</label
					>
					<select
						id="select-action"
						v-model="selectedAction"
						class="user-admin-actions__select"
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

.user-admin-actions {
	&__buttons {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	&__read-only {
		font-size: 0.75rem;
		color: $color-warning;
	}

	&__modal-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	&__form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	&__label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-secondary;
	}

	&__muted {
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-secondary;
	}

	&__radio-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	&__radio-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.875rem;
		color: $text-primary;
		cursor: pointer;
	}

	&__select {
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
</style>
