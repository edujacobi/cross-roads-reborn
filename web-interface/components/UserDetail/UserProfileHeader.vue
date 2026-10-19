<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed, watch } from "vue";
import SpecialShopIcon from "~/components/icons/SpecialShopIcon.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { useDateFormat } from "~/composables/useDateFormat";
import { useFallbackUserImage } from "~/composables/useFallbackImage";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { imagePaths } from "~/constants/imagePaths";
import { GetJobsDocument, GetScavengeLocationsDocument, type GetUserProfileQuery } from "~/graphql/generated";
import { BadgeId } from "../../../src/core/types/Ids";

const props = defineProps<{
	showSpecialCoins: boolean;
	user: GetUserProfileQuery["user"];
	loading: boolean;
	error: boolean;
}>();
const emit = defineEmits<{
	state: [state: "ready" | "not-found" | "error"];
	refresh: [];
}>();

const user = computed(() => props.user);
const loading = computed(() => props.loading);
const error = computed(() => props.error);
const status = computed(() => props.user);
const statusLoading = computed(() => props.loading);
const statusError = computed(() => props.error);
const { result: jobsResult } = useQuery(
	GetJobsDocument,
	{},
	{ enabled: computed(() => status.value?.isWorking ?? false) },
);
const currentJob = computed(() => jobsResult.value?.jobs.find((job) => job.id === status.value?.currentJobId));
const { result: scavengeLocationsResult } = useQuery(
	GetScavengeLocationsDocument,
	{},
	{ enabled: computed(() => status.value?.isScavenging ?? false) },
);
const currentScavengeLocation = computed(() =>
	scavengeLocationsResult.value?.scavengeLocations.find((location) => location.id === status.value?.scavengingId),
);

const activityTargetId = computed(() => {
	if (status.value?.isBeingBeated) return status.value.beatenByUserId;
	if (status.value?.isBeating) return status.value.beaterUserId;
	if (status.value?.isBeingRobbed) return status.value.robbedByUserId;
	if (status.value?.isRobbing) return status.value.robberUserId;
	return null;
});
const targetNickname = computed(() => status.value?.activityTargetNickname);

const { getClassImageUrl } = useClasses();
const { getSituationImageUrl } = useSituation();
const { formatMoney, formatPlain } = useMoneyFormat();
const { relative } = useDateFormat();

const situationAction = computed(() => {
	const currentStatus = status.value;
	if (!currentStatus) return "";
	if (currentStatus.isDead) return "Morto";
	if (currentStatus.isScavenging) return "Vasculhando";
	if (currentStatus.isInPrison && currentStatus.isInHospital) return "Preso e hospitalizado";
	if (currentStatus.isInHospital) return "Hospitalizado";
	if (currentStatus.isInPrison) return "Preso";
	if (currentStatus.isBeingBeated) return "Sendo espancado por";
	if (currentStatus.isBeating) return "Espancando";
	if (currentStatus.isDefendingInvestment) return "Defendendo investimento";
	if (currentStatus.isInGangAction) return "Em ação de gangue";
	if (currentStatus.isBeingRobbed) return "Sendo roubado por";
	if (currentStatus.isRobbing) return "Roubando";
	if (currentStatus.isWorking) return "Trabalhando como";
	if (currentStatus.isInCasino) return "Apostando no cassino";
	return "Vadiando";
});

const situationTimers = computed(() => {
	const currentStatus = status.value;
	if (!currentStatus) return [];

	const timers: { label: string; endsAt: string }[] = [];
	if (currentStatus.isDead && currentStatus.deadUntil) {
		timers.push({ label: "Morte", endsAt: currentStatus.deadUntil });
	} else {
		if (currentStatus.isInPrison && currentStatus.prisonTime) {
			timers.push({ label: "Prisão", endsAt: currentStatus.prisonTime });
		}
		if (currentStatus.isInHospital && currentStatus.hospitalTime) {
			timers.push({ label: "Hospital", endsAt: currentStatus.hospitalTime });
		}
		if (currentStatus.isWorking && currentStatus.jobEndsIn) {
			timers.push({ label: "Trabalho", endsAt: currentStatus.jobEndsIn });
		}
	}
	if (currentStatus.isWanted && currentStatus.wantedTime) {
		timers.push({ label: "Procurado", endsAt: currentStatus.wantedTime });
	}
	return timers;
});

