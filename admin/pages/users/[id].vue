<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { ArrowLeft } from "lucide-vue-next";
import UserActivityStatsCard from "~/components/UserDetail/UserActivityStatsCard.vue";
import UserAdminActions from "~/components/UserDetail/UserAdminActions.vue";
import UserGangCard from "~/components/UserDetail/UserGangCard.vue";
import UserInventoryCard from "~/components/UserDetail/UserInventoryCard.vue";
import UserInvestmentCard from "~/components/UserDetail/UserInvestmentCard.vue";
import UserMetadataCard from "~/components/UserDetail/UserMetadataCard.vue";
import UserProfileHeader from "~/components/UserDetail/UserProfileHeader.vue";
import UserStatusSummary from "~/components/UserDetail/UserStatusSummary.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { GetUserDetailDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

const route = useRoute();
const auth = useAuth();
const { showToast } = useToast();
const userId = computed(() => String(route.params.id));

const { result, loading, refetch } = useQuery(GetUserDetailDocument, () => ({ id: userId.value }));
const user = computed(() => result.value?.user);

useHead({
	title: () => user.value?.nickname,
});

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

function showFeedback(type: "success" | "error", message: string) {
	showToast({ variant: type, text: message });
}
</script>

<template>
	<main class="user-detail">
		<nav
			class="user-detail__nav-back"
			aria-label="Navegação do jogador"
		>
			<BaseButton
				to="/users"
				variant="ghost"
				size="sm"
			>
				<ArrowLeft
					:size="16"
					aria-hidden="true"
				/>
				Voltar
			</BaseButton>
		</nav>

		<div
			v-if="loading"
			class="user-detail__loading"
			role="status"
		>
			<p>Carregando perfil e inventário do jogador...</p>
		</div>

		<div
			v-else-if="!user"
			class="user-detail__not-found"
		>
			<h1>Jogador não encontrado</h1>
			<p>O ID {{ userId }} não possui registro na base de dados do jogo.</p>
		</div>

		<div
			v-else
			class="user-detail__content"
		>
			<UserProfileHeader :user="user" />
			<UserInventoryCard :items="user.items" />
			<UserInvestmentCard
				v-if="user.investment"
				:investment="user.investment"
			/>
			<UserGangCard
				v-if="user.gang"
				:gang="user.gang"
			/>

			<UserActivityStatsCard :stats="user.activityStats" />

			<div class="user-detail__columns">
				<UserStatusSummary :user="user" />
				<UserAdminActions
					:user-id="userId"
					:is-developer="auth.isDeveloper.value"
					:can-write="auth.canWrite.value"
					:is-in-hospital="user.isInHospital"
					:is-in-prison="user.isInPrison"
					:badges="user.badges"
					@feedback="showFeedback"
					@refresh="refetch"
					@deleted="navigateTo('/users')"
				/>
			</div>

			<UserMetadataCard
				:user="user"
				:language="language"
			/>
		</div>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.user-detail {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;

	&__nav-back {
		margin-bottom: $spacing-xs;
	}

	&__loading,
	&__not-found {
		@include flex-center;
		flex-direction: column;
		gap: 12px;
		padding: 3.75rem 1.25rem;
		color: $text-secondary;
	}

	&__content {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	&__columns {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: $spacing-md;

		@media (max-width: 850px) {
			grid-template-columns: 1fr;
		}
	}
}
</style>
