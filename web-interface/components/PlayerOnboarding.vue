<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { nextTick, ref, watch } from "vue";
import ClassSelector from "~/components/UserDetail/ClassSelector.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import SegmentedProgressBar from "~/components/ui/SegmentedProgressBar.vue";
import { ChangeOwnClassDocument, ChangeOwnNicknameDocument, GetOnboardingPlayerDocument } from "~/graphql/generated";
import { getErrorMessage } from "~/utils/getErrorMessage";
import { nicknameMaxLength, nicknameMinLength, nicknamePattern, nicknameRules } from "~/utils/inputValidation";
import { ClassId } from "../../src/core/types/Ids";

const props = defineProps<{ preview?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const auth = useAuth();
const userId = computed(() => auth.user.value?.userId ?? "");
const {
	result,
	loading,
	error: queryError,
	refetch,
} = useQuery(GetOnboardingPlayerDocument, () => ({ id: userId.value }), {
	enabled: computed(() => !props.preview && import.meta.client === true && !!userId.value),
	fetchPolicy: "network-only",
});
const { mutate: changeNickname } = useMutation(ChangeOwnNicknameDocument);
const { mutate: changeClass } = useMutation(ChangeOwnClassDocument);
const { getClassName } = useClasses();
const open = ref(props.preview ?? false);
const initializedFor = ref("");
const step = ref(0);
const stepHeading = ref<HTMLElement | null>(null);
const nickname = ref("");
const savedNickname = ref("");
const savedClass = ref<ClassId>(ClassId.None);
const selectedClass = ref<ClassId | null>(null);
const saving = ref(false);
const error = ref("");

watch([result, userId], ([data, id]) => {
	if (!id || !data || initializedFor.value === id) return;
	initializedFor.value = id;
	savedNickname.value = data.user?.nickname ?? "";
	savedClass.value = data.user?.class ?? ClassId.None;
	if (!savedNickname.value || savedClass.value === ClassId.None) open.value = true;
});

async function moveStep(next: number) {
	step.value = next;
	await nextTick();
	stepHeading.value?.focus();
}

async function finish() {
	if (props.preview) {
		updateOpen(false);
		return;
	}
	if (saving.value) return;
	saving.value = true;
	error.value = "";
	try {
		const current = await refetch();
		if (!current?.data) throw new Error("Não foi possível verificar seus dados. Tente novamente.");
		savedNickname.value = current.data.user?.nickname ?? "";
		savedClass.value = current.data.user?.class ?? ClassId.None;

		if (!savedNickname.value) {
			const response = (await changeNickname({ nickname: nickname.value, initialOnly: true }))?.data?.changeOwnNickname;
			if (!response?.success) throw new Error(response?.message || "Não foi possível definir o apelido.");
			savedNickname.value = nickname.value;
		}
		if (savedClass.value === ClassId.None) {
			if (selectedClass.value === null) {
				error.value = "Escolha uma classe para continuar.";
				return;
			}
			const response = (await changeClass({ classId: selectedClass.value, initialOnly: true }))?.data?.changeOwnClass;
			if (!response?.success) throw new Error(response?.message || "Não foi possível definir a classe.");
			savedClass.value = selectedClass.value;
		}
		await refetch();
		await auth.fetchUser();
		open.value = false;
	} catch (cause: unknown) {
		error.value = getErrorMessage(cause);
	} finally {
		saving.value = false;
	}
}

function updateOpen(value: boolean) {
	open.value = value;
	if (!value && props.preview) emit("close");
}
</script>

<template>
	<div
		v-if="!preview && queryError && !loading"
		class="onboarding__notice"
		role="alert"
	>
		Não foi possível verificar seu cadastro.
		<BaseButton
			size="sm"
			@click="refetch()"
		>
			Tentar novamente
		</BaseButton>
	</div>
	<div
		v-else-if="!preview && initializedFor === userId && (!savedNickname || savedClass === ClassId.None) && !open"
		class="onboarding__notice"
	>
		Complete seu cadastro para começar.
		<BaseButton
			size="sm"
			@click="open = true"
		>
			Continuar cadastro
		</BaseButton>
	</div>
	<BaseModal
		:open="open"
		title="Bem-vindo à Cidade da Cruz"
		:description="preview ? 'Pré-visualização: nenhuma alteração será salva.' : ''"
		@update:open="updateOpen"
		:dismissible="false"
	>
		<div class="onboarding">
			<SegmentedProgressBar
				:popover="`Etapa ${step + 1} de 3`"
				:value="step + 1"
				:max="3"
				:segments="3"
				:label="`Etapa ${step + 1} de 3`"
			/>
			<template v-if="step === 0">
				<h2
					ref="stepHeading"
					class="onboarding__heading"
					tabindex="-1"
				>
					Sua história começa aqui
				</h2>
				<p class="onboarding__text">
					Na Cidade da Cruz, suas escolhas moldam seu caminho. Prepare seu personagem para começar a jogar.
				</p>
			</template>
			<template v-else-if="step === 1">
				<h2
					ref="stepHeading"
					class="onboarding__heading"
					tabindex="-1"
				>
					Escolha seu caminho
				</h2>
				<p class="onboarding__text">
					Trabalhe, invista, vasculhe lugares ou enfrente outros jogadores. Sua classe oferece vantagens e desvantagens
					para sua jornada.
				</p>
				<p class="onboarding__small">A primeira escolha de apelido e classe é gratuita. As próximas custarão grana.</p>
			</template>
			<form
				v-else
				class="onboarding__form"
				@submit.prevent="finish"
			>
				<h2
					ref="stepHeading"
					class="onboarding__heading"
					tabindex="-1"
				>
					Quem você vai ser?
				</h2>
				<template v-if="!savedNickname">
					<label for="onboarding-nickname"> Defina seu apelido e classe </label>
					<BaseInput
						id="onboarding-nickname"
						v-model="nickname"
						placeholder="Ex.: Jacobi"
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
				</template>
				<p
					v-else
					class="onboarding__text"
				>
					Seu apelido: <strong>{{ savedNickname }}</strong>
				</p>
				<template v-if="savedClass === ClassId.None">
					<ClassSelector
						v-model="selectedClass"
						aria-describedby="onboarding-class-rules"
						required
					/>
				</template>
				<p
					v-else
					class="onboarding__text"
				>
					Sua classe: <strong>{{ getClassName(savedClass) }}</strong>
				</p>
				<p
					v-if="error"
					class="onboarding__text onboarding__error"
					role="alert"
				>
					{{ error }}
				</p>
				<div class="onboarding__actions">
					<BaseButton
						variant="secondary"
						:disabled="saving"
						@click="moveStep(1)"
					>
						Voltar
					</BaseButton>
					<BaseButton
						type="submit"
						:disabled="saving"
					>
						{{ saving ? "Salvando..." : "Começar a jogar" }}
					</BaseButton>
				</div>
			</form>
			<div
				v-if="step < 2"
				class="onboarding__actions"
			>
				<BaseButton
					v-if="step > 0"
					variant="secondary"
					@click="moveStep(step - 1)"
				>
					Voltar
				</BaseButton>
				<BaseButton @click="moveStep(step + 1)"> Continuar </BaseButton>
			</div>
		</div>
	</BaseModal>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.onboarding {
	&,
	&__form {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	&__heading {
		font-size: $font-size-18;
	}

	&__text {
		color: $text-secondary;
	}

	&__small {
		color: $text-muted;
		font-size: $font-size-14;
	}

	&__actions {
		display: flex;
		justify-content: flex-end;
		gap: $spacing-sm;
	}

	&__error {
		color: $color-danger !important;
	}

	&__notice {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 90;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-md;
		background: $bg-card;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
	}
}
</style>
