export const imagePaths = {
	attributes: {
		attack: "attributes/attack.png",
		defense: "attributes/defense.png",
	},
	badges: {
		vip: "badges/vip.png",
	},
	brand: {
		logo: "brand/CrossRoadsLogo.png",
	},
	classes: {
		none: "classes/0_None.png",
		thief: "classes/1_Thief.png",
		assassin: "classes/2_Assassin.png",
		entrepreneur: "classes/3_Entrepreneur.png",
		hobo: "classes/4_Hobo.png",
		mafioso: "classes/5_Mafioso.png",
		attorney: "classes/6_Attorney.png",
	},
	investments: {
		churrosCart: "investments/1_churros_cart.png",
		crackDen: "investments/2_crack_den.png",
		bocceCourt: "investments/3_bocce_court.png",
		veganRestaurant: "investments/4_vegan_restaurant.png",
		golfClub: "investments/5_golf_club.png",
		vehicleManufacturer: "investments/6_vehicle_manufacturer.png",
		underdevelopedCountry: "investments/7_underdeveloped_country.png",
		religiousCult: "investments/8_religious_cult.png",
		starGalaxy: "investments/9_star_galaxy.png",
	},
	situations: {
		beatup: "situations/beatup.png",
		casino: "situations/casino.png",
		dead: "situations/dead.png",
		defendingInvestment: "situations/defending-investment.png",
		gangAction: "situations/gang-action.png",
		hospital: "situations/hospital.png",
		idling: "situations/idling.png",
		job: "situations/job.png",
		prison: "situations/prison.png",
		robbery: "situations/robbery.png",
		scavenging: "situations/scavenging.png",
		wanted: "situations/wanted.png",
	},
	uiElements: {
		inventory: "ui_elements/inventory.png",
	},
} as const;

export type ImagePath = {
	[Category in keyof typeof imagePaths]: (typeof imagePaths)[Category][keyof (typeof imagePaths)[Category]];
}[keyof typeof imagePaths];
