'use strict';
let Util = require('./Util.js');
class Seed {
    constructor() {
        this.__paramInstances = false;    // Disabled
        this.__param = Array.prototype.slice.call(arguments);
    }
    * [Symbol.iterator]() {
        let param = this.__param,
            paramInstances = this.__paramInstances,
            iteration = function* (input, index){
                if (!input.match(/{[^}]*}/)) {
                    if (paramInstances) paramInstances[0] = input;
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
                        if (paramInstances) paramInstances[index] = seed;
                        yield* nextIteration(seed);
                    }
                } else {
                    yield* nextIteration("");
                }
            };
        yield* iteration(param[0]);
    }
    each(delegate) {
        if (!Util.isFunction(delegate)) return;
        this.__paramInstances = []; // Enable paramInstances to store intermediate state of generators
        for (let seed of this[Symbol.iterator]()) {
            delegate.apply(this, this.__paramInstances);
        }
        this.__paramInstances = false;  // Disabling & release memory
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