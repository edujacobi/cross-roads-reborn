import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	MessageComponentInteraction,
	User as UserDiscord,
} from "discord.js";
import { Rooster } from "./Rooster";
import {
	checkAllActionsForBattle,
	checkRooster,
	checkUser,
	removeEmbedComponents,
	replyInteraction,
	showMessageActions,
} from "../utils/logic";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { BattleArena, getBattleArena } from "./BattleArena";
import { setTimeout as wait } from "timers/promises";
import { WildRooster } from "./WildRooster";
import { EmoteId, getRarityColor } from "../utils/ui";
import { BattleRooster } from "./BattleRooster";
import { Battle, BattleType } from "./Battle";
import { User } from "./User";

export class Wild {
	Adventurer: Rooster = new Rooster("0");
	AdventurerUser: User = new User("0");
	Interaction: ChatInputCommandInteraction;
	IsWildRoosterReleased = false;

	constructor(interaction: ChatInputCommandInteraction) {
		this.Interaction = interaction;
	}

	async CanStart() {
		const user = await checkUser(this.Interaction.user.id, this.Interaction);

		const userRooster = await checkRooster(this.Interaction.user.id, this.Interaction);

		if (!userRooster || !user) {
			return false;
		}

		this.Adventurer = userRooster;
		this.AdventurerUser = user;

		const roosterActions = checkAllActionsForBattle(this.Adventurer);

		// true if rooster can start
		return await showMessageActions(roosterActions, this.Adventurer, this.Interaction);
	}

	async StartAdventure() {
		const embedWild = new CustomEmbedBuilder()
			.setAuthor({
				name: `${this.Interaction.user.displayName} and ${this.Adventurer.Name}`,
				iconURL: this.Interaction.user.avatarURL() ?? undefined,
			})
			.setColor(Colors.DarkGreen)
			.setThumbnail(this.Adventurer.GetImage())
			.setDescription("Walking through the wilds...")
			.setImage(getBattleArena(BattleArena.Wild).imageUrl)
			.setDefaultFooter(this.Interaction, `Level: ${this.Adventurer.Level} (${this.Adventurer.Exp}/${this.Adventurer.GetExpNeededToLevelUp()})`);

		await replyInteraction(this.Interaction, { embeds: [embedWild], components: [] });

		const waitTime = this.AdventurerUser.IsVip() ? 4_000 : 8_000;

		// 7s a 11s de espera normal. 4s a 7s de espera para VIP
		await wait(Math.floor(Math.random() * 3_000) + waitTime);

		embedWild.setDescription("Walking through the wilds... \n## You find a wild rooster!");

		await replyInteraction(this.Interaction, { embeds: [embedWild] });

		await wait(3_000);

		const finded = await this.FindRooster();

		if (!finded) {
			return;
		}

		await this.ControlEmbed(finded.opponentRooster, finded.opponentUser, finded.values);
	}

	async FindRooster() {
		this.IsWildRoosterReleased = Math.random() < 0.5;

		let opponentRooster: Rooster | WildRooster | undefined;
		let opponentUser: UserDiscord | undefined;

		if (!this.IsWildRoosterReleased) {
			opponentRooster = new WildRooster(this.Adventurer.Level, this.AdventurerUser.Language);
		}
		else {
			opponentRooster = await Rooster.GetRandomReleasedRooster(this.Adventurer.Level);

			if (opponentRooster) {
				opponentUser = await this.Interaction.client.users.fetch(opponentRooster?.OwnerId);
			}
			else {
				// If no rooster is found, generate a wild one
				opponentRooster = new WildRooster(this.Adventurer.Level, this.AdventurerUser.Language);
				this.IsWildRoosterReleased = false;
			}
		}

		const values = await opponentRooster.GenerateEmbedValues();

		return { opponentRooster, opponentUser, values };
	}

	async ControlEmbed(rooster: Rooster, user: UserDiscord | undefined, values: any) {
		const embed = new CustomEmbedBuilder()
			.setAuthor({
				name: this.IsWildRoosterReleased ? `Wild rooster, released by ${user?.displayName}` : "Wild rooster",
				iconURL: user?.avatarURL() ?? undefined,
			})
			.setColor(getRarityColor(rooster.Rarity))
			.setThumbnail(rooster.GetImage())
			.setDescription(values.description.small)
			.setDefaultFooter(this.Interaction, `Level: ${rooster.Level}`);

		const buttonBattle = new ButtonBuilder()
			.setCustomId("battle")
			.setLabel("Battle")
			.setStyle(ButtonStyle.Success)
			.setEmoji(EmoteId.Attack);

		const buttonRun = new ButtonBuilder()
			.setCustomId("looking")
			.setLabel("Keep looking")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.Speed);

		const buttonLessInfo = new ButtonBuilder()
			.setCustomId("lessInfo")
			.setLabel("Less info")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➖");

		const buttonMoreInfo = new ButtonBuilder()
			.setCustomId("moreInfo")
			.setLabel("More info")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➕");

		const row = new ActionRowBuilder<ButtonBuilder>()
			.setComponents([buttonBattle, buttonRun, buttonMoreInfo]);

		const response = await replyInteraction(this.Interaction, { embeds: [embed], components: [row] });

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collector?.on("collect", async btn => {
			if (!rooster) {
				return;
			}

			if (btn.customId === "moreInfo") {
				embed.setDescription(values.description.big);

				row.setComponents([buttonBattle, buttonRun, buttonLessInfo]);

				await btn.update({ embeds: [embed], components: [row] });

			}
			else if (btn.customId === "lessInfo") {

				embed.setDescription(values.description.small);

				row.setComponents([buttonBattle, buttonRun, buttonMoreInfo]);

				await btn.update({ embeds: [embed], components: [row] });

			}
			else if (btn.customId === "looking") {

				await removeEmbedComponents(btn, [embed]);
				collector.stop();

				await this.StartAdventure();

			}
			else if (btn.customId === "battle") {

				const user = await checkUser(this.Interaction.user.id, this.Interaction);

				const userRooster = await checkRooster(this.Interaction.user.id, this.Interaction);

				if (!userRooster || !user) {
					return;
				}

				this.Adventurer = userRooster;

				const roosterActions = checkAllActionsForBattle(this.Adventurer);

				const canRoosterBattle = await showMessageActions(roosterActions, this.Adventurer, this.Interaction);

				if (!canRoosterBattle) {
					return;
				}

				const challenger = await new BattleRooster(this.Adventurer.OwnerId).GetInfo();
				const opponent = new BattleRooster(rooster.OwnerId).FromWildRooster(rooster as WildRooster);

				if (!challenger || !opponent) {
					return;
				}

				challenger.CalcStats();
				opponent.CalcStats();

				const battle = new Battle(challenger, opponent, btn, BattleType.Wild, BattleArena.Wild, user.Language);

				embed
					.setColor(Colors.DarkGreen)
					.setDescription("# A WILD BATTLE BEGINS!");

				await removeEmbedComponents(btn, [embed]);

				collector.dispose(btn);

				await wait(4000);

				await battle.Start();
			}
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(this.Interaction);
		});
	}
}