<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ArrowLeft, Pencil, Shield, ShieldAlert, ShieldCheck } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseErrorState from "~/components/ui/BaseErrorState.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSelector from "~/components/ui/BaseSelector.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import { imagePaths } from "~/constants/imagePaths";
import { GetGangDetailDocument, UpdateGangDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Gangue",
});

const route = useRoute();
const router = useRouter();
const { formatMoney } = useMoneyFormat();
const { getGangBaseImageUrl } = useGangBase();
const auth = useAuth();
const { showToast } = useToast();

const gangId = computed(() => String(route.params.id));

const { result: gangData, loading, error, refetch } = useQuery(GetGangDetailDocument, () => ({ id: gangId.value }));

const gang = computed(() => gangData.value?.gang);
const expRatio = computed(() => {
	if (!gang.value || gang.value.level >= 10) return 1;
	return Math.min(gang.value.experience / gang.value.xpForNextLevel, 1);
});
const expPercent = computed(() => Math.round(expRatio.value * 100));

// Edit gang functionality
const gangColors = [
	{ value: "grey", label: "Cinza", colorHex: "#89999A" },
	{ value: "purple", label: "Roxo", colorHex: "#7345C4" },
	{ value: "blue", label: "Azul", colorHex: "#448aff" },
	{ value: "green", label: "Verde", colorHex: "#4caf50" },
	{ value: "yellow", label: "Amarelo", colorHex: "#fdd835" },
	{ value: "orange", label: "Laranja", colorHex: "#ff9100" },
	{ value: "red", label: "Vermelho", colorHex: "#e53935" },
	{ value: "pink", label: "Rosa", colorHex: "#EB459E" },
];

const canEdit = computed(() => {
	if (!gang.value) return false;
	const userId = auth.user.value?.userId;
	if (!userId) return false;
	if (gang.value.leaderId === userId) return true;
	const member = gang.value.members.find((m) => m.userId === userId);
	if (!member) return false;
	const role = gang.value.roles.find((r) => r.id === member.roleId);
	return role?.canEditGang ?? false;
});

const isEditModalOpen = ref(false);
const editDraft = ref({
	name: "",
	acronym: "",
	description: "",
	color: "",
	imageUrl: "",
});

const { mutate: updateGangMutation, loading: updating } = useMutation(UpdateGangDocument);

function openEditModal() {
	if (!gang.value) return;
	// Map hex color back to color name
	const hexToColor: Record<string, string> = {
		"#89999A": "grey",
		"#7345C4": "purple",
		"#448AFF": "blue",
		"#4CAF50": "green",
		"#FDD835": "yellow",
		"#FF9100": "orange",
		"#E53935": "red",
		"#EB459E": "pink",
	};
	editDraft.value = {
		name: gang.value.name,
		acronym: gang.value.acronym,
		description: gang.value.description,
		color: hexToColor[gang.value.color?.toUpperCase()] ?? "",
		imageUrl: gang.value.imageUrl ?? "",
	};
	isEditModalOpen.value = true;
}

async function updateGang() {
	const res = await updateGangMutation({
		id: gangId.value,
		name: editDraft.value.name || null,
		acronym: editDraft.value.acronym || null,
		description: editDraft.value.description || null,
		color: editDraft.value.color || null,
		imageUrl: editDraft.value.imageUrl || null,
	});

	if (res?.errors?.[0]) {
		showToast({ text: res.errors[0].message ?? "Falha ao atualizar gangue.", variant: "error" });
		return;
	}
	if (res?.data?.updateGang?.success) {
		showToast({ text: "Gangue atualizada com sucesso!", variant: "success" });
		isEditModalOpen.value = false;
		await refetch();
	} else {
		const message = res?.data?.updateGang?.message ?? "Falha ao atualizar gangue.";
		showToast({ text: message, variant: "error" });
	}
}
</script>

