import { CrColors } from "#bot/utils/colors";
import { EmoteString } from "#bot/utils/emotes";
import { getItemList } from "#core/types/Items";
import { getGameTime } from "#shared/gameTime";
import { Language, type Localization } from "./Language";
import { Shop } from "./Shop";
import type { User } from "./User";
import { time, TimestampStyles } from "discord.js";

export class BlackMarket extends Shop {
	constructor(user: User) {
		super(user);
		const s = Strings[user.Language];

		this.Title = s.title;
		this.Description = `_"${s.description}"_`;
		this.Image = "https://media.discordapp.net/attachments/937437946024435794/1335709252962091040/MercadoNegro.png";
		this.Color = CrColors.BlackMarket;
		this.ItemList = getItemList().filter((item) => item.BlackMarket);
	}

	IsBlackMarketOpen() {
		const now = getGameTime();

		const isUserJacobi = this.User.Id === process.env.JACOBI_ID;
		if (BlackMarket.IsOpenAt(new Date(now.epochMilliseconds)) || isUserJacobi) {
			return { isOpen: true, message: "" };
		}

		const daysUntilFriday = (5 - now.dayOfWeek + 7) % 7;
		const nextOpening = now
			.add({ days: daysUntilFriday })
			.with({ hour: 18, minute: 0, second: 0, millisecond: 0 }, { disambiguation: "compatible" });
		const nextOpeningDate = new Date(nextOpening.epochMilliseconds);

		const message = `${EmoteString.BlackMarket} ${Strings[this.User.Language].hey(nextOpeningDate)}`;

		return { isOpen: false, message };
	}

	static IsOpenAt(date = new Date()): boolean {
		const gameTime = getGameTime(date);
		return gameTime.dayOfWeek === 6 || gameTime.dayOfWeek === 7 || (gameTime.dayOfWeek === 5 && gameTime.hour >= 18);
	}
}


const Strings = {
	[Language.English]: {
		title: "Black Market",
		description: "Look at these beauties!\nThe Black Market is open on Sundays, Saturdays and Fridays after 6pm (GMT-3)",
		hey: (date: Date) => `Hey, psst...\nCome back here ${time(date, TimestampStyles.RelativeTime)} and I will have some cool stuff to show you...`,
	},

	[Language.Portuguese]: {
		title: "Mercado Negro",
		description: "Olhe para essas belezinhas!\nO Mercado Negro é aberto aos domingos, sábados e sextas após as 18h (GMT-3)",
		hey: (date: Date) => `Ei, psst...\nVolte aqui ${time(date, TimestampStyles.RelativeTime)} que eu terei umas coisinhas bem legais pra te mostrar...`,
	},

	[Language.Spanish]: {
		title: "Mercado Negro",
		description: "¡Mira estas bellezas!\nEl mercado negro abre los domingos, sábados y viernes después de las 18h (GMT-3)",
		hey: (date: Date) => `Oye, psst...\nVuelve aquí ${time(date, TimestampStyles.RelativeTime)} y tendré algunas cosas geniales para mostrarte...`,
	},
} as const satisfies Localization;