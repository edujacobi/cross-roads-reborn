<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { Bell, BellOff, ChevronDown, X } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import InvestmentIcon from "~/components/icons/InvestmentIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useDateFormat } from "~/composables/useDateFormat";
import { useInvestment } from "~/composables/useInvestment";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { imagePaths } from "~/constants/imagePaths";
import {
	AbandonInvestmentDocument,
	BuyInvestmentDocument,
	GetMyInvestmentPageDocument,
	type GetMyInvestmentPageQuery,
	HireInvestmentHenchmanDocument,
	ToggleInvestmentYieldNotificationsDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Investimentos",
});

type InvestmentOption = GetMyInvestmentPageQuery["myInvestmentPage"]["investments"][number];

const auth = useAuth();
const { formatMoney } = useMoneyFormat();
const { distance } = useDateFormat();
const { getInvestmentImageUrl } = useInvestment();
const { showToast } = useToast();

const {
	result: pageResult,
	loading: pageLoading,
	error: pageError,
	refetch: refetchPage,
} = useQuery(GetMyInvestmentPageDocument, {}, { fetchPolicy: "cache-and-network" });
const page = computed(() => pageResult.value?.myInvestmentPage);
const investments = computed(() => page.value?.investments ?? []);
const investment = computed(() => page.value?.investment ?? null);
const currentInvestment = computed(
	() => investments.value.find((option) => option.id === investment.value?.id) ?? null,
);

const { mutate: buyInvestment, loading: buying } = useMutation(BuyInvestmentDocument);
const { mutate: abandonInvestment, loading: abandoning } = useMutation(AbandonInvestmentDocument);
const { mutate: hireHenchman, loading: hiring } = useMutation(HireInvestmentHenchmanDocument);
const { mutate: toggleNotifications, loading: togglingNotifications } = useMutation(
	ToggleInvestmentYieldNotificationsDocument,
);

const showBuyModal = ref(false);
const showAbandonModal = ref(false);
const showHenchmanModal = ref(false);
const selectedInvestment = ref<InvestmentOption | null>(null);
const asideOpen = ref(false);
const lastFocusedElement = ref<HTMLElement | null>(null);

function canBuy(option: InvestmentOption) {
	return !!page.value?.isIdling && !investment.value && page.value.money >= option.price;
}

function openBuyModal(option: InvestmentOption) {
	selectedInvestment.value = option;
	showBuyModal.value = true;
}

async function refreshPage() {
	await Promise.all([refetchPage(), auth.fetchUser()]);
}

async function confirmBuy() {
	if (!selectedInvestment.value) return;

	try {
		const response = await buyInvestment({ investmentId: selectedInvestment.value.id });
		const result = response?.data?.buyInvestment;
		if (!result) {
			showToast({ text: "Não foi possível comprar o investimento.", variant: "error" });
			return;
		}

		showToast({ text: result.message, variant: result.success ? "success" : "error" });
		if (result.success) {
			showBuyModal.value = false;
			selectedInvestment.value = null;
			await refreshPage();
		}
	} catch {
		showToast({ text: "Não foi possível comprar o investimento. Tente novamente.", variant: "error" });
	}
}

async function confirmAbandon() {
	try {
		const response = await abandonInvestment();
		const result = response?.data?.abandonInvestment;
		if (!result) {
			showToast({ text: "Não foi possível abandonar o investimento.", variant: "error" });
			return;
		}

		showToast({ text: result.message, variant: result.success ? "success" : "error" });
		if (result.success) {
			showAbandonModal.value = false;
			await refreshPage();
		}
	} catch {
		showToast({ text: "Não foi possível abandonar o investimento. Tente novamente.", variant: "error" });
	}
}

async function confirmHireHenchman() {
	try {
		const response = await hireHenchman();
		const result = response?.data?.hireInvestmentHenchman;
		if (!result) {
			showToast({ text: "Não foi possível contratar o capanga.", variant: "error" });
			return;
		}

		showToast({ text: result.message, variant: result.success ? "success" : "error" });
		if (result.success) {
			showHenchmanModal.value = false;
			await refreshPage();
		}
	} catch {
		showToast({ text: "Não foi possível contratar o capanga. Tente novamente.", variant: "error" });
	}
}

