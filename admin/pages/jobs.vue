<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ChevronDown, ChevronUp, Clock, Coins, HardHat, X } from "lucide-vue-next";
import { computed, ref } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import {
	CancelJobDocument,
	GetBlackMarketOpenDocument,
	GetJobsDocument,
	type GetJobsQuery,
	GetUserJobStatusDocument,
	StartJobDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Trabalhos",
});

type Job = GetJobsQuery["jobs"][number];

const { user: authUser } = useAuth();
const { format: formatMoney } = useMoneyFormat();
const { showToast } = useToast();
const { distance } = useDateFormat();

const userId = computed(() => authUser.value?.userId ?? "");

const { result: jobsResult, loading: jobsLoading, error: jobsError } = useQuery(GetJobsDocument);
const jobs = computed(() => jobsResult.value?.jobs ?? []);

const { result: blackMarketResult, loading: blackMarketLoading } = useQuery(GetBlackMarketOpenDocument);
const blackMarketOpen = computed(() => blackMarketResult.value?.blackMarketOpen ?? false);

const {
	result: statusResult,
	loading: statusLoading,
	refetch: refetchStatus,
} = useQuery(GetUserJobStatusDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});

const userStatus = computed(() => statusResult.value?.user);
const isWorking = computed(() => userStatus.value?.isWorking ?? false);
const currentJobId = computed(() => userStatus.value?.currentJobId);
const jobEndsIn = computed(() => userStatus.value?.jobEndsIn);
const userItems = computed(() => userStatus.value?.items ?? []);

const currentJob = computed(() => {
	if (currentJobId.value === null) return null;
	return jobs.value.find((j) => j.id === currentJobId.value) ?? null;
});

const { mutate: startJob, loading: startingJob } = useMutation(StartJobDocument);
const { mutate: cancelJob, loading: cancelingJob } = useMutation(CancelJobDocument);

const showCancelModal = ref(false);
const expandedJobs = ref(new Set<number>());

function toggleJobDetails(jobId: number) {
	return expandedJobs.value.has(jobId) ? expandedJobs.value.delete(jobId) : expandedJobs.value.add(jobId);
}

const isUserBusy = computed(() => {
	const s = userStatus.value;
	if (!s) return false;
	return (
		s.isWorking ||
		s.isScavenging ||
		s.isInPrison ||
		s.isInHospital ||
		s.isInCasino ||
		s.isRobbing ||
		s.isBeingRobbed ||
		s.isBeating ||
		s.isBeingBeated ||
		s.isDefendingInvestment ||
		s.isInGangAction ||
		s.isDead
	);
});

function hasRequiredItems(job: Job): boolean {
	if (job.needItems.length === 0) return true;
	return job.needItems.every((needed) => userItems.value.some((ui) => ui.id === needed.id));
}

function canStartJob(job: Job): boolean {
	if (isUserBusy.value) return false;
	if (!hasRequiredItems(job)) return false;
	return !(job.special && !blackMarketOpen.value);
}

async function handleStartJob(job: Job) {
	try {
		const result = await startJob({ jobId: job.id });
		if (result?.data?.startJob.success) {
			showToast({ text: result.data.startJob.message, variant: "success" });
			await refetchStatus();
		} else {
			showToast({ text: result?.data?.startJob.message || "Erro ao iniciar trabalho.", variant: "error" });
		}
	} catch {
		showToast({ text: "Erro ao iniciar trabalho.", variant: "error" });
	}
}

async function handleCancelJob() {
	try {
		const result = await cancelJob();
		if (result?.data?.cancelJob.success) {
			showToast({ text: result.data.cancelJob.message, variant: "success" });
			await refetchStatus();
		} else {
			showToast({ text: result?.data?.cancelJob.message || "Erro ao cancelar trabalho.", variant: "error" });
		}
	} catch {
		showToast({ text: "Erro ao cancelar trabalho.", variant: "error" });
	}
}

function formatDuration(hours: number): string {
	if (hours < 1) {
		return `${Math.round(hours * 60)}min`;
	}
	return `${hours}h`;
}
</script>

