import { InvestmentId } from "../../src/core/types/Ids";

export function useInvestment() {
	function getInvestmentImageUrl(investmentId: InvestmentId) {
		switch (investmentId) {
			case InvestmentId.ChurrosCart:
				return "investments/1_churros_cart.png";
			case InvestmentId.CrackDen:
				return "investments/2_crack_den.png";
			case InvestmentId.BocceCourt:
				return "investments/3_bocce_court.png";
			case InvestmentId.VeganRestaurant:
				return "investments/4_vegan_restaurant.png";
			case InvestmentId.GolfClub:
				return "investments/5_golf_club.png";
			case InvestmentId.VehicleManufacturer:
				return "investments/6_vehicle_manufacturer.png";
			case InvestmentId.UnderdevelopedCountry:
				return "investments/7_underdeveloped_country.png";
			case InvestmentId.ReligiousCult:
				return "investments/8_religious_cult.png";
			case InvestmentId.StarGalaxy:
				return "investments/9_star_galaxy.png";
			default:
				return "investments/1_churros_cart.png";
		}
	}

	return {
		getInvestmentImageUrl,
	};
}
