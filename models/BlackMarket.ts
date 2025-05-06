import { User } from "./User";
import { Language } from "./Language";
import { Shop } from "./Shop";
import { getItemList } from "../interfaces/Items";
import { CrColors } from "../utils/colors";

export class BlackMarket extends Shop {
	constructor(user: User) {
		super(user);
		const s = Strings[user.Language];

		this.Title = s.title;
		this.Description = `# ${this.Title}\n_"${s.description}"_`;
		this.Image = "https://media.discordapp.net/attachments/937437946024435794/1335709252962091040/MercadoNegro.png";
		this.Color = CrColors.BlackMarket;
		this.ItemList = getItemList().filter((item) => item.BlackMarket);
	}

	IsBlackMarketOpen() {
		const today = new Date();
		const day = today.getDay();
		const hours = today.getHours();

		let isOpen = false;
		let message = Strings[this.User.Language].hey as string;

		const isUserJacobi = this.User.Id === process.env.JACOBI_ID;

		const SUNDAY = 0;
		const FRIDAY = 5;
		const SATURDAY = 6;

		if (day === SUNDAY ||
			day === SATURDAY ||
			(day === FRIDAY && hours >= 20) ||
			isUserJacobi
		) {
			isOpen = true;
			message = "";
		}

		return { isOpen, message };
	}
}


const Strings = {
	[Language.English]: {
		title: "Black Market",
		description: "Look at these beauties!",
		hey: "Hey, psst... Come back here at 8 PM on Friday and I will have some cool stuff to show you...",
	},

	[Language.Portuguese]: {
		title: "Mercado Negro",
		description: "Olhe para essas belezinhas!",
		hey: "Hey, psst... Volte aqui às 20h de sexta-feira que eu terei umas coisinhas bem legais pra te mostrar...",
	},

	[Language.Spanish]: {
		title: "Mercado Negro",
		description: "¡Mira estas bellezas!",
		hey: "Oye, psst... Vuelve aquí a las 8 PM del viernes y tendré algunas cosas geniales para mostrarte...",
	},
} as const;