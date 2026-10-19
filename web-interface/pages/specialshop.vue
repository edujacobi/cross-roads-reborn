<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed, nextTick, ref } from "vue";
import SpecialShopIcon from "~/components/icons/SpecialShopIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useFallbackUserImage } from "~/composables/useFallbackImage";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import {
	BuySpecialShopItemDocument,
	BuySpecialShopVipDocument,
	GetSpecialShopDocument,
	GetUserProfileDocument,
	SetOwnDecorationDocument,
	SpecialShopItemType,
	UserDecorationType,
} from "~/graphql/generated";
import { AvatarDecorationId, BackgroundDecorationId } from "../../src/core/types/Ids";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Loja especial",
});

type ShopTabId = "vip" | "skinBundles" | "avatarDecorations" | "backgroundDecorations";

type PendingPurchase =
	| { kind: "VIP_DAYS"; days: number; name: string; price: number }
	| { kind: "ITEM"; type: SpecialShopItemType; itemId: number; name: string; price: number };

const shopTabs: { id: ShopTabId; label: string }[] = [
	{ id: "vip", label: "VIP" },
	{ id: "skinBundles", label: "Pacotes de skins" },
	{ id: "avatarDecorations", label: "Decorações de avatar" },
	{ id: "backgroundDecorations", label: "Decorações de fundo" },
];

const auth = useAuth();
const { formatPlain } = useMoneyFormat();
const { showToast } = useToast();
const userId = computed(() => auth.user.value?.userId ?? "");
const activeTab = ref<ShopTabId>("vip");
const tabList = ref<HTMLElement | null>(null);
const purchaseDialogOpen = ref(false);
const pendingPurchase = ref<PendingPurchase | null>(null);
const vipDays = ref(7);

const {
	result: profileResult,
	loading: profileLoading,
	error: profileError,
	refetch: refetchProfile,
} = useQuery(GetUserProfileDocument, () => ({ id: userId.value }), {
	enabled: computed(() => !!userId.value),
	fetchPolicy: "cache-and-network",
});
const profile = computed(() => profileResult.value?.user);
const specialCoinBalance = computed(() => profile.value?.specialCoin ?? 0);
const avatarUrl = computed(() => profile.value?.avatarUrl || useFallbackUserImage(userId.value));

const {
	result: shopResult,
	loading: shopLoading,
	error: shopError,
	refetch: refetchShop,
} = useQuery(
	GetSpecialShopDocument,
	{},
	{
		fetchPolicy: "cache-and-network",
	},
);
const specialShop = computed(() => shopResult.value?.specialShop);
const vipMinimumDays = computed(() => specialShop.value?.vipMinimumDays ?? 7);
const vipPricePerDay = computed(() => specialShop.value?.vipPricePerDay ?? 170);
const vipPrice = computed(() => vipDays.value * vipPricePerDay.value);

const { mutate: buySpecialShopItem, loading: buyingItem } = useMutation(BuySpecialShopItemDocument);
const { mutate: buySpecialShopVip, loading: buyingVip } = useMutation(BuySpecialShopVipDocument);
const { mutate: setOwnDecoration, loading: settingDecoration } = useMutation(SetOwnDecorationDocument);
const buying = computed(() => buyingItem.value || buyingVip.value);

const supportedAvatarPreviewClasses = new Set([
	"vip",
	"developer",
	"moderator",
	"helper",
	"purple",
	"sunset",
	"sunrise",
	"cloud",
	"frutiger_aero",
	"silver",
	"rainbow",
	"botanical_garden",
	"pistol",
	"machine_pistol",
	"hunt_rifle",
	"shotgun",
	"smg",
	"assault_rifle",
	"carbine",
	"sniper",
	"katana",
	"rpg",
	"minigun",
	"bazooka",
]);

const vipBenefits = [
	"Insígnia e decoração de avatar exclusivas no perfil, inventário e ranking.",
	"50% de bônus na recompensa diária.",
	"Acesso ao canal de desenvolvimento.",
	"Menos tempo de espera entre comandos.",
	"Entrega esmolas 50% maiores.",
	"25% de desconto no Bilhete Premiado.",
	"25% de desconto na troca de Classe e Nickname.",
	"Acesso à categoria VIP no servidor Cross Roads Reborn.",
	"Cargo VIP no servidor Cross Roads Reborn.",
	"Muitos mais por vir!",
] as const;

