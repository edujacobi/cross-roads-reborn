import type { User } from "./User";
import { getItemList, type Items } from "#core/types/Items";
import { Users } from "#core/database/Users";
import { differenceInHours } from "date-fns";
import { addHours } from "date-fns/addHours";
import { globalStrings, Language, type Localization } from "./Language";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";
import { EmoteString } from "#bot/utils/emotes";
import { showTime } from "#bot/utils/ui";
import { ClassList } from "#core/types/Classes";
import { LocationList } from "#core/types/Locations";
import { BundleId } from "#core/types/Ids";
import { Colors } from "discord.js";
import { JobList } from "#core/types/Jobs";

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

		const existingItem = this.User.Items.find((i) => i.Id === item.Id);

		if (existingItem && differenceInHours(addHours(existingItem.RemainingTime, 72), new Date()) > 360) {
			message = s.itemPassLimit(differenceInHours(existingItem.RemainingTime, new Date()), `${item.Skin[BundleId.Default].String} ${item.Description[this.User.Language]}`);
			canBuy = false;
		}

		if (this.User.IsWorking()) {
			message = s.working(this.User.Job.EndsIn, this.User.Job.Id!);
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
		description: `Buying items increases your power, allowing you to rob and scavenge new locations and work jobs with better pay.
All items have a duration of 72 hours!
-# You can only buy items while you are ${EmoteString.Idle} Idling.`,
		cantBuy: "You can't buy anything right now",
		noMoney: "You don't have enough money to buy this item",
		scavenging: (placeId: ScavengeId) => `You can't buy items while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		working: (jobTime: Date, jobId: number) => `You can't buy items while working! ${EmoteString.Jobs}\n-# Your job of **${JobList[jobId].Description[Language.English]}** will end ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `You can't buy items while in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `You can't buy items while in the hospital! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		inCasino: `You can't buy items while in the casino! ${EmoteString.Casino}`,
		itemPassLimit: (hours: number, itemName: string) => `You can't have more than 360 hours of the same item!\n-# Has ${hours} hours of ${itemName}.`,
	},

	[Language.Portuguese]: {
		title: "Loja",
		description: `Comprar itens aumenta seu poder, permitindo roubar e vasculhar novos locais e trabalhar em empregos com melhores salários.
Todos os itens tem duração de 72 horas!
-# Você só pode comprar itens enquanto estiver ${EmoteString.Idle} Vadiando.`,
		cantBuy: "Você não pode comprar algo agora",
		noMoney: "Você não tem dinheiro suficiente para comprar este item",
		scavenging: (placeId: ScavengeId) => `Você não pode comprar itens enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		working: (jobTime: Date, jobId: number) => `Você não pode comprar itens enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `Você não pode comprar itens enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `Você não pode comprar itens enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		inCasino: `Você não pode comprar itens enquanto está no cassino! ${EmoteString.Casino}`,
		itemPassLimit: (hours: number, itemName: string) => `Você não pode possuir mais de 360 horas de um mesmo item!\n-# Possui ${hours} horas de ${itemName}.`,
	},

	[Language.Spanish]: {
		title: "Comercio",
		description: `Comprar artículos aumenta tu poder, permitiendo robar y buscar nuevos lugares y trabajar en empleos con mejores salarios.
¡Todos los artículos tienen una duración de 72 horas!
-# Solo puedes comprar artículos mientras estés ${EmoteString.Idle} Vagando.`,
		cantBuy: "No puedes comprar nada ahora mismo",
		noMoney: "No tienes suficiente dinero para comprar este artículo",
		scavenging: (placeId: ScavengeId) => `¡No puedes comprar artículos mientras estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		working: (jobTime: Date, jobId: number) => `¡No puedes comprar artículos mientras trabajas! ${EmoteString.Jobs}\n-# ¡Tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** terminará ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes comprar artículos mientras estás en prisión! ${EmoteString.Prison}\n-# Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `¡No puedes comprar artículos mientras estás en el hospital! ${EmoteString.Hospital}\n-# Serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		inCasino: `¡No puedes comprar artículos mientras estás en el casino! ${EmoteString.Casino}`,
		itemPassLimit: (hours: number, itemName: string) => `¡No puedes tener más de 360 horas del mismo artículo!\n-# Tiene ${hours} horas de ${itemName}.`,
	},
} as const satisfies Localization;