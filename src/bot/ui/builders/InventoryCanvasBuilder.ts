import { type Gang } from "#core/models/Gang";
import { getLocaleFromLanguage, Language, type Localization } from "#core/models/Language";
import { type User } from "#core/models/User";
import { type UserBadge } from "#core/models/UserBadge";
import { ClassList } from "#core/types/Classes";
import { InvestmentList } from "#core/types/Investments";
import { ItemType } from "#core/types/Items";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { type User as DUser } from "discord.js";
import { formatMoney } from "../../utils/ui";
import { AssetPaths } from "../../utils/assetPaths";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
import { GangImageCanvasBuilder } from "./GangImageCanvasBuilder";
import { UserImageCanvasBuilder } from "./UserImageCanvasBuilder";

export interface InventoryCanvasBuilderOptions {
	User: User,
	Badges: UserBadge[],
	DiscordUser: DUser,
	Gang: Gang | null,
	Language: Language,
	FullSize: boolean,
	IsOnline: boolean,
}

export class InventoryCanvasBuilder extends BaseCanvasBuilder {
	User: User;
	Badges: UserBadge[];
	DiscordUser: DUser;
	Gang: Gang | null;
	FullSize: boolean;
	IsOnline: boolean;

	static readonly MAX_ITEMS_PER_ROW = 8;
	static readonly MAX_ITEMS_PER_ROW_FULL_SIZE = 3;

	// Design Tokens (Sync with 36px rules)
	static readonly GRID_ITEM_HEIGHT = 127;
	static readonly GRID_ITEM_WIDTH_SMALL = 127;
	static readonly GRID_ITEM_WIDTH_LARGE = 378;

	// Layout Constants, addressing review point #1
	private static readonly Layout = {
		GRID_ROW_STRIDE: 151, // GRID_ITEM_HEIGHT + 24
		GRID_SEP_GAP: 36,
		SUBHEADER_END_CLOSED: 231, // 183 + 48
		SUBHEADER_END_OPEN: 317, // 186 + 83 + 48
		GRID_START_Y_CLOSED: 304,
		GRID_START_Y_OPEN: 390,
		BOTTOM_PADDING: 8
	} as const;

	constructor(params: InventoryCanvasBuilderOptions) {
		super(1200, InventoryCanvasBuilder.calculateHeight(params), params.Language);

		this.User = params.User;
		this.Badges = params.Badges;
		this.DiscordUser = params.DiscordUser;
		this.Gang = params.Gang;
		this.FullSize = params.FullSize;
		this.IsOnline = params.IsOnline;
	}

	/**
	 * Calculates the required canvas height (changes based on FullSize and lenght of items)
	 */
	private static calculateHeight(params: InventoryCanvasBuilderOptions): number {
		const itemsPerRow = params.FullSize ? this.MAX_ITEMS_PER_ROW_FULL_SIZE : this.MAX_ITEMS_PER_ROW;
		const rowCount = Math.ceil(params.User.Items.length / itemsPerRow);

		const subHeaderEnd = params.FullSize ? this.Layout.SUBHEADER_END_OPEN : this.Layout.SUBHEADER_END_CLOSED;
		const gridStartY = params.FullSize ? this.Layout.GRID_START_Y_OPEN : this.Layout.GRID_START_Y_CLOSED;

		// Footer dimensions
		let footerHeight = 0;
		if (params.FullSize) {
			if (params.User.Investment.Id != null) footerHeight += 32;
			if (params.Gang) footerHeight += 100;
		}
		else if (params.Gang || params.User.Investment.Id != null) {
			footerHeight = 32;
		}

		let contentBottom = subHeaderEnd;
		if (rowCount > 0) {
			contentBottom = gridStartY + (rowCount * this.Layout.GRID_ROW_STRIDE) - 24;
		}

		let calculatedHeight = contentBottom;
		if (footerHeight > 0) {
			calculatedHeight += 36 + footerHeight;
		}
		calculatedHeight += this.Layout.BOTTOM_PADDING;

		return Math.round(calculatedHeight);
	}

	/**
	 * Builds the inventory canvas.
	 */
	async GetCanvas() {
		await this.AddHeader();
		await this.AddSubHeader();
		await this.AddItemGrid();
		await this.AddFooters();
		return this.Canvas;
	}

	/**
	 * Adds the background to the canvas.
	 * NOT USED (DEFAULT TO TRANSPARENT BACKGROUND)
	 */
	AddBackground() {
		this.Ctx.fillStyle = "#242429";
		this.Ctx.fillRect(0, 0, this.Width, this.Height);
		return this;
	}

