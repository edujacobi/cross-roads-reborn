<script
	setup
	lang="ts"
>
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { MultiplayerSession } from "~/graphql/generated";

const props = defineProps<{
	session: MultiplayerSession;
	countdown: string;
}>();
const emit = defineEmits<{
	"update:open": [open: boolean];
}>();
</script>

<template>
	<BaseModal
		:open="true"
		title="Espancamento em andamento"
		:icon="imagePaths.situations.beatup"
		@update:open="emit('update:open', $event)"
	>
		<section class="beat-up-attacker">
			<p>Tentando espancar <strong>{{ session.targetNickname ?? "o alvo" }}</strong>...</p>

			<div
				class="beat-up-attacker__spinner"
				role="status"
				aria-label="Carregando"
			>
				<span class="sr-only">Espancando...</span>
			</div>

			<p
				class="beat-up-attacker__status"
				role="status"
			>
				{{ session.response ? "Resolvendo o roubo..." : "Aguardando resposta do alvo..." }}
			</p>
		</section>
	</BaseModal>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.beat-up-attacker {
	display: grid;
	gap: $spacing-md;

	p {
		margin: 0;
	}

	&__weapon {
		display: inline-block;
		vertical-align: middle;
		object-fit: contain;
	}

	&__attack {
		width: fit-content;
	}

	&__status,
	&__countdown {
		color: $text-secondary;
	}

	&__spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid $border-card;
		border-top-color: $color-beatup;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
}

@media (prefers-reduced-motion: reduce) {
	.robbery-attacker__spinner {
		transition: none !important;
		animation: none !important;
	}
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}
</style>
