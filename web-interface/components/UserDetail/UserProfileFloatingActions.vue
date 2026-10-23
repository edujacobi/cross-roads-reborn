<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CircleUserRound, X } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import SpecialShopIcon from "~/components/icons/SpecialShopIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useAuth } from "~/composables/useAuth";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { imagePaths } from "~/constants/imagePaths";
import {
	GetAlmsStatusDocument,
	GetUserSelfActionsDocument,
	GetVipGiftOptionsDocument,
	GiftVipDocument,
	GiveAlmsDocument,
	StartBeatUpDocument,
	StartUserRobberyDocument,
} from "~/graphql/generated";

const props = defineProps<{ userId: string }>();

const emit = defineEmits<{
	feedback: [type: "success" | "error", message: string];
	refresh: [];
}>();

const isMenuOpen = ref(false);
const giftDialogOpen = ref(false);
const duelAction = ref<"beatUp" | "userRobbery" | null>(null);
const useGrenade = ref(false);
const vipDays = ref(7);
const auth = useAuth();
const { formatMoney, formatPlain } = useMoneyFormat();
const isOtherUser = computed(() => !!auth.user.value && auth.user.value.userId !== props.userId);
const { result: selfActionsResult } = useQuery(
	GetUserSelfActionsDocument,
	() => ({ id: auth.user.value?.userId ?? "" }),
	{ enabled: isOtherUser },
);
const automaticGrenade = computed(() => selfActionsResult.value?.user?.automaticGrenade ?? false);
const { mutate: startBeatUp, loading: startingBeatUp } = useMutation(StartBeatUpDocument);
const { mutate: startUserRobbery, loading: startingUserRobbery } = useMutation(StartUserRobberyDocument);
const startingDuel = computed(() => startingBeatUp.value || startingUserRobbery.value);
const {
	result: giftOptionsResult,
	loading: giftOptionsLoading,
	error: giftOptionsError,
	refetch: refetchGiftOptions,
} = useQuery(GetVipGiftOptionsDocument, () => ({ giverId: auth.user.value?.userId ?? "", receiverId: props.userId }), {
	enabled: isOtherUser,
	fetchPolicy: "cache-and-network",
});
const giftOptions = computed(() => giftOptionsResult.value);
const minimumDays = computed(() => giftOptions.value?.specialShop.vipMinimumDays ?? 7);
const giftPrice = computed(() => vipDays.value * (giftOptions.value?.specialShop.vipPricePerDay ?? 0));
const specialCoins = computed(() => giftOptions.value?.giver?.specialCoin ?? 0);
const { mutate: giftVip, loading: giftVipLoading } = useMutation(GiftVipDocument);
const canGiftVip = computed(
	() =>
		isOtherUser.value &&
		!!giftOptions.value?.giver &&
		!!giftOptions.value?.receiver &&
		!giftOptions.value.receiver.vipEternal &&
		!giftOptionsLoading.value &&
		!giftOptionsError.value &&
		!giftVipLoading.value &&
		Number.isSafeInteger(vipDays.value) &&
		vipDays.value >= minimumDays.value &&
		Number.isSafeInteger(giftPrice.value) &&
		giftPrice.value > 0 &&
		giftPrice.value <= specialCoins.value,
);
const { result: almsStatusResult, loading: almsStatusLoading } = useQuery(
	GetAlmsStatusDocument,
	() => ({ receiverId: props.userId }),
	{ fetchPolicy: "cache-and-network" },
);
const almsStatus = computed(() => almsStatusResult.value?.almsStatus);
const { mutate: giveAlms, loading: giveAlmsLoading } = useMutation(GiveAlmsDocument);

watch(
	() => props.userId,
	() => {
		isMenuOpen.value = false;
		giftDialogOpen.value = false;
		duelAction.value = null;
		useGrenade.value = false;
		vipDays.value = minimumDays.value;
	},
);

function openDuelModal(action: "beatUp" | "userRobbery") {
	isMenuOpen.value = false;
	useGrenade.value = false;
	duelAction.value = action;
}

async function launchDuel() {
	const action = duelAction.value;
	if (!action) return;

	try {
		const variables = {
			targetUserId: props.userId,
			useGrenade: useGrenade.value || automaticGrenade.value,
		};
		const result =
			action === "beatUp"
				? (await startBeatUp(variables))?.data?.startBeatUp
				: (await startUserRobbery(variables))?.data?.startUserRobbery;
		emit("feedback", result?.success ? "success" : "error", result?.message ?? "Não foi possível iniciar a ação.");
		if (result?.success) {
			duelAction.value = null;
			useGrenade.value = false;
		}
	} catch (error: unknown) {
		emit("feedback", "error", error instanceof Error ? error.message : "Erro inesperado.");
	}
}

