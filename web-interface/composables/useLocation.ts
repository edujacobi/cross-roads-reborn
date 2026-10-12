import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { LocationId, ScavengeId } from "../../src/core/types/Ids";

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

const scavengeLocationImages: Record<ScavengeId, ImagePath> = {
	[ScavengeId.Dump]: imagePaths.scavengeLocations.dump,
	[ScavengeId.Forest]: imagePaths.scavengeLocations.forest,
	[ScavengeId.Sewer]: imagePaths.scavengeLocations.sewer,
	[ScavengeId.WeaponFactory]: imagePaths.scavengeLocations.weaponFactory,
	[ScavengeId.DrugLab]: imagePaths.scavengeLocations.drugLab,
	[ScavengeId.NuclearPlant]: imagePaths.scavengeLocations.nuclearPlant,
	[ScavengeId.AlienShip]: imagePaths.scavengeLocations.alienShip,
	[ScavengeId.MilitaryBase]: imagePaths.scavengeLocations.militaryBase,
};

export function useLocation() {
	function getLocationImageUrl(locationId: LocationId) {
		return locationImages[locationId] ?? imagePaths.locations.oldLady;
	}

	function getScavengeLocationImageUrl(scavengeId: ScavengeId) {
		return scavengeLocationImages[scavengeId] ?? imagePaths.scavengeLocations.dump;
	}

	return {
		getLocationImageUrl,
		getScavengeLocationImageUrl,
	};
}
