<script
	setup
	lang="ts"
>
import { useMutation } from "@vue/apollo-composable";
import { computed, ref } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSelector from "~/components/ui/BaseSelector.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { imagePaths } from "~/constants/imagePaths";
import { CreateGangDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Gangues",
});

const auth = useAuth();
const { showToast } = useToast();

const userGang = computed(() => auth.user?.value?.gangId ?? 0);

const isCreateModalOpen = ref(false);
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

const { mutate: createGangMutation, loading: creating } = useMutation(CreateGangDocument);

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
		// Refresh auth data so userGang updates
		await auth.fetchUser();
	} else {
		const message = res?.data?.createGang?.message ?? "Falha ao criar gangue.";
		showToast({ text: message, variant: "error" });
	}
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
			subtitle="Crie sua gangue e trabalhe em equipe! Participe de assaltos em grupo e lutas generalizadas!"
		>
			<template #actions>
				<template v-if="userGang">
					<BaseButton
						variant="secondary"
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
			</template>
		</PageTitle>

		<div class="gangs-page__list">
			<BaseCard title="Bases de gangue">
				<p class="gangs-page__list-description">
					Bases custam Cr$ 1.000.000 do caixa da gangue. A cada nível, todos os membros ganham bônus especiais.
				</p>
				<p class="gangs-page__list-description">
					Bases também permitem realizar importações! Importe armas e equipamentos do exterior. Com sorte, o
					carregamento chegará e todos os membros receberão itens!
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
			:open="isCreateModalOpen"
			title="Criar gangue"
			description="Preencha as informações para criar sua gangue."
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
		font-size: 0.8125rem;
		font-weight: 500;
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
		font-size: 0.875rem;
		transition: border-color $transition-fast ease-in-out;

		&::placeholder {
			color: $text-muted;
		}

		&:focus {
			border-color: $color-brand;
		}
	}

	&__list {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;

		&-description {
			font-size: 0.875rem;
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
			height: auto;
			border-radius: $radius-sm;
		}

		&-name {
			font-size: 1rem;
		}

		&-description {
			font-size: 0.85rem;
			color: $text-secondary;
		}

		&-modifier {
			display: inline-flex;
			align-items:center;
			font-size: 0.75rem;
			color: $text-primary;
			gap: $spacing-sm;
			font-weight: 500;
		}

		&-image-modifier {
			width: 24px;
			height: auto;
			border-radius: $radius-sm;
		}
	}
}
</style>
