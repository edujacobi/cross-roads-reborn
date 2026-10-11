<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { computed } from "vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { useInvestment } from "~/composables/useInvestment";
import { imagePaths } from "~/constants/imagePaths";
import { GetUserInvestmentDocument } from "~/graphql/generated";

const props = defineProps<{ userId: string; showPrivateInfo: boolean }>();

const { result, loading, error, refetch } = useQuery(GetUserInvestmentDocument, () => ({ id: props.userId }), {
	fetchPolicy: "cache-and-network",
});
const investment = computed(() => result.value?.user?.investment);
const { getInvestmentImageUrl } = useInvestment();
</script>

<template>
	<BaseCard
		v-if="investment || loading || error"
		title="Investimento"
		:icon="imagePaths.situations.defendingInvestment"
		class="user-investment"
	>
		<template #actions>
			<RefreshButton
				@refresh="() => refetch()"
				:loading="loading"
				aria-label="Atualizar investimento"
			/>
		</template>
		<div
			v-if="loading && !investment"
			class="user-investment__skeleton"
			role="status"
			aria-label="Carregando investimento"
		>
			<BaseSkeleton
				width="5rem"
				height="5rem"
			/>
			<div class="user-investment__skeleton-details">
				<BaseSkeleton
					width="12rem"
					height="1.25rem"
				/>
				<BaseSkeleton width="9rem" />
				<BaseSkeleton width="7rem" />
			</div>
		</div>
		<p
			v-else-if="error && !investment"
			role="alert"
		>
			Não foi possível carregar o investimento.
		</p>
		<div
			v-else-if="investment"
			class="user-investment__content"
		>
			<div class="user-investment__details">
				<NuxtImg
					class="user-investment__image"
					:src="getInvestmentImageUrl(investment.id)"
					alt=""
				/>
				<div class="user-investment__data">
					<p class="user-investment__name">{{ investment.name }}</p>
					<p
						v-if="showPrivateInfo && investment.nextPaymentValue !== null"
						class="user-investment__profit"
					>
						Lucro acumulado: {{ investment.nextPaymentValue }}
					</p>
					<time
						class="user-investment__expiry"
						:datetime="investment.expiresAt"
					>
						{{ formatDistance(investment.expiresAt, new Date(), { locale: ptBR }) }}
					</time>
					<p
						v-if="showPrivateInfo && investment.henchmanEndsAt"
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
	&__skeleton {
		display: flex;
		align-items: center;
		gap: $spacing-md;
	}

	&__skeleton-details {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: $spacing-sm;
	}

	&__content {
		display: flex;
		gap: $spacing-sm;
		align-items: center;
		justify-content: space-between;

		// ponytail: stack investment info on mobile
		@media (max-width: 640px) {
			flex-direction: column;
			align-items: flex-start;
			gap: $spacing-md;
		}
	}

	&__details {
		display: flex;
		gap: $spacing-md;
		align-items: center;
		font-weight: 600;

		// ponytail: stack image and text on narrow mobile
		@media (max-width: 480px) {
			flex-direction: column;
			align-items: flex-start;
		}
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