watch(
	[loading, user, error],
	([isLoading, loadedUser, queryError]) => {
		if (isLoading) return;
		if (queryError) {
			emit("state", loadedUser ? "ready" : "error");
		} else {
			emit("state", loadedUser ? "ready" : "not-found");
		}
	},
	{ immediate: true },
);

useHead({
	title: () => user.value?.nickname,
});

function getBadgeImage(badgeId: BadgeId): string {
	// biome-ignore lint/suspicious/noDoubleEquals: GraphQl brings as number, not as BadgeId
	if (badgeId == BadgeId.VIP || badgeId == BadgeId.VIPEternal) {
		return imagePaths.badges.vip;
	}
	return `/images/badges/${BadgeId[badgeId]}.png`;
}
</script>

<template>
	<BaseCard
		v-if="user || loading"
		class="user-profile profile-background"
		:class="`profile-background--${user?.backgroundDecoration}`"
	>
		<template #actions>
			<RefreshButton
				@refresh="emit('refresh')"
				:loading="loading"
				aria-label="Atualizar perfil"
			/>
		</template>
		<div
			v-if="loading && !user"
			class="user-profile__loading"
			role="status"
			aria-label="Carregando perfil"
		>
			<BaseSkeleton
				width="6.25rem"
				height="6.25rem"
				circle
			/>
			<div class="user-profile__loading-details">
				<BaseSkeleton
					width="12rem"
					height="1.5rem"
				/>
				<BaseSkeleton width="7rem" />
				<BaseSkeleton
					width="9rem"
					height="2rem"
				/>
			</div>
		</div>
		<template v-else-if="user">
			<div class="user-profile__main-info">
				<div class="user-profile__avatar-wrapper">
					<UserPicture
						:image-url="user.avatarUrl || useFallbackUserImage(user.id)"
						:decoration="user.avatarDecoration"
						:alt="user.nickname ? `Avatar de ${user.nickname}` : 'Avatar do jogador'"
						width="100"
						height="100"
						lazy
					/>
					<span
						:class="`user-profile__presence user-profile__presence--${user.online ? 'online' : 'offline'}`"
						role="img"
						:aria-label="user.online ? 'Online' : 'Offline'"
					></span>
				</div>
				<div>
					<div class="user-profile__name-row">
						<h1 class="user-profile__name">{{ user.nickname || "(Sem Nick)" }}</h1>
					</div>
					<p class="user-profile__id"><code>ID: {{ user.id }}</code></p>
				</div>
				<div class="user-profile__economy">
					<p class="user-profile__money">{{ formatMoney(user.money) }}</p>
					<p
						v-if="props.showSpecialCoins && user.specialCoin !== null"
						class="user-profile__coins"
					>
						<SpecialShopIcon
							variant="normal"
							:size="18"
						/>
						{{ formatPlain(user.specialCoin) }} Moedas especiais
					</p>
				</div>
			</div>
			<ul class="user-profile__badges">
				<li
					v-for="badge in user.badges"
					:key="badge.id"
					:data-popover-text="badge.name"
					data-popover-direction="top"
				>
					<NuxtImg
						:src="getBadgeImage(badge.id as BadgeId)"
						:alt="badge.name"
						class="user-profile__badge"
						width="40"
						height="40"
					/>
				</li>
			</ul>

			<p class="user-profile__situation">
				<NuxtImg
					:src="getSituationImageUrl(user.situationId)"
					class="user-profile__situation-image"
					alt=""
					width="40"
					height="40"
				/>
				<template v-if="statusLoading && !status"> Carregando situação... </template>
				<span
					v-else-if="statusError && !status"
					role="alert"
				>
					Não foi possível carregar a situação.
				</span>
				<template v-else-if="status">
					<NuxtLink
						v-if="status.isDead"
						to="/cemetery"
					>
						{{ situationAction }}
					</NuxtLink>
					<span v-else>{{ situationAction }}</span>
					<NuxtLink
						v-if="status.isWorking"
						to="/jobs"
					>
						{{ currentJob?.name ?? "Trabalho" }}
					</NuxtLink>
					<span v-if="status.isScavenging && currentScavengeLocation">
						{{ currentScavengeLocation.name }}
					</span>
					<span v-if="status.isRobbing && status.robberyLocationId !== null">
						{{ status.robberyLocationName ?? "Local desconhecido" }}
					</span>
					<NuxtLink
						v-if="activityTargetId"
						:to="`/users/${activityTargetId}`"
					>
						{{ targetNickname ?? `Jogador ${activityTargetId}` }}
					</NuxtLink>
					<time
						v-for="timer in situationTimers"
						:key="timer.label"
						:datetime="timer.endsAt"
						class="user-profile__situation-timer"
					>
						{{ timer.label }}
						termina {{ relative(timer.endsAt, true) }}
					</time>
				</template>
			</p>

			<div class="user-profile__info">
				<div class="user-profile__class">
					<NuxtImg
						:src="getClassImageUrl(user.class)"
						class="user-profile__class-image"
						alt=""
						width="32"
						height="32"
					/>
					{{ user.className }}
				</div>

				<div class="user-profile__attributes">
					<span class="user-profile__attribute">
						<NuxtImg
							:src="imagePaths.attributes.attack"
							class="user-profile__attribute-image"
							alt=""
							width="24"
							height="24"
						/>
						{{ user.attack || 0 }}
						ATK
					</span>
					<span class="user-profile__attribute">
						<NuxtImg
							:src="imagePaths.attributes.defense"
							class="user-profile__attribute-image"
							alt=""
							width="24"
							height="24"
						/>
						{{ user.defense || 0 }}
						DEF
					</span>
				</div>
			</div>
		</template>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.user-profile {
	&:not(.profile-background--default) {
		border: none;
	}

	&__loading {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		min-height: 9rem;
	}

	&__loading-details {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: $spacing-sm;
	}

	&__main-info {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		padding-bottom: 1.25rem;

		// ponytail: stack profile and align economy nicely on mobile
		@media (max-width: 640px) {
			flex-direction: column;
			align-items: flex-start;
			gap: $spacing-sm;
		}
	}

	&__avatar-wrapper {
		position: relative;
	}

	&__presence {
		width: 1.5rem;
		aspect-ratio: 1;
		border-radius: $radius-full;
		position: absolute;
		bottom: 0;
		left: 0;
		border: 3px solid $bg-card;

		&--online {
			background: #00b784;
		}

		&--offline {
			background: #80848e;
		}
	}

	&__name-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	&__name {
		font-size: $font-size-24;
		font-weight: $font-weight-extrabold;
		color: $text-primary;
	}

	&__id {
		font-size: $font-size-12;
		color: $text-muted;
		margin-top: 0.125rem;

		code {
			color: $text-secondary;
		}
	}

	&__economy {
		margin-left: auto;
		display: flex;
		flex-direction: column;
		align-items: end;

		// ponytail: left-align economy numbers on mobile
		@media (max-width: 640px) {
			margin-left: 0;
			align-items: flex-start;
		}
	}

	&__money {
		font-size: 2rem;
		font-weight: $font-weight-bold;
		text-align: end;

		@media (max-width: 640px) {
			font-size: $font-size-24;
		}
	}

	&__coins {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		font-size: 0.8rem;
		font-weight: $font-weight-semibold;
		@include text-special;
	}

	&__badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $spacing-sm;
		margin-bottom: $spacing-md;
		list-style: none;
		padding-left: 0;

		&:after {
			content: "";
			display: block;
			height: 1px;
			width: 100%;
			background: var(--profile-border-gradient, $border-subtle);
		}
	}

	&__badge {
		width: 2rem;
		object-fit: contain;
	}

	&__situation {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		font-size: 1.2rem;
		font-weight: $font-weight-semibold;
		gap: 6px;
		margin: $spacing-sm 0;
	}

	&__situation-image {
		width: 2.5rem;
	}

	&__situation-timer {
		color: $text-secondary;
		font-size: $font-size-14;
		font-weight: $font-weight-normal;
	}

	&__info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: $spacing-md;
		padding-top: 1.25rem;
	}

	&__class {
		display: flex;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		align-items: center;
	}

	&__class-image {
		width: 2rem;
		border-radius: $radius-full;
		background-color: color-mix(in srgb, $bg-input 50%, transparent);
		margin-right: $spacing-sm;
	}

	&__attributes {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		margin-left: auto;

		// ponytail: align attributes on smaller screens
		@media (max-width: 640px) {
			margin-left: 0;
		}
	}

	&__attribute-image {
		width: 1.5rem;
	}

	&__attribute {
		display: flex;
		align-items: center;
		font-size: $font-size-14;
		font-weight: $font-weight-semibold;
		color: $color-attribute;
	}
}
</style>
