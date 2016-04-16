'use strict';
class Seed {
	constructor() {
		this.param = Array.prototype.slice.call(arguments);
	}
	* [Symbol.iterator]() {
		let iteration = (input, index) => {
			if (!input.match(/{[^}]*}/)) {
				yield input;
				return;
			}
			index = index || 1;
			let generator = this.param[index](),
				nextIteration = (seed) => {
					iteration(input.replace(/{[^}]*}/, seed), index+1);
				};
			if (generator) {
				for (let seed of generator) {
					nextIteration(seed);
				}
			} else {
				nextIteration("");
			}
		};
		iteration(this.param[0]);
	}
	// * [Symbol.iterator]() {
	// 	for (const arg of this.param) {
	// 		yield arg;
	// 	}
	// }
}
module.exports = Seed;