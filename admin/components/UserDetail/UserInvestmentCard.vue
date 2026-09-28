<script
	setup
	lang="ts"
>
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import BaseCard from "~/components/ui/BaseCard.vue";
import { useInvestment } from "~/composables/useInvestment";
import { imagePaths } from "~/constants/imagePaths";
import type { UserDetail } from "~/types/userDetail";

defineProps<{ investment: NonNullable<UserDetail["investment"]> }>();

const { getInvestmentImageUrl } = useInvestment();
</script>

<template>
	<BaseCard
		title="Investimento"
		:icon="imagePaths.situations.defendingInvestment"
		class="user-investment"
	>
		<div class="user-investment__content">
			<div class="user-investment__details">
				<NuxtImg
					class="user-investment__image"
					:src="getInvestmentImageUrl(investment.id)"
					alt=""
				/>
				<div class="user-investment__data">
					<p class="user-investment__name">{{ investment.name }}</p>
					<p class="user-investment__profit">Lucro acumulado: {{ investment.nextPaymentValue }}</p>
					<time
						class="user-investment__expiry"
						:datetime="investment.expiresAt"
					>
						{{ formatDistance(investment.expiresAt, new Date(), { locale: ptBR }) }}
					</time>
					<p
						v-if="investment.henchmanEndsAt"
						class="user-investment__henchman"
					>
						<NuxtImg
							class="user-investment__henchman-image"
							:src="imagePaths.classes.mafioso"
							alt=""
						/>
						Capanga: contrato encerra em
						<time :datetime="investment.henchmanEndsAt">
							{{ formatDistance(investment.henchmanEndsAt, new Date(), { locale: ptBR }) }}
						</time>
					</p>
				</div>
			</div>
			<p class="user-investment__defense">
				<NuxtImg
					class="user-investment__defense-image"
					:src="imagePaths.attributes.defense"
					alt=""
				/>
				{{ investment.defense }} DEF
			</p>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.user-investment {
	&__content {
		display: flex;
		gap: $spacing-sm;
		align-items: center;
		justify-content: space-between;
	}

	&__details {
		display: flex;
		gap: $spacing-md;
		align-items: center;
		font-weight: 600;
	}

	&__image {
		border-radius: 1rem;
		width: 5rem;
	}

	&__profit {
		font-size: 0.85rem;
	}

	&__expiry {
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-secondary;
	}

	&__henchman {
		color: $text-secondary;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		margin-top: $spacing-sm;
	}

	&__henchman-image {
		background: $border-card;
		border-radius: $radius-full;
		width: 1.25rem;
	}

	&__defense {
		display: flex;
		align-items: center;
		color: $color-attribute;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	&__defense-image {
		width: 1.5rem;
	}
}
</style>