const loading = computed(() => profileLoading.value || shopLoading.value);
const loadError = computed(() => profileError.value || shopError.value);
const canBuyVip = computed(
	() =>
		Number.isSafeInteger(vipDays.value) &&
		vipDays.value >= vipMinimumDays.value &&
		Number.isSafeInteger(vipPrice.value) &&
		vipPrice.value <= specialCoinBalance.value &&
		!buying.value,
);
const vipStatus = computed(() => {
	if (profile.value?.vipEternal) return "Você possui VIP Eterno!";
	if (profile.value?.isVip && profile.value.vipTime) {
		return `Seu VIP está ativo até ${new Date(profile.value.vipTime).toLocaleDateString("pt-BR")}.`;
	}
	return "Você ainda não possui VIP";
});

function requestPurchase(type: SpecialShopItemType, itemId: number, name: string, price: number) {
	pendingPurchase.value = { kind: "ITEM", type, itemId, name, price };
	purchaseDialogOpen.value = true;
}

function requestVipPurchase() {
	pendingPurchase.value = {
		kind: "VIP_DAYS",
		days: vipDays.value,
		name: `${vipDays.value} dias de VIP`,
		price: vipPrice.value,
	};
	purchaseDialogOpen.value = true;
}

function closePurchaseDialog(open: boolean) {
	purchaseDialogOpen.value = open;
	if (!open) pendingPurchase.value = null;
}

function handleTabKeydown(event: KeyboardEvent) {
	const currentIndex = shopTabs.findIndex((tab) => tab.id === activeTab.value);
	let nextIndex: number;

	if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % shopTabs.length;
	else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + shopTabs.length) % shopTabs.length;
	else if (event.key === "Home") nextIndex = 0;
	else if (event.key === "End") nextIndex = shopTabs.length - 1;
	else return;

	event.preventDefault();
	activeTab.value = shopTabs[nextIndex].id;
	nextTick(() => {
		tabList.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
	});
}

function getAvatarDecoration(decorationId: number) {
	const name = AvatarDecorationId[decorationId as AvatarDecorationId] ?? "Default";
	const key = name === "FrutigerAero" ? "frutiger_aero" : name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

	return supportedAvatarPreviewClasses.has(key) ? key : "default";
}

function getBackgroundDecorationClass(decorationId: number) {
	const name = BackgroundDecorationId[decorationId as BackgroundDecorationId] ?? "Default";
	const key = name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

	return `profile-background--${key}`;
}

function isAvatarDecorationActive(decorationId: number) {
	return getAvatarDecoration(decorationId) === profile.value?.avatarDecoration;
}

function isBackgroundDecorationActive(decorationId: number) {
	return getBackgroundDecorationClass(decorationId) === `profile-background--${profile.value?.backgroundDecoration}`;
}

function getErrorMessage(caughtError: unknown) {
	return caughtError && typeof caughtError === "object" && "message" in caughtError
		? String(caughtError.message)
		: "Ocorreu um erro inesperado.";
}

async function setActiveDecoration(type: UserDecorationType, decorationId: number) {
	try {
		const response = await setOwnDecoration({ type, decorationId });
		const result = response?.data?.setOwnDecoration;
		if (!result?.success) {
			showToast({ variant: "error", text: result?.message ?? "Não foi possível atualizar a decoração." });
			return;
		}

		showToast({ variant: "success", text: result.message });
		try {
			await Promise.all([auth.fetchUser(), refetchProfile()]);
		} catch (caughtError: unknown) {
			showToast({
				variant: "warning",
				text: `Decoração aplicada, mas não foi possível atualizar o perfil: ${getErrorMessage(caughtError)}`,
			});
		}
	} catch (caughtError: unknown) {
		showToast({ variant: "error", text: getErrorMessage(caughtError) });
	}
}

