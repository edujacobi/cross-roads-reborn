<script
	setup
	lang="ts"
>
import { useMutation } from "@vue/apollo-composable";
import {
	Award,
	ArrowLeftRight,
	Clock,
	Coins,
	Crown,
	DollarSign,
	Package,
	Pencil,
	Skull,
	Trash2,
	Unlock,
	UserRound,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
import {
	AddBadgeDocument,
	AddSpecialCoinsDocument,
	CureUserDocument,
	FreeUserDocument,
	KillUserDocument,
	RemoveActionDocument,
	RemoveBadgeDocument,
	ResetCooldownDocument,
	SetClassDocument,
	SetItemDocument,
	SetMoneyDocument,
	SetMoneyMode,
	SetNicknameDocument,
	SetVipDocument,
	SwapUsersDocument,
} from "~/graphql/generated";
import { BadgeId, ClassId, ItemId } from "../../../src/core/types/Ids";

const props = defineProps<{
	userId: string;
	isDeveloper: boolean;
	canWrite: boolean;
	isInHospital: boolean;
	isInPrison: boolean;
	badges: Array<{ id: number; name: string }>;
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
const { mutate: mutateSetItem, loading: itemLoading } = useMutation(SetItemDocument);
const { mutate: mutateAddSpecialCoins, loading: specialCoinsLoading } = useMutation(AddSpecialCoinsDocument);
const { mutate: mutateSetClass, loading: classLoading } = useMutation(SetClassDocument);
const { mutate: mutateSetNickname, loading: nicknameLoading } = useMutation(SetNicknameDocument);
const { mutate: mutateSetVip, loading: vipLoading } = useMutation(SetVipDocument);
const { mutate: mutateKillUser, loading: killLoading } = useMutation(KillUserDocument);
const { mutate: mutateAddBadge, loading: addBadgeLoading } = useMutation(AddBadgeDocument);
const { mutate: mutateRemoveBadge, loading: removeBadgeLoading } = useMutation(RemoveBadgeDocument);
const { mutate: mutateSwapUsers, loading: swapUsersLoading } = useMutation(SwapUsersDocument);

const isMoneyModalOpen = ref(false);
const moneyAmount = ref(10000);
const moneyMode = ref<SetMoneyMode.Add | SetMoneyMode.Set>(SetMoneyMode.Add);
const isItemModalOpen = ref(false);
const selectedItem = ref(ItemId.Knife);
const itemAmount = ref(1);
const itemMode = ref<SetMoneyMode.Add | SetMoneyMode.Set>(SetMoneyMode.Add);
const isSpecialCoinsModalOpen = ref(false);
const specialCoinsAmount = ref(1);
const isClassModalOpen = ref(false);
const selectedClass = ref(ClassId.None);
const isNicknameModalOpen = ref(false);
const nickname = ref("");
const isVipModalOpen = ref(false);
const vipDays = ref(30);
const isKillModalOpen = ref(false);
const killDays = ref(1);
const isAddBadgeModalOpen = ref(false);
const selectedAddBadge = ref<number | null>(null);
const isRemoveBadgeModalOpen = ref(false);
const selectedRemoveBadge = ref<number | null>(null);
const isSwapUsersModalOpen = ref(false);
const isCooldownModalOpen = ref(false);
const selectedCooldown = ref<"scavenge" | "robbery" | "beatup">("scavenge");
const isActionModalOpen = ref(false);
const selectedAction = ref<"job" | "scavenge" | "robbery" | "beatup" | "casino" | "gangaction">("job");
const secondSwapUserId = ref("");

const itemOptions = Object.entries(ItemId).flatMap(([name, id]) => (typeof id === "number" ? [{ id, name }] : []));
const classNames: Record<number, string> = {
	[ClassId.None]: "Sem classe",
	[ClassId.Thief]: "Ladrão",
	[ClassId.Assassin]: "Assassino",
	[ClassId.Entrepreneur]: "Empreendedor",
	[ClassId.Hobo]: "Mendigo",
	[ClassId.Mafioso]: "Mafioso",
	[ClassId.Attorney]: "Advogado",
};
const classOptions = Object.entries(ClassId).flatMap(([name, id]) =>
	typeof id === "number" ? [{ id, name: classNames[id] ?? name }] : [],
);
const badgeOptions = Object.entries(BadgeId).flatMap(([name, id]) => (typeof id === "number" ? [{ id, name }] : []));
const availableBadges = computed(() => badgeOptions.filter(({ id }) => !props.badges.some((badge) => badge.id === id)));

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
	const amount = Number(moneyAmount.value);
	if (!Number.isInteger(amount) || amount < 0) {
		showError("Informe uma quantidade inteira igual ou maior que zero.");
		return;
	}

	try {
		const res = await mutateSetMoney({
			userId: props.userId,
			amount,
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

async function handleSetItem() {
	const amount = Number(itemAmount.value);
	if (!Number.isFinite(amount) || amount < 0) {
		showError("Informe uma quantidade ou duração válida.");
		return;
	}

	try {
		const res = await mutateSetItem({
			userId: props.userId,
			itemId: selectedItem.value,
			mode: itemMode.value,
			hoursOrQuantity: amount,
		});
		if (res?.data?.setItem?.success) {
			showSuccess(res.data.setItem.message);
			isItemModalOpen.value = false;
		} else {
			showError(res?.data?.setItem?.message || "Erro ao atualizar item.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleAddSpecialCoins() {
	const amount = Number(specialCoinsAmount.value);
	if (!Number.isInteger(amount)) {
		showError("Informe uma quantidade inteira.");
		return;
	}

	try {
		const res = await mutateAddSpecialCoins({ userId: props.userId, amount });
		if (res?.data?.addSpecialCoins?.success) {
			showSuccess(res.data.addSpecialCoins.message);
			isSpecialCoinsModalOpen.value = false;
		} else {
			showError(res?.data?.addSpecialCoins?.message || "Erro ao adicionar moedas especiais.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleSetClass() {
	try {
		const res = await mutateSetClass({ userId: props.userId, classId: selectedClass.value });
		if (res?.data?.setClass?.success) {
			showSuccess(res.data.setClass.message);
			isClassModalOpen.value = false;
		} else {
			showError(res?.data?.setClass?.message || "Erro ao alterar classe.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleSetNickname() {
	const nextNickname = nickname.value.trim();
	if (!nextNickname) {
		showError("Informe um apelido.");
		return;
	}

	try {
		const res = await mutateSetNickname({ userId: props.userId, nickname: nextNickname });
		if (res?.data?.setNickname?.success) {
			showSuccess(res.data.setNickname.message);
			isNicknameModalOpen.value = false;
		} else {
			showError(res?.data?.setNickname?.message || "Erro ao alterar apelido.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleSetVip() {
	const days = Number(vipDays.value);
	if (!Number.isInteger(days)) {
		showError("Informe uma quantidade inteira de dias.");
		return;
	}

	try {
		const res = await mutateSetVip({ userId: props.userId, days });
		if (res?.data?.setVip?.success) {
			showSuccess(res.data.setVip.message);
			isVipModalOpen.value = false;
		} else {
			showError(res?.data?.setVip?.message || "Erro ao adicionar VIP.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleKillUser() {
	const days = Number(killDays.value);
	if (!Number.isInteger(days) || days < 1) {
		showError("Informe pelo menos 1 dia.");
		return;
	}

	try {
		const res = await mutateKillUser({ userId: props.userId, days });
		if (res?.data?.killUser?.success) {
			showSuccess(res.data.killUser.message);
			isKillModalOpen.value = false;
		} else {
			showError(res?.data?.killUser?.message || "Erro ao aplicar punição.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

function openAddBadgeModal() {
	selectedAddBadge.value = availableBadges.value[0]?.id ?? null;
	isAddBadgeModalOpen.value = true;
}

async function handleAddBadge() {
	if (selectedAddBadge.value === null) {
		showError("Não há emblemas disponíveis para adicionar.");
		return;
	}

	try {
		const res = await mutateAddBadge({ userId: props.userId, badgeId: selectedAddBadge.value });
		if (res?.data?.addBadge?.success) {
			showSuccess(res.data.addBadge.message);
			isAddBadgeModalOpen.value = false;
		} else {
			showError(res?.data?.addBadge?.message || "Erro ao adicionar emblema.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

function openRemoveBadgeModal() {
	selectedRemoveBadge.value = props.badges[0]?.id ?? null;
	isRemoveBadgeModalOpen.value = true;
}

async function handleRemoveBadge() {
	if (selectedRemoveBadge.value === null) {
		showError("O jogador não possui emblemas para remover.");
		return;
	}

	try {
		const res = await mutateRemoveBadge({ userId: props.userId, badgeId: selectedRemoveBadge.value });
		if (res?.data?.removeBadge?.success) {
			showSuccess(res.data.removeBadge.message);
			isRemoveBadgeModalOpen.value = false;
		} else {
			showError(res?.data?.removeBadge?.message || "Erro ao remover emblema.");
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

async function handleSwapUsers() {
	const secondUserId = secondSwapUserId.value.trim();
	if (!secondUserId || secondUserId === props.userId) {
		showError("Informe o ID de outro jogador.");
		return;
	}

	try {
		const res = await mutateSwapUsers({
			firstUserId: props.userId,
			secondUserId,
		});
		if (res?.data?.swapUsers?.success) {
			isSwapUsersModalOpen.value = false;
			secondSwapUserId.value = "";
			showSuccess(res.data.swapUsers.message);
		}
		else {
			showError(res?.data?.swapUsers?.message || "Erro ao trocar os jogadores.");
		}
	}
	catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}
</script>

<template>
	<div class="user-admin-actions">
		<BaseCard
			title="Ações administrativas"
			class="user-admin-actions__card"
		>
			<template #actions>
				<span
					v-if="!canWrite"
					class="user-admin-actions__read-only"
				>
					Modo Somente Leitura (Apenas moderadores e desenvolvedores podem executar ações)
				</span>
			</template>

			<div class="user-admin-actions__buttons">
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || !isInHospital || cureLoading"
					@click="handleCure()"
				>
					<NuxtImg
						:src="imagePaths.situations.hospital"
						width="18"
						alt=""
					/>
					Curar do Hospital
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || !isInPrison || freeLoading"
					@click="handleFree()"
				>
					<NuxtImg
						:src="imagePaths.situations.prison"
						width="18"
						alt=""
					/>
					Soltar da Prisão
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || moneyLoading"
					@click="isMoneyModalOpen = true"
				>
					<DollarSign
						:size="16"
						aria-hidden="true"
					/>
					Alterar Dinheiro
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || cdLoading"
					@click="isCooldownModalOpen = true"
				>
					<Clock
						:size="16"
						aria-hidden="true"
					/>
					Resetar Cooldown
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || actionLoading"
					@click="isActionModalOpen = true"
				>
					<Unlock
						:size="16"
						aria-hidden="true"
					/>
					Remover de Ação
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || itemLoading"
					@click="isItemModalOpen = true"
				>
					<Package
						:size="16"
						aria-hidden="true"
					/>
					Alterar Item
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || specialCoinsLoading"
					@click="isSpecialCoinsModalOpen = true"
				>
					<Coins
						:size="16"
						aria-hidden="true"
					/>
					Adicionar Moedas Especiais
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || classLoading"
					@click="isClassModalOpen = true"
				>
					<UserRound
						:size="16"
						aria-hidden="true"
					/>
					Alterar Classe
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || nicknameLoading"
					@click="isNicknameModalOpen = true"
				>
					<Pencil
						:size="16"
						aria-hidden="true"
					/>
					Alterar Apelido
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || vipLoading"
					@click="isVipModalOpen = true"
				>
					<NuxtImg
						:src="imagePaths.badges.vip"
						width="18"
					/>
					Adicionar VIP
				</BaseButton>

				<BaseButton
					variant="secondary"
					:disabled="!canWrite || addBadgeLoading || availableBadges.length === 0"
					@click="openAddBadgeModal"
				>
					<Award
						:size="16"
						aria-hidden="true"
					/>
					Adicionar Insígnia
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="!canWrite || removeBadgeLoading || badges.length === 0"
					@click="openRemoveBadgeModal"
				>
					<Trash2
						:size="16"
						aria-hidden="true"
					/>
					Remover Insígnia
				</BaseButton>
				<BaseButton
					variant="danger"
					:disabled="!canWrite || killLoading"
					@click="isKillModalOpen = true"
				>
					<Skull
						:size="16"
						aria-hidden="true"
					/>
					Aplicar Punição de Morte
				</BaseButton>
				<BaseButton
					v-if="isDeveloper"
					variant="danger"
					:disabled="swapUsersLoading"
					@click="isSwapUsersModalOpen = true"
				>
					<ArrowLeftRight
						:size="16"
						aria-hidden="true"
					/>
					Trocar Jogadores
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
				<fieldset class="user-admin-actions__form-group user-admin-actions__mode">
					<legend class="user-admin-actions__muted">Modo de Operação</legend>
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
				</fieldset>
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

		<BaseModal
			:open="isItemModalOpen"
			title="Alterar Item do Jogador"
			description="Adicione ao inventário ou defina a quantidade/duração do item."
			@update:open="isItemModalOpen = $event"
		>
			<div class="user-admin-actions__modal-form">
				<div class="user-admin-actions__form-group">
					<label
						class="user-admin-actions__label"
						for="select-item"
					>
						Item
					</label>
					<select
						id="select-item"
						v-model.number="selectedItem"
						class="user-admin-actions__select"
					>
						<option
							v-for="item in itemOptions"
							:key="item.id"
							:value="item.id"
						>
							{{ item.name }}
						</option>
					</select>
				</div>
				<fieldset class="user-admin-actions__form-group user-admin-actions__mode">
					<legend class="user-admin-actions__muted">Modo de Operação</legend>
					<div class="user-admin-actions__radio-group">
						<label class="user-admin-actions__radio-label">
							<input
								v-model="itemMode"
								type="radio"
								value="ADD"
							>
							Adicionar
						</label>
						<label class="user-admin-actions__radio-label">
							<input
								v-model="itemMode"
								type="radio"
								value="SET"
							>
							Definir valor exato
						</label>
					</div>
				</fieldset>
				<BaseInput
					id="item-amount"
					v-model="itemAmount"
					type="number"
					label="Quantidade ou duração em horas"
					placeholder="Ex: 5"
				/>
			</div>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isItemModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="itemLoading"
					@click="handleSetItem"
				>
					Confirmar Alteração
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isSpecialCoinsModalOpen"
			title="Ajustar Moedas Especiais"
			description="Valores positivos adicionam moedas; valores negativos removem."
			@update:open="isSpecialCoinsModalOpen = $event"
		>
			<BaseInput
				id="special-coins-amount"
				v-model="specialCoinsAmount"
				type="number"
				label="Quantidade de moedas"
				placeholder="Ex: 10 ou -10"
			/>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isSpecialCoinsModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="specialCoinsLoading"
					@click="handleAddSpecialCoins"
				>
					Aplicar Ajuste
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isClassModalOpen"
			title="Alterar Classe do Jogador"
			description="A classe selecionada substituirá a classe atual."
			@update:open="isClassModalOpen = $event"
		>
			<div class="user-admin-actions__form-group">
				<label
					class="user-admin-actions__label"
					for="select-class"
				>
					Classe
				</label>
				<select
					id="select-class"
					v-model.number="selectedClass"
					class="user-admin-actions__select"
				>
					<option
						v-for="userClass in classOptions"
						:key="userClass.id"
						:value="userClass.id"
					>
						{{ userClass.name }}
					</option>
				</select>
			</div>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isClassModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="classLoading"
					@click="handleSetClass"
				>
					Alterar Classe
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isNicknameModalOpen"
			title="Alterar Apelido"
			description="Defina um novo apelido para o jogador."
			@update:open="isNicknameModalOpen = $event"
		>
			<BaseInput
				id="user-nickname"
				v-model="nickname"
				label="Novo apelido"
				placeholder="Digite o apelido"
			/>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isNicknameModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="nicknameLoading"
					@click="handleSetNickname"
				>
					Salvar Apelido
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isVipModalOpen"
			title="Ajustar VIP"
			description="Dias positivos adicionam VIP; dias negativos removem do período atual."
			@update:open="isVipModalOpen = $event"
		>
			<BaseInput
				id="vip-days"
				v-model="vipDays"
				type="number"
				label="Duração em dias"
				placeholder="30 ou -30"
			/>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isVipModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:disabled="vipLoading"
					@click="handleSetVip"
				>
					Aplicar Ajuste
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isKillModalOpen"
			title="Aplicar Punição de Morte"
			description="O jogador ficará morto pelo período informado. Esta ação altera o estado do jogador."
			@update:open="isKillModalOpen = $event"
		>
			<BaseInput
				id="kill-days"
				v-model="killDays"
				type="number"
				label="Duração em dias"
				placeholder="1"
			/>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isKillModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="danger"
					:disabled="killLoading"
					@click="handleKillUser"
				>
					Confirmar Punição
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isAddBadgeModalOpen"
			title="Adicionar insígnia"
			description="Selecione uma insígnia para conceder ao jogador."
			@update:open="isAddBadgeModalOpen = $event"
		>
			<div class="user-admin-actions__form-group">
				<label
					class="user-admin-actions__label"
					for="select-add-badge"
					>Insígnia</label
				>
				<select
					id="select-add-badge"
					v-model.number="selectedAddBadge"
					class="user-admin-actions__select"
				>
					<option
						v-for="badge in availableBadges"
						:key="badge.id"
						:value="badge.id"
					>
						{{ badge.name }}
					</option>
				</select>
			</div>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isAddBadgeModalOpen = false"
					>Cancelar</BaseButton
				>
				<BaseButton
					variant="primary"
					:disabled="addBadgeLoading || selectedAddBadge === null"
					@click="handleAddBadge"
				>
					Adicionar Emblema
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isRemoveBadgeModalOpen"
			title="Remover Emblema"
			description="Selecione um dos emblemas atuais do jogador para removê-lo."
			@update:open="isRemoveBadgeModalOpen = $event"
		>
			<div class="user-admin-actions__form-group">
				<label
					class="user-admin-actions__label"
					for="select-remove-badge"
					>Emblema</label
				>
				<select
					id="select-remove-badge"
					v-model.number="selectedRemoveBadge"
					class="user-admin-actions__select"
				>
					<option
						v-for="badge in badges"
						:key="badge.id"
						:value="badge.id"
					>
						{{ badge.name }}
					</option>
				</select>
			</div>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isRemoveBadgeModalOpen = false"
					>Cancelar</BaseButton
				>
				<BaseButton
					variant="primary"
					:disabled="removeBadgeLoading || selectedRemoveBadge === null"
					@click="handleRemoveBadge"
				>
					Remover Emblema
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isSwapUsersModalOpen"
			title="Trocar dados entre jogadores"
			description="Esta ação troca todo o progresso e histórico dos dois jogadores em todas as tabelas do banco."
			@update:open="isSwapUsersModalOpen = $event"
		>
			<p>ID atual: <strong>{{ userId }}</strong></p>
			<BaseInput
				id="swap-user-id"
				v-model="secondSwapUserId"
				label="ID do outro jogador"
				placeholder="Discord ID"
			/>
			<template #footer>
				<BaseButton
					variant="ghost"
					@click="isSwapUsersModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="danger"
					:disabled="swapUsersLoading || !secondSwapUserId.trim() || secondSwapUserId.trim() === userId"
					@click="handleSwapUsers"
				>
					Confirmar Troca
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
		gap: $spacing-md;
	}

	&__form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	&__mode {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
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
		gap: $spacing-sm;
	}

	&__radio-label {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		font-size: 0.875rem;
		color: $text-primary;
		cursor: pointer;
	}

	&__select {
		width: 100%;
		padding: 0.625rem 0.875rem;
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