<template>
	<main
		class="gang-detail"
		:style="{ '--highlight-color': gang?.color ?? '#89999A' }"
	>
		<nav
			class="gang-detail__nav-back"
			aria-label="Navegação da gangue"
		>
			<BaseButton
				variant="ghost"
				size="sm"
				@click="router.back()"
			>
				<ArrowLeft
					:size="16"
					aria-hidden="true"
				/>
				Voltar
			</BaseButton>
		</nav>

		<BaseErrorState v-if="error"> Não foi possível carregar os dados da gangue. </BaseErrorState>

		<BaseTableSkeleton
			v-else-if="loading"
			:rows="6"
			:columns="3"
			label="Carregando gangue"
		/>

		<div
			v-else-if="!gang"
			class="gang-detail__not-found"
		>
			<h1>Gangue não encontrada</h1>
			<p>Nenhuma gangue com o ID {{ gangId }} foi encontrada.</p>
		</div>

		<template v-else>
			<!-- Header Card -->
			<BaseCard class="gang-detail__header">
				<div class="gang-header">
					<NuxtImg
						class="gang-header__avatar"
						:src="gang.imageUrl || useFallbackGangImage(gang.id)"
						alt=""
						width="96"
						height="96"
					/>
					<div class="gang-header__info">
						<div class="gang-header__title-row">
							<h1 class="gang-header__title">[{{ gang.acronym }}] {{ gang.name }}</h1>
							<BaseButton
								v-if="canEdit"
								variant="ghost"
								size="sm"
								@click="openEditModal()"
							>
								<Pencil
									:size="16"
									aria-hidden="true"
								/>
								Editar gangue
							</BaseButton>
						</div>
						<p class="gang-header__description">{{ gang.description || "—" }}</p>
						<p class="gang-header__stats">
							{{ formatMoney(gang.money) }}
						</p>
					</div>
				</div>

				<!-- XP Progress Bar -->
				<div class="gang-xp-bar">
					<div class="gang-xp-bar__label">
						<span> Nível {{ gang.level }}</span>
						<span>
							Experiência
							{{ gang.experience.toLocaleString("pt-BR") }}
							/ {{ gang.xpForNextLevel.toLocaleString("pt-BR") }} ({{ expPercent }}%)
						</span>
					</div>
					<div class="gang-xp-bar__track">
						<div
							class="gang-xp-bar__fill"
							:style="{ width: gang.level >= 10 ? '100%' : `${expPercent}%` }"
						/>
					</div>
					<span
						v-if="gang.level >= 10"
						class="gang-xp-bar__max"
					>
						MAX
					</span>
				</div>
			</BaseCard>

			<div class="gang-detail__content">
				<!-- Base Card -->
				<div class="columns">
					<!-- Members Table -->
					<BaseCard
						:title="`Membros (${gang.members.length})`"
						no-padding-x
						no-padding-y
					>
						<BaseTable class="table-container">
							<table class="gang-members-table">
								<caption class="visually-hidden">
									Membros da gangue
								</caption>
								<thead>
									<tr>
										<th scope="col">Membro</th>
										<th scope="col">Cargo</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="member in gang.members"
										:key="member.userId"
										class="clickable-row"
										tabindex="0"
										@click="navigateTo(`/users/${member.userId}`)"
										@keydown.enter.prevent="navigateTo(`/users/${member.userId}`)"
									>
										<th scope="row">
											<div class="member-cell">
												<NuxtImg
													:class="['member-avatar', 'user-avatar', member.avatarDecoration ? `user-avatar--${member.avatarDecoration}` : '']"
													:src="member.avatarUrl || useFallbackUserImage(member.userId)"
													alt=""
													width="32"
													height="32"
												/>
												<span>{{ member.nickname }}</span>
											</div>
										</th>
										<td>
											<span
												class="role-badge"
												:data-perm="member.userId === gang.leaderId ? 'leader' : member.permissionCount"
											>
												{{ member.roleName }}
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</BaseTable>
					</BaseCard>
					<BaseCard
						v-if="gang.base"
						title="Base da gangue"
					>
						<div class="gang-base-info">
							<NuxtImg
								v-if="gang.base.id"
								:src="getGangBaseImageUrl(gang.base.id)"
								alt=""
								width="128"
								height="128"
							/>
							<span v-else>
								<Shield
									:size="24"
									aria-hidden="true"
								/>
							</span>
							<div class="gang-base-details">
								<p class="gang-base-details__name">{{ gang.base.name }}</p>
								<template v-if="gang.base.modifierDefense">
									<p class="gang-base-details__modifier">
										<NuxtImg
											:src="imagePaths.attributes.defense"
											width="20"
											aria-hidden="true"
											alt=""
										/>
										+{{ gang.base.modifierDefense * gang.level }} DEF
									</p>
								</template>
								<template v-if="gang.base.modifierAttack">
									<p class="gang-base-details__modifier">
										<NuxtImg
											:src="imagePaths.attributes.attack"
											width="20"
											aria-hidden="true"
											alt=""
										/>
										+{{ gang.base.modifierAttack * gang.level }} ATK
									</p>
								</template>
								<template v-if="gang.base.modifierPrisonEscape">
									<p class="gang-base-details__modifier">
										<NuxtImg
											:src="imagePaths.uiElements.escape"
											width="20"
											aria-hidden="true"
											alt=""
										/>
										+{{ gang.base.modifierPrisonEscape * gang.level }}% fuga da prisão
									</p>
								</template>
							</div>
						</div>
					</BaseCard>
				</div>
				<!-- Roles Table -->
				<BaseCard
					:title="`Cargos (${gang.roles.length})`"
					no-padding-x
					no-padding-y
				>
					<BaseTable>
						<table class="gang-roles-table">
							<caption class="visually-hidden">
								Cargos da gangue
							</caption>
							<thead>
								<tr>
									<th scope="col">Cargo</th>
									<th scope="col">Convidar</th>
									<th scope="col">Expulsar</th>
									<th scope="col">Promover</th>
									<th scope="col">Editar</th>
									<th scope="col">Importar</th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-for="role in gang.roles"
									:key="role.id"
								>
									<th scope="row">
										{{ role.name }}
									</th>
									<td class="perm-cell">
										<component
											:is="role.canInvite ? ShieldCheck : ShieldAlert"
											:size="16"
											class="perm-icon"
											:class="role.canInvite ? 'perm-icon--yes' : 'perm-icon--no'"
											:aria-label="role.canInvite ? 'Sim' : 'Não'"
										/>
									</td>
									<td class="perm-cell">
										<component
											:is="role.canKick ? ShieldCheck : ShieldAlert"
											:size="16"
											class="perm-icon"
											:class="role.canKick ? 'perm-icon--yes' : 'perm-icon--no'"
											:aria-label="role.canKick ? 'Sim' : 'Não'"
										/>
									</td>
									<td class="perm-cell">
										<component
											:is="role.canPromote ? ShieldCheck : ShieldAlert"
											:size="16"
											class="perm-icon"
											:class="role.canPromote ? 'perm-icon--yes' : 'perm-icon--no'"
											:aria-label="role.canPromote ? 'Sim' : 'Não'"
										/>
									</td>
									<td class="perm-cell">
										<component
											:is="role.canEditGang ? ShieldCheck : ShieldAlert"
											:size="16"
											class="perm-icon"
											:class="role.canEditGang ? 'perm-icon--yes' : 'perm-icon--no'"
											:aria-label="role.canEditGang ? 'Sim' : 'Não'"
										/>
									</td>
									<td class="perm-cell">
										<component
											:is="role.canImport ? ShieldCheck : ShieldAlert"
											:size="16"
											class="perm-icon"
											:class="role.canImport ? 'perm-icon--yes' : 'perm-icon--no'"
											:aria-label="role.canImport ? 'Sim' : 'Não'"
										/>
									</td>
								</tr>
							</tbody>
						</table>
					</BaseTable>
				</BaseCard>

				<!-- Metadata -->
				<div class="gang-detail__meta">
					Criada em
					{{
						new Date(gang.createdAt).toLocaleDateString("pt-BR", {
							day: "2-digit",
							month: "long",
							year: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})
					}}
					• ID: {{ gang.id }}
				</div>
			</div>

			<!-- Edit Gang Modal -->
			<BaseModal
				:open="isEditModalOpen"
				title="Editar gangue"
				description="Edite as informações da gangue."
				@update:open="isEditModalOpen = $event"
			>
				<form
					id="edit-gang-form"
					class="gangs-page__create-form"
					@submit.prevent="updateGang()"
				>
					<BaseInput
						id="edit-gang-name"
						label="Nome"
						placeholder="Nome da gangue"
						:minlength="4"
						:maxlength="50"
						required
						:model-value="editDraft.name"
						@update:model-value="editDraft.name = String($event)"
					/>
					<BaseInput
						id="edit-gang-acronym"
						label="Acrônimo"
						placeholder="Ex: GUN"
						:minlength="2"
						:maxlength="3"
						required
						:model-value="editDraft.acronym"
						@update:model-value="editDraft.acronym = String($event)"
					/>
					<div class="gangs-page__form-field">
						<label
							for="edit-gang-description"
							class="gangs-page__input-label"
						>
							Descrição
						</label>
						<textarea
							id="edit-gang-description"
							v-model="editDraft.description"
							class="gangs-page__textarea"
							placeholder="Descreva sua gangue"
							maxlength="500"
							required
						/>
					</div>
					<BaseSelector
						id="edit-gang-color"
						label="Cor"
						placeholder="Selecione uma cor"
						:options="gangColors"
						:model-value="editDraft.color"
						required
						@update:model-value="editDraft.color = String($event)"
					/>
					<BaseInput
						id="edit-gang-image"
						label="URL da imagem (opcional)"
						placeholder="https://..."
						:model-value="editDraft.imageUrl"
						@update:model-value="editDraft.imageUrl = String($event)"
					/>
				</form>
				<template #footer>
					<BaseButton
						variant="secondary"
						:disabled="updating"
						@click="isEditModalOpen = false"
					>
						Cancelar
					</BaseButton>
					<BaseButton
						type="submit"
						form="edit-gang-form"
						:disabled="updating"
					>
						{{ updating ? "Salvando..." : "Salvar alterações" }}
					</BaseButton>
				</template>
			</BaseModal>
		</template>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

