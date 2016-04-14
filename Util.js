'use strict';
let promise = require('bluebird'),
    https = require('https'),
    http = require('http'),
    uuid = 0,
    uid = 20396;

class Util {
    // @deprecates
    static request(caller, requestOption, callback) {
        let protocol = http;
        if (typeof requestOption === 'string' || requestOption instanceof String) {
            if (requestOption.substring(0, 5) === 'https') {
                protocol = https;
            }
        } else if (requestOption.protocol === 'https') {
            protocol = https;
        }
        protocol.request(requestOption, callback).on('error', error => {
            console.log(caller, 'Error:', error);
        }).end();
    }
    
    static leftPad(x, len, pad) { 
        x = x.toString();
        if (x.length >= len) return x;
        return ((pad || '0').repeat(len) + x).slice(-len); 
    }

    static getUID() {
        return ++uid;
    }
    static getUUID() {
        return ++uuid;
    }

    static isString(ref) {
        return Object.prototype.toString.call(ref) === '[object String]';
    }
    static isFunction(ref) {
        return typeof ref === 'function';
    }
}

module.exports = Util;