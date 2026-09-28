import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { InvestmentId } from "../../src/core/types/Ids";

const investmentImages: Record<InvestmentId, ImagePath> = {
	[InvestmentId.ChurrosCart]: imagePaths.investments.churrosCart,
	[InvestmentId.CrackDen]: imagePaths.investments.crackDen,
	[InvestmentId.BocceCourt]: imagePaths.investments.bocceCourt,
	[InvestmentId.VeganRestaurant]: imagePaths.investments.veganRestaurant,
	[InvestmentId.GolfClub]: imagePaths.investments.golfClub,
	[InvestmentId.VehicleManufacturer]: imagePaths.investments.vehicleManufacturer,
	[InvestmentId.UnderdevelopedCountry]: imagePaths.investments.underdevelopedCountry,
	[InvestmentId.ReligiousCult]: imagePaths.investments.religiousCult,
	[InvestmentId.StarGalaxy]: imagePaths.investments.starGalaxy,
};

export function useInvestment() {
	function getInvestmentImageUrl(investmentId: InvestmentId) {
		return investmentImages[investmentId] ?? imagePaths.investments.churrosCart;
	}

	return {
		getInvestmentImageUrl,
	};
}
