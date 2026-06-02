import { UserBadgeRepository } from "#core/repositories/UserBadgeRepository";
import { Log } from "#shared/log";
import { showTime } from "#bot/utils/ui";
import type { User } from "./User";
import { BadgeId, BadgeList } from "#core/types/Badges";
import { Language } from "./Language";

export class UserBadge {
	UserId = "";
	BadgeId = BadgeId.VIP;
	Name = "";
	Description = "";
	Emoji = "";

	// Create a new badge for a user
	static async Create(userId: string, badgeId: BadgeId) {
		if (!userId || !badgeId) {
			Log.Warning(`Cannot create badge without userId and badgeId.`);
			return false;
		}

		try {
			// Check if badge already exists for this user
			const existingBadge = await UserBadgeRepository.FindOne(userId, badgeId);

			if (existingBadge) {
				Log.Warning(`Badge ${badgeId} already exists for user ${userId}.`);
				return false;
			}

			await UserBadgeRepository.Create({
				userId,
				badgeId,
			});

			Log.Success(`Badge ${badgeId} created for ${userId}.`);
			return true;
		}
		catch (err) {
			Log.Warning(`Something went wrong adding badge ${badgeId} for ${userId}. Error ${err}`);
			return false;
		}
	}

	// Delete a user's badge
	static async Delete(userId: string, badgeId: BadgeId) {
		try {
			const deleted = await UserBadgeRepository.Destroy(userId, badgeId);

			if (deleted) {
				Log.Success(`Badge ${badgeId} removed for ${userId}.`);
				return true;
			}
			else {
				Log.Warning(`Badge ${badgeId} not found for user ${userId}.`);
				return false;
			}
		}
		catch (err) {
			Log.Warning(`Something went wrong removing badge ${badgeId} for ${userId}. Error ${err}\``);
			return false;
		}
	}

	// Get list of badges for a user
	static async GetList(userId: string, language: Language = Language.English) {
		const userBadges = await UserBadgeRepository.FindAllByUserId(userId);

		const badgeList: UserBadge[] = [];

		for (const userBadge of userBadges) {
			const badgeData = BadgeList[userBadge.badgeId];

			if (badgeData) {
				const badge = new UserBadge();

				badge.UserId = userBadge.userId;
				badge.BadgeId = userBadge.badgeId;
				badge.Name = badgeData.Name[language];
				badge.Description = badgeData.Description[language];
				badge.Emoji = badgeData.Emoji.String;

				badgeList.push(badge);
			}
		}

		return badgeList;
	}

	static AddVIPBadgeInList(badgeList: UserBadge[], user: User, language: Language = Language.English) {
		const badgeId = user.VipEternal ? BadgeId.VIPEternal : BadgeId.VIP;
		const badgeData = BadgeList[badgeId];

		const b = new UserBadge();

		b.BadgeId = badgeId;
		b.Name = badgeData.Name[language];
		b.Description = badgeData.Description[language];
		b.Emoji = badgeData.Emoji.String;

		if (!user.VipEternal) {
			b.Description += `. ${showTime(user.VipTime!.getTime(), true)}`;
		}

		badgeList.unshift(b);

		return badgeList;
	}

	/**
	 * Checks if a user has the Moderator badge
	 * @param userId User Id to check
	 * @returns Promise<boolean> True if the user has the moderator badge
	 */
	static async IsModerator(userId: string): Promise<boolean> {
		if (!userId) {
			Log.Warning("Cannot check moderator status without a userId");
			return false;
		}

		try {
			const badge = await UserBadgeRepository.FindOne(userId, BadgeId.Moderator);

			return !!badge; // Convert to boolean
		}
		catch (err) {
			Log.Warning(`Error checking moderator status for user ${userId}`);
			return false;
		}
	}

	/**
	 * Checks if a user has the Developer badge
	 * @param userId User Id to check
	 * @returns Promise<boolean> True if the user has the developer badge
	 */
	static async IsDeveloper(userId: string): Promise<boolean> {
		if (!userId) {
			Log.Warning("Cannot check developer status without a userId");
			return false;
		}

		try {
			const badge = await UserBadgeRepository.FindOne(userId, BadgeId.Developer);

			return !!badge; // Convert to boolean
		}
		catch (err) {
			Log.Warning(`Error checking developer status for user ${userId}`);
			return false;
		}
	}

	/**
	 * Checks if a user has the Helper badge
	 * @param userId User Id to check
	 * @returns Promise<boolean> True if the user has the helper badge
	 */
	static async IsHelper(userId: string): Promise<boolean> {
		if (!userId) {
			Log.Warning("Cannot check helper status without a userId");
			return false;
		}

		try {
			const badge = await UserBadgeRepository.FindOne(userId, BadgeId.Helper);

			return !!badge; // Convert to boolean
		}
		catch (err) {
			Log.Warning(`Error checking helper status for user ${userId}`);
			return false;
		}
	}
}