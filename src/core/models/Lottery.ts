import { User } from "./User";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney } from "#bot/utils/ui";
import { Language, type Localization } from "./Language";
import { CrColors } from "#bot/utils/colors";
import { sendPrivateMessage } from "#bot/utils/discordInteractions";
import { Op } from "sequelize";
import { Casino } from "./Casino";
import { Log } from "#shared/log";
import { getCasinoClassModifier } from "#core/types/Classes";
import { LotteryDraws } from "#core/database/LotteryDraws";
import { LotteryTickets } from "#core/database/LotteryTickets";

export class Lottery {
	static IsMegaDraw(drawDate: Date): boolean {
		const temp = new Date(drawDate.getFullYear(), drawDate.getMonth(), drawDate.getDate() + 1);
		return temp.getDate() === 1;
	}

	static GetTicketPrice(drawDate: Date): number {
		if (this.IsMegaDraw(drawDate)) return 1_000_000;
		let day = drawDate.getDay();
		if (day === 0) day = 7;
		return 5_000 * day;
	}

	static IsVipOnly(drawDate: Date): boolean {
		const day = drawDate.getDay();
		return day === 0 || day === 6;
	}

	/** Returns what the user actually pays (VIPs get 25% off). */
	static GetTicketCost(drawDate: Date, isVip: boolean): number {
		const full = this.GetTicketPrice(drawDate);
		return isVip ? Math.floor(full * 0.75) : full;
	}

	static async GetNextDraw(): Promise<LotteryDraws | null> {
		return await LotteryDraws.findOne({
			where: { isFinished: false },
			order: [["drawTime", "ASC"]],
		});
	}

	static async GetLastWinner(): Promise<{ draw: LotteryDraws; ticket: LotteryTickets | null; user: User | null } | null> {
		const draw = await LotteryDraws.findOne({
			where: {
				isFinished: true,
				winningTicketId: { [Op.ne]: null },
			},
			order: [["drawTime", "DESC"]],
		});
		if (!draw) return null;

		if (!draw.winningTicketId) return { draw, ticket: null, user: null };

		const ticket = await LotteryTickets.findByPk(draw.winningTicketId);
		if (!ticket) return { draw, ticket: null, user: null };

		const user = await new User(ticket.userId).GetSimpleInfo();
		return { draw, ticket, user };
	}

	static async HasUserBoughtTicket(userId: string, drawId: number): Promise<LotteryTickets | null> {
		return await LotteryTickets.findOne({
			where: { userId, drawId },
		});
	}

	static async BuyTicket(user: User): Promise<{ success: boolean; message: string; ticketId?: number; amount?: number }> {
		const draw = await this.GetNextDraw();
		const s = Strings[user.Language];

		if (!draw) return { success: false, message: s.noDraw };

		const fullPrice = this.GetTicketPrice(draw.drawTime);
		const ticketCost = this.GetTicketCost(draw.drawTime, user.IsVip());

		const { canPlay, message } = await Casino.CanUserPlayGame(user, ticketCost);
		if (!canPlay) return { success: false, message };

		if (await this.HasUserBoughtTicket(user.Id, draw.id)) {
			return { success: false, message: s.alreadyBought };
		}

		const ticket = await LotteryTickets.create({
			userId: user.Id,
			drawId: draw.id,
			amount: ticketCost,
		});

		draw.totalTickets += 1;
		draw.totalAmount += fullPrice; // Always add full price to pot
		await draw.save();

		user.Money -= ticketCost;
		await user.Update({ money: user.Money });

		return { success: true, message: s.buySuccess(formatMoney(ticketCost, user.Language)), ticketId: ticket.id, amount: ticketCost };
	}

	static async RunDraw(drawId: number) {
		const draw = await LotteryDraws.findByPk(drawId);
		if (!draw || draw.isFinished) return;

		const allTickets = await LotteryTickets.findAll({
			where: { drawId: draw.id },
		});

		if (allTickets.length === 0) {
			Log.Info(`Lottery draw ${drawId} had no tickets. Skipping draw.`);
			draw.isFinished = true;
			await draw.save();
			await this.ScheduleNextDraw();
			return;
		}

		const winningIndex = Math.floor(Math.random() * allTickets.length);
		const winningTicket = allTickets[winningIndex];

		draw.winningTicketId = winningTicket.id;
		draw.isFinished = true;
		await draw.save();

		const winnerUser = await new User(winningTicket.userId).GetInfo();
		const basePrize = draw.totalAmount;
		let finalPrize = basePrize;

		if (winnerUser) {
			const modifier = getCasinoClassModifier(winnerUser.Class);
			finalPrize = Math.floor(basePrize * modifier);

			winningTicket.hasWon = true;
			winningTicket.winnings = finalPrize;
			await winningTicket.save();

			winnerUser.Money += finalPrize;
			winnerUser.Casino.WinCount += 1;
			winnerUser.Casino.WinSum += finalPrize;
			await winnerUser.Update({
				money: winnerUser.Money,
				casinoWinCount: winnerUser.Casino.WinCount,
				casinoWinSum: winnerUser.Casino.WinSum,
			});

			const s = Strings[winnerUser.Language];
			await sendPrivateMessage(
				winnerUser.Id,
				s.youWon(formatMoney(finalPrize, winnerUser.Language)),
				CrColors.Casino,
			);
		}
		else {
			winningTicket.hasWon = true;
			winningTicket.winnings = basePrize;
			await winningTicket.save();
		}

		for (const ticket of allTickets) {
			if (ticket.id === winningTicket.id) continue;

			ticket.hasWon = false;
			await ticket.save();

			const loserUser = await new User(ticket.userId).GetSimpleInfo();
			if (loserUser) {
				loserUser.Casino.LoseCount += 1;
				loserUser.Casino.LoseSum += ticket.amount;
				await loserUser.Update({
					casinoLoseCount: loserUser.Casino.LoseCount,
					casinoLoseSum: loserUser.Casino.LoseSum,
				});

				const s = Strings[loserUser.Language];
				await sendPrivateMessage(
					loserUser.Id,
					s.youLost(winnerUser?.Nickname || "Unknown"),
					CrColors.Casino,
				);
			}
		}

		Log.Info(`Lottery draw ${drawId} finished. ${winnerUser?.Nickname || "Unknown"} won ${formatMoney(finalPrize, Language.English)}.`);

		await this.ScheduleNextDraw();
	}

