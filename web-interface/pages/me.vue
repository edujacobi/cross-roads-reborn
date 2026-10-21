<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { BookOpen, Clock3, ExternalLink, HelpCircle, Info, UsersRound } from "lucide-vue-next";
import { onMounted, onUnmounted, ref } from "vue";
import CasinoIcon from "~/components/icons/CasinoIcon.vue";
import InvestmentIcon from "~/components/icons/InvestmentIcon.vue";
import JobsIcon from "~/components/icons/JobsIcon.vue";
import RobberyIcon from "~/components/icons/RobberyIcon.vue";
import ScavengeIcon from "~/components/icons/ScavengeIcon.vue";
import UserSituationText from "~/components/UserDetail/UserSituationText.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useDateFormat } from "~/composables/useDateFormat";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { eventTypeNames, eventTypes, formatEventValue } from "~/constants/eventTypes";
import { GetMePageDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Minha página",
});

const auth = useAuth();
const userId = computed(() => auth.user.value?.userId ?? "");
const { result, loading, error } = useQuery(GetMePageDocument, () => ({ id: userId.value }), {
	enabled: computed(() => !!userId.value),
});
const player = computed(() => result.value?.user);
const activeEvents = computed(() => result.value?.activeEvents);
const playerName = computed(() => player.value?.nickname ?? auth.user.value?.username ?? "jogador");
const { formatMoney } = useMoneyFormat();
const { shortDateShortTime } = useDateFormat();
const now = ref(new Date());
const modal = ref<"help" | "about" | null>(null);
const clockFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
let clockInterval: ReturnType<typeof setInterval> | undefined;

const greeting = computed(() => {
	const hour = now.value.getHours();
	if (hour < 6) return "Boa madrugada";
	if (hour < 12) return "Bom dia";
	if (hour < 18) return "Boa tarde";
	return "Boa noite";
});
const currentTime = computed(() => clockFormatter.format(now.value));

onMounted(() => {
	clockInterval = setInterval(() => {
		now.value = new Date();
	}, 1_000);
});

onUnmounted(() => {
	if (clockInterval) clearInterval(clockInterval);
});
</script>

