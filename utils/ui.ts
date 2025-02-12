import { ActivityType, ButtonInteraction, Client, ColorResolvable, Colors, CommandInteraction } from "discord.js";
import { Rarity, RoosterStat } from "../models/Rooster";
import { CustomEmbedBuilder } from "../models/CustomEmbedBuilder";

interface EmbedParams {
	interaction: CommandInteraction | ButtonInteraction;
	color?: ColorResolvable;
	description?: string;
	footer?: string;
	thumbnail?: string;
}

export function defaultEmbed(options: EmbedParams): CustomEmbedBuilder {
	const embed = new CustomEmbedBuilder()
		.setDefaultFooter(options.interaction, options.footer);

	if (options.description) {
		embed.setDescription(options.description);
	}
	if (options.color) {
		embed.setColor(options.color);
	}
	if (options.thumbnail) {
		embed.setThumbnail(options.thumbnail);
	}

	return embed;
}

<<<<<<< Updated upstream
=======
export function formatMoney(money: number, lang: Language, prefix = "Cr$") {
	let m = money.toLocaleString("en-US");

	if (lang === Language.Portuguese) {
		m = money.toLocaleString("pt-BR").replace(/,/g, ".");
	}

	return `${prefix} ${m}`;
}

export function formatChip(chip: number, lang: Language) {
	return formatMoney(chip, lang, "");
}

>>>>>>> Stashed changes
export function getRarityColor(rarity: Rarity) {
	switch (rarity) {
	case Rarity.Mythic:
		return 0xb013b6;

	case Rarity.Legendary:
		return Colors.Orange;

	case Rarity.Rare:
		return Colors.Red;

	case Rarity.Uncommon:
		return Colors.Blue;

	default:
		return Colors.DarkButNotBlack;
	}
}

export function getRarityText(rarity: Rarity) {
	switch (rarity) {
	case Rarity.Mythic:
		return `${EmoteString.Mythic} Mythic`;
	case Rarity.Legendary:
		return `${EmoteString.Legendary} Legendary`;
	case Rarity.Rare:
		return `${EmoteString.Rare} Rare`;
	case Rarity.Uncommon:
		return `${EmoteString.Uncommon} Uncommon`;
	default:
		return `${EmoteString.Common} Common`;
	}
}

export function getPathText(stat: string) {
	switch (stat) {
	case RoosterStat.ATK:
		return `${EmoteString.Attack} Path of Tiger`;
	case RoosterStat.DEF:
		return `${EmoteString.Defense} Path of Turtle`;
	case RoosterStat.SPD:
		return `${EmoteString.Speed} Path of Snake`;
	case RoosterStat.CRT:
		return `${EmoteString.CritChange} Path of Dragon`;
	default:
		return ``;
	}
}

export function getRoosterWinrate(wins: number, losses: number) {
	return `${wins + losses > 0 ? (wins / (losses + wins) * 100).toFixed(2) : "0"}%`;
}

export enum EmoteId {
	Attack = "1183919119263875082",
	Defense = "1183919120819966013",
	Speed = "1183919117519044658",
	Stamina = "1183919115195392050",
	CritChance = "1205866189675434054",
	Critical = "1231227320140824596",
	Energy = "1231227321667682335",
	Experience = "1231227322812600382",
	Power = "1249197917454209047",

	Resting = "1242943984930652300",
	Training = "1243198848613089330",
	Battling = "1249045518366015599",
	Ready = "1243201035674189844",

	Common = "894353110401703987",
	Uncommon = "894353110401695764",
	Rare = "894353110271656016",
	Legendary = "1233496524038606948",
	Mythic = "1233496525469126747",

	LifebarLeftEmpty = "902347180445159454",
	LifebarLeftGreen = "902350148036866099",
	LifebarLeftYellow = "902351150685225021",
	LifebarLeftOrange = "902351150559399997",
	LifebarLeftRed = "902351150576185344",

	LifebarMidEmpty = "902347180432556112",
	LifebarMidGreen = "902350147873308714",
	LifebarMidYellow = "902351150672654416",
	LifebarMidOrange = "902351150827835463",
	LifebarMidRed = "902351150664273930",

