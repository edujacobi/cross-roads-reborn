import { BattleRooster } from "./BattleRooster";
import { EmoteString, getRarityColor, showTime } from "../utils/ui";
import { ButtonInteraction, ColorResolvable, Colors } from "discord.js";
import { setTimeout as wait } from "node:timers/promises";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { BattleHistory } from "./BattleHistory";
import { Event, EventType } from "./Event";
import { replyInteraction } from "../utils/logic";
import { BattleArena, getBattleArena } from "./BattleArena";
import { Language } from "./Language";
import { RoosterImage } from "./RoosterImage";

export enum BattleType {
	Fight,
	Spare,
	Ranked,
	Championship,
	Wild
}

export class Battle {
	Challenger: BattleRooster;
	Opponent: BattleRooster;
	Winner: BattleRooster | null = null;
	Loser: BattleRooster | null = null;
	NextToAttack: BattleRooster;
	NextToDefend: BattleRooster;
	Round = 0;
	Interaction: ButtonInteraction;
	History = "";
	Log: string[] = [];
	SequenceAttacks = 1;
	Embeds: CustomEmbedBuilder[] = [];
	EmbedColor: ColorResolvable = Colors.NotQuiteBlack;
	Type: BattleType;
	Arena: BattleArena;
	Language: Language;

	constructor(challenger: BattleRooster, opponnent: BattleRooster, interaction: ButtonInteraction, type: BattleType, arena: BattleArena, language: Language) {
		this.Challenger = challenger;
		this.Opponent = opponnent;
		this.Interaction = interaction;
		this.Type = type;
		this.Arena = arena;
		this.Language = language;

		if (this.Type == BattleType.Spare) {
			this.EmbedColor = Colors.DarkOrange;
		}
		else if (this.Type == BattleType.Ranked) {
			this.EmbedColor = Colors.Gold;
		}
		else if (this.Type == BattleType.Championship) {
			this.EmbedColor = Colors.Yellow;
		}
		else if (this.Type == BattleType.Wild) {
			this.EmbedColor = Colors.DarkGreen;
		}

		// Will be changed in CalculateNextAttacker function
		this.NextToAttack = this.Challenger;
		this.NextToDefend = this.Opponent;

		if (!this.Challenger) {
			console.warn("Error getting Challenger");
		}
		if (!this.Opponent) {
			console.warn("Error getting Opponent");
		}

		// this.FactorSpeed = this.Challenger.Stats.Speed + this.Opponent.Stats.Speed;

		this.Challenger.StartBattle(this.Opponent, this.Type).then(r => r);
		this.Opponent.StartBattle(this.Challenger, this.Type).then(r => r);
	}

