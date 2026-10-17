<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import {
	ArrowLeft,
	Crown,
	LogOut,
	MessageSquareText,
	Pencil,
	Plus,
	Shield,
	ShieldAlert,
	ShieldCheck,
	UserMinus,
	UserPlus,
	UserRoundCog,
	Wallet,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseErrorState from "~/components/ui/BaseErrorState.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSelector, { type SelectorOption } from "~/components/ui/BaseSelector.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import { imagePaths } from "~/constants/imagePaths";
import {
	CancelGangImportDocument,
	CommunicateGangDocument,
	CreateGangRoleDocument,
	DepositGangDocument,
	type GangRoleInfo,
	GetGangDetailDocument,
	InviteGangMemberDocument,
	KickGangMemberDocument,
	LeaveGangDocument,
	SearchUsersDocument,
	type SearchUsersQuery,
	SetGangMoneyDocument,
	SetMoneyMode,
	StartGangImportDocument,
	TransferGangDocument,
	UpdateGangDocument,
	UpdateGangMemberRoleDocument,
	UpdateGangRoleDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Gangue",
});

const route = useRoute();
const router = useRouter();
const { formatMoney } = useMoneyFormat();
const { relative } = useDateFormat();
const { getGangBaseImageUrl, getGangBaseShipmentImageUrl } = useGangBase();
const auth = useAuth();
const canWrite = auth.canWrite;
const { showToast } = useToast();

const gangId = computed(() => String(route.params.id));

const { result: gangData, loading, error, refetch } = useQuery(GetGangDetailDocument, () => ({ id: gangId.value }));

const gang = computed(() => gangData.value?.gang);
const maxDepositAmount = computed(() => gang.value?.maxDepositAmount ?? 0);
const currentUserId = computed(() => auth.user.value?.userId);
const currentMember = computed(() => gang.value?.members.find((member) => member.userId === currentUserId.value));
const currentRole = computed(() => gang.value?.roles.find((role) => role.id === currentMember.value?.roleId));
const canPromoteMembers = computed(
	() =>
		!!currentMember.value && (currentUserId.value === gang.value?.leaderId || currentRole.value?.canPromote === true),
);
const canKickMembers = computed(() => !!currentMember.value && currentRole.value?.canKick === true);
const canManageMembers = computed(() => canPromoteMembers.value || canKickMembers.value);
const canCommunicate = computed(
	() =>
		!!currentMember.value && (currentUserId.value === gang.value?.leaderId || currentRole.value?.canEditGang === true),
);
const memberSortOptions: SelectorOption[] = [
	{ value: "role", label: "Cargo" },
	{ value: "name", label: "Nome" },
	{ value: "depositDate", label: "Data do último depósito" },
	{ value: "depositAmount", label: "Total depositado" },
];
const memberSort = ref("role");
const sortedMembers = computed(() =>
	[...(gang.value?.members ?? [])].sort((first, second) => {
		const nameOrder = first.nickname.localeCompare(second.nickname, "pt-BR");
		switch (memberSort.value) {
			case "name":
				return nameOrder;
			case "depositDate":
				return (
					(second.lastDepositAt ? new Date(second.lastDepositAt).getTime() : 0) -
						(first.lastDepositAt ? new Date(first.lastDepositAt).getTime() : 0) || nameOrder
				);
			case "depositAmount":
				return second.depositAmount - first.depositAmount || nameOrder;
			default:
				return second.permissionCount - first.permissionCount || nameOrder;
		}
	}),
);
const canInviteMembers = computed(
	() =>
		!!currentMember.value && (currentUserId.value === gang.value?.leaderId || currentRole.value?.canInvite === true),
);
const canTransferGang = computed(
	() => currentUserId.value === gang.value?.leaderId && (gang.value?.members.length ?? 0) > 1,
);
const canLeaveGang = computed(
	() => !!currentMember.value && (currentUserId.value !== gang.value?.leaderId || gang.value?.members.length === 1),
);
const rolesByPermissionCount = computed(() =>
	[...(gang.value?.roles ?? [])]
		.filter((role) => role.id !== gang.value?.members.find((member) => member.userId === gang.value?.leaderId)?.roleId)
		.sort((a, b) => getRolePermissionCount(b) - getRolePermissionCount(a)),
);
const changeRoleOptions = computed(() =>
	[...(gang.value?.roles ?? [])]
		.filter((role) => role.id !== gang.value?.members.find((member) => member.userId === gang.value?.leaderId)?.roleId)
		.sort((a, b) => a.id - b.id)
		.map((role) => ({ value: String(role.id), label: role.name })),
);
const transferOptions = computed(() =>
	(gang.value?.members ?? [])
		.filter((member) => member.userId !== currentUserId.value)
		.map((member) => ({ value: member.userId, label: member.nickname })),
);
const expRatio = computed(() => {
	if (!gang.value || gang.value.level >= 10) return 1;
	return Math.min(gang.value.experience / gang.value.xpForNextLevel, 1);
});
const expPercent = computed(() => Math.round(expRatio.value * 100));

