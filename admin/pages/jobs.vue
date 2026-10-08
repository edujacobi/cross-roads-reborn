<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ChevronDown, Clock, Coins, HardHat, X } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useDateFormat } from "~/composables/useDateFormat";
import { useItemDetailModal } from "~/composables/useItemDetailModal";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import {
	CancelJobDocument,
	GetBlackMarketOpenDocument,
	GetJobsDocument,
	type GetJobsQuery,
	GetUserActivityStatsDocument,
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
const { distance, decimalHoursToDeclarative } = useDateFormat();
const { openItemModal } = useItemDetailModal();

const userId = computed(() => authUser.value?.userId ?? "");

const { result: jobsResult, loading: jobsLoading, error: jobsError } = useQuery(GetJobsDocument);
const jobs = computed(() => jobsResult.value?.jobs ?? []);

const { result: blackMarketResult, loading: blackMarketLoading } = useQuery(GetBlackMarketOpenDocument);
const blackMarketOpen = computed(() => blackMarketResult.value?.blackMarketOpen ?? false);

const { result: activityResult, loading: activityLoading } = useQuery(
	GetUserActivityStatsDocument,
	() => ({ id: userId.value }),
	{
		enabled: !!userId.value,
		fetchPolicy: "cache-and-network",
	},
);
const activityStats = computed(() => activityResult.value?.user?.activityStats);
const jobsCompleted = computed(() => activityStats.value?.jobReceivedCount ?? 0);
const jobsEarned = computed(() => activityStats.value?.jobReceivedSum ?? 0);

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
const asideOpen = ref(false);
const lastFocusedElement = ref<HTMLElement | null>(null);

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

function toggleAside() {
	if (asideOpen.value) {
		asideOpen.value = false;
		if (lastFocusedElement.value) {
			lastFocusedElement.value.focus();
		}
	} else {
		lastFocusedElement.value = document.activeElement as HTMLElement | null;
		asideOpen.value = true;
	}
}

function handleKeyDown(e: KeyboardEvent) {
	if (e.key === "Escape" && asideOpen.value) {
		toggleAside();
	}
}

onMounted(() => {
	window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
	<div class="jobs-page">
		<PageTitle
			title="Trabalhos"
			subtitle="Você não pode apostar, roubar nem vasculhar enquanto trabalha!"
		/>

		<div
			v-if="jobsLoading || statusLoading || blackMarketLoading || activityLoading"
			class="jobs-loading"
			role="status"
			aria-label="Carregando trabalhos"
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
				</div>
			</div>
			<BaseSkeleton class="jobs-loading__aside" />
		</div>

		<div
			v-else-if="jobsError"
			class="jobs-error"
		>
			<p>Erro ao carregar trabalhos.</p>
		</div>

		<div
			v-else
			class="jobs-page__layout"
		>
			<section class="jobs-page__list">
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
								</h3>
							</div>
							<div class="job-card__body">
								<div class="job-card__stats">
									<div class="job-card__stat">
										<Clock :size="14" />
										<time :datetime="`PT${Math.round(job.duration * 60)}M`">{{
											decimalHoursToDeclarative(job.duration)
										}}</time>
									</div>
									<div class="job-card__stat">
										<Coins :size="14" />
										<span>{{ formatMoney(job.salary) }}</span>
									</div>
								</div>
								<div class="job-card__button-row">
									<BaseButton
										:variant="canStartJob(job) ? 'primary' : 'secondary'"
										:disabled="!canStartJob(job) || startingJob"
										:loading="startingJob"
										:title="job.special && !blackMarketOpen ? 'O Mercado Negro é aberto aos domingos, sábados e sextas após as 18h' : undefined"
										@click="handleStartJob(job)"
									>
										{{ isUserBusy ? "Indisponível" : "Iniciar" }}
									</BaseButton>
									<button
										type="button"
										class="job-card__chevron"
										:class="{ 'job-card__chevron--expanded': expandedJobs.has(job.id) }"
										:aria-expanded="expandedJobs.has(job.id)"
										:aria-label="expandedJobs.has(job.id) ? 'Fechar detalhes' : 'Abrir detalhes'"
										@click="toggleJobDetails(job.id)"
									>
										<ChevronDown :size="20" />
									</button>
								</div>
							</div>
						</div>

						<div class="job-card__details-wrapper">
							<dl
								:class="{ 'job-card__details--collapsed': !expandedJobs.has(job.id) }"
								class="job-card__row job-card__details"
							>
								<div class="job-card__detail-row">
									<dt class="job-card__detail-label">Duração</dt>
									<dd class="job-card__detail-value">
										<time :datetime="`PT${Math.round(job.duration * 60)}M`">{{
											decimalHoursToDeclarative(job.duration)
										}}</time>
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
										<button
											type="button"
											v-for="item in job.needItems"
											:key="item.id"
											class="job-card__detail-item"
											tabindex="0"
											@click="openItemModal(item)"
											@keydown.enter.prevent="openItemModal(item)"
											@keydown.space.prevent="openItemModal(item)"
										>
											<NuxtImg
												:src="item.defaultImagePath"
												width="24"
												:alt="item.name"
											/>
											{{ item.name }}
										</button>
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
						</div>
					</li>
				</ul>
			</section>

			<aside
				class="jobs-page__aside"
				:class="{ 'jobs-page__aside--open': asideOpen }"
				aria-label="Resumo de trabalhos"
			>
				<div class="jobs-page__aside-header">
					<div class="jobs-page__aside-title">
						<HardHat :size="20" />
						<h2>Resumo</h2>
					</div>
					<button
						type="button"
						class="jobs-page__aside-close"
						aria-label="Fechar resumo"
						@click="toggleAside"
					>
						<ChevronDown :size="20" />
					</button>
				</div>

				<div class="jobs-page__aside-body">
					<dl class="jobs-page__stats">
						<div class="jobs-page__stat">
							<dt>Trabalhos concluídos</dt>
							<dd>{{ jobsCompleted }}</dd>
						</div>
						<div class="jobs-page__stat">
							<dt>Total ganho</dt>
							<dd>{{ formatMoney(jobsEarned) }}</dd>
						</div>
					</dl>

					<div
						v-if="isWorking"
						class="jobs-page__current-job"
					>
						<div class="jobs-page__current-job-header">
							<h3 class="jobs-page__current-job-label">Trabalho atual</h3>
							<p class="jobs-page__current-job-name">{{ currentJob?.name ?? "Trabalhando agora" }}</p>
						</div>
						<div class="jobs-page__current-job-details">
							<div
								class="jobs-page__current-job-detail"
								v-if="jobEndsIn"
							>
								<Clock :size="14" />
								<span
									>Termina em <time :datetime="jobEndsIn">{{ distance(new Date(), new Date(jobEndsIn)) }}</time></span
								>
							</div>
							<div
								v-if="currentJob"
								class="jobs-page__current-job-detail"
							>
								<Coins :size="14" />
								<span>{{ formatMoney(currentJob.salary) }}</span>
							</div>
						</div>
						<div class="jobs-page__stop-btn">
							<BaseButton
								variant="danger"
								size="sm"
								@click="showCancelModal = true"
							>
								<X :size="14" />
								Parar trabalho
							</BaseButton>
						</div>
					</div>

					<p
						v-else
						class="jobs-page__idle"
					>
						Você não está trabalhando.
					</p>
				</div>
			</aside>

			<button
				type="button"
				class="jobs-page__aside-toggle"
				:aria-label="asideOpen ? 'Fechar resumo' : 'Abrir resumo'"
				:aria-expanded="asideOpen"
				@click="toggleAside"
			>
				<HardHat :size="24" />
				<span
					v-if="currentJob"
					class="jobs-page__aside-toggle-badge"
				>
					!
				</span>
			</button>
		</div>

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
	min-width: 0;
	container-name: shop;
	container-type: inline-size;
	display: flex;
	gap: $spacing-lg;

	.jobs-grid {
		flex-grow: 1;
	}

	&__aside {
		width: unset !important;
		height: unset !important;
		max-width: 320px;
		flex: 1;
	}
}

.jobs-page__layout {
	display: grid;
	grid-template-columns: 1fr 320px;
	gap: $spacing-lg;
	position: relative;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
}

.jobs-page__list {
	min-width: 0;
	container-name: page;
	container-type: inline-size;
}

.jobs-page__aside {
	position: sticky;
	top: $spacing-lg;
	max-height: calc(100dvh - 200px);
	display: flex;
	flex-direction: column;
	background-color: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-md;
	overflow: hidden;

	@media (max-width: 1024px) {
		position: fixed;
		top: 30dvh;
		left: calc(50% - 160px);
		bottom: 0;
		width: 320px;
		max-width: 85vw;
		max-height: 100vh;
		border-radius: $radius-md $radius-md 0 0;
		transform: translateY(100%);
		transition: transform 0.2s ease;
		z-index: 100;
		box-shadow: $shadow-lg;

		&--open {
			transform: translateY(0);
		}
	}

	@media (max-width: 375px) {
		width: 100%;
		left: 0;
		right: 0;
		max-width: unset;
	}

	&-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $spacing-md;
		border-bottom: 1px solid $border-card;
	}

	&-title {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		font-size: 1rem;
		font-weight: 600;
		color: $text-primary;

		h2 {
			margin: 0;
			font-size: inherit;
			font-weight: inherit;
		}
	}

	&-close {
		display: none;
		background: none;
		border: none;
		color: $text-secondary;
		cursor: pointer;
		padding: $spacing-xs;
		border-radius: $radius-sm;
		transition: color 0.2s ease, background-color 0.2s ease;

		&:hover {
			color: $text-primary;
			background-color: $bg-input;
		}

		@media (max-width: 1024px) {
			display: block;
		}
	}

	&-body {
		flex: 1;
		overflow-y: auto;
		padding: $spacing-md;
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		justify-content: space-between;
	}
}

.jobs-page__stats {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
}

.jobs-page__stat {
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
	padding: $spacing-sm;
	border: 1px solid $border-card;
	border-radius: $radius-sm;

	dt {
		color: $text-secondary;
		font-size: 0.75rem;
	}

	dd {
		color: $text-primary;
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0;
	}
}

.jobs-page__current-job {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	padding: $spacing-md;
	background: color-mix(in lab, $bg-card 100%, $color-working 10%);
	border: 1px solid $color-working;
	border-radius: $radius-sm;

	&-header {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	&-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: $text-secondary;
		margin: 0;
	}

	&-name {
		font-size: 1rem;
		font-weight: 700;
		color: $text-primary;
		margin: 0;
	}

	&-details {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	&-detail {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		font-size: 0.8125rem;
		color: $text-secondary;
	}
}

.jobs-page__stop-btn {
	width: 100%;

	.base-button {
		width: 100%;
	}
}

.jobs-page__idle {
	text-align: center;
	color: $text-secondary;
	font-size: 0.875rem;
	padding: $spacing-lg 0;
	margin: 0;
}

.jobs-page__aside-toggle {
	display: none;
	position: fixed;
	bottom: 1rem;
	left: calc(50% - 2rem);
	width: 4rem;
	height: 4rem;
	background-color: $bg-sidebar;
	color: $text-primary;
	border: 1px solid $border-subtle;
	border-radius: $radius-full;
	cursor: pointer;
	box-shadow: $shadow-lg;
	z-index: 2;
	transition: transform 0.2s ease;
	align-items: center;
	justify-content: center;

	&:hover {
		transform: scale(1.05);
	}

	@media (max-width: 1024px) {
		display: flex;
	}

	&-badge {
		position: absolute;
		top: -0.25rem;
		right: -0.25rem;
		min-width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: $color-working;
		color: #000;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
	}
}

.jobs-grid {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
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

		@container page (width < 500px) {
			flex-direction: column;
			align-items: flex-start;
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

	&__body {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: $spacing-sm;
		flex: 1;
		min-width: 0;
		width: 100%;
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

	&__button-row {
		display: flex;
		gap: $spacing-sm;
		margin-left: auto;
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
		transition: color 0.15s ease, transform 0.2s ease;
		flex-shrink: 0;

		&:hover {
			color: $text-primary;
		}

		&--expanded {
			transform: rotate(180deg);
		}
	}

	&__details-wrapper {
		overflow: hidden;
		max-height: 0;
		opacity: 0;
		transition: max-height 0.25s ease, opacity 0.2s ease, margin-top 0.25s ease;
		margin-top: 0;

		&:has(.job-card__details:not(.job-card__details--collapsed)) {
			max-height: 300px;
			opacity: 1;
			margin-top: $spacing-md;
		}
	}

	&__details {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		align-items: flex-start;
		width: 100%;

		&--collapsed {
			visibility: hidden;
		}
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
		gap: $spacing-sm;
		background-color: $bg-input;
		padding: 0.2rem 0.75rem;
		border-radius: $radius-xs;
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-primary;
		cursor: pointer;
		border: 1px solid transparent;

		&:hover {
			border: 1px solid $border-card;
		}
	}

	&__detail-empty {
		color: $text-secondary;
		font-style: italic;
	}

}

.jobs-error {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: $spacing-xl;
	color: $text-secondary;
}

@media (prefers-reduced-motion: reduce) {
	.jobs-page__aside,
	.jobs-page__aside-toggle {
		transition: none !important;
	}
}

</style>