async function handleGiftVip() {
	if (!canGiftVip.value) {
		emit("feedback", "error", "Verifique a quantidade de dias e seu saldo de Moedas Especiais.");
		return;
	}
	try {
		const result = await giftVip({ receiverId: props.userId, days: vipDays.value });
		const response = result?.data?.giftVip;
		if (!response) {
			emit("feedback", "error", "Não foi possível presentear VIP.");
			return;
		}
		emit("feedback", response.success ? "success" : "error", response.message);
		if (response.success) {
			giftDialogOpen.value = false;
			emit("refresh");
		}
	} catch (error: unknown) {
		emit("feedback", "error", error instanceof Error ? error.message : "Erro inesperado.");
		return;
	}
	try {
		await refetchGiftOptions();
	} catch (error: unknown) {
		emit("feedback", "error", error instanceof Error ? error.message : "Não foi possível atualizar o saldo.");
	}
}

async function handleGiveAlms() {
	try {
		const result = await giveAlms({ receiverId: props.userId });
		const response = result?.data?.giveAlms;

		if (!response) {
			emit("feedback", "error", "Não foi possível realizar a doação.");
			return;
		}

		emit("feedback", response.success ? "success" : "error", response.message);
		if (response.success) {
			emit("refresh");
		}
	} catch (error: unknown) {
		emit("feedback", "error", error instanceof Error ? error.message : "Erro inesperado.");
	}
}
</script>

<template>
	<template v-if="almsStatus || isOtherUser">
		<fieldset
			v-show="isMenuOpen"
			id="user-profile-floating-menu"
			class="user-profile-floating-actions__menu"
			aria-label="Ações para este jogador"
		>
			<BaseButton
				v-if="isOtherUser"
				variant="ghost"
				:disabled="giftVipLoading"
				@click="isMenuOpen = false; giftDialogOpen = true"
			>
				<NuxtImg
					:src="imagePaths.badges.vip"
					width="18"
					height="18"
					alt=""
					aria-hidden="true"
				/>
				Presentear VIP
			</BaseButton>

			<BaseButton
				v-if="almsStatus"
				variant="secondary"
				size="lg"
				:disabled="almsStatusLoading || giveAlmsLoading || !almsStatus.canGive"
				@click="isMenuOpen = false; handleGiveAlms()"
			>
				<NuxtImg
					src="/images/ui_elements/Alms.png"
					width="18"
					height="18"
					alt=""
				/>
				Doar {{ formatMoney(almsStatus.value) }}
			</BaseButton>

			<BaseButton
				v-if="isOtherUser"
				variant="secondary"
				size="lg"
				@click="openDuelModal('beatUp')"
			>
				<NuxtImg
					:src="imagePaths.situations.beatup"
					width="18"
					height="18"
					alt=""
					aria-hidden="true"
				/>
				Espancar
			</BaseButton>
			<BaseButton
				v-if="isOtherUser"
				variant="secondary"
				size="lg"
				@click="openDuelModal('userRobbery')"
			>
				<NuxtImg
					:src="imagePaths.situations.robbery"
					width="18"
					height="18"
					alt=""
					aria-hidden="true"
				/>
				Roubar
			</BaseButton>
		</fieldset>

		<BaseModal
			:open="duelAction !== null"
			:title="duelAction === 'beatUp' ? 'Espancar jogador' : 'Roubar jogador'"
			description="O alvo poderá reagir durante a ação."
			@update:open="duelAction = null"
		>
			<form
				id="user-duel-form"
				class="user-profile-floating-actions__duel"
				@submit.prevent="launchDuel()"
			>
				<label v-if="!automaticGrenade">
					<input
						v-model="useGrenade"
						type="checkbox"
						:disabled="startingDuel"
					>
					<NuxtImg
						src="/images/items/18_Grenade.png"
						width="24"
						height="24"
						alt=""
						aria-hidden="true"
						style="vertical-align: middle; margin-left: 0.5rem"
					/>
					Usar granada
				</label>
				<p
					v-else
					role="status"
				>
					Uso automático de granadas ativado.
				</p>
			</form>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="startingDuel"
					@click="duelAction = null"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					type="submit"
					form="user-duel-form"
					:disabled="startingDuel"
					:class="duelAction === 'beatUp' ? 'btn-beatup' : 'btn-robbery'"
				>
					{{ startingDuel ? "Iniciando..." : duelAction === "beatUp" ? "Espancar" : "Roubar" }}
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			v-model:open="giftDialogOpen"
			title="Presentear VIP"
			:description="`Mínimo de ${minimumDays} dias. O custo será descontado das suas Moedas Especiais.`"
		>
			<form
				id="gift-vip-form"
				class="user-profile-floating-actions__gift"
				@submit.prevent="handleGiftVip"
			>
				<label for="gift-vip-days">Dias de VIP</label>
				<BaseInput
					id="gift-vip-days"
					v-model.number="vipDays"
					type="number"
					:min="minimumDays"
					step="1"
					required
					:disabled="giftVipLoading"
				/>
				<p v-if="giftOptionsLoading">Carregando saldo e preço...</p>
				<p
					v-else-if="giftOptionsError"
					role="alert"
				>
					Não foi possível carregar o saldo e o preço. Tente novamente.
				</p>
				<template v-else-if="giftOptions">
					<p class="user-profile-floating-actions__gift__balance">
						Você possui
						<SpecialShopIcon
							:size="14"
							variant="solid"
						/>
						{{ formatPlain(specialCoins) }} Moedas Especiais
					</p>
					<p>
						Total:
						<SpecialShopIcon
							:size="14"
							variant="solid"
						/>
						{{ formatPlain(giftPrice) }} Moedas Especiais
					</p>
					<p
						v-if="giftOptions.receiver?.vipEternal"
						class="user-profile-floating-actions__gift__vip-notice"
					>
						Este jogador já possui
						<NuxtImg
							:src="imagePaths.badges.vip"
							width="20"
							height="20"
						/>
						VIP Eterno.
					</p>
					<p
						v-else-if="giftPrice > specialCoins"
						role="alert"
					>
						Saldo insuficiente de Moedas Especiais.
					</p>
				</template>
			</form>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="giftVipLoading"
					@click="giftDialogOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					type="submit"
					form="gift-vip-form"
					:disabled="!canGiftVip"
				>
					{{ giftVipLoading ? "Enviando..." : "Presentear" }}
				</BaseButton>
			</template>
		</BaseModal>

		<button
			type="button"
			class="user-profile-floating-actions__toggle"
			:aria-label="isMenuOpen ? 'Fechar ações' : 'Abrir ações'"
			aria-controls="user-profile-floating-menu"
			:aria-expanded="isMenuOpen"
			@click="isMenuOpen = !isMenuOpen"
		>
			<X
				v-if="isMenuOpen"
				:size="24"
				aria-hidden="true"
			/>
			<CircleUserRound
				v-else
				:size="24"
				aria-hidden="true"
			/>
			<span class="user-profile-floating-actions__label">Ações</span>
		</button>
	</template>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "sass:color";