	async CalcBlessings() {
		const challengerAllStats = this.Challenger.Stats.Attack + this.Challenger.Stats.Defense + this.Challenger.Stats.Speed + this.Challenger.Stats.Critical;
		const opponentAllStats = this.Opponent.Stats.Attack + this.Opponent.Stats.Defense + this.Opponent.Stats.Speed + this.Opponent.Stats.Critical;

		const difference = challengerAllStats - opponentAllStats;

		// CARAMURU - DEF
		const howManyDEFBlessingsToChallenger = difference < 0 ? Math.floor(Math.abs(difference) / 3) : 0;
		const howManyDEFBlessingsToOpponent = difference > 0 ? Math.floor(Math.abs(difference) / 3) : 0;

		// COROAMURU - ATK
		const howManyATKBlessingsToChallenger = difference < 0 ? Math.floor(Math.abs(difference) / 4) : 0;
		const howManyATKBlessingsToOpponent = difference > 0 ? Math.floor(Math.abs(difference) / 4) : 0;

		// ORPHEUS - HP
		const howManyHPBlessingsToChallenger = difference < 0 ? Math.floor(Math.abs(difference) / 6) : 0;
		const howManyHPBlessingsToOpponent = difference > 0 ? Math.floor(Math.abs(difference) / 6) : 0;

		// SIGMANO - SPD
		const howManySPDBlessingsToChallenger = difference < 0 ? Math.floor(Math.abs(difference) / 8) : 0;
		const howManySPDBlessingsToOpponent = difference > 0 ? Math.floor(Math.abs(difference) / 8) : 0;

		let text = "";
		if (howManyDEFBlessingsToChallenger > 0) {
			this.Challenger.Stats.Defense += howManyDEFBlessingsToChallenger;
			this.NextToAttack = this.Challenger;
			if (this.Language == Language.English) {
				text += `**${this.Challenger.GetNameWithImage()}** was blessed by ${EmoteString.Caramuru} **Caramuru**, receiving ${EmoteString.Defense}${howManyDEFBlessingsToChallenger} DEF in this battle!`;
			}
			else {
				text += `**${this.Challenger.GetNameWithImage()}** foi abençoado por ${EmoteString.Caramuru} **Caramuru**, recebendo ${EmoteString.Defense}${howManyDEFBlessingsToChallenger} DEF nesta batalha!`;
			}
		}
		if (howManyDEFBlessingsToOpponent > 0) {
			this.Opponent.Stats.Defense += howManyDEFBlessingsToOpponent;
			this.NextToAttack = this.Opponent;
			if (this.Language == Language.English) {
				text += `**${this.Opponent.GetNameWithImage()}** was blessed by ${EmoteString.Caramuru} **Caramuru**, receiving ${EmoteString.Defense}${howManyDEFBlessingsToOpponent} DEF in this battle!`;
			}
			else {
				text += `**${this.Opponent.GetNameWithImage()}** foi abençoado por ${EmoteString.Caramuru} **Caramuru**, recebendo ${EmoteString.Defense}${howManyDEFBlessingsToOpponent} DEF nesta batalha!`;
			}
		}

		if (howManyATKBlessingsToChallenger > 0) {
			this.Challenger.Stats.Attack += howManyATKBlessingsToChallenger;
			this.NextToAttack = this.Challenger;
			if (this.Language == Language.English) {
				text += `\n**${this.Challenger.GetNameWithImage()}** was blessed by ${EmoteString.Coroamuru} **Coroamuru**, receiving ${EmoteString.Attack}${howManyATKBlessingsToChallenger} ATK in this battle!`;
			}
			else {
				text += `\n**${this.Challenger.GetNameWithImage()}** foi abençoado por ${EmoteString.Coroamuru} **Coroamuru**, recebendo ${EmoteString.Attack}${howManyATKBlessingsToChallenger} ATK nesta batalha!`;
			}
		}
		if (howManyATKBlessingsToOpponent > 0) {
			this.Opponent.Stats.Attack += howManyATKBlessingsToOpponent;
			this.NextToAttack = this.Opponent;
			if (this.Language == Language.English) {
				text += `\n**${this.Opponent.GetNameWithImage()}** was blessed by ${EmoteString.Coroamuru} **Coroamuru**, receiving ${EmoteString.Attack}${howManyATKBlessingsToOpponent} ATK in this battle!`;
			}
			else {
				text += `\n**${this.Opponent.GetNameWithImage()}** foi abençoado por ${EmoteString.Coroamuru} **Coroamuru**, recebendo ${EmoteString.Attack}${howManyATKBlessingsToOpponent} ATK nesta batalha!`;
			}
		}

		if (this.Type == BattleType.Spare) {
			const maxHP = Math.max(this.Challenger.StartHP, this.Opponent.StartHP);
			this.Challenger.StartHP = maxHP;
			this.Challenger.CurrentHP = maxHP;
			this.Opponent.StartHP = maxHP;
			this.Opponent.CurrentHP = maxHP;
			if (this.Language == Language.English) {
				text += `\n${RoosterImage.Orpheus.Exclusive.GetEmoteString()} **Orpheus** has blessed this spare, making both opponent have the same ${EmoteString.Stamina} HP !`;
			}
			else {
				text += `\n${RoosterImage.Orpheus.Exclusive.GetEmoteString()} **Orpheus** abençoou esta prática, fazendo ambos os oponentes possuirem o mesmo ${EmoteString.Stamina} HP!`;
			}
		}
		else {
			if (howManyHPBlessingsToChallenger > 0) {
				const bonusHP = howManyHPBlessingsToChallenger * 5;
				this.Challenger.CurrentHP += bonusHP;
				this.Challenger.StartHP = this.Challenger.CurrentHP;
				this.NextToAttack = this.Challenger;
				if (this.Language == Language.English) {
					text += `\n**${this.Challenger.GetNameWithImage()}** was blessed by ${RoosterImage.Orpheus.Exclusive.GetEmoteString()} **Orpheus**, receiving ${EmoteString.Stamina}${bonusHP} HP in this battle!`;
				}
				else {
					text += `\n**${this.Challenger.GetNameWithImage()}** foi abençoado por ${RoosterImage.Orpheus.Exclusive.GetEmoteString()} **Orpheus**, recebendo ${EmoteString.Stamina}${bonusHP} HP nesta batalha!`;
				}
			}
			if (howManyHPBlessingsToOpponent > 0) {
				const bonusHP = howManyHPBlessingsToOpponent * 5;
				this.Opponent.CurrentHP += bonusHP;
				this.Opponent.StartHP = this.Opponent.CurrentHP;
				this.NextToAttack = this.Opponent;
				if (this.Language == Language.English) {
					text += `\n**${this.Opponent.GetNameWithImage()}** was blessed by ${RoosterImage.Orpheus.Exclusive.GetEmoteString()} **Orpheus**, receiving ${EmoteString.Stamina}${bonusHP} HP in this battle!`;
				}
				else {
					text += `\n**${this.Opponent.GetNameWithImage()}** foi abençoado por ${RoosterImage.Orpheus.Exclusive.GetEmoteString()} **Orpheus**, recebendo ${EmoteString.Stamina}${bonusHP} HP nesta batalha!`;
				}
			}
		}

		if (howManySPDBlessingsToChallenger > 0) {
			this.Challenger.Stats.Speed += howManySPDBlessingsToChallenger;
			this.NextToAttack = this.Challenger;
			if (this.Language == Language.English) {
				text += `\n**${this.Challenger.GetNameWithImage()}** was blessed by ${RoosterImage.Jacobi.Exclusive.GetEmoteString()} **Sigmano**, receiving ${EmoteString.Speed}${howManySPDBlessingsToChallenger} SPD in this battle!`;
			}
			else {
				text += `\n**${this.Challenger.GetNameWithImage()}** foi abençoado por ${RoosterImage.Jacobi.Exclusive.GetEmoteString()} **Sigmano**, recebendo ${EmoteString.Speed}${howManySPDBlessingsToChallenger} SPD nesta batalha!`;
			}
		}
		if (howManySPDBlessingsToOpponent > 0) {
			this.Opponent.Stats.Speed += howManySPDBlessingsToOpponent;
			this.NextToAttack = this.Opponent;
			if (this.Language == Language.English) {
				text += `\n**${this.Opponent.GetNameWithImage()}** was blessed by ${RoosterImage.Jacobi.Exclusive.GetEmoteString()} **Sigmano**, receiving ${EmoteString.Speed}${howManySPDBlessingsToOpponent} SPD in this battle!`;
			}
			else {
				text += `\n**${this.Opponent.GetNameWithImage()}** foi abençoado por ${RoosterImage.Jacobi.Exclusive.GetEmoteString()} **Sigmano**, recebendo ${EmoteString.Speed}${howManySPDBlessingsToOpponent} SPD nesta batalha!`;
			}
		}

		if (text.length > 0) {
			await this.ShowToViewers(text);
			await wait(1000);
		}
	}

