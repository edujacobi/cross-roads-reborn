<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CircleUserRound, X } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { GetAlmsStatusDocument, GiveAlmsDocument } from "~/graphql/generated";

const props = defineProps<{ userId: string }>();

const emit = defineEmits<{
	feedback: [type: "success" | "error", message: string];
	refresh: [];
}>();

const isMenuOpen = ref(false);
const { formatMoney } = useMoneyFormat();
const { result: almsStatusResult, loading: almsStatusLoading } = useQuery(
	GetAlmsStatusDocument,
	() => ({ receiverId: props.userId }),
	{ fetchPolicy: "cache-and-network" },
);
const almsStatus = computed(() => almsStatusResult.value?.almsStatus);
const { mutate: giveAlms, loading: giveAlmsLoading } = useMutation(GiveAlmsDocument);

watch(
	() => props.userId,
	() => {
		isMenuOpen.value = false;
	},
);

async function handleGiveAlms() {
	try {
		const result = await giveAlms({ receiverId: props.userId });
		const response = result?.data?.giveAlms;

		if (!response) {
			emit("feedback", "error", "Não foi possível realizar a doação.");
			return;
		}

		emit("feedback", response.success ? "success" : "error", response.message);
		if (response.success) {
			emit("refresh");
		}
	} catch (error: unknown) {
		emit("feedback", "error", error instanceof Error ? error.message : "Erro inesperado.");
	}
}
</script>

<template>
	<template v-if="almsStatus">
		<section
			v-show="isMenuOpen"
			id="user-profile-floating-menu"
			class="user-profile-floating-actions__menu"
			aria-label="Ações para este jogador"
		>
			<BaseButton
				variant="secondary"
				:disabled="almsStatusLoading || giveAlmsLoading || !almsStatus.canGive"
				@click="isMenuOpen = false; handleGiveAlms()"
			>
				<NuxtImg
					src="/images/ui_elements/Alms.png"
					width="18"
					height="18"
					alt=""
				/>
				Doar {{ formatMoney(almsStatus.value) }}
			</BaseButton>
		</section>

		<button
			type="button"
			class="user-profile-floating-actions__toggle"
			:aria-label="isMenuOpen ? 'Fechar ações' : 'Abrir ações'"
			aria-controls="user-profile-floating-menu"
			:aria-expanded="isMenuOpen"
			@click="isMenuOpen = !isMenuOpen"
		>
			<X
				v-if="isMenuOpen"
				:size="24"
				aria-hidden="true"
			/>
			<CircleUserRound
				v-else
				:size="24"
				aria-hidden="true"
			/>
			<span class="user-profile-floating-actions__label">Ações</span>
		</button>
	</template>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.user-profile-floating-actions {
	&__toggle {
		position: fixed;
		left: calc(50% - 2rem);
		bottom: 1rem;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		background-color: $bg-sidebar;
		color: $text-primary;
		box-shadow: $shadow-lg;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		@media (min-width: 426px) {
			left: 50%;
			width: auto;
			padding: 0 1.25rem;
			border-radius: $radius-full;
			gap: $spacing-sm;
			transform: translateX(-50%);

			&:hover {
				transform: translateX(-50%) scale(1.05);
			}
		}
	}

	&__label {
		display: none;

		@media (min-width: 426px) {
			display: inline;
			font-weight: 600;
		}
	}

	&__menu {
		position: fixed;
		left: 50%;
		bottom: 5.75rem;
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		width: min(20rem, calc(100vw - 2rem));
		box-sizing: border-box;
		padding: $spacing-sm;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		background-color: $bg-card;
		box-shadow: $shadow-lg;
		transform: translateX(-50%);

		.base-button {
			width: 100%;
		}
	}
}
</style>