$highlight-color: var(--highlight-color);
$border-color: color-mix(in lab, $border-card 100%, $highlight-color 75%);
$background-color: color-mix(in lab, $bg-card 100%, $highlight-color 15%);

.gangs-page {
	&__create-form {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	&__form-field {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		width: 100%;
	}

	&__input-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-secondary;
	}

	&__textarea {
		width: 100%;
		padding: 0.625rem 0.875rem;
		background-color: $bg-input;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		color: $text-primary;
		outline: none;
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
		font-size: 0.875rem;
		transition: border-color $transition-fast ease-in-out;

		&::placeholder {
			color: $text-muted;
		}

		&:focus {
			border-color: $color-brand;
		}
	}
}

.gang-detail {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
	container-name: page;
	container-type: inline-size;

	&__nav-back {
		margin-bottom: $spacing-xs;
	}

	&__not-found {
		@include flex-center;
		flex-direction: column;
		gap: 12px;
		padding: 3.75rem 1.25rem;
		color: $text-secondary;
	}

	&__content {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;

		.columns {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: $spacing-md;

			@container page (max-width: 700px) {
				grid-template-columns: 1fr;
			}
		}
	}

	&__meta {
		color: $text-muted;
		font-size: 0.75rem;
		text-align: center;
	}

	&__header {
		border-color: $border-color;
		background-color: $background-color;
	}
}