async function confirmPurchase() {
	const purchase = pendingPurchase.value;
	if (!purchase || purchase.price > specialCoinBalance.value) return;

	let result: { success: boolean; message: string } | null | undefined;
	try {
		if (purchase.kind === "VIP_DAYS") {
			if (!Number.isSafeInteger(purchase.days) || purchase.days < vipMinimumDays.value) return;
			const response = await buySpecialShopVip({ days: purchase.days });
			result = response?.data?.buySpecialShopVip;
		} else {
			const response = await buySpecialShopItem({
				type: purchase.type,
				itemId: purchase.itemId,
			});
			result = response?.data?.buySpecialShopItem;
		}
	} catch (caughtError: unknown) {
		showToast({ variant: "error", text: getErrorMessage(caughtError) });
		return;
	}

	if (!result?.success) {
		showToast({ variant: "error", text: result?.message ?? "Não foi possível concluir a compra." });
		try {
			await Promise.all([refetchProfile(), refetchShop()]);
		} catch (caughtError: unknown) {
			showToast({
				variant: "warning",
				text: `Não foi possível atualizar o saldo e o catálogo: ${getErrorMessage(caughtError)}`,
			});
		}
		return;
	}

	showToast({ variant: "success", text: result.message });
	closePurchaseDialog(false);
	try {
		await Promise.all([auth.fetchUser(), refetchProfile(), refetchShop()]);
	} catch (caughtError: unknown) {
		showToast({
			variant: "warning",
			text: `Compra concluída, mas a loja não foi atualizada: ${getErrorMessage(caughtError)}`,
		});
	}
}
</script>

