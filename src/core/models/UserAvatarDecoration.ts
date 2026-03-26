import { Log } from "@shared/log";
import { Language } from "./Language";
import { AvatarDecorationId } from "@core/types/Ids";
import UserAvatarDecorations from "@core/database/UserAvatarDecorations";
import { AvatarDecorationList } from "@core/types/AvatarDecorations";
import { UserBadge } from "./UserBadge";
import type { User } from "./User";

export class UserAvatarDecoration {
	UserId = "";
	AvatarDecorationId = AvatarDecorationId.Default;
	Description = "";

	// Create a new bundle for a user
	static async Create(userId: string, avatarDecorationId: AvatarDecorationId) {
		if (!userId || !avatarDecorationId) {
			Log.Warning(`Cannot create bundle without userId and avatarDecorationId.`);
			return false;
		}

		try {
			// Check if bundle already exists for this user
			const existingDecoration = await UserAvatarDecorations.findOne({
				where: {
					userId,
					avatarDecorationId,
				},
			});

			if (existingDecoration) {
				Log.Warning(`Avatar decoration ${avatarDecorationId} already exists for user ${userId}.`);
				return false;
			}

			await UserAvatarDecorations.create({
				userId,
				avatarDecorationId,
			});

			Log.Success(`Avatar decoration ${avatarDecorationId} created for ${userId}.`);
			return true;
		}
		catch (err) {
			Log.Warning(`Something went wrong adding vvatar decoration ${avatarDecorationId} for ${userId}. Error ${err}`);
			return false;
		}
	}

	static async HasAvatarDecoration(userId: string, avatarDecorationId: AvatarDecorationId) {
		if (!userId || avatarDecorationId === null) {
			Log.Warning(`Cannot check if user has avatar decoration without userId and avatarDecorationId.`);
			return false;
		}

		try {
			const existingDecoration = await UserAvatarDecorations.findOne({
				where: {
					userId,
					avatarDecorationId,
				},
			});

			return !!existingDecoration;
		}
		catch (err) {
			Log.Warning(`Something went wrong checking if user has avatar decoration ${avatarDecorationId} for ${userId}. Error ${err}`);
		}
	}

	// Delete a user's bundle
	static async Delete(userId: string, avatarDecorationId: AvatarDecorationId) {
		try {
			const deleted = await UserAvatarDecorations.destroy({
				where: {
					userId,
					avatarDecorationId,
				},
			});

			if (deleted) {
				Log.Success(`Avatar decoration ${avatarDecorationId} removed for ${userId}.`);
				return true;
			}
			else {
				Log.Warning(`Avatar decoration ${avatarDecorationId} not found for user ${userId}.`);
				return false;
			}
		}
		catch (err) {
			Log.Warning(`Something went wrong removing avatar decoration ${avatarDecorationId} for ${userId}. Error ${err}\``);
			return false;
		}
	}

	// Get list of bundles for a user
	static async GetList(user: User, language: Language = Language.English) {
		const userAvatarDecorations = await UserAvatarDecorations.findAll({
			where: {
				userId: user.Id,
			},
			order: [["avatarDecorationId", "ASC"]],
		});

		const [isDeveloper, isModerator, isHelper] = await Promise.all([
			UserBadge.IsDeveloper(user.Id),
			UserBadge.IsModerator(user.Id),
			UserBadge.IsHelper(user.Id),
		]);

		const decorationIds: AvatarDecorationId[] = [AvatarDecorationId.Default];

		if (user.IsVip()) {
			decorationIds.push(AvatarDecorationId.VIP);
		}
		if (isDeveloper) {
			decorationIds.push(AvatarDecorationId.Developer);
		}
		if (isModerator) {
			decorationIds.push(AvatarDecorationId.Moderator);
		}
		if (isHelper) {
			decorationIds.push(AvatarDecorationId.Helper);
		}

		for (const decoration of userAvatarDecorations) {
			// Only add if it's a valid decoration and not already in the list (e.g., default, developer, etc.)
			if (AvatarDecorationList[decoration.avatarDecorationId] && !decorationIds.includes(decoration.avatarDecorationId)) {
				decorationIds.push(decoration.avatarDecorationId);
			}
		}

		return decorationIds.map(decorationId => {
			const decorationData = AvatarDecorationList[decorationId];

			const decoration = new UserAvatarDecoration();
			decoration.UserId = user.Id;
			decoration.AvatarDecorationId = decorationId;
			decoration.Description = decorationData.Description[language];

			return decoration;
		});
	}
}