	CalcExp() {
		this.Challenger.CalcExp(this.Opponent.Level);
		this.Opponent.CalcExp(this.Challenger.Level);
	}

	async Start() {
		this.CalcExp();

		await this.CalcBlessings();

		await this.CalculateNextAttacker(true);

		await this.ShowToViewers(`\`0.\` **${this.NextToAttack.GetNameWithImage()}** ${this.Language == Language.English ? "is going first" : "vai ir primeiro"}!`);

		await wait(3000);

		while (this.Challenger.CurrentHP > 0 && this.Opponent.CurrentHP > 0) {
			await this.NextRound();
			if (this.Type == BattleType.Spare || this.Type == BattleType.Wild) {
				await wait(4000);
			}
			if (this.Type == BattleType.Fight) {
				await wait(5000);
			}
			if (this.Type == BattleType.Ranked || this.Type == BattleType.Championship) {
				await wait(6000);
			}
		}

		await this.End();

		return this.Winner;
	}

	async CalculateNextAttacker(firstRound = false) {
		let challengerAttacking: boolean;

		const percentage = 3;

		if (firstRound) {
			// Se a chance for igual, sorteia um (50% para cada)
			if (this.Challenger.Stats.Speed === this.Opponent.Stats.Speed) {
				challengerAttacking = Math.random() < 0.5;
			}
			else {
				challengerAttacking = this.Challenger.Stats.Speed > this.Opponent.Stats.Speed;
			}

			if (challengerAttacking) {
				this.NextToAttack = this.Challenger;
				this.NextToDefend = this.Opponent;

			}
			else {
				this.NextToAttack = this.Opponent;
				this.NextToDefend = this.Challenger;
			}

		}
		else {
			let doubleAttackChance = (this.NextToAttack.Stats.Speed * percentage) / this.SequenceAttacks;

			if (this.SequenceAttacks > 1) {
				doubleAttackChance = (this.NextToAttack.Stats.Speed * percentage) / (this.SequenceAttacks * 2);
			}

			if ((Math.random() * 100) < doubleAttackChance) {
				this.SequenceAttacks += 1;

			}
			else {
				const aux = this.NextToAttack;
				this.NextToAttack = this.NextToDefend;
				this.NextToDefend = aux;
				this.SequenceAttacks = 1;
			}
		}
	}

	async NextRound() {
		this.Round += 1;

		// Chance de mensagem yield
		if (Math.random() < 0.1) {
			await this.ShowToViewers(`\`${this.Round}.\` ${this.GetMessageYield()}`);

		}
		else {
			const { damage, isCritical } = this.NextToAttack.Attack(this.NextToDefend, this.Round);

			await this.ShowToViewers(`\`${this.Round}.\` ${this.GetMessageDamage(damage.toFixed(1), isCritical)}`);

			await this.CalculateNextAttacker();
		}
	}

