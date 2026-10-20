<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ChevronDown } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import RobberyIcon from "~/components/icons/RobberyIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useDateFormat } from "~/composables/useDateFormat";
import { useLocation } from "~/composables/useLocation";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { imagePaths } from "~/constants/imagePaths";
import {
	GetRobLocationsDocument,
	GetUserActivityStatsDocument,
	GetUserProfileDocument,
	GetUserStatusDocument,
	StartRobLocationDocument,
} from "~/graphql/generated";

definePageMeta({ middleware: "auth" });
useHead({ title: "Roubar" });

const auth = useAuth();
const userId = computed(() => auth.user.value?.userId ?? "");
const { formatMoney } = useMoneyFormat();
const { distance, relative } = useDateFormat();
const { showToast } = useToast();
const { getLocationImageUrl } = useLocation();

const { result: locationsResult, loading: locationsLoading, error: locationsError } = useQuery(GetRobLocationsDocument);
const locations = computed(() => locationsResult.value?.robLocations ?? []);

const {
	result: profileResult,
	loading: profileLoading,
	refetch: refetchProfile,
} = useQuery(GetUserProfileDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});
const profile = computed(() => profileResult.value?.user);

const {
	result: statusResult,
	loading: statusLoading,
	refetch: refetchStatus,
} = useQuery(GetUserStatusDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});
const status = computed(() => statusResult.value?.user);

const {
	result: activityResult,
	loading: activityLoading,
	refetch: refetchActivity,
} = useQuery(GetUserActivityStatsDocument, () => ({ id: userId.value }), {
	enabled: !!userId.value,
	fetchPolicy: "cache-and-network",
});
const activity = computed(() => activityResult.value?.user?.activityStats);

const { mutate: startRobbery, loading: startingRobbery } = useMutation(StartRobLocationDocument);
const expandedLocations = ref(new Set<number>());
const asideOpen = ref(false);
const showConfirmModal = ref(false);
const showLoadingModal = ref(false);
const showResultModal = ref(false);
const selectedLocationId = ref<number | null>(null);
const resultSuccess = ref(false);
const resultMoney = ref(0);
const resultLocationName = ref("");
const resultWantedTime = ref<Date | null>(null);
const resultPrisonTime = ref<Date | null>(null);
const resultPrisonText = ref("");
let sseAbortController: AbortController | null = null;
let sseInProgress = false;

const attack = computed(() => profile.value?.attack ?? 0);
const isRobbingLocation = computed(
	() => showLoadingModal.value || (status.value?.isRobbing && status.value.robberyLocationId !== null),
);
const currentLocationName = computed(() => {
	const locationId = status.value?.robberyLocationId ?? selectedLocationId.value;
	const location = locations.value.find((item) => item.id === locationId);
	return location?.name ?? "";
});
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
const isBusy = computed(() => {
	const userStatus = status.value;
	if (!userStatus) return false;
	return (
		userStatus.isWorking ||
		userStatus.isScavenging ||
		userStatus.isInPrison ||
		userStatus.isInHospital ||
		userStatus.isInCasino ||
		userStatus.isRobbing ||
		userStatus.isBeingRobbed ||
		userStatus.isBeating ||
		userStatus.isBeingBeated ||
		userStatus.isDefendingInvestment ||
		userStatus.isInGangAction ||
		userStatus.isDead
	);
});
const isLoading = computed(
	() => locationsLoading.value || profileLoading.value || statusLoading.value || activityLoading.value,
);

function canRob(location: { needAttack: number }): boolean {
	return !isBusy.value && !wantedTime.value && attack.value >= location.needAttack;
}

function getRobButtonText(location: { needAttack: number }): string {
	if (isRobbingLocation.value) return "Roubo em andamento";
	if (wantedTime.value) return "Procurado";
	if (isBusy.value) return "Indisponível";
	if (attack.value < location.needAttack) return `${location.needAttack} ATK necessário`;
	return "Roubar";
}

function toggleLocationDetails(locationId: number) {
	if (expandedLocations.value.has(locationId)) expandedLocations.value.delete(locationId);
	else expandedLocations.value.add(locationId);
}

function openConfirmModal(locationId: number) {
	selectedLocationId.value = locationId;
	showConfirmModal.value = true;
}