	static async ScheduleNextDraw() {
		const now = new Date();
		const nextDrawTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);

		if (this.IsMegaDraw(nextDrawTime)) {
			nextDrawTime.setHours(23, 59, 0, 0);
		}

		if (now.getTime() >= nextDrawTime.getTime()) {
			nextDrawTime.setDate(nextDrawTime.getDate() + 1);
			nextDrawTime.setHours(18, 0, 0, 0);
			if (this.IsMegaDraw(nextDrawTime)) {
				nextDrawTime.setHours(23, 59, 0, 0);
			}
		}

		const existing = await LotteryDraws.findOne({
			where: { drawTime: nextDrawTime }
		});

		if (!existing) {
			await LotteryDraws.create({
				drawTime: nextDrawTime,
			});
			Log.Info(`Next lottery draw scheduled for ${nextDrawTime}.`);
		}
	}

	static async CheckPendingDraws() {
		try {
			const now = new Date();
			const pendingDraws = await LotteryDraws.findAll({
				where: {
					drawTime: {
						[Op.lt]: now,
					},
					isFinished: false,
				},
			});

			for (const draw of pendingDraws) {
				await Lottery.RunDraw(draw.id);
			}
		}
		catch (error) {
			Log.Error(`Failed to check pending lottery draws: ${error}`);
		}
	}

	static async Initialize() {
		await Lottery.CheckPendingDraws();

		const nextDraw = await Lottery.GetNextDraw();
		if (!nextDraw) {
			await Lottery.ScheduleNextDraw();
		}

		setInterval(Lottery.CheckPendingDraws, 60 * 1_000);
		Log.Info("Lottery system initialized.");
	}
}

const Strings = {
	[Language.English]: {
		vipOnly: `This draw is exclusive for ${EmoteString.VIP} VIP members! You cannot buy a ticket.`,
		alreadyBought: "You already bought a ticket for the next draw.",
		noDraw: "No draw is currently active.",
		buySuccess: (price: string) => `You bought a ticket for ${price}! Good luck!`,
		youWon: (prize: string) => `${EmoteString.Ticket} **Winning Ticket!**\nCongratulations! You won the lottery draw and received **${prize}**!`,
		youLost: (winnerName: string) => `${EmoteString.Ticket} **Winning Ticket!**\nThe lottery draw is over. The winner was **${winnerName}**! Better luck next time.`
	},
	[Language.Portuguese]: {
		vipOnly: `Este sorteio é exclusivo para ${EmoteString.VIP} VIP members! Você não pode comprar um bilhete.`,
		alreadyBought: "Você já comprou um bilhete para o próximo sorteio.",
		noDraw: "Não há sorteio ativo no momento.",
		buySuccess: (price: string) => `Você comprou um bilhete por ${price}! Boa sorte!`,
		youWon: (prize: string) => `${EmoteString.Ticket} **Bilhete Premiado!**\nParabéns! Você ganhou o sorteio e recebeu **${prize}**!`,
		youLost: (winnerName: string) => `${EmoteString.Ticket} **Bilhete Premiado!**\nO sorteio acabou. O vencedor foi **${winnerName}**! Mais sorte na próxima vez.`
	},
	[Language.Spanish]: {
		vipOnly: `Este sorteo es exclusivo para ${EmoteString.VIP} VIP members! No puedes comprar un billete.`,
		alreadyBought: "Ya has comprado un billete para el próximo sorteo.",
		noDraw: "No hay sorteo activo en este momento.",
		buySuccess: (price: string) => `¡Has comprado un billete por ${price}! ¡Buena suerte!`,
		youWon: (prize: string) => `${EmoteString.Ticket} **Billete Premiado!**\n¡Felicidades! ¡Has ganado el sorteo y recibido **${prize}**!`,
		youLost: (winnerName: string) => `${EmoteString.Ticket} **Bilhete Premiado!**\nEl sorteo ha terminado. El ganador fue **${winnerName}**! Mejor suerte la próxima vez.`
	},
} as const satisfies Localization;