.user-profile-floating-actions {
	&__gift {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;

		p {
			display: flex;
			align-items: center;
			gap: $spacing-xs;
		}

		&__balance {
			font-size: $font-size-14;
			color: $text-secondary;
		}

		&__vip-notice {
			font-size: $font-size-14;
			color: $color-vip;
		}
	}

	&__duel {
		display: flex;
		align-items: center;
		gap: $spacing-sm;

		p {
			margin: 0;
		}
	}

	&__toggle {
		position: fixed;
		left: calc(50% - 2rem);
		bottom: 1rem;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		background-color: $bg-sidebar;
		color: $text-primary;
		box-shadow: $shadow-lg;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		@media (min-width: 426px) {
			left: 50%;
			width: auto;
			padding: 0 1.25rem;
			border-radius: $radius-full;
			gap: $spacing-sm;
			transform: translateX(-50%);

			&:hover {
				transform: translateX(-50%) scale(1.05);
			}
		}
	}

	&__label {
		display: none;

		@media (min-width: 426px) {
			display: inline;
			font-weight: $font-weight-semibold;
		}
	}

	&__menu {
		position: fixed;
		left: 50%;
		bottom: 5.75rem;
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		width: min(20rem, calc(100vw - 2rem));
		box-sizing: border-box;
		padding: $spacing-sm;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		background-color: $bg-card;
		box-shadow: $shadow-lg;
		transform: translateX(-50%);

		.base-button {
			width: 100%;
		}
	}
}

.base-button.btn-beatup {
	background-color: $color-beatup;

	&:hover:not(:disabled) {
		background-color: color.adjust($color-beatup, $lightness: 10%);
	}
}

.base-button.btn-robbery {
	color: $text-primary;
	background-color: $color-robbery;

	&:hover:not(:disabled) {
		background-color: color.adjust($color-robbery, $lightness: 10%);
	}
}
</style>
