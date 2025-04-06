import { User } from "../../models/User";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
import Konva from "konva";
import { formatMoney } from "../../utils/ui";
import { ClassList } from "../../interfaces/Classes";
import { UserItem } from "../../interfaces/Items";

export class InventoryCanvasBuilder extends BaseCanvasBuilder {
	User: User;
	AvatarUrl = "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png";

	constructor(user: User, avatarUrl: string | null) {
		super(800, 300);
		this.User = user;

		if (avatarUrl) {
			this.AvatarUrl = avatarUrl;
		}

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

		// const layer2 = new Konva.Layer();
		// const circle = new Konva.Circle({
		// 	x: this.Width,
		// 	y: 0,
		// 	radius: 250,
		// 	fill: "#008D64",
		// 	opacity: 0.1,
		// });
		// circle.cache({
		// 	offset: 200,
		// });
		// circle.filters([Konva.Filters.Blur]);
		// circle.blurRadius(179);
		//
		// layer2.add(circle);
		// this.Stage.add(layer2);
	}

	AddHeader(isOnline: boolean) {
		const layer = new Konva.Layer();

		const circle = new Konva.Circle({
			x: this.Padding + 32,
			y: this.Padding + 32,
			radius: 32,
			fill: "#242429",
			stroke: "#363640",
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
			x: this.Padding + circle.width() + this.Padding,
			y: this.Padding,
			text: `Inventário de ${this.User.Nickname}`,
			fontSize: 28,
			fontStyle: "700",
			fill: "#E3E3E6",
		});

		const textBadges = new Konva.Text({
			x: this.Padding + circle.width() + this.Padding,
			y: this.Padding + 44,
			width: 277,
			text: "[Badges]",
			fontSize: 20,
			fontStyle: "700",
			fill: "#5B5B6B",
		});

		const textMoney = new Konva.Text({
			x: this.Width / 2,
			y: this.Padding,
			padding: this.Padding,
			height: 64,
			width: this.Width / 2,
			align: "right",
			verticalAlign: "middle",
			text: formatMoney(this.User.Money, this.User.Language),
			fontSize: 32,
			fontStyle: "700",
			fill: "#FFFFFF",
		});

		layer.add(circle, onlineCircle, textInv, textBadges, textMoney);

		this.Stage.add(layer);
		return this;
	}

	AddSubHeader() {
		const layer = new Konva.Layer();

		const circle = new Konva.Circle({
			x: this.Padding + 16,
			y: this.Padding + 92 + 16,
			radius: 16,
			fill: "#363640",
		});

		const textClass = new Konva.Text({
			x: this.Padding + circle.width() + 8,
			y: this.Padding + 92,
			height: 32,
			verticalAlign: "middle",
			text: ClassList[this.User.Class].Description[this.User.Language],
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

		const circle2 = new Konva.Circle({
			x: this.Width - (this.Padding + textSituation.getTextWidth() + 25),
			y: this.Padding + 92 + 16,
			radius: 16,
			fill: "#363640",
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

		layer.add(circle, textClass, textSituation, circle2, separator);

		this.Stage.add(layer);
		return this;
	}

	AddItemGrid(userItems: UserItem[]) {
		const layer = new Konva.Layer();

		let currentX = this.Padding;

		userItems.forEach(item => {
			const rect = new Konva.Rect({
				x: currentX,
				y: this.Padding + 172,
				width: 80,
				height: 80,
				fill: "#5B5B6B",
				opacity: 0.25,
				cornerRadius: 8,
			});
			currentX += rect.width() + 32;

			const text = new Konva.Text({
				x: rect.x(),
				y: rect.y() + 8,
				text: item.Description[this.User.Language],
				fontSize: 16,
				fontStyle: "600",
				fill: "#E3E3E6",
			});

			// TODO: Lógica para mais linhas (aumentar background)

			// invOpen.addFields([{
			// 	name: `${item.Skin.Default.Emote.String} ${item.Description[language]}`,
			// 	value: item.Type == ItemType.Consumable ? String(item.Quantity) : showTime(new Date(item.RemainingTime).getTime(), true),
			// 	inline: true,
			// }]);
			layer.add(rect, text);
		});

		this.Stage.add(layer);
		return this;
	}
}