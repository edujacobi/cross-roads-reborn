<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import { useDateFormat } from "~/composables/useDateFormat";
import { useSituation } from "~/composables/useSituation";
import { GetJobsDocument, type GetMePageQuery, GetScavengeLocationsDocument } from "~/graphql/generated";

const props = defineProps<{
	user: NonNullable<GetMePageQuery["user"]>;
}>();
const user = computed(() => props.user);
const { result: jobsResult } = useQuery(GetJobsDocument, {}, { enabled: computed(() => user.value.isWorking) });
const currentJob = computed(() => jobsResult.value?.jobs.find((job) => job.id === user.value.currentJobId));
const { result: scavengeLocationsResult } = useQuery(
	GetScavengeLocationsDocument,
	{},
	{ enabled: computed(() => user.value.isScavenging) },
);
const currentScavengeLocation = computed(() =>
	scavengeLocationsResult.value?.scavengeLocations.find((location) => location.id === user.value.scavengingId),
);
const activityTargetId = computed(() => {
	if (user.value.isBeingBeated) return user.value.beatenByUserId;
	if (user.value.isBeating) return user.value.beaterUserId;
	if (user.value.isBeingRobbed) return user.value.robbedByUserId;
	if (user.value.isRobbing) return user.value.robberUserId;
	return null;
});
const situationAction = computed(() => {
	if (user.value.isDead) return "Morto";
	if (user.value.isScavenging) return "Vasculhando";
	if (user.value.isInPrison && user.value.isInHospital) return "Preso e hospitalizado";
	if (user.value.isInHospital) return "Hospitalizado";
	if (user.value.isInPrison) return "Preso";
	if (user.value.isBeingBeated) return "Sendo espancado por";
	if (user.value.isBeating) return "Espancando";
	if (user.value.isDefendingInvestment) return "Defendendo investimento";
	if (user.value.isInGangAction) return "Em ação de gangue";
	if (user.value.isBeingRobbed) return "Sendo roubado por";
	if (user.value.isRobbing) return "Roubando";
	if (user.value.isWorking) return "Trabalhando como";
	if (user.value.isInCasino) return "Apostando no cassino";
	return "Vadiando";
});
const situationTimers = computed(() => {
	const timers: { label: string; endsAt: string }[] = [];
	if (user.value.isDead && user.value.deadUntil) {
		timers.push({ label: "Morte", endsAt: user.value.deadUntil });
	} else {
		if (user.value.isInPrison && user.value.prisonTime) {
			timers.push({ label: "Prisão", endsAt: user.value.prisonTime });
		}
		if (user.value.isInHospital && user.value.hospitalTime) {
			timers.push({ label: "Hospital", endsAt: user.value.hospitalTime });
		}
		if (user.value.isWorking && user.value.jobEndsIn) {
			timers.push({ label: "Trabalho", endsAt: user.value.jobEndsIn });
		}
	}
	if (user.value.isWanted && user.value.wantedTime) {
		timers.push({ label: "Procurado", endsAt: user.value.wantedTime });
	}
	return timers;
});
const { getSituationImageUrl } = useSituation();
const { relative } = useDateFormat();
</script>

<template>
	<p class="user-situation">
		<NuxtImg
			:src="getSituationImageUrl(user.situationId)"
			class="user-situation__image"
			alt=""
			width="40"
			height="40"
		/>
		<NuxtLink
			v-if="user.isDead"
			to="/cemetery"
		>
			{{ situationAction }}
		</NuxtLink>
		<span v-else>{{ situationAction }}</span>
		<NuxtLink
			v-if="user.isWorking"
			to="/jobs"
		>
			{{ currentJob?.name ?? "Trabalho" }}
		</NuxtLink>
		<span v-if="user.isScavenging && currentScavengeLocation">
			{{ currentScavengeLocation.name }}
		</span>
		<span v-if="user.isRobbing && user.robberyLocationId !== null">
			{{ user.robberyLocationName ?? "Local desconhecido" }}
		</span>
		<NuxtLink
			v-if="activityTargetId"
			:to="`/users/${activityTargetId}`"
		>
			{{ user.activityTargetNickname ?? `Jogador ${activityTargetId}` }}
		</NuxtLink>
		<time
			v-for="timer in situationTimers"
			:key="timer.label"
			:datetime="timer.endsAt"
			class="user-situation__timer"
		>
			{{ timer.label }}
			termina {{ relative(timer.endsAt, true) }}
		</time>
	</p>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.user-situation {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	margin: $spacing-sm 0;
	font-size: 1.2rem;
	font-weight: $font-weight-semibold;

	&__image {
		width: 2.5rem;
	}

	&__timer {
		color: $text-secondary;
		font-size: $font-size-14;
		font-weight: $font-weight-normal;
	}
}
</style>
