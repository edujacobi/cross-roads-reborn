<script>
useHead({
	titleTemplate: (titleChunk) => {
		return titleChunk ? `${titleChunk} - Cross Roads` : "Cross Roads";
	},
});
</script>
<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
