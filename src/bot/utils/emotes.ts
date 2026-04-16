export const EmoteId = {
	Attack: "1183919119263875082",
	Defense: "1183919120819966013",
	Speed: "1183919117519044658",
	Stamina: "1183919115195392050",
	CritChance: "1205866189675434054",
	Critical: "1231227320140824596",
	Energy: "1231227321667682335",
	Experience: "1231227322812600382",
	Power: "1249197917454209047",

	Resting: "1242943984930652300",
	Training: "1243198848613089330",
	Battling: "1249045518366015599",
	Ready: "1243201035674189844",

	Common: "894353110401703987",
	Uncommon: "894353110401695764",
	Rare: "894353110271656016",
	Legendary: "1233496524038606948",
	Mythic: "1233496525469126747",

	LifebarLeftEmpty: "902347180445159454",
	LifebarLeftGreen: "902350148036866099",
	LifebarLeftYellow: "902351150685225021",
	LifebarLeftOrange: "902351150559399997",
	LifebarLeftRed: "902351150576185344",

	LifebarMidEmpty: "902347180432556112",
	LifebarMidGreen: "902350147873308714",
	LifebarMidYellow: "902351150672654416",
	LifebarMidOrange: "902351150827835463",
	LifebarMidRed: "902351150664273930",

	LifebarRightEmpty: "902347180457746522",
	LifebarRightGreen: "902350147890077746",
	LifebarRightYellow: "902351150215483433",
	LifebarRightOrange: "902351150576177192",
	LifebarRightRed: "902351150567788674",

	ExpBarLeftEmpty: "1337073481334132777",
	ExpBarMidEmpty: "1337073484609880104",
	ExpBarRightEmpty: "1337073487420067951",
	ExpBarLeftFull: "1337073483179495465",
	ExpBarMidFull: "1337073485956251658",
	ExpBarRightFull: "1337073489370419264",

	LessThan12Hours: "1378458171688882347",
	LessThan24Hours: "1378458173517856878",

	Victory: "1249200014366998643",
	Defeat: "1249200012957585522",
	Winrate: "1249197353005613146",

	Online: "1230190951885049896",
	Offline: "1230190950291345468",

	Heads: `1337929532698529854`,
	Tails: `1337929535257051166`,

	// Weapons
	Knife: "829906312837201970",
	Pistol: "829906310538723339",
	MachinePistol: "829906313743826944",
	Rifle: "829906310983581756",
	Shotgun: "829906310211567667",
	SMG: "829906313608691722",
	AssaultRifle: "829906310099238984",
	Carbine: "829906313374334976",
	Sniper: "829906314167451648",
	Katana: "829906312795521034",
	RPG: "829906313126477874",
	Minigun: "829906313580380160",
	Nightvision: "829906313026863104",
	LightVest: "829906314451746836",
	HeavyVest: "829906314653204511",
	Jetpack: "829906313034465284",
	Bazooka: "829906313315090462",
	Exoskeleton: "829906315618025492",
	Granade: "829906313239855105",
	CompactSMG: "1352454623096471653",
	SawnOff: "1352249748211372053",
	BaseballBat: "1352249744025714698",
	BrassKnuckles: "1352249746332450868",
	AdvancedScope: "1352454951149895740",
	Sunglasses: "1354821782527279335",

	CloseInv: "823344220597256223",
	OpenInv: "823344220966223972",
	InvestmentActive: "1491105034585247904",
	InvestmentInactive: "1491105055846305976",
	Shop: "853054490915635221",
	BlackMarket: "853054490441416724",
	Jobs: "1337166793013334067",
	Alms: "1351192278517153826",

	Lazy: "854877539537125377",
	Robbery: "791447877997297665",
	Beat: "820088112357179453",
	Prison: "1339946677016068106",
	Working: "948015474782912563",
	Hospital: "1460598985248080057",
	Police: "1339924939385470986",
	Casino: "1460597964132323503",
	Scavenge: "816407267581886575",
	Bank: "539497634826551307",
	React: "1343948089249103945",
	Escape: "1345061962437890129",
	RussianRoulette: "1464352585220751593",

	VIP: "778572312215027744",

	Caramuru: "1246814117805686877",
	Coroamuru: "1246839956761219102",

	Waiting: "1245532472654041138",

	// Classes
	Assassin: "1343060412450607165",
	Attorney: "1460347876658909194",
	Entrepreneur: "1460252320897171600",
	Hobo: "1460252360457584767",
	Mafioso: "1343060418461044756",
	Thief: "1343060416896696423",

	// Henchman
	Henchman: "823251212135563304",

	// Scavenge
	Dump: "1353083468502011956",
	Forest: "1353083471408398510",
	Sewer: "1353083481931907132",
	WeaponFactory: "1353083479704866867",
	DrugLab: "1353083470011826246",
	NuclearPlant: "1353083473396502568",
	AlienShip: "1353083477712703518",
	MilitaryBase: "1353083475275546745",

	// Gang
	Gang: "1457723997478322327",
	NoPermission: "1392589953803747378",
	OnePermission: "1392589941887860826",
	TwoPermission: "1392589944945381426",
	ThreePermission: "1392589946958905344",
	FourPermission: "1392589949005467888",
	AllPermission: "1392589951757062294",

	SpecialCoinShop: "1454137203163791598",

	// TopGG UI
	TopGG_Star: "1494312069103747212",
	TopGG_Chart: "1494312090821857431",
};