async function toggleYieldNotifications() {
	try {
		const response = await toggleNotifications();
		const result = response?.data?.toggleInvestmentYieldNotifications;
		if (!result) {
			showToast({ text: "Não foi possível atualizar as notificações.", variant: "error" });
			return;
		}

		showToast({ text: result.message, variant: result.success ? "success" : "error" });
		if (result.success) await refreshPage();
	} catch {
		showToast({ text: "Não foi possível atualizar as notificações. Tente novamente.", variant: "error" });
	}
}

function toggleAside() {
	if (asideOpen.value) {
		asideOpen.value = false;
		lastFocusedElement.value?.focus();
	} else {
		lastFocusedElement.value = document.activeElement as HTMLElement | null;
		asideOpen.value = true;
	}
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === "Escape" && asideOpen.value) toggleAside();
}

onMounted(() => window.addEventListener("keydown", handleKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
</script>

<template>
	<div class="investments-page">
		<PageTitle
			title="Investimentos"
			subtitle="Compre um negócio, receba lucros por hora enquanto estiver vadiando e proteja seu patrimônio. Gangues podem atacar seus investimentos."
		/>

		<div
			v-if="pageLoading && !page"
			class="investments-loading"
			role="status"
			aria-label="Carregando investimentos"
		>
			<ul class="investments-list">
				<li
					v-for="i in 6"
					:key="i"
					class="investment-card investment-card--skeleton"
				>
					<BaseSkeleton
						width="7rem"
						height="7rem"
					/>
					<div class="investment-card__skeleton-details">
						<BaseSkeleton
							width="12rem"
							height="1.25rem"
						/>
						<BaseSkeleton width="100%" />
						<BaseSkeleton width="8rem" />
					</div>
				</li>
			</ul>
			<BaseSkeleton class="investments-loading__aside" />
		</div>

		<p
			v-else-if="pageError"
			class="investments-error"
			role="alert"
		>
			Não foi possível carregar os investimentos.
		</p>

		<div
			v-else-if="page"
			class="investments-page__layout"
		>
			<section
				class="investments-page__list"
				aria-label="Investimentos disponíveis"
			>
				<ul class="investments-list">
					<li
						v-for="option in investments"
						:key="option.id"
						class="investment-card"
						:class="{ 'investment-card--owned': investment?.id === option.id }"
					>
						<NuxtImg
							class="investment-card__image"
							:src="getInvestmentImageUrl(option.id)"
							:alt="option.name"
							width="112"
							height="112"
						/>
						<div class="investment-card__content">
							<div class="investment-card__heading">
								<h2 class="investment-card__name">{{ option.name }}</h2>
								<p class="investment-card__description">{{ option.description }}</p>
							</div>
							<dl class="investment-card__stats">
								<div>
									<dt>Lucro por hora</dt>
									<dd>{{ formatMoney(option.hourlyYield) }}</dd>
								</div>
								<div>
									<dt>Defesa</dt>
									<dd class="investment-card__stat attribute">
										<NuxtImg
											:src="imagePaths.attributes.defense"
											width="20"
										/>
										{{ option.defense }} DEF
									</dd>
								</div>
								<div>
									<dt>Taxa do capanga</dt>
									<dd class="investment-card__stat">
										<NuxtImg
											:src="imagePaths.classes.mafioso"
											width="20"
										/>
										{{ option.henchmanFee }}%
									</dd>
								</div>
							</dl>
						</div>
						<div class="investment-card__action">
							<p class="investment-card__price">{{ formatMoney(option.price) }}</p>
							<BaseButton
								:variant="canBuy(option) ? 'primary' : 'secondary'"
								:disabled="!canBuy(option) || buying"
								@click="openBuyModal(option)"
								v-if="!investment"
							>
								{{
									!page.isIdling ? "Disponível ao vadiar" : page.money < option.price ? "Saldo insuficiente" : "Comprar"
								}}
							</BaseButton>
						</div>
					</li>
				</ul>
			</section>

			<aside
				class="investments-page__aside"
				:class="{ 'investments-page__aside--open': asideOpen }"
				aria-label="Resumo do investimento"
			>
				<div class="investments-page__aside-header">
					<div class="investments-page__aside-title">
						<InvestmentIcon
							:size="24"
							variant="solid"
							aria-hidden="true"
						/>
						<h2>Gerenciar</h2>
					</div>
					<button
						type="button"
						class="investments-page__aside-close"
						aria-label="Fechar gerenciamento"
						@click="toggleAside"
					>
						<ChevronDown :size="20" />
					</button>
				</div>

				<div class="investments-page__aside-body">
					<dl class="investments-page__stats">
						<div class="investments-page__stat">
							<dt>Sua grana</dt>
							<dd>{{ formatMoney(page.money) }}</dd>
						</div>
						<div class="investments-page__stat">
							<dt>Situação</dt>
							<dd>{{ page.isIdling ? "Vadiando" : "Ocupado" }}</dd>
						</div>
					</dl>

					<section
						v-if="investment && currentInvestment"
						class="investments-page__current"
						aria-label="Investimento atual"
					>
						<div class="investments-page__current-heading">
							<NuxtImg
								class="investments-page__investment_image"
								:src="getInvestmentImageUrl(investment.id)"
								:alt="currentInvestment.name"
							/>
							<div>
								<h3>{{ currentInvestment.name }}</h3>
								<p>{{ formatMoney(currentInvestment.hourlyYield) }} / hora</p>
							</div>
						</div>
						<dl class="investments-page__current-details">
							<div>
								<dt>Lucro acumulado</dt>
								<dd>{{ formatMoney(investment.accumulatedYield) }}</dd>
							</div>
							<div>
								<dt>Defesa</dt>
								<dd class="attribute">
									<NuxtImg
										:src="imagePaths.attributes.defense"
										width="21"
									/>
									{{ investment.defense }} DEF
								</dd>
							</div>
							<div>
								<dt>Próximo pagamento</dt>
								<dd>em {{ distance(new Date(), new Date(page.nextPaymentAt)) }}</dd>
							</div>
							<div>
								<dt>Expira</dt>
								<dd>em {{ distance(new Date(), new Date(investment.expiresAt)) }}</dd>
							</div>
						</dl>
						<p
							v-if="investment.henchmanHospitalized"
							class="investments-page__henchman-status"
							role="status"
						>
							Seu capanga está hospitalizado.
						</p>
						<p
							v-else-if="investment.hasHenchman && investment.henchmanEndsAt"
							class="investments-page__henchman-status"
							role="status"
						>
							Capanga contratado até {{ distance(new Date(), new Date(investment.henchmanEndsAt)) }}.
						</p>
						<div class="investments-page__actions">
							<BaseButton
								variant="success"
								:disabled="investment.hasHenchman || hiring"
								@click="showHenchmanModal = true"
							>
								<NuxtImg
									:src="imagePaths.classes.mafioso"
									width="18"
								/>
								{{ investment.hasHenchman ? "Capanga contratado" : "Contratar capanga" }}
							</BaseButton>
							<BaseButton
								variant="secondary"
								:disabled="togglingNotifications"
								@click="toggleYieldNotifications"
							>
								<component
									:is="investment.notifyYield ? BellOff : Bell"
									:size="16"
								/>
								{{ investment.notifyYield ? "Desativar notificações" : "Ativar notificações" }}
							</BaseButton>
							<BaseButton
								variant="danger"
								:disabled="!page.isIdling || abandoning"
								@click="showAbandonModal = true"
							>
								<X :size="16" />
								{{ page.isIdling ? "Abandonar investimento" : "Vadiar para abandonar" }}
							</BaseButton>
						</div>
					</section>
					<p
						v-else
						class="investments-page__idle"
					>
						Você ainda não possui um investimento.
					</p>
				</div>
			</aside>

			<button
				type="button"
				class="investments-page__aside-toggle"
				:aria-label="asideOpen ? 'Fechar gerenciamento' : 'Abrir gerenciamento'"
				:aria-expanded="asideOpen"
				@click="toggleAside"
			>
				<InvestmentIcon
					:size="28"
					variant="normal"
					aria-hidden="true"
				/>
				<span
					v-if="investment"
					class="investments-page__aside-toggle-badge"
					aria-hidden="true"
				>
					!
				</span>
			</button>
		</div>

		<BaseModal
			v-model:open="showBuyModal"
			title="Confirmar compra"
			:description="selectedInvestment ? `Comprar ${selectedInvestment.name} por ${formatMoney(selectedInvestment.price)}?` : undefined"
		>
			<p>
				O investimento dura 7 dias. Os lucros são pagos por hora quando você está vadiando; caso contrário, ficam
				acumulados.
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showBuyModal = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					:disabled="buying"
					@click="confirmBuy"
				>
					{{ buying ? "Comprando..." : "Confirmar compra" }}
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			v-model:open="showHenchmanModal"
			title="Contratar capanga?"
		>
			<p v-if="currentInvestment">
				O capanga protegerá seu investimento por 12 horas, adicionando +10 DEF.
				<br>
				<br>
				Porém, ele fica com <strong>{{ currentInvestment.henchmanFee }}% do lucro por hora</strong> como taxa.
				<br>
				<br>
				Caso o investimento seja atacado e roubado, o capanga será Hospitalizado e não conseguirá mais defendê-lo, mas
				seu contrato continua.
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showHenchmanModal = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="success"
					:disabled="hiring"
					@click="confirmHireHenchman"
				>
					{{ hiring ? "Contratando..." : "Confirmar contratação" }}
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			v-model:open="showAbandonModal"
			title="Abandonar investimento?"
		>
			<p>Você perderá o investimento e todo o lucro acumulado. Não há reembolso.</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showAbandonModal = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="danger"
					:disabled="abandoning"
					@click="confirmAbandon"
				>
					{{ abandoning ? "Abandonando..." : "Sim, abandonar" }}
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
@use "~/assets/scss/mixins" as *;

.investments-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	.investments-loading {
		min-width: 0;
		display: flex;
		gap: $spacing-lg;

		&__aside {
			max-width: 320px;
			flex: 1;
		}
	}

	&__layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: $spacing-lg;
		position: relative;

		@media (max-width: 1024px) {
			grid-template-columns: 1fr;
		}
	}

	&__list {
		min-width: 0;
		container-type: inline-size;
		container-name: page;
	}

	&__aside {
		position: sticky;
		top: $spacing-lg;
		max-height: calc(100dvh - 100px);
		display: flex;
		flex-direction: column;
		background-color: $bg-card;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		overflow: hidden;

		@media (max-width: 1024px) {
			position: fixed;
			top: 20dvh;
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
			color: $text-primary;

			h2 {
				margin: 0;
				font-size: $font-size-16;
				font-weight: $font-weight-semibold;
			}
		}

		&-close {
			display: none;
			padding: $spacing-xs;
			border: 0;
			border-radius: $radius-sm;
			background: none;
			color: $text-secondary;
			cursor: pointer;

			@media (max-width: 1024px) {
				display: block;
			}
		}

		&-body {
			@include scrollbar-custom;
			flex: 1;
			overflow-y: auto;
			padding: $spacing-md;
			display: flex;
			flex-direction: column;
			gap: $spacing-md;
		}
	}

	&__investment_image {
		border-radius: $radius-xs;
		border: 1px solid $border-card;
	}

	&__stats,
	&__current-details {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		margin: 0;

		> div {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: $spacing-sm;
			padding: $spacing-sm;
			border: 1px solid $border-card;
			border-radius: $radius-sm;
		}

		dt {
			color: $text-secondary;
			font-size: $font-size-12;
		}

		dd {
			display: flex;
			align-items: center;
			gap: $spacing-xs;
			margin: 0;
			color: $text-primary;
			font-size: $font-size-14;
			font-weight: $font-weight-semibold;
			text-align: right;

			&.attribute {
				gap: 0;
				color: $color-attribute;
			}
		}
	}

	&__current {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	&__current-heading {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;

		img {
			width: 100%;
			object-fit: contain;
		}

		h3,
		p {
			margin: 0;
		}

		h3 {
			color: $text-primary;
			font-size: $font-size-14;
		}

		p {
			margin-top: $spacing-xs;
			color: $text-secondary;
			font-size: $font-size-12;
		}
	}

	&__henchman-status,
	&__notice {
		margin: 0;
		color: $text-secondary;
		font-size: $font-size-12;
	}

	&__actions {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;

		:deep(.base-button) {
			width: 100%;
		}
	}

	&__idle {
		padding: $spacing-lg 0;
		color: $text-secondary;
		text-align: center;
	}

	&__aside-toggle {
		display: none;
		position: fixed;
		bottom: 1rem;
		left: calc(50% - 2rem);
		width: 4rem;
		height: 4rem;
		align-items: center;
		justify-content: center;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		background-color: $bg-sidebar;
		color: $text-primary;
		cursor: pointer;
		box-shadow: $shadow-lg;
		z-index: 2;

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
			background-color: $color-investment;
			color: #000;
			border-radius: 999px;
			font-size: $font-size-12;
			font-weight: $font-weight-bold;
		}
	}

	.investments-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.investment-card {
		display: grid;
		grid-template-columns: 7rem minmax(0, 1fr) auto;
		align-items: center;
		gap: $spacing-md;
		padding: $spacing-md;
		background-color: $bg-card;
		border: 1px solid $border-card;
		border-radius: $radius-sm;

		&--owned {
			background-color: color-mix(in lab, $bg-card, $color-brand 10%);
			border-color: color-mix(in lab, $border-card, $color-brand 50%);
		}

		&--skeleton {
			pointer-events: none;
		}

		&__image {
			width: 7rem;
			height: 7rem;
			object-fit: contain;
			border: 1px solid $border-card;
			border-radius: $radius-xs;
		}

		&__content {
			display: flex;
			flex-direction: column;
			gap: $spacing-sm;
			min-width: 0;
		}

		&__name {
			margin: 0;
			color: $text-primary;
			font-size: $font-size-16;
			font-weight: $font-weight-semibold;
		}

		&__description {
			margin: $spacing-xs 0 0;
			color: $text-secondary;
			font-size: $font-size-12;
		}

		&__stats {
			display: flex;
			flex-wrap: wrap;
			gap: $spacing-sm $spacing-lg;
			margin: 0;

				> div {
					min-width: 0;
				}

				dt {
					color: $text-muted;
					font-size: $font-size-12;
				}

				dd {
				margin: 0.125rem 0 0;
				color: $text-primary;
				font-size: $font-size-12;
				font-weight: $font-weight-semibold;
				overflow-wrap: anywhere;
				}
		}

		&__stat {
			display: flex;
			align-items: center;
			gap: $spacing-xs;

			&.attribute {
				gap: 0;
				color: $color-attribute;
			}
		}

		&__action {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: $spacing-sm;
		}

		&__price {
			margin: 0;
			color: $text-primary;
			font-weight: $font-weight-bold;
		}

		&__skeleton-details {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: $spacing-sm;
		}

		@container page (max-width: 600px) {
			grid-template-columns: 5rem minmax(0, 1fr);

			&__image {
				width: 5rem;
				height: 5rem;
				grid-row: span 2;
			}

			&__action {
				grid-column: 2;
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				width: 100%;
			}
		}

		@container page (max-width: 400px) {
			grid-template-columns: 4rem minmax(0, 1fr);

			&__image {
				width: 4rem;
				height: 4rem;
				grid-row: auto;
			}

			&__content {
				display: contents;
			}

			&__heading {
				grid-column: 2;
				min-width: 0;
			}

			&__stats {
				grid-column: 1 / -1;
			}

			&__action {
				grid-column: 1 / -1;
				display: grid;
				grid-template-columns: 1fr;
				width: 100%;

				:deep(.base-button) {
					width: 100%;
					min-width: 0;
					white-space: normal;
					text-align: center;
				}
			}
		}
	}

	.investments-error {
		padding: $spacing-xl;
		color: $text-secondary;
		text-align: center;
	}

	@media (prefers-reduced-motion: reduce) {
		&__aside {
			transition: none !important;
		}
	}
}
</style>
