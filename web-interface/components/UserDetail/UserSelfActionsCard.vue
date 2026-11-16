<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CalendarDays, CircleUserRound, Pencil, UserRound } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import ClassSelector from "~/components/UserDetail/ClassSelector.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseToggleMenu from "~/components/ui/BaseToggleMenu.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import {
	ChangeOwnClassDocument,
	ChangeOwnNicknameDocument,
	ClaimDailyRewardDocument,
	GetUserSelfActionsDocument,
	SetOwnAutomaticGrenadeDocument,
} from "~/graphql/generated";
import { getErrorMessage } from "~/utils/getErrorMessage";
import { nicknameMaxLength, nicknameMinLength, nicknamePattern, nicknameRules } from "~/utils/inputValidation";
import { ClassId } from "../../../src/core/types/Ids";

const props = defineProps<{ userId: string }>();

const emit = defineEmits<{
	feedback: [type: "success" | "error", message: string];
	refresh: [];
}>();

const { result: queryResult } = useQuery(GetUserSelfActionsDocument, () => ({ id: props.userId }), {
	fetchPolicy: "cache-and-network",
});
const user = computed(() => queryResult.value?.user);
const { mutate: claimDailyReward, loading: dailyLoading } = useMutation(ClaimDailyRewardDocument);
const { mutate: changeOwnNickname, loading: nicknameLoading } = useMutation(ChangeOwnNicknameDocument);
const { mutate: changeOwnClass, loading: classLoading } = useMutation(ChangeOwnClassDocument);
const { mutate: setAutomaticGrenade, loading: automaticGrenadeLoading } = useMutation(SetOwnAutomaticGrenadeDocument);
const { formatMoney } = useMoneyFormat();

const now = ref(Date.now());
let clockInterval: ReturnType<typeof setInterval> | undefined;
const isFloatingActionsOpen = ref(false);
const isNicknameModalOpen = ref(false);
const isClassModalOpen = ref(false);
const isAutomaticGrenadeModalOpen = ref(false);
const nickname = ref("");
const selectedClass = ref<ClassId>(ClassId.Attorney);
const dailyRemainingMinutes = computed(() => {
	const availableAt = user.value?.dailyNextAvailableAt ? new Date(user.value.dailyNextAvailableAt).getTime() : 0;
	return Math.max(0, Math.ceil((availableAt - now.value) / 60_000));
});
const canReceiveDaily = computed(() => dailyRemainingMinutes.value === 0);
const dailyButtonLabel = computed(() => {
	if (dailyLoading.value) return "Resgatando...";
	if (canReceiveDaily.value) return "Resgatar recompensa diária";

	const hours = Math.floor(dailyRemainingMinutes.value / 60);
	const minutes = dailyRemainingMinutes.value % 60;
	const remaining = [
		hours > 0 ? `${hours} ${hours === 1 ? "hora" : "horas"}` : "",
		minutes > 0 ? `${minutes} ${minutes === 1 ? "minuto" : "minutos"}` : "",
	]
		.filter(Boolean)
		.join(" e ");

	return `Poderá resgatar em ${remaining}`;
});
const nicknameChangeDescription = computed(() =>
	user.value?.nicknameChangeCost === 0
		? "Sua primeira alteração de apelido é gratuita."
		: `Custo: ${formatMoney(user.value?.nicknameChangeCost ?? 0)}.`,
);
const classChangeDescription = computed(() =>
	user.value?.classChangeCost === 0
		? "Sua primeira escolha de classe é gratuita."
		: `Custo: ${formatMoney(user.value?.classChangeCost ?? 0)}.`,
);

watch(isClassModalOpen, (isOpen) => {
	if (isOpen && user.value) {
		selectedClass.value = user.value.class as ClassId;
	}
});

onMounted(() => {
	clockInterval = setInterval(() => {
		now.value = Date.now();
	}, 1_000);
});

onUnmounted(() => {
	if (clockInterval) clearInterval(clockInterval);
});

function showSuccess(message: string) {
	emit("feedback", "success", message);
	emit("refresh");
}

function showError(message: string) {
	emit("feedback", "error", message);
}

