<script
	setup
	lang="ts"
>
import { ArrowLeft, ClipboardCopy } from "lucide-vue-next";
import type { NuxtError } from "#app";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";

const props = defineProps<{
	error: NuxtError;
}>();
const { showToast } = useToast();

const isNotFound = computed(() => props.error.status === 404);
const errorMessage = computed(() => `Error ${props.error.status || 500}: ${props.error.message}`);

async function copyErrorMessage() {
	try {
		await navigator.clipboard.writeText(errorMessage.value);
		showToast({ variant: "success", text: "Mensagem de erro copiada." });
	} catch {
		showToast({ variant: "error", text: "Não foi possível copiar a mensagem de erro." });
	}
}
</script>

<template>
	<main class="error">
		<UiToastContainer />

		<BaseCard
			class="error__card"
			role="alert"
			:title="isNotFound ? 'Página não encontrada' : 'Algo deu errado'"
		>
			<NuxtImg
				class="error__image"
				:src="isNotFound ? '/images/badges/S6Top1Scavenge.png' : '/images/badges/S6Top1BeatUp.png'"
			/>
			<p class="error__description">
				{{
					isNotFound
						? "A página que você tentou acessar não existe ou foi movida."
						: "Ocorreu um erro inesperado. Tente voltar ao painel."
				}}
			</p>
			<p class="error__support-message">
				Caso o erro persista, copie a mensagem de erro abaixo e envie em nosso Discord
			</p>
			<div class="error__actions">
				<BaseButton
					variant="secondary"
					@click="clearError({ redirect: '/' })"
				>
					<ArrowLeft
						:size="16"
						aria-hidden="true"
					/>
					Voltar ao início
				</BaseButton>
				<BaseButton
					variant="secondary"
					to="https://discord.com/invite/sNf8avn"
					target="_blank"
				>
					<svg
						class="error__discord-icon"
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden="true"
					>
						<path
							d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
						/>
					</svg>
					Ir para o Discord
				</BaseButton>
			</div>
			<template #footer>
				<p class="error__code">{{ errorMessage }}</p>
				<BaseButton
					variant="ghost"
					aria-label="Copiar erro"
					title="Copiar erro"
					@click="copyErrorMessage"
				>
					<ClipboardCopy
						:size="16"
						aria-hidden="true"
					/>
				</BaseButton>
			</template>
		</BaseCard>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "./assets/scss/variables" as *;
@use "./assets/scss/mixins" as *;

.error {
	@include flex-center;
	min-height: 100vh;
	padding: $spacing-lg;
	background-color: $bg-main;

	&__card {
		gap: $spacing-md;
		max-width: 32rem;
		text-align: center;
	}

	&__image {
		width: 8rem;
	}

	&__description {
		color: $text-secondary;
	}

	&__support-message {
		color: $text-muted;
		font-size: 0.85rem;
		margin-top: 1rem;
	}

	&__actions {
		display: flex;
		justify-content: center;
		gap: $spacing-md;
		margin-top: 1.5rem;
	}

	&__code {
		color: $text-muted;
		font-weight: 600;
		font-size: 0.85rem;
	}

	:deep(.card-footer) {
		@include flex-center;
		gap: $spacing-sm;
	}
}
</style>
