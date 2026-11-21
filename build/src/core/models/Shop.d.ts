import type { User } from "./User";
import { type Items } from "#core/types/Items";
import { Language } from "./Language";
import { type ScavengeId } from "#core/types/Scavenge";
export declare class Shop {
    User: User;
    ItemList: Items[];
    Title: string;
    Description: string;
    Image: string;
    Color: number;
    Strings: typeof Strings[Language.English | Language.Portuguese | Language.Spanish];
    constructor(user: User);
    CanUserBuyItem(item: Items): Promise<{
        canBuy: boolean;
        message: string;
    }>;
}
declare const Strings: {
    readonly 0: {
        readonly title: "Shop";
        readonly description: `Buying items increases your power, allowing you to rob and scavenge new locations and work jobs with better pay.
All items have a duration of 72 hours!
-# You can only buy items while you are ${string} Idling.`;
        readonly cantBuy: "You can't buy anything right now";
        readonly noMoney: "You don't have enough money to buy this item";
        readonly scavenging: (placeId: ScavengeId) => string;
        readonly working: (jobTime: Date, jobId: number) => string;
        readonly inPrison: (prisonTime: Date) => string;
        readonly inHospital: (hospitalTime: Date) => string;
        readonly inCasino: `You can't buy items while in the casino! ${string}`;
        readonly itemPassLimit: (hours: number, itemName: string) => string;
        readonly consumableLimit: (quantity: number, itemName: string) => string;
    };
    readonly 1: {
        readonly title: "Loja";
        readonly description: `Comprar itens aumenta seu poder, permitindo roubar e vasculhar novos locais e trabalhar em empregos com melhores salários.
Todos os itens tem duração de 72 horas!
-# Você só pode comprar itens enquanto estiver ${string} Vadiando.`;
        readonly cantBuy: "Você não pode comprar algo agora";
        readonly noMoney: "Você não tem dinheiro suficiente para comprar este item";
        readonly scavenging: (placeId: ScavengeId) => string;
        readonly working: (jobTime: Date, jobId: number) => string;
        readonly inPrison: (prisonTime: Date) => string;
        readonly inHospital: (hospitalTime: Date) => string;
        readonly inCasino: `Você não pode comprar itens enquanto está no cassino! ${string}`;
        readonly itemPassLimit: (hours: number, itemName: string) => string;
        readonly consumableLimit: (quantity: number, itemName: string) => string;
    };
    readonly 2: {
        readonly title: "Comercio";
        readonly description: `Comprar artículos aumenta tu poder, permitiendo robar y buscar nuevos lugares y trabajar en empleos con mejores salarios.
¡Todos los artículos tienen una duración de 72 horas!
-# Solo puedes comprar artículos mientras estés ${string} Vagando.`;
        readonly cantBuy: "No puedes comprar nada ahora mismo";
        readonly noMoney: "No tienes suficiente dinero para comprar este artículo";
        readonly scavenging: (placeId: ScavengeId) => string;
        readonly working: (jobTime: Date, jobId: number) => string;
        readonly inPrison: (prisonTime: Date) => string;
        readonly inHospital: (hospitalTime: Date) => string;
        readonly inCasino: `¡No puedes comprar artículos mientras estás en el casino! ${string}`;
        readonly itemPassLimit: (hours: number, itemName: string) => string;
        readonly consumableLimit: (quantity: number, itemName: string) => string;
    };
};
export {};
