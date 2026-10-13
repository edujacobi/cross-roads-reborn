<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ChevronDown } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import ScavengeIcon from "~/components/icons/ScavengeIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useDateFormat } from "~/composables/useDateFormat";
import { useItemDetailModal } from "~/composables/useItemDetailModal";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { imagePaths } from "~/constants/imagePaths";
import {
	GetMyScavengeStatusDocument,
	GetScavengeLocationsDocument,
	GetUserActivityStatsDocument,
	GetUserProfileDocument,
	GetUserStatusDocument,
	StartScavengeDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Vasculhar",
});

const auth = useAuth();
const { user: authUser } = auth;
const { formatMoney } = useMoneyFormat();
const { showToast } = useToast();
const { distance } = useDateFormat();
const { openItemModal } = useItemDetailModal();
const { getScavengeLocationImageUrl } = useLocation();
const userId = computed(() => authUser.value?.userId ?? "");

const {
	result: locationsResult,
	loading: locationsLoading,
	error: locationsError,
} = useQuery(GetScavengeLocationsDocument);
const locations = computed(() => locationsResult.value?.scavengeLocations ?? []);

const {
	result: statusResult,
	loading: statusLoading,
	refetch: refetchStatus,
} = useQuery(GetMyScavengeStatusDocument, {}, { fetchPolicy: "cache-and-network" });
const scavengeStatus = computed(() => statusResult.value?.myScavengeStatus);
const isScavenging = computed(() => scavengeStatus.value?.isScavenging ?? false);
const scavengingId = computed(() => scavengeStatus.value?.scavengingId);
const scavengeTime = computed(() => scavengeStatus.value?.scavengeTime);

const {
	result: activityResult,
	loading: activityLoading,
	refetch: refetchActivity,
} = useQuery(GetUserActivityStatsDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});
const activityStats = computed(() => activityResult.value?.user?.activityStats);
const scavengeFound = computed(() => activityStats.value?.scavengeFoundCount ?? 0);
const scavengeFailures = computed(() => activityStats.value?.scavengeFailures ?? 0);
const scavengeHospitalizations = computed(() => activityStats.value?.scavengeHospitalizations ?? 0);
const scavengePrisonizations = computed(() => activityStats.value?.scavengePrisonizations ?? 0);

const {
	result: profileResult,
	loading: profileLoading,
	refetch: refetchProfile,
} = useQuery(GetUserProfileDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});
const profileUser = computed(() => profileResult.value?.user);

const {
	result: statusQueryResult,
	loading: statusQueryLoading,
	refetch: refetchStatusQuery,
} = useQuery(GetUserStatusDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});
const statusUser = computed(() => statusQueryResult.value?.user);

const { mutate: startScavenge, loading: startingScavenge } = useMutation(StartScavengeDocument);

const expandedLocations = ref(new Set<number>());
const asideOpen = ref(false);

// Modals
const showConfirmModal = ref(false);
const showLoadingModal = ref(false);
const showResultModal = ref(false);
const selectedLocationId = ref<number | null>(null);
const resultSuccess = ref(false);
const resultRewardDescription = ref("");
const resultRewardImage = ref("");
const resultLocationName = ref("");
const resultCooldownEndsAt = ref<Date | null>(null);
const resultFailureReason = ref("");

// SSE abort controller
let sseAbortController: AbortController | null = null;
let sseInProgress = false;

const userAttack = computed(() => {
	return profileUser.value?.attack ?? 0;
});

