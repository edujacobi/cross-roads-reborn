<script
	setup
	lang="ts"
>
import { useApolloClient, useMutation, useQuery } from "@vue/apollo-composable";
import { CalendarRange, Clock3, Shield } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import {
	EndSeasonDocument,
	GetSeasonEndPreviewDocument,
	type GetSeasonEndPreviewQuery,
	GetSeasonInfoDocument,
	SetMainHeistAllowedDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Temporada",
});

const auth = useAuth();
const { showToast } = useToast();
const { client } = useApolloClient();
const { result, loading, error: queryError, refetch } = useQuery(GetSeasonInfoDocument);
const { mutate: setMainHeistAllowed, loading: saving } = useMutation(SetMainHeistAllowedDocument);
const { mutate: endSeasonMutation, loading: endingSeason } = useMutation(EndSeasonDocument);
const { getClassImageUrl, getClassName } = useClasses();
const season = computed(() => result.value?.seasonInfo);
type SeasonEndPreview = GetSeasonEndPreviewQuery["seasonEndPreview"];
type UserRankingKey = Exclude<keyof SeasonEndPreview, "topGang" | "stats">;
const rankingSections: { key: UserRankingKey; label: string; image: ImagePath }[] = [
	{ key: "topMoney", label: "Top grana (Top 1, 2 e 3)", image: imagePaths.badges.top1Money },
	{ key: "topGambler", label: "Top apostador (cassino)", image: imagePaths.badges.topCasinoWR },
	{ key: "topSpender", label: "Top gastador (lojas)", image: imagePaths.badges.topSpender },
	{ key: "topThiefProfit", label: "Top ladrão (lucro)", image: imagePaths.badges.topRobberyProfit },
	{
		key: "topThiefQuantity",
		label: "Top ladrão (quantidade - apenas informação)",
		image: imagePaths.badges.topRobberyQuantity,
	},
	{ key: "topWorker", label: "Top trabalhador (empregos)", image: imagePaths.badges.topJobs },
	{ key: "topBeater", label: "Top pancada (espancamentos)", image: imagePaths.badges.topBeatUp },
	{ key: "topScavenger", label: "Top vasculhador (vasculhar)", image: imagePaths.badges.topScavenge },
	{ key: "topHospital", label: "Top hospital (tratamentos)", image: imagePaths.badges.topHospital },
	{ key: "topBriber", label: "Top suborno (prisão)", image: imagePaths.badges.topBribery },
	{ key: "topEscaper", label: "Top fujão (fugas)", image: imagePaths.badges.topEscapes },
	{ key: "topDrunk", label: "Top bêbado (happy hour - apenas informação)", image: imagePaths.situations.idling },
	{ key: "topInvestor", label: "Top investidor (investimentos)", image: imagePaths.badges.topInvestments },
];
const moneyRankingKeys = new Set<UserRankingKey>([
	"topMoney",
	"topGambler",
	"topSpender",
	"topThiefProfit",
	"topWorker",
	"topHospital",
	"topBriber",
	"topInvestor",
]);
const isEndSeasonModalOpen = ref(false);
const isPreSeason = ref(false);
const endSeasonStep = ref<"confirm" | "rankings" | "wipe" | "done">("confirm");
const endSeasonPreview = ref<SeasonEndPreview | null>(null);
const rankingPreviews = computed(() =>
	rankingSections.map((section) => ({
		...section,
		entries: endSeasonPreview.value?.[section.key] ?? [],
	})),
);
const wipeStats = computed(() => {
	const stats = endSeasonPreview.value?.stats;
	return stats
		? [
				{ label: "Usuários ativos", value: stats.activeUsers },
				{ label: "Gangues ativas", value: stats.activeGangs },
				{ label: "Membros de gangues", value: stats.gangMembers },
				{ label: "Cargos de gangues", value: stats.gangRoles },
				{ label: "Golpes de gangues", value: stats.gangHeists },
				{ label: "Itens de usuários", value: stats.items },
				{ label: "Histórico de roubos", value: stats.robberies },
				{ label: "Notificações", value: stats.notifications },
				{ label: "Bilhetes de loteria", value: stats.lotteryTickets },
				{ label: "Investimentos ativos", value: stats.investments },
				{ label: "Apostas de cavalos", value: stats.horseRaceBets },
			]
		: [];
});

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

