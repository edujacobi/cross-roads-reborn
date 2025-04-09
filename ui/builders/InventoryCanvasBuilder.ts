import { SituationId, User } from "../../models/User";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
import Konva from "konva";
import { formatMoney } from "../../utils/ui";
import { ClassId, ClassList } from "../../interfaces/Classes";
import { ItemId, UserItem } from "../../interfaces/Items";
import { Language } from "../../models/Language";
import { User as DUser } from "discord.js";

export class InventoryCanvasBuilder extends BaseCanvasBuilder {
	User: User;
	DiscordUser: DUser;
	AvatarUrl = "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png";

	constructor(user: User, discordUser: DUser, language: Language) {
		super(800, 300, language);
		this.User = user;
		this.DiscordUser = discordUser;

		// if (avatarUrl) {
		// 	this.AvatarUrl = avatarUrl;
		// }

		this.AddBackground();
	}

	AddBackground() {
		const layer = new Konva.Layer();

		const rect = new Konva.Rect({
			x: 0,
			y: 0,
			width: this.Width,
			height: this.Height,
			fill: "#242429",
		});
		layer.add(rect);

		this.Stage.add(layer);
	}

	async AddHeader(isOnline: boolean) {
		const layer = new Konva.Layer();

		if (this.User.IsVip()) {
			const imageVip = await this.CreateKonvaImageLocal("ui/assets/images/badges/vip.png", {
				x: this.Padding + 64 + this.Padding,
				y: this.Padding + 40,
				width: 24,
				height: 24,
			});

			const circleVip = new Konva.Circle({
				x: this.Padding + 32,
				y: this.Padding + 32,
				radius: 32,
				opacity: 0.5,
				fill: "#E0BA20",
			});

			circleVip.cache({
				x: -50,
				y: -50,
				width: 100,
				height: 100,
				offset : 40,
			});

			circleVip.filters([Konva.Filters.Blur]);
			circleVip.blurRadius(50);

			layer.add(imageVip, circleVip);
		}

		const image = await this.CreateKonvaImageUrl(this.DiscordUser.avatarURL({
			extension: "jpg",
			size: 64,
			forceStatic: true,
		}) || this.AvatarUrl, {
			x: this.Padding,
			y: this.Padding,
			width: 64,
			height: 64,
			cornerRadius: 32,
			fill: this.User.IsVip() ? "#E0BA20" : "#363640",
			stroke: this.User.IsVip() ? "#E0BA20" : "#363640",
			strokeWidth: 5,
		});

		const onlineCircle = new Konva.Circle({
			x: this.Padding + 10,
			y: this.Padding + 58,
			radius: 10,
			fill: isOnline ? "#00B784" : "#B55243",
			stroke: "#363640",
			strokeWidth: 3,
		});

		const textInv = new Konva.Text({
			x: this.Padding + 64 + this.Padding,
			y: this.Padding,
			text: `${Strings[this.Language].inventoryOf} ${this.User.Nickname}`,
			fontSize: 28,
			fontStyle: "700",
			fill: "#E3E3E6",
		});

		const textMoney = new Konva.Text({
			x: this.Width / 2,
			y: this.Padding,
			padding: this.Padding,
			height: 64,
			width: this.Width / 2,
			align: "right",
			verticalAlign: "middle",
			text: formatMoney(this.User.Money, this.Language),
			fontSize: 32,
			fontStyle: "700",
			fill: "#FFFFFF",
		});

		layer.add(image, onlineCircle, textInv, textMoney);

		this.Stage.add(layer);

		return this;
	}

	async AddSubHeader() {
		const layer = new Konva.Layer();

		const imageClass = await this.CreateKonvaImageLocal(this.GetClassImage(this.User.Class), {
			x: this.Padding,
			y: this.Padding + 92,
			width: 32,
			height: 32,
			cornerRadius: 16,
			fill: "#363640",
			stroke: "#363640",
			strokeWidth: 3,
		});

		const textClass = new Konva.Text({
			x: this.Padding + imageClass.width() + 8,
			y: this.Padding + 92,
			height: 32,
			verticalAlign: "middle",
			text: ClassList[this.User.Class].Description[this.Language],
			fontSize: 18,
			fontStyle: "600",
			fill: "#E3E3E6",
		});

		const textSituation = new Konva.Text({
			x: this.Width / 2,
			y: this.Padding + 92,
			padding: this.Padding,
			height: 32,
			width: this.Width / 2,
			align: "right",
			verticalAlign: "middle",
			text: this.User.Situation.Simple,
			fontSize: 20,
			fontStyle: "700",
			fill: "#E3E3E6",
		});

		const imageSituation = await this.CreateKonvaImageLocal(this.GetSituationImage(this.User.Situation.Id), {
			x: this.Width - (this.Padding + textSituation.getTextWidth() + 40),
			y: this.Padding + 92,
			width: 32,
			height: 32,
		});

		const separator = new Konva.Line({
			points: [
				this.Padding, this.Padding + 148,
				this.Width - this.Padding, this.Padding + 148,
			],
			stroke: "#363640",
			strokeWidth: 2,
			lineCap: "round",
			lineJoin: "round",
		});

		layer.add(imageClass, textClass, imageSituation, textSituation, separator);

		this.Stage.add(layer);
		return this;
	}

