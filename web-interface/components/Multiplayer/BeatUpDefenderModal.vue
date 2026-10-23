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
const formatMinutes = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const responseDescriptions = computed<Record<string, string>>(() => {
	const details = props.session.duelDetails;
	const extraMinutes = details ? `${formatMinutes(details.hospitalMinutesDelta)} minutos` : "tempo";
	return {
		fight: `+5 ATK, mas quem apanhar ficará mais ${extraMinutes} hospitalizado.`,
		run: `-5 ATK, mas quem apanhar ficará menos ${extraMinutes} hospitalizado.`,
		nothing: "Nenhum efeito adicional.",
	};
});

const emit = defineEmits<{
	respond: [response: string];
	"update:open": [open: boolean];
}>();

const responseLabels: Record<string, { text: string; image?: string }> = {
	fight: {
		text: "Lutar",
	},
	run: {
		text: "Correr",
	},
	nothing: {
		text: "Não fazer nada",
	},
};
</script>

<template>
	<BaseModal
		:open="true"
		:dismissible="dismissible"
		title="Espancamento em andamento"
		@update:open="emit('update:open', $event)"
		icon="/images/situations/beatup.png"
	>
		<section
			class="defender-prompt"
			:aria-labelledby="`defender-attackers-${session.id}`"
		>
			<div>
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
						está tentando espancar você utilizando
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
			</div>
		</section>

		<section class="defender-prompt__actions-wrapper">
			<p>Decida o que fazer:</p>
			<fieldset
				v-if="session.phase === 'awaitingDefender' && session.response === null"
				class="defender-prompt__actions"
				aria-label="Ações para Espancamento em andamento"
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
				{{
					session.response ? "Sua resposta foi registrada. Aguarde o resultado." : "A ação está sendo resolvida."
				}}
			</p>
		</section>

		<template #footer>
			<p
				v-if="profileError"
				role="alert"
			>
				Não foi possível carregar o avatar.
			</p>
			<p
				v-if="session.expiresAt"
				class="defender-prompt__countdown"
			>
				<time :datetime="session.expiresAt">{{ countdown }}</time>
				restantes
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
