import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { GangBaseId } from "../../src/core/types/Ids";

const gangBaseImages: Record<GangBaseId.Airport | GangBaseId.Bunker | GangBaseId.BikeClub, ImagePath> = {
	[GangBaseId.Airport]: imagePaths.gangBases.airport,
	[GangBaseId.BikeClub]: imagePaths.gangBases.bikeclub,
	[GangBaseId.Bunker]: imagePaths.gangBases.bunker,
};

export function useGangBase() {
	function getGangBaseImageUrl(baseId: GangBaseId.Airport | GangBaseId.Bunker | GangBaseId.BikeClub) {
		return gangBaseImages[baseId] ?? "";
	}

	return {
		getGangBaseImageUrl,
	};
}
