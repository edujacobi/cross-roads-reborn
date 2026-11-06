"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPercent = getPercent;
exports.getRandomItemFromArray = getRandomItemFromArray;
/**
 * Calculates the value of a percentage of a number.
 *
 * @param percent - The percentage to calculate.
 * @param from - The base number.
 * @returns The calculated value.
 */
function getPercent(percent, from) {
    return (from / 100) * percent;
}
/**
 * Returns a random item from an array.
 *
 * @param array - The array to pick from.
 * @returns A random element from the array.
 */
function getRandomItemFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}
//# sourceMappingURL=utils.js.map