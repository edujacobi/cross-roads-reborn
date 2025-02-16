import { User } from "./User";
import { Language } from "./Language";
import { Shop } from "./Shop";
import { getItemList } from "./Item";
import { CrColors } from "../utils/colors";

export class BlackMarket extends Shop {
	constructor(user: User) {
		super(user);
		const s = Strings[user.Language];

		this.Title = s.title;
		this.Description = `# ${this.Title}\n${s.description}`;
		this.Image = "https://media.discordapp.net/attachments/937437946024435794/1335709252962091040/MercadoNegro.png";
		this.Color = CrColors.BlackMarket;
		this.ItemList = getItemList().filter((item) => item.BlackMarket);
	}

	IsBlackMarketOpen() {
		const today = new Date();
		const day = today.getDay();
		const hours = today.getHours();
		return day === 0 || day === 6 || (day === 5 && hours >= 20); // 0 is Sunday, 6 is Saturday
	}
}


const Strings = {
	[Language.English]: {
		title: "Black Market",
		description: "Look at these beauties!",
	},

	[Language.Portuguese]: {
		title: "Mercado Negro",
		description: "Olhe para essas belezinhas!",
	},

	[Language.Spanish]: {
		title: "Mercado Negro",
		description: "¡Mira estas bellezas!",
	},
} as const;