	LifebarRightEmpty = "902347180457746522",
	LifebarRightGreen = "902350147890077746",
	LifebarRightYellow = "902351150215483433",
	LifebarRightOrange = "902351150576177192",
	LifebarRightRed = "902351150567788674",
	ExpBarLeftEmpty = "1337073481334132777",
	ExpBarMidEmpty = "1337073484609880104",
	ExpBarRightEmpty = "1337073487420067951",
	ExpBarLeftFull = "1337073483179495465",
	ExpBarMidFull = "1337073485956251658",
	ExpBarRightFull = "1337073489370419264",

	Victory = `1249200014366998643`,
	Defeat = "1249200012957585522",
	Winrate = `1249197353005613146`,

	Online = `1230190951885049896`,
	Offline = `1230190950291345468`,

	// Weapons
	Knife = `829906312837201970`,
	Colt45 = `829906310538723339`,
	Tec9 = `829906313743826944`,
	Rifle = `829906310983581756`,
	Shotgun = `829906310211567667`,
	MP5 = `829906313608691722`,
	AK47 = `829906310099238984`,
	M4 = `829906313374334976`,
	Sniper = `829906314167451648`,
	Katana = `829906312795521034`,
	RPG = `829906313126477874`,
	Minigun = `829906313580380160`,
	Nightvision = `829906313026863104`,
	LightVest = `829906314451746836`,
	HeavyVest = `829906314653204511`,
	Jetpack = `829906313034465284`,
	Bazooka = `829906313315090462`,
	Exoskeleton = `829906315618025492`,
	Granade = `829906313239855105`,

	VIP = `778572312215027744`,

	Caramuru = `1246814117805686877`,
	Coroamuru = `1246839956761219102`,

	Waiting = `1245532472654041138`,
	CampeaoCanja = `825763812506075197`

}

export enum EmoteString {
	Attack = `<:Attack:${EmoteId.Attack}>`,
	Defense = `<:Defense:${EmoteId.Defense}>`,
	Speed = `<:Speed:${EmoteId.Speed}>`,
	Stamina = `<:Stamina:${EmoteId.Stamina}>`,
	CritChange = `<:CritChance:${EmoteId.CritChance}>`,
	Critical = `<:Critical:${EmoteId.Critical}>`,
	Energy = `<:Combo:${EmoteId.Energy}>`,
	Experience = `<:Experience:${EmoteId.Experience}>`,
	Power = `<:Power:${EmoteId.Power}>`,

	Resting = `<:Resting:${EmoteId.Resting}>`,
	Training = `<:Training:${EmoteId.Training}>`,
	Battling = `<:Battling:${EmoteId.Battling}>`,
	Ready = `<:Ready:${EmoteId.Ready}>`,

	Common = `<:Comum:${EmoteId.Common}>`,
	Uncommon = `<:Incomum:${EmoteId.Uncommon}>`,
	Rare = `<:Raro3:${EmoteId.Rare}>`,
	Legendary = `<:Legendary:${EmoteId.Legendary}>`,
	Mythic = `<:Mythic:${EmoteId.Mythic}>`,

	LifebarLeftEmpty = `<:lEmpty:${EmoteId.LifebarLeftEmpty}>`,
	LifebarLeftGreen = `<:lFull_g:${EmoteId.LifebarLeftGreen}>`,
	LifebarLeftYellow = `<:lFull_y:${EmoteId.LifebarLeftYellow}>`,
	LifebarLeftOrange = `<:lFull_o:${EmoteId.LifebarLeftOrange}>`,
	LifebarLeftRed = `<:lFull_r:${EmoteId.LifebarLeftRed}>`,

	LifebarMidEmpty = `<:mEmpty:${EmoteId.LifebarMidEmpty}>`,
	LifebarMidGreen = `<:mFull_g:${EmoteId.LifebarMidGreen}>`,
	LifebarMidYellow = `<:mFull_y:${EmoteId.LifebarMidYellow}>`,
	LifebarMidOrange = `<:mFull_o:${EmoteId.LifebarMidOrange}>`,
	LifebarMidRed = `<:mFull_r:${EmoteId.LifebarMidRed}>`,

	LifebarRightEmpty = `<:rEmpty:${EmoteId.LifebarRightEmpty}>`,
	LifebarRightGreen = `<:rFull_g:${EmoteId.LifebarRightGreen}>`,
	LifebarRightYellow = `<:rFull_y:${EmoteId.LifebarRightYellow}>`,
	LifebarRightOrange = `<:rFull_o:${EmoteId.LifebarRightOrange}>`,
	LifebarRightRed = `<:rFull_r:${EmoteId.LifebarRightRed}>`,