.gang-header {
	display: flex;
	gap: 1.25rem;
	align-items: flex-start;

	@media (max-width: $bp-mobile) {
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: $spacing-md;
	}

	&__title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;

		@media (max-width: $bp-mobile) {
			flex-direction: column;
			align-items: center;
		}
	}

	&__avatar {
		flex-shrink: 0;
		width: 6rem;
		height: 6rem;
		border-radius: $radius-lg;
		object-fit: cover;
		background-color: $bg-subtle;
		border: 1px solid $border-color;
	}

	&__info {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	&__title {
		font-size: 1.5rem;
		font-weight: 700;
		color: $text-primary;
		margin: 0 0 $spacing-xs;
	}

	&__description {
		color: $text-secondary;
		font-style: italic;
		margin: 0 0 $spacing-sm;
	}

	&__stats {
		border-radius: $radius-full;
		color: $text-primary;
		font-size: 1.2rem;
		font-weight: 600;
		margin-top: $spacing-sm;
		text-align: right;
	}
}

.gang-xp-bar {
	margin-top: $spacing-lg;

	&__label {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
		color: $text-secondary;
		margin-bottom: $spacing-xs;
	}

	&__track {
		height: 0.75rem;
		background-color: $bg-input-field;
		border-radius: $radius-full;
		overflow: hidden;
	}

	&__fill {
		height: 100%;
		background: linear-gradient(90deg, $highlight-color, color-mix(in srgb, $highlight-color 70%, white));
		border-radius: $radius-full;
		transition: width $transition-slow ease;
	}

	&__max {
		display: block;
		text-align: right;
		font-size: 0.75rem;
		font-weight: 700;
		color: $color-special;
		margin-top: $spacing-xs;
	}
}