<template>
	<main class="special-shop">
		<PageTitle
			title="Loja especial"
			subtitle="Desbloqueie VIP e customizações permanentes usando Moedas Especiais."
		/>

		<section
			class="special-shop__balance"
			aria-label="Seu saldo de Moedas Especiais"
		>
			<div>
				<p class="special-shop__balance-label">Seu saldo</p>
				<p class="special-shop__balance-value">
					<SpecialShopIcon
						:size="20"
						variant="normal"
					/>
					<span>{{ formatPlain(specialCoinBalance) }} Moedas Especiais</span>
				</p>
			</div>
			<p class="special-shop__permanent">As decorações e pacotes de skins são permanentes.</p>
			<!--			Todo: Adicionar botão para comprar moedas especiais-->
		</section>

		<div
			v-if="loading"
			class="special-shop__state"
			role="status"
			aria-live="polite"
		>
			<p>Carregando loja especial...</p>
		</div>
		<div
			v-else-if="loadError || !specialShop"
			class="special-shop__state special-shop__state--error"
			role="alert"
		>
			<p>Não foi possível carregar a loja especial. {{ loadError?.message }}</p>
		</div>

		<template v-else>
			<div
				ref="tabList"
				class="special-shop__tabs"
				role="tablist"
				aria-label="Categorias da loja especial"
				@keydown="handleTabKeydown"
			>
				<button
					v-for="tab in shopTabs"
					:id="`special-shop-tab-${tab.id}`"
					:key="tab.id"
					type="button"
					role="tab"
					:aria-selected="activeTab === tab.id"
					aria-controls="special-shop-panel"
					:tabindex="activeTab === tab.id ? 0 : -1"
					@click="activeTab = tab.id"
				>
					{{ tab.label }}
				</button>
			</div>

			<section
				id="special-shop-panel"
				class="special-shop__panel"
				role="tabpanel"
				:aria-labelledby="`special-shop-tab-${activeTab}`"
			>
				<template v-if="activeTab === 'vip'">
					<header class="special-shop__section-heading">
						<div>
							<h2>VIP</h2>
							<p>
								Escolha quantos dias deseja adicionar ao seu VIP. Cada dia custa
								{{ formatPlain(vipPricePerDay) }}.
							</p>
						</div>
						<p
							class="special-shop__vip-status"
							role="status"
							aria-live="polite"
						>
							{{ vipStatus }}
						</p>
					</header>

					<div class="special-shop__vip-layout">
						<article class="special-shop__card special-shop__card--vip">
							<div class="special-shop__plan-icon">
								<NuxtImg
									src="/images/badges/vip.png"
									width="24"
									height="24"
									alt=""
									aria-hidden="true"
								/>
							</div>
							<h3>Escolha a duração</h3>
							<label for="vip-days">Dias de VIP</label>
							<input
								id="vip-days"
								v-model.number="vipDays"
								class="special-shop__days-input"
								type="number"
								:min="vipMinimumDays"
								step="1"
								inputmode="numeric"
								required
								aria-describedby="vip-days-help"
							>
							<p
								id="vip-days-help"
								class="special-shop__help"
							>
								Mínimo de {{ vipMinimumDays }} dias. O preço é calculado por dia.
							</p>
							<div
								class="special-shop__vip-total"
								role="status"
								aria-live="polite"
							>
								<span>Total</span>
								<strong class="special-shop__price">
									<SpecialShopIcon
										:size="16"
										variant="normal"
									/>
									{{ formatPlain(vipPrice) }}
								</strong>
							</div>
							<BaseButton
								variant="secondary"
								size="lg"
								:disabled="!canBuyVip"
								@click="requestVipPurchase"
							>
								Comprar VIP
							</BaseButton>
						</article>

						<section
							class="special-shop__benefits"
							aria-labelledby="vip-benefits-heading"
						>
							<h3 id="vip-benefits-heading">Benefícios VIP</h3>
							<ul>
								<li
									v-for="benefit in vipBenefits"
									:key="benefit"
								>
									{{ benefit }}
								</li>
							</ul>
						</section>
					</div>
				</template>

				<template v-else-if="activeTab === 'skinBundles'">
					<header class="special-shop__section-heading">
						<div>
							<h2>Pacotes de skins</h2>
							<p>Personalize seus itens com coleções permanentes de skins.</p>
						</div>
					</header>

					<div class="special-shop__grid">
						<article
							v-for="bundle in specialShop.skinBundles"
							:key="bundle.id"
							class="special-shop__card"
						>
							<div class="special-shop__card-heading">
								<div>
									<h3>{{ bundle.name }}</h3>
									<p>{{ bundle.skins.length }} {{ bundle.skins.length === 1 ? "item" : "itens" }}</p>
								</div>
								<p class="special-shop__price">
									<SpecialShopIcon
										:size="16"
										variant="normal"
									/>
									{{ formatPlain(bundle.price) }}
								</p>
							</div>
							<ul
								class="special-shop__skin-list"
								:aria-label="`Skins incluídas no pacote ${bundle.name}`"
							>
								<li
									v-for="skin in bundle.skins"
									:key="skin.itemId"
								>
									<NuxtImg
										:src="skin.imagePath"
										:alt="skin.name"
										width="52"
										height="52"
										loading="lazy"
									/>
									<span>{{ skin.name }}</span>
								</li>
							</ul>
							<p
								v-if="bundle.owned"
								class="special-shop__owned"
								role="status"
							>
								Adquirido
							</p>
							<BaseButton
								v-else
								variant="secondary"
								:disabled="bundle.price > specialCoinBalance || buying"
								@click="requestPurchase(SpecialShopItemType.SkinBundle, bundle.id, bundle.name, bundle.price)"
							>
								Comprar pacote
							</BaseButton>
						</article>
					</div>
				</template>

				<template v-else-if="activeTab === 'avatarDecorations'">
					<header class="special-shop__section-heading">
						<div>
							<h2>Decorações de avatar</h2>
							<p>Derrote seus oponentes com estilo. Você pode pré-visualizar a decoração antes de comprar.</p>
						</div>
					</header>

					<div class="special-shop__grid">
						<article
							v-for="decoration in specialShop.avatarDecorations"
							:key="decoration.id"
							class="special-shop__card special-shop__card--avatar-decoration"
						>
							<UserPicture
								:image-url="avatarUrl"
								:decoration="getAvatarDecoration(decoration.id)"
								image-class="special-shop__avatar-preview"
								:alt="`Prévia do avatar com a decoração ${decoration.name}`"
								width="88"
								height="88"
								lazy
							/>
							<h3>{{ decoration.name }}</h3>
							<p class="special-shop__price">
								<SpecialShopIcon
									:size="16"
									variant="normal"
								/>
								{{ formatPlain(decoration.price) }}
							</p>
							<BaseButton
								v-if="decoration.owned"
								variant="success"
								:disabled="settingDecoration || isAvatarDecorationActive(decoration.id)"
								@click="setActiveDecoration(UserDecorationType.Avatar, decoration.id)"
							>
								{{ isAvatarDecorationActive(decoration.id) ? "Em uso" : "Usar decoração" }}
							</BaseButton>
							<BaseButton
								v-else
								variant="secondary"
								:disabled="decoration.price > specialCoinBalance || buying"
								@click="requestPurchase(SpecialShopItemType.AvatarDecoration, decoration.id, decoration.name, decoration.price)"
							>
								Comprar decoração
							</BaseButton>
						</article>
					</div>
				</template>

				<template v-else>
					<header class="special-shop__section-heading">
						<div>
							<h2>Decorações de fundo</h2>
							<p>
								Fundos personalizados para o seu perfil e cartão de ranking. Pré-visualize o estilo antes de comprar.
							</p>
						</div>
					</header>

					<div class="special-shop__grid">
						<article
							v-for="decoration in specialShop.backgroundDecorations"
							:key="decoration.id"
							class="special-shop__card special-shop__card--background-decoration"
							:class="['profile-background', getBackgroundDecorationClass(decoration.id)]"
						>
							<NuxtImg
								class="user-avatar special-shop__avatar-preview"
								:src="avatarUrl"
								width="88"
								height="88"
								loading="lazy"
							/>
							<h3>{{ decoration.name }}</h3>
							<p class="special-shop__price">
								<SpecialShopIcon
									:size="16"
									variant="normal"
								/>
								{{ formatPlain(decoration.price) }}
							</p>
							<BaseButton
								v-if="decoration.owned"
								variant="success"
								:disabled="settingDecoration || isBackgroundDecorationActive(decoration.id)"
								@click="setActiveDecoration(UserDecorationType.Background, decoration.id)"
							>
								{{ isBackgroundDecorationActive(decoration.id) ? "Em uso" : "Usar fundo" }}
							</BaseButton>
							<BaseButton
								v-else
								variant="secondary"
								:disabled="decoration.price > specialCoinBalance || buying"
								@click="requestPurchase(SpecialShopItemType.BackgroundDecoration, decoration.id, decoration.name, decoration.price)"
							>
								Comprar fundo
							</BaseButton>
						</article>
					</div>
				</template>
			</section>
		</template>

		<BaseModal
			:open="purchaseDialogOpen"
			title="Confirmar compra"
			:description="pendingPurchase?.name"
			@update:open="closePurchaseDialog"
		>
			<p v-if="pendingPurchase">
				Comprar por <strong>{{ formatPlain(pendingPurchase.price) }} Moedas Especiais</strong>?
			</p>
			<p class="special-shop__dialog-balance">Seu saldo: {{ formatPlain(specialCoinBalance) }} Moedas Especiais</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="buying"
					@click="closePurchaseDialog(false)"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="success"
					:disabled="!pendingPurchase || pendingPurchase.price > specialCoinBalance || buying"
					@click="confirmPurchase"
				>
					{{ buying ? "Comprando..." : "Confirmar compra" }}
				</BaseButton>
			</template>
		</BaseModal>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.special-shop {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__balance {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-md;
		padding: $spacing-md $spacing-lg;
		border: 1px solid color-mix(in lab, $color-special 45%, $border-card);
		border-radius: $radius-md;
		background: color-mix(in lab, $color-special 9%, $bg-card);
	}

	&__balance-label {
		color: $text-secondary;
		font-size: 0.8rem;
	}

	&__balance-value {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		margin-top: $spacing-xs;
		color: $text-primary;
		font-size: 1.15rem;
		font-weight: $font-weight-bold;
	}

	&__permanent {
		color: $text-secondary;
		font-size: 0.85rem;
		text-align: right;
	}

	&__state {
		padding: $spacing-xl $spacing-md;
		color: $text-secondary;
		text-align: center;

		&--error {
			color: $color-danger;
		}
	}

	&__tabs {
		display: flex;
		gap: $spacing-sm;
		overflow-x: auto;
		padding: 0.125rem 0 0.5rem;
		border-bottom: 1px solid $border-card;
		scrollbar-width: thin;

		button {
			flex: 0 0 auto;
			min-height: 2.75rem;
			padding: 0.65rem 1rem;
			border: 1px solid transparent;
			border-radius: $radius-sm;
			background: transparent;
			color: $text-secondary;
			font-weight: $font-weight-semibold;
			cursor: pointer;

			&:hover {
				background: $bg-card;
				color: $text-primary;
			}

			&[aria-selected="true"] {
				border-color: color-mix(in lab, $color-special 45%, $border-card);
				background: color-mix(in lab, $color-special 12%, $bg-card);
				color: $color-special;
			}

			&:focus-visible {
				outline: 2px solid $color-special;
				outline-offset: 2px;
			}
		}
	}

	&__panel {
		min-width: 0;
	}

	&__section-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: $spacing-md;
		margin-bottom: $spacing-md;

		h2 {
			font-size: $font-size-20;
			font-weight: $font-weight-bold;
		}

		p {
			margin-top: $spacing-xs;
			color: $text-secondary;
			font-size: $font-size-14;
		}
	}

	&__vip-status {
		padding: $spacing-sm $spacing-md;
		border: 1px solid $border-card;
		border-radius: $radius-sm;
		background: $bg-card;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
		gap: $spacing-md;
	}

	&__vip-layout {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: $spacing-md;
	}

	&__card {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: $spacing-md;
		padding: $spacing-md;
		border-radius: $radius-md;

		&--vip {
			align-items: flex-start;
			border: 1px solid color-mix(in lab, $color-vip 50%, $bg-card);
			background: color-mix(in lab, $color-vip 7%, $bg-card);
		}

		&--background-decoration,
		&--avatar-decoration {
			align-items: center;
			text-align: center;
		}

		&:not(:is(&--vip, &--background-decoration)) {
			border: 1px solid $border-card;
			background: $bg-card;
		}

		h3 {
			font-size: $font-size-16;
			font-weight: $font-weight-bold;
		}

		> .base-button {
			width: 100%;
			margin-top: auto;
		}
	}

	&__plan-icon {
		display: grid;
		width: 3rem;
		height: 3rem;
		place-items: center;
		border-radius: $radius-full;
		background: color-mix(in lab, $color-vip 18%, $bg-card);
		color: $color-vip;
	}

	&__days-input {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid $border-card;
		border-radius: $radius-sm;
		background: $bg-main;
		color: $text-primary;

		&:focus-visible {
			outline: 2px solid $color-special;
			outline-offset: 2px;
		}
	}

	&__help {
		color: $text-secondary;
		font-size: 0.8rem;
	}

	&__vip-total {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;
		padding-top: $spacing-sm;
		border-top: 1px solid color-mix(in lab, $color-vip 50%, $bg-card);
	}

	&__benefits {
		padding: $spacing-md;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		background: $bg-card;

		h3 {
			margin-bottom: $spacing-sm;
			font-size: $font-size-16;
			font-weight: $font-weight-bold;
		}

		ul {
			display: grid;
			gap: $spacing-sm;
			padding-left: 1.25rem;
			color: $text-secondary;
		}
	}

	&__card-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: $spacing-sm;

		p:not(.special-shop__price) {
			margin-top: $spacing-xs;
			color: $text-secondary;
			font-size: 0.8rem;
		}
	}

	&__price {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		color: $color-special;
		font-weight: $font-weight-bold;
	}

	&__skin-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4.25rem, 1fr));
		gap: $spacing-sm;
		width: 100%;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			min-width: 0;
			flex-direction: column;
			align-items: center;
			gap: $spacing-xs;
			color: $text-secondary;
			font-size: 0.7rem;
			text-align: center;

			img {
				width: 3.25rem;
				height: 3.25rem;
				object-fit: contain;
			}
		}
	}

	&__avatar-preview {
		width: 5.5rem;
		height: 5.5rem;
	}

	&__background-preview {
		display: grid;
		width: 100%;
		height: 5.5rem;
		place-items: center;
		overflow: hidden;
		border: 1px solid $border-card;
		border-radius: $radius-sm;
		background-color: $bg-main;
		color: $text-primary;
		font-size: $font-size-24;
		font-weight: $font-weight-extrabold;
		letter-spacing: 0.12em;
	}

	&__owned {
		color: color-mix(in lab, $color-special 50%, $text-primary);
		font-size: $font-size-14;
		font-weight: $font-weight-semibold;
	}

	&__dialog-balance {
		margin-top: $spacing-sm;
		color: $text-secondary;
		font-size: $font-size-14;
	}
}

@media (max-width: 600px) {
	.special-shop {
		&__balance,
		&__section-heading {
			align-items: flex-start;
			flex-direction: column;
		}

		&__permanent {
			text-align: left;
		}

		&__vip-status {
			width: 100%;
		}

		&__vip-layout {
			grid-template-columns: 1fr;
		}
	}
}

@media (prefers-reduced-motion: reduce) {
	.special-shop *,
	.special-shop *::before,
	.special-shop *::after {
		scroll-behavior: auto !important;
		transition-duration: 0.01ms !important;
	}
}
</style>
