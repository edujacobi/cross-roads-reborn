<script
	setup
	lang="ts"
>
import BaseModal from "~/components/ui/BaseModal.vue";
import ModalProgress from "~/components/ui/ModalProgress.vue";
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
		@update:open="emit('update:open', $event)"
	>
		<section class="robbery-attacker">
			<p>Tentando roubar <strong>{{ session.targetNickname ?? "o alvo" }}</strong>...</p>

			<p
				class="robbery-attacker__status"
				role="status"
			>
				<template v-if="session.response && responseActions[session.response]">
					<NuxtImg
						v-if="responseActions[session.response]?.image"
						:src="responseActions[session.response]?.image"
						alt=""
						width="24"
						height="24"
					/>
					{{ session.targetNickname ?? "O defensor" }} {{ responseActions[session.response]?.status }}
				</template>
				<template v-else-if="session.response">A ação está sendo resolvida.</template>
				<template v-else>Aguardando resposta do alvo...</template>
			</p>
		</section>
		<template #progress>
			<ModalProgress
				:end-time="session.expiresAt"
				color="robbery"
			/>
		</template>
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
	padding: $spacing-lg 0;
	justify-items: center;

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

		img {
			vertical-align: middle;
		}
	}

}

</style>