	GetStats() {
		const lifeBarChallenger = this.GetLifeBar(this.Challenger, 10);
		const lifeBarOpponent = this.GetLifeBar(this.Opponent, 10);
		// return `${Nationalities[this.Challenger.Nationality].flag} ${this.Challenger.Name} (${this.Challenger.RarityText})\n` +
		// 	`${lifeBarChallenger} (${this.Challenger.CurrentHP.toFixed(1)}/${this.Challenger.StartHP.toFixed(1)})\n` +
		// 	`${Nationalities[this.Opponent.Nationality].flag} ${this.Opponent.Name} (${this.Opponent.RarityText})\n` +
		// 	`${lifeBarOpponent} (${this.Opponent.CurrentHP.toFixed(1)}/${this.Opponent.StartHP.toFixed(1)})\n`;

		return `${this.Challenger.GetNameWithImage()} (Level ${this.Challenger.Level})\n` +
			`${lifeBarChallenger} ${this.Challenger.CurrentHP.toFixed(1)}/${this.Challenger.StartHP.toFixed(1)}\n\n` +
			`${this.Opponent.GetNameWithImage()} (Level ${this.Opponent.Level})\n` +
			`${lifeBarOpponent} ${this.Opponent.CurrentHP.toFixed(1)}/${this.Opponent.StartHP.toFixed(1)}`;
	}

	async ShowToViewers(message: string) {
		this.Log.push(message);
		this.History += `${message}\n`;

		this.Embeds[0] = new CustomEmbedBuilder()
			// .setThumbnail("https://i.imgur.com/Bg1MfeA.png")
			.setImage(this.NextToAttack.GetImage())
			.setDescription(`${this.GetStats()}\n\n${this.Log.slice(-5).join("\n\n")}`)
			.setColor(this.EmbedColor)
			.setFooter({
				text: getBattleArena(this.Arena).name,
				iconURL: getBattleArena(this.Arena).imageUrl,
			});

		await replyInteraction(this.Interaction, { embeds: this.Embeds });
	}

	async End() {
		const multiplier = await Event.GetActiveFromType(EventType.EXP_MULTIPLIER);

		if (this.Challenger.CurrentHP >= 0) {
			this.Winner = this.Challenger;
			this.Loser = this.Opponent;
		}
		else {
			this.Winner = this.Opponent;
			this.Loser = this.Challenger;
		}

		if (this.Type == BattleType.Wild) {
			this.Winner.ExpIfWin = Math.round(this.Winner.ExpIfWin * 0.7);
			this.Loser.ExpIfLose = Math.round(this.Loser.ExpIfLose * 0.7);
		}

		const restTimer = await this.Winner.CompleteBattle(true, this.Type);
		await this.Loser.CompleteBattle(false, this.Type);

		let restText = `They will rest until ${showTime(restTimer)}`;

		const showTitle = this.Winner.Title != "" ? `_${this.Winner.Title}_` : "";

		let expText = `\n${this.Winner.GetNameWithImage()} has received ${(this.Winner.ExpIfWin) * multiplier} exp.\n\n${this.Loser.GetNameWithImage()} has received ${(this.Loser.ExpIfLose) * multiplier} exp.\n`;

		// In a Wild Battle, only the challenger receives exp
		if (this.Type == BattleType.Wild) {
			restText = `He will rest until ${showTime(restTimer)}`;
			if (this.Winner == this.Challenger) {
				expText = `\n${this.Winner.GetNameWithImage()} has received ${(this.Winner.ExpIfWin) * multiplier} exp.\n`;
			}
			else {
				expText = `\n${this.Loser.GetNameWithImage()} has received ${(this.Loser.ExpIfLose) * multiplier} exp.\n`;
			}
		}
		else if (this.Type == BattleType.Spare) {
			expText = "";
		}
		else if (this.Type == BattleType.Championship) {
			restText = "";
		}

		const battleTypeText = this.Type == BattleType.Spare ? "spare" : "battle";

		const embed = new CustomEmbedBuilder()
			.setColor(getRarityColor(this.Winner.Rarity))
			.setThumbnail(this.Winner.GetImage())
			.setDescription(`# ${this.Winner.GetNameWithImage()} won the ${battleTypeText}!
${showTitle}
${expText}
${restText}`)
			.setFooter({
				text: getBattleArena(this.Arena).name,
				iconURL: getBattleArena(this.Arena).imageUrl,
			});

		this.Embeds.push(embed);

		this.History += `${this.Winner.GetNameWithImage()} won the ${battleTypeText}!`;

		await replyInteraction(this.Interaction, { embeds: this.Embeds });

		if (this.Type != BattleType.Spare && this.Type != BattleType.Wild) {
			await BattleHistory.Create(this);
		}
	}

