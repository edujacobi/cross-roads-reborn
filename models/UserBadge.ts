import UserBadges from "../database/UserBadges";
import { Log } from "../utils/log";
import { showTime } from "../utils/ui";
import { User } from "./User";
import { BadgeId, BadgeList } from "../interfaces/Badges";
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
			const existingBadge = await UserBadges.findOne({
				where: {
					userId,
					badgeId,
				},
			});

			if (existingBadge) {
				Log.Warning(`Badge ${badgeId} already exists for user ${userId}.`);
				return false;
			}

			await UserBadges.create({
				userId,
				badgeId,
			});

			Log.Success(`Badge ${badgeId} created for ${userId}.`);
			return true;
		}
		catch (err) {
			Log.Warning(`Something went wrong adding badge ${badgeId} for ${userId}.`);
			return false;
		}
	}

	// Delete a user's badge
	static async Delete(userId: string, badgeId: BadgeId) {
		try {
			const deleted = await UserBadges.destroy({
				where: {
					userId,
					badgeId,
				},
			});

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
			Log.Warning(`Something went wrong removing badge ${badgeId} for ${userId}.`);
			return false;
		}
	}

	// Get list of badges for a user
	static async GetList(userId: string, language: Language = Language.English) {
		const userBadges = await UserBadges.findAll({
			where: {
				userId,
			},
		});

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
	 * @param userId User ID to check
	 * @returns Promise<boolean> True if the user has the moderator badge
	 */
	static async IsModerator(userId: string): Promise<boolean> {
		if (!userId) {
			Log.Warning("Cannot check moderator status without a userId");
			return false;
		}

		try {
			const badge = await UserBadges.findOne({
				where: {
					userId,
					badgeId: "moderator", // This key is defined in BadgeId.Moderator in interfaces/Badges.ts
				},
			});

			return !!badge; // Convert to boolean
		}
		catch (err) {
			Log.Warning(`Error checking moderator status for user ${userId}`);
			return false;
		}
	}
}