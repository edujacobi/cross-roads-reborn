import { Avatar, Style } from "@dicebear/core";
import landscape from "@dicebear/styles/landscape.json" with { type: "json" };
import openPeeps from "@dicebear/styles/open-peeps.json" with { type: "json" };

export function useFallbackUserImage(userId: string) {
	const style = new Style(openPeeps);
	const avatar = new Avatar(style, {
		backgroundColor: ["283147"],
		accessoriesProbability: 65,
		facialHairProbability: 75,
		maskProbability: 25,
		seed: userId,
	});

	return avatar.toDataUri();
}

export function useFallbackGangImage(gangId: number | string) {
	const style = new Style(landscape);
	const avatar = new Avatar(style, {
		seed: String(gangId),
	});

	return avatar.toDataUri();
}