	GetMessageDamage(damage: string, isCritical: boolean) {
		const attacker = `**${this.NextToAttack.GetNameWithImage()}**`;
		const defender = `${this.NextToDefend.GetNameWithImage()}`;

		const battleMessagesPTBR = [
			`${attacker} voou por incríveis 2 segundos e deixou ${defender} perplecto! ${defender} tomou ${damage} de dano!`,
			`${attacker} ciscou palha no olho de ${defender} e aproveitou para um ataque surpresa, causando ${damage} de dano!`,
			`${attacker} arrancou o olho de ${defender}! Por sorte era o olho ruim. Causou ${damage} de dano!`,
			`${attacker} deu um rasante em ${defender} arrancando várias de suas penas! Causou ${damage} de dano!`,
			`${attacker} acertou um combo de 5 hits em ${defender}, causando ${damage} de dano!`,
			`${attacker} aproveitou que ${defender} olhou para uma galinha da plateia e deu um mortal triplo carpado! Causou ${damage} de dano!`,
			`${attacker} usou um golpe especial e ${defender} ficou sem entender nada! Causou ${damage} de dano!`,
			`${attacker} rasga o peito de ${defender} como se fosse manteiga! Causou ${damage} de dano!`,
			`Pouco se importando com as regras, ${attacker} pega uma Colt 45 e atira em ${defender}. O tiro causou ${damage} de dano!`,
			`${defender} tenta usar uma técnica especial, mas ${attacker} aproveita a abertura e desce a porrada, causando ${damage} de dano!`,
			`${attacker} usa seu bico afiado para trucidar os membros de ${defender} e causar ${damage} de dano!`,
			`${attacker} aproveita a distância e joga diversas penas afiadas em ${defender}! Causou ${damage} de dano!`,
			`${defender} derruba seu oponente no chão e sai cantando vitória. ${attacker} aproveita a distração para causar ${damage} de dano ao atacar pelas costas! `,
			`Lembrando dos ensinamentos de seu mestre, ${attacker} usa sua concentração para acertar um soco potente que causa ${damage} de dano!`,
			`${attacker} consegue acertar uma boa sequência de chutes, bicadas, socos e penadas! Causou ${damage} de dano!`,
			`${attacker} pega várias pedras do chão e as atira em direção à ${defender}. Causou ${damage} de dano!`,
			`${defender} xinga a mãe de ${attacker}! Ele não deixou barato e partiu pra cima, causando ${damage} de dano!`,
			`${attacker} corre em direção de ${defender}, dá um duplo carpado fodinha e finaliza o combo com um MEGA ARRANHÃO FODÃO. Causou ${damage} de dano!`,
			`${attacker} hipnotiza seu adversário, fazendo ${defender} dar um soco em si mesmo, tomando ${damage} de dano!`,
			`${attacker} ativa o instinto superior e, desviando de todos os golpes de ${defender}, acerta um soco que causa ${damage} de dano!`,
			`${attacker} arranca parte da crista de ${defender}, causando ${damage} de dano!! O público fica indignado com tamanha baixaria.`,
			`${attacker} faz uma sequência de golpes aéreos utilizando suas garras afiadas, causando ${damage} de dano em ${defender}!`,
			`${attacker} faz uma sequência de golpes inferiores utilizando seu bico afiado, causando ${damage} de dano em ${defender}!`,
			`${attacker} realiza uma dança da chuva, convocando uma tempestade e atingindo ${defender} com um raio! Causou ${damage} de dano elétrico!`,
			`${attacker} aparece com vários shurikens e as lança em direção a ${defender}. Uma acerta, causando ${damage} de dano!`,
			`${attacker} acerta um gancho de direita diretamente no queixo de ${defender}. O soco causou ${damage} de dano!`,
			`${defender} revela que trouxe uma faca para a luta. ${attacker} não recua e revela que também tem uma. Ambos são habilidosos, mas é ${defender} quem sofre ${damage} de dano!`,
			`${attacker} invoca os antigos deuses pássaros, canalizando sua energia em uma poderoso bicada que inflige ${damage} de dano em ${defender}!`,
			`${attacker} usa a arte do pena-fu, acertando uma série de golpes precisos que deixam ${defender} atordoado e com menos ${damage} de HP!`,
			`${attacker} faz um front-flip no ar, pegando ${defender} de surpresa e atacando de cima para ${damage} de dano!`,
			`${attacker} realiza uma dança elegante no céu, hipnotizando ${defender} antes de desferir um golpe, causando ${damage} de dano!`,
			`${attacker} assume uma postura baixa e chuta a perna de ${defender}, fazendo-o cair e sofrer ${damage} de dano!`,
			`${attacker} acerta uma rápida cotovelada de Muay Thai na têmpora de ${defender}, resultando em ${damage} de dano!`,
			`${attacker} realiza um arremesso de judô, jogando ${defender} por cima do ombro e ao chão para causar ${damage} de dano!`,
			`${attacker} desencadeia uma saraivada de jabs e cruzados, espancando ${defender} e causando ${damage} de dano!`,
			`${attacker} executa uma queda perfeita de duas pernas, jogando ${defender} no tatame para ${damage} de dano!`,
			`${defender} corre para a borda da arena e pula na direção de ${attacker}, a fim de fazer um body slam. ${attacker} desvia e ${defender} bate no chão, sofrendo ${damage} de dano!`,
			`Com força e determinação aprendidas de _De La Cruz_, ${attacker} desfere um poderosíssimo Jab Relâmpago em ${defender}, causando ${damage} de dano!`,
			`${attacker} decide mostrar a verdadeira força das artes culinárias e ataca ${defender} no bico com uma Frigideira! Causou ${damage} de dano!`,
			`Pensando que o oponente precisa de um bom banho restaurador, ${attacker} arremessa ${defender} num rio próximo, infligindo ${damage} de dano! ${defender} está todo limpinho agora!`,
			`${attacker} discute sobre o significado da vida com ${defender}, causando ${damage} de dano emocional!`,
			`${attacker} distrai ${defender} com seus movimentos de Capoeira, efetivamente acertando um chute que causa ${damage} de dano!`,
			`Sendo tão frio e calculista, ${attacker} invoca uma nevasca que causa ${damage} de dano em ${defender}!`,
			`${attacker} estufa o peito e bate furiosamente, enviando uma rajada de penas que agem como shurikens, causando ${damage} de dano em ${defender}.`,
			`Com precisão cirúrgica, ${attacker} desfere uma bicada mortal no olho de ${defender}, causando ${damage} de dano e deixando-o atordoado.`,
			`${attacker} grita com um tom inesperado, fazendo ${defender} tropeçar e tomar ${damage} de dano enquanto questiona suas escolhas de vida.`,
			`${attacker} cospe no chão, tornando-o escorregadio e fazendo ${defender} cair, perdendo ${damage} de vida.`,
			`${attacker} faz uma pergunta existencial no meio da batalha, deixando ${defender} confuso e causando ${damage} de dano.`,
			`${defender} se esconde nas sombras, desferindo um ataque surpresa com as garras em ${attacker}. ${attacker} bloqueia e acerta um soco em ${defender}, causando ${damage} de dano.`,
			`${attacker} invoca pergaminhos antigos que giram ao redor de ${defender}, sobrecarregando-o com trivia inútil e causando ${damage} de dano.`,
		];

		const battleMessages = [
			`${attacker} flew for an incredible 2 seconds, leaving ${defender} perplexed! ${defender} took ${damage} damage!`,
			`${attacker} pecked straw into ${defender}'s eye and took advantage for a surprise attack, dealing ${damage} damage!`,
			`${attacker} ripped out ${defender}'s eye! Luckily, it was the bad eye. Caused ${damage} damage!`,
			`${attacker} swooped down on ${defender}, plucking several feathers! Caused ${damage} damage!`,
			`${attacker} landed a 5-hit combo on ${defender}, dealing ${damage} damage!`,
			`${attacker} took advantage of ${defender} looking at an audience chicken and performed a triple somersault! Caused ${damage} damage!`,
			`${attacker} used a special move, leaving ${defender} utterly confused! Caused ${damage} damage!`,
			`${attacker} tore through ${defender}'s chest like butter! Caused ${damage} damage!`,
			`${attacker} grabs a ${EmoteString.Colt45} Colt 45 and shoots ${defender}. The shot caused ${damage} damage!`,
			`${defender} tries to use a special technique, but ${attacker} takes advantage of the opening and delivers a beating, causing ${damage} damage!`,
			`${attacker} uses its sharp beak to mangle ${defender}'s limbs, dealing ${damage} damage!`,
			`${attacker} takes advantage of the distance and throws several sharp feathers at ${defender}! Dealt ${damage} damage!`,
			`${defender} knocks down his opponent and triumphantly sings a victory song. ${attacker} seizes the distraction to attack from behind, causing ${damage} damage! `,
			`Recalling the teachings of his master, ${attacker} concentrates and lands a powerful punch that inflicts ${damage} damage!`,
			`${attacker} manages to execute a solid sequence of kicks, pecks, punches, and wing flaps! Dealt ${damage} damage!`,
			`${attacker} picks up various stones from the ground and hurls them toward ${defender}. Caused ${damage} damage!`,
			`${defender} insults ${attacker}'s mother! Not one to let it slide, ${attacker} retaliates, dealing ${damage} damage!`,
			`${attacker} charges toward ${defender}, executes a fucking double somersault, and finishes the combo with a MEGA FUCKING SCRATCH. Caused ${damage} damage!`,
			`${attacker} hypnotizes his opponent, causing ${defender} to punch themselves and take ${damage} damage!`,
			`${attacker} activates his superior instinct, dodging all of ${defender}'s attacks and landing a punch that inflicts ${damage} damage!`,
			`${attacker} tears off part of ${defender}'s crest, causing ${damage} damage!! The audience is outraged by such foul play.`,
			`${attacker} performs a sequence of aerial strikes using his sharp talons, dealing ${damage} damage to ${defender}!`,
			`${attacker} executes a series of low blows using his sharp beak, causing ${damage} damage to ${defender}!`,
			`${attacker} performs a rain dance, summons a storm, and strikes ${defender} with lightning! Dealt ${damage} electrical damage!`,
			`${attacker} appears with various shurikens and throws them toward ${defender}. One hits, causing ${damage} damage!`,
			`${attacker} lands a right hook squarely on ${defender}'s chin. The punch dealt ${damage} damage!`,
			`${defender} reveals he brought a ${EmoteString.Knife} Knife to the fight. ${attacker} doesn't back down and reveals he have one too. Both are skilled, but it's ${defender} who suffers ${damage} damage!`,
			`${attacker} calls upon the ancient bird demigods, channeling their energy into a powerful peck that inflicts ${damage} damage on ${defender}!`,
			`${attacker} uses the art of feather-fu, delivering a series of precise strikes that leave ${defender} reeling and ${damage} poorer in health!`,
			`${attacker} does a loop-the-loop in the air, catching ${defender} off guard and striking from above for ${damage} damage!`,
			`${attacker} performs an elegant sky dance, mesmerizing ${defender} before delivering a critical hit, causing ${damage} damage!`,
			`${attacker} takes a low stance and sweeps ${defender}'s leg, causing them to fall and take ${damage} damage!`,
			`${attacker} delivers a swift Muay Thai elbow to ${defender}'s temple, resulting in ${damage} damage!`,
			`${attacker} performs a judo throw, flipping ${defender} over their shoulder and onto the ground for ${damage} damage!`,
			`${attacker} unleashes a barrage of jabs and crosses, pummeling ${defender} and dealing ${damage} damage!`,
			`${attacker} executes a perfect double-leg takedown, slamming ${defender} onto the canvas for ${damage} damage!`,
			`${defender} runs to the edge of the arena and jump in ${attacker} direction, in order to do a body slam. ${attacker} dodge it and ${defender} hits the ground, suffering ${damage} damage!`,
			`With strength and determination learned from _De La Cruz_, ${attacker} delivers a very powerful Lightning Jab in ${defender}, causing ${damage} damage!`,
			`${attacker} decides to show the true strength of the culinary arts and attacks ${defender} on the beak with a Frying Pan! Dealt ${damage} damage!`,
			`Thinking that the opponent needs a good restorative bath, ${attacker} throws ${defender} to the nearby river, inflicting ${damage} damage! ${defender} is all clean now!`,
			`${attacker} discuss about the meaning of life with ${defender}, causing ${damage} emotional damage!`,
			`${attacker} distracts ${defender} with their sick Capoeira moves, effective landing a sick kick that deals ${damage} damage!`,
			`Being so cold and calculating, ${attacker} that summons a snowstorm that deals ${damage} damage at ${defender}!`,
			`${attacker} puffs out its chest and flaps furiously, sending a flurry of feathers that act like shurikens, dealing ${damage} damage to ${defender}.`,
			`With pinpoint accuracy, ${attacker} delivers a deadly peck to ${defender}'s eye, dealing ${damage} damage and leaving it stunned.`,
			`${attacker} screams with an unexpected pitch, causing ${defender} to stumble and deal ${damage} damage as it question it's life choices.`,
			`${attacker} spit on the floor, making the ground slippery and causing ${defender} to fall, dealing ${damage} damage.`,
			`${attacker} delivers an existential question mid-battle, leaving ${defender} confused and taking ${damage} damage.`,
			`${defender} swoops down in the shadows, delivering a surprise claw attack on ${attacker}. ${attacker} blocks and lands a punch at ${defender}'s face, dealing ${damage} damage.`,
			`${attacker} summons ancient scrolls that swirl around ${defender}, overwhelming them with useless trivia and dealing ${damage} damage.`,
		];

		const array = this.Language == Language.English ? battleMessages : battleMessagesPTBR;

		let message = array[Math.round(Math.random() * (array.length - 1))];

		let C = ` ${EmoteString.Energy}**`;

		for (let i = 0; i < this.SequenceAttacks - 2; i++) {
			C += "C-";
		}

		if (this.SequenceAttacks > 1) {
			message = message + C + "Combo!**";
		}

		if (isCritical) {
			message = `${message.toUpperCase()} ${EmoteString.Critical}${this.Language == Language.English ? "IT WAS A CRITICAL DAMAGE" : "FOI UM DANO CRÍTICO"}!!`;
		}

		return message;
	}

