<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { imagePaths } from "~/constants/imagePaths";
import { GetUserGangDocument } from "~/graphql/generated";

const props = defineProps<{ userId: string }>();

const { result, loading, error, refetch } = useQuery(GetUserGangDocument, () => ({ id: props.userId }), {
	fetchPolicy: "cache-and-network",
});
const gang = computed(() => result.value?.user?.gang);
</script>

<template>
	<BaseCard
		v-if="gang || loading || error"
		title="Gangue"
		:icon="imagePaths.situations.gangAction"
		class="user-gang"
		:style="gang ? { '--user-gang-color': gang.color } : undefined"
	>
		<template #actions>
			<RefreshButton
				@refresh="() => refetch()"
				:loading="loading"
				aria-label="Atualizar gangue"
			/>
		</template>
		<div
			v-if="loading && !gang"
			class="user-gang__skeleton"
			role="status"
			aria-label="Carregando gangue"
		>
			<BaseSkeleton
				width="5rem"
				height="5rem"
			/>
			<BaseSkeleton width="12rem" />
			<BaseSkeleton width="5rem" />
		</div>
		<p
			v-else-if="error && !gang"
			role="alert"
		>
			Não foi possível carregar a gangue.
		</p>
		<div
			v-else-if="gang"
			class="user-gang__content"
		>
			<NuxtImg
				class="user-gang__image"
				:src="gang.imageUrl || 'https://i.imgur.com/xOUjOlZ.png'"
				:alt="`Imagem da gangue ${gang.name}`"
			/>
			<p class="user-gang__role">{{ gang.role }} de <span class="user-gang__name">{{ gang.name }}</span></p>
			<p class="user-gang__level">Nível {{ gang.level }}</p>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.user-gang {
	border-color: color-mix(in lab, $border-card 100%, var(--user-gang-color) 75%);
	background-color: color-mix(in lab, $bg-card 100%, var(--user-gang-color) 15%);

	&__skeleton {
		display: flex;
		align-items: center;
		gap: $spacing-md;
	}

	:deep(.card-header) {
		border-color: color-mix(in lab, $border-card 100%, var(--user-gang-color) 75%) !important;
	}

	&__content {
		display: flex;
		gap: $spacing-md;
		align-items: center;
		font-weight: 600;

		// ponytail: wrap content on narrow mobile
		@media (max-width: 480px) {
			flex-wrap: wrap;
		}
	}

	&__image {
		border-radius: 1rem;
		aspect-ratio: 1;
		object-fit: cover;
		width: 5rem;
	}

	&__name {
		color: var(--user-gang-color);
	}

	&__level {
		color: $text-secondary;
		margin-left: auto;

		// ponytail: reset margin on narrow mobile
		@media (max-width: 480px) {
			margin-left: 0;
			width: 100%;
		}
	}
}
</style>
