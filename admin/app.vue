<script setup>
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
	<UiToastContainer />
</template>