<template>
	<main class="me-page">
		<header class="me-page__header">
			<div>
				<p class="me-page__eyebrow">Cross Roads Reborn</p>
				<h1>{{ greeting }}, {{ playerName }}</h1>
				<p class="me-page__intro">Confira seu estado atual na cidade.</p>
			</div>
			<section
				class="me-page__clock"
				aria-label="Horário atual"
			>
				<Clock3
					:size="20"
					aria-hidden="true"
				/>
				<time :datetime="now.toISOString()">{{ currentTime }}</time>
			</section>
		</header>

		<p
			v-if="error"
			class="me-page__error"
			role="alert"
		>
			Não foi possível carregar seus dados: {{ error.message }}
		</p>

		<section
			class="me-page__overview"
			aria-label="Estado atual"
		>
			<BaseCard title="Situação">
				<p
					v-if="loading && !player"
					class="me-page__situation-state"
				>
					Carregando situação...
				</p>
				<UserSituationText
					v-else-if="player"
					:user="player"
				/>
				<p
					v-else
					class="me-page__situation-state"
				>
					Situação indisponível.
				</p>
			</BaseCard>

			<BaseCard title="Grana">
				<div class="me-page__money">
					<strong>
						{{ loading ? "Carregando..." : player ? formatMoney(player.money) : "Indisponível" }}
					</strong>
				</div>
			</BaseCard>

			<BaseCard
				title="Eventos ativos"
				v-if="activeEvents?.length"
			>
				<p v-if="loading">Verificando eventos...</p>
				<p v-else-if="!activeEvents">Não foi possível verificar os eventos.</p>
				<ul
					v-else
					class="me-page__events"
				>
					<li
						v-for="event in activeEvents"
						:key="event.id"
						class="me-page__event"
					>
						<div class="me-page__event-title">
							<NuxtImg
								v-if="eventTypes.find(({ id }) => id === event.type)"
								:src="eventTypes.find(({ id }) => id === event.type)?.image"
								width="24"
								height="24"
								alt=""
							/>
							<strong>{{ eventTypeNames[event.type] ?? "Evento desconhecido" }}</strong>
							<span>{{ formatEventValue(event.type, event.value) }}</span>
						</div>
						<dl class="me-page__event-dates">
							<div>
								<dt>Início</dt>
								<dd><time :datetime="event.periodStart">{{ shortDateShortTime(event.periodStart) }}</time></dd>
							</div>
							<div>
								<dt>Término</dt>
								<dd><time :datetime="event.periodEnd">{{ shortDateShortTime(event.periodEnd) }}</time></dd>
							</div>
						</dl>
					</li>
				</ul>
			</BaseCard>
		</section>

		<section
			class="me-page__links"
			aria-label="Atalhos"
		>
			<BaseButton
				:to="`/users/${userId}`"
				variant="primary"
			>
				<ExternalLink
					:size="18"
					aria-hidden="true"
				/>
				Meu perfil
			</BaseButton>
			<BaseButton
				v-if="auth.user.value?.gangId"
				:to="`/gangs/${auth.user.value.gangId}`"
				variant="secondary"
			>
				<UsersRound
					:size="18"
					aria-hidden="true"
				/>
				Minha gangue
			</BaseButton>
		</section>

		<section
			class="me-page__help"
			aria-label="Informações"
		>
			<BaseCard
				title="Precisa de ajuda?"
				no-body
			>
				<template #actions>
					<BaseButton
						variant="secondary"
						@click="modal = 'help'"
					>
						<HelpCircle
							:size="18"
							aria-hidden="true"
						/>
						Ajuda
					</BaseButton>
					<BaseButton
						variant="secondary"
						@click="modal = 'about'"
					>
						<Info
							:size="18"
							aria-hidden="true"
						/>
						Sobre
					</BaseButton>
				</template>
			</BaseCard>
		</section>

		<BaseModal
			:open="modal !== null"
			:title="modal === 'help' ? 'Ajuda' : 'Sobre Cross Roads Reborn'"
			@update:open="modal = $event ? modal : null"
		>
			<div
				v-if="modal === 'help'"
				class="me-page__modal-copy"
			>
				<h2>Cidade da Cruz!</h2>
				<p>
					Bem vindo à Cidade da Cruz! Aqui, todos os caminhos se cruzam, sejam eles bons ou ruins. Decida seu caminho e
					molde seu futuro nesse jogo de RPG!
				</p>
				<h2>Jogue agora mesmo</h2>
				<p>
					Veja seu inventário acessando seu perfil. Clique no botão de ações e pegue sua recomensa diária que aumenta
					caso você não esqueça nenhum dia!
				</p>
				<h2>Ganhe dinheiro</h2>
				<p>
					Há muitas maneiras de ganhar dinheiro no jogo:
					<NuxtLink to="/jobs">
						<JobsIcon
							:size="16"
							variant="solid"
						/>
						trabalhando
					</NuxtLink
					>,
					<NuxtLink to="/investments">
						<InvestmentIcon
							:size="16"
							variant="solid"
						/>
						investindo
					</NuxtLink
					>,
					<NuxtLink to="/casino">
						<CasinoIcon
							:size="16"
							variant="solid"
						/>
						apostando
					</NuxtLink
					>,
					<NuxtLink to="/rob">
						<RobberyIcon
							:size="16"
							variant="solid"
						/>
						roubando
					</NuxtLink>
					e
					<NuxtLink to="/scavenge">
						<ScavengeIcon
							:size="16"
							variant="solid"
						/>
						vasculhando
					</NuxtLink>
					lugares.
				</p>
				<h2>Notificações e funcionamento</h2>
				<p>
					Para tudo ocorrer belezinha, certifique-se de que você pode receber mensagens privadas de usuários que não
					estão na sua lista de amigos. Se você colocou <strong>Cross Roads</strong> no seu servidor, certifique-se de
					que a permissão
					<strong>Gerenciar Mensagens</strong>
					está ativa!
				</p>
				<h2>Ajude o bot a continuar online</h2>
				<p>
					Adquira Moedas Especiais! As Moedas não tornam o jogo <em>pay-to-win</em>; os benefícios são, em sua maioria,
					somente cosméticos. Visite a <NuxtLink to="/special-shop">Loja Especial</NuxtLink>.
				</p>
				<h2>Ajuda adicional</h2>
				<p>
					Ficou confuso com algo? Encontrou um bug? Entre em contato conosco no
					<a
						href="https://discord.com/invite/sNf8avn"
						target="_blank"
						rel="noreferrer"
					>
						servidor oficial
					</a
					>.
				</p>
			</div>
			<div
				v-else-if="modal === 'about'"
				class="me-page__modal-copy"
			>
				<h2>Direção</h2>
				<p>Jacobi</p>
				<h2>Programação</h2>
				<p>
					Jacobi ·
					<a
						href="https://github.com/edujacobi/"
						target="_blank"
						rel="noreferrer"
					>
						GitHub
						<ExternalLink
							:size="14"
							aria-hidden="true"
						/>
					</a>
				</p>
				<h2>Arte</h2>
				<p>Jacobi, Miguel, Cesar e Kenny</p>
				<p class="me-page__credits">Outros: Quantum, nadalao e CassadorEterno</p>
			</div>
			<template #footer>
				<p class="me-page__modal-footer">
					<BookOpen
						:size="16"
						aria-hidden="true"
					/>
					Cross Roads Reborn
				</p>
			</template>
		</BaseModal>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.me-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
	max-width: 70rem;
	margin: 0 auto;
	height: 100%;

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-md;
		flex-wrap: wrap;

		h1 {
			font-size: clamp($font-size-24, 4vw, 2.5rem);
		}
	}

	&__eyebrow {
		margin-bottom: $spacing-xs;
		color: $color-brand;
		font-size: $font-size-12;
		font-weight: $font-weight-bold;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	&__intro,
	&__help p {
		color: $text-secondary;
	}

	&__clock,
	&__money,
	&__situation {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__clock {
		color: $text-secondary;
		font-variant-numeric: tabular-nums;
	}

	&__overview {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $spacing-md;

		@media (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	&__situation-state {
		min-height: 3rem;
		display: flex;
		align-items: center;
		color: $text-secondary;
	}

	&__money {
		min-height: 3rem;
		font-size: $font-size-24;
	}

	&__event {
		padding: $spacing-md 0;

		&:not(:last-child) {
			border-bottom: 1px solid $border-card;
		}
	}

	&__event-title {
		display: flex;
		align-items: center;
		gap: $spacing-sm;

		span {
			margin-left: auto;
			color: $color-brand;
			font-weight: $font-weight-semibold;
		}
	}

	&__event-dates {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-lg;
		margin-top: $spacing-sm;
		font-size: $font-size-12;

		div {
			display: flex;
			gap: $spacing-xs;
		}

		dt { color: $text-muted; }
		dd { margin: 0; color: $text-secondary; }
	}

	&__links {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}

	&__help {
		margin-top: auto;
	}

	&__error {
		color: $color-danger;
	}

	&__modal-copy {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		color: $text-secondary;
		line-height: 1.6;

		h2 {
			margin-top: $spacing-sm;
			color: $text-primary;
			font-size: $font-size-16;
		}

		a {
			color: $color-brand;
		}

		svg {
			vertical-align: middle;
		}
	}

	&__credits,
	&__modal-footer {
		color: $text-muted;
		font-size: $font-size-12;
	}

	&__modal-footer {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}
}
</style>