async function handleDailyReward() {
	try {
		const result = await claimDailyReward();
		const response = result?.data?.claimDailyReward;
		if (response?.success) {
			showSuccess(response.message);
		} else {
			showError(response?.message || "Erro ao resgatar a recompensa diária.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleNicknameChange() {
	try {
		const result = await changeOwnNickname({ nickname: nickname.value });
		const response = result?.data?.changeOwnNickname;
		if (response?.success) {
			isNicknameModalOpen.value = false;
			showSuccess(response.message);
		} else {
			showError(response?.message || "Erro ao alterar apelido.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleClassChange() {
	try {
		const result = await changeOwnClass({ classId: selectedClass.value });
		const response = result?.data?.changeOwnClass;
		if (response?.success) {
			isClassModalOpen.value = false;
			showSuccess(response.message);
		} else {
			showError(response?.message || "Erro ao alterar classe.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}

async function handleAutomaticGrenadeChange() {
	if (!user.value) return;

	try {
		const result = await setAutomaticGrenade({ enabled: !user.value.automaticGrenade });
		const response = result?.data?.setOwnAutomaticGrenade;
		if (response?.success) {
			isAutomaticGrenadeModalOpen.value = false;
			showSuccess(response.message);
		} else {
			showError(response?.message || "Erro ao atualizar o uso automático de granadas.");
		}
	} catch (error: unknown) {
		showError(getErrorMessage(error));
	}
}
</script>

<template>
	<BaseToggleMenu
		v-if="user"
		v-model:open="isFloatingActionsOpen"
		menu-id="user-self-actions-floating-menu"
		menu-label="Ações da minha conta"
		toggle-label="Ações"
		open-label="Abrir ações da conta"
		close-label="Fechar ações da conta"
	>
		<template #icon>
			<CircleUserRound
				:size="24"
				aria-hidden="true"
			/>
		</template>
		<BaseButton
			variant="secondary"
			size="lg"
			@click="isFloatingActionsOpen = false; isNicknameModalOpen = true"
		>
			<Pencil
				:size="16"
				aria-hidden="true"
			/>
			Alterar apelido
		</BaseButton>
		<BaseButton
			variant="secondary"
			size="lg"
			@click="isFloatingActionsOpen = false; isClassModalOpen = true"
		>
			<UserRound
				:size="16"
				aria-hidden="true"
			/>
			Alterar classe
		</BaseButton>
		<BaseButton
			variant="secondary"
			size="lg"
			@click="isFloatingActionsOpen = false; isAutomaticGrenadeModalOpen = true"
		>
			<NuxtImg
				src="/images/items/18_Grenade.png"
				width="20"
				height="20"
				alt=""
			/>
			{{ user.automaticGrenade ? "Desativar granadas automáticas" : "Ativar granadas automáticas" }}
		</BaseButton>
		<BaseButton
			variant="secondary"
			size="lg"
			:disabled="dailyLoading || !canReceiveDaily"
			@click="isFloatingActionsOpen = false; handleDailyReward()"
		>
			<CalendarDays
				:size="16"
				aria-hidden="true"
			/>
			{{ dailyButtonLabel }}
		</BaseButton>
	</BaseToggleMenu>

	<BaseModal
		v-if="user"
		:open="isNicknameModalOpen"
		title="Alterar apelido"
		:description="nicknameChangeDescription"
		@update:open="isNicknameModalOpen = $event"
	>
		<form id="self-nickname-form" @submit.prevent="handleNicknameChange">
			<BaseInput
				id="self-user-nickname"
				v-model="nickname"
				label="Novo apelido"
				placeholder="Digite o apelido"
				name="nickname"
				required
				:minlength="nicknameMinLength"
				:maxlength="nicknameMaxLength"
				:pattern="nicknamePattern"
				:rules="nicknameRules"
				autocomplete="off"
				autocapitalize="none"
				spellcheck="false"
			/>
		</form>
		<template #footer>
			<BaseButton
				variant="ghost"
				@click="isNicknameModalOpen = false"
			>
				Cancelar
			</BaseButton>
			<BaseButton
				type="submit"
				form="self-nickname-form"
				:disabled="nicknameLoading"
			>
				{{ nicknameLoading ? "Salvando..." : "Salvar apelido" }}
			</BaseButton>
		</template>
	</BaseModal>

	<BaseModal
		v-if="user"
		:open="isClassModalOpen"
		title="Alterar classe"
		:description="classChangeDescription"
		@update:open="isClassModalOpen = $event"
	>
		<ClassSelector
			v-model="selectedClass"
			:current-class="user.class"
		/>
		<template #footer>
			<BaseButton
				variant="ghost"
				@click="isClassModalOpen = false"
			>
				Cancelar
			</BaseButton>
			<BaseButton
				:disabled="classLoading || selectedClass === user.class"
				@click="handleClassChange"
			>
				{{ classLoading ? "Salvando..." : "Confirmar classe" }}
			</BaseButton>
		</template>
	</BaseModal>

	<BaseModal
		v-if="user"
		:open="isAutomaticGrenadeModalOpen"
		title="Uso automático de granadas"
		description="Configure o consumo automático das granadas do seu inventário."
		@update:open="isAutomaticGrenadeModalOpen = $event"
	>
		<p>Quando ativado, suas granadas serão consumidas automaticamente em roubos contra jogadores e espancamentos.</p>
		<br>
		<p>
			Status atual:
			<strong>{{ user.automaticGrenade ? "Ativado" : "Desativado" }}</strong>
		</p>
		<template #footer>
			<BaseButton
				variant="ghost"
				@click="isAutomaticGrenadeModalOpen = false"
			>
				Cancelar
			</BaseButton>
			<BaseButton
				:disabled="automaticGrenadeLoading"
				@click="handleAutomaticGrenadeChange"
			>
				{{ automaticGrenadeLoading ? "Salvando..." : user.automaticGrenade ? "Desativar" : "Confirmar ativação" }}
			</BaseButton>
		</template>
	</BaseModal>
</template>
