import { Rooster } from "./Rooster";
import { Notification } from "./Notification";
import { BattleType } from "./Battle";
import { Log } from "../utils/log";
import { WildRooster } from "./WildRooster";

export class BattleRooster extends Rooster {
	StartHP = 40;
	CurrentHP = 40;
	ExpIfWin = 0;
	ExpIfLose = 0;

	/**
	 * Attack another rooster
	 * @param target The Rooster that you are attack
	 * @param round The round of the battle
	 * @return the ammount of damage dealt and if it was a critical
	 */
	Attack(target: BattleRooster, round: number) {
		const directAttack = this.Stats.Attack * 0.6;
		const aditionalDamage = Math.random() + 1;

		const directDefense = target.Stats.Defense * 0.45;
		const indirectDefense = (100 - target.Stats.Defense * 0.85) / 100;

		const isCritical = Math.random() * 100 < (this.Stats.Critical * 2);

		let baseDamage = directAttack - directDefense;

		if (baseDamage < 0) {
			baseDamage = 0;
		}

		let damage = baseDamage + aditionalDamage;

		if (round > 20) {
			damage += Math.floor(round / 10) - 1;
		}

		if (isCritical) {
			damage *= (2 + this.Stats.Critical * 0.02);
		}

		damage *= indirectDefense;

		target.TakeDamage(damage);

		return { damage, isCritical };
	}

	TakeDamage(ammount: number) {
		this.CurrentHP -= ammount;
	}

	CalcStats() {
		this.StartHP = this.StartHP + (this.Level - 1) * 3;
		this.CurrentHP = this.StartHP;
	}

	CalcExp(opponentLevel: number) {
		const baseExp = 160 + this.Level * 35;

		const levelDiff = opponentLevel - this.Level;

		this.ExpIfWin = baseExp + 85 * levelDiff;
		this.ExpIfLose = this.Level * 30;
	}

	async StartBattle(opponent: BattleRooster, battleType: BattleType) {
		this.BattlingWith = opponent.Id;
		await this.Update();
		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) is now on ${battleType == BattleType.Spare ? "spare" : "battle"}`);
	}

	async CompleteBattle(winner: boolean, battleType: BattleType) {
		const timeToRest = Date.now() + 60_000 * 11;
		// Wild Rooster
		if (this.IsDeleted || this.OwnerId == "0") {
			return timeToRest;
		}

		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) has ${winner ? "won" : "lost"} his ${battleType == BattleType.Spare ? "spare" : "battle"}.`);

		// Assure that the info is updated at the end of the fight
		await this.GetInfo();

		if (battleType == BattleType.Spare) {
			this.Timers.Rest = Date.now() + 60_000 * 2;

		}
		else {
			if (winner) {
				await this.AddExp(this.ExpIfWin);
				this.Wins += battleType != BattleType.Wild ? 1 : 0;

			}
			else {
				await this.AddExp(this.ExpIfLose);
				this.Losses += battleType != BattleType.Wild ? 1 : 0;
			}

			// 12 min - 18 s por level
			// this.Timers.Rest = Date.now() + 60_000 * (12 - (this.Level * 0.30));
			this.Timers.Rest = timeToRest;
		}

		this.BattlingWith = null;
		await this.Update();

		if (battleType != BattleType.Championship) {
			await Notification.Rest(this);
		}

		return this.Timers.Rest;
	}

	FromWildRooster(wildRooster: WildRooster) {
		this.Id = wildRooster.Id;
		this.OwnerId = wildRooster.OwnerId;
		this.Name = wildRooster.Name;
		this.Level = wildRooster.Level;
		this.Exp = wildRooster.Exp;
		this.Rarity = wildRooster.Rarity;
		this.Image = wildRooster.Image;
		this.Timers = wildRooster.Timers;
		this.Stats = wildRooster.Stats;
		this.BirthDate = wildRooster.BirthDate;
		this.Wins = wildRooster.Wins;
		this.Losses = wildRooster.Losses;
		this.BattlingWith = wildRooster.BattlingWith;
		this.IsDeleted = wildRooster.IsDeleted;
		this.Nationality = wildRooster.Nationality;
		return this;
	}

}