	ExpBarLeftEmpty = `<:lEmpty_xp:${EmoteId.ExpBarLeftEmpty}>`,
	ExpBarMidEmpty = `<:mEmpty_xp:${EmoteId.ExpBarMidEmpty}>`,
	ExpBarRightEmpty = `<:rEmpty_xp:${EmoteId.ExpBarRightEmpty}>`,
	ExpBarLeftFull = `<:lFull_xp:${EmoteId.ExpBarLeftFull}>`,
	ExpBarMidFull = `<:mFull_xp:${EmoteId.ExpBarMidFull}>`,
	ExpBarRightFull = `<:rFull_xp:${EmoteId.ExpBarRightFull}>`,

	Victory = `<:Victory:${EmoteId.Victory}>`,
	Defeat = `<:Defeat:${EmoteId.Defeat}>`,
	Winrate = `<:Winrate:${EmoteId.Winrate}>`,

	Online = `<:online:${EmoteId.Online}>`,
	Offline = `<:offline:${EmoteId.Offline}>`,

	// Weapons
	Knife = `<:Faca:${EmoteId.Knife}>`,
	Colt45 = `<:Colt45:${EmoteId.Colt45}>`,
	Tec9 = `<:Tec9:${EmoteId.Tec9}>`,
	Rifle = `<:Rifle:${EmoteId.Rifle}>`,
	Shotgun = `<:Escopeta:${EmoteId.Shotgun}>`,
	MP5 = `<:MP5:${EmoteId.MP5}>`,
	AK47 = `<:AK47:${EmoteId.AK47}>`,
	M4 = `<:M4:${EmoteId.M4}>`,
	Sniper = `<:Sniper:${EmoteId.Sniper}>`,
	Katana = `<:Katana:${EmoteId.Katana}>`,
	RPG = `<:RPG:${EmoteId.RPG}>`,
	Minigun = `<:Minigun:${EmoteId.Minigun}>`,
	Nightvision = `<:Oculos_Noturno:${EmoteId.Nightvision}>`,
	LightVest = `<:Colete_Leve:${EmoteId.LightVest}>`,
	HeavyVest = `<:Colete_Pesado:${EmoteId.HeavyVest}>`,
	Jetpack = `<:Jetpack:${EmoteId.Jetpack}>`,
	Bazooka = `<:Bazuca:${EmoteId.Bazooka}>`,
	Exoskeleton = `<:Exoesqueleto:${EmoteId.Exoskeleton}>`,
	Granade = `<:Granada:${EmoteId.Granade}>`,

	VIP = `<:vip:${EmoteId.VIP}>`,

	Caramuru = `<:CaramuruNew:${EmoteId.Caramuru}>`,
	Coroamuru = `<:CoroamuruNew:${EmoteId.Coroamuru}>`,

	Waiting = `<a:waiting:${EmoteId.Waiting}>`,

	CampeaoCanja = `<:Campeao_Canja:${EmoteId.CampeaoCanja}>`
}

export function showTime(time: number, humanized?: boolean) {
	return `<t:${Math.round(time / 1000)}:${humanized ? "R" : "f"}>`;
}

export function formatDate(date: Date) {
	return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours() % 12).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${date.getHours() > 12 ? "PM" : "AM"}`;
}

interface ClientActivity {
	type: ActivityType,
	label: string
}

export const clientActivities: ClientActivity[] = [{
	type: ActivityType.Playing,
	label: "Cross Roads",
}, {
	type: ActivityType.Custom,
	label: "🪙 Betting in Casino",
}, {
	type: ActivityType.Custom,
	label: "📖 Reading Rooster Fighter",
}, {
	type: ActivityType.Custom,
	label: "🦾 Training in Dojo",
}, {
	type: ActivityType.Watching,
	label: "Netflix",
}];

export function changeActivity(client: Client) {
	let currentActivityId = 0;
	const currentActivity = clientActivities[currentActivityId];

	client.user?.setActivity(currentActivity.label, {
		type: currentActivity.type,
	});

	setInterval(() => {
		currentActivityId += 1;

		if (currentActivityId >= clientActivities.length) {
			currentActivityId = 0;
		}

		const newActivity = clientActivities[currentActivityId];

		client.user?.setActivity(newActivity.label, {
			type: newActivity.type,
		});

	}, 30_000_000);
}