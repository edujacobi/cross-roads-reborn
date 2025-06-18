// import { SituationId, User } from "../../models/User";
// import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
// import Konva from "konva";
// import { formatMoney } from "../../utils/ui";
// import { ClassId, ClassList } from "../../interfaces/Classes";
// import { ItemId, ItemType, UserItem } from "../../interfaces/Items";
// import { getLocaleFromLanguage, Language } from "../../models/Language";
// import { User as DUser } from "discord.js";
// import { differenceInHours, formatDistanceToNow } from "date-fns";
//
// export interface InventoryCanvasBuilderOptions {
// 	User: User,
// 	UserItems: UserItem[],
// 	DiscordUser: DUser,
// 	Language: Language,
// 	FullSize: boolean
// }
//
// export class InventoryCanvasBuilder extends BaseCanvasBuilder {
// 	User: User;
// 	UserItems: UserItem[];
// 	DiscordUser: DUser;
// 	AvatarUrl = "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png";
// 	FullSize: boolean;
//
// 	MAX_ITEMS_PER_ROW = 8;
// 	MAX_ITEMS_PER_ROW_FULL_SIZE = 3;
//
// 	constructor(params: InventoryCanvasBuilderOptions) {
// 		let calculatedHeight = params.FullSize ? 236 : 172;
//
// 		if (params.UserItems.length > 0) {
// 			calculatedHeight += 36;
// 			calculatedHeight += Math.ceil(params.UserItems.length / (params.FullSize ? 3 : 8)) * 96;
// 		}
//
// 		super(800, calculatedHeight, params.Language);
//
// 		this.User = params.User;
// 		this.UserItems = params.UserItems;
// 		this.DiscordUser = params.DiscordUser;
// 		this.FullSize = params.FullSize;
// 	}
//
// 	AddBackground() {
// 		const layer = new Konva.Layer();
//
// 		const rect = new Konva.Rect({
// 			listening: false,
// 			x: 0,
// 			y: 0,
// 			width: this.Width,
// 			height: this.Height,
// 			fill: "#242429",
// 		});
//
// 		// const ellipsis = new Konva.Circle({
// 		// 	listening: false,
// 		// 	x: this.Width - 30,
// 		// 	y: -160,
// 		// 	radius: 256,
// 		// 	opacity: 0.1,
// 		// 	fill: "#008D64",
// 		// });
// 		//
// 		// ellipsis.cache({
// 		// 	x: -350,
// 		// 	y: -350,
// 		// 	width: 700,
// 		// 	height: 700,
// 		// 	offset: 50,
// 		// });
// 		//
// 		// ellipsis.filters([Konva.Filters.Blur]);
// 		// ellipsis.blurRadius(180);
//
// 		// layer.add(rect, ellipsis);
// 		layer.add(rect);
// 		layer.listening(false);
//
// 		this.Stage.add(layer);
// 	}
//
// 	async AddHeader(isOnline: boolean) {
// 		const layer = new Konva.Layer();
//
// 		if (this.User.IsVip()) {
// 			const imageVip = await this.CreateKonvaImageLocal("ui/assets/images/badges/vip.png", {
// 				x: this.Padding + 64 + this.Padding,
// 				y: this.Padding + 40,
// 				width: this.FullSize ? 32 : 24,
// 				height: this.FullSize ? 32 : 24,
// 			});
//
// 			const circleVip = new Konva.Circle({
// 				listening: false,
// 				x: this.Padding + 32,
// 				y: this.Padding + 32,
// 				radius: 32,
// 				opacity: 0.35,
// 				fill: "#E0BA20",
// 			});
//
// 			circleVip.cache({
// 				x: -50,
// 				y: -50,
// 				width: 100,
// 				height: 100,
// 				offset: 40,
// 			});
//
// 			circleVip.filters([Konva.Filters.Blur]);
// 			circleVip.blurRadius(70);
//
// 			layer.add(imageVip, circleVip);
// 		}
//
// 		const image = await this.CreateKonvaImageLocal(this.GetClassImage(this.User.Class), {
// 			x: this.Padding,
// 			y: this.Padding,
// 			width: 64,
// 			height: 64,
// 			cornerRadius: 40,
// 			fill: "#363640",
// 			stroke: this.User.IsVip() ? "#E0BA20" : "#363640",
// 			strokeWidth: 4,
// 		});
//
// 		const onlineCircle = new Konva.Circle({
// 			listening: false,
// 			x: this.Padding + 10,
// 			y: this.Padding + 58,
// 			radius: 10,
// 			fill: isOnline ? "#00B784" : "#B55243",
// 			stroke: "#363640",
// 			strokeWidth: 4,
// 		});
//
// 		const textInv = new Konva.Text({
// 			listening: false,
// 			x: this.Padding + 64 + this.Padding,
// 			y: this.Padding,
// 			text: `${Strings[this.Language].inventoryOf} ${this.User.Nickname}`,
// 			fontSize: 24,
// 			// fontFamily: "Inter",
// 			fontStyle: "700",
// 			fill: "#E3E3E6",
// 		});
//
// 		const textMoney = new Konva.Text({
// 			listening: false,
// 			x: this.Width / 2,
// 			y: this.Padding,
// 			padding: this.Padding,
// 			height: 64,
// 			width: this.Width / 2,
// 			align: "right",
// 			verticalAlign: "middle",
// 			text: formatMoney(this.User.Money, this.Language),
// 			fontSize: 32,
// 			// fontFamily: "Inter",
// 			fontStyle: "700",
// 			fill: "#FFFFFF",
// 		});
//
// 		layer.add(image, onlineCircle, textInv, textMoney);
//
// 		layer.listening(false);
// 		this.Stage.add(layer);
//
// 		return this;
// 	}
//
// 	async AddSubHeader() {
// 		const layer = new Konva.Layer();
//
// 		if (this.FullSize) {
// 			const imageSituation = await this.CreateKonvaImageLocal(this.GetSituationImage(this.User.Situation.Id), {
// 				x: this.Padding,
// 				y: this.Padding + 100,
// 				width: 32,
// 				height: 32,
// 			});
//
// 			const textSituation = new Konva.Text({
// 				listening: false,
// 				x: this.Padding + imageSituation.width() + 8,
// 				y: this.Padding + 100,
// 				height: 32,
// 				width: this.Width,
// 				verticalAlign: "middle",
// 				text: this.User.Situation.ComplexUI,
// 				fontSize: 20,
// 				// fontFamily: "Inter",
// 				fontStyle: "700",
// 				fill: "#E3E3E6",
// 			});
//
// 			const imageClass = await this.CreateKonvaImageLocal("ui/assets/images/ui_elements/inventory.png", {
// 				x: this.Padding,
// 				y: this.Padding + 160,
// 				width: 32,
// 				height: 32,
// 				cornerRadius: 16,
// 				fill: "#363640",
// 				stroke: "#363640",
// 				strokeWidth: 3,
// 			});
//
// 			const textClass = new Konva.Text({
// 				listening: false,
// 				x: this.Padding + imageClass.width() + 8,
// 				y: this.Padding + 160,
// 				height: 32,
// 				verticalAlign: "middle",
// 				text: ClassList[this.User.Class].Description[this.Language],
// 				fontSize: 18,
// 				// fontFamily: "Inter",
// 				fontStyle: "600",
// 				fill: "#E3E3E6",
// 			});
//
// 			const textDEF = new Konva.Text({
// 				listening: false,
// 				x: (this.Width / 2) - this.Padding,
// 				y: this.Padding + 160,
// 				width: this.Width / 2,
// 				height: 24,
// 				align: "right",
// 				verticalAlign: "middle",
// 				text: `${this.User.Attributes.Defense} DEF`,
// 				fontSize: 16,
// 				// fontFamily: "Inter",
// 				fontStyle: "700",
// 				fill: "#F4E7D2",
// 			});
//
// 			const imageDEF = await this.CreateKonvaImageLocal("ui/assets/images/attributes/defense.png", {
// 				x: this.Width - (this.Padding + textDEF.getTextWidth()) - 24,
// 				y: this.Padding + 160,
// 				width: 24,
// 				height: 24,
// 			});
//
// 			const textATK = new Konva.Text({
// 				listening: false,
// 				x: imageDEF.x() - 60 - 8,
// 				y: this.Padding + 160,
// 				width: 60,
// 				height: 24,
// 				verticalAlign: "middle",
// 				text: `${this.User.Attributes.Attack} ATK`,
// 				fontSize: 16,
// 				// fontFamily: "Inter",
// 				fontStyle: "700",
// 				fill: "#F4E7D2",
// 			});
//
// 			const imageATK = await this.CreateKonvaImageLocal("ui/assets/images/attributes/attack.png", {
// 				x: textATK.x() - 24,
// 				y: this.Padding + 160,
// 				width: 24,
// 				height: 24,
// 			});
//
// 			layer.add(imageClass, textClass, imageSituation, textSituation, textDEF, imageDEF, textATK, imageATK);
// 		}
// 		else {
// 			const imageClass = await this.CreateKonvaImageLocal("ui/assets/images/ui_elements/inventory.png", {
// 				x: this.Padding,
// 				y: this.Padding + 92,
// 				width: 32,
// 				height: 32,
// 				cornerRadius: 16,
// 				fill: "#363640",
// 				stroke: "#363640",
// 				strokeWidth: 3,
// 			});
//
// 			const textClass = new Konva.Text({
// 				listening: false,
// 				x: this.Padding + imageClass.width() + 8,
// 				y: this.Padding + 92,
// 				height: 32,
// 				verticalAlign: "middle",
// 				text: ClassList[this.User.Class].Description[this.Language],
// 				fontSize: 18,
// 				// fontFamily: "Inter",
// 				fontStyle: "600",
// 				fill: "#E3E3E6",
// 			});
//
// 			const textSituation = new Konva.Text({
// 				listening: false,
// 				x: this.Width / 2,
// 				y: this.Padding + 92,
// 				padding: this.Padding,
// 				height: 32,
// 				width: this.Width / 2,
// 				align: "right",
// 				verticalAlign: "middle",
// 				text: this.User.Situation.Simple,
// 				fontSize: 20,
// 				// fontFamily: "Inter",
// 				fontStyle: "700",
// 				fill: "#E3E3E6",
// 			});
//
// 			const imageSituation = await this.CreateKonvaImageLocal(this.GetSituationImage(this.User.Situation.Id), {
// 				x: this.Width - (this.Padding + textSituation.getTextWidth() + 40),
// 				y: this.Padding + 92,
// 				width: 32,
// 				height: 32,
// 			});
//
// 			layer.add(imageClass, textClass, imageSituation, textSituation);
// 		}
//
// 		const separator = new Konva.Line({
// 			points: [
// 				this.Padding, this.Padding + (this.FullSize ? 212 : 148),
// 				this.Width - this.Padding, this.Padding + (this.FullSize ? 212 : 148),
// 			],
// 			stroke: "#363640",
// 			strokeWidth: 2,
// 			lineCap: "round",
// 			lineJoin: "round",
// 		});
//
//
// 		if (this.UserItems.length > 0) {
// 			layer.add(separator);
// 		}
//
// 		layer.listening(false);
// 		this.Stage.add(layer);
// 		return this;
// 	}
//
// 	async AddItemGrid() {
// 		const layer = new Konva.Layer();
//
// 		const addItemToLayer = async (item: UserItem, x: number, y: number) => {
// 			const image = await this.CreateKonvaImageLocal(this.GetItemImage(item.Id), {
// 				x: x + 13,
// 				y: y + 13,
// 				width: 54,
// 				height: 54,
// 			});
// 			layer.add(image);
//
// 			const remainingHours = differenceInHours(item.RemainingTime, new Date());
// 			const iconPath = remainingHours < 12
// 				? "ui/assets/images/ui_elements/infoDanger.png"
// 				: remainingHours < 24
// 					? "ui/assets/images/ui_elements/infoWarning.png"
// 					: null;
//
// 			if (this.FullSize) {
// 				const itemName = new Konva.Text({
// 					listening: false,
// 					x: x + 83,
// 					y: y + 20,
// 					text: item.Description[this.Language],
// 					fontSize: 14,
// 					// fontFamily: "Inter",
// 					fontStyle: "700",
// 					fill: "#E3E3E6",
// 				});
// 				const itemDuration = new Konva.Text({
// 					listening: false,
// 					x: x + 83,
// 					y: y + 45,
// 					text: item.Type == ItemType.Consumable ? String(item.Quantity) : formatDistanceToNow(item.RemainingTime, { locale: getLocaleFromLanguage(this.Language) }),
// 					fontSize: 12,
// 					// fontFamily: "Inter",
// 					fontStyle: "600",
// 					fill: "#E3E3E6",
// 				});
//
// 				if (iconPath) {
// 					const icon = await this.CreateKonvaImageLocal(iconPath, {
// 						x: itemDuration.x() + itemDuration.getTextWidth() + 6,
// 						y: itemDuration.y() - 2,
// 						width: 16,
// 						height: 16,
// 					});
// 					layer.add(icon);
// 				}
// 				layer.add(itemName, itemDuration);
// 			}
// 			else if (iconPath) {
// 				const icon = await this.CreateKonvaImageLocal(iconPath, {
// 					x: x + 52,
// 					y: y + 52,
// 					width: 24,
// 					height: 24,
// 				});
// 				layer.add(icon);
// 			}
// 		};
//
// 		const itemsPerRow = this.FullSize ? this.MAX_ITEMS_PER_ROW_FULL_SIZE : this.MAX_ITEMS_PER_ROW;
// 		const rectWidth = this.FullSize ? 240 : 80;
// 		const rows = Math.ceil(this.UserItems.length / itemsPerRow);
//
// 		for (let i = 0; i < rows; i++) {
// 			const y = this.Padding + (this.FullSize ? 236 : 172) + i * 96;
//
// 			for (let j = 0; j < itemsPerRow; j++) {
// 				const x = this.Padding + j * (rectWidth + 16);
// 				const rect = new Konva.Rect({
// 					listening: false,
// 					x,
// 					y,
// 					width: rectWidth,
// 					height: 80,
// 					fill: "#5B5B6B",
// 					opacity: 0.25,
// 					cornerRadius: 8,
// 				});
// 				layer.add(rect);
//
// 				const item = this.UserItems[j + i * itemsPerRow];
// 				if (item) {
// 					await addItemToLayer(item, x, y);
// 				}
// 			}
// 		}
//
// 		layer.listening(false);
// 		this.Stage.add(layer);
// 		return this;
// 	}
//
// 	private GetClassImage(classId: ClassId) {
// 		const mapper = {
// 			[ClassId.None]: "0_None.png",
// 			[ClassId.Thief]: "1_Thief.png",
// 			[ClassId.Assassin]: "2_Assassin.png",
// 			[ClassId.Entrepreneur]: "3_Entrepeneur.png",
// 			[ClassId.Hobo]: "4_Hobo.png",
// 			[ClassId.Mafioso]: "5_Mafioso.png",
// 			[ClassId.Attorney]: "6_Attorney.png",
// 		};
// 		return "ui/assets/images/classes/" + (mapper[classId] || mapper[ClassId.None]);
// 	}
//
// 	private GetSituationImage(situationId: SituationId) {
// 		const mapper = {
// 			[SituationId.Idling]: "0_Idling.png",
// 			[SituationId.Job]: "1_Job.png",
// 			[SituationId.Robbery]: "2_Robbery.png",
// 			[SituationId.PrisonAndHospital]: "4_Prison.png",
// 			[SituationId.Prison]: "4_Prison.png",
// 			[SituationId.Hospital]: "5_Hospital.png",
// 			[SituationId.Scavenging]: "6_Scavenging.png",
// 			[SituationId.Wanted]: "7_Wanted.png",
// 			[SituationId.BeatUp]: "8_BeatUp.png",
// 		};
// 		return "ui/assets/images/situations/" + (mapper[situationId] || mapper[SituationId.Idling]);
// 	}
//
// 	private GetItemImage(itemId: ItemId) {
// 		const mapper = {
// 			[ItemId.Knife]: "0_Knife.png",
// 			[ItemId.Colt45]: "1_Glock17.png",
// 			[ItemId.Tec9]: "2_Tec9.png",
// 			[ItemId.Rifle]: "3_Rifle.png",
// 			[ItemId.Shotgun]: "4_Remington870.png",
// 			[ItemId.MP5]: "5_MP5.png",
// 			[ItemId.AK47]: "6_AK47.png",
// 			[ItemId.M4]: "7_M4A1.png",
// 			[ItemId.Sniper]: "8_Sniper.png",
// 			[ItemId.Katana]: "9_Katana.png",
// 			[ItemId.RPG]: "10_RPG.png",
// 			[ItemId.Minigun]: "11_Minigun.png",
// 			[ItemId.Bazooka]: "12_Bazooka.png",
// 			[ItemId.LightVest]: "13_LightVest.png",
// 			[ItemId.HeavyVest]: "14_HeavyVest.png",
// 			[ItemId.Goggles]: "15_Goggles.png",
// 			[ItemId.Exoskeleton]: "16_Exoskeleton.png",
// 			[ItemId.Jetpack]: "17_Jetpack.png",
// 			[ItemId.Grenade]: "18_Grenade.png",
// 			[ItemId.MicroUzi]: "19_MicroUzi.png",
// 			[ItemId.Sawnoff]: "20_Sawnoff.png",
// 			[ItemId.AdvancedScope]: "21_AdvancedScope.png",
// 			[ItemId.Sunglasses]: "22_SunGlasses.png",
// 			[ItemId.BrassKnuckles]: "23_BrassKnuckles.png",
// 			[ItemId.BaseballBat]: "24_BaseballBat.png",
// 		};
// 		return "ui/assets/images/items/" + mapper[itemId];
// 	}
// }
//
// const Strings = {
// 	[Language.English]: {
// 		inventoryOf: "Inventory of",
// 	},
//
// 	[Language.Portuguese]: {
// 		inventoryOf: "Inventário de",
// 	},
//
// 	[Language.Spanish]: {
// 		inventoryOf: "Inventario de",
// 	},
// } as const;