const isUserBusy = computed(() => {
	const s = statusUser.value;
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

const cooldownRemaining = computed(() => {
	if (!scavengeTime.value) return null;
	const end = new Date(scavengeTime.value);
	const now = new Date();
	if (end <= now) return null;
	return end;
});

function toggleLocationDetails(locId: number) {
	if (expandedLocations.value.has(locId)) {
		expandedLocations.value.delete(locId);
	} else {
		expandedLocations.value.add(locId);
	}
}

function canScavenge(location: { needAttack: number }): boolean {
	if (isUserBusy.value) return false;
	if (isScavenging.value) return false;
	if (userAttack.value < location.needAttack) return false;
	return !cooldownRemaining.value;
}

function getScavengeButtonText(location: { needAttack: number }): string {
	if (isUserBusy.value) return "Indisponível";
	if (isScavenging.value) return "Vasculhando...";
	if (userAttack.value < location.needAttack) return `${location.needAttack} ATK necessário`;
	return "Vasculhar";
}

function openConfirmModal(locationId: number) {
	selectedLocationId.value = locationId;
	showConfirmModal.value = true;
}

async function handleStartScavenge() {
	if (selectedLocationId.value === null) return;

	showConfirmModal.value = false;
	showLoadingModal.value = true;

	const res = await startScavenge({ placeId: selectedLocationId.value });
	if (res?.errors || !res?.data?.startScavenge?.success) {
		showLoadingModal.value = false;
		const message = res?.data?.startScavenge?.message || "Erro ao iniciar vasculho.";
		showToast({ text: message, variant: "error" });
		return;
	}

	listenToScavengeSSE();
}

function onScavengeResult(data: {
	success: boolean;
	rewardDescription?: string;
	failureReason?: string;
	itemId?: number | null;
	quantity?: number | null;
	duration?: number | null;
	cooldownEndsAt?: string | null;
}) {
	showLoadingModal.value = false;
	resultSuccess.value = data.success;
	const locationId = scavengingId.value ?? selectedLocationId.value;
	const location = locations.value.find((item) => item.id === locationId);
	const rewardItem = location?.rewardItems.find((item) => item.itemId === data.itemId);
	resultRewardImage.value = rewardItem?.defaultImagePath ?? "";
	resultLocationName.value = location?.name ?? "";
	resultCooldownEndsAt.value = data.cooldownEndsAt ? new Date(data.cooldownEndsAt) : null;
	resultRewardDescription.value = rewardItem
		? rewardItem.itemType === "Consumable"
			? `${data.quantity ?? 0} ${rewardItem.name}`
			: `${rewardItem.name} (${(data.duration ?? 0).toFixed(1)}h)`
		: (data.rewardDescription ?? "");
	resultFailureReason.value = data.failureReason ?? "";
	showResultModal.value = true;

	void Promise.all([auth.fetchUser(), refetchStatus(), refetchActivity(), refetchProfile(), refetchStatusQuery()]);
}

async function listenToScavengeSSE() {
	// Guard against duplicate SSE calls
	if (sseInProgress) return;
	sseInProgress = true;

	const config = useRuntimeConfig();
	const token = auth.token.value;

	if (sseAbortController) {
		sseAbortController.abort();
	}
	sseAbortController = new AbortController();

	try {
		const apiUrl = config.public.apiBaseUrl;
		const response = await fetch(`${apiUrl}/sse/scavenge-status`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			signal: sseAbortController.signal,
		});

		if (!response.ok) {
			showLoadingModal.value = false;
			return;
		}

		const reader = response.body?.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (reader) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (!line.startsWith("data: ")) continue;
				try {
					const data = JSON.parse(line.slice(6));
					if (data.type === "scavenge-ended") {
						sseInProgress = false;
						onScavengeResult(data);
						return;
					}
					if (data.type === "closed") {
						sseInProgress = false;
						showLoadingModal.value = false;
						return;
					}
					if (data.type === "not-scavenging") {
						sseInProgress = false;
						showLoadingModal.value = false;
						void refetchStatus();
						return;
					}
				} catch {
					// Ignore parse errors for partial lines
				}
			}
		}
	} catch (err) {
		if ((err as Error).name !== "AbortError") {
			showLoadingModal.value = false;
		}
		sseInProgress = false;
	}
}

const scavengingLocationName = computed(() => {
	const locationId = scavengingId.value ?? selectedLocationId.value;
	if (locationId === null || locationId === undefined) return "";
	const loc = locations.value.find((l) => l.id === locationId);
	return loc?.name || "";
});

