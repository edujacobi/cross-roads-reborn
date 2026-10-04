<script
	setup
	lang="ts"
>
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import BaseTable from "~/components/ui/BaseTable.vue";

defineProps<{
	rows: number;
	columns: number;
	label: string;
}>();
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
								height="0.75rem"
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
							<BaseSkeleton :width="column === 1 ? '75%' : '55%'" />
						</td>
					</tr>
				</tbody>
			</table>
		</BaseTable>
	</div>
</template>
