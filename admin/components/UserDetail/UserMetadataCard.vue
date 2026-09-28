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
		<dl class="user-metadata__grid">
			<div class="user-metadata__item">
				<dt class="user-metadata__label">Idioma</dt>
				<dd class="user-metadata__value">{{ language }}</dd>
			</div>
			<div class="user-metadata__item">
				<dt class="user-metadata__label">Sequência diária</dt>
				<dd class="user-metadata__value">{{ user.dailyStreak }} dias</dd>
			</div>
			<div class="user-metadata__item">
				<dt class="user-metadata__label">Votos (Top.gg)</dt>
				<dd class="user-metadata__value">{{ user.voteCount }}</dd>
			</div>
			<div class="user-metadata__item">
				<dt class="user-metadata__label">Criado em</dt>
				<dd class="user-metadata__value">
					<time :datetime="user.createdAt">{{ format(user.createdAt, "dd/MM/yyyy hh:mm") }}</time>
				</dd>
			</div>
			<div class="user-metadata__item">
				<dt class="user-metadata__label">Última atualização</dt>
				<dd class="user-metadata__value">
					<time :datetime="user.updatedAt">{{ format(user.updatedAt, "dd/MM/yyyy hh:mm") }}</time>
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

.user-metadata {
	&__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: $spacing-md;
		padding-top: 1.25rem;
	}

	&__item {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: $spacing-xs;
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
		margin: 0;
	}
}
</style>
