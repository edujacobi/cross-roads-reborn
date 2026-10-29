"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrinkSensations = exports.BarBeverages = void 0;
exports.isHappyHour = isHappyHour;
exports.getDrinkCountMessages = getDrinkCountMessages;
exports.BarBeverages = [
    "whisky", "vodka", "vinho", "gin", "tônica", "amarula", "caipirinha", "cerveja", "sakê",
    "cachaça", "água da torneira", "rum", "caipiroska", "sidra", "cerveja", "catuaba", "corote",
    "champanha", "licor", "água sanitária", "cerveja", "tequila", "tubaína", "água do miojo",
    "absinto", "Jägermeister", "cerveja", "gasolina", "cerveja artesanal", "Red Ale",
    "American Pale Ale", "Belgian Wheat Ale", "cerveja",
];
exports.DrinkSensations = [
    "forte", "vigoroso", "potente", "poderoso", "ativo", "dinâmico", "robusto", "másculo",
    "viril", "masculino", "firme", "decidido", "resoluto", "enfático", "veemente", "expressivo",
    "drástico", "radical", "vivo", "vivaz", "incansável", "incisivo", "caloroso", "agradável",
    "jovial", "álacre", "animado", "animoso", "aprazerado", "bem-disposto", "bem-humorado",
    "contente", "divertido", "exultante", "feliz", "festejador", "festivo", "folgazão", "foliador",
    "fortunoso", "galhardo", "jubiloso", "jucundo", "ledo", "lépido", "prazenteiro", "radiante",
    "risonho", "satisfeito", "sorridente", "abatido", "apático", "indiferente", "desinteressado",
    "desempolgado", "parado", "caído", "cabisbaixo", "prostrado", "desencorajado", "desestimulado",
    "desalentado", "desapontado", "desiludido", "deprimido", "triste", "esmorecido", "entorpecido",
    "sucumbido", "desacoroçoado", "descorçoado", "derrotado", "feminino",
];
function isHappyHour(date = new Date()) {
    const brasiliaTime = new Date(date.getTime() - 3 * 60 * 60 * 1_000);
    const hour = brasiliaTime.getUTCHours();
    const day = brasiliaTime.getUTCDay();
    return (hour >= 18 && hour <= 20) || day === 0 || day === 6;
}
function getDrinkCountMessages(count, adjective, language) {
    const messages = [];
    if (language === "Portuguese") {
        if (count > 5)
            messages.push("Desce redondo, hein?");
        if (count > 10)
            messages.push(`Vai com calma, ${adjective}.`);
        if (count > 15)
            messages.push("Acho que já deu por hoje.");
        if (count > 20)
            messages.push("Depois de hoje, duvido não ter cirrose.");
        if (count > 30)
            messages.push("Você é um deus ou algo do tipo?");
        if (count > 40)
            messages.push("Você é o diabo, isso sim.");
        if (count > 50)
            messages.push("Estou declarando falência!");
        if (count > 60)
            messages.push("Minha mulher falou que vai me abandonar...");
        if (count > 70)
            messages.push("Por favor, pare.");
        if (count > 80)
            messages.push("Meu estoque acabou, eu nem sei mais o que você está bebendo.");
        if (count > 100)
            messages.push("POR ACASO VOCÊ É O JACOBI???!");
    }
    else if (language === "English") {
        if (count > 5)
            messages.push("Goes down smooth, huh?");
        if (count > 10)
            messages.push(`Take it easy, ${adjective}.`);
        if (count > 15)
            messages.push("I think that's enough for today.");
        if (count > 20)
            messages.push("After today, I doubt you won't have cirrhosis.");
        if (count > 30)
            messages.push("Are you a god or something?");
        if (count > 40)
            messages.push("You're the devil, that's what you are.");
        if (count > 50)
            messages.push("I'm declaring bankruptcy!");
        if (count > 60)
            messages.push("My wife said she's going to leave me...");
        if (count > 70)
            messages.push("Please, stop.");
        if (count > 80)
            messages.push("My stock is gone, I don't even know what you're drinking anymore.");
        if (count > 100)
            messages.push("ARE YOU JACOBI BY ANY CHANCE???!");
    }
    else if (language === "Spanish") {
        if (count > 5)
            messages.push("¿Baja suave, eh?");
        if (count > 10)
            messages.push(`Con calma, ${adjective}.`);
        if (count > 15)
            messages.push("Creo que ya es suficiente por hoy.");
        if (count > 20)
            messages.push("Después de hoy, dudo que no tengas cirrosis.");
        if (count > 30)
            messages.push("¿Eres un dios o algo así?");
        if (count > 40)
            messages.push("Eres el diablo, eso sí.");
        if (count > 50)
            messages.push("¡Estoy declarando la bancarrota!");
        if (count > 60)
            messages.push("Mi mujer dijo que me va a abandonar...");
        if (count > 70)
            messages.push("Por favor, para.");
        if (count > 80)
            messages.push("Mi stock se acabó, ya ni sé lo que estás bebiendo.");
        if (count > 100)
            messages.push("¿ACASO ERES JACOBI???!");
    }
    return messages;
}
//# sourceMappingURL=Drinks.js.map