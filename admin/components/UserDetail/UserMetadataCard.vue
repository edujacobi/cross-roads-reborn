<script
	setup
	lang="ts"
>
import { format } from "date-fns";
import BaseCard from "~/components/ui/BaseCard.vue";
import type { UserDetail } from "~/types/userDetail";

defineProps<{
	user: UserDetail;
	language: string | undefined;
}>();
</script>

<template>
	<BaseCard class="user-metadata">
		<div class="user-metadata__grid">
			<div class="user-metadata__item">
				<span class="user-metadata__label">Idioma</span>
				<span class="user-metadata__value">{{ language }}</span>
			</div>
			<div class="user-metadata__item">
				<span class="user-metadata__label">Sequência diária</span>
				<span class="user-metadata__value">{{ user.dailyStreak }} dias</span>
			</div>
			<div class="user-metadata__item">
				<span class="user-metadata__label">Votos (Top.gg)</span>
				<span class="user-metadata__value">{{ user.voteCount }}</span>
			</div>
			<div class="user-metadata__item">
				<span class="user-metadata__label">Criado em</span>
				<span class="user-metadata__value">{{ format(user.createdAt, "dd/MM/yyyy hh:mm") }}</span>
			</div>
			<div class="user-metadata__item">
				<span class="user-metadata__label">Última atualização</span>
				<span class="user-metadata__value">{{ format(user.updatedAt, "dd/MM/yyyy hh:mm") }}</span>
			</div>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.user-metadata {
	&__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 16px;
		padding-top: 20px;
	}

	&__item {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 4px;
	}

	&__label {
		font-size: 0.75rem;
		color: $text-muted;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	&__value {
		font-size: 0.9375rem;
		font-weight: 600;
		color: $text-primary;
		display: flex;
		align-items: center;
	}
}
</style>
