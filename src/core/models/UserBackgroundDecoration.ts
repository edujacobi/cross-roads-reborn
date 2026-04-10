import { Log } from "#shared/log";
import { Language } from "./Language";
import { BackgroundDecorationId } from "#core/types/Ids";
import UserBackgroundDecorations from "#core/database/UserBackgroundDecorations";
import { BackgroundDecorationList } from "#core/types/BackgroundDecorations";
import type { User } from "./User";

export class UserBackgroundDecoration {
	UserId = "";
	BackgroundDecorationId = BackgroundDecorationId.Default;
	Description = "";

	// Create a new background for a user
	static async Create(userId: string, backgroundDecorationId: BackgroundDecorationId) {
		if (!userId || backgroundDecorationId === undefined) {
			Log.Warning(`Cannot create background without userId and backgroundDecorationId.`);
			return false;
		}

		try {
			// Check if background already exists for this user
			const existingDecoration = await UserBackgroundDecorations.findOne({
				where: {
					userId,
					backgroundDecorationId,
				},
			});

			if (existingDecoration) {
				Log.Warning(`Background decoration ${backgroundDecorationId} already exists for user ${userId}.`);
				return false;
			}

			await UserBackgroundDecorations.create({
				userId,
				backgroundDecorationId,
			});

			Log.Success(`Background decoration ${backgroundDecorationId} created for ${userId}.`);
			return true;
		}
		catch (err) {
			Log.Warning(`Something went wrong adding background decoration ${backgroundDecorationId} for ${userId}. Error ${err}`);
			return false;
		}
	}

	static async HasBackgroundDecoration(userId: string, backgroundDecorationId: BackgroundDecorationId) {
		if (!userId || backgroundDecorationId === null) {
			Log.Warning(`Cannot check if user has background decoration without userId and backgroundDecorationId.`);
			return false;
		}

		try {
			const existingDecoration = await UserBackgroundDecorations.findOne({
				where: {
					userId,
					backgroundDecorationId,
				},
			});

			return !!existingDecoration;
		}
		catch (err) {
			Log.Warning(`Something went wrong checking if user has background decoration ${backgroundDecorationId} for ${userId}. Error ${err}`);
			return false;
		}
	}

	// Delete a user's background
	static async Delete(userId: string, backgroundDecorationId: BackgroundDecorationId) {
		try {
			const deleted = await UserBackgroundDecorations.destroy({
				where: {
					userId,
					backgroundDecorationId,
				},
			});

			if (deleted) {
				Log.Success(`Background decoration ${backgroundDecorationId} removed for ${userId}.`);
				return true;
			}
			else {
				Log.Warning(`Background decoration ${backgroundDecorationId} not found for user ${userId}.`);
				return false;
			}
		}
		catch (err) {
			Log.Warning(`Something went wrong removing background decoration ${backgroundDecorationId} for ${userId}. Error ${err}`);
			return false;
		}
	}

	// Get list of backgrounds for a user
	static async GetList(user: User, language: Language = Language.English) {
		const userBackgroundDecorations = await UserBackgroundDecorations.findAll({
			where: {
				userId: user.Id,
			},
			order: [["backgroundDecorationId", "ASC"]],
		});

		const decorationIds: BackgroundDecorationId[] = [BackgroundDecorationId.Default];

		for (const decoration of userBackgroundDecorations) {
			if (BackgroundDecorationList[decoration.backgroundDecorationId] && !decorationIds.includes(decoration.backgroundDecorationId)) {
				decorationIds.push(decoration.backgroundDecorationId);
			}
		}

		return decorationIds.map(decorationId => {
			const decorationData = BackgroundDecorationList[decorationId];

			const bg = new UserBackgroundDecoration();
			bg.UserId = user.Id;
			bg.BackgroundDecorationId = decorationId;
			bg.Description = decorationData.Description[language];

			return bg;
		});
	}
}
