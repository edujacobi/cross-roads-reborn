<script
	setup
	lang="ts"
>
import { FileText } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseErrorState from "~/components/ui/BaseErrorState.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { markUpdatesAsRead } from "~/composables/useUnreadUpdates";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Atualizações",
});

interface UpdateSection {
	imageUrl: string;
	title: string;
	description: string;
}

export interface UpdateFile {
	version: string;
	title: string;
	date: string;
	comment: string;
	sections: UpdateSection[];
}

const updates = ref<UpdateFile[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function loadUpdates() {
	loading.value = true;
	error.value = null;

	try {
		const response = await fetch("/updates/index.json");
		if (!response.ok) {
			throw new Error("Não foi possível carregar o índice de atualizações.");
		}
		const fileNames = await response.json();
		const promises = fileNames.map(async (fileName: string) => {
			const res = await fetch(`/updates/${fileName}`);
			if (!res.ok) {
				throw new Error(`Não foi possível carregar ${fileName}.`);
			}
			return res.json();
		});
		const results = await Promise.all(promises);
		updates.value = results.sort((a, b) => {
			const partsA = a.version.split(".").map(Number);
			const partsB = b.version.split(".").map(Number);
			for (let i = 0; i < 3; i++) {
				const diff = (partsB[i] ?? 0) - (partsA[i] ?? 0);
				if (diff !== 0) return diff;
			}
			return 0;
		});
		markUpdatesAsRead(updates.value[0]?.version);
	} catch (e) {
		error.value = e instanceof Error ? e.message : "Erro ao carregar atualizações.";
	} finally {
		loading.value = false;
	}
}

await loadUpdates();
</script>

<template>
	<main class="updates-page">
		<PageTitle
			title="Atualizações"
			subtitle="Histórico de atualizações e novidades"
		/>

		<BaseTableSkeleton
			v-if="loading"
			:rows="3"
			:columns="1"
			label="Carregando atualizações"
		/>
		<BaseErrorState v-else-if="error">
			{{ error }}
		</BaseErrorState>
		<BaseEmptyState
			v-else-if="updates.length === 0"
			:icon="FileText"
		>
			Nenhuma atualização cadastrada.
		</BaseEmptyState>
		<div
			v-else
			class="updates-page__list"
		>
			<BaseCard
				v-for="update in updates"
				:key="update.version"
				:title="update.title"
				:subtitle="update.version"
			>
				<template #actions>
					<p class="updates-page__update-date">{{ update.date }}</p>
				</template>
				<p class="updates-page__update-comment">{{ update.comment }}</p>
				<div
					v-for="(section, idx) in update.sections"
					:key="idx"
					class="updates-page__section"
				>
					<div class="updates-page__section-header">
						<NuxtImg
							v-if="section.imageUrl"
							:src="section.imageUrl"
							class="updates-page__section-icon"
							width="32"
							height="32"
							alt=""
						/>
						<h3 class="updates-page__section-title">{{ section.title }}</h3>
					</div>
					<p class="updates-page__section-description">{{ section.description }}</p>
				</div>
			</BaseCard>
		</div>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.updates-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__list {
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
	}

	&__update-comment {
		margin-bottom: 2rem;
		font-size: 0.9rem;
		line-height: 1.7;
		color: $text-primary;
	}

	&__update-date {
		font-size: 0.85rem;
		font-weight: 500;
		color: $text-secondary;
	}

	&__section {
		padding: $spacing-md;
		border-radius: $radius-sm;
		background-color: $bg-card-header;

		&:not(:first-child) {
			margin-top: $spacing-md;
		}
	}

	&__section-header {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		margin-bottom: $spacing-xs;
	}

	&__section-icon {
		flex-shrink: 0;
	}

	&__section-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: $text-primary;
	}

	&__section-description {
		margin: 0;
		font-size: 0.875rem;
		color: $text-secondary;
		line-height: 1.7;
	}
}
</style>
