import { Log } from "../utils/log";
import { Language } from "./Language";
import { BundleId } from "../interfaces/Ids";
import UserBundles from "../database/UserBundles";
import { BundleList } from "../interfaces/Skins";
import { ItemList, Items } from "../interfaces/Items";

export class UserBundle {
	UserId = "";
	BundleId = BundleId.Default;
	Description = "";
	Items: Items[] = [];

	// Create a new bundle for a user
	static async Create(userId: string, bundleId: BundleId) {
		if (!userId || !bundleId) {
			Log.Warning(`Cannot create bundle without userId and bundleId.`);
			return false;
		}

		try {
			// Check if bundle already exists for this user
			const existingBundle = await UserBundles.findOne({
				where: {
					userId,
					bundleId,
				},
			});

			if (existingBundle) {
				Log.Warning(`Bundle ${bundleId} already exists for user ${userId}.`);
				return false;
			}

			await UserBundles.create({
				userId,
				bundleId,
			});

			Log.Success(`Bundle ${bundleId} created for ${userId}.`);
			return true;
		}
		catch (err) {
			Log.Warning(`Something went wrong adding bundle ${bundleId} for ${userId}. Error ${err}`);
			return false;
		}
	}

	static async HasBundle(userId: string, bundleId: BundleId) {
		if (!userId || !bundleId) {
			Log.Warning(`Cannot check if user has bundle without userId and bundleId.`);
			return false;
		}

		try {
			const existingBundle = await UserBundles.findOne({
				where: {
					userId,
					bundleId,
				},
			});

			return !!existingBundle;
		}
		catch (err) {
			Log.Warning(`Something went wrong checking if user has bundle ${bundleId} for ${userId}. Error ${err}`);
		}
	}

	// Delete a user's bundle
	static async Delete(userId: string, bundleId: BundleId) {
		try {
			const deleted = await UserBundles.destroy({
				where: {
					userId,
					bundleId,
				},
			});

			if (deleted) {
				Log.Success(`Bundle ${bundleId} removed for ${userId}.`);
				return true;
			}
			else {
				Log.Warning(`Bundle ${bundleId} not found for user ${userId}.`);
				return false;
			}
		}
		catch (err) {
			Log.Warning(`Something went wrong removing bundle ${bundleId} for ${userId}. Error ${err}\``);
			return false;
		}
	}

	// Get list of bundles for a user
	static async GetList(userId: string, language: Language = Language.English) {
		const userBundles = await UserBundles.findAll({
			where: {
				userId,
			},
			order: [["bundleId", "ASC"]],
		});

		const defaultBundle = BundleList[BundleId.Default];

		const defaultUserBundle = new UserBundle();
		defaultUserBundle.BundleId = defaultBundle.Id;
		defaultUserBundle.Description = defaultBundle.Description[language];
		defaultUserBundle.Items = defaultBundle.Items.map(item => ItemList[item]);
		defaultUserBundle.UserId = userId;

		const bundleList: UserBundle[] = [defaultUserBundle];

		for (const userBundle of userBundles) {
			const bundleData = BundleList[userBundle.bundleId];

			if (bundleData) {
				const bundle = new UserBundle();

				bundle.UserId = userBundle.userId;
				bundle.BundleId = userBundle.bundleId;
				bundle.Description = bundleData.Description[language];
				bundle.Items = bundleData.Items.map(item => ItemList[item]);

				bundleList.push(bundle);
			}
		}

		return bundleList;
	}
}