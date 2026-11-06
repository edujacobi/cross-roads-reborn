<script
	setup
	lang="ts"
>
import { computed } from "vue";
import BeatUpIcon from "~/components/icons/BeatUpIcon.vue";
import CasinoIcon from "~/components/icons/CasinoIcon.vue";
import GangIcon from "~/components/icons/GangIcon.vue";
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
import InvestmentIcon from "~/components/icons/InvestmentIcon.vue";
import JobsIcon from "~/components/icons/JobsIcon.vue";
import PoliceIcon from "~/components/icons/PoliceIcon.vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import RobberyIcon from "~/components/icons/RobberyIcon.vue";
import ScavengeIcon from "~/components/icons/ScavengeIcon.vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { GetUserProfileQuery } from "~/graphql/generated";

const props = defineProps<{
	status: GetUserProfileQuery["user"];
	loading: boolean;
	error: boolean;
}>();
const emit = defineEmits<{ refresh: [] }>();

const user = computed(() => props.status);
const loading = computed(() => props.loading);
const error = computed(() => props.error);
</script>

<template>
	<BaseCard
		v-if="user || loading || error"
		title="Situação e estados"
		class="user-status"
	>
		<template #actions>
			<RefreshButton
				@refresh="emit('refresh')"
				:loading="loading"
				aria-label="Atualizar situação e estados"
			/>
		</template>
		<div
			v-if="loading && !user"
			class="user-status__skeleton"
			role="status"
			aria-label="Carregando situação e estados"
		>
			<BaseSkeleton
				v-for="index in 7"
				:key="index"
				height="2rem"
			/>
		</div>
		<p
			v-else-if="error && !user"
			role="alert"
		>
			Não foi possível carregar a situação e os estados.
		</p>
		<dl
			v-else-if="user"
			class="user-status__rows"
		>
			<div class="user-status__row">
				<dt class="user-status__label">
					<HospitalIcon
						:size="16"
						variant="solid"
					/>
					Hospital
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isInHospital && user.hospitalTime"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.hospital"
							width="18"
							height="18"
							alt=""
						/>
						Hospitalizado até
						<time :datetime="user.hospitalTime">
							{{ new Date(user.hospitalTime).toLocaleTimeString() }}
						</time>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<PrisonIcon
						:size="16"
						variant="solid"
					/>
					Prisão
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isInPrison && user.prisonTime"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.prison"
							width="18"
							height="18"
							alt=""
						/>
						Preso até
						<time :datetime="user.prisonTime">
							{{ new Date(user.prisonTime).toLocaleTimeString() }}
						</time>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<JobsIcon
						:size="16"
						variant="solid"
					/>
					Trabalho
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isWorking && user.jobEndsIn"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.job"
							width="18"
							height="18"
							alt=""
						/>
						Trabalhando até
						<time :datetime="user.jobEndsIn">
							{{ new Date(user.jobEndsIn).toLocaleTimeString() }}
						</time>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<ScavengeIcon
						:size="16"
						variant="solid"
					/>
					Vasculho
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isScavenging"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.scavenging"
							width="18"
							height="18"
							alt=""
						/>
						Vasculhando
					</BaseBadge>
					<BaseBadge
						v-else-if="user.scavengeTime"
						variant="warning"
					>
						<NuxtImg
							:src="imagePaths.situations.scavenging"
							width="18"
							height="18"
							alt=""
						/>
						Aguardando cooldown até
						<time :datetime="user.scavengeTime">
							{{ new Date(user.scavengeTime).toLocaleTimeString() }}
						</time>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<RobberyIcon
						:size="16"
						variant="solid"
					/>
					Roubo
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isRobbing || user.isBeingRobbed"
						variant="helper"
					>
						<template v-if="user.isRobbing">
							<NuxtImg
								:src="imagePaths.situations.robbery"
								width="18"
								height="18"
								alt=""
							/>
							Roubando
						</template>
						<template v-if="user.isBeingRobbed">
							<NuxtImg
								:src="imagePaths.situations.robbery"
								width="18"
								height="18"
								alt=""
							/>
							Sendo roubado
						</template>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<BeatUpIcon
						:size="16"
						variant="solid"
					/>
					Espancamento
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isBeating || user.isBeingBeated"
						variant="helper"
					>
						<template v-if="user.isBeating">
							<NuxtImg
								:src="imagePaths.situations.beatup"
								width="18"
								height="18"
								alt=""
							/>
							Espancando
						</template>
						<template v-if="user.isBeingBeated">
							<NuxtImg
								:src="imagePaths.situations.beatup"
								width="18"
								height="18"
								alt=""
							/>
							Sendo espancado
						</template>
					</BaseBadge>
					<BaseBadge
						v-else-if="user.beatUpTime"
						variant="warning"
					>
						<NuxtImg
							:src="imagePaths.situations.beatup"
							width="18"
							height="18"
							alt=""
						/>
						Aguardando cooldown até
						<time :datetime="user.beatUpTime">
							{{ new Date(user.beatUpTime).toLocaleTimeString() }}
						</time>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<PoliceIcon
						:size="16"
						variant="solid"
					/>
					Procurado
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isWanted && user.wantedTime"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.wanted"
							width="18"
							height="18"
							alt=""
						/>
						Procurado até
						<time :datetime="user.wantedTime">
							{{ new Date(user.wantedTime).toLocaleTimeString() }}
						</time>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<CasinoIcon
						:size="16"
						variant="solid"
					/>
					Cassino
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isInCasino"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.casino"
							width="18"
							height="18"
							alt=""
						/>
						Apostando
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<InvestmentIcon
						:size="16"
						variant="solid"
					/>
					Defendendo investimento
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isDefendingInvestment"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.defendingInvestment"
							width="18"
							height="18"
							alt=""
						/>
						Defendendo
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">
					<GangIcon
						:size="16"
						variant="solid"
					/>
					Em ação de gangue
				</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isInGangAction"
						variant="helper"
					>
						<NuxtImg
							:src="imagePaths.situations.gangAction"
							width="18"
							height="18"
							alt=""
						/>
						Agindo
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Morto</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isDead && user.deadUntil"
						variant="danger"
					>
						<NuxtImg
							:src="imagePaths.situations.dead"
							width="18"
							height="18"
							alt=""
						/>
						Morto até
						<time :datetime="user.deadUntil">
							{{ new Date(user.deadUntil).toLocaleTimeString() }}
						</time>
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
		</dl>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.user-status {
	&__skeleton {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	&__rows {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $spacing-xs;

		@container page (max-width: 850px) {
			grid-template-columns: repeat(3, 1fr);
		}

		@container page (max-width: 600px) {
			grid-template-columns: repeat(2, 1fr);
		}

		@container page (max-width: 450px) {
			grid-template-columns: 1fr;
		}
	}

	&__row {
		border: 1px solid $border-subtle;
		padding: $spacing-sm;
		border-radius: $radius-sm;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		font-size: $font-size-14;
		background-color: $bg-medium;

		@container page (max-width: 450px) {
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: space-between;
		}
	}

	&__label {
		color: $text-secondary;

		svg {
			vertical-align: sub;
		}
	}

	&__value {
		margin: 0;
	}
}
</style>
