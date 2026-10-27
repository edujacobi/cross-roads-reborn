"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shop = void 0;
const Items_1 = require("#core/types/Items");
const UserRepository_1 = require("#core/repositories/UserRepository");
const date_fns_1 = require("date-fns");
const addHours_1 = require("date-fns/addHours");
const Language_1 = require("./Language");
const Scavenge_1 = require("#core/types/Scavenge");
const emotes_1 = require("#bot/utils/emotes");
const Classes_1 = require("#core/types/Classes");
const Locations_1 = require("#core/types/Locations");
const Ids_1 = require("#core/types/Ids");
const discord_js_1 = require("discord.js");
const Jobs_1 = require("#core/types/Jobs");
class Shop {
    User;
    ItemList;
    Title;
    Description;
    Image;
    Color;
    Strings;
    constructor(user) {
        this.User = user;
        this.ItemList = (0, Items_1.getItemList)().filter((item) => item.Shop);
        this.Strings = Strings[user.Language];
        this.Title = this.Strings.title;
        this.Description = this.Strings.description;
        this.Image = "https://media.discordapp.net/attachments/531174573463306240/854876910885797909/Loja.png";
        this.Color = discord_js_1.Colors.Green;
    }
    async CanUserBuyItem(item) {
        const s = Strings[this.User.Language];
        let canBuy = true;
        let message = "";
        if (this.User.Money < item.Price) {
            message = s.noMoney;
            canBuy = false;
        }
        const existingItem = this.User.Items.find((i) => i.Id === item.Id);
        if (item.Type === Items_1.ItemType.Consumable) {
            if (existingItem && existingItem.Quantity >= 20) {
                message = s.consumableLimit(existingItem.Quantity, `${item.Skin[Ids_1.BundleId.Default].String} ${item.Description[this.User.Language]}`);
                canBuy = false;
            }
        }
        else if (existingItem && (0, date_fns_1.differenceInHours)((0, addHours_1.addHours)(existingItem.RemainingTime, 72), new Date()) > 360) {
            message = s.itemPassLimit((0, date_fns_1.differenceInHours)(existingItem.RemainingTime, new Date()), `${item.Skin[Ids_1.BundleId.Default].String} ${item.Description[this.User.Language]}`);
            canBuy = false;
        }
        if (this.User.IsWorking()) {
            message = s.working(this.User.Job.EndsIn, this.User.Job.Id);
            canBuy = false;
        }
        if (this.User.IsScavenging()) {
            message = s.scavenging(this.User.Scavenge.IsScavengingId);
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
            const user = await UserRepository_1.UserRepository.FindById(this.User.BeatUp.IsBeatingId, ["class", "nickname"]);
            message = Language_1.globalStrings[this.User.Language].attackerIsBeatingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
            canBuy = false;
        }
        if (this.User.BeatUp.IsBeingBeatUpById) {
            const user = await UserRepository_1.UserRepository.FindById(this.User.BeatUp.IsBeingBeatUpById, ["class", "nickname"]);
            message = Language_1.globalStrings[this.User.Language].attackerIsBeingBeatedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
            canBuy = false;
        }
        if (this.User.Robbery.IsRobbingId) {
            const user = await UserRepository_1.UserRepository.FindById(this.User.Robbery.IsRobbingId, ["nickname", "class"]);
            message = Language_1.globalStrings[this.User.Language].attackerIsRobbingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
            canBuy = false;
        }
        if (this.User.Robbery.IsBeingRobbedById) {
            const user = await UserRepository_1.UserRepository.FindById(this.User.Robbery.IsBeingRobbedById, ["nickname", "class"]);
            message = Language_1.globalStrings[this.User.Language].attackerIsBeingRobbedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
            canBuy = false;
        }
        if (this.User.Robbery.IsRobbingLocationId !== null) {
            const location = Locations_1.LocationList[this.User.Robbery.IsRobbingLocationId];
            message = Language_1.globalStrings[this.User.Language].attackerIsRobbingId(location.Name[this.User.Language]);
            canBuy = false;
        }
        if (this.User.Robbery.InvestmentIsDefending) {
            message = Language_1.globalStrings[this.User.Language].attackerIsDefendingInvestment;
            canBuy = false;
        }
        if (this.User.Robbery.ParticipatingInGangAction) {
            message = Language_1.globalStrings[this.User.Language].attackerIsParticipatingInGangAction;
            canBuy = false;
        }
        return { canBuy, message };
    }
}
exports.Shop = Shop;
const Strings = {
    [Language_1.Language.English]: {
        title: "Shop",
        description: `Buying items increases your power, allowing you to rob and scavenge new locations and work jobs with better pay.
All items have a duration of 72 hours!
-# You can only buy items while you are ${emotes_1.EmoteString.Idle} Idling.`,
        cantBuy: "You can't buy anything right now",
        noMoney: "You don't have enough money to buy this item",
        scavenging: (placeId) => `You can't buy items while scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}** ${emotes_1.EmoteString.Scavenge}`,
        working: (jobTime, jobId) => `You can't buy items while working! ${emotes_1.EmoteString.Jobs}\n-# Your job of **${Jobs_1.JobList[jobId].Description[Language_1.Language.English]}** will end ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `You can't buy items while in prison! ${emotes_1.EmoteString.Prison}\n-# Will be released ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inHospital: (hospitalTime) => `You can't buy items while in the hospital! ${emotes_1.EmoteString.Hospital}\n-# Will be healed ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inCasino: `You can't buy items while in the casino! ${emotes_1.EmoteString.Casino}`,
        itemPassLimit: (hours, itemName) => `You can't have more than 360 hours of the same item!\n-# Has ${hours} hours of ${itemName}.`,
        consumableLimit: (quantity, itemName) => `You can't have more than 20 of the same consumable!\n-# Has ${quantity} of ${itemName}.`,
    },
    [Language_1.Language.Portuguese]: {
        title: "Loja",
        description: `Comprar itens aumenta seu poder, permitindo roubar e vasculhar novos locais e trabalhar em empregos com melhores salários.
Todos os itens tem duração de 72 horas!
-# Você só pode comprar itens enquanto estiver ${emotes_1.EmoteString.Idle} Vadiando.`,
        cantBuy: "Você não pode comprar algo agora",
        noMoney: "Você não tem dinheiro suficiente para comprar este item",
        scavenging: (placeId) => `Você não pode comprar itens enquanto está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}** ${emotes_1.EmoteString.Scavenge}`,
        working: (jobTime, jobId) => `Você não pode comprar itens enquanto está trabalhando! ${emotes_1.EmoteString.Jobs}\n-# Terminará seu trabalho de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Portuguese]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `Você não pode comprar itens enquanto está preso! ${emotes_1.EmoteString.Prison}\n-# Será solto ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inHospital: (hospitalTime) => `Você não pode comprar itens enquanto está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inCasino: `Você não pode comprar itens enquanto está no cassino! ${emotes_1.EmoteString.Casino}`,
        itemPassLimit: (hours, itemName) => `Você não pode possuir mais de 360 horas de um mesmo item!\n-# Possui ${hours} horas de ${itemName}.`,
        consumableLimit: (quantity, itemName) => `Você não pode possuir mais de 20 de um mesmo consumível!\n-# Possui ${quantity} de ${itemName}.`,
    },
    [Language_1.Language.Spanish]: {
        title: "Comercio",
        description: `Comprar artículos aumenta tu poder, permitiendo robar y buscar nuevos lugares y trabajar en empleos con mejores salarios.
¡Todos los artículos tienen una duración de 72 horas!
-# Solo puedes comprar artículos mientras estés ${emotes_1.EmoteString.Idle} Vagando.`,
        cantBuy: "No puedes comprar nada ahora mismo",
        noMoney: "No tienes suficiente dinero para comprar este artículo",
        scavenging: (placeId) => `¡No puedes comprar artículos mientras estás buscando en ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}** ${emotes_1.EmoteString.Scavenge}`,
        working: (jobTime, jobId) => `¡No puedes comprar artículos mientras trabajas! ${emotes_1.EmoteString.Jobs}\n-# ¡Tu trabalho de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Spanish]}** terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `¡No puedes comprar artículos mientras estás en prisión! ${emotes_1.EmoteString.Prison}\n-# Serás liberado ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inHospital: (hospitalTime) => `¡No puedes comprar artículos mientras estás en el hospital! ${emotes_1.EmoteString.Hospital}\n-# Serás curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inCasino: `¡No puedes comprar artículos mientras estás en el casino! ${emotes_1.EmoteString.Casino}`,
        itemPassLimit: (hours, itemName) => `¡No puedes tener más de 360 horas del mismo artículo!\n-# Tiene ${hours} horas de ${itemName}.`,
        consumableLimit: (quantity, itemName) => `¡No puedes tener más de 20 del mismo consumible!\n-# Tiene ${quantity} de ${itemName}.`,
    },
};
//# sourceMappingURL=Shop.js.map