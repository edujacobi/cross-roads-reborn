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
						variant="danger"
					>
						<NuxtImg
							:src="imagePaths.situations.hospital"
							width="18"
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
						>Não</BaseBadge
					>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Prisão</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isInPrison && user.prisonTime"
						variant="danger"
					>
						<NuxtImg
							:src="imagePaths.situations.prison"
							width="18"
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
						>Não</BaseBadge
					>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Trabalho</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isWorking"
						variant="success"
					>
						<NuxtImg
							:src="imagePaths.situations.job"
							width="18"
							alt=""
						/>
						Trabalhando
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
						>Não</BaseBadge
					>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Vasculho</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isScavenging"
						variant="success"
					>
						<NuxtImg
							:src="imagePaths.situations.scavenging"
							width="18"
							alt=""
						/>
						Vasculhando
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
						>Não</BaseBadge
					>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Procurado</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isWanted"
						variant="danger"
					>
						<NuxtImg
							:src="imagePaths.situations.wanted"
							width="18"
							alt=""
						/>
						Procurado
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
						>Não</BaseBadge
					>
				</dd>
			</div>
			<div class="user-status__row">
				<dt class="user-status__label">Cassino</dt>
				<dd class="user-status__value">
					<BaseBadge
						v-if="user.isInCasino"
						variant="success"
					>
						<NuxtImg
							:src="imagePaths.situations.casino"
							width="18"
							alt=""
						/>
						Apostando
					</BaseBadge>
					<BaseBadge
						v-else
						variant="neutral"
						>Não</BaseBadge
					>
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
