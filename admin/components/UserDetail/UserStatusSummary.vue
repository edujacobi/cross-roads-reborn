<script
	setup
	lang="ts"
>
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { UserDetail } from "~/types/userDetail";

defineProps<{ user: UserDetail }>();
</script>

<template>
	<BaseCard
		title="Situação e estados"
		class="user-status"
	>
		<dl class="user-status__rows">
			<div class="user-status__row">
				<dt class="user-status__label">Hospital</dt>
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
				<dt class="user-status__label">Prisão</dt>
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
				<dt class="user-status__label">Trabalho</dt>
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
				<dt class="user-status__label">Vasculho</dt>
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
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Roubo</dt>
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
				<dt class="user-status__label">Espancamento</dt>
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
						v-else
						variant="neutral"
					>
						Não
					</BaseBadge>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Procurado</dt>
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
				<dt class="user-status__label">Cassino</dt>
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
				<dt class="user-status__label">Defendendo investimento</dt>
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
				<dt class="user-status__label">Em ação de gangue</dt>
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
	&__rows {
		display: flex;
		flex-direction: column;
	}

	&__row {
		@include flex-between;
		padding: 0.75rem 0;
		font-size: 0.875rem;

		&:not(:last-child) {
			border-bottom: 1px solid $border-card;
		}
	}

	&__label {
		color: $text-secondary;
	}

	&__value {
		margin: 0;
	}
}
</style>
