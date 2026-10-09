<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CalendarDays, Pencil, UserRound } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import {
	ChangeOwnClassDocument,
	ChangeOwnNicknameDocument,
	ClaimDailyRewardDocument,
	GetUserSelfActionsDocument,
	SetOwnAutomaticGrenadeDocument,
} from "~/graphql/generated";
import { ClassId } from "../../../src/core/types/Ids";

const props = defineProps<{ userId: string }>();

const emit = defineEmits<{
	feedback: [type: "success" | "error", message: string];
	refresh: [];
}>();

const {
	result: queryResult,
	loading,
	error: queryError,
	refetch,
} = useQuery(GetUserSelfActionsDocument, () => ({ id: props.userId }), {
	fetchPolicy: "cache-and-network",
});
const user = computed(() => queryResult.value?.user);
const { mutate: claimDailyReward, loading: dailyLoading } = useMutation(ClaimDailyRewardDocument);
const { mutate: changeOwnNickname, loading: nicknameLoading } = useMutation(ChangeOwnNicknameDocument);
const { mutate: changeOwnClass, loading: classLoading } = useMutation(ChangeOwnClassDocument);
const { mutate: setAutomaticGrenade, loading: automaticGrenadeLoading } = useMutation(SetOwnAutomaticGrenadeDocument);
const { getClassDescription, getClassModifiers, getClassName, getClassImageUrl } = useClasses();
const { formatMoney } = useMoneyFormat();

const now = ref(Date.now());
let clockInterval: ReturnType<typeof setInterval> | undefined;
const isNicknameModalOpen = ref(false);
const isClassModalOpen = ref(false);
const isAutomaticGrenadeModalOpen = ref(false);
const nickname = ref("");
const selectedClass = ref<ClassId>(ClassId.Attorney);
const classOptions = [
	{ id: ClassId.Attorney, name: getClassName(ClassId.Attorney) },
	{ id: ClassId.Entrepreneur, name: getClassName(ClassId.Entrepreneur) },
	{ id: ClassId.Hobo, name: getClassName(ClassId.Hobo) },
	{ id: ClassId.Thief, name: getClassName(ClassId.Thief) },
];
const selectedClassDescription = computed(() => getClassDescription(selectedClass.value));
const selectedClassModifiers = computed(() => getClassModifiers(selectedClass.value));
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

