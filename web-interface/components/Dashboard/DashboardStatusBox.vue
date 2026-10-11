<script
	setup
	lang="ts"
>
import { imagePaths } from "~/constants/imagePaths";

interface Props {
	variant: "idle" | "working" | "hospital" | "prison" | "scavenge" | "casino" | "robbery" | "beatup";
	value?: number;
}
const props = withDefaults(defineProps<Props>(), {
	variant: "idle",
});

const style = computed(() => {
	switch (props.variant) {
		case "idle":
			return {
				title: "Vadiando",
				image: imagePaths.situations.idling,
			};
		case "working":
			return {
				title: "Trabalhando",
				image: imagePaths.situations.job,
			};
		case "hospital":
			return {
				title: "Hospitalizados",
				image: imagePaths.situations.hospital,
			};
		case "prison":
			return {
				title: "Presos",
				image: imagePaths.situations.prison,
			};
		case "scavenge":
			return {
				title: "Vasculhando",
				image: imagePaths.situations.scavenging,
			};
		case "casino":
			return {
				title: "Apostando",
				image: imagePaths.situations.casino,
			};
		case "robbery":
			return {
				title: "Em roubos",
				image: imagePaths.situations.robbery,
			};
		case "beatup":
			return {
				title: "Em espancamentos",
				image: imagePaths.situations.beatup,
			};
		default:
			return {
				title: "-",
				image: imagePaths.situations.idling,
			};
	}
});
</script>

<template>
	<article
		class="status-box"
		:class="variant"
	>
		<div class="status-box-header">
			<NuxtImg
				:src="style.image"
				alt=""
				width="20"
			/>
			<p>{{ style.title }}</p>
		</div>
		<output class="status-box-count">{{ value ?? 0 }}</output>
	</article>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:map";

.status-box {
	@include card-surface;
	padding: $spacing-md;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	gap: $spacing-sm;

	.status-box-header {
		@include flex-center;
		gap: $spacing-sm;
		font-size: 0.8125rem;
		font-weight: 600;

		p {
			margin: 0;
			font: inherit;
		}
	}

	.status-box-count {
		font-size: 1.375rem;
		font-weight: 800;
		color: $text-primary;
	}

	$status-colors: (
		"default": #fff,
		"working": $color-working,
		"hospital": $color-hospital,
		"prison": $color-prison,
		"scavenge": $color-scavenge,
		"casino": $color-casino,
		"beatup": $color-beatup,
		"robbery": $color-robbery
	);

	@mixin status-variant($status){
		.status-box-header {
			color: map.get($status-colors, $status);
		}

		border: 1px solid map.get($status-colors, $status);
		box-shadow: 3px 3px map.get($status-colors, $status);
	}

	&.idle {
		@include status-variant("default")
	}

	&.working {
		@include status-variant("working")
	}

	&.hospital {
		@include status-variant("hospital")
	}

	&.prison {
		@include status-variant("prison")
	}

	&.scavenge {
		@include status-variant("scavenge")
	}

	&.casino {
		@include status-variant("casino")
	}

	&.beatup {
		@include status-variant("beatup")
	}

	&.robbery {
		@include status-variant("robbery")
	}
}

</style>
