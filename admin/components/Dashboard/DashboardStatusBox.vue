<script
	setup
	lang="ts"
>
import { Beer, BicepsFlexed, Briefcase, Coins, Compass, HeartPulse, Lock, Swords } from "lucide-vue-next";

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
				image: "idling",
			};
		case "working":
			return {
				title: "Trabalhando",
				image: "job",
			};
		case "hospital":
			return {
				title: "Hospitalizados",
				image: "hospital",
			};
		case "prison":
			return {
				title: "Presos",
				image: "prison",
			};
		case "scavenge":
			return {
				title: "Vasculhando",
				image: "scavenging",
			};
		case "casino":
			return {
				title: "Apostando",
				image: "casino",
			};
		case "robbery":
			return {
				title: "Em roubos",
				image: "robbery",
			};
		case "beatup":
			return {
				title: "Em espancamentos",
				image: "beatup",
			};
		default:
			return {
				title: "-",
				image: "",
			};
	}
});
</script>

<template>
	<div
		class="status-box"
		:class="variant"
	>
		<div class="status-box-header">
			<NuxtImg
				:src="'situations/' + style.image + '.png'"
				class="status-img"
			/>
			{{ style.title }}
		</div>
		<span class="status-box-count">{{ value ?? 0 }}</span>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.status-box {
	@include card-surface;
	padding: 16px;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	gap: 8px;

	.status-box-header {
		@include flex-center;
		gap: 8px;
		font-size: 0.8125rem;
		font-weight: 600;

		.status-img {
			max-width: 20px;
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
			color: map-get($status-colors, $status);
		}

		border: 1px solid map-get($status-colors, $status);
		box-shadow: 3px 3px map-get($status-colors, $status);
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