	async AddItemGrid(userItems: UserItem[]) {
		const layer = new Konva.Layer();

		let currentXSlot = this.Padding;

		for (const item of userItems) {
			const rect = new Konva.Rect({
				x: currentXSlot,
				y: this.Padding + 172,
				width: 80,
				height: 80,
				fill: "#5B5B6B",
				opacity: 0.25,
				cornerRadius: 8,
			});

			const image = await this.CreateKonvaImageLocal(this.GetItemImage(item.Id), {
				x: currentXSlot + 13,
				y: this.Padding + 172 + 13,
				width: 54,
				height: 54,
			});

			currentXSlot += rect.width() + 32;

			// TODO: Lógica para mais linhas (aumentar background)

			// invOpen.addFields([{
			// 	name: `${item.Skin.Default.Emote.String} ${item.Description[language]}`,
			// 	value: item.Type == ItemType.Consumable ? String(item.Quantity) : showTime(new Date(item.RemainingTime).getTime(), true),
			// 	inline: true,
			// }]);
			layer.add(rect, image);
		}

		this.Stage.add(layer);
		return this;
	}

	private GetClassImage(classId: ClassId) {
		const mapper = {
			[ClassId.None]: "0_None.png",
			[ClassId.Thief]: "1_Thief.png",
			[ClassId.Assassin]: "2_Assassin.png",
			[ClassId.Entrepreneur]: "3_Entrepeneur.png",
			[ClassId.Hobo]: "4_Hobo.png",
			[ClassId.Mafioso]: "5_Mafioso.png",
			[ClassId.Attorney]: "6_Attorney.png",
		};
		return "ui/assets/images/classes/" + (mapper[classId] || mapper[ClassId.None]);
	}

	private GetSituationImage(situationId: SituationId) {
		const mapper = {
			[SituationId.Idling]: "0_Idling.png",
			[SituationId.Job]: "1_Job.png",
			[SituationId.Robbery]: "2_Robbery.png",
			[SituationId.PrisonAndHospital]: "4_Prison.png",
			[SituationId.Prison]: "4_Prison.png",
			[SituationId.Hospital]: "5_Hospital.png",
			[SituationId.Scavenging]: "6_Scavenging.png",
			[SituationId.Wanted]: "7_Wanted.png",
		};
		return "ui/assets/images/situations/" + (mapper[situationId] || mapper[SituationId.Idling]);
	}

	private GetItemImage(itemId: ItemId) {
		const mapper = {
			[ItemId.Knife]: "0_Knife.png",
			[ItemId.Colt45]: "1_Glock17.png",
			[ItemId.Tec9]: "2_Tec9.png",
			[ItemId.Rifle]: "3_Rifle.png",
			[ItemId.Shotgun]: "4_Remington870.png",
			[ItemId.MP5]: "5_MP5.png",
			[ItemId.AK47]: "6_AK47.png",
			[ItemId.M4]: "7_M4A1.png",
			[ItemId.Sniper]: "8_Sniper.png",
			[ItemId.Katana]: "9_Katana.png",
			[ItemId.RPG]: "10_RPG.png",
			[ItemId.Minigun]: "11_Minigun.png",
			[ItemId.Bazooka]: "12_Bazooka.png",
			[ItemId.LightVest]: "13_LightVest.png",
			[ItemId.HeavyVest]: "14_HeavyVest.png",
			[ItemId.Goggles]: "15_Goggles.png",
			[ItemId.Exoskeleton]: "16_Exoskeleton.png",
			[ItemId.Jetpack]: "17_Jetpack.png",
			[ItemId.Grenade]: "18_Grenade.png",
			[ItemId.MicroUzi]: "19_MicroUzi.png",
			[ItemId.Sawnoff]: "20_Sawnoff.png",
			[ItemId.AdvancedScope]: "21_AdvancedScope.png",
			[ItemId.Sunglasses]: "22_SunGlasses.png",
			[ItemId.BrassKnuckles]: "23_BrassKnuckles.png",
			[ItemId.BaseballBat]: "24_BaseballBat.png",
		};
		return "ui/assets/images/items/" + mapper[itemId];
	}
}

const Strings = {
	[Language.English]: {
		inventoryOf: "Inventory of",
	},

	[Language.Portuguese]: {
		inventoryOf: "Inventário de",
	},

	[Language.Spanish]: {
		inventoryOf: "Inventario de",
	},
} as const;