export const EmoteString = {
	Attack: `<:Attack:${EmoteId.Attack}>`,
	Defense: `<:Defense:${EmoteId.Defense}>`,
	Speed: `<:Speed:${EmoteId.Speed}>`,
	Stamina: `<:Stamina:${EmoteId.Stamina}>`,
	CritChange: `<:CritChance:${EmoteId.CritChance}>`,
	Critical: `<:Critical:${EmoteId.Critical}>`,
	Energy: `<:Combo:${EmoteId.Energy}>`,
	Experience: `<:Experience:${EmoteId.Experience}>`,
	Power: `<:Power:${EmoteId.Power}>`,

	Resting: `<:Resting:${EmoteId.Resting}>`,
	Training: `<:Training:${EmoteId.Training}>`,
	Battling: `<:Battling:${EmoteId.Battling}>`,
	Ready: `<:Ready:${EmoteId.Ready}>`,

	Common: `<:Comum:${EmoteId.Common}>`,
	Uncommon: `<:Incomum:${EmoteId.Uncommon}>`,
	Rare: `<:Raro3:${EmoteId.Rare}>`,
	Legendary: `<:Legendary:${EmoteId.Legendary}>`,
	Mythic: `<:Mythic:${EmoteId.Mythic}>`,

	LifebarLeftEmpty: `<:lEmpty:${EmoteId.LifebarLeftEmpty}>`,
	LifebarLeftGreen: `<:lFull_g:${EmoteId.LifebarLeftGreen}>`,
	LifebarLeftYellow: `<:lFull_y:${EmoteId.LifebarLeftYellow}>`,
	LifebarLeftOrange: `<:lFull_o:${EmoteId.LifebarLeftOrange}>`,
	LifebarLeftRed: `<:lFull_r:${EmoteId.LifebarLeftRed}>`,

	LifebarMidEmpty: `<:mEmpty:${EmoteId.LifebarMidEmpty}>`,
	LifebarMidGreen: `<:mFull_g:${EmoteId.LifebarMidGreen}>`,
	LifebarMidYellow: `<:mFull_y:${EmoteId.LifebarMidYellow}>`,
	LifebarMidOrange: `<:mFull_o:${EmoteId.LifebarMidOrange}>`,
	LifebarMidRed: `<:mFull_r:${EmoteId.LifebarMidRed}>`,

	LifebarRightEmpty: `<:rEmpty:${EmoteId.LifebarRightEmpty}>`,
	LifebarRightGreen: `<:rFull_g:${EmoteId.LifebarRightGreen}>`,
	LifebarRightYellow: `<:rFull_y:${EmoteId.LifebarRightYellow}>`,
	LifebarRightOrange: `<:rFull_o:${EmoteId.LifebarRightOrange}>`,
	LifebarRightRed: `<:rFull_r:${EmoteId.LifebarRightRed}>`,

	ExpBarLeftEmpty: `<:lEmpty_xp:${EmoteId.ExpBarLeftEmpty}>`,
	ExpBarMidEmpty: `<:mEmpty_xp:${EmoteId.ExpBarMidEmpty}>`,
	ExpBarRightEmpty: `<:rEmpty_xp:${EmoteId.ExpBarRightEmpty}>`,
	ExpBarLeftFull: `<:lFull_xp:${EmoteId.ExpBarLeftFull}>`,
	ExpBarMidFull: `<:mFull_xp:${EmoteId.ExpBarMidFull}>`,
	ExpBarRightFull: `<:rFull_xp:${EmoteId.ExpBarRightFull}>`,

	LessThan12Hours: `<:LessThan12Hours:${EmoteId.LessThan12Hours}>`,
	LessThan24Hours: `<:LessThan24Hours:${EmoteId.LessThan24Hours}>`,

	Victory: `<:Victory:${EmoteId.Victory}>`,
	Defeat: `<:Defeat:${EmoteId.Defeat}>`,
	Winrate: `<:Winrate:${EmoteId.Winrate}>`,

	Online: `<:online:${EmoteId.Online}>`,
	Offline: `<:offline:${EmoteId.Offline}>`,

	Heads: `<:Cara:${EmoteId.Heads}>`,
	Tails: `<:Coroa:${EmoteId.Tails}>`,

	// Weapons
	Knife: `<:Faca:${EmoteId.Knife}>`,
	Pistol: `<:Colt45:${EmoteId.Pistol}>`,
	MachinePistol: `<:Tec9:${EmoteId.MachinePistol}>`,
	Rifle: `<:Rifle:${EmoteId.Rifle}>`,
	Shotgun: `<:Escopeta:${EmoteId.Shotgun}>`,
	SMG: `<:MP5:${EmoteId.SMG}>`,
	AssaultRifle: `<:AK47:${EmoteId.AssaultRifle}>`,
	Carbine: `<:M4:${EmoteId.Carbine}>`,
	Sniper: `<:Sniper:${EmoteId.Sniper}>`,
	Katana: `<:Katana:${EmoteId.Katana}>`,
	RPG: `<:RPG:${EmoteId.RPG}>`,
	Minigun: `<:Minigun:${EmoteId.Minigun}>`,
	Nightvision: `<:Oculos_Noturno:${EmoteId.Nightvision}>`,
	LightVest: `<:Colete_Leve:${EmoteId.LightVest}>`,
	HeavyVest: `<:Colete_Pesado:${EmoteId.HeavyVest}>`,
	Jetpack: `<:Jetpack:${EmoteId.Jetpack}>`,
	Bazooka: `<:Bazuca:${EmoteId.Bazooka}>`,
	Exoskeleton: `<:Exoesqueleto:${EmoteId.Exoskeleton}>`,
	Granade: `<:Granada:${EmoteId.Granade}>`,
	CompactSMG: `<:MicroUzi:${EmoteId.CompactSMG}>`,
	SawnOff: `<:SawnOff:${EmoteId.SawnOff}>`,
	BaseballBat: `<:BaseballBat:${EmoteId.BaseballBat}>`,
	BrassKnuckles: `<:BrassKnuckles:${EmoteId.BrassKnuckles}>`,
	AdvancedScope: `<:AdvancedScope:${EmoteId.AdvancedScope}>`,
	Sunglasses: `<:SunGlasses:${EmoteId.Sunglasses}>`,

	CloseInv: `<:Fechar_Inventario:${EmoteId.CloseInv}>`,
	OpenInv: `<:Abrir_Inventario:${EmoteId.OpenInv}>`,
	InvestmentActive: `<:Investment:${EmoteId.InvestmentActive}>`,
	InvestmentInactive: `<:InvestmentEnd:${EmoteId.InvestmentInactive}>`,
	Shop: `<:Loja:${EmoteId.Shop}>`,
	BlackMarket: `<:MercadoNegro:${EmoteId.BlackMarket}>`,
	Jobs: `<:Trabalhos:${EmoteId.Jobs}>`,
	Alms: `<:Alms:${EmoteId.Alms}>`,

	Idle: `<:Vadiando:${EmoteId.Lazy}>`,
	Robbery: `<:roubar:${EmoteId.Robbery}>`,
	Beat: `<:espancar:${EmoteId.Beat}>`,
	Prison: `<:Prison:${EmoteId.Prison}>`,
	Working: `<:Trabalhando:${EmoteId.Working}>`,
	Hospital: `<:Hospital_New:${EmoteId.Hospital}>`,
	Police: `<:Police2:${EmoteId.Police}>`,
	Casino: `<:Casino_New:${EmoteId.Casino}>`,
	Scavenge: `<:Vasculhar:${EmoteId.Scavenge}>`,
	Bank: `<:Banco:${EmoteId.Bank}>`,
	React: `<:React:${EmoteId.React}>`,
	Escape: `<:Escape:${EmoteId.Escape}>`,
	RussianRoulette: `<:RussianRoulette:${EmoteId.RussianRoulette}>`,

	VIP: `<:vip:${EmoteId.VIP}>`,

	Caramuru: `<:CaramuruNew:${EmoteId.Caramuru}>`,
	Coroamuru: `<:CoroamuruNew:${EmoteId.Coroamuru}>`,

	Waiting: `<a:waiting:${EmoteId.Waiting}>`,

	// Classes
	Assassin: `<:Class_Assassin:${EmoteId.Assassin}>`,
	Attorney: `<:Class_Attorney:${EmoteId.Attorney}>`,
	Entrepreneur: `<:Class_Entrepreneur:${EmoteId.Entrepreneur}>`,
	Hobo: `<:Class_Hobo:${EmoteId.Hobo}>`,
	Mafioso: `<:Class_Mafioso:${EmoteId.Mafioso}>`,
	Thief: `<:Class_Thief:${EmoteId.Thief}>`,

	// Henchman
	Henchman: `<:Classe_Mafioso:${EmoteId.Henchman}>`,

	// Scavenge
	Dump: `<:Dump:${EmoteId.Dump}>`,
	Forest: `<:Forest:${EmoteId.Forest}>`,
	Sewer: `<:Sewer:${EmoteId.Sewer}>`,
	WeaponFactory: `<:WeaponFactory:${EmoteId.WeaponFactory}>`,
	DrugLab: `<:DrugLab:${EmoteId.DrugLab}>`,
	NuclearPlant: `<:NuclearPlant:${EmoteId.NuclearPlant}>`,
	AlienShip: `<:AlienShip:${EmoteId.AlienShip}>`,
	MilitaryBase: `<:MilitaryBase:${EmoteId.MilitaryBase}>`,

	// Gang
	Gang: `<:GangEmote:${EmoteId.Gang}>`,
	NoPermission: `<:0_permission:${EmoteId.NoPermission}>`,
	OnePermission: `<:1_permission:${EmoteId.OnePermission}>`,
	TwoPermission: `<:2_permission:${EmoteId.TwoPermission}>`,
	ThreePermission: `<:3_permission:${EmoteId.ThreePermission}>`,
	FourPermission: `<:4_permission:${EmoteId.FourPermission}>`,
	AllPermission: `<:leader:${EmoteId.AllPermission}>`,

	SpecialCoinShop: `<:SpecialCoinShop:${EmoteId.SpecialCoinShop}>`,

	// TopGG UI
	TopGG_Star: `<:topgg_star:${EmoteId.TopGG_Star}>`,
	TopGG_Chart: `<:topgg_chart:${EmoteId.TopGG_Chart}>`,
};
