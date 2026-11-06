<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed, ref } from "vue";
import AttackIcon from "~/components/icons/AttackIcon.vue";
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useDateFormat } from "~/composables/useDateFormat";
import { GetUserStatusDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Espancar",
});

const auth = useAuth();
const userId = computed(() => auth.user.value?.userId ?? "");
const { distance } = useDateFormat();

const resultWantedTime = ref<Date | null>(null);
const resultPrisonTime = ref<Date | null>(null);

const { result: statusResult } = useQuery(GetUserStatusDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});

const status = computed(() => statusResult.value?.user);

const wantedTime = computed(() => {
	const statusTime = status.value?.isWanted ? status.value.wantedTime : null;
	const end = statusTime ? new Date(statusTime) : resultWantedTime.value;
	if (!end) return null;
	return end > new Date() ? end : null;
});

const prisonTime = computed(() => {
	const statusTime = status.value?.isInPrison ? status.value.prisonTime : null;
	const end = statusTime ? new Date(statusTime) : resultPrisonTime.value;
	if (!end) return null;
	return end > new Date() ? end : null;
});

const actionUnavailableMessage = computed(() => {
	const userStatus = status.value;
	if (userStatus?.isScavenging) return "Você não pode espancar enquanto vasculha!";
	if (userStatus?.isWorking) return "Você não pode espancar enquanto trabalha!";
	if (userStatus?.isRobbing || userStatus?.isBeingRobbed) return "Você não pode espancar enquanto está em um roubo!";
	if (userStatus?.isBeating || userStatus?.isBeingBeated)
		return "Você não pode espancar enquanto já está em um espancamento!";
	return null;
});
</script>

<template>
	<main class="beatup-page">
		<PageTitle
			title="Espancar"
			subtitle="As vezes, alguns socos falam mais do que mil palavras"
		/>

		<BaseCard title="Derrote seu nêmesis e mostre quem é que manda!">
			<template #actions>
				<p v-if="prisonTime">Pronto para espancar outros presos!</p>
				<p v-else-if="wantedTime">
					Você está sendo procurado e poderá espancar novamente em
					<time :datetime="wantedTime.toISOString()">{{ distance(new Date(), wantedTime) }}</time>
				</p>
				<p v-else>
					{{ actionUnavailableMessage ?? "Pronto para espancar!" }}
				</p>
			</template>

			<p class="beatup-page__description">
				Quem perder a luta, ficará
				<NuxtLink
					to="/hospital"
					class="beatup-page__link beatup-page__link-hospital"
				>
					<HospitalIcon
						:size="16"
						variant="solid"
					/>
					hospitalizado
				</NuxtLink>
				por um tempo determinado pelo
				<AttackIcon
					:size="16"
					variant="solid"
				/>
				ATK do jogador defensor.
			</p>

			<p class="beatup-page__description">
				Para conseguir espancar, o alvo deve estar
				<NuxtImg
					src="/images/situations/idling.png"
					width="16"
				/>
				Vadiando.
			</p>

			<p class="beatup-page__muted">
				Caso você estiver
				<NuxtLink
					to="/prison"
					class="beatup-page__link beatup-page__link-prison"
				>
					<PrisonIcon
						:size="14"
						variant="solid"
					/>
					Preso
				</NuxtLink>
				, você também pode espancar outros presos.
			</p>
		</BaseCard>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.beatup-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__link {
		@include transition-color;
		color: $text-primary;

		&-hospital:hover {
			color: $color-hospital;
		}
		&-prison:hover {
			color: $color-prison;
		}

		svg {
			vertical-align: text-bottom;
		}
	}

	&__description {
		margin-bottom: $spacing-xs;
		font-size: $font-size-14;
		color: $text-secondary;
		line-height: 1.5;

		img {
			vertical-align: text-bottom;
		}
	}

	&__muted {
		margin-top: $spacing-md;
		font-size: $font-size-14;
		color: $text-muted;
		line-height: 1.5;
	}

	&__status {
		margin-top: $spacing-lg;
		line-height: 1.5;
	}
}
</style>
