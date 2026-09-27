<script
	setup
	lang="ts"
>
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import type { UserDetail } from "~/types/userDetail";

defineProps<{ user: UserDetail }>();
</script>

<template>
	<BaseCard
		title="Situação & Estados"
		class="user-status"
	>
		<div class="user-status__rows">
			<div class="user-status__row">
				<span class="user-status__label">Hospital</span>
				<BaseBadge
					v-if="user.isInHospital && user.hospitalTime"
					variant="danger"
				>
					<NuxtImg
						src="situations/hospital.png"
						width="18"
					/>
					Hospitalizado até {{ new Date(user.hospitalTime).toLocaleTimeString() }}
				</BaseBadge>
				<BaseBadge
					v-else
					variant="neutral"
					>Não</BaseBadge
				>
			</div>
			<div class="user-status__row">
				<span class="user-status__label">Prisão</span>
				<BaseBadge
					v-if="user.isInPrison && user.prisonTime"
					variant="danger"
				>
					<NuxtImg
						src="situations/prison.png"
						width="18"
					/>
					Preso até {{ new Date(user.prisonTime).toLocaleTimeString() }}
				</BaseBadge>
				<BaseBadge
					v-else
					variant="neutral"
					>Não</BaseBadge
				>
			</div>
			<div class="user-status__row">
				<span class="user-status__label">Trabalho</span>
				<BaseBadge
					v-if="user.isWorking"
					variant="success"
				>
					<NuxtImg
						src="situations/job.png"
						width="18"
					/>
					Trabalhando
				</BaseBadge>
				<BaseBadge
					v-else
					variant="neutral"
					>Não</BaseBadge
				>
			</div>
			<div class="user-status__row">
				<span class="user-status__label">Vasculho</span>
				<BaseBadge
					v-if="user.isScavenging"
					variant="success"
				>
					<NuxtImg
						src="situations/scavenge.png"
						width="18"
					/>
					Vasculhando
				</BaseBadge>
				<BaseBadge
					v-else
					variant="neutral"
					>Não</BaseBadge
				>
			</div>
			<div class="user-status__row">
				<span class="user-status__label">Procurado</span>
				<BaseBadge
					v-if="user.isWanted"
					variant="danger"
				>
					<NuxtImg
						src="situations/police.png"
						width="18"
					/>
					Procurado
				</BaseBadge>
				<BaseBadge
					v-else
					variant="neutral"
					>Não</BaseBadge
				>
			</div>
			<div class="user-status__row">
				<span class="user-status__label">Cassino</span>
				<BaseBadge
					v-if="user.isInCasino"
					variant="success"
				>
					<NuxtImg
						src="situations/casino.png"
						width="18"
					/>
					Apostando
				</BaseBadge>
				<BaseBadge
					v-else
					variant="neutral"
					>Não</BaseBadge
				>
			</div>
		</div>
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
		padding: 12px 0;
		font-size: 0.875rem;

		&:not(:last-child) {
			border-bottom: 1px solid $border-card;
		}
	}

	&__label {
		color: $text-secondary;
	}
}
</style>
