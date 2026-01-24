import { User } from "./User";
import { getItemList, Items } from "../interfaces/Items";
import { Users } from "../database/Users";
import { differenceInHours } from "date-fns";
import { UserItems } from "../database/UserItems";
import { addHours } from "date-fns/addHours";
import { globalStrings, Language } from "./Language";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { EmoteString } from "../utils/emotes";
import { showTime } from "../utils/ui";
import { ClassList } from "../interfaces/Classes";
import { LocationList } from "../interfaces/Locations";
import { BundleId } from "../interfaces/Ids";
import { Colors } from "discord.js";

export class Shop {
	User: User;
	ItemList: Items[];
	Title: string;
	Description: string;
	Image: string;
	Color: number;
	Strings: typeof Strings[Language.English | Language.Portuguese | Language.Spanish];

	constructor(user: User) {
		this.User = user;
		this.ItemList = getItemList().filter((item) => item.Shop);
		this.Strings = Strings[user.Language];
		this.Title = this.Strings.title;
		this.Description = this.Strings.description;
		this.Image = "https://media.discordapp.net/attachments/531174573463306240/854876910885797909/Loja.png";
		this.Color = Colors.Green;
	}

	async CanUserBuyItem(item: Items) {
		const s = Strings[this.User.Language];
		let canBuy = true;
		let message = "";

		if (this.User.Money < item.Price) {
			message = s.noMoney;
			canBuy = false;
		}

		const existingItem = await UserItems.findOne({
			where: {
				userId: this.User.Id,
				itemId: item.Id,
			},
		});

		if (existingItem && differenceInHours(addHours(existingItem.remainingTime, 72), new Date()) > 360) {
			message = s.itemPassLimit(differenceInHours(existingItem.remainingTime, new Date()), `${item.Skin[BundleId.Default].String} ${item.Description[this.User.Language]}`);
			canBuy = false;
		}

		if (this.User.IsScavenging()) {
			message = s.scavenging(this.User.Scavenge.IsScavengingId!);
			canBuy = false;
		}

		if (this.User.IsInPrison()) {
			message = s.inPrison(this.User.Prison.Time);
			canBuy = false;
		}

		if (this.User.IsInHospital()) {
			message = s.inHospital(this.User.Hospital.Time);
			canBuy = false;
		}

		if (this.User.IsInCasinoGame()) {
			message = s.inCasino;
			canBuy = false;
		}

		if (this.User.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = globalStrings[this.User.Language].attackerIsBeatingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
			canBuy = false;
		}

		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = globalStrings[this.User.Language].attackerIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
			canBuy = false;
		}

		if (this.User.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.User.Robbery.IsRobbingId, { attributes: ["nickname", "class"] });
			message = globalStrings[this.User.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canBuy = false;
		}

		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			message = globalStrings[this.User.Language].attackerIsBeingRobbedById(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canBuy = false;
		}

		if (this.User.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.User.Robbery.IsRobbingLocationId];
			message = globalStrings[this.User.Language].attackerIsRobbingId(location.Name[this.User.Language]);
			canBuy = false;
		}

		return { canBuy, message };
	}
}

const Strings = {
	[Language.English]: {
		title: "Shop",
		description: "All items have a duration of 72 hours!",
		placeholderSelect: "Select an item to buy",
		cantBuy: "You can't buy anything right now",
		noMoney: "You don't have enough money to buy this item",
		scavenging: (placeId: ScavengeId) => `You can't buy items while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		inPrison: (prisonTime: Date) => `You can't buy items while in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `You can't buy items while in the hospital! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		inCasino: `You can't buy items while in the casino! ${EmoteString.Casino}`,
		itemPassLimit: (hours: number, itemName: string) => `You can't have more than 360 hours of the same item!\n-# Has ${hours} hours of ${itemName}.`,
	},

	[Language.Portuguese]: {
		title: "Loja",
		description: "Todos os itens tem duração de 72 horas!",
		placeholderSelect: "Selecione um item para comprar",
		cantBuy: "Você não pode comprar algo agora",
		noMoney: "Você não tem dinheiro suficiente para comprar este item",
		scavenging: (placeId: ScavengeId) => `Você não pode comprar itens enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		inPrison: (prisonTime: Date) => `Você não pode comprar itens enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `Você não pode comprar itens enqunato está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		inCasino: `Você não pode comprar itens enquanto está no cassino! ${EmoteString.Casino}`,
		itemPassLimit: (hours: number, itemName: string) => `Você não pode possuir mais de 360 horas de um mesmo item!\n-# Possui ${hours} horas de ${itemName}.`,
	},

	[Language.Spanish]: {
		title: "Comercio",
		description: "¡Todos los artículos tienen una duración de 72 horas!",
		placeholderSelect: "Seleccione un artículo para comprar",
		cantBuy: "No puedes comprar nada ahora mismo",
		noMoney: "No tienes suficiente dinero para comprar este artículo",
		scavenging: (placeId: ScavengeId) => `¡No puedes comprar artículos mientras estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		inPrison: (prisonTime: Date) => `¡No puedes comprar artículos mientras estás en prisión! ${EmoteString.Prison}\n-# Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `¡No puedes comprar artículos mientras estás en el hospital! ${EmoteString.Hospital}\n-# Serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		inCasino: `¡No puedes comprar artículos mientras estás en el casino! ${EmoteString.Casino}`,
		itemPassLimit: (hours: number, itemName: string) => `¡No puedes tener más de 360 horas del mismo artículo!\n-# Tiene ${hours} horas de ${itemName}.`,
	},
} as const;