.gang-base-info {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	color: $text-secondary;

	> img {
		width: 8rem;
		height: 8rem;
		border-radius: $radius-lg;
	}

	svg {
		color: $text-muted;
	}
}

.gang-base-details {
	display: flex;
	flex-direction: column;
	gap: 4px;

	&__name {
		font-weight: 600;
		color: $text-primary;
		margin: 0;
	}

	&__modifier {
		display: flex;
		align-items: center;
		font-size: 0.8125rem;
		color: $color-attribute;
		margin: 0;
	}
}

.member-cell {
	display: flex;
	align-items: center;
	gap: 8px;
}

.member-avatar {
	width: 2rem;
	height: 2rem;
	flex-shrink: 0;
	border-width: 2px;
}

.gang-leader {
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;

	&__name {
		font-weight: 600;
		color: $text-primary;
	}

	&__id {
		font-size: 0.8125rem;
		color: $text-muted;
	}
}

.table-container {
	max-height: 50dvh;
	overflow-y: auto;
}

.clickable-row {
	@include row-hover;
}

.role-badge {
	position: relative;
	padding: 0.125rem 0.5rem 0.125rem 1.25rem;
	border-radius: $radius-full;
	background-color: $background-color;
	color: $highlight-color;
	font-size: 0.75rem;
	font-weight: 600;

	&::before {
		content: "";
		position: absolute;
		left: 0.375rem;
		top: 50%;
		transform: translateY(-50%);
		width: 0.5rem;
		height: 0.5rem;
		background-color: $highlight-color;
		border-radius: $radius-full;
	}

	// 0 permissions: small circle
	&[data-perm="0"]::before {
		width: 0.375rem;
		height: 0.375rem;
		transform: translateY(-50%) translateX(40%);
	}

	// 1 permission: big circle (default size above)
	&[data-perm="1"]::before {
		width: 0.625rem;
		height: 0.625rem;
	}

	// 2 permissions: triangle
	&[data-perm="2"]::before {
		width: 0;
		height: 0;
		background-color: transparent;
		border-left: 0.4rem solid transparent;
		border-right: 0.4rem solid transparent;
		border-bottom: 0.7rem solid $highlight-color;
	}

	// 3 permissions: diamond (losange)
	&[data-perm="3"]::before {
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 0;
		transform: translateY(-60%) translateX(40%)  rotate(45deg);
	}

	// 4 permissions: pentagon
	&[data-perm="4"]::before {
		width: 0.6rem;
		height: 0.575rem;
		border-radius: 0;
		clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
	}

	// Leader: hexagon
	&[data-perm="leader"]::before {
		width: 0.65rem;
		height: 0.6rem;
		border-radius: 0;
		clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
	}
}

.permission-count {
	color: $text-muted;
	font-size: 0.8125rem;
}

.perm-icon {
	&--yes {
		color:  $highlight-color;
	}

	&--no {
		color: $text-muted;
		opacity: 0.5;
	}
}
</style>