async function handleStartRobbery() {
	if (selectedLocationId.value === null) return;
	showConfirmModal.value = false;
	resultWantedTime.value = null;
	resultPrisonTime.value = null;
	const response = await startRobbery({ locationId: selectedLocationId.value });
	const result = response?.data?.startRobLocation;
	if (response?.errors || !result?.success) {
		showToast({ text: result?.message || "Não foi possível iniciar o roubo.", variant: "error" });
		return;
	}

	showLoadingModal.value = true;
	await listenToRobberySSE();
}

function onRobberyResult(data: {
	success: boolean;
	moneyRobbed?: number;
	wantedTime?: string | null;
	prisonTime?: string | null;
	prisonText?: string;
}) {
	showLoadingModal.value = false;
	resultSuccess.value = data.success;
	resultMoney.value = data.moneyRobbed ?? 0;
	resultLocationName.value =
		currentLocationName.value ||
		locations.value.find((location) => location.id === selectedLocationId.value)?.name ||
		"";
	resultWantedTime.value = data.wantedTime ? new Date(data.wantedTime) : null;
	resultPrisonTime.value = data.prisonTime ? new Date(data.prisonTime) : null;
	resultPrisonText.value = data.prisonText ?? "";
	showResultModal.value = true;
	void Promise.all([auth.fetchUser(), refetchProfile(), refetchStatus(), refetchActivity()]);
}

async function listenToRobberySSE() {
	if (sseInProgress) return;
	sseInProgress = true;
	sseAbortController?.abort();
	sseAbortController = new AbortController();

	try {
		const config = useRuntimeConfig();
		const response = await fetch(`${config.public.apiBaseUrl}/sse/rob-status`, {
			headers: { Authorization: `Bearer ${auth.token.value}` },
			signal: sseAbortController.signal,
		});
		if (!response.ok || !response.body) {
			throw new Error("Não foi possível acompanhar o roubo.");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const events = buffer.split("\n\n");
			buffer = events.pop() ?? "";
			for (const event of events) {
				if (!event.startsWith("data: ")) continue;
				const data = JSON.parse(event.slice(6));
				if (data.type === "rob-ended") {
					onRobberyResult(data);
					return;
				}
				if (data.type === "closed" || data.type === "not-robbing") {
					showLoadingModal.value = false;
					if (data.type === "closed") {
						showToast({ text: "O acompanhamento do roubo foi interrompido.", variant: "error" });
					}
					void refetchStatus();
					return;
				}
			}
		}
	} catch (error) {
		if ((error as Error).name !== "AbortError") {
			showLoadingModal.value = false;
			showToast({ text: "Não foi possível acompanhar o resultado do roubo.", variant: "error" });
			void refetchStatus();
		}
	} finally {
		sseInProgress = false;
	}
}

onMounted(async () => {
	await new Promise<void>((resolve) => {
		const unwatch = watch(
			status,
			(value) => {
				if (value) {
					unwatch();
					resolve();
				}
			},
			{ immediate: true },
		);
	});
	if (isRobbingLocation.value) {
		showLoadingModal.value = true;
		void listenToRobberySSE();
	}
});

onBeforeUnmount(() => sseAbortController?.abort());
</script>

