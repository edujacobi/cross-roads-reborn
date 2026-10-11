<script
	setup
	lang="ts"
>
import { RefreshCw } from "lucide-vue-next";
import BaseButton, { type ButtonVariant } from "~/components/ui/BaseButton.vue";

interface Props {
	loading?: boolean;
	label?: string;
	variant?: ButtonVariant;
}

withDefaults(defineProps<Props>(), {
	variant: "ghost",
});
const emit = defineEmits<(e: "refresh", value: boolean) => void>();
</script>

<template>
	<BaseButton
		:variant="variant"
		size="sm"
		:disabled="loading"
		@click="emit('refresh', $event)"
	>
		<RefreshCw
			:size="14"
			:class="{ 'animate-spin': loading }"
			aria-hidden="true"
		/>
		{{ (label ?? loading) ? "Atualizando" : "Atualizar" }}
	</BaseButton>
</template>

<style
	scoped
	lang="scss"
>

</style>
