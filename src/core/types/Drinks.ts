export const BarBeverages = [
	"whisky", "vodka", "vinho", "gin", "tônica", "amarula", "caipirinha", "cerveja", "sakê",
	"cachaça", "água da torneira", "rum", "caipiroska", "sidra", "cerveja", "catuaba", "corote",
	"champanha", "licor", "água sanitária", "cerveja", "tequila", "tubaína", "água do miojo",
	"absinto", "Jägermeister", "cerveja", "gasolina", "cerveja artesanal", "Red Ale",
	"American Pale Ale", "Belgian Wheat Ale", "cerveja",
];

export const DrinkSensations = [
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

export function isHappyHour(date = new Date()) {
	const brasiliaTime = new Date(date.getTime() - 3 * 60 * 60 * 1_000);
	const hour = brasiliaTime.getUTCHours();
	const day = brasiliaTime.getUTCDay();
	return (hour >= 18 && hour <= 20) || day === 0 || day === 6;
}

export type DrinkCountMessageLanguage = "English" | "Portuguese" | "Spanish";

const drinkCountThresholds = [5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 100];
const drinkCountMessages: Record<DrinkCountMessageLanguage, readonly string[]> = {
	Portuguese: [
		"Desce redondo, hein?",
		"Vai com calma, {adjective}.",
		"Acho que já deu por hoje.",
		"Depois de hoje, duvido não ter cirrose.",
		"Você é um deus ou algo do tipo?",
		"Você é o diabo, isso sim.",
		"Estou declarando falência!",
		"Minha mulher falou que vai me abandonar...",
		"Por favor, pare.",
		"Meu estoque acabou, eu nem sei mais o que você está bebendo.",
		"POR ACASO VOCÊ É O JACOBI???!",
	],
	English: [
		"Goes down smooth, huh?",
		"Take it easy, {adjective}.",
		"I think that's enough for today.",
		"After today, I doubt you won't have cirrhosis.",
		"Are you a god or something?",
		"You're the devil, that's what you are.",
		"I'm declaring bankruptcy!",
		"My wife said she's going to leave me...",
		"Please, stop.",
		"My stock is gone, I don't even know what you're drinking anymore.",
		"ARE YOU JACOBI BY ANY CHANCE???!",
	],
	Spanish: [
		"¿Baja suave, eh?",
		"Con calma, {adjective}.",
		"Creo que ya es suficiente por hoy.",
		"Después de hoy, dudo que no tengas cirrosis.",
		"¿Eres un dios o algo así?",
		"Eres el diablo, eso sí.",
		"¡Estoy declarando la bancarrota!",
		"Mi mujer dijo que me va a abandonar...",
		"Por favor, para.",
		"Mi stock se acabó, ya ni sé lo que estás bebiendo.",
		"¿ACASO ERES JACOBI???!",
	],
};

export function getDrinkCountMessages(count: number, adjective: string, language: DrinkCountMessageLanguage) {
	return drinkCountMessages[language].flatMap((message, index) =>
		count > drinkCountThresholds[index]! ? message.replace("{adjective}", adjective) : [],
	);
}