<template>
	<div class="jobs-page">
		<PageTitle
			title="Trabalhos"
			subtitle="Você não pode apostar, roubar nem vasculhar enquanto trabalha!"
		/>

		<div
			v-if="jobsLoading || statusLoading || blackMarketLoading"
			class="jobs-loading"
		>
			<div class="jobs-grid">
				<div
					v-for="i in 6"
					:key="i"
					class="job-card job-card--skeleton"
				>
					<BaseSkeleton
						class="job-card__header"
						height="2rem"
					/>
					<BaseSkeleton
						class="job-card__stats"
						height="3rem"
					/>
					<BaseSkeleton
						class="job-card__button"
						height="2.5rem"
					/>
				</div>
			</div>
		</div>

		<div
			v-else-if="jobsError"
			class="jobs-error"
		>
			<p>Erro ao carregar trabalhos.</p>
		</div>

		<div v-else>
			<article
				v-if="isWorking"
				class="current-job-section"
				aria-label="Trabalho atual"
			>
				<div class="current-job-card">
					<div class="current-job-header">
						<HardHat
							class="current-job-icon"
							:size="24"
						/>
						<div class="current-job-info">
							<h3 class="current-job-title">Trabalho atual</h3>
							<p class="current-job-name">{{ currentJob?.name ?? "Trabalhando agora" }}</p>
						</div>
					</div>
					<div class="current-job-details">
						<div
							class="current-job-detail"
							v-if="jobEndsIn"
						>
							<Clock :size="16" />
							<span
								>Terminará em <time :datetime="jobEndsIn">{{ distance(new Date(), new Date(jobEndsIn)) }}</time></span
							>
						</div>
						<div
							v-if="currentJob"
							class="current-job-detail"
						>
							<Coins :size="16" />
							<span>{{ formatMoney(currentJob.salary) }}</span>
						</div>
					</div>
					<BaseButton
						variant="danger"
						@click="showCancelModal = true"
					>
						<X :size="16" />
						Parar
					</BaseButton>
				</div>
			</article>

			<BaseModal
				v-model:open="showCancelModal"
				title="Parar trabalho"
			>
				<p>Tem certeza que deseja parar o trabalho atual? Você perderá o progresso.</p>
				<template #footer>
					<BaseButton
						variant="secondary"
						@click="showCancelModal = false"
					>
						Cancelar
					</BaseButton>
					<BaseButton
						variant="danger"
						:loading="cancelingJob"
						@click="handleCancelJob"
					>
						Parar trabalho
					</BaseButton>
				</template>
			</BaseModal>

			<ul class="jobs-grid">
				<li
					v-for="job in jobs"
					:key="job.id"
					class="job-card"
					:class="{
						'job-card--black-market': job.special,
						'job-card--disabled': job.special && !blackMarketOpen,
					}"
				>
					<div class="job-card__row">
						<div class="job-card__header">
							<h3 class="job-card__name">
								{{ job.name }}
								<span
									v-if="job.special"
									class="job-card__badge"
								>
									🌙 Mercado Negro
								</span>
							</h3>
						</div>
						<div class="job-card__body">
							<div class="job-card__stats">
								<div class="job-card__stat">
									<Clock :size="14" />
									<time :datetime="`PT${Math.round(job.duration * 60)}M`">{{ formatDuration(job.duration) }}</time>
								</div>
								<div class="job-card__stat">
									<Coins :size="14" />
									<span>{{ formatMoney(job.salary) }}</span>
								</div>
							</div>
							<ul
								v-if="job.needItems.length > 0"
								class="job-card__items"
								:aria-label="job.needItems.length === 1 ? 'Item necessário' : 'Itens necessários'"
							>
								<li
									v-for="item in job.needItems"
									:key="item.id"
								>
									<NuxtImg
										:src="item.defaultImagePath"
										width="30"
										:alt="item.name"
									>
										{{ item.name }}
									</NuxtImg>
								</li>
							</ul>
							<BaseButton
								:variant="canStartJob(job) ? 'primary' : 'secondary'"
								:disabled="!canStartJob(job) || startingJob"
								:loading="startingJob"
								:title="job.special && !blackMarketOpen ? 'O Mercado Negro é aberto aos domingos, sábados e sextas após as 18h' : undefined"
								@click="handleStartJob(job)"
							>
								{{ isUserBusy ? "Indisponível" : "Iniciar" }}
							</BaseButton>
						</div>
						<button
							type="button"
							class="job-card__chevron"
							:aria-expanded="expandedJobs.has(job.id)"
							:aria-label="expandedJobs.has(job.id) ? 'Fechar detalhes' : 'Abrir detalhes'"
							@click="toggleJobDetails(job.id)"
						>
							<ChevronDown
								v-if="!expandedJobs.has(job.id)"
								:size="20"
							/>
							<ChevronUp
								v-else
								:size="20"
							/>
						</button>
					</div>

					<dl
						v-if="expandedJobs.has(job.id)"
						class="job-card__row job-card__details"
					>
						<div class="job-card__detail-row">
							<dt class="job-card__detail-label">Duração</dt>
							<dd class="job-card__detail-value">
								<time :datetime="`PT${Math.round(job.duration * 60)}M`">{{ formatDuration(job.duration) }}</time>
							</dd>
						</div>
						<div class="job-card__detail-row">
							<dt class="job-card__detail-label">Salário</dt>
							<dd class="job-card__detail-value">{{ formatMoney(job.salary) }}</dd>
						</div>
						<div
							v-if="job.needItems.length > 0"
							class="job-card__detail-row"
						>
							<dt class="job-card__detail-label">Itens necessários</dt>
							<dd class="job-card__detail-items">
								<span
									v-for="item in job.needItems"
									:key="item.id"
									class="job-card__detail-item"
								>
									<NuxtImg
										:src="item.defaultImagePath"
										width="24"
										:alt="item.name"
									/>
									{{ item.name }}
								</span>
							</dd>
						</div>
						<div
							v-else
							class="job-card__detail-row"
						>
							<dt class="job-card__detail-label">Itens necessários</dt>
							<dd class="job-card__detail-value job-card__detail-empty">Nenhum</dd>
						</div>
					</dl>
				</li>
			</ul>
		</div>
	</div>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.jobs-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.jobs-loading {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.jobs-grid {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.current-job-section {
	margin-bottom: $spacing-md;
}

.current-job-card {
	background: color-mix(in lab, $bg-card 100%, $color-working 10%);
	border: 1px solid $color-working;
	border-radius: $radius-sm;
	padding: $spacing-md;
	display: flex;
	align-items: center;
	gap: $spacing-xl;

	.current-job-header {
		display: flex;
		align-items: center;
		gap: $spacing-md;
	}

	.current-job-icon {
		color: $color-working;
	}

	.current-job-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.current-job-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: $text-secondary;
		margin: 0;
	}

	.current-job-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: $text-primary;
		margin: 0;
	}

	.current-job-details {
		display: flex;
		gap: $spacing-md;
	}

	.current-job-detail {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		font-size: 0.875rem;
		color: $text-secondary;
	}

	button {
		margin-left: auto;
	}
}



