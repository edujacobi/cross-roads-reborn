<script
	setup
	lang="ts"
>
import type { DefaultIconProps } from "~/components/icons/types";

const props = defineProps<DefaultIconProps>();

const fillOptions = {
	outline: "transparent",
	solid: "currentColor",
	normal: "#BBE000",
};

const strokeOptions = {
	outline: "currentColor",
	solid: "none",
	normal: "black",
};

const fill = computed(() => fillOptions[props.variant || "normal"]);
const stroke = computed(() => strokeOptions[props.variant || "normal"]);
</script>

<template>
	<svg
		:width="size"
		:height="size"
		viewBox="0 0 512 512"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M200.14 404.946H125.667V367.71H200.14V404.946Z"
			:fill="stroke"
		/>
		<path
			d="M293.234 404.946H218.762V367.71H293.234V404.946Z"
			:fill="stroke"
		/>
		<path
			d="M386.321 404.946H311.849V367.71H386.321V404.946Z"
			:fill="stroke"
		/>
		<path
			d="M200.14 330.472H125.667V293.235H200.14V330.472Z"
			:fill="stroke"
		/>
		<path
			d="M293.234 330.472H218.762V293.235H293.234V330.472Z"
			:fill="stroke"
		/>
		<path
			d="M386.321 330.472H311.849V293.235H386.321V330.472Z"
			:fill="stroke"
		/>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M162.671 20.4805C179.637 20.4805 193.391 34.234 193.391 51.2002V118.266L237.16 84.2803C246.424 77.0873 258.975 75.7971 269.509 80.9541C280.043 86.1113 286.721 96.8164 286.721 108.545V168.678L395.415 84.2803C404.679 77.0873 417.23 75.7971 427.764 80.9541C438.297 86.1113 444.976 96.8164 444.976 108.545V460.798C444.976 477.764 431.222 491.518 414.256 491.518H97.7461C80.7799 491.518 67.0264 477.764 67.0264 460.798V51.2002C67.0264 34.234 80.7799 20.4805 97.7461 20.4805H162.671ZM97.7461 460.798H414.256V108.545L256.001 231.425V108.545L162.671 181.013V51.2002H97.7461V460.798Z"
			:fill="stroke"
		/>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M162.671 51.2002V181.013L256.001 108.545V231.425L414.256 108.545V460.798H97.7461V231.425V51.2002H162.671ZM125.667 367.71V404.946H200.14V367.71H125.667ZM218.762 367.71V404.946H293.234V367.71H218.762ZM311.849 367.71V404.946H386.321V367.71H311.849ZM125.667 293.235V330.472H200.14V293.235H125.667ZM218.762 293.235V330.472H293.234V293.235H218.762ZM311.849 293.235V330.472H386.321V293.235H311.849Z"
			:fill="fill"
		/>
	</svg>
</template>

<style
	scoped
	lang="scss"
>

</style>
