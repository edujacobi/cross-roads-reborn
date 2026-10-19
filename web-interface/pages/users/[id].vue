<script
	setup
	lang="ts"
>
import { useApolloClient, useMutation, useQuery } from "@vue/apollo-composable";
import { ArrowLeft } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import UserActivityStatsCard from "~/components/UserDetail/UserActivityStatsCard.vue";
import UserAdminActions from "~/components/UserDetail/UserAdminActions.vue";
import UserGangCard from "~/components/UserDetail/UserGangCard.vue";
import UserHistoryCard from "~/components/UserDetail/UserHistoryCard.vue";
import UserInventoryCard from "~/components/UserDetail/UserInventoryCard.vue";
import UserInvestmentCard from "~/components/UserDetail/UserInvestmentCard.vue";
import UserMetadataCard from "~/components/UserDetail/UserMetadataCard.vue";
import UserProfileFloatingActions from "~/components/UserDetail/UserProfileFloatingActions.vue";
import UserProfileHeader from "~/components/UserDetail/UserProfileHeader.vue";
import UserSelfActionsCard from "~/components/UserDetail/UserSelfActionsCard.vue";
import UserStatusSummary from "~/components/UserDetail/UserStatusSummary.vue";
import UserPicture from "~/components/UserPicture.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useFallbackUserImage } from "~/composables/useFallbackImage";
import {
	GetMyDecorationsDocument,
	GetUserProfileDocument,
	type GetUserProfileQuery,
	SetOwnDecorationDocument,
	UserDecorationType,
} from "~/graphql/generated";

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
const canViewPrivateInvestmentInfo = computed(() => isOwnUser.value || auth.isDeveloper.value);
const profileState = ref<"loading" | "ready" | "not-found" | "error">("loading");
const {
	result: profileResult,
	loading: profileLoading,
	error: profileError,
	refetch: refetchProfile,
} = useQuery(GetUserProfileDocument, () => ({ id: userId.value }), { fetchPolicy: "cache-and-network" });
const profile = computed<GetUserProfileQuery["user"]>(() => profileResult.value?.user ?? null);
const avatarUrl = computed(() => profile.value?.avatarUrl || useFallbackUserImage(userId.value));
const decorationDialogOpen = ref(false);
const activeDecorationTab = ref<"avatar" | "background">("avatar");
const {
	result: decorationsResult,
	loading: decorationsLoading,
	error: decorationsError,
} = useQuery(
	GetMyDecorationsDocument,
	{},
	{
		enabled: computed(() => decorationDialogOpen.value),
		fetchPolicy: "cache-and-network",
	},
);
const decorations = computed(() => decorationsResult.value?.myDecorations);
const { mutate: setOwnDecoration, loading: savingDecoration } = useMutation(SetOwnDecorationDocument);

watch(userId, () => {
	profileState.value = "loading";
});

function setProfileState(state: typeof profileState.value) {
	profileState.value = state;
}

function showFeedback(type: "success" | "error", message: string) {
	showToast({ variant: type, text: message });
}

function openDecorationDialog() {
	activeDecorationTab.value = "avatar";
	decorationDialogOpen.value = true;
}

function getErrorMessage(caughtError: unknown) {
	return caughtError instanceof Error ? caughtError.message : String(caughtError);
}

async function equipDecoration(type: UserDecorationType, decorationId: number) {
	try {
		const response = await setOwnDecoration({ type, decorationId });
		const result = response?.data?.setOwnDecoration;
		if (!result?.success) {
			showFeedback("error", result?.message ?? "Não foi possível atualizar a decoração.");
			return;
		}

		showFeedback("success", result.message);
		try {
			await refreshUserDetails();
		} catch (caughtError: unknown) {
			showFeedback(
				"error",
				`Decoração aplicada, mas não foi possível atualizar o perfil: ${getErrorMessage(caughtError)}`,
			);
		}
	} catch (caughtError: unknown) {
		showFeedback("error", getErrorMessage(caughtError));
	}
}

