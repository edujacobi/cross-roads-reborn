<script
	setup
	lang="ts"
>
import BaseCard from "~/components/ui/BaseCard.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { UserDetail } from "~/types/userDetail";
import { BadgeId } from "../../../src/core/types/Ids";

defineProps<{ user: UserDetail }>();

const { getClassImageUrl } = useClasses();
const { getSituationImageUrl } = useSituation();

function getBadgeImage(badgeId: BadgeId): string {
	// biome-ignore lint/suspicious/noDoubleEquals: GraphQl brings as number, not as BadgeId
	if (badgeId == BadgeId.VIP || badgeId == BadgeId.VIPEternal) {
		return imagePaths.badges.vip;
	}
	return `/images/badges/${BadgeId[badgeId]}.png`;
}
</script>

<template>
	<BaseCard class="user-profile">
		<div class="user-profile__main-info">
			<div class="user-profile__avatar-wrapper">
				<LazyNuxtImg
					:class="['user-avatar', `user-avatar--${user.avatarDecoration}`]"
					:src="user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
					:alt="user.nickname ? `Avatar de ${user.nickname}` : 'Avatar do jogador'"
					width="100"
					height="100"
				/>
				<span
					:class="`user-profile__presence user-profile__presence--${user.online ? 'online' : 'offline'}`"
					role="img"
					:aria-label="user.online ? 'Online' : 'Offline'"
				></span>
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
		<ul class="user-profile__badges">
			<li
				v-for="badge in user.badges"
				:key="badge.id"
			>
				<NuxtImg
					:src="getBadgeImage(badge.id as BadgeId)"
					:alt="badge.name"
					:title="badge.name"
					class="user-profile__badge"
					width="40"
					height="40"
				/>
			</li>
		</ul>

		<p class="user-profile__situation">
			<NuxtImg
				:src="getSituationImageUrl(user.situationId)"
				class="user-profile__situation-image"
				alt=""
				width="40"
				height="40"
			/>
			{{ user.situationText }}
		</p>

		<div class="user-profile__info">
			<div class="user-profile__class">
				<NuxtImg
					:src="getClassImageUrl(user.class)"
					class="user-profile__class-image"
					alt=""
					width="32"
					height="32"
				/>
				{{ user.className }}
			</div>

			<div class="user-profile__attributes">
				<span class="user-profile__attribute">
					<NuxtImg
						:src="imagePaths.attributes.attack"
						class="user-profile__attribute-image"
						alt=""
						width="24"
						height="24"
					/>
					{{ user.attack || 0 }}
					ATK
				</span>
				<span class="user-profile__attribute">
					<NuxtImg
						:src="imagePaths.attributes.defense"
						class="user-profile__attribute-image"
						alt=""
						width="24"
						height="24"
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
		gap: $spacing-md;
		padding-bottom: 1.25rem;

		// ponytail: stack profile and align economy nicely on mobile
		@media (max-width: 640px) {
			flex-direction: column;
			align-items: flex-start;
			gap: $spacing-sm;
		}
	}

	&__avatar-wrapper {
		position: relative;
	}

	&__presence {
		width: 1.5rem;
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
		margin-top: 0.125rem;

		code {
			color: $text-secondary;
		}
	}

	&__economy {
		margin-left: auto;
		display: flex;
		flex-direction: column;
		align-items: end;

		// ponytail: left-align economy numbers on mobile
		@media (max-width: 640px) {
			margin-left: 0;
			align-items: flex-start;
		}
	}

	&__money {
		font-size: 2rem;
		font-weight: 700;
		text-align: end;

		@media (max-width: 640px) {
			font-size: 1.5rem;
		}
	}

	&__coins {
		font-size: 0.8rem;
		@include text-gradient;
	}

	&__badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $spacing-sm;
		border-bottom: 1px solid $border-subtle;
		padding-bottom: $spacing-md;
		list-style: none;
		margin: 0;
		padding-left: 0;
	}

	&__badge {
		width: 2.5rem;
	}

	&__situation {
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		font-weight: 600;
		gap: 6px;
		margin: $spacing-sm 0;
	}

	&__situation-image {
		width: 2.5rem;
	}

	&__info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: $spacing-md;
		padding-top: 1.25rem;
	}

	&__class {
		display: flex;
		font-weight: 600;
		color: $text-primary;
		align-items: center;
	}

	&__class-image {
		width: 2rem;
		border-radius: $radius-full;
		background-color: $border-card;
		margin-right: $spacing-sm;
	}

	&__attributes {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		margin-left: auto;

		// ponytail: align attributes on smaller screens
		@media (max-width: 640px) {
			margin-left: 0;
		}
	}

	&__attribute-image {
		width: 1.5rem;
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
