<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { format } from "date-fns";
import { computed } from "vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { GetUserMetadataDocument } from "~/graphql/generated";

const props = defineProps<{ userId: string }>();

const { result, loading, error, refetch } = useQuery(GetUserMetadataDocument, () => ({ id: props.userId }), {
	fetchPolicy: "cache-and-network",
});
const user = computed(() => result.value?.user);
const language = computed(() => {
	switch (user.value?.language) {
		case "0":
			return "Inglês";
		case "1":
			return "Português";
		case "2":
			return "Espanhol";
		default:
			return user.value?.language;
	}
});
</script>

<template>
	<BaseCard
		v-if="user || loading || error"
		class="user-metadata"
		title="Dados do usuário"
	>
		<template #actions>
			<RefreshButton
				@refresh="() => refetch()"
				:loading="loading"
				aria-label="Atualizar dados do usuário"
			/>
		</template>
		<div
			v-if="loading && !user"
			class="user-metadata__skeleton"
			role="status"
			aria-label="Carregando dados do usuário"
		>
			<BaseSkeleton
				v-for="index in 4"
				:key="index"
				height="3rem"
			/>
		</div>
		<p
			v-else-if="error && !user"
			role="alert"
		>
			Não foi possível carregar os dados do usuário.
		</p>
		<dl
			v-else-if="user"
			class="user-metadata__grid"
		>
			<div class="user-metadata__item">
				<dt class="user-metadata__label">Idioma</dt>
				<dd class="user-metadata__value">{{ language }}</dd>
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
	&__skeleton {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: $spacing-md;
		padding-top: 1.25rem;
	}

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
