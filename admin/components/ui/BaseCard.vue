<script
	setup
	lang="ts"
>
interface Props {
	title?: string;
	subtitle?: string;
}

defineProps<Props>();
</script>

<template>
	<div class="base-card">
		<div
			v-if="title || $slots.header"
			class="card-header"
		>
			<div>
				<h3
					v-if="title"
					class="card-title"
				>
					{{ title }}
				</h3>
				<p
					v-if="subtitle"
					class="card-subtitle"
				>
					{{ subtitle }}
				</p>
			</div>
			<div
				v-if="$slots.actions"
				class="card-actions"
			>
				<slot name="actions" />
			</div>
		</div>
		<div class="card-body">
			<slot />
		</div>
		<div
			v-if="$slots.footer"
			class="card-footer"
		>
			<slot name="footer" />
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
.base-card {
  @include card-surface;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .card-header {
    @include flex-between;
    padding: 16px 20px;
    border-bottom: 1px solid $border-subtle;

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: $text-primary;
    }

    .card-subtitle {
      font-size: 0.8125rem;
      color: $text-secondary;
      margin-top: 2px;
    }
  }

  .card-body {
    padding: 20px;
    flex: 1;
  }

  .card-footer {
    padding: 12px 20px;
    border-top: 1px solid $border-subtle;
    background-color: rgba($bg-input, 0.5);
  }
}
</style>
