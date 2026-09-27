<script
	setup
	lang="ts"
>
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import BaseCard from "~/components/ui/BaseCard.vue";
import { useInvestment } from "~/composables/useInvestment";
import type { UserDetail } from "~/types/userDetail";

defineProps<{ investment: NonNullable<UserDetail["investment"]> }>();

const { getInvestmentImageUrl } = useInvestment();
</script>

<template>
	<BaseCard
		title="Investimento"
		icon="situations/defending-investment"
		class="user-investment"
	>
		<div class="user-investment__content">
			<div class="user-investment__details">
				<NuxtImg
					class="user-investment__image"
					:src="getInvestmentImageUrl(investment.id)"
				/>
				<div class="user-investment__data">
					<p class="user-investment__name">{{ investment.name }}</p>
					<p class="user-investment__profit">Lucro acumulado: {{ investment.nextPaymentValue }}</p>
					<p class="user-investment__expiry">
						{{ formatDistance(investment.expiresAt, new Date(), { locale: ptBR }) }}
					</p>
					<p
						v-if="investment.henchmanEndsAt"
						class="user-investment__henchman"
					>
						<NuxtImg
							class="user-investment__henchman-image"
							src="classes/5_Mafioso.png"
						/>
						Capanga: contrato encerra em
						{{ formatDistance(investment.henchmanEndsAt, new Date(), { locale: ptBR }) }}
					</p>
				</div>
			</div>
			<p class="user-investment__defense">
				<NuxtImg
					class="user-investment__defense-image"
					src="attributes/defense.png"
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
		gap: 0.5rem;
		align-items: center;
		justify-content: space-between;
	}

	&__details {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-weight: 600;
	}

	&__image {
		border-radius: 1rem;
		width: 80px;
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
		gap: 0.25rem;
		margin-top: 0.5rem;
	}

	&__henchman-image {
		background: $border-card;
		border-radius: $radius-full;
		width: 20px;
	}

	&__defense {
		display: flex;
		align-items: center;
		color: $color-attribute;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	&__defense-image {
		width: 24px;
	}
}
</style>
