<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-vue-next";
import UserAdminActions from "~/components/UserDetail/UserAdminActions.vue";
import UserGangCard from "~/components/UserDetail/UserGangCard.vue";
import UserInventoryCard from "~/components/UserDetail/UserInventoryCard.vue";
import UserInvestmentCard from "~/components/UserDetail/UserInvestmentCard.vue";
import UserMetadataCard from "~/components/UserDetail/UserMetadataCard.vue";
import UserProfileHeader from "~/components/UserDetail/UserProfileHeader.vue";
import UserStatusSummary from "~/components/UserDetail/UserStatusSummary.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { GetUserDetailDocument } from "~/graphql/generated";

const route = useRoute();
const auth = useAuth();
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

const feedback = ref<{ type: "success" | "error"; message: string } | null>(null);

function showFeedback(type: "success" | "error", message: string) {
	feedback.value = { type, message };
	setTimeout(() => {
		feedback.value = null;
	}, 4000);
}
</script>

<template>
	<div class="user-detail">
		<div class="user-detail__nav-back">
			<NuxtLink to="/users">
				<BaseButton
					variant="ghost"
					size="sm"
				>
					<ArrowLeft :size="16" />
					Voltar para Lista
				</BaseButton>
			</NuxtLink>
		</div>

		<div
			v-if="feedback"
			:class="`user-detail__feedback user-detail__feedback--${feedback.type}`"
		>
			<CheckCircle2
				v-if="feedback.type === 'success'"
				:size="18"
			/>
			<AlertCircle
				v-else
				:size="18"
			/>
			{{ feedback.message }}
		</div>

		<div
			v-if="loading"
			class="user-detail__loading"
		>
			<p>Carregando perfil e inventário do jogador...</p>
		</div>

		<div
			v-else-if="!user"
			class="user-detail__not-found"
		>
			<h2>Jogador não encontrado</h2>
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

			<div class="user-detail__columns">
				<UserStatusSummary :user="user" />
				<UserAdminActions
					:user-id="userId"
					:is-developer="auth.isDeveloper.value"
					:is-in-hospital="user.isInHospital"
					:is-in-prison="user.isInPrison"
					@feedback="showFeedback"
					@refresh="refetch"
				/>
			</div>

			<UserMetadataCard
				:user="user"
				:language="language"
			/>
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.user-detail {
	display: flex;
	flex-direction: column;
	gap: 20px;

	&__nav-back {
		margin-bottom: 4px;
	}

	&__feedback {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-radius: $radius-sm;
		font-size: 0.875rem;

		&--success {
			background-color: rgba($color-success, 0.15);
			border: 1px solid rgba($color-success, 0.4);
			color: color.adjust($color-success, $lightness: 15%);
		}

		&--error {
			background-color: rgba($color-danger, 0.15);
			border: 1px solid rgba($color-danger, 0.4);
			color: color.adjust($color-danger, $lightness: 15%);
		}
	}

	&__loading,
	&__not-found {
		@include flex-center;
		flex-direction: column;
		gap: 12px;
		padding: 60px 20px;
		color: $text-secondary;
	}

	&__content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	&__columns {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: 20px;

		@media (max-width: 850px) {
			grid-template-columns: 1fr;
		}
	}
}
</style>
