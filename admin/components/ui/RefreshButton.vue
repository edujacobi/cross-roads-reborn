<script
	setup
	lang="ts"
>
import { RefreshCw } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";

interface Props {
	loading?: boolean;
	label?: string;
}

defineProps<Props>();
const emit = defineEmits<(e: "refresh", value: boolean) => void>();
</script>

<template>
	<BaseButton
		variant="ghost"
		size="sm"
		:disabled="loading"
		@click="emit('refresh', $event)"
	>
		<RefreshCw
			:size="14"
			:class="{ 'animate-spin': loading }"
			aria-hidden="true"
		/>
		{{ loading ? "Atualizando" : "Atualizar" }}
	</BaseButton>
</template>

<style
	scoped
	lang="scss"
>

</style>