// Reload protection: wait for status query to resolve, then check if user was scavenging
onMounted(async () => {
	await new Promise<void>((resolve) => {
		const unwatch = watch(
			() => scavengeStatus.value,
			(status) => {
				if (status) {
					unwatch();
					resolve();
				}
			},
			{ immediate: true },
		);
	});

	if (isScavenging.value) {
		showLoadingModal.value = true;
		listenToScavengeSSE();
	}
});

function toggleAside() {
	asideOpen.value = !asideOpen.value;
}

function formatItemDuration(item: { itemType: string; durationMin: number; durationMax: number }): string {
	if (item.itemType === "Consumable") {
		return `(${Math.round(item.durationMin)}-${Math.round(item.durationMax)}un)`;
	}
	return `(${item.durationMin.toFixed(1)}-${item.durationMax.toFixed(1)}h)`;
}
</script>

<template>
	<div class="scavenge-page">
		<PageTitle
			title="Vasculhar"
			subtitle="Procuro pessoas corajosas e sem nojo de entrar em locais sujos e perigosos."
		/>

		<!-- Loading State -->
		<div
			v-if="locationsLoading || statusLoading || activityLoading || profileLoading || statusQueryLoading"
			class="scavenge-page__loading"
			role="status"
			aria-label="Carregando locais"
		>
			<div class="scavenge-grid">
				<div
					v-for="i in 4"
					:key="i"
					class="scavenge-card scavenge-card--skeleton"
				>
					<BaseSkeleton
						class="scavenge-card__header"
						height="2rem"
					/>
					<BaseSkeleton height="3rem" />
				</div>
			</div>
			<BaseSkeleton class="scavenge-page__loading-aside" />
		</div>

		<!-- Error State -->
		<div
			v-else-if="locationsError"
			class="scavenge-error"
		>
			<p>Erro ao carregar locais de vasculho.</p>
		</div>

		<!-- Main Content -->
		<div
			v-else
			class="scavenge-page__layout"
		>
			<section class="scavenge-page__list">
				<ul class="scavenge-grid">
					<li
						v-for="location in locations"
						:key="location.id"
						class="scavenge-card"
					>
						<div class="scavenge-card__row">
							<div class="scavenge-card__header">
								<h3 class="scavenge-card__name">
									<NuxtImg
										:src="getScavengeLocationImageUrl(location.id)"
										alt=""
										width="20"
										height="20"
									/>
									{{ location.name }}
									<span
										v-if="location.needAttack > 0"
										class="scavenge-card__atk-badge"
									>
										<NuxtImg
											:src="imagePaths.attributes.attack"
											width="20"
										/>
										{{ location.needAttack }}
										ATK
									</span>
								</h3>

								<p class="scavenge-card__subtitle">{{ location.subtitle }}</p>
							</div>
							<div class="scavenge-card__body">
								<div class="scavenge-card__button-row">
									<BaseButton
										:variant="canScavenge(location) ? 'primary' : 'secondary'"
										:disabled="!canScavenge(location) || startingScavenge"
										:loading="startingScavenge"
										@click="openConfirmModal(location.id)"
									>
										{{ getScavengeButtonText(location) }}
									</BaseButton>
									<button
										type="button"
										class="scavenge-card__chevron"
										:class="{ 'scavenge-card__chevron--expanded': expandedLocations.has(location.id) }"
										:aria-expanded="expandedLocations.has(location.id)"
										:aria-label="expandedLocations.has(location.id) ? 'Fechar detalhes' : 'Abrir detalhes'"
										@click="toggleLocationDetails(location.id)"
									>
										<ChevronDown :size="20" />
									</button>
								</div>
							</div>
						</div>

						<div class="scavenge-card__details-wrapper">
							<dl
								:class="{ 'scavenge-card__details--collapsed': !expandedLocations.has(location.id) }"
								class="scavenge-card__row scavenge-card__details"
							>
								<div class="scavenge-card__detail-grid">
									<div class="scavenge-card__detail-row">
										<dt class="scavenge-card__detail-label">Chance de sucesso</dt>
										<dd class="scavenge-card__detail-value">{{ location.successChance.toFixed(0) }}%</dd>
									</div>
									<div
										v-if="location.prisonChance > 0"
										class="scavenge-card__detail-row scavenge-card__detail-row--prison"
									>
										<dt class="scavenge-card__detail-label">
											<PrisonIcon
												:size="16"
												variant="solid"
											/>
											Chance de prisão
										</dt>
										<dd class="scavenge-card__detail-value">{{ location.prisonChance.toFixed(0) }}%</dd>
									</div>
									<div
										v-if="location.hospitalChance > 0"
										class="scavenge-card__detail-row scavenge-card__detail-row--hospital"
									>
										<dt class="scavenge-card__detail-label">
											<HospitalIcon
												:size="16"
												variant="solid"
											/>
											Chance de hospitalização
										</dt>
										<dd class="scavenge-card__detail-value">{{ location.hospitalChance.toFixed(0) }}%</dd>
									</div>
								</div>
								<div class="scavenge-card__detail-row">
									<dt class="scavenge-card__detail-label">Pode encontrar</dt>
									<dd class="scavenge-card__detail-items">
										<span class="scavenge-card__detail-money">
											{{ formatMoney(location.rewardMoneyMin) }}
											- {{ formatMoney(location.rewardMoneyMax) }}
										</span>
										<button
											type="button"
											v-for="item in location.rewardItems"
											:key="item.itemId"
											class="scavenge-card__detail-item"
											tabindex="0"
											@click="openItemModal({ id: item.itemId })"
											@keydown.enter.prevent="openItemModal({ id: item.itemId })"
											@keydown.space.prevent="openItemModal({ id: item.itemId })"
										>
											<NuxtImg
												:src="item.defaultImagePath"
												width="22"
												:alt="item.name"
											/>
											<span>{{ item.name }}</span>
											<span class="scavenge-card__item-duration">
												{{ formatItemDuration(item) }}
											</span>
										</button>
									</dd>
								</div>
							</dl>
						</div>
					</li>
				</ul>
			</section>

			<!-- Aside Panel -->
			<aside
				class="scavenge-page__aside"
				:class="{ 'scavenge-page__aside--open': asideOpen }"
				aria-label="Resumo de vasculhos"
			>
				<div class="scavenge-page__aside-header">
					<div class="scavenge-page__aside-title">
						<ScavengeIcon
							:size="22"
							variant="solid"
						/>
						<h2>Resumo</h2>
					</div>
					<button
						type="button"
						class="scavenge-page__aside-close"
						aria-label="Fechar resumo"
						@click="toggleAside"
					>
						<ChevronDown :size="20" />
					</button>
				</div>

				<div class="scavenge-page__aside-body">
					<dl class="scavenge-page__stats">
						<div class="scavenge-page__stat">
							<dt>Encontrados</dt>
							<dd>{{ scavengeFound }}</dd>
						</div>
						<div class="scavenge-page__stat">
							<dt>Falhas</dt>
							<dd>{{ scavengeFailures }}</dd>
						</div>
						<div class="scavenge-page__stat">
							<dt>Hospitalizações</dt>
							<dd>{{ scavengeHospitalizations }}</dd>
						</div>
						<div class="scavenge-page__stat">
							<dt>Prisões</dt>
							<dd>{{ scavengePrisonizations }}</dd>
						</div>
					</dl>

					<div
						v-if="isScavenging"
						class="scavenge-page__current-action"
					>
						<h3 class="scavenge-page__current-action-label">Vasculhando agora</h3>
						<p class="scavenge-page__current-action-name">{{ scavengingLocationName }}</p>
						<p class="scavenge-page__current-action-status">Aguarde o resultado...</p>
					</div>

					<div
						v-else-if="cooldownRemaining"
						class="scavenge-page__cooldown"
					>
						<h3 class="scavenge-page__cooldown-label">Você poderá vasculhar novamente em</h3>
						<time :datetime="cooldownRemaining.toISOString()">
							{{ distance(new Date(), cooldownRemaining) }}
						</time>
					</div>

					<p
						v-else
						class="scavenge-page__idle"
					>
						Pronto para vasculhar!
					</p>
				</div>
			</aside>

			<button
				type="button"
				class="scavenge-page__aside-toggle"
				:aria-label="asideOpen ? 'Fechar estatísticas' : 'Abrir estatísticas'"
				:aria-expanded="asideOpen"
				@click="toggleAside"
			>
				<ScavengeIcon :size="26" />
			</button>
		</div>

		<!-- Confirmation Modal -->
		<BaseModal
			v-model:open="showConfirmModal"
			title="Confirmar vasculho"
		>
			<p>
				Tem certeza que deseja vasculhar
				<strong>{{ locations.find((l) => l.id === selectedLocationId)?.name }}</strong>?
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showConfirmModal = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					@click="handleStartScavenge"
				>
					Vasculhar
				</BaseButton>
			</template>
		</BaseModal>

		<!-- Loading Modal -->
		<BaseModal
			class="scavenge-modal-loading"
			:open="showLoadingModal"
			title="Vasculho em andamento"
			@update:open="showLoadingModal = $event"
		>
			<div class="scavenge-modal-loading__content">
				<NuxtImg
					:src="imagePaths.badges.topScavenge"
					width="100"
				/>
				<div
					class="scavenge-modal-loading__spinner"
					role="status"
					aria-label="Carregando"
				>
					<span class="sr-only">Vasculhando...</span>
				</div>
				<p class="scavenge-modal-loading__text">
					{{ scavengingLocationName ? `Vasculhando ${scavengingLocationName}...` : "Vasculhando..." }}
				</p>
			</div>
		</BaseModal>

		<!-- Result Modal -->
		<BaseModal
			:open="showResultModal"
			:title="resultSuccess ? 'Vasculho bem-sucedido!' : 'Vasculho fracassado'"
			@update:open="showResultModal = $event"
		>
			<div
				v-if="resultSuccess"
				class="scavenge-result"
			>
				<p>Você encontrou</p>
				<div class="scavenge-result__reward">
					<NuxtImg
						v-if="resultRewardImage"
						:src="resultRewardImage"
						:alt="resultRewardDescription"
						width="40"
						height="40"
					/>
					<strong>{{ resultRewardDescription }}</strong>
				</div>
				<p v-if="resultLocationName">enquanto vasculhava {{ resultLocationName }}</p>
				<p v-if="resultCooldownEndsAt">
					Poderá vasculhar novamente em {{ distance(new Date(), resultCooldownEndsAt) }}
				</p>
			</div>
			<div
				v-else
				class="scavenge-result"
			>
				<p v-if="resultFailureReason">{{ resultFailureReason }}</p>
				<p v-else>Você não encontrou nada enquanto vasculhava.</p>
			</div>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showResultModal = false"
				>
					Voltar
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