	/**
	 * Adds the header to the canvas.
	 * Header: Name, Badges, Money, Avatar, Online Indicator
	 */
	async AddHeader() {
		const avatarBuilder = new UserImageCanvasBuilder(this.User, this.DiscordUser.displayAvatarURL({ extension: "png", size: 128 }));
		avatarBuilder.SetDecoration(this.User.AvatarDecoration.Id);
		const avatarImage = await avatarBuilder.GetCanvas();

		// Avatar
		const avatarSize = 144;
		const avatarX = this.Padding - 24;
		const avatarY = 28;

		this.Ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);

		// Online Indicator
		const indicatorRadius = 15;
		const indicatorX = avatarX + 33;
		const indicatorY = avatarY + 114;
		const maskRadius = indicatorRadius + 4;

		this.Ctx.save();
		this.Ctx.globalCompositeOperation = "destination-out";
		this.Ctx.beginPath();
		this.Ctx.arc(indicatorX, indicatorY, maskRadius, 0, Math.PI * 2);
		this.Ctx.fill();
		this.Ctx.restore();

		this.Ctx.beginPath();
		this.Ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, Math.PI * 2);
		this.Ctx.fillStyle = this.IsOnline ? "#00B784" : "#80848E";
		this.Ctx.fill();

		const avatarRightEdge = avatarX + avatarSize;
		const currentX = avatarRightEdge + 28;

		// Name
		const titleY = avatarY + (this.FullSize ? 16 : 20);
		this.Ctx.fillStyle = "#E3E3E6";
		this.Ctx.font = "700 42px InterBold";
		this.Ctx.letterSpacing = "1px";
		this.Ctx.textBaseline = "top";
		this.Ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
		this.Ctx.shadowBlur = 8;
		this.Ctx.fillText(`${Strings[this.Language].inventoryOf} ${this.User.Nickname}`, currentX, titleY);
		this.Ctx.letterSpacing = "0px";

		// Badges
		const badgeSize = this.FullSize ? 48 : 36;
		const badgesY = titleY + 58;
		let badgeX = currentX;

		for (const badge of this.Badges) {
			await this.tryDrawImage(AssetPaths.getBadgeImage(badge.BadgeId), (badgeImg) => {
				const ratio = badgeImg.width / badgeImg.height;
				let drawWidth = badgeSize;
				let drawHeight = badgeSize;
				let offsetX = 0;
				let offsetY = 0;

				if (ratio > 1) {
					drawHeight = badgeSize / ratio;
					offsetY = (badgeSize - drawHeight) / 2;
				}
				else if (ratio < 1) {
					drawWidth = badgeSize * ratio;
					offsetX = (badgeSize - drawWidth) / 2;
				}

				this.Ctx.drawImage(badgeImg, badgeX + offsetX, badgesY + offsetY, drawWidth, drawHeight);
			});
			badgeX += badgeSize + (this.FullSize ? 18 : 12);
		}

		// Money
		const groupBottom = badgesY + badgeSize;
		const groupCenterY = (titleY + groupBottom) / 2 - 4;

		this.Ctx.textAlign = "right";
		this.Ctx.textBaseline = "middle";
		this.Ctx.fillStyle = "#FFFFFF";
		this.Ctx.font = "700 48px InterBold";
		this.Ctx.letterSpacing = "1px";
		this.Ctx.fillText(formatMoney(this.User.Money, this.Language), this.Width - this.Padding, groupCenterY);
		this.Ctx.textAlign = "left";
		this.Ctx.textBaseline = "top";
		this.Ctx.letterSpacing = "0px";

		return this;
	}

	/**
	 * Splits into two decomposition paths, addressing review point #3.
	 */
	async AddSubHeader() {
		if (this.FullSize) {
			await this.AddSubHeaderOpen();
		}
		else {
			await this.AddSubHeaderClosed();
		}
		this.Ctx.shadowBlur = 0;
		return this;
	}

	/**
	 * Adds the sub-header to the canvas (full size).
	 * Sub-header: Situation (Complex), Class, Attributes (ATK, DEF)
	 */
	private async AddSubHeaderOpen() {
		const subHeaderY = 186;

		// Situation
		await this.tryDrawImage(AssetPaths.getSituationImage(this.User.Situation.Id), imgSit =>
			this.Ctx.drawImage(imgSit, this.Padding, subHeaderY, 48, 48)
		);

		this.Ctx.fillStyle = "#E3E3E6";
		this.Ctx.font = "600 30px InterSemiBold";
		this.Ctx.textBaseline = "middle";
		this.Ctx.fillText(this.User.Situation.ComplexUI, this.Padding + 60, subHeaderY + 24);

		// Class
		const statsY = subHeaderY + 83;
		await this.tryDrawImage(AssetPaths.getClassImage(this.User.Class), imgClass => {
			this.Ctx.fillStyle = "#363640";
			this.Ctx.beginPath();
			this.Ctx.roundRect(this.Padding, statsY, 48, 48, 24);
			this.Ctx.fill();
			this.Ctx.drawImage(imgClass, this.Padding, statsY, 48, 48);
		});

		this.Ctx.fillStyle = "#E3E3E6";
		this.Ctx.font = "600 24px InterSemiBold";
		this.Ctx.fillText(ClassList[this.User.Class].Name[this.Language], this.Padding + 60, statsY + 24);

		// Attributes
		this.Ctx.textAlign = "right";
		const atkText = `${this.User.Attributes.Attack} ATK`;
		const defText = `${this.User.Attributes.Defense} DEF`;

		this.Ctx.font = "600 24px InterSemiBold";
		const defWidth = this.Ctx.measureText(defText).width;
		const atkWidth = this.Ctx.measureText(atkText).width;

		this.Ctx.fillStyle = "#F4E7D2";
		this.Ctx.fillText(defText, this.Width - this.Padding, statsY + 24);
		await this.tryDrawImage("ui/assets/images/attributes/defense.png", imgDef =>
			this.Ctx.drawImage(imgDef, this.Width - this.Padding - defWidth - 36, statsY + 7, 36, 36)
		);

		this.Ctx.fillText(atkText, this.Width - this.Padding - defWidth - 60, statsY + 24);
		await this.tryDrawImage("ui/assets/images/attributes/attack.png", imgAtk =>
			this.Ctx.drawImage(imgAtk, this.Width - this.Padding - defWidth - 60 - atkWidth - 36, statsY + 7, 36, 36)
		);

		this.Ctx.textAlign = "left";
	}

	/**
	 * Adds the sub-header to the canvas (closed).
	 * Sub-header: Class, Attributes (ATK, DEF), Situation (Simple)
	 */
	private async AddSubHeaderClosed() {
		const subHeaderY = 183;

		// Class
		await this.tryDrawImage(AssetPaths.getClassImage(this.User.Class), imgClass => {
			this.Ctx.fillStyle = "#363640";
			this.Ctx.beginPath();
			this.Ctx.roundRect(this.Padding, subHeaderY, 48, 48, 24);
			this.Ctx.fill();
			this.Ctx.drawImage(imgClass, this.Padding, subHeaderY, 48, 48);
		});

		const className = ClassList[this.User.Class].Name[this.Language];
		this.Ctx.fillStyle = "#E3E3E6";
		this.Ctx.font = "600 24px InterSemiBold";
		this.Ctx.textBaseline = "middle";
		this.Ctx.fillText(className, this.Padding + 60, subHeaderY + 24);

		const classWidth = this.Ctx.measureText(className).width;
		let statsX = this.Padding + 60 + classWidth + 36;
		const statIconSize = 32;
		const groupGap = 14;

		this.Ctx.font = "600 24px InterSemiBold";
		this.Ctx.fillStyle = "#F4E7D2";

		// Attributes
		await this.tryDrawImage("ui/assets/images/attributes/attack.png", imgAtk => {
			this.Ctx.drawImage(imgAtk, statsX, subHeaderY + 8, statIconSize, statIconSize);
			statsX += statIconSize;
			this.Ctx.fillText(`${this.User.Attributes.Attack}`, statsX, subHeaderY + 24);
			statsX += this.Ctx.measureText(`${this.User.Attributes.Attack}`).width + groupGap;
		});

		await this.tryDrawImage("ui/assets/images/attributes/defense.png", imgDef => {
			this.Ctx.drawImage(imgDef, statsX, subHeaderY + 8, statIconSize, statIconSize);
			statsX += statIconSize;
			this.Ctx.fillText(`${this.User.Attributes.Defense}`, statsX, subHeaderY + 24);
		});

		this.Ctx.textAlign = "right";
		this.Ctx.fillStyle = "#E3E3E6";
		this.Ctx.font = "600 30px InterSemiBold";

		const situationText = this.User.Situation.Simple;
		const textWidth = this.Ctx.measureText(situationText).width;
		const gap = 12;
		const imageSize = 48;

		// Situation
		await this.tryDrawImage(AssetPaths.getSituationImage(this.User.Situation.Id), imgSit => {
			const imageX = this.Width - this.Padding - textWidth - gap - imageSize;
			this.Ctx.drawImage(imgSit, imageX, subHeaderY, imageSize, imageSize);
		});

		this.Ctx.textBaseline = "middle";
		this.Ctx.fillText(situationText, this.Width - this.Padding, subHeaderY + 24);
		this.Ctx.textAlign = "left";
	}

	/**
	 * Adds the item grid to the canvas.
	 * Item can have Skin. 
	 * Yellow Warning if below 24 hours or 2 or less quantity.
	 * Red Warning if below 12 hours or 1 or less quantity.
	 */
	async AddItemGrid() {
		const gridStartY = this.FullSize ? InventoryCanvasBuilder.Layout.GRID_START_Y_OPEN : InventoryCanvasBuilder.Layout.GRID_START_Y_CLOSED;

		if (this.User.Items.length > 0) {
			const separatorY = gridStartY - InventoryCanvasBuilder.Layout.GRID_SEP_GAP;
			this.Ctx.strokeStyle = "#5B5B6B";
			this.Ctx.globalAlpha = 0.25;
			this.Ctx.lineWidth = 3;
			this.Ctx.beginPath();
			this.Ctx.moveTo(this.Padding, separatorY);
			this.Ctx.lineTo(this.Width - this.Padding, separatorY);
			this.Ctx.stroke();
			this.Ctx.globalAlpha = 1;
		}

		const itemsPerRow = this.FullSize ? InventoryCanvasBuilder.MAX_ITEMS_PER_ROW_FULL_SIZE : InventoryCanvasBuilder.MAX_ITEMS_PER_ROW;
		const rectWidth = this.FullSize ? InventoryCanvasBuilder.GRID_ITEM_WIDTH_LARGE : InventoryCanvasBuilder.GRID_ITEM_WIDTH_SMALL;
		const spacing = 24;
		const totalSlots = Math.ceil(this.User.Items.length / itemsPerRow) * itemsPerRow;

		for (let i = 0; i < totalSlots; i++) {
			const row = Math.floor(i / itemsPerRow);
			const col = i % itemsPerRow;
			const x = this.Padding + col * (rectWidth + spacing);
			const y = gridStartY + row * (InventoryCanvasBuilder.GRID_ITEM_HEIGHT + spacing);
			const item = this.User.Items[i];

			this.Ctx.fillStyle = "rgba(91, 91, 107, 0.25)";
			this.Ctx.beginPath();
			this.Ctx.roundRect(x, y, rectWidth, InventoryCanvasBuilder.GRID_ITEM_HEIGHT, 18);
			this.Ctx.fill();

			if (!item) continue;

			const ITEM_IMAGE_SIZE = 81; // Design token for item icons, addressing review point #10
			const OFFSET = (InventoryCanvasBuilder.GRID_ITEM_HEIGHT - ITEM_IMAGE_SIZE) / 2;

			try {
				const imgPath = AssetPaths.getItemImage(item.Id, item.SelectedSkin);
				const imgItem = await this.LoadLocalImage(imgPath);
				this.Ctx.drawImage(imgItem, x + OFFSET, y + OFFSET, ITEM_IMAGE_SIZE, ITEM_IMAGE_SIZE);
			}
			catch (e) {
				if (item.SelectedSkin !== 0) {
					await this.tryDrawImage(AssetPaths.getItemImage(item.Id, 0), imgDefault =>
						this.Ctx.drawImage(imgDefault, x + OFFSET, y + OFFSET, ITEM_IMAGE_SIZE, ITEM_IMAGE_SIZE)
					);
				}
			}

			const consumable = item.Type === ItemType.Consumable;
			const isLessThan24Hours = consumable ? item.Quantity <= 2 : differenceInHours(item.RemainingTime, Date.now()) < 24;
			const isLessThan12Hours = consumable ? item.Quantity <= 1 : differenceInHours(item.RemainingTime, Date.now()) < 12;
			const iconPath = isLessThan12Hours ? "ui/assets/images/ui_elements/infoDanger.png" : isLessThan24Hours ? "ui/assets/images/ui_elements/infoWarning.png" : null;

			if (this.FullSize) {
				this.Ctx.textBaseline = "top";
				this.Ctx.fillStyle = "#E3E3E6";
				this.Ctx.font = "700 21px InterBold";
				this.Ctx.fillText(item.Description[this.Language], x + 126, y + 35);

				const durationText = item.Type == ItemType.Consumable ? String(item.Quantity) : formatDistanceToNow(item.RemainingTime, { locale: getLocaleFromLanguage(this.Language) });
				this.Ctx.font = "400 18px Inter";
				this.Ctx.fillText(durationText, x + 126, y + 73);

				if (iconPath) {
					await this.tryDrawImage(iconPath, imgSub => {
						const textWidth = this.Ctx.measureText(durationText).width;
						this.Ctx.drawImage(imgSub, x + 126 + textWidth + 9, y + 67, 24, 24);
					});
				}
			}
			else if (iconPath) {
				await this.tryDrawImage(iconPath, imgSub =>
					this.Ctx.drawImage(imgSub, x + 78, y + 78, 36, 36)
				);
			}
		}
		return this;
	}

	/**
	 * Adds the footers to the canvas.
	 * Footer can be clear (no gang and no investment), with gang (on the right) and with investment (on the left), or with both
	 */
	async AddFooters() {
		if (!this.Gang && this.User.Investment.Id == null) return this;

		const itemsPerRow = this.FullSize ? InventoryCanvasBuilder.MAX_ITEMS_PER_ROW_FULL_SIZE : InventoryCanvasBuilder.MAX_ITEMS_PER_ROW;
		const rowCount = Math.ceil(this.User.Items.length / itemsPerRow);
		const subHeaderEnd = this.FullSize ? InventoryCanvasBuilder.Layout.SUBHEADER_END_OPEN : InventoryCanvasBuilder.Layout.SUBHEADER_END_CLOSED;
		const gridStartY = this.FullSize ? InventoryCanvasBuilder.Layout.GRID_START_Y_OPEN : InventoryCanvasBuilder.Layout.GRID_START_Y_CLOSED;

		const extraSpace = this.FullSize ? 0 : 36;
		this.Ctx.shadowBlur = 8;

		let footerY = rowCount > 0
			? gridStartY + (rowCount * InventoryCanvasBuilder.Layout.GRID_ROW_STRIDE) + extraSpace - 24
			: subHeaderEnd + 36;

		if (this.User.Investment.Id != null) {
			await this.DrawInvestmentBar(this.Padding, footerY);
			if (this.FullSize) {
				footerY += 36 + 36 + 32;
			};
		}

		if (this.Gang) {
			await new GangImageCanvasBuilder(this.User, this.Gang, this.Language, this.FullSize)
				.DrawGangInfo(this.Ctx, this.Padding, footerY);
		}

		return this;
	}

	/**
	 * Draws the investment bar.
	 * Investment bar can be full size (64px height, with remaining time) or small size (32px height, without remaining time).
	 */
	private async DrawInvestmentBar(x: number, y: number) {
		if (this.User.Investment.Id == null) return;

		const height = this.FullSize ? 64 : 32;
		const centerY = y + height / 2;
		const iconSize = 32;

		await this.tryDrawImage("ui/assets/images/situations/10_DefendingInvestment.png", imgInv => {
			this.Ctx.font = "600 18px InterSemiBold";
			this.Ctx.fillStyle = "#E3E3E6";
			this.Ctx.textBaseline = "middle";
			this.Ctx.textAlign = "left";

			const textX = x + iconSize + 10;
			const nameText = InvestmentList[this.User.Investment.Id!].Name[this.Language];

			if (this.FullSize) {
				this.Ctx.drawImage(imgInv, x, centerY, iconSize, iconSize);
				this.Ctx.fillText(nameText, textX, centerY + 16);
				const nameWidth = this.Ctx.measureText(nameText).width;
				const timeText = ` • ${formatDistanceToNow(this.User.Investment.ExpiresAt!, { locale: getLocaleFromLanguage(this.Language) })}`;
				this.Ctx.fillStyle = "#89999A";
				this.Ctx.fillText(timeText, textX + nameWidth, centerY + 16);
			}
			else {
				this.Ctx.drawImage(imgInv, x, centerY - iconSize / 2, iconSize, iconSize);
				this.Ctx.fillText(nameText, textX, centerY);
			}
		});
	}
}

const Strings = {
	[Language.English]: {
		inventoryOf: "Inventory of"
	},
	[Language.Portuguese]: {
		inventoryOf: "Inventário de"
	},
	[Language.Spanish]: {
		inventoryOf: "Inventario de"
	},
} as const satisfies Localization;