	GetMessageYield() {
		const attacker = `**${this.NextToAttack.GetNameWithImage()}**`;
		const defender = `${this.NextToDefend.GetNameWithImage()}`;

		const yieldMessagesPTBR = [
			`${defender} está paralizado e não consegue se mover!`,
			`${defender} se sente lento e acaba errando diversos ataques.`,
			`Após receber diversos golpes, ${defender} está atordoado, mas ainda continua de pé!`,
			`Mesmo após atacar diversas vezes, ${defender} percebe que seu oponente ainda está de pé!`,
			`${attacker} gira em círculos e levanta muita poeira. Nâo há como ver nada!`,
			`${defender} cai no chão com tanta força que Sismólogos acharam que era um terremoto!`,
			`${attacker} inicia uma dança espetacular de acasalamento, pensando que, talvez, seu oponente seja fêmea.`,
			`${defender} ficou com tanto medo que botou um ovo...`,
			`${attacker} apanha sua bíblia e começa a ler Êxodo 23:7 _"Não se envolva em acusações falsas, e não mate o inocente e o justo, pois não vou declarar justo quem fizer o mal."_`,
			`Por algum motivo, ${defender} esqueceu da luta e começou a ciscar o chão.`,
			`${attacker} arremessa penas cortantes em ${defender}, mas acaba acertando seu mestre.`,
			// `${attacker} reveste seu corpo com penas de latão, recebendo +5 DEF.`,
			`${attacker} prepara um golpe poderoso...`,
			`${attacker} levanta uma nuvem de poeira com suas asas, cegando temporariamente o ${defender}.`,
			`Uma nave alienígena aparece para abduzir o mestre de ${defender}, mas ele protege seu dono e volta à rinha.`,
			`${attacker} começa a latir e ${defender} fica assustado.`,
			`${attacker} utiliza um pedaço de vidro para refletir a luz na cara e cegar ${defender}!`,
			`${attacker} interrompe a luta e começa a tragar um cigarro. É o maldito Cocky Blinder.`,
			`${defender} chamou ${attacker} para um x1 de Pedra-Papel-Tesoura. ${attacker} ganhou!`,
			`${defender} chamou ${attacker} para um x1 de Pedra-Papel-Tesoura. ${attacker} ganhou!`,
			`${attacker} decide entrar no modo sério e ${defender} treme na base.`,
			`${defender} toma distância de ${attacker} para recuperar o fôlego!`,
			`${attacker} e ${defender} seguram as mãos um do outro. Eles ficaram felizes. Nenhum dano foi causado neste turno!`,
		];

		const yieldMessages = [
			`${defender} is paralyzed and unable to move!`,
			`${defender} feels sluggish and keeps missing attacks.`,
			`After receiving several blows, ${defender} is dazed but still standing!`,
			`Even after attacking multiple times, ${defender} realizes their opponent is still on their feet!`,
			`${attacker} spins in circles, raising a cloud of dust. Nothing can be seen!`,
			`${defender} falls to the ground with such force that seismologists thought it was an earthquake!`,
			`${attacker} begins a spectacular mating dance, thinking that perhaps their opponent is female.`,
			`${defender} got so scared that they laid an egg...`,
			`${attacker} grabs their Bible and starts reading Exodus 23:7, _"Thou shalt flee from lies. Thou shalt not kill the innocent or the just; for I am the adversary to the wicked."_`,
			`For some reason, ${defender} forgets about the fight and starts pecking at the ground.`,
			`${attacker} throws sharp feathers at ${defender}, accidentally hitting their own master.`,
			`${attacker} prepares a powerful strike...`,
			`${attacker} flaps their wings, creating a dust cloud that temporarily blinds ${defender}.`,
			`An alien spaceship appears to abduct ${attacker}'s master, but he protect their owner and return to the brawl.`,
			`${attacker} starts barking, and ${defender} gets startled.`,
			`${attacker} uses a piece of glass to reflect light into ${defender}'s eyes, blinding them!`,
			`${attacker} interrupts the fight and starts smoking a cigarette. It's the bloody Cocky Blinder.`,
			`${attacker} challenges ${defender} to a Rock-Paper-Scissors duel. ${attacker} wins!`,
			`${defender} challenges ${attacker} to a Rock-Paper-Scissors duel. ${attacker} wins!`,
			`${attacker} switches to serious mode, and ${defender} trembles in fear.`,
			`${defender} steps back from ${attacker} to catch his breath!`,
			`${attacker} and ${defender} hold hands. This makes them very happy. No damage is done this turn!`,
		];

		const array = this.Language == Language.English ? yieldMessages : yieldMessagesPTBR;

		return array[Math.round(Math.random() * (array.length - 1))];
	}