.scavenge-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.scavenge-page__loading {
	min-width: 0;
	container-name: scavenge;
	container-type: inline-size;
	display: flex;
	gap: $spacing-lg;

	.scavenge-grid {
		flex-grow: 1;
	}

	&-aside {
		width: unset !important;
		height: unset !important;
		max-width: 320px;
		flex: 1;
	}
}

.scavenge-page__layout {
	display: grid;
	grid-template-columns: 1fr 320px;
	gap: $spacing-lg;
	position: relative;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
}

.scavenge-page__list {
	min-width: 0;
	container-name: page;
	container-type: inline-size;
}

.scavenge-page__aside {
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

.scavenge-page__stats {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
}

.scavenge-page__stat {
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

.scavenge-page__current-action {
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
	padding: $spacing-md;
	background: color-mix(in lab, $bg-card 100%, $color-brand 10%);
	border: 1px solid $color-brand;
	border-radius: $radius-sm;

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

	&-status {
		font-size: 0.8125rem;
		color: $text-secondary;
		margin: 0;
		font-style: italic;
	}
}

.scavenge-page__cooldown {
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
	padding: $spacing-md;
	background: color-mix(in lab, $bg-card 100%, $color-scavenge 10%);
	border: 1px solid $color-scavenge;
	border-radius: $radius-sm;

	&-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: $text-secondary;
		margin: 0;
	}

	time {
		font-size: 1rem;
		font-weight: 700;
		color: $text-primary;
		margin: 0;
	}
}

.scavenge-page__idle {
	text-align: center;
	color: $text-secondary;
	font-size: 0.875rem;
	padding: $spacing-lg 0;
	margin: 0;
}

.scavenge-page__aside-toggle {
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
}

.scavenge-grid {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.scavenge-card {
	padding: $spacing-md;
	background-color: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-sm;
	display: flex;
	flex-direction: column;
	list-style: none;

	&--skeleton {
		pointer-events: none;
		border: none;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	&__row {
		display: flex;
		gap: $spacing-xs;
		align-items: center;
		justify-content: space-between;

		@media (max-width: $bp-mobile){
			gap: $spacing-md;
			flex-direction: column;
			align-items: flex-start;
		}
	}

	&__header {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		flex-wrap: wrap;
	}

	&__name {
		font-size: 1rem;
		font-weight: 600;
		color: $text-primary;
		margin: 0;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		flex-wrap:wrap;
	}

	&__atk-badge {
		font-size: 0.75rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		color: $color-attribute;
	}

	&__subtitle {
		font-size: 0.8125rem;
		color: $text-secondary;
		margin: 0;
		font-style: italic;
	}

	&__body {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: $spacing-sm;

		@media (max-width: $bp-mobile){
			width: 100%;
		}
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

		&:has(.scavenge-card__details:not(.scavenge-card__details--collapsed)) {
			max-height: 500px;
			opacity: 1;
			margin-top: $spacing-md;
		}
	}

	&__details {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		align-items: flex-start;
		width: 100%;

		&--collapsed {
			visibility: hidden;
		}
	}

	&__detail-grid {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-lg;
		width: 100%;

		@media (max-width: 425px){
			flex-direction: column;
			gap: $spacing-sm;
			margin-bottom: $spacing-md;
		}
	}

	&__detail-row {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;

		&--prison {
			.scavenge-card__detail-label {
				color: $color-prison;
			}
		}

		&--hospital {
			.scavenge-card__detail-label {
				color: $color-hospital;
			}
		}
	}

	&__detail-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-secondary;
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}

	&__detail-value {
		font-size: 0.8125rem;
		font-weight: 600;
		color: $text-primary;
	}

	&__detail-items {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
		align-items: center;
	}

	&__detail-item {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		background-color: $bg-input;
		padding: 0.2rem 0.5rem;
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

	&__detail-money {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		background-color: $bg-input;
		padding: 0.2rem 0.5rem;
		border-radius: $radius-xs;
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-primary;
		cursor: pointer;
		border: 1px solid transparent;
	}

	&__item-duration {
		font-size: 0.75rem;
		color: $text-muted;
	}
}

.scavenge-error {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: $spacing-xl;
	color: $text-secondary;
}

.scavenge-modal-loading {
	:deep(.base-modal__header) {
		display: none;
	}

	&__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-md;
	}

	&__spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid $border-card;
		border-top-color: $color-brand;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	&__text {
		text-align: center;
		color: $text-secondary;
		font-size: 1rem;
		margin: 0;
	}
}

.scavenge-result {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;

	&__reward {
		display: flex;
		align-items: center;
		gap: $spacing-sm;

		img {
			object-fit: contain;
		}
	}

	p {
		margin: 0;
	}

}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.scavenge-page__aside,
	.scavenge-page__aside-toggle,
	.scavenge-modal-loading__spinner {
		transition: none !important;
		animation: none !important;
	}
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}

</style>
