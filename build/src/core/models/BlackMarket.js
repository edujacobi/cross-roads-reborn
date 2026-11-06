"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackMarket = void 0;
const colors_1 = require("#bot/utils/colors");
const emotes_1 = require("#bot/utils/emotes");
const Items_1 = require("#core/types/Items");
const date_fns_1 = require("date-fns");
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
        const OPENNING_HOUR = 21;
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        let isOpen = false;
        const isUserJacobi = this.User.Id === process.env.JACOBI_ID;
        const SUNDAY = 0;
        const FRIDAY = 5;
        const SATURDAY = 6;
        if (day === SUNDAY ||
            day === SATURDAY ||
            (day === FRIDAY && hours >= OPENNING_HOUR) ||
            isUserJacobi) {
            isOpen = true;
            return { isOpen, message: "" };
        }
        let nextOpeningDate;
        if (day === FRIDAY && hours < OPENNING_HOUR) {
            nextOpeningDate = (0, date_fns_1.set)(now, { hours: OPENNING_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
        }
        else {
            nextOpeningDate = (0, date_fns_1.nextFriday)(now);
            nextOpeningDate = (0, date_fns_1.set)(nextOpeningDate, { hours: OPENNING_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
        }
        const message = `${emotes_1.EmoteString.BlackMarket} ${Strings[this.User.Language].hey(nextOpeningDate)}`;
        return { isOpen, message };
    }
}
exports.BlackMarket = BlackMarket;
const Strings = {
    [Language_1.Language.English]: {
        title: "Black Market",
        description: "Look at these beauties!\nThe Black Market is open on Sundays, Saturdays and Fridays after 9pm",
        hey: (date) => `Hey, psst...\nCome back here ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)} and I will have some cool stuff to show you...`,
    },
    [Language_1.Language.Portuguese]: {
        title: "Mercado Negro",
        description: "Olhe para essas belezinhas!\nO Mercado Negro é aberto aos domingos, sábados e sextas após as 18h",
        hey: (date) => `Ei, psst...\nVolte aqui ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)} que eu terei umas coisinhas bem legais pra te mostrar...`,
    },
    [Language_1.Language.Spanish]: {
        title: "Mercado Negro",
        description: "¡Mira estas bellezas!\nEl mercado negro es abierto los domingos, sábados y viernes después de las 21h (GMT0)",
        hey: (date) => `Oye, psst...\nVuelve aquí ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)} y tendré algunas cosas geniales para mostrarte...`,
    },
};
//# sourceMappingURL=BlackMarket.js.map