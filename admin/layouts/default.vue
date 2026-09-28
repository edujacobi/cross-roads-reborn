<script
	setup
	lang="ts"
>
import Sidebar from "~/components/Sidebar.vue";
</script>

<template>
	<div class="admin-layout">
		<Sidebar />

		<!-- Main Content Area -->
		<div class="main-content-wrapper">
			<div class="page-content">
				<slot />
			</div>
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.admin-layout {
	display: flex;
	height: 100vh;
	overflow: hidden;
}

.main-content-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.page-content {
	flex: 1;
	overflow-y: auto;
	padding: $spacing-lg;
	@include scrollbar-custom;
}
</style>
