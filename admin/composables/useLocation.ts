import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { LocationId } from "../../src/core/types/Ids";

const locationImages: Record<LocationId, ImagePath> = {
	[LocationId.OldLady]: imagePaths.locations.oldLady,
	[LocationId.GroceryStore]: imagePaths.locations.groceryStore,
	[LocationId.GasStation]: imagePaths.locations.gasStation,
	[LocationId.JewelryStore]: imagePaths.locations.jewelry,
	[LocationId.SmallBank]: imagePaths.locations.smallBank,
	[LocationId.ItalianMafia]: imagePaths.locations.italianMafia,
	[LocationId.ArmyDepot]: imagePaths.locations.armyDepot,
	[LocationId.JacobiPalace]: imagePaths.locations.jacobiPalace,
};

export function useLocation() {
	function getLocationImageUrl(locationId: LocationId) {
		return locationImages[locationId] ?? imagePaths.locations.oldLady;
	}

	return {
		getLocationImageUrl,
	};
}
