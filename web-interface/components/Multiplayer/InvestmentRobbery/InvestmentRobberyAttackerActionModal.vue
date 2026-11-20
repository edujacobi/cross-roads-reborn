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
const emit = defineEmits<{
	"update:open": [open: boolean];
}>();
</script>

<template>
	<BaseModal
		:open="true"
		title="Roubo de investimento em andamento"
		:icon="imagePaths.situations.defendingInvestment"
		@update:open="emit('update:open', $event)"
	>
		<section class="investment-robbery-attacker">
			<p>
				<strong>{{ session.gangName ?? "Sua gangue" }}</strong>
				está tentando roubar
				<strong>{{ session.investmentName ?? "o investimento" }}</strong>
				de
				<strong>{{ session.targetNickname ?? "o alvo" }}</strong>.
			</p>
			<p
				v-if="session.hasHenchman"
				class="investment-robbery-attacker__status"
			>
				<NuxtImg
					:src="imagePaths.classes.mafioso"
					alt=""
					width="24"
					height="24"
				/>
				O alvo tem um capanga ativo!
			</p>
			<p
				class="investment-robbery-attacker__status"
				role="status"
			>
				{{
					session.response === "defend" ? "O alvo está defendendo o investimento..." : "Aguardando resposta do alvo..."
				}}
			</p>
		</section>
		<template #footer>
			<p
				class="investment-robbery-attacker__countdown"
				v-if="session.expiresAt"
			>
				<time :datetime="session.expiresAt">{{ countdown }}</time>
				restantes
			</p>
		</template>
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

.investment-robbery-attacker {
	display: grid;
	gap: $spacing-md;
	padding: $spacing-lg 0;
	justify-items: center;

	p {
		margin: 0;
		text-align: center;
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