function getRolePermissionCount(role: GangRoleInfo) {
	return [role.canInvite, role.canKick, role.canPromote, role.canEditGang, role.canImport].filter(Boolean).length;
}

function isEditableRole(role: GangRoleInfo) {
	return !["member", "membro", "miembro"].includes(role.name.toLowerCase());
}

const roleDraftPermissionCount = computed(
	() =>
		[
			roleDraft.value.canInvite,
			roleDraft.value.canKick,
			roleDraft.value.canPromote,
			roleDraft.value.canEditGang,
			roleDraft.value.canImport,
		].filter(Boolean).length,
);

const canManageRoles = computed(() => gang.value?.leaderId === auth.user.value?.userId);
const isRoleEditorOpen = ref(false);
const editingRole = ref<GangRoleInfo | null>(null);
const roleDraft = ref(emptyRoleDraft());
const { mutate: createGangRole, loading: creatingRole } = useMutation(CreateGangRoleDocument);
const { mutate: updateGangRole, loading: updatingRole } = useMutation(UpdateGangRoleDocument);
const { mutate: updateGangMemberRole, loading: changingMemberRole } = useMutation(UpdateGangMemberRoleDocument);
const { mutate: kickGangMember, loading: kickingMember } = useMutation(KickGangMemberDocument);
const { mutate: communicateGang, loading: communicating } = useMutation(CommunicateGangDocument);
const { mutate: depositGang, loading: depositing } = useMutation(DepositGangDocument);
const { mutate: leaveGang, loading: leavingGang } = useMutation(LeaveGangDocument);
const { mutate: transferGang, loading: transferringGang } = useMutation(TransferGangDocument);
const { mutate: inviteGangMember, loading: invitingMember } = useMutation(InviteGangMemberDocument);
const isMemberRoleModalOpen = ref(false);
const memberRoleTargetId = ref("");
const memberRoleTarget = computed(() =>
	gang.value?.members.find((member) => member.userId === memberRoleTargetId.value),
);
const memberRoleDraft = ref("");
const isMemberKickConfirmationOpen = ref(false);
const isCommunicationModalOpen = ref(false);
const communicationMessage = ref("");
const isDepositModalOpen = ref(false);
const depositAmount = ref("");
const isLeaveGangModalOpen = ref(false);
const isTransferModalOpen = ref(false);
const transferTargetId = ref("");
const isInviteModalOpen = ref(false);
const inviteSearch = ref("");
const inviteTargetId = ref("");
const { result: inviteSearchResult, loading: searchingInviteTargets } = useQuery(
	SearchUsersDocument,
	() => ({
		search: inviteSearch.value.trim() || undefined,
		limit: 10,
		offset: 0,
	}),
	() => ({ enabled: isInviteModalOpen.value && inviteSearch.value.trim().length > 0, debounce: 300 }),
);
const inviteCandidates = computed<SearchUsersQuery["users"]["users"]>(() =>
	(inviteSearchResult.value?.users.users ?? []).filter(
		(user) => user.id !== currentUserId.value && !gang.value?.members.some((member) => member.userId === user.id),
	),
);
const inviteTargetOptions = computed(() =>
	inviteCandidates.value.map((user) => ({ value: user.id, label: `${user.nickname} (${user.id})` })),
);
const { mutate: startGangImport, loading: startingImport } = useMutation(StartGangImportDocument);
const { mutate: cancelGangImport, loading: cancellingImport } = useMutation(CancelGangImportDocument);
const isImportCancelConfirmationOpen = ref(false);
const importProgressTime = ref(Date.now());
let importProgressTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
	importProgressTimer = setInterval(() => {
		importProgressTime.value = Date.now();
	}, 1_000);
});

onUnmounted(() => {
	if (importProgressTimer) clearInterval(importProgressTimer);
});

const importProgress = computed(() => {
	const startedAt = gang.value?.shipmentStartedAt;
	const arrivesAt = gang.value?.shipmentArrivesAt;
	if (!startedAt || !arrivesAt) return 0;

	const startedAtMs = new Date(startedAt).getTime();
	const durationMs = new Date(arrivesAt).getTime() - startedAtMs;
	return Math.min(100, Math.max(0, ((importProgressTime.value - startedAtMs) / durationMs) * 100));
});

