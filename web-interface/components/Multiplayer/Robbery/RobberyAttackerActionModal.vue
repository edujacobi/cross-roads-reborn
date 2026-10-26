<script
	setup
	lang="ts"
>
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { MultiplayerSession } from "~/graphql/generated";

defineProps<{
	session: MultiplayerSession;
	countdown: string;
}>();
const responseActions: Partial<Record<string, { image: string; status: string }>> = {
	react: {
		image: imagePaths.uiElements.react,
		status: "está reagindo...",
	},
	police: {
		image: imagePaths.situations.wanted,
		status: "está chamando a polícia...",
	},
	nothing: {
		image: imagePaths.situations.idling,
		status: "não está fazendo nada...",
	},
};
const emit = defineEmits<{
	"update:open": [open: boolean];
}>();
</script>

<template>
	<BaseModal
		:open="true"
		title="Roubo em andamento"
		:icon="imagePaths.situations.robbery"
		variant="robbery"
		@update:open="emit('update:open', $event)"
	>
		<section class="robbery-attacker">
			<p>Tentando roubar <strong>{{ session.targetNickname ?? "o alvo" }}</strong>...</p>

			<div
				class="robbery-attacker__spinner"
				role="status"
				aria-label="Carregando"
			>
				<span class="sr-only">Roubando...</span>
			</div>

			<p
				class="robbery-attacker__status"
				role="status"
			>
				<template v-if="session.response && responseActions[session.response]">
					<NuxtImg
						:src="responseActions[session.response].image"
						alt=""
						width="24"
						height="24"
					/>
					{{ session.targetNickname ?? "O defensor" }} {{ responseActions[session.response].status }}
				</template>
				<template v-else-if="session.response">A ação está sendo resolvida.</template>
				<template v-else>Aguardando resposta do alvo...</template>
			</p>
		</section>
	</BaseModal>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.robbery-attacker {
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
		border-top-color: $color-robbery;
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
