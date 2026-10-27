"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lottery = void 0;
const User_1 = require("./User");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("./Language");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Casino_1 = require("./Casino");
const log_1 = require("#shared/log");
const Classes_1 = require("#core/types/Classes");
const LotteryRepository_1 = require("#core/repositories/LotteryRepository");
class Lottery {
    static IsMegaDraw(drawDate) {
        const temp = new Date(drawDate.getFullYear(), drawDate.getMonth(), drawDate.getDate() + 1);
        return temp.getDate() === 1;
    }
    static GetTicketPrice(drawDate) {
        if (this.IsMegaDraw(drawDate))
            return 1_000_000;
        let day = drawDate.getDay();
        if (day === 0)
            day = 7;
        return 5_000 * day;
    }
    /** Returns what the user actually pays (VIPs get 25% off). */
    static GetTicketCost(drawDate, isVip) {
        const full = this.GetTicketPrice(drawDate);
        return isVip ? Math.floor(full * 0.75) : full;
    }
    static async GetNextDraw() {
        return await LotteryRepository_1.LotteryRepository.FindNextDraw();
    }
    static async GetLastWinner() {
        const draw = await LotteryRepository_1.LotteryRepository.FindLastWinnerDraw();
        if (!draw)
            return null;
        if (!draw.winningTicketId)
            return { draw, ticket: null, user: null };
        const ticket = await LotteryRepository_1.LotteryRepository.FindTicketById(draw.winningTicketId);
        if (!ticket)
            return { draw, ticket: null, user: null };
        const user = await new User_1.User(ticket.userId).GetSimpleInfo();
        return { draw, ticket, user };
    }
    static async HasUserBoughtTicket(userId, drawId) {
        return await LotteryRepository_1.LotteryRepository.FindTicket(userId, drawId);
    }
    static async BuyTicket(user) {
        const draw = await this.GetNextDraw();
        const s = Strings[user.Language];
        if (!draw)
            return { success: false, message: s.noDraw };
        const fullPrice = this.GetTicketPrice(draw.drawTime);
        const ticketCost = this.GetTicketCost(draw.drawTime, user.IsVip());
        const { canPlay, message } = await Casino_1.Casino.CanUserPlayGame(user, ticketCost);
        if (!canPlay)
            return { success: false, message };
        if (await this.HasUserBoughtTicket(user.Id, draw.id)) {
            return { success: false, message: s.alreadyBought };
        }
        if (!await Casino_1.Casino.StartUserGame(user)) {
            await user.GetInfo();
            const currentStatus = await Casino_1.Casino.CanUserPlayGame(user, ticketCost);
            return { success: false, message: currentStatus.message || "Você já está jogando no cassino." };
        }
        try {
            const ticket = await LotteryRepository_1.LotteryRepository.CreateTicket({
                userId: user.Id,
                drawId: draw.id,
                amount: ticketCost,
            });
            await LotteryRepository_1.LotteryRepository.AddTicketToDraw(draw.id, fullPrice);
            user.Money -= ticketCost;
            await user.Update({ money: user.Money });
            return { success: true, message: s.buySuccess((0, ui_1.formatMoney)(ticketCost, user.Language)), ticketId: ticket.id, amount: ticketCost };
        }
        finally {
            user.Casino.IsInGame = false;
            await user.Update({ casinoIsInGame: false });
        }
    }
    static async RunDraw(drawId) {
        const draw = await LotteryRepository_1.LotteryRepository.FindDrawById(drawId);
        if (!draw || draw.isFinished)
            return;
        const allTickets = await LotteryRepository_1.LotteryRepository.FindAllTicketsForDraw(draw.id);
        if (allTickets.length === 0) {
            log_1.Log.Info(`Lottery draw ${drawId} had no tickets. Skipping draw.`);
            draw.isFinished = true;
            await LotteryRepository_1.LotteryRepository.UpdateDraw(draw.id, { isFinished: true });
            await this.ScheduleNextDraw();
            return;
        }
        const winningIndex = Math.floor(Math.random() * allTickets.length);
        const winningTicket = allTickets[winningIndex];
        draw.winningTicketId = winningTicket.id;
        draw.isFinished = true;
        await LotteryRepository_1.LotteryRepository.UpdateDraw(draw.id, {
            winningTicketId: draw.winningTicketId,
            isFinished: true,
        });
        const winnerUser = await new User_1.User(winningTicket.userId).GetInfo();
        const basePrize = draw.totalAmount;
        let finalPrize = basePrize;
        if (winnerUser) {
            const modifier = (0, Classes_1.getCasinoClassModifier)(winnerUser.Class);
            finalPrize = Math.floor(basePrize * modifier);
            winningTicket.hasWon = true;
            winningTicket.winnings = finalPrize;
            await LotteryRepository_1.LotteryRepository.UpdateTicket(winningTicket.id, {
                hasWon: true,
                winnings: finalPrize,
            });
            await Casino_1.Casino.FinishUserGameWithWin(winnerUser, finalPrize, winningTicket.amount);
            const s = Strings[winnerUser.Language];
            await (0, discordInteractions_1.sendPrivateMessage)(winnerUser.Id, s.youWon((0, ui_1.formatMoney)(finalPrize, winnerUser.Language)), colors_1.CrColors.Casino);
        }
        else {
            winningTicket.hasWon = true;
            winningTicket.winnings = basePrize;
            await LotteryRepository_1.LotteryRepository.UpdateTicket(winningTicket.id, {
                hasWon: true,
                winnings: basePrize,
            });
        }
        for (const ticket of allTickets) {
            if (ticket.id === winningTicket.id)
                continue;
            ticket.hasWon = false;
            await LotteryRepository_1.LotteryRepository.UpdateTicket(ticket.id, { hasWon: false });
            const loserUser = await new User_1.User(ticket.userId).GetInfo();
            if (loserUser) {
                await Casino_1.Casino.FinishUserGameWithLossNoSubtraction(loserUser, ticket.amount);
                const s = Strings[loserUser.Language];
                await (0, discordInteractions_1.sendPrivateMessage)(loserUser.Id, s.youLost(winnerUser?.GetNameWithImage() || "Unknown", (0, ui_1.formatMoney)(finalPrize, loserUser.Language)), colors_1.CrColors.Casino);
            }
        }
        log_1.Log.Success(`Lottery draw ${drawId} finished. ${winnerUser?.Nickname || "Unknown"} won ${(0, ui_1.formatMoney)(finalPrize, Language_1.Language.English)}.`);
        await this.ScheduleNextDraw();
    }
    static async ScheduleNextDraw() {
        const now = new Date();
        const nextDrawTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
        if (this.IsMegaDraw(nextDrawTime)) {
            nextDrawTime.setHours(23, 59, 59, 0);
        }
        if (now.getTime() >= nextDrawTime.getTime()) {
            nextDrawTime.setDate(nextDrawTime.getDate() + 1);
            nextDrawTime.setHours(19, 0, 0, 0);
            if (this.IsMegaDraw(nextDrawTime)) {
                nextDrawTime.setHours(23, 59, 59, 0);
            }
        }
        const existing = await LotteryRepository_1.LotteryRepository.FindDrawByTime(nextDrawTime);
        if (!existing) {
            await LotteryRepository_1.LotteryRepository.CreateDraw({
                drawTime: nextDrawTime,
            });
            log_1.Log.Info(`Next lottery draw scheduled for ${nextDrawTime}.`);
        }
    }
    static async CheckPendingDraws() {
        try {
            const now = new Date();
            const pendingDraws = await LotteryRepository_1.LotteryRepository.FindPendingDraws(now);
            for (const draw of pendingDraws) {
                await Lottery.RunDraw(draw.id);
            }
        }
        catch (error) {
            log_1.Log.Error(`Failed to check pending lottery draws: ${error}`);
        }
    }
    static async Initialize() {
        await Lottery.CheckPendingDraws();
        const nextDraw = await Lottery.GetNextDraw();
        if (!nextDraw) {
            await Lottery.ScheduleNextDraw();
        }
        setInterval(Lottery.CheckPendingDraws, 60 * 1_000);
        log_1.logger.info("Lottery system initialized.");
    }
}
exports.Lottery = Lottery;
const Strings = {
    [Language_1.Language.English]: {
        alreadyBought: "You already bought a ticket for the next draw.",
        noDraw: "No draw is currently active.",
        buySuccess: (price) => `You bought a ticket for ${price}! Good luck!`,
        youWon: (prize) => `${emotes_1.EmoteString.Ticket} **Winning Ticket!**\nCongratulations! You won the lottery draw and received **${prize}**!`,
        youLost: (winnerName, prize) => `${emotes_1.EmoteString.Ticket} **Winning Ticket!**\nThe lottery draw is over. The winner was **${winnerName}**, winning **${prize}**! Better luck next time.`
    },
    [Language_1.Language.Portuguese]: {
        alreadyBought: "Você já comprou um bilhete para o próximo sorteio.",
        noDraw: "Não há sorteio ativo no momento.",
        buySuccess: (price) => `Você comprou um bilhete por ${price}! Boa sorte!`,
        youWon: (prize) => `${emotes_1.EmoteString.Ticket} **Bilhete Premiado!**\nParabéns! Você ganhou o sorteio e recebeu **${prize}**!`,
        youLost: (winnerName, prize) => `${emotes_1.EmoteString.Ticket} **Bilhete Premiado!**\nO sorteio acabou. O vencedor foi **${winnerName}**, ganhando **${prize}**! Mais sorte na próxima vez.`
    },
    [Language_1.Language.Spanish]: {
        alreadyBought: "Ya has comprado un billete para el próximo sorteio.",
        noDraw: "No hay sorteo activo en este momento.",
        buySuccess: (price) => `¡Has comprado un billete por ${price}! ¡Buena suerte!`,
        youWon: (prize) => `${emotes_1.EmoteString.Ticket} **Billete Premiado!**\n¡Felicidades! ¡Has ganado el sorteo y recibido **${prize}**!`,
        youLost: (winnerName, prize) => `${emotes_1.EmoteString.Ticket} **Billete Premiado!**\nEl sorteo ha terminado. El ganador fue **${winnerName}**, ganando **${prize}**! Mejor suerte la próxima vez.`
    },
};
//# sourceMappingURL=Lottery.js.map