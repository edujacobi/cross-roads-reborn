/**
 * Calculates the value of a percentage of a number.
 *
 * @param percent - The percentage to calculate.
 * @param from - The base number.
 * @returns The calculated value.
 */
export function getPercent(percent: number, from: number) {
	return (from / 100) * percent;
}

/**
 * Returns a random item from an array.
 *
 * @param array - The array to pick from.
 * @returns A random element from the array.
 */
export function getRandomItemFromArray<T>(array: T[]): T {
	return array[Math.round(Math.random() * (array.length - 1))];
}