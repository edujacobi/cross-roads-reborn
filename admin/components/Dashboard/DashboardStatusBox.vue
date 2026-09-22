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
				icon: Beer,
			};
		case "working":
			return {
				title: "Trabalhando",
				icon: Briefcase,
			};
		case "hospital":
			return {
				title: "Hospitalizados",
				icon: HeartPulse,
			};
		case "prison":
			return {
				title: "Presos",
				icon: Lock,
			};
		case "scavenge":
			return {
				title: "Vasculhando",
				icon: Compass,
			};
		case "casino":
			return {
				title: "Apostando",
				icon: Coins,
			};
		case "robbery":
			return {
				title: "Em roubos",
				icon: Swords,
			};
		case "beatup":
			return {
				title: "Em espancamentos",
				icon: BicepsFlexed,
			};
		default:
			return {
				title: "-",
				icon: Lock,
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
			<component
				:is="style.icon"
				:size="18"
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

.status-box {
	@include card-surface;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;

	.status-box-header {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.status-box-count {
		font-size: 1.375rem;
		font-weight: 800;
		color: $text-primary;
	}

	&.idle {
		.status-box-header {
			color: #fff;
		}

		border-left: 3px solid #fff;
	}

	&.working {
		.status-box-header {
			color: $color-working;
		}

		border-left: 3px solid $color-working;
	}

	&.hospital {
		.status-box-header {
			color: $color-hospital;
		}

		border-left: 3px solid $color-hospital;
	}

	&.prison {
		.status-box-header {
			color: $color-prison;
		}

		border-left: 3px solid $color-prison;
	}

	&.scavenge {
		.status-box-header {
			color: $color-scavenge;
		}

		border-left: 3px solid $color-scavenge;
	}

	&.casino {
		.status-box-header {
			color: $color-casino;
		}

		border-left: 3px solid $color-casino;
	}

	&.beatup {
		.status-box-header {
			color: $color-beatup;
		}

		border-left: 3px solid $color-beatup;
	}

	&.robbery {
		.status-box-header {
			color: $color-robbery;
		}

		border-left: 3px solid $color-robbery;
	}
}

</style>