	GetLifeBar(rooster: BattleRooster, emoteCount: number) {
		const hpRatio = rooster.CurrentHP / rooster.StartHP;

		const color = {
			left: EmoteString.LifebarLeftGreen,
			center: EmoteString.LifebarMidGreen,
			right: hpRatio == 1 ? EmoteString.LifebarRightGreen : EmoteString.LifebarRightEmpty,
		};

		if (hpRatio <= 0) {
			color.left = EmoteString.LifebarLeftEmpty;
			color.center = EmoteString.LifebarMidEmpty;

		}
		else if (hpRatio <= 0.20) {
			color.left = EmoteString.LifebarLeftRed;
			color.center = EmoteString.LifebarMidRed;

		}
		else if (hpRatio <= 0.35) {
			color.left = EmoteString.LifebarLeftOrange;
			color.center = EmoteString.LifebarMidOrange;

		}
		else if (hpRatio <= 0.50) {
			color.left = EmoteString.LifebarLeftYellow;
			color.center = EmoteString.LifebarMidYellow;

		}

		let emptyBars = Math.ceil((1 - hpRatio) * (emoteCount));
		emptyBars = Math.max(0, Math.min(emptyBars, emoteCount));

		return color.left + color.center.repeat(emoteCount - emptyBars) + EmoteString.LifebarMidEmpty.repeat(emptyBars) + color.right;
	}
}