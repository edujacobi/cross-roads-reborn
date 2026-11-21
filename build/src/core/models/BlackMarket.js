"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackMarket = void 0;
const colors_1 = require("#bot/utils/colors");
const emotes_1 = require("#bot/utils/emotes");
const Items_1 = require("#core/types/Items");
const gameTime_1 = require("#shared/gameTime");
const Language_1 = require("./Language");
const Shop_1 = require("./Shop");
const discord_js_1 = require("discord.js");
class BlackMarket extends Shop_1.Shop {
    constructor(user) {
        super(user);
        const s = Strings[user.Language];
        this.Title = s.title;
        this.Description = `_"${s.description}"_`;
        this.Image = "https://media.discordapp.net/attachments/937437946024435794/1335709252962091040/MercadoNegro.png";
        this.Color = colors_1.CrColors.BlackMarket;
        this.ItemList = (0, Items_1.getItemList)().filter((item) => item.BlackMarket);
    }
    IsBlackMarketOpen() {
        const now = (0, gameTime_1.getGameTime)();
        const isUserJacobi = this.User.Id === process.env.JACOBI_ID;
        if (BlackMarket.IsOpenAt(new Date(now.epochMilliseconds)) || isUserJacobi) {
            return { isOpen: true, message: "" };
        }
        const daysUntilFriday = (5 - now.dayOfWeek + 7) % 7;
        const nextOpening = now
            .add({ days: daysUntilFriday })
            .with({ hour: 18, minute: 0, second: 0, millisecond: 0 }, { disambiguation: "compatible" });
        const nextOpeningDate = new Date(nextOpening.epochMilliseconds);
        const message = `${emotes_1.EmoteString.BlackMarket} ${Strings[this.User.Language].hey(nextOpeningDate)}`;
        return { isOpen: false, message };
    }
    static IsOpenAt(date = new Date()) {
        const gameTime = (0, gameTime_1.getGameTime)(date);
        return gameTime.dayOfWeek === 6 || gameTime.dayOfWeek === 7 || (gameTime.dayOfWeek === 5 && gameTime.hour >= 18);
    }
}
exports.BlackMarket = BlackMarket;
const Strings = {
    [Language_1.Language.English]: {
        title: "Black Market",
        description: "Look at these beauties!\nThe Black Market is open on Sundays, Saturdays and Fridays after 6pm (GMT-3)",
        hey: (date) => `Hey, psst...\nCome back here ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)} and I will have some cool stuff to show you...`,
    },
    [Language_1.Language.Portuguese]: {
        title: "Mercado Negro",
        description: "Olhe para essas belezinhas!\nO Mercado Negro é aberto aos domingos, sábados e sextas após as 18h (GMT-3)",
        hey: (date) => `Ei, psst...\nVolte aqui ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)} que eu terei umas coisinhas bem legais pra te mostrar...`,
    },
    [Language_1.Language.Spanish]: {
        title: "Mercado Negro",
        description: "¡Mira estas bellezas!\nEl mercado negro abre los domingos, sábados y viernes después de las 18h (GMT-3)",
        hey: (date) => `Oye, psst...\nVuelve aquí ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)} y tendré algunas cosas geniales para mostrarte...`,
    },
};
//# sourceMappingURL=BlackMarket.js.map