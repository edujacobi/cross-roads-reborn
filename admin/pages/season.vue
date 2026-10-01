<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CalendarRange, Clock3, Shield } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { GetSeasonInfoDocument, SetMainHeistAllowedDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Temporada",
});

const auth = useAuth();
const { showToast } = useToast();
const { result, loading, error: queryError, refetch } = useQuery(GetSeasonInfoDocument);
const { mutate: setMainHeistAllowed, loading: saving } = useMutation(SetMainHeistAllowedDocument);
const season = computed(() => result.value?.seasonInfo);

function formatDate(value: string): string {
	return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(value));
}

async function toggleMainHeist() {
	const allowed = !season.value?.mainHeistAllowed;
	if (!season.value || !auth.isDeveloper.value) return;

	try {
		const response = await setMainHeistAllowed({ allowed });
		if (!response?.data?.setMainHeistAllowed.success) {
			showToast({ variant: "error", text: "Não foi possível atualizar o golpe principal." });
			return;
		}

		showToast({
			variant: "success",
			text: `Golpe principal ${allowed ? "ativado" : "desativado"}.`,
		});
		await refetch();
	} catch (error: unknown) {
		showToast({
			variant: "error",
			text: error instanceof Error ? error.message : "Erro inesperado.",
		});
	}
}
</script>

<template>
	<main class="season-page">
		<PageTitle
			title="Temporada"
			subtitle="Período atual e configurações dos golpes"
		/>

		<div
			v-if="loading"
			class="state-message"
			role="status"
		>
			Carregando temporada...
		</div>
		<div
			v-else-if="queryError"
			class="state-message error-message"
			role="alert"
		>
			Não foi possível carregar os dados da temporada.
		</div>
		<template v-else-if="season">
			<BaseCard
				:title="`Temporada ${season.number}`"
				subtitle="Datas da temporada atual"
			>
				<div class="season-details">
					<div class="season-detail">
						<span class="detail-label">
							<CalendarRange
								:size="16"
								aria-hidden="true"
							/>
							Início
						</span>
						<time :datetime="season.startDate">{{ formatDate(season.startDate) }}</time>
					</div>
					<div class="season-detail">
						<span class="detail-label">
							<CalendarRange
								:size="16"
								aria-hidden="true"
							/>
							Fim
						</span>
						<time :datetime="season.endDate">{{ formatDate(season.endDate) }}</time>
					</div>
					<div class="season-detail">
						<span class="detail-label">
							<Clock3
								:size="16"
								aria-hidden="true"
							/>
							Dias restantes
						</span>
						<strong>{{ season.daysRemaining }}</strong>
					</div>
				</div>
			</BaseCard>

			<BaseCard
				title="Golpe principal de gangue"
				subtitle="Ative ou desative a execução do golpe principal"
			>
				<div class="heist-setting">
					<div class="heist-status">
						<Shield
							:size="20"
							aria-hidden="true"
						/>
						<div>
							<strong>{{ season.mainHeistAllowed ? "Ativado" : "Desativado" }}</strong>
							<p>Disponível às segundas, quartas e sextas-feiras</p>
						</div>
					</div>
					<button
						type="button"
						class="switch"
						role="switch"
						:aria-checked="season.mainHeistAllowed"
						:aria-label="`Golpe principal ${season.mainHeistAllowed ? 'ativado' : 'desativado'}`"
						:disabled="!auth.isDeveloper.value || saving"
						@click="toggleMainHeist()"
					>
						<span class="switch-thumb" />
					</button>
				</div>
				<p
					v-if="!auth.isDeveloper.value"
					class="permission-note"
				>
					Somente desenvolvedores podem alterar esta configuração.
				</p>
			</BaseCard>
		</template>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.season-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.season-details {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
	gap: $spacing-lg;
}

.season-detail {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	color: $text-primary;

	.detail-label {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		color: $text-secondary;
		font-size: 0.8125rem;
	}

	strong {
		font-size: 1.25rem;
	}
}

.heist-setting {
	@include flex-between;
	gap: $spacing-md;

	.heist-status {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		color: $text-primary;

		p {
			margin-top: 0.25rem;
			color: $text-secondary;
			font-size: 0.8125rem;
		}
	}
}

.switch {
	width: 3rem;
	height: 1.75rem;
	padding: 0.1875rem;
	border: 1px solid $border-subtle;
	border-radius: 999px;
	background: $bg-input;
	cursor: pointer;
	transition: background-color 0.15s ease-in-out;

	&[aria-checked="true"] {
		background: $color-success;
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	&:focus-visible {
		outline: 2px solid $border-focus;
		outline-offset: 2px;
	}

	.switch-thumb {
		display: block;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: $text-primary;
		transition: transform 0.15s ease-in-out;
	}

	&[aria-checked="true"] .switch-thumb {
		transform: translateX(1.25rem);
	}
}

.permission-note {
	margin-top: $spacing-md;
	color: $text-muted;
	font-size: 0.8125rem;
}

.state-message {
	@include flex-center;
	min-height: 9rem;
	color: $text-muted;
}

.error-message {
	color: $color-danger;
}

@media (max-width: 600px) {
	.heist-setting {
		align-items: flex-start;
	}
}
</style>
