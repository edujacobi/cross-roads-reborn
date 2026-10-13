import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { GangBaseId } from "../../src/core/types/Ids";

const gangBaseImages: Record<GangBaseId.Airport | GangBaseId.Bunker | GangBaseId.BikeClub, ImagePath> = {
	[GangBaseId.Airport]: imagePaths.gangBases.airport,
	[GangBaseId.BikeClub]: imagePaths.gangBases.bikeclub,
	[GangBaseId.Bunker]: imagePaths.gangBases.bunker,
};

const gangBaseShipmentImages: Record<GangBaseId.Airport | GangBaseId.Bunker | GangBaseId.BikeClub, ImagePath> = {
	[GangBaseId.Airport]: imagePaths.gangBases.airportShipment,
	[GangBaseId.BikeClub]: imagePaths.gangBases.bikeclubShipment,
	[GangBaseId.Bunker]: imagePaths.gangBases.bunkerShipment,
};

export function useGangBase() {
	function getGangBaseImageUrl(baseId: GangBaseId.Airport | GangBaseId.Bunker | GangBaseId.BikeClub) {
		return gangBaseImages[baseId] ?? "";
	}

	function getGangBaseShipmentImageUrl(baseId: GangBaseId.Airport | GangBaseId.Bunker | GangBaseId.BikeClub) {
		return gangBaseShipmentImages[baseId] ?? "";
	}

	return {
		getGangBaseImageUrl,
		getGangBaseShipmentImageUrl,
	};
}
