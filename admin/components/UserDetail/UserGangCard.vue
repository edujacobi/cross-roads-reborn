<script
	setup
	lang="ts"
>
import BaseCard from "~/components/ui/BaseCard.vue";
import type { UserDetail } from "~/types/userDetail";

defineProps<{ gang: NonNullable<UserDetail["gang"]> }>();
</script>

<template>
	<BaseCard
		title="Gangue"
		icon="situations/gang-action"
		class="user-gang"
		:style="{ '--user-gang-color': gang.color }"
	>
		<div class="user-gang__content">
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

	:deep(.card-header) {
		border-color: color-mix(in lab, $border-card 100%, var(--user-gang-color) 75%);
	}

	&__content {
		display: flex;
		gap: $spacing-md;
		align-items: center;
		font-weight: 600;
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
	}
}
</style>
