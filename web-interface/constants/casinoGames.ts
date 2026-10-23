export const casinoGames = {
	lottery: {
		title: "Bilhete premiado",
		summary: "Compre um bilhete e teste sua sorte no sorteio diário.",
		image: {
			src: "/images/casino/lottery/Ticket.png",
			alt: "Bilhete da loteria",
		},
		images: [
			{ src: "/images/casino/lottery/Ticket.png", alt: "Bilhete da loteria" },
			{ src: "/images/casino/lottery/MegaTicket.png", alt: "Bilhete da Mega da Virada" },
		],
		sections: [
			{
				title: "Como funciona",
				description:
					"Os sorteios acontecem todos os dias às 18h. O prêmio acumulado cresce conforme mais jogadores compram bilhetes.",
			},
			{
				title: "Desconto VIP",
				description: "Jogadores VIP recebem 25% de desconto no preço do bilhete.",
			},
		],
	},
	bet: {
		title: "Cara ou coroa",
		summary: "Escolha um lado da moeda e aposte no resultado.",
		image: {
			src: "/images/casino/bet/Heads.png",
			alt: "Lado cara da moeda",
		},
		images: [
			{ src: "/images/casino/bet/Heads.png", alt: "Lado cara da moeda" },
			{ src: "/images/casino/bet/Tails.png", alt: "Lado coroa da moeda" },
		],
		sections: [
			{
				title: "Como funciona",
				description:
					"Escolha cara ou coroa e defina o valor da aposta. Você tem 50% de chance de acertar; se vencer, recebe 1,5x o valor apostado.",
			},
			{
				title: "Apostas",
				description:
					"A aposta mínima é de $500. Depois de cada rodada, você pode repetir ou dobrar a aposta, ou apostar todo o seu saldo.",
			},
		],
	},
	horserace: {
		title: "Corrida de cavalos",
		summary: "Escolha seu cavalo favorito e concorra a prêmios com odds fixas.",
		image: {
			src: "/images/casino/horse-race/HorseRacing.png",
			alt: "Cavalos prontos para a corrida",
		},
		images: [{ src: "/images/casino/horse-race/HorseRacing.png", alt: "Cavalos prontos para a corrida" }],
		sections: [
			{
				title: "Como funciona",
				description:
					"As corridas acontecem a cada 4 horas. Escolha um cavalo antes do fechamento das apostas; os vencedores recebem prêmios calculados pelo multiplicador fixo do cavalo.",
			},
			{
				title: "Cavalos e multiplicadores",
				description:
					"Cavalos mais raros oferecem multiplicadores maiores, mas têm menos chance de vencer. Você recebe uma mensagem direta com o resultado da corrida.",
			},
		],
	},
	russianroulette: {
		title: "Roleta Russa",
		summary: "Um jogo em grupo em que só um participante leva o prêmio.",
		image: {
			src: "/images/casino/russian-roulette/RussianRoulette.png",
			alt: "Roleta Russa",
		},
		images: [{ src: "/images/casino/russian-roulette/RussianRoulette.png", alt: "Roleta Russa" }],
		sections: [
			{
				title: "Como funciona",
				description:
					"Até cinco jogadores disputam uma aposta. O jogo segue em rodadas: um participante vence e os demais são hospitalizados.",
			},
			{
				title: "Salas",
				description:
					"Crie uma sala ou entre em uma aberta. A partida começa automaticamente quando cinco jogadores participarem.",
			},
		],
	},
} as const;

export type CasinoGameSlug = keyof typeof casinoGames;

export function isCasinoGameSlug(value: unknown): value is CasinoGameSlug {
	return typeof value === "string" && Object.hasOwn(casinoGames, value);
}