<template>
	<div class="rob-page">
		<PageTitle
			title="Roubar"
			subtitle="Encontre um alvo e roube tudo!"
		/>
		<div class="rob-page__rules">
			<p>
				Quanto maior seu ATK, maiores suas chances de roubo à outros jogadores e mais locais ficam disponíveis. Quanto
				maior sua DEF, mais protegido você estará.
			</p>
			<p>
				Se falhar, você será preso por um tempo definido pelo seu ATK. Se conseguir, será procurado pela polícia e
				deverá esperar 1 hora para roubar novamente.
			</p>
			<p>Há uma pequena chance do alvo ser também espancado!</p>
		</div>

		<div
			v-if="isLoading"
			class="rob-page__loading"
			role="status"
			aria-label="Carregando locais"
		>
			<div class="rob-grid">
				<div
					v-for="index in 4"
					:key="index"
					class="rob-card rob-card--skeleton"
				>
					<BaseSkeleton height="2rem" />
					<BaseSkeleton height="3rem" />
				</div>
			</div>
			<BaseSkeleton class="rob-page__loading-aside" />
		</div>

		<div
			v-else-if="locationsError"
			class="rob-error"
			role="alert"
		>
			<p>Erro ao carregar locais de roubo.</p>
		</div>

		<div
			v-else
			class="rob-page__layout"
		>
			<section
				class="rob-page__list"
				aria-label="Locais disponíveis para roubo"
			>
				<ul class="rob-grid">
					<li
						v-for="location in locations"
						:key="location.id"
						class="rob-card"
					>
						<div class="rob-card__row">
							<div class="rob-card__header">
								<h2 class="rob-card__name">
									<NuxtImg
										:src="getLocationImageUrl(location.id)"
										alt=""
										width="44"
										height="44"
									/>
									{{ location.name }}
									<span
										v-if="location.needAttack > 0"
										class="rob-card__atk"
									>
										<NuxtImg
											:src="imagePaths.attributes.attack"
											alt=""
											width="18"
											height="18"
										/>
										{{ location.needAttack }}
										ATK
									</span>
								</h2>
								<p class="rob-card__description">{{ location.description }}</p>
							</div>
							<div class="rob-card__actions">
								<BaseButton
									:variant="canRob(location) ? 'primary' : 'secondary'"
									:disabled="!canRob(location) || startingRobbery"
									:loading="startingRobbery && selectedLocationId === location.id"
									@click="openConfirmModal(location.id)"
								>
									{{ getRobButtonText(location) }}
								</BaseButton>
								<button
									type="button"
									class="rob-card__chevron"
									:class="{ 'rob-card__chevron--expanded': expandedLocations.has(location.id) }"
									:aria-expanded="expandedLocations.has(location.id)"
									:aria-label="expandedLocations.has(location.id) ? 'Fechar detalhes' : 'Abrir detalhes'"
									@click="toggleLocationDetails(location.id)"
								>
									<ChevronDown :size="20" />
								</button>
							</div>
						</div>
						<div class="rob-card__details-wrap">
							<dl
								:class="{ 'rob-card__details--collapsed': !expandedLocations.has(location.id) }"
								class="rob-card__details"
							>
								<div>
									<dt>Chance de sucesso</dt>
									<dd>{{ location.successChance }}%</dd>
								</div>
								<div>
									<dt>Você pode roubar</dt>
									<dd>{{ formatMoney(location.rewardMin) }} - {{ formatMoney(location.rewardMax) }}</dd>
								</div>
							</dl>
						</div>
					</li>
				</ul>
			</section>

			<aside
				class="rob-page__aside"
				:class="{ 'rob-page__aside--open': asideOpen }"
				aria-label="Resumo de roubos"
			>
				<div class="rob-page__aside-header">
					<div class="rob-page__aside-title">
						<RobberyIcon
							:size="24"
							variant="solid"
						/>
						<h2>Resumo</h2>
					</div>
					<button
						type="button"
						class="rob-page__aside-close"
						aria-label="Fechar resumo"
						@click="asideOpen = false"
					>
						<ChevronDown :size="20" />
					</button>
				</div>
				<div class="rob-page__aside-body">
					<dl class="rob-page__stats">
						<div>
							<dt>Roubos bem-sucedidos</dt>
							<dd>{{ activity?.robberySuccessCount ?? 0 }}</dd>
						</div>
						<div>
							<dt>Falhas</dt>
							<dd>{{ activity?.robberyFailureCount ?? 0 }}</dd>
						</div>
						<div>
							<dt>Total roubado</dt>
							<dd>{{ formatMoney(activity?.robberySuccessRobbedSum ?? 0) }}</dd>
						</div>
						<div>
							<dt>Vezes que outros usuários roubaram você</dt>
							<dd>{{ activity?.robberyBeingRobbedCount ?? 0 }}</dd>
						</div>
						<div>
							<dt>Total roubado de você</dt>
							<dd>{{ formatMoney(activity?.robberyBeingRobbedSum ?? 0) }}</dd>
						</div>
					</dl>
					<div
						v-if="isRobbingLocation"
						class="rob-page__status"
					>
						<h3>Roubo em andamento</h3>
						<p>{{ currentLocationName }}</p>
						<p>Aguarde o resultado...</p>
					</div>
					<div
						v-else-if="prisonTime"
						class="rob-page__cooldown rob-page__cooldown--prison"
					>
						<h3>Você não pode roubar enquanto está preso!</h3>
						<p>
							Será solto em <time :datetime="prisonTime.toISOString()">{{ distance(new Date(), prisonTime) }}</time>
						</p>
					</div>
					<div
						v-else-if="wantedTime"
						class="rob-page__cooldown"
					>
						<h3>Você está sendo procurado e poderá roubar novamente em</h3>
						<time :datetime="wantedTime.toISOString()">{{ distance(new Date(), wantedTime) }}</time>
					</div>
					<p
						v-else
						class="rob-page__idle"
					>
						Pronto para roubar!
					</p>
				</div>
			</aside>

			<button
				type="button"
				class="rob-page__aside-toggle"
				:aria-label="asideOpen ? 'Fechar estatísticas' : 'Abrir estatísticas'"
				:aria-expanded="asideOpen"
				@click="asideOpen = !asideOpen"
			>
				<RobberyIcon
					:size="28"
					variant="normal"
				/>
			</button>
		</div>

		<BaseModal
			v-model:open="showConfirmModal"
			title="Confirmar roubo"
		>
			<p>
				Tem certeza que deseja roubar
				<strong>{{ locations.find((loc) => loc.id === selectedLocationId)?.name }}</strong>?
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
					:loading="startingRobbery"
					@click="handleStartRobbery"
				>
					Roubar
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			class="rob-modal-loading"
			:open="showLoadingModal"
			title="Roubo em andamento"
			@update:open="showLoadingModal = $event"
		>
			<div class="rob-modal-loading__content">
				<NuxtImg
					:src="imagePaths.situations.robbery"
					width="100"
					alt=""
				/>
				<div
					class="rob-modal-loading__spinner"
					role="status"
					aria-label="Carregando"
				/>
				<p>{{ currentLocationName ? `Tentando roubar ${currentLocationName}...` : "Tentando roubar..." }}</p>
			</div>
		</BaseModal>

		<BaseModal
			:open="showResultModal"
			:title="resultSuccess ? 'Roubo bem-sucedido!' : 'Roubo fracassado'"
			@update:open="showResultModal = $event"
		>
			<div class="rob-result">
				<template v-if="resultSuccess">
					<p>Você roubou <strong>{{ formatMoney(resultMoney) }}</strong> de {{ resultLocationName }}.</p>
					<p v-if="resultWantedTime">Poderá roubar novamente em {{ distance(new Date(), resultWantedTime) }}.</p>
				</template>
				<template v-else>
					<p>Você falhou na tentativa de roubar {{ resultLocationName }}.</p>
					<p class="rob-result__prison-text">
						<PrisonIcon
							:size="20"
							variant="solid"
						/>
						{{ resultPrisonText }}
					</p>
					<p
						v-if="resultPrisonTime"
						class="rob-result__free-text"
					>
						Será solto em {{ relative(resultPrisonTime) }}.
					</p>
				</template>
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

