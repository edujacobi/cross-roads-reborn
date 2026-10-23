<script
	setup
	lang="ts"
>
import { computed } from "vue";
import AttackIcon from "~/components/icons/AttackIcon.vue";
import UserPicture from "~/components/UserPicture.vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { MultiplayerSession } from "~/graphql/generated";

const props = defineProps<{
	session: MultiplayerSession;
	dismissible: boolean;
	responding: boolean;
	countdown: string;
	attackerImageUrl?: string | null;
	attackerAvatarDecoration?: string | null;
	money?: number | null;
	profileError?: boolean;
}>();
const { formatMoney } = useMoneyFormat();
const formatMinutes = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const responseDescriptions = computed<Record<string, string>>(() => {
	const details = props.session.duelDetails;
	return {
		react: details
			? `+5 DEF, mas você ficará hospitalizado por ${formatMinutes(details.hospitalMinutes)} minutos caso seja roubado.`
			: "+5 DEF, mas você ficará hospitalizado caso seja roubado.",
		police: details
			? `-5 DEF, mas o atacante ficará preso por ${formatMinutes(details.prisonMinutesDelta)} minutos adicionais caso falhe.`
			: "-5 DEF, mas o atacante ficará preso por mais tempo caso falhe.",
		nothing: "Nenhum efeito adicional.",
	};
});

const emit = defineEmits<{
	respond: [response: string];
	"update:open": [open: boolean];
}>();

const responseLabels: Record<string, { text: string; image?: string }> = {
	react: {
		text: "Reagir",
		image: imagePaths.uiElements.react,
	},
	police: {
		text: "Chamar a polícia",
		image: imagePaths.situations.wanted,
	},
	nothing: {
		text: "Não fazer nada",
		image: imagePaths.situations.idling,
	},
};
const responseStatuses: Record<string, string> = {
	react: "Reagindo...",
	police: "Chamando a polícia...",
	nothing: "Fazendo nada...",
};
</script>

<template>
	<BaseModal
		:open="true"
		:dismissible="dismissible"
		title="Roubo em andamento"
		@update:open="emit('update:open', $event)"
		icon="/images/situations/robbery.png"
	>
		<section
			class="defender-prompt"
			:aria-labelledby="`defender-attackers-${session.id}`"
		>
			<ul
				class="defender-prompt__attackers"
				:aria-labelledby="`defender-attackers-${session.id}`"
			>
				<li
					v-for="participant in session.participants"
					:key="participant.userId"
				>
					<UserPicture
						v-if="attackerImageUrl"
						:image-url="attackerImageUrl"
						:decoration="attackerAvatarDecoration"
						:alt="`Avatar de ${participant.nickname}`"
						width="32"
						height="32"
						class="defender-prompt__avatar-frame"
						image-class="defender-prompt__avatar"
					/>
					<strong>{{ participant.nickname }}</strong>
					está tentando roubar você utilizando
					<template v-if="session.duelDetails">
						<NuxtImg
							v-if="session.duelDetails.weaponImageUrl"
							:src="session.duelDetails.weaponImageUrl"
							alt=""
							width="24"
							height="24"
							class="defender-prompt__weapon-image"
						/>
						<strong>{{ session.duelDetails.weaponName }}</strong>
					</template>
					<span v-if="session.duelDetails?.usedGrenade">
							e uma
							<NuxtImg
								src="images/items/18_Grenade.png"
								alt=""
								width="24"
								height="24"
								class="defender-prompt__weapon-image"
							/>
							<span>Granada</span>
						</span>
					<BaseBadge
						variant="danger"
						class="defender-prompt__attack-badge"
					>
						<AttackIcon
							:size="14"
							variant="solid"
						/>
						{{ participant.attack }}
						ATK
					</BaseBadge>
				</li>
			</ul>
		</section>

		<section class="defender-prompt__actions-wrapper">
			<p>Decida o que fazer:</p>
			<fieldset
				v-if="session.phase === 'awaitingDefender' && session.response === null"
				class="defender-prompt__actions"
				aria-label="Ações para Roubo"
				:aria-busy="responding"
			>
				<div
					v-for="response in session.allowedResponses"
					:key="response"
					class="defender-prompt__response"
				>
					<BaseButton
						variant="secondary"
						:disabled="responding"
						size="lg"
						:aria-describedby="`response-effect-${session.id}-${response}`"
						@click="emit('respond', response)"
					>
						<NuxtImg
							v-if="responseLabels[response]?.image"
							:src="responseLabels[response].image"
							alt=""
							width="20"
							height="20"
						/>
						{{ responseLabels[response]?.text ?? response }}
					</BaseButton>
					<p :id="`response-effect-${session.id}-${response}`">{{ responseDescriptions[response] }}</p>
				</div>
			</fieldset>
			<p
				v-else
				class="defender-prompt__status"
				role="status"
			>
				<NuxtImg
					v-if="session.response && responseLabels[session.response]?.image"
					:src="responseLabels[session.response].image"
					alt=""
					width="24"
					height="24"
				/>
				{{
					(session.response && responseStatuses[session.response]) || "A ação está sendo resolvida."
				}}
			</p>
		</section>

		<template #footer>
			<p
				v-if="session.expiresAt"
				class="defender-prompt__countdown"
			>
				<time :datetime="session.expiresAt">{{ countdown }}</time>
				restantes
			</p>
			<p
				v-if="profileError"
				role="alert"
			>
				Não foi possível carregar o avatar e seu saldo.
			</p>
			<p
				v-else
				class="defender-prompt__balance"
			>
				Sua grana: {{ typeof money === "number" ? formatMoney(money) : "Carregando..." }}
			</p>
		</template>
	</BaseModal>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/defender-prompt";
</style>
