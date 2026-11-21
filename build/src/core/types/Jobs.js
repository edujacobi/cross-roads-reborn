"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobList = exports.JobId = void 0;
exports.getJobList = getJobList;
const Ids_1 = require("./Ids");
const Language_1 = require("#core/models/Language");
var JobId;
(function (JobId) {
    JobId[JobId["UberDriver"] = 0] = "UberDriver";
    JobId[JobId["Butcher"] = 1] = "Butcher";
    JobId[JobId["Security"] = 2] = "Security";
    JobId[JobId["Gangster"] = 3] = "Gangster";
    JobId[JobId["Hunter"] = 4] = "Hunter";
    JobId[JobId["Funeral"] = 5] = "Funeral";
    JobId[JobId["Militia"] = 6] = "Militia";
    JobId[JobId["Terrorist"] = 7] = "Terrorist";
    JobId[JobId["CounterTerrorist"] = 8] = "CounterTerrorist";
    JobId[JobId["Spy"] = 9] = "Spy";
    JobId[JobId["Yakuza"] = 10] = "Yakuza";
    JobId[JobId["Demolitionist"] = 11] = "Demolitionist";
    JobId[JobId["Bodyguard"] = 12] = "Bodyguard";
    JobId[JobId["BlackMarket"] = 13] = "BlackMarket";
    JobId[JobId["Double"] = 14] = "Double";
    JobId[JobId["Extraditor"] = 15] = "Extraditor";
    JobId[JobId["Godfather"] = 16] = "Godfather";
    JobId[JobId["Conqueror"] = 17] = "Conqueror";
})(JobId || (exports.JobId = JobId = {}));
exports.JobList = {
    [JobId.UberDriver]: {
        Id: JobId.UberDriver,
        Description: {
            [Language_1.Language.English]: "Uber driver",
            [Language_1.Language.Portuguese]: "Motorista de Uber",
            [Language_1.Language.Spanish]: "Conductor de Uber",
        },
        Duration: 0.5,
        Salary: 175,
        NeedItem: null,
        Special: false,
    },
    [JobId.Butcher]: {
        Id: JobId.Butcher,
        Description: {
            [Language_1.Language.English]: "Butcher",
            [Language_1.Language.Portuguese]: "Açougueiro",
            [Language_1.Language.Spanish]: "Carnicero",
        },
        Duration: 1,
        Salary: 550,
        NeedItem: [Ids_1.ItemId.Knife],
        Special: false,
    },
    [JobId.Security]: {
        Id: JobId.Security,
        Description: {
            [Language_1.Language.English]: "Nightclub Security Guard",
            [Language_1.Language.Portuguese]: "Segurança de boate",
            [Language_1.Language.Spanish]: "Guardia de Seguridad de Club Nocturno",
        },
        Duration: 1.5,
        Salary: 1.5 * 750,
        NeedItem: [Ids_1.ItemId.Pistol],
        Special: false,
    },
    [JobId.Gangster]: {
        Id: JobId.Gangster,
        Description: {
            [Language_1.Language.English]: "Gangster",
            [Language_1.Language.Portuguese]: "Gângster",
            [Language_1.Language.Spanish]: "Gánster",
        },
        Duration: 2,
        Salary: 2 * 1_100,
        NeedItem: [Ids_1.ItemId.MachinePistol],
        Special: false,
    },
    [JobId.Hunter]: {
        Id: JobId.Hunter,
        Description: {
            [Language_1.Language.English]: "Cuckold Hunter",
            [Language_1.Language.Portuguese]: "Caçador de Corno",
            [Language_1.Language.Spanish]: "Cazador de Cuerno",
        },
        Duration: 2.5,
        Salary: 2.5 * 1_700,
        NeedItem: [Ids_1.ItemId.HuntRifle],
        Special: false,
    },
    [JobId.Funeral]: {
        Id: JobId.Funeral,
        Description: {
            [Language_1.Language.English]: "Funeral wrecker",
            [Language_1.Language.Portuguese]: "Estraga funeral",
            [Language_1.Language.Spanish]: "Arruina Funeral",
        },
        Duration: 3,
        Salary: 3 * 2_000,
        NeedItem: [Ids_1.ItemId.Shotgun],
        Special: false,
    },
    [JobId.Militia]: {
        Id: JobId.Militia,
        Description: {
            [Language_1.Language.English]: "Militia Member",
            [Language_1.Language.Portuguese]: "Miliciano",
            [Language_1.Language.Spanish]: "Miliciano",
        },
        Duration: 3.5,
        Salary: 3.5 * 2_400,
        NeedItem: [Ids_1.ItemId.SMG],
        Special: false,
    },
    [JobId.Terrorist]: {
        Id: JobId.Terrorist,
        Description: {
            [Language_1.Language.English]: "Terrorist",
            [Language_1.Language.Portuguese]: "Terrorista",
            [Language_1.Language.Spanish]: "Terrorista",
        },
        Duration: 4,
        Salary: 4 * 2900,
        NeedItem: [Ids_1.ItemId.AssaultRifle],
        Special: false,
    },
    [JobId.CounterTerrorist]: {
        Id: JobId.CounterTerrorist,
        Description: {
            [Language_1.Language.English]: "Counter-terrorist",
            [Language_1.Language.Portuguese]: "Contra-terrorista",
            [Language_1.Language.Spanish]: "Contra-terrorista",
        },
        Duration: 4.5,
        Salary: 4.5 * 3_700,
        NeedItem: [Ids_1.ItemId.Carbine],
        Special: false,
    },
    [JobId.Spy]: {
        Id: JobId.Spy,
        Description: {
            [Language_1.Language.English]: "CIA's spy",
            [Language_1.Language.Portuguese]: "Espião da ABIN",
            [Language_1.Language.Spanish]: "Espía de la CNI",
        },
        Duration: 5,
        Salary: 5 * 7_100,
        NeedItem: [Ids_1.ItemId.Sniper],
        Special: false,
    },
    [JobId.Yakuza]: {
        Id: JobId.Yakuza,
        Description: {
            [Language_1.Language.English]: "Yakuza swordsman",
            [Language_1.Language.Portuguese]: "Espadachim da Yakuza",
            [Language_1.Language.Spanish]: "Espadachín de la Yakuza",
        },
        Duration: 5.5,
        Salary: 5.5 * 12_500,
        NeedItem: [Ids_1.ItemId.Katana],
        Special: false,
    },
    [JobId.Demolitionist]: {
        Id: JobId.Demolitionist,
        Description: {
            [Language_1.Language.English]: "Demolitionist",
            [Language_1.Language.Portuguese]: "Demolicionista",
            [Language_1.Language.Spanish]: "Demolicionista",
        },
        Duration: 6,
        Salary: 6 * 35_000,
        NeedItem: [Ids_1.ItemId.RPG],
        Special: false,
    },
    [JobId.Bodyguard]: {
        Id: JobId.Bodyguard,
        Description: {
            [Language_1.Language.English]: "Jacobi's Security Guard",
            [Language_1.Language.Portuguese]: "Segurança do Jacobi",
            [Language_1.Language.Spanish]: "Guardia de Seguridad de Jacobi",
        },
        Duration: 6.5,
        Salary: 6.5 * 100_000,
        NeedItem: [Ids_1.ItemId.Knife, Ids_1.ItemId.Pistol, Ids_1.ItemId.MachinePistol, Ids_1.ItemId.HuntRifle, Ids_1.ItemId.Shotgun, Ids_1.ItemId.SMG, Ids_1.ItemId.AssaultRifle, Ids_1.ItemId.Carbine, Ids_1.ItemId.Sniper, Ids_1.ItemId.Katana, Ids_1.ItemId.RPG, Ids_1.ItemId.LightVest],
        Special: false,
    },
    [JobId.BlackMarket]: {
        Id: JobId.BlackMarket,
        Description: {
            [Language_1.Language.English]: "Black Market Informant",
            [Language_1.Language.Portuguese]: "Informante do Mercado Negro",
            [Language_1.Language.Spanish]: "Informante del Mercado Negro",
        },
        Duration: 3,
        Salary: 3 * 450_000,
        NeedItem: [Ids_1.ItemId.Minigun],
        Special: false,
    },
    [JobId.Double]: {
        Id: JobId.Double,
        Description: {
            [Language_1.Language.English]: "Power Ranger Stunt Double",
            [Language_1.Language.Portuguese]: "Dublê de Power Ranger",
            [Language_1.Language.Spanish]: "Doble de Riesgo de Power Ranger",
        },
        Duration: 4,
        Salary: 4 * 300_000,
        NeedItem: [Ids_1.ItemId.RPG, Ids_1.ItemId.Jetpack, Ids_1.ItemId.Goggles],
        Special: true,
    },
    [JobId.Extraditor]: {
        Id: JobId.Extraditor,
        Description: {
            [Language_1.Language.English]: "Extraterrestrial Extraditor",
            [Language_1.Language.Portuguese]: "Extraditor de Extraterrestre",
            [Language_1.Language.Spanish]: "Extraditor de Extraterrestre",
        },
        Duration: 7,
        Salary: 1_000_000,
        NeedItem: [Ids_1.ItemId.Katana, Ids_1.ItemId.RPG, Ids_1.ItemId.LightVest, Ids_1.ItemId.HeavyVest, Ids_1.ItemId.Goggles],
        Special: false,
    },
    [JobId.Godfather]: {
        Id: JobId.Godfather,
        Description: {
            [Language_1.Language.English]: "Godfather of the Jacobin Mafia",
            [Language_1.Language.Portuguese]: "Godfather da Máfia Jacobina",
            [Language_1.Language.Spanish]: "El padrino de la Mafia Jacobina",
        },
        Duration: 24,
        Salary: 12_000_000,
        NeedItem: [Ids_1.ItemId.Minigun],
        Special: true,
    },
    [JobId.Conqueror]: {
        Id: JobId.Conqueror,
        Description: {
            [Language_1.Language.English]: "Galactic Conqueror",
            [Language_1.Language.Portuguese]: "Conquistador Galático",
            [Language_1.Language.Spanish]: "Conquistador Galáctico",
        },
        Duration: 72,
        Salary: 50_000_000,
        NeedItem: [Ids_1.ItemId.Bazooka, Ids_1.ItemId.Minigun, Ids_1.ItemId.Exoskeleton, Ids_1.ItemId.Jetpack],
        Special: true,
    },
};
function getJobList() {
    return Object.values(exports.JobList);
}
//# sourceMappingURL=Jobs.js.map