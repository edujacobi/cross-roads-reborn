<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseErrorState from "~/components/ui/BaseErrorState.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { imagePaths } from "~/constants/imagePaths";
import {
	CreateEventDocument,
	DeleteEventDocument,
	GetEventsDocument,
	type GetEventsQuery,
	UpdateEventDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Eventos",
});

interface EventDraft {
	type: string;
	value: string;
	periodStart: string;
	periodEnd: string;
}

type EventRecord = GetEventsQuery["events"][number];

const eventTypes = [
	{ id: 1, name: "Multiplicador de tempo de trabalho", image: imagePaths.situations.job },
	{ id: 2, name: "Multiplicador de tempo para vasculhar", image: imagePaths.situations.scavenging },
	{ id: 3, name: "Multiplicador de tempo procurado", image: imagePaths.situations.wanted },
	{ id: 4, name: "Multiplicador de tempo hospitalizado", image: imagePaths.situations.hospital },
	{ id: 5, name: "Multiplicador de tempo preso", image: imagePaths.situations.prison },
	{ id: 6, name: "Chance bônus de vasculho", image: imagePaths.situations.scavenging },
	{ id: 7, name: "Chance bônus de roubo à locais", image: imagePaths.situations.robbery },
	{ id: 8, name: "Chance bônus de fugir da prisão", image: imagePaths.situations.prison },
];
const eventTypeNames = Object.fromEntries(eventTypes.map(({ id, name }) => [id, name]));

