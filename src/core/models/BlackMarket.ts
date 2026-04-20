import { CrColors } from "#bot/utils/colors";
import { EmoteString } from "#bot/utils/emotes";
import { showTime } from "#bot/utils/ui";
import { getItemList } from "#core/types/Items";
import { nextFriday, set } from "date-fns";
import { Language, type Localization } from "./Language";
import { Shop } from "./Shop";
import type { User } from "./User";

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
		const OPENNING_HOUR = 21;
		const now = new Date();
		const day = now.getDay();
		const hours = now.getHours();

		let isOpen = false;

		const isUserJacobi = this.User.Id === process.env.JACOBI_ID;

		const SUNDAY = 0;
		const FRIDAY = 5;
		const SATURDAY = 6;

		if (day === SUNDAY ||
			day === SATURDAY ||
			(day === FRIDAY && hours >= OPENNING_HOUR) ||
			isUserJacobi
		) {
			isOpen = true;
			return { isOpen, message: "" };
		}

		let nextOpeningDate: Date;
		if (day === FRIDAY && hours < OPENNING_HOUR) {
			nextOpeningDate = set(now, { hours: OPENNING_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
		}
		else {
			nextOpeningDate = nextFriday(now);
			nextOpeningDate = set(nextOpeningDate, { hours: OPENNING_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
		}

		const message = `${EmoteString.BlackMarket} ${Strings[this.User.Language].hey(nextOpeningDate)}`;

		return { isOpen, message };
	}
}


const Strings = {
	[Language.English]: {
		title: "Black Market",
		description: "Look at these beauties!\nThe Black Market is open on Sundays, Saturdays and Fridays after 9pm",
		hey: (time: Date) => `Hey, psst...\nCome back here ${showTime(time.getTime(), true)} and I will have some cool stuff to show you...`,
	},

	[Language.Portuguese]: {
		title: "Mercado Negro",
		description: "Olhe para essas belezinhas!\nO Mercado Negro é aberto aos domingos, sábados e sextas após as 18h",
		hey: (time: Date) => `Ei, psst...\nVolte aqui ${showTime(time.getTime(), true)} que eu terei umas coisinhas bem legais pra te mostrar...`,
	},

	[Language.Spanish]: {
		title: "Mercado Negro",
		description: "¡Mira estas bellezas!\nEl mercado negro es abierto los domingos, sábados y viernes después de las 21h (GMT0)",
		hey: (time: Date) => `Oye, psst...\nVuelve aquí ${showTime(time.getTime(), true)} y tendré algunas cosas geniales para mostrarte...`,
	},
} as const satisfies Localization;