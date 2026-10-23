<script
	setup
	lang="ts"
>
withDefaults(
	defineProps<{
		imageUrl: string;
		decoration?: string | null;
		alt?: string;
		width?: number | string;
		height?: number | string;
		imageClass?: string;
		lazy?: boolean;
	}>(),
	{
		decoration: "default",
		alt: "",
	},
);
</script>

<template>
	<span class="user-avatar-frame">
		<NuxtImg
			:src="imageUrl"
			:alt="alt"
			:class="['user-avatar', `user-avatar--${decoration ?? 'default'}`, imageClass]"
			:width="width"
			:height="height"
			:loading="lazy ? 'lazy' : undefined"
		/>
	</span>
</template>