async function startGangShipmentImport() {
	try {
		const result = (await startGangImport({ gangId: gangId.value }))?.data?.startGangImport;
		showToast({
			text: result?.message ?? "Falha ao iniciar a importação.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) await refetch();
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

async function cancelGangShipmentImport() {
	try {
		const result = (await cancelGangImport({ gangId: gangId.value }))?.data?.cancelGangImport;
		showToast({
			text: result?.message ?? "Falha ao cancelar a importação.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isImportCancelConfirmationOpen.value = false;
			await refetch();
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

function emptyRoleDraft() {
	return { name: "", canInvite: false, canKick: false, canPromote: false, canEditGang: false, canImport: false };
}

function beginCreateRole() {
	editingRole.value = null;
	roleDraft.value = emptyRoleDraft();
	isRoleEditorOpen.value = true;
}

function beginEditRole(role: GangRoleInfo) {
	editingRole.value = role;
	roleDraft.value = {
		name: role.name,
		canInvite: role.canInvite,
		canKick: role.canKick,
		canPromote: role.canPromote,
		canEditGang: role.canEditGang,
		canImport: role.canImport,
	};
	isRoleEditorOpen.value = true;
}

async function saveRole() {
	const variables = { gangId: gangId.value, ...roleDraft.value, name: roleDraft.value.name.trim() };
	try {
		const result = editingRole.value
			? (await updateGangRole({ ...variables, roleId: editingRole.value.id }))?.data?.updateGangRole
			: (await createGangRole(variables))?.data?.createGangRole;
		if (!result?.success) {
			showToast({ text: result?.message ?? "Falha ao salvar o cargo.", variant: "error" });
			return;
		}
		showToast({ text: result.message, variant: "success" });
		isRoleEditorOpen.value = false;
		await refetch();
	} catch (caughtError: unknown) {
		showToast({
			text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.",
			variant: "error",
		});
	}
}

function openMemberRoleModal(member: { userId: string; roleId: number }) {
	memberRoleTargetId.value = member.userId;
	memberRoleDraft.value = String(member.roleId);
	isMemberRoleModalOpen.value = true;
}

function openInviteModal() {
	inviteSearch.value = "";
	inviteTargetId.value = "";
	isInviteModalOpen.value = true;
}

function updateInviteSearch(value: string | number) {
	inviteSearch.value = String(value);
	inviteTargetId.value = "";
}

async function saveMemberRole() {
	if (!memberRoleTargetId.value || !memberRoleDraft.value) return;
	try {
		const result = (
			await updateGangMemberRole({
				gangId: gangId.value,
				targetUserId: memberRoleTargetId.value,
				roleId: Number(memberRoleDraft.value),
			})
		)?.data?.updateGangMemberRole;
		showToast({
			text: result?.message ?? "Falha ao alterar o cargo do membro.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isMemberRoleModalOpen.value = false;
			await refetch();
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

function beginMemberKick() {
	isMemberRoleModalOpen.value = false;
	isMemberKickConfirmationOpen.value = true;
}

function cancelMemberKick() {
	isMemberKickConfirmationOpen.value = false;
	isMemberRoleModalOpen.value = true;
}

async function confirmMemberKick() {
	if (!memberRoleTargetId.value) return;
	try {
		const result = (await kickGangMember({ gangId: gangId.value, targetUserId: memberRoleTargetId.value }))?.data
			?.kickGangMember;
		showToast({
			text: result?.message ?? "Falha ao expulsar o membro.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isMemberKickConfirmationOpen.value = false;
			memberRoleTargetId.value = "";
			await refetch();
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

function openCommunicationModal() {
	communicationMessage.value = "";
	isCommunicationModalOpen.value = true;
}

async function sendGangCommunication() {
	const message = communicationMessage.value.trim();
	if (!message) {
		showToast({ text: "Escreva uma mensagem para enviar.", variant: "error" });
		return;
	}
	try {
		const result = (await communicateGang({ gangId: gangId.value, message }))?.data?.communicateGang;
		showToast({
			text: result?.message ?? "Falha ao enviar o comunicado.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isCommunicationModalOpen.value = false;
			communicationMessage.value = "";
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

async function submitGangDeposit() {
	const amount = Number(depositAmount.value);
	if (!Number.isSafeInteger(amount) || amount <= 0) {
		showToast({ text: "Informe um valor inteiro maior que zero.", variant: "error" });
		return;
	}
	try {
		const result = (await depositGang({ gangId: gangId.value, amount }))?.data?.depositGang;
		showToast({
			text: result?.message ?? "Falha ao depositar.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isDepositModalOpen.value = false;
			depositAmount.value = "";
			await refetch();
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

async function confirmLeaveGang() {
	try {
		const result = (await leaveGang({ gangId: gangId.value }))?.data?.leaveGang;
		showToast({
			text: result?.message ?? "Falha ao sair da gangue.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isLeaveGangModalOpen.value = false;
			if (currentUserId.value === gang.value?.leaderId) {
				await router.push("/gangs");
			} else {
				await refetch();
			}
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

async function confirmGangTransfer() {
	if (!transferTargetId.value) return;
	try {
		const result = (await transferGang({ gangId: gangId.value, targetUserId: transferTargetId.value }))?.data
			?.transferGang;
		showToast({
			text: result?.message ?? "Falha ao transferir a liderança.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isTransferModalOpen.value = false;
			await refetch();
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

async function sendGangInvite() {
	if (!inviteTargetId.value) return;
	try {
		const result = (await inviteGangMember({ gangId: gangId.value, targetUserId: inviteTargetId.value }))?.data
			?.inviteGangMember;
		showToast({
			text: result?.message ?? "Falha ao enviar o convite.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isInviteModalOpen.value = false;
			inviteSearch.value = "";
			inviteTargetId.value = "";
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

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
const isGangMoneyModalOpen = ref(false);
const gangMoneyAmount = ref("0");
const gangMoneyMode = ref<SetMoneyMode.Add | SetMoneyMode.Set>(SetMoneyMode.Add);
const editDraft = ref({
	name: "",
	acronym: "",
	description: "",
	color: "",
	imageUrl: "",
});

const { mutate: updateGangMutation, loading: updating } = useMutation(UpdateGangDocument);
const { mutate: setGangMoney, loading: settingGangMoney } = useMutation(SetGangMoneyDocument);

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

async function updateGangMoney() {
	const amount = Number(gangMoneyAmount.value);
	if (!Number.isSafeInteger(amount)) {
		showToast({ text: "Informe uma quantia inteira válida.", variant: "error" });
		return;
	}

	try {
		const result = (
			await setGangMoney({
				gangId: gangId.value,
				amount,
				mode: gangMoneyMode.value,
			})
		)?.data?.setGangMoney;
		showToast({
			text: result?.message ?? "Falha ao atualizar o dinheiro da gangue.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) {
			isGangMoneyModalOpen.value = false;
			await refetch();
		}
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
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
							<BaseButton
								v-if="canWrite"
								variant="ghost"
								size="sm"
								data-popover-text="Alterar dinheiro"
								data-popover-direction="left"
								@click="isGangMoneyModalOpen = true"
							>
								<Pencil
									:size="16"
									aria-hidden="true"
								/>
							</BaseButton>
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
					<div
						v-if="currentMember"
						class="gang-actions"
					>
						<BaseButton
							variant="secondary"
							@click="isDepositModalOpen = true"
						>
							<Wallet
								:size="16"
								aria-hidden="true"
							/>
							Depositar
						</BaseButton>
						<BaseButton
							v-if="canTransferGang"
							variant="secondary"
							@click="isTransferModalOpen = true"
						>
							<Crown
								:size="16"
								aria-hidden="true"
							/>
							Transferir liderança
						</BaseButton>
						<BaseButton
							v-if="canInviteMembers"
							variant="secondary"
							@click="openInviteModal()"
						>
							<UserPlus
								:size="16"
								aria-hidden="true"
							/>
							Convidar membro
						</BaseButton>
						<BaseButton
							v-if="canCommunicate"
							variant="secondary"
							@click="openCommunicationModal()"
						>
							<MessageSquareText
								:size="16"
								aria-hidden="true"
							/>
							Comunicar membros
						</BaseButton>
						<BaseButton
							v-if="canLeaveGang"
							variant="ghost"
							class="gang-actions-leave"
							@click="isLeaveGangModalOpen = true"
						>
							<LogOut
								:size="16"
								aria-hidden="true"
							/>
							Sair da gangue
						</BaseButton>
					</div>
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
						<template #actions>
							<BaseSelector
								id="gang-members-sort"
								label="Ordenar por"
								:options="memberSortOptions"
								:model-value="memberSort"
								@update:model-value="memberSort = $event"
							/>
						</template>
						<BaseTable class="table-container">
							<table class="gang-members-table">
								<caption class="visually-hidden">
									Membros da gangue
								</caption>
								<thead>
									<tr>
										<th scope="col">Membro</th>
										<th scope="col">Cargo</th>
										<th scope="col">Último depósito</th>
										<th scope="col">Total depositado</th>
										<th
											v-if="canManageMembers"
											scope="col"
										>
											<span class="visually-hidden">Ações</span>
										</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="member in sortedMembers"
										:key="member.userId"
										class="clickable-row"
										tabindex="0"
										@click="navigateTo(`/users/${member.userId}`)"
										@keydown.enter.prevent="navigateTo(`/users/${member.userId}`)"
									>
										<th scope="row">
											<div class="member-cell">
												<UserPicture
													:image-url="member.avatarUrl || useFallbackUserImage(member.userId)"
													:decoration="member.avatarDecoration"
													image-class="member-avatar"
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
										<td>
											<time
												v-if="member.lastDepositAt"
												:datetime="member.lastDepositAt"
											>
												{{ relative(member.lastDepositAt, true) }}
											</time>
											<span v-else>{{ member.depositAmount > 0 ? "—" : "Nunca" }}</span>
										</td>
										<td>{{ formatMoney(member.depositAmount) }}</td>
										<td
											v-if="canManageMembers"
											class="member-actions-cell"
										>
											<BaseButton
												v-if="member.userId !== gang.leaderId && (canPromoteMembers || canKickMembers)"
												variant="secondary"
												size="sm"
												:aria-label="`Gerenciar membro ${member.nickname}`"
												:data-popover-text="`Gerenciar membro ${member.nickname}`"
												data-popover-position="top"
												@click.stop="openMemberRoleModal(member)"
												@keydown.enter.stop
											>
												<UserRoundCog
													:size="15"
													aria-hidden="true"
												/>
											</BaseButton>
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
						<template
							v-if="gang.canViewShipmentInfo && gang.canImport"
							#actions
						>
							<BaseButton
								v-if="gang.shipmentArrivesAt"
								variant="danger"
								:disabled="cancellingImport"
								@click="isImportCancelConfirmationOpen = true"
							>
								Cancelar importação
							</BaseButton>
							<BaseButton
								v-else
								variant="success"
								:disabled="startingImport || !gang.canStartImport"
								@click="startGangShipmentImport()"
							>
								Iniciar importação
							</BaseButton>
						</template>
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
						<template v-if="gang.canViewShipmentInfo">
							<div
								v-if="gang.shipmentArrivesAt"
								class="gang-import"
							>
								<h3>Importação</h3>
								<div class="gang-import__description">
									<p>Uma importação está atualmente em trânsito.</p>
									<span>Chega {{ relative(gang.shipmentArrivesAt, true) }}</span>
									<span>Chance de sucesso: {{ Math.floor((gang.importSuccessChance ?? 0) * 100) }}%</span>
								</div>
								<div
									class="gang-import__progress"
									role="progressbar"
									:aria-valuenow="Math.floor(importProgress)"
									aria-valuemin="0"
									aria-valuemax="100"
									aria-label="Progresso da importação"
								>
									<div class="gang-import__track">
										<div
											class="gang-import__fill"
											:style="{ width: `${importProgress}%` }"
										/>
									</div>
									<NuxtImg
										:src="getGangBaseShipmentImageUrl(gang.base.id)"
										width="36"
										height="36"
										class="gang-import__truck"
										:style="{ left: `${importProgress}%` }"
										alt=""
									/>
								</div>
							</div>
							<div
								v-else
								class="gang-import gang-import__ready"
							>
								<h3>Importação</h3>
								<span>Custo: {{ formatMoney(gang.importCost ?? 0) }}</span>
								<span>Chance de sucesso: {{ Math.floor((gang.importSuccessChance ?? 0) * 100) }}%</span>
								<span v-if="gang.canImport && !gang.canStartImport">Importação indisponível no momento.</span>
							</div>
						</template>
					</BaseCard>
				</div>
				<!-- Roles Table -->
				<BaseCard
					:title="`Cargos (${gang.roles.length})`"
					no-padding-x
					no-padding-y
				>
					<template
						v-if="canManageRoles"
						#actions
					>
						<BaseButton
							@click="beginCreateRole()"
							variant="secondary"
						>
							<Plus
								:size="16"
								aria-hidden="true"
							/>
							Criar cargo
						</BaseButton>
					</template>
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
									<th
										v-if="canManageRoles"
										scope="col"
									>
										<span class="visually-hidden">Ações</span>
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<th scope="row">
										<span
											class="role-badge"
											data-perm="leader"
										>
											Líder
										</span>
									</th>
									<td
										v-for="permission in 5"
										:key="permission"
										class="perm-cell"
									>
										<ShieldCheck
											:size="16"
											class="perm-icon perm-icon--yes"
											aria-label="Sim"
										/>
									</td>
									<td v-if="canManageRoles"></td>
								</tr>
								<tr
									v-for="role in rolesByPermissionCount"
									:key="role.id"
								>
									<th scope="row">
										<span
											class="role-badge"
											:data-perm="getRolePermissionCount(role)"
										>
											{{ role.name }}
										</span>
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
									<td
										v-if="canManageRoles"
										class="role-actions-cell"
									>
										<BaseButton
											v-if="isEditableRole(role)"
											variant="secondary"
											size="sm"
											:aria-label="`Editar cargo ${role.name}`"
											@click="beginEditRole(role)"
											:data-popover-text="`Editar cargo ${role.name}`"
											data-popover-position="top"
										>
											<Pencil
												:size="15"
												aria-hidden="true"
											/>
										</BaseButton>
									</td>
								</tr>
							</tbody>
						</table>
					</BaseTable>
				</BaseCard>

				<BaseModal
					:open="isRoleEditorOpen"
					:title="editingRole ? 'Editar cargo' : 'Criar cargo'"
					description="Defina o nome e as permissões do cargo."
					@update:open="isRoleEditorOpen = $event"
				>
					<form
						id="gang-role-form"
						class="gangs-page__create-form"
						@submit.prevent="saveRole()"
					>
						<BaseInput
							id="gang-role-name"
							label="Nome"
							placeholder="Nome do cargo"
							:minlength="2"
							:maxlength="20"
							required
							:model-value="roleDraft.name"
							@update:model-value="roleDraft.name = String($event)"
						/>
						<span
							class="role-badge role-editor-badge"
							:data-perm="roleDraftPermissionCount"
							:style="{ '--highlight-color': gang?.color ?? '#89999A' }"
						>
							{{ roleDraft.name || "Nome do cargo" }}
						</span>
						<fieldset class="role-permissions">
							<legend>Permissões</legend>
							<label>
								<input
									v-model="roleDraft.canInvite"
									type="checkbox"
								>
								Convidar
							</label>
							<label>
								<input
									v-model="roleDraft.canKick"
									type="checkbox"
								>
								Expulsar
							</label>
							<label>
								<input
									v-model="roleDraft.canPromote"
									type="checkbox"
								>
								Promover
							</label>
							<label>
								<input
									v-model="roleDraft.canEditGang"
									type="checkbox"
								>
								Editar gangue
							</label>
							<label>
								<input
									v-model="roleDraft.canImport"
									type="checkbox"
								>
								Importar
							</label>
						</fieldset>
					</form>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="creatingRole || updatingRole"
							@click="isRoleEditorOpen = false"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							type="submit"
							form="gang-role-form"
							:disabled="creatingRole || updatingRole"
						>
							{{ creatingRole || updatingRole ? "Salvando..." : "Salvar cargo" }}
						</BaseButton>
					</template>
				</BaseModal>

				<BaseModal
					:open="isMemberRoleModalOpen"
					title="Gerenciar membro"
					:description="canPromoteMembers ? 'Altere o cargo ou expulse este membro da gangue.' : 'Você pode expulsar este membro da gangue.'"
					@update:open="isMemberRoleModalOpen = $event"
				>
					<BaseSelector
						v-if="canPromoteMembers"
						id="gang-member-role"
						label="Cargo"
						placeholder="Selecione um cargo"
						:options="changeRoleOptions"
						:model-value="memberRoleDraft"
						@update:model-value="memberRoleDraft = String($event)"
					/>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="changingMemberRole"
							@click="isMemberRoleModalOpen = false"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							v-if="canKickMembers && memberRoleTargetId !== gang.leaderId && memberRoleTargetId !== currentUserId"
							variant="danger"
							@click="beginMemberKick()"
						>
							<UserMinus
								:size="16"
								aria-hidden="true"
							/>
							Expulsar membro
						</BaseButton>
						<BaseButton
							v-if="canPromoteMembers"
							:disabled="changingMemberRole || !memberRoleDraft"
							@click="saveMemberRole()"
						>
							{{ changingMemberRole ? "Salvando..." : "Salvar" }}
						</BaseButton>
					</template>
				</BaseModal>

				<BaseModal
					:open="isMemberKickConfirmationOpen"
					title="Expulsar membro"
					@update:open="isMemberKickConfirmationOpen = $event"
				>
					<p>Deseja realmente expulsar {{ memberRoleTarget?.nickname ?? "este membro" }} da gangue?</p>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="kickingMember"
							@click="cancelMemberKick()"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							variant="danger"
							:disabled="kickingMember"
							@click="confirmMemberKick()"
						>
							{{ kickingMember ? "Expulsando..." : "Confirmar expulsão" }}
						</BaseButton>
					</template>
				</BaseModal>

				<BaseModal
					:open="isDepositModalOpen"
					title="Depositar na gangue"
					description="Informe quanto deseja depositar no caixa da gangue."
					@update:open="isDepositModalOpen = $event"
				>
					<form
						id="gang-deposit-form"
						@submit.prevent="submitGangDeposit()"
					>
						<BaseInput
							id="gang-deposit-amount"
							label="Valor"
							type="number"
							step="1"
							required
							:model-value="depositAmount"
							@update:model-value="depositAmount = String($event)"
						/>
						<p class="gang-deposit-limits">Valor máximo: {{ formatMoney(maxDepositAmount) }}</p>
						<BaseButton
							variant="secondary"
							:disabled="maxDepositAmount < 1"
							@click="depositAmount = String(maxDepositAmount)"
						>
							Inserir máximo
						</BaseButton>
					</form>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="depositing"
							@click="isDepositModalOpen = false"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							type="submit"
							form="gang-deposit-form"
							:disabled="depositing"
						>
							{{ depositing ? "Depositando..." : "Depositar" }}
						</BaseButton>
					</template>
				</BaseModal>

				<BaseModal
					:open="isLeaveGangModalOpen"
					title="Sair da gangue"
					@update:open="isLeaveGangModalOpen = $event"
				>
					<p>
						{{
							currentUserId === gang.leaderId
								? `Você é o único membro. Sair também encerrará a gangue ${gang.name}.`
								: `Deseja sair da gangue ${gang.name}?`
						}}
					</p>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="leavingGang"
							@click="isLeaveGangModalOpen = false"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							variant="danger"
							:disabled="leavingGang"
							@click="confirmLeaveGang()"
						>
							{{ leavingGang ? "Saindo..." : "Confirmar saída" }}
						</BaseButton>
					</template>
				</BaseModal>

				<BaseModal
					:open="isTransferModalOpen"
					title="Transferir liderança"
					description="A liderança será transferida para outro membro da gangue."
					@update:open="isTransferModalOpen = $event"
				>
					<BaseSelector
						id="gang-transfer-target"
						label="Novo líder"
						placeholder="Selecione um membro"
						:options="transferOptions"
						:model-value="transferTargetId"
						@update:model-value="transferTargetId = String($event)"
					/>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="transferringGang"
							@click="isTransferModalOpen = false"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							:disabled="transferringGang || !transferTargetId"
							@click="confirmGangTransfer()"
						>
							{{ transferringGang ? "Transferindo..." : "Transferir liderança" }}
						</BaseButton>
					</template>
				</BaseModal>

				<BaseModal
					:open="isInviteModalOpen"
					title="Convidar membro"
					description="O convite será enviado por mensagem privada no Discord."
					@update:open="isInviteModalOpen = $event"
				>
					<div class="gang-invite-form">
						<BaseInput
							id="gang-invite-search"
							label="Buscar jogador"
							aria-label="Buscar jogador por nickname ou ID"
							type="search"
							placeholder="Nickname ou ID do Discord"
							:model-value="inviteSearch"
							@update:model-value="updateInviteSearch"
						/>
						<span
							v-if="searchingInviteTargets"
							class="gang-invite-form__status"
						>
							Buscando jogadores...
						</span>
						<BaseSelector
							v-else-if="inviteTargetOptions.length"
							id="gang-invite-target"
							label="Jogador"
							placeholder="Selecione um jogador"
							:options="inviteTargetOptions"
							:model-value="inviteTargetId"
							@update:model-value="inviteTargetId = String($event)"
						/>
						<span
							v-else-if="inviteSearch.trim()"
							class="gang-invite-form__status"
						>
							Nenhum jogador elegível encontrado.
						</span>
					</div>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="invitingMember"
							@click="isInviteModalOpen = false"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							:disabled="invitingMember || !inviteTargetId"
							@click="sendGangInvite()"
						>
							{{ invitingMember ? "Enviando..." : "Enviar convite" }}
						</BaseButton>
					</template>
				</BaseModal>

				<BaseModal
					:open="isCommunicationModalOpen"
					title="Comunicado oficial"
					description="A mensagem será enviada para todos os membros da gangue."
					@update:open="isCommunicationModalOpen = $event"
				>
					<form
						id="gang-communication-form"
						class="gang-communication-form"
						@submit.prevent="sendGangCommunication()"
					>
						<label for="gang-communication-message">Mensagem</label>
						<textarea
							id="gang-communication-message"
							v-model="communicationMessage"
							aria-describedby="gang-communication-hint"
							maxlength="4000"
							required
							rows="5"
						/>
						<p
							id="gang-communication-hint"
							class="gang-communication-form__hint"
						>
							{{ communicationMessage.length.toLocaleString("pt-BR") }}/4.000 caracteres
						</p>
					</form>
					<template #footer>
						<BaseButton
							variant="secondary"
							:disabled="communicating"
							@click="isCommunicationModalOpen = false"
						>
							Cancelar
						</BaseButton>
						<BaseButton
							type="submit"
							form="gang-communication-form"
							:disabled="communicating || !communicationMessage.trim()"
						>
							{{ communicating ? "Enviando..." : "Enviar comunicado" }}
						</BaseButton>
					</template>
				</BaseModal>

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

			<BaseModal
				:open="isImportCancelConfirmationOpen"
				title="Cancelar importação"
				@update:open="isImportCancelConfirmationOpen = $event"
			>
				<p>Deseja cancelar a importação ativa? O reembolso será parcial.</p>
				<template #footer>
					<BaseButton
						variant="secondary"
						:disabled="cancellingImport"
						@click="isImportCancelConfirmationOpen = false"
					>
						Voltar
					</BaseButton>
					<BaseButton
						variant="danger"
						:disabled="cancellingImport"
						@click="cancelGangShipmentImport()"
					>
						{{ cancellingImport ? "Cancelando..." : "Confirmar cancelamento" }}
					</BaseButton>
				</template>
			</BaseModal>

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
			<BaseModal
				:open="isGangMoneyModalOpen"
				title="Alterar dinheiro da gangue"
				description="Adicione um valor ao saldo atual ou defina um novo saldo."
				@update:open="isGangMoneyModalOpen = $event"
			>
				<form
					id="gang-money-form"
					class="gang-money-form"
					@submit.prevent="updateGangMoney()"
				>
					<fieldset>
						<legend>Modo de operação</legend>
						<label>
							<input
								v-model="gangMoneyMode"
								type="radio"
								:value="SetMoneyMode.Add"
							>
							Adicionar ao saldo atual
						</label>
						<label>
							<input
								v-model="gangMoneyMode"
								type="radio"
								:value="SetMoneyMode.Set"
							>
							Definir valor exato
						</label>
					</fieldset>
					<BaseInput
						id="gang-money-amount"
						label="Quantidade (Cr$)"
						type="number"
						step="1"
						required
						:model-value="gangMoneyAmount"
						@update:model-value="gangMoneyAmount = String($event)"
					/>
				</form>
				<template #footer>
					<BaseButton
						variant="secondary"
						:disabled="settingGangMoney"
						@click="isGangMoneyModalOpen = false"
					>
						Cancelar
					</BaseButton>
					<BaseButton
						type="submit"
						form="gang-money-form"
						:disabled="settingGangMoney"
					>
						{{ settingGangMoney ? "Atualizando..." : "Confirmar alteração" }}
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

.role-permissions {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	border: 0;
	padding: 0;
	color: $text-secondary;
	font-size: 0.875rem;

	legend {
		margin-bottom: $spacing-xs;
		font-weight: 600;
		color: $text-primary;
	}

	label {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}
}

.role-editor-badge {
	align-self: flex-start;
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
		gap: $spacing-md;
	}

	&__title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;

		@media (max-width: $bp-mobile) {
			flex-direction: column;
			align-items: flex-start;
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
		font-size: 0.9rem;
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

.gang-actions {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-sm;
	margin-top: $spacing-md;

	@media (max-width: $bp-mobile) {
		flex-direction: column;
		align-items: stretch;
	}

	&-leave {
		margin-left: auto;
		@media (max-width: $bp-mobile) {
			margin-left: unset;
		}
	}
}

.gang-invite-form {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;

	&__status {
		color: $text-muted;
		font-size: 0.8125rem;
	}
}

.gang-deposit-limits {
	margin: 0.5rem 0;
	color: $text-secondary;
	font-size: 0.8125rem;
}

.gang-money-form {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;

	fieldset {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		border: 0;
	}

	legend {
		margin-bottom: $spacing-sm;
		color: $text-secondary;
		font-size: 0.875rem;
		font-weight: 500;
	}

	label {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}
}

.gang-communication-form {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;

	label {
		color: $text-secondary;
		font-size: 0.875rem;
		font-weight: 500;
	}

	textarea {
		width: 100%;
		min-height: 8rem;
		padding: 0.75rem;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		background-color: $bg-input-field;
		color: $text-primary;
		resize: vertical;

		&:focus-visible {
			@include focus-outline;
		}
	}

	&__hint {
		color: $text-muted;
		font-size: 0.8125rem;
		text-align: right;
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

.gang-import {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
	margin-top: $spacing-md;
	padding-top: $spacing-md;
	border-top: 1px solid $border-subtle;

	&__description,
	&__ready {
		display: flex;
		flex-direction: column;
		gap: 2px;
		color: $text-secondary;
		font-size: 0.8125rem;
	}

	&__description p {
		margin: 0;
		color: $text-primary;
		font-size: 0.875rem;
		font-weight: 600;
	}

	&__progress {
		position: relative;
		padding-top: 0.5rem;
	}

	&__track {
		height: 0.875rem;
		overflow: hidden;
		border-radius: $radius-full;
		background-color: $bg-input-field;
	}

	&__fill {
		height: 100%;
		border-radius: inherit;
		background-color: $highlight-color;
		transition: width 1s linear;
	}

	&__truck {
		position: absolute;
		top: -0.15rem;
		transform: translateX(-50%);
		color: $text-primary;
		filter: drop-shadow(0 1px 2px $background-color);
		transition: left 1s linear;
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

.member-actions-cell {
	width: 1%;
	white-space: nowrap;
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
		width: 0.5rem;
		height: 0.5rem;
		transform: translateY(-50%) translateX(20%);
		clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
		border-radius: 0;
	}

	// 3 permissions: diamond (losange)
	&[data-perm="3"]::before {
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 0;
		transform: translateY(-50%) translateX(40%)  rotate(45deg);
	}

	// 4 permissions: pentagon
	&[data-perm="4"]::before, &[data-perm="5"]::before {
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