function openEndSeasonConfirmation() {
	isPreSeason.value = false;
	endSeasonPreview.value = null;
	endSeasonStep.value = "confirm";
	isEndSeasonModalOpen.value = true;
}

async function showSeasonRankings() {
	try {
		const { data } = await client.query({
			query: GetSeasonEndPreviewDocument,
			fetchPolicy: "network-only",
		});
		endSeasonPreview.value = data.seasonEndPreview;
		endSeasonStep.value = "rankings";
	} catch (error: unknown) {
		showToast({
			variant: "error",
			text: error instanceof Error ? error.message : "Não foi possível carregar a prévia da temporada.",
		});
	}
}

function formatRankingValue(key: UserRankingKey, value: number): string {
	const formatted = Math.floor(value).toLocaleString("pt-BR");
	return moneyRankingKeys.has(key) ? `Cr$ ${formatted}` : key === "topDrunk" ? `${formatted} cervejas` : formatted;
}

async function endCurrentSeason() {
	try {
		const response = await endSeasonMutation({ isPreSeason: isPreSeason.value });
		const endSeasonResult = response?.data?.endSeason;
		if (!endSeasonResult?.success) {
			showToast({ variant: "error", text: endSeasonResult?.message || "Não foi possível finalizar a temporada." });
			return;
		}

		endSeasonStep.value = "done";
		showToast({ variant: "success", text: endSeasonResult.message });
		await refetch();
	} catch (error: unknown) {
		showToast({
			variant: "error",
			text: error instanceof Error ? error.message : "Erro inesperado ao finalizar a temporada.",
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
				<template
					v-if="auth.isDeveloper.value"
					#footer
				>
					<BaseButton
						variant="danger"
						@click="openEndSeasonConfirmation()"
					>
						Finalizar temporada
					</BaseButton>
				</template>
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

		<BaseModal
			:open="isEndSeasonModalOpen"
			:title="endSeasonStep === 'confirm' ? 'Finalizar temporada' : endSeasonStep === 'rankings' ? 'Prévia dos rankings' : endSeasonStep === 'wipe' ? 'Impacto no banco de dados' : 'Temporada finalizada'"
			:description="endSeasonStep === 'confirm' && season ? `Confirma o encerramento da Temporada ${season.number}?` : undefined"
			@update:open="isEndSeasonModalOpen = $event"
		>
			<template v-if="endSeasonStep === 'confirm'">
				<label class="preseason-option">
					<input
						v-model="isPreSeason"
						type="checkbox"
					>
					<span>
						<strong>É uma pré-temporada?</strong>
						<span>Pré-temporada: {{ isPreSeason ? "Sim" : "Não" }}</span>
					</span>
				</label>
			</template>

			<div
				v-else-if="endSeasonStep === 'rankings'"
				class="ranking-preview"
			>
				<h3>Líderes de ranking da Temporada {{ season?.number }}</h3>
				<section
					v-for="section in rankingPreviews"
					:key="section.key"
					class="ranking-section"
				>
					<h4>
						<NuxtImg
							:src="section.image"
							width="20"
							height="20"
							alt=""
						/>
						{{ section.label }}
					</h4>
					<ol v-if="section.entries.length">
						<li
							v-for="entry in section.entries"
							:key="entry.id"
						>
							<strong>{{ entry.nickname }}</strong>
							<span>{{ formatRankingValue(section.key, entry.value) }}</span>
							<small class="ranking-class">
								<NuxtImg
									:src="getClassImageUrl(entry.class)"
									width="16"
									height="16"
									alt=""
								/>
								{{ getClassName(entry.class) }}
								· ID: {{ entry.id }}
							</small>
						</li>
					</ol>
					<p
						v-else
						class="empty-ranking"
					>
						Nenhum dado registrado.
					</p>
				</section>
				<section class="ranking-section">
					<h4>
						<NuxtImg
							:src="imagePaths.badges.topGang"
							width="20"
							height="20"
							alt=""
						/>
						Top gangue (maior nível)
					</h4>
					<template v-if="endSeasonPreview?.topGang.length">
						<div
							v-for="gang in endSeasonPreview.topGang"
							:key="gang.id"
							class="gang-ranking"
						>
							<strong>{{ gang.name }}</strong>
							<span>Nível {{ gang.level }} · ID: {{ gang.id }}</span>
						</div>
					</template>
					<p
						v-else
						class="empty-ranking"
					>
						Nenhum dado registrado.
					</p>
				</section>
			</div>

			<div
				v-else-if="endSeasonStep === 'wipe'"
				class="wipe-preview"
			>
				<h3>Resumo da limpeza do banco de dados</h3>
				<ul class="wipe-stats">
					<li
						v-for="stat in wipeStats"
						:key="stat.label"
					>
						<strong>{{ stat.value.toLocaleString("pt-BR") }}</strong>
						<span>{{ stat.label }}</span>
					</li>
				</ul>
				<p class="wipe-warning">
					Clicar em <strong>FINALIZAR TEMPORADA AGORA</strong> irá resetar a progressão sazonal dos usuários, restaurar
					os Cofres aos valores iniciais e apagar Gangs, GangMembers, GangRoles, GangHeists, UserItems, RobHistories,
					Notifications, LotteryTickets, UserInvestments e HorseRaceBets.
				</p>
				<p class="wipe-warning">Medalhas (UserBadges), Pacotes (UserBundles) e Cosméticos NÃO serão apagados.</p>
			</div>

			<div
				v-else
				class="season-complete"
				role="status"
			>
				<h3>🏆 Temporada finalizada com sucesso!</h3>
				<p>
					{{
						isPreSeason
							? "Os valores da pré-temporada foram resetados e uma nova temporada começou."
							: "Os vencedores receberam medalhas, anúncios foram enviados, dados resetados e a nova temporada começou!"
					}}
				</p>
			</div>

			<template #footer>
				<BaseButton
					v-if="endSeasonStep !== 'done'"
					variant="secondary"
					:disabled="endingSeason"
					@click="isEndSeasonModalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					v-if="endSeasonStep === 'confirm'"
					:disabled="endingSeason"
					@click="showSeasonRankings()"
				>
					Visualizar rankings
				</BaseButton>
				<BaseButton
					v-else-if="endSeasonStep === 'rankings'"
					:disabled="endingSeason || !endSeasonPreview"
					@click="endSeasonStep = 'wipe'"
				>
					Ver impacto no banco de dados
				</BaseButton>
				<BaseButton
					v-else-if="endSeasonStep === 'wipe'"
					variant="danger"
					:disabled="endingSeason"
					@click="endCurrentSeason()"
				>
					{{ endingSeason ? "Finalizando..." : "FINALIZAR TEMPORADA AGORA" }}
				</BaseButton>
				<BaseButton
					v-else
					@click="isEndSeasonModalOpen = false"
				>
					Fechar
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

.preseason-option {
	display: flex;
	align-items: flex-start;
	gap: $spacing-md;
	color: $text-primary;

	input {
		margin-top: 0.2rem;
		accent-color: $color-brand;
	}

	span {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	span span {
		color: $text-secondary;
		font-size: 0.8125rem;
	}
}

.ranking-preview,
.wipe-preview {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
	color: $text-primary;

	h3 {
		font-size: 1rem;
	}
}

.ranking-section {
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
	padding-top: $spacing-sm;
	border-top: 1px solid $border-subtle;

	h4 {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		font-size: 0.875rem;
		color: $color-brand;
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		padding-left: 1.5rem;
	}

	li {
		padding-left: $spacing-xs;
	}

	li > strong,
	li > span,
	li > small {
		display: block;
	}

	li > span,
	.gang-ranking span {
		color: $text-secondary;
	}

	li > small {
		color: $text-muted;
	}

	.ranking-class {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}
}

.gang-ranking {
	display: flex;
	justify-content: space-between;
	gap: $spacing-sm;
}

.empty-ranking {
	color: $text-muted;
	font-size: 0.8125rem;
}

.wipe-stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	gap: $spacing-sm;
	list-style: none;

	li {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		padding: $spacing-sm;
		border-radius: $radius-sm;
		background: $bg-input;
	}

	span {
		color: $text-secondary;
		font-size: 0.8125rem;
	}
}

.wipe-warning {
	color: $color-danger;
	font-size: 0.8125rem;
}

.season-complete {
	color: $text-primary;

	h3 {
		margin-bottom: $spacing-sm;
		color: $color-success;
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
