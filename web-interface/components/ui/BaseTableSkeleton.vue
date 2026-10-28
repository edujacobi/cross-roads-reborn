<script
	setup
	lang="ts"
>
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import BaseTable from "~/components/ui/BaseTable.vue";

const props = defineProps<{
	rows: number;
	columns: number;
	label: string;
	size?: "sm" | "md" | "lg";
}>();

const height = computed(() => {
	if (props.size === "sm") {
		return 12;
	} else if (props.size === "md") {
		return 16;
	} else if (props.size === "lg") {
		return 40;
	} else {
		return 16;
	}
});
</script>

<template>
	<div
		class="base-table-skeleton"
		role="status"
		:aria-label="label"
	>
		<BaseTable>
			<table aria-hidden="true">
				<thead>
					<tr>
						<th
							v-for="column in columns"
							:key="column"
						>
							<BaseSkeleton
								width="65%"
								height="12px"
							/>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="row in rows"
						:key="row"
					>
						<td
							v-for="column in columns"
							:key="column"
						>
							<BaseSkeleton
								:width="column === 1 ? '75%' : '55%'"
								:height="height + 'px'"
							/>
						</td>
					</tr>
				</tbody>
			</table>
		</BaseTable>
	</div>
</template>