async function refreshUserDetails() {
	await Promise.all([
		auth.fetchUser(),
		client.refetchQueries({
			include: [
				"GetUserProfile",
				"GetUserInventory",
				"GetUserInvestment",
				"GetUserGang",
				"GetUserActivityStats",
				"GetUserMetadata",
				"GetUserSelfActions",
				"GetUserAdminActions",
			],
		}),
	]);
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
			:show-special-coins="canViewPrivateDetails"
			:can-edit-decorations="isOwnUser"
			:user="profile"
			:loading="profileLoading"
			:error="!!profileError"
			@state="setProfileState"
			@refresh="refetchProfile()"
			@edit-decorations="openDecorationDialog"
		/>

		<BaseModal
			v-model:open="decorationDialogOpen"
			title="Personalizar perfil"
			description="Escolha uma decoração que você possui. A prévia mostra como ficará no perfil."
		>
			<div class="user-detail__decoration-tabs">
				<button
					type="button"
					:aria-pressed="activeDecorationTab === 'avatar'"
					@click="activeDecorationTab = 'avatar'"
				>
					Avatar
				</button>
				<button
					type="button"
					:aria-pressed="activeDecorationTab === 'background'"
					@click="activeDecorationTab = 'background'"
				>
					Fundo
				</button>
			</div>
			<p
				v-if="decorationsLoading"
				class="user-detail__decoration-state"
				role="status"
			>
				Carregando decorações...
			</p>
			<p
				v-else-if="decorationsError"
				class="user-detail__decoration-state"
				role="alert"
			>
				Não foi possível carregar suas decorações: {{ decorationsError.message }}
			</p>
			<template v-else-if="activeDecorationTab === 'avatar'">
				<div class="user-detail__decoration-grid">
					<article
						v-for="decoration in decorations?.avatarDecorations ?? []"
						:key="decoration.id"
						class="user-detail__decoration-card"
					>
						<UserPicture
							:image-url="avatarUrl"
							:decoration="decoration.className"
							image-class="user-detail__decoration-preview"
							:alt="`Prévia do avatar com ${decoration.name}`"
							width="88"
							height="88"
						/>
						<h3>{{ decoration.name }}</h3>
						<BaseButton
							variant="secondary"
							size="sm"
							:disabled="savingDecoration || decoration.className === profile?.avatarDecoration"
							@click="equipDecoration(UserDecorationType.Avatar, decoration.id)"
						>
							{{ decoration.className === profile?.avatarDecoration ? "Em uso" : "Usar decoração" }}
						</BaseButton>
					</article>
				</div>
			</template>
			<template v-else>
				<div class="user-detail__decoration-grid">
					<article
						v-for="decoration in decorations?.backgroundDecorations ?? []"
						:key="decoration.id"
						class="user-detail__decoration-card user-detail__decoration-card--background profile-background"
						:class="`profile-background--${decoration.className}`"
					>
						<UserPicture
							:image-url="avatarUrl"
							:decoration="profile?.avatarDecoration"
							image-class="user-detail__decoration-preview"
							:alt="`Prévia do perfil com o fundo ${decoration.name}`"
							width="88"
							height="88"
						/>
						<h3>{{ decoration.name }}</h3>
						<BaseButton
							variant="secondary"
							size="sm"
							:disabled="savingDecoration || decoration.className === profile?.backgroundDecoration"
							@click="equipDecoration(UserDecorationType.Background, decoration.id)"
						>
							{{ decoration.className === profile?.backgroundDecoration ? "Em uso" : "Usar decoração" }}
						</BaseButton>
					</article>
				</div>
			</template>
		</BaseModal>

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
				:show-private-info="canViewPrivateInvestmentInfo"
			/>
			<UserGangCard :user-id="userId" />

			<UserActivityStatsCard :user-id="userId" />
			<UserHistoryCard :user-id="userId" />

			<template v-if="auth.hasAdminAccess.value">
				<div class="user-detail__columns">
					<UserStatusSummary
						:status="profile"
						:loading="profileLoading"
						:error="!!profileError"
						@refresh="refetchProfile()"
					/>
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

		<UserProfileFloatingActions
			v-if="!isOwnUser && profileState === 'ready'"
			:user-id="userId"
			@feedback="showFeedback"
			@refresh="refreshUserDetails"
		/>
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

		> * {
			animation: reveal-up 0.45s $motion-ease-out both;
		}

		@for $index from 1 through 6 {
			> *:nth-child(#{$index}) {
				animation-delay: #{$index * 35}ms;
			}
		}
	}

	&__columns {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: $spacing-md;

		@media (max-width: 850px) {
			grid-template-columns: 1fr;
		}
	}

	&__decoration-tabs {
		display: flex;
		gap: $spacing-sm;
		margin-bottom: $spacing-md;

		button {
			flex: 1;
			padding: $spacing-sm $spacing-md;
			border: 1px solid $border-card;
			border-radius: $radius-sm;
			background: $bg-card;
			color: $text-secondary;
			cursor: pointer;

			&[aria-pressed="true"] {
				border-color: $color-brand;
				color: $text-primary;
			}

			&:focus-visible {
				outline: 2px solid $color-brand;
				outline-offset: 2px;
			}
		}
	}

	&__decoration-state {
		padding: $spacing-md;
		color: $text-secondary;
		text-align: center;
	}

	&__decoration-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
		gap: $spacing-md;
	}

	&__decoration-card {
		display: flex;
		min-width: 0;
		flex-direction: column;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-md;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		text-align: center;

		h3 {
			font-size: $font-size-14;
			font-weight: $font-weight-semibold;
		}

		:deep(.user-detail__decoration-preview) {
			width: 5.5rem;
			height: 5.5rem;
		}

		> .base-button {
			width: 100%;
			margin-top: auto;
		}

		&--background {
			border: none;
		}
	}
}
</style>