function getErrorMessage(error: unknown): string {
	return error && typeof error === "object" && "message" in error ? String(error.message) : "Erro inesperado.";
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
	<BaseCard
		v-if="user || loading || queryError"
		title="Minha conta"
	>
		<template #actions>
			<RefreshButton
				@refresh="() => refetch()"
				:loading="loading"
				aria-label="Atualizar conta"
			/>
		</template>
		<div
			v-if="loading && !user"
			class="user-self-actions__skeleton"
			role="status"
			aria-label="Carregando ações da conta"
		>
			<BaseSkeleton
				v-for="index in 3"
				:key="index"
				width="12rem"
				height="2.5rem"
			/>
		</div>
		<p
			v-else-if="queryError && !user"
			role="alert"
		>
			Não foi possível carregar as ações da conta.
		</p>
		<div
			v-else-if="user"
			class="user-self-actions"
		>
			<BaseButton
				variant="secondary"
				:disabled="dailyLoading || !canReceiveDaily"
				@click="handleDailyReward"
			>
				<CalendarDays
					:size="16"
					aria-hidden="true"
				/>
				{{ dailyButtonLabel }}
			</BaseButton>
			<BaseButton
				variant="secondary"
				@click="isNicknameModalOpen = true"
			>
				<Pencil
					:size="16"
					aria-hidden="true"
				/>
				Alterar apelido
			</BaseButton>
			<BaseButton
				variant="secondary"
				:disabled="classOptions.length === 0"
				@click="isClassModalOpen = true"
			>
				<UserRound
					:size="16"
					aria-hidden="true"
				/>
				Alterar classe
			</BaseButton>
			<BaseButton
				variant="secondary"
				@click="isAutomaticGrenadeModalOpen = true"
			>
				<NuxtImg
					src="/images/items/18_Grenade.png"
					width="18"
					height="18"
					alt=""
				/>
				{{ user.automaticGrenade ? "Desativar granadas automáticas" : "Ativar granadas automáticas" }}
			</BaseButton>
		</div>
	</BaseCard>

	<BaseModal
		v-if="user"
		:open="isNicknameModalOpen"
		title="Alterar apelido"
		:description="nicknameChangeDescription"
		@update:open="isNicknameModalOpen = $event"
	>
		<BaseInput
			id="self-user-nickname"
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
				:disabled="nicknameLoading || !nickname"
				@click="handleNicknameChange"
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
		<div class="user-self-actions__class-field">
			<span class="user-self-actions__class-label">Classe</span>
			<div class="class-options">
				<button
					v-for="option in classOptions"
					:key="option.id"
					type="button"
					class="class-option"
					:class="{ 'class-option--selected': option.id === selectedClass }"
					:aria-pressed="option.id === selectedClass"
					@click="selectedClass = option.id"
				>
					<NuxtImg
						class="option-image"
						:src="getClassImageUrl(option.id)"
						width="80"
						alt=""
					/>
					<span class="option-name">
						{{ option.name }}
					</span>
					<span
						v-if="option.id === user.class"
						class="option-current"
					>
						Atual
					</span>
				</button>
			</div>
			<p class="user-self-actions__class-description">{{ selectedClassDescription }}</p>
			<ul class="user-self-actions__class-modifiers">
				<li
					v-for="modifier in selectedClassModifiers"
					:key="modifier.label"
					:class="{ 'user-self-actions__class-modifier--negative': !modifier.isPositive }"
				>
					{{ modifier.isPositive ? "+" : "-" }}{{ modifier.percentage }}% {{ modifier.label }}
				</li>
			</ul>
		</div>
		<template #footer>
			<BaseButton
				variant="ghost"
				@click="isClassModalOpen = false"
			>
				Cancelar
			</BaseButton>
			<BaseButton
				:disabled="classLoading || classOptions.length === 0 || selectedClass === user.class"
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

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "sass:color";

.user-self-actions {
	&__skeleton {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}

	display: flex;
	flex-wrap: wrap;
	gap: $spacing-sm;

	&__class-field {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;

		.user-self-actions__class-label {
			font-size: 0.8125rem;
			font-weight: 500;
			color: $text-secondary;
		}

		.class-options {
			display: grid;
			gap: $spacing-md;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			width: 100%;

			@media (max-width: 540px){
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}

			.class-option {
				display: flex;
				align-items: center;
				gap: $spacing-sm;
				padding: $spacing-md;
				flex-direction: column;
				min-width: 0;
				border-radius: $radius-sm;
				border: 1px solid $border-card;
				background: transparent;
				color: $text-primary;
				font: inherit;
				cursor: pointer;

				.option-image {
					max-width: 100%;
				}

				&--selected {
					border-color: $color-success;
					color:  $color-success;
					background-color: color-mix(in lab, $bg-card 100%, $color-success 10%);
				}

				.option-name {
					font-size: 0.85rem;
				}

				.option-current {
					font-size: 0.7rem;
					color: $text-secondary;
				}
			}
		}
	}

	&__class-description {
		margin: $spacing-sm 0 0;
		color: $text-secondary;
		font-size: 0.875rem;
	}

	&__class-modifiers {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		margin: $spacing-sm 0 0;
		padding-left: 0.5rem;
		color: color.adjust($color-success, $lightness: 10%);
		font-size: 0.875rem;
		list-style: none;

		li:before {
			content: '▲';
			margin-right: 0.5rem;
		}
	}

	&__class-modifier--negative {
		color: color.adjust($color-danger, $lightness: 10%);

		&:before {
			content: '▼' !important;
		}
	}
}
</style>