.job-card {
	padding: $spacing-md;
	background-color: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-sm;
	display: flex;
	flex-direction: column;
	gap: 0;
	list-style: none;

	&--black-market {
		$color-black-market: #5136b3;
		border-color: $color-black-market;
		background: linear-gradient(115deg, $bg-card, color-mix(in lab, $bg-card 100%, $color-black-market 40%));

		.job-card__name {
			color: color-mix(in lab, $text-primary 100%, $color-black-market 70%);
		}
	}

	&--disabled {
		opacity: 0.5;

		.job-card__name {
			filter: grayscale(0.5);
		}
	}

	&--skeleton {
		pointer-events: none;
		border: none;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	&__row {
		display: flex;
		align-items: center;
		gap: $spacing-md;

		&:not(:first-child) {
			margin-top: $spacing-md;
			padding-top: $spacing-md;
			border-top: 1px solid $border-card;
		}
	}

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
		min-width: 0;
	}

	&__name {
		font-size: 1rem;
		font-weight: 600;
		color: $text-primary;
		margin: 0;
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		flex-wrap: wrap;
	}

	&__badge {
		font-size: 0.6875rem;
		font-weight: 600;
		background-color: rgba(81, 54, 179, 0.2);
		color: #a78bfa;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}

	&__body {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $spacing-sm;
		flex: 1;
		min-width: 0;
	}

	&__stats {
		display: flex;
		gap: $spacing-sm;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	&__stat {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		color: $text-secondary;
	}

	&__items {
		display: flex;
		flex-direction: row;
		gap: $spacing-xs;
		font-size: 0.75rem;
		list-style: none;
	}

	&__items-list {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}

	&__item-name {
		background-color: $bg-input;
		padding: 0.125rem 0.5rem;
		border-radius: $radius-xs;
		color: $text-primary;
		font-weight: 500;
	}

	&__chevron {
		background: none;
		border: none;
		cursor: pointer;
		color: $text-secondary;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s ease;
		flex-shrink: 0;

		&:hover {
			color: $text-primary;
		}
	}

	&__details {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		align-items: flex-start;
		width: 100%;
	}

	&__detail-row {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		gap: $spacing-xs;
	}

	&__detail-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-secondary;
		flex-shrink: 0;
	}

	&__detail-value {
		font-size: 0.8125rem;
		font-weight: 600;
		color: $text-primary;
		text-align: right;
	}

	&__detail-items {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}

	&__detail-item {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		background-color: $bg-input;
		padding: 0.125rem 0.5rem;
		border-radius: $radius-xs;
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-primary;
	}

	&__detail-empty {
		color: $text-secondary;
		font-style: italic;
	}

	button {
		margin-left: auto;
	}
}

.jobs-error {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: $spacing-xl;
	color: $text-secondary;
}
</style>