const auth = useAuth();
const { shortDateShortTime } = useDateFormat();
const { showToast } = useToast();
const { result, loading, error: queryError, refetch } = useQuery(GetEventsDocument);
const { mutate: createEvent, loading: creating } = useMutation(CreateEventDocument);
const { mutate: updateEvent, loading: updating } = useMutation(UpdateEventDocument);
const { mutate: deleteEvent } = useMutation(DeleteEventDocument);
const events = computed(() => result.value?.events ?? []);
const page = ref(1);
const pageSize = 15;
const totalPages = computed(() => Math.max(1, Math.ceil(events.value.length / pageSize)));
const pageEvents = computed(() => events.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const canWrite = auth.canWrite;
const isEditorOpen = ref(false);
const isDeleteConfirmationOpen = ref(false);
const editingEventId = ref<number | null>(null);
const deletingEventId = ref<number | null>(null);
const eventPendingDelete = ref<EventRecord | null>(null);
const draft = ref<EventDraft>(emptyDraft());

watch(totalPages, (lastPage) => {
	if (page.value > lastPage) page.value = lastPage;
});

function emptyDraft(): EventDraft {
	return { type: "1", value: "", periodStart: "", periodEnd: "" };
}

function showError(message: string) {
	showToast({ variant: "error", text: message });
}

function beginCreate() {
	editingEventId.value = null;
	draft.value = emptyDraft();
	isEditorOpen.value = true;
}

function toLocalDateInput(value: string): string {
	const date = new Date(value);
	return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function beginEdit(event: EventRecord) {
	editingEventId.value = event.id;
	draft.value = {
		type: String(event.type),
		value: String(event.value),
		periodStart: toLocalDateInput(event.periodStart),
		periodEnd: toLocalDateInput(event.periodEnd),
	};
	isEditorOpen.value = true;
}

function formatDate(value: string): string {
	return shortDateShortTime(value);
}

function getErrorMessage(caughtError: unknown): string {
	return caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
}

function getEventFormattedValue(event: EventRecord) {
	const isMultiplier = eventTypeNames[event.type].includes("Multiplicador");
	const prefix = isMultiplier ? "x" : "+";
	const suffix = isMultiplier ? "" : "%";
	return `${prefix}${event.value}${suffix}`;
}

function prevPage() {
	if (page.value > 1) page.value--;
}

function nextPage() {
	if (page.value < totalPages.value) page.value++;
}

async function saveEvent() {
	const value = Number(draft.value.value);
	const periodStart = new Date(draft.value.periodStart);
	const periodEnd = new Date(draft.value.periodEnd);
	if (
		!draft.value.value.trim() ||
		!Number.isFinite(value) ||
		!Number.isFinite(periodStart.getTime()) ||
		!Number.isFinite(periodEnd.getTime()) ||
		periodStart >= periodEnd
	) {
		showError("Informe um valor válido e um período com início anterior ao fim.");
		return;
	}

	const startIso = periodStart.toISOString();
	const endIso = periodEnd.toISOString();
	try {
		const mutationResult =
			editingEventId.value === null
				? (
						await createEvent({
							type: Number(draft.value.type),
							value,
							periodStart: startIso,
							periodEnd: endIso,
						})
					)?.data?.createEvent
				: (
						await updateEvent({
							id: editingEventId.value,
							value,
							periodStart: startIso,
							periodEnd: endIso,
						})
					)?.data?.updateEvent;
		if (!mutationResult?.success) {
			showError(mutationResult?.message || "Não foi possível salvar o evento.");
			return;
		}
		showToast({ variant: "success", text: mutationResult.message });
		isEditorOpen.value = false;
		await refetch();
	} catch (caughtError: unknown) {
		showError(getErrorMessage(caughtError));
	}
}

function requestDelete(event: EventRecord) {
	eventPendingDelete.value = event;
	isDeleteConfirmationOpen.value = true;
}

async function removeEvent() {
	const event = eventPendingDelete.value;
	if (!event) return;
	deletingEventId.value = event.id;
	try {
		const response = await deleteEvent({ id: event.id });
		if (!response?.data?.deleteEvent.success) {
			showError(response?.data?.deleteEvent.message || "Não foi possível excluir o evento.");
			return;
		}
		showToast({ variant: "success", text: response.data.deleteEvent.message });
		isDeleteConfirmationOpen.value = false;
		eventPendingDelete.value = null;
		await refetch();
	} catch (caughtError: unknown) {
		showError(getErrorMessage(caughtError));
	} finally {
		deletingEventId.value = null;
	}
}
</script>

<template>
	<main class="events-page">
		<PageTitle
			title="Eventos"
			subtitle="Crie, atualize e remova eventos do jogo"
		>
			<template #actions>
				<BaseButton
					v-if="canWrite"
					@click="beginCreate()"
				>
					<Plus
						:size="16"
						aria-hidden="true"
					/>
					Novo evento
				</BaseButton>
			</template>
		</PageTitle>

		<BaseCard
			title="Todos os eventos"
			no-padding-x
			no-padding-y
		>
			<BaseTableSkeleton
				v-if="loading"
				:rows="pageSize"
				:columns="canWrite ? 7 : 6"
				label="Carregando eventos"
			/>
			<BaseErrorState v-else-if="queryError"> Não foi possível carregar os eventos. </BaseErrorState>
			<BaseEmptyState
				v-else-if="events.length === 0"
				:icon="CalendarDays"
			>
				Nenhum evento cadastrado.
			</BaseEmptyState>
			<BaseTable v-else>
				<table class="events-table">
					<caption class="visually-hidden">
						Todos os eventos cadastrados
					</caption>
					<thead>
						<tr>
							<th scope="col">ID</th>
							<th scope="col">Tipo</th>
							<th scope="col">Valor</th>
							<th scope="col">Status</th>
							<th scope="col">Início</th>
							<th scope="col">Fim</th>
							<th
								v-if="canWrite"
								scope="col"
							></th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="event in pageEvents"
							:key="event.id"
						>
							<td class="id-cell">{{ event.id }}</td>
							<td>
								<NuxtImg
									style="vertical-align: sub"
									:src="eventTypes.find(e=> e.id === event.type)?.image"
									width="16"
									alt=""
								/>
								{{ eventTypeNames[event.type] || "Desconhecido" }}
							</td>
							<td>
								{{ getEventFormattedValue(event) }}
							</td>
							<td>
								<BaseBadge :variant="event.isActive ? 'success' : 'neutral'">
									{{ event.isActive ? "Ativo" : "Inativo" }}
								</BaseBadge>
							</td>
							<td><time :datetime="event.periodStart">{{ formatDate(event.periodStart) }}</time></td>
							<td><time :datetime="event.periodEnd">{{ formatDate(event.periodEnd) }}</time></td>
							<td
								v-if="canWrite"
								class="actions-cell"
							>
								<BaseButton
									variant="secondary"
									size="sm"
									:aria-label="`Editar evento ${event.id}`"
									:title="`Editar evento ${event.id}`"
									@click="beginEdit(event)"
								>
									<Pencil
										:size="15"
										aria-hidden="true"
									/>
								</BaseButton>
								<BaseButton
									variant="danger"
									size="sm"
									:disabled="deletingEventId !== null"
									:aria-label="`Excluir evento ${event.id}`"
									:title="`Excluir evento ${event.id}`"
									@click="requestDelete(event)"
								>
									<Trash2
										:size="15"
										aria-hidden="true"
									/>
								</BaseButton>
							</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template
				v-if="events.length > 0"
				#footer
			>
				<BaseTableFooter
					:labels="{


						item: 'eventos',


						navigation: 'Paginação de eventos',


					}"
					:index="pageEvents.length"
					:offset="(page - 1) * pageSize"
					:total="events.length"
					:page="page"
					:pages="totalPages"
					@click-previous="prevPage()"
					@click-next="nextPage()"
				/>
			</template>
		</BaseCard>

		<BaseModal
			:open="isEditorOpen"
			:title="editingEventId === null ? 'Criar evento' : `Editar evento #${editingEventId}`"
			description="Defina o tipo, o valor e o período de atividade."
			@update:open="isEditorOpen = $event"
		>
			<form
				id="event-form"
				class="event-form"
				@submit.prevent="saveEvent()"
			>
				<label
					for="event-type"
					class="input-label"
					>Tipo</label
				>
				<select
					id="event-type"
					v-model="draft.type"
					class="event-select"
					:disabled="editingEventId !== null"
					required
				>
					<option
						v-for="type in eventTypes"
						:key="type.id"
						:value="String(type.id)"
					>
						{{ type.name }}
					</option>
				</select>

				<BaseInput
					id="event-value"
					label="Valor"
					type="number"
					step="any"
					required
					:model-value="draft.value"
					@update:model-value="draft.value = String($event)"
				/>
				<BaseInput
					id="event-start"
					label="Início"
					type="datetime-local"
					required
					:model-value="draft.periodStart"
					@update:model-value="draft.periodStart = String($event)"
				/>
				<BaseInput
					id="event-end"
					label="Fim"
					type="datetime-local"
					required
					:model-value="draft.periodEnd"
					@update:model-value="draft.periodEnd = String($event)"
				/>
			</form>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="creating || updating"
					@click="isEditorOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					type="submit"
					form="event-form"
					:disabled="creating || updating"
				>
					{{ creating || updating ? "Salvando..." : "Salvar evento" }}
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="isDeleteConfirmationOpen"
			title="Excluir evento"
			:description="`Confirma a exclusão do evento #${eventPendingDelete?.id}?`"
			@update:open="isDeleteConfirmationOpen = $event"
		>
			<template #footer>
				<BaseButton
					variant="secondary"
					:disabled="deletingEventId !== null"
					@click="isDeleteConfirmationOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="danger"
					:disabled="deletingEventId !== null"
					@click="removeEvent()"
				>
					{{ deletingEventId !== null ? "Excluindo..." : "Excluir evento" }}
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

.events-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.id-cell {
	font-family: monospace;
	color: $text-muted !important;
}

.actions-cell {
	display: flex;
	gap: $spacing-xs;
	justify-content: end;
}

.state-message {
	@include flex-center;
	flex-direction: column;
	gap: $spacing-sm;
	min-height: 9rem;
	color: $text-muted;
	text-align: center;
}

.error-message {
	color: $color-danger;
}

.event-form {
	display: grid;
	gap: $spacing-md;
}

.input-label {
	margin-bottom: -$spacing-sm;
	font-size: 0.8125rem;
	font-weight: 500;
	color: $text-secondary;
}

.event-select {
	width: 100%;
	padding: 0.625rem 0.875rem;
	background-color: $bg-input;
	border: 1px solid $border-subtle;
	border-radius: $radius-sm;
	color: $text-primary;

	&:disabled {
		opacity: 0.5;
	}
}

</style>
