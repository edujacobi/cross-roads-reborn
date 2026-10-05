<script
	setup
	lang="ts"
>
import { useApolloClient } from "@vue/apollo-composable";
import { ArrowLeft } from "lucide-vue-next";
import { ref, watch } from "vue";
import UserActivityStatsCard from "~/components/UserDetail/UserActivityStatsCard.vue";
import UserAdminActions from "~/components/UserDetail/UserAdminActions.vue";
import UserGangCard from "~/components/UserDetail/UserGangCard.vue";
import UserHistoryCard from "~/components/UserDetail/UserHistoryCard.vue";
import UserInventoryCard from "~/components/UserDetail/UserInventoryCard.vue";
import UserInvestmentCard from "~/components/UserDetail/UserInvestmentCard.vue";
import UserMetadataCard from "~/components/UserDetail/UserMetadataCard.vue";
import UserProfileHeader from "~/components/UserDetail/UserProfileHeader.vue";
import UserSelfActionsCard from "~/components/UserDetail/UserSelfActionsCard.vue";
import UserStatusSummary from "~/components/UserDetail/UserStatusSummary.vue";
import BaseButton from "~/components/ui/BaseButton.vue";

definePageMeta({
	middleware: "auth",
});

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const { showToast } = useToast();
const { client } = useApolloClient();
const userId = computed(() => String(route.params.id));
const isOwnUser = computed(() => auth.user.value?.userId === userId.value);
const canViewPrivateDetails = computed(() => isOwnUser.value || auth.hasAdminAccess.value);
const profileState = ref<"loading" | "ready" | "not-found" | "error">("loading");

watch(userId, () => {
	profileState.value = "loading";
});

function setProfileState(state: typeof profileState.value) {
	profileState.value = state;
}

function showFeedback(type: "success" | "error", message: string) {
	showToast({ variant: type, text: message });
}

function refreshUserDetails() {
	return client.refetchQueries({
		include: [
			"GetUserProfile",
			"GetUserInventory",
			"GetUserInvestment",
			"GetUserGang",
			"GetUserActivityStats",
			"GetUserStatus",
			"GetUserMetadata",
			"GetUserSelfActions",
			"GetUserAdminActions",
		],
	});
}
</script>

<template>
	<main class="user-detail">
		<nav
			class="user-detail__nav-back"
			aria-label="Navegação do jogador"
		>
			<BaseButton
				variant="ghost"
				size="sm"
				@click="router.back()"
			>
				<ArrowLeft
					:size="16"
					aria-hidden="true"
				/>
				Voltar
			</BaseButton>
		</nav>

		<UserProfileHeader
			:user-id="userId"
			:show-special-coins="canViewPrivateDetails"
			@state="setProfileState"
		/>

		<div
			v-if="profileState === 'not-found'"
			class="user-detail__not-found"
		>
			<h1>Jogador não encontrado</h1>
			<p>O ID {{ userId }} não possui registro na base de dados do jogo.</p>
		</div>
		<div
			v-if="profileState === 'error'"
			class="user-detail__not-found"
			role="alert"
		>
			<p>Não foi possível carregar o perfil do jogador.</p>
		</div>

		<div
			v-show="profileState !== 'not-found' && profileState !== 'error'"
			class="user-detail__content"
		>
			<UserSelfActionsCard
				v-if="auth.user.value?.userId === userId"
				:user-id="userId"
				@feedback="showFeedback"
				@refresh="refreshUserDetails"
			/>
			<UserInventoryCard :user-id="userId" />
			<UserInvestmentCard
				:user-id="userId"
				:show-private-info="canViewPrivateDetails"
			/>
			<UserGangCard :user-id="userId" />

			<UserActivityStatsCard :user-id="userId" />
			<UserHistoryCard :user-id="userId" />

			<template v-if="auth.hasAdminAccess.value">
				<div class="user-detail__columns">
					<UserStatusSummary :user-id="userId" />
					<UserAdminActions
						:user-id="userId"
						:is-developer="auth.isDeveloper.value"
						:can-write="auth.canWrite.value"
						@feedback="showFeedback"
						@refresh="refreshUserDetails"
						@deleted="router.back()"
					/>
				</div>

				<UserMetadataCard :user-id="userId" />
			</template>
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
