import { Badges } from "../database/Badges";
import { Log } from "../utils/log";
import { showTime } from "../utils/ui";
import { User } from "./User";
import { EmoteString } from "../utils/emotes";

export class Badge {
	UserId = "";
	Description = "";
	DescriptionLong = "";
	Emoji = "";

	async Create() {
		if (!this.UserId || !this.DescriptionLong || !this.Emoji || !this.Description) {
			return Log.Warning(`Cannot create Badge without all values.`);
		}

		try {
			await Badges.create({
				description: this.Description,
				descriptionLong: this.DescriptionLong,
				emoji: this.Emoji,
				userId: this.UserId,
			});

			Log.Success(`Badge ${this.Description} created for ${this.UserId}.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Badge ${this.Description} for ${this.UserId}.`);
		}
	}

	static async GetList(userId: string) {

		const badges = await Badges.findAll({
			attributes: ["description", "descriptionLong", "emoji"],
			where: {
				userId,
			},
		});

		const badgeList: Badge[] = [];

		for (const badge of badges) {
			const b = new Badge();

			b.Description = badge.description;
			b.DescriptionLong = badge.descriptionLong;
			b.Emoji = badge.emoji;

			badgeList.push(b);
		}

		return badgeList;
	}

	static AddVIPBadgeInList(badgeList: Badge[], user: User) {

		const b = new Badge();

		const vipTime = user.VipTime?.getTime() || 0;

		b.Description = "VIP";
		b.DescriptionLong = user.VipEternal ? "This user is a Eternal VIP" : `This user is VIP. It will end ${showTime(vipTime, true)}`;
		b.Emoji = EmoteString.VIP;

		badgeList.unshift(b);

		return badgeList;
	}
}