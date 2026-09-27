<script
	setup
	lang="ts"
>
import BaseCard from "~/components/ui/BaseCard.vue";
import type { UserDetail } from "~/types/userDetail";
import { BadgeId } from "../../../src/core/types/Ids";

defineProps<{ user: UserDetail }>();

const { getClassImageUrl } = useClasses();
const { getSituationImageUrl } = useSituation();

function getBadgeImage(badgeId: BadgeId): string {
	// biome-ignore lint/suspicious/noDoubleEquals: GraphQl brings as number, not as BadgeId
	if (badgeId == BadgeId.VIP || badgeId == BadgeId.VIPEternal) {
		return "badges/vip.png";
	}
	return `badges/${BadgeId[badgeId]}.png`;
}
</script>

<template>
	<BaseCard class="user-profile">
		<div class="user-profile__main-info">
			<div class="user-profile__avatar-wrapper">
				<NuxtImg
					:class="['user-avatar', `user-avatar--${user.avatarDecoration}`]"
					:src="user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
				/>
				<span :class="`user-profile__presence user-profile__presence--${user.online ? 'online' : 'offline'}`"></span>
			</div>
			<div>
				<div class="user-profile__name-row">
					<h1 class="user-profile__name">{{ user.nickname || "(Sem Nick)" }}</h1>
				</div>
				<p class="user-profile__id"><code>ID: {{ user.id }}</code></p>
			</div>
			<div class="user-profile__economy">
				<p class="user-profile__money">Cr$ {{ user.money.toLocaleString() }}</p>
				<p class="user-profile__coins">{{ user.specialCoin.toLocaleString() }} Moedas especiais</p>
			</div>
		</div>
		<section class="user-profile__badges">
			<NuxtImg
				v-for="badge in user.badges"
				:key="badge.id"
				class="user-profile__badge"
				:src="getBadgeImage(badge.id as BadgeId)"
				:title="badge.name"
			/>
		</section>

		<p class="user-profile__situation">
			<NuxtImg
				:src="getSituationImageUrl(user.situationId)"
				class="user-profile__situation-image"
			/>
			{{ user.situationText }}
		</p>

		<div class="user-profile__info">
			<div class="user-profile__class">
				<NuxtImg
					:src="getClassImageUrl(user.class)"
					class="user-profile__class-image"
				/>
				{{ user.className }}
			</div>

			<div class="user-profile__attributes">
				<span class="user-profile__attribute">
					<NuxtImg
						src="attributes/attack.png"
						class="user-profile__attribute-image"
					/>
					{{ user.attack || 0 }}
					ATK
				</span>
				<span class="user-profile__attribute">
					<NuxtImg
						src="attributes/defense.png"
						class="user-profile__attribute-image"
					/>
					{{ user.defense || 0 }}
					DEF
				</span>
			</div>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.user-profile {
	&__main-info {
		display: flex;
		align-items: center;
		gap: 18px;
		padding-bottom: 20px;
	}

	&__avatar-wrapper {
		position: relative;
	}

	&__presence {
		width: 24px;
		aspect-ratio: 1;
		border-radius: $radius-full;
		position: absolute;
		bottom: 0;
		left: 0;
		border: 3px solid $bg-card;

		&--online {
			background: #00b784;
		}

		&--offline {
			background: #80848e;
		}
	}

	&__name-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	&__name {
		font-size: 1.5rem;
		font-weight: 800;
		color: $text-primary;
	}

	&__id {
		font-size: 0.8125rem;
		color: $text-muted;
		margin-top: 2px;

		code {
			color: $text-secondary;
		}
	}

	&__economy {
		margin-left: auto;
		display: flex;
		flex-direction: column;
		align-items: end;
	}

	&__money {
		font-size: 2rem;
		font-weight: 700;
	}

	&__coins {
		font-size: 0.8rem;
		@include text-gradient;
	}

	&__badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 1px solid $border-subtle;
		padding-bottom: 1rem;
	}

	&__badge {
		width: 40px;
	}

	&__situation {
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		font-weight: 600;
		gap: 6px;
		margin: 0.5rem 0;
	}

	&__situation-image {
		width: 40px;
	}

	&__info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 16px;
		padding-top: 20px;
	}

	&__class {
		display: flex;
		font-weight: 600;
		color: $text-primary;
		align-items: center;
	}

	&__class-image {
		width: 32px;
		border-radius: $radius-full;
		background-color: $border-card;
		margin-right: 0.5rem;
	}

	&__attributes {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-left: auto;
	}

	&__attribute-image {
		width: 24px;
	}

	&__attribute {
		display: flex;
		align-items: center;
		font-size: 0.9375rem;
		font-weight: 600;
		color: $color-attribute;
	}
}
</style>
