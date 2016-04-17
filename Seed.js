'use strict';
let Util = require('./Util.js');
class Seed {
    constructor() {
        this.param = Array.prototype.slice.call(arguments);
    }
    * [Symbol.iterator]() {
        let param = this.param,
            iteration = function* (input, index){
                if (!input.match(/{[^}]*}/)) {
                    yield input;
                    return;
                }
                index = index || 1;
                let generator = Util.isFunction(param[index]) ? param[index]() : param[index],
                    nextIteration = function* (seed){
                        yield* iteration(input.replace(/{[^}]*}/, seed), index+1);
                    };
                if (generator) {
                    for (let seed of generator) {
                        yield* nextIteration(seed);
                    }
                } else {
                    yield* nextIteration("");
                }
            };
        yield* iteration(param[0]);
    }
    static integerGenerator(limit, start) {
        return function* () {
            let base = start || 0,
                i = 0;
            while (i < limit) yield base + i++;
        };
    } 
    static charGenerator(limit, startChar) {
        return function* () {
            let base = startChar && startChar.charCodeAt(0) || 'a'.charCodeAt(0),
                i = 0;
            while (i < limit) yield String.fromCharCode(base + i++);
        };
    }
}
module.exports = Seed;