.rob-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.rob-page__rules {
	margin: 0;
	padding: $spacing-md;
	color: $text-secondary;
	background: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-sm;

	p {
		margin-bottom: $spacing-sm;
	}
}

.rob-page__loading,
.rob-page__layout {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 320px;
	gap: $spacing-lg;
	position: relative;
}

.rob-page__loading-aside {
	width: unset !important;
	height: unset !important;
}

.rob-page__list,
.rob-card__header {
	min-width: 0;
}

.rob-grid {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
	margin: 0;
	padding: 0;
}

.rob-card {
	list-style: none;
	padding: $spacing-md;
	background: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-sm;

	&--skeleton {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}
}

.rob-card__row,
.rob-card__name,
.rob-card__actions {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.rob-card__row {
	justify-content: space-between;
}

.rob-card__name {
	flex-wrap: wrap;
	margin: 0;
	color: $text-primary;
	font-size: $font-size-16;
}

.rob-card__name img {
	object-fit: contain;
}

.rob-card__atk {
	display: inline-flex;
	align-items: center;
	color: $color-attribute;
	font-size: $font-size-12;
}

.rob-card__description {
	margin: $spacing-sm 0 0;
	color: $text-secondary;
	font-size: $font-size-12;
}

.rob-card__actions {
	margin-left: auto;
}

.rob-card__chevron,
.rob-page__aside-close {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 0;
	background: transparent;
	color: $text-secondary;
	cursor: pointer;
}

.rob-card__chevron {
	transition: color 0.15s ease, transform 0.2s ease;

	&:hover {
		color: $text-primary;
	}

	&--expanded {
		transform: rotate(180deg);
	}
}

.rob-card__details-wrap {
	overflow: hidden;
	max-height: 0;
	opacity: 0;
	margin-top: 0;
	transition: max-height 0.25s ease, opacity 0.2s ease, margin-top 0.25s ease;

	&:has(.rob-card__details:not(.rob-card__details--collapsed)) {
		max-height: 500px;
		opacity: 1;
		margin-top: $spacing-md;
	}
}

.rob-card__details {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-lg;
	margin: 0;
	padding-top: $spacing-sm;
	border-top: 1px solid $border-card;
}

.rob-card__details dt,
.rob-page__stats dt {
	color: $text-secondary;
	font-size: $font-size-12;
}

.rob-card__details dd,
.rob-page__stats dd {
	margin: $spacing-xs 0 0;
	color: $text-primary;
	font-size: $font-size-14;
	font-weight: $font-weight-semibold;
}

.rob-card__details--collapsed {
	visibility: hidden;
}

.rob-page__aside {
	position: sticky;
	top: $spacing-lg;
	display: flex;
	flex-direction: column;
	max-height: calc(100dvh - 200px);
	overflow: hidden;
	background: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-md;
}

.rob-page__aside-header,
.rob-page__aside-title {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.rob-page__aside-header {
	justify-content: space-between;
	padding: $spacing-md;
	border-bottom: 1px solid $border-card;
}

.rob-page__aside-title {
	color: $text-primary;
	font-weight: $font-weight-semibold;

	h2 {
		margin: 0;
		font-size: inherit;
	}
}

.rob-page__aside-close {
	display: none;
}

.rob-page__aside-body {
	display: flex;
	flex: 1;
	flex-direction: column;
	justify-content: space-between;
	gap: $spacing-md;
	padding: $spacing-md;
	overflow-y: auto;
}

.rob-page__stats {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	margin: 0;

	div {
		padding: $spacing-sm;
		border: 1px solid $border-card;
		border-radius: $radius-sm;
	}
}

.rob-page__status,
.rob-page__cooldown {
	padding: $spacing-md;
	background: color-mix(in lab, $bg-card 100%, $color-robbery 10%);
	border: 1px solid $color-robbery;
	border-radius: $radius-sm;
}

.rob-page__status h3,
.rob-page__cooldown h3 {
	margin: 0 0 $spacing-xs;
	color: $text-secondary;
	font-size: $font-size-12;
}

.rob-page__status p,
.rob-page__cooldown p,
.rob-page__idle {
	margin: 0;
	color: $text-primary;
	font-size: $font-size-14;
}

.rob-page__idle,
.rob-error {
	padding: $spacing-lg 0;
	color: $text-secondary;
	text-align: center;
}

.rob-page__aside-toggle {
	display: none;
}

.rob-modal-loading {
	:deep(.base-modal__header) {
		display: none;
	}
}

.rob-modal-loading__content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-md;

	p {
		margin: 0;
		color: $text-secondary;
		text-align: center;
	}
}

.rob-modal-loading__spinner {
	width: 3rem;
	height: 3rem;
	border: 3px solid $border-card;
	border-top-color: $color-brand;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.rob-result {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;

	p {
		margin: 0;
	}

	&__prison-text {

		svg {
			vertical-align: sub;
		}
	}

	&__free-text {
		color: $text-secondary;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
	.rob-page__loading,
	.rob-page__layout {
		grid-template-columns: 1fr;
	}

	.rob-page__loading-aside {
		display: none;
	}

	.rob-page__aside {
		position: fixed;
		top: 30dvh;
		left: 50%;
		bottom: 0;
		width: 320px;
		max-width: 85vw;
		max-height: 100vh;
		border-radius: $radius-md $radius-md 0 0;
		transform: translate(-50%, 100%);
		transition: transform 0.2s ease;
		z-index: 100;
		box-shadow: $shadow-lg;

		&--open {
			transform: translate(-50%, 0);
		}
	}

	.rob-page__aside-close {
		display: inline-flex;
	}

	.rob-page__aside-toggle {
		position: fixed;
		bottom: 1rem;
		left: calc(50% - 2rem);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		background: $bg-sidebar;
		color: $text-primary;
		box-shadow: $shadow-lg;
		z-index: 2;
	}
}

@media (max-width: 600px) {
	.rob-card__row {
		align-items: flex-start;
		flex-direction: column;
	}

	.rob-card__actions {
		width: 100%;
		justify-content: flex-end;
	}
}

@media (prefers-reduced-motion: reduce) {
	.rob-page__aside,
	.rob-card__chevron,
	.rob-card__details-wrap,
	.rob-modal-loading__spinner {
		transition: none !important;
		animation: none !important;
	}
}
</style>
