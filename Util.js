'use strict';
var promise = require('bluebird'),
    https = require('https'),
    http = require('http'),
    uuid = 0,
    uid = 20396;

class Util {
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
    
    static zpad(x, zeros) { 
        x = x.toString();
        if (x.length >= zeros) return x;
        return ('0'.repeat(zeros) + x).slice(-zeros); 
    }

    static getUID() {
        return ++uid;
    }
    static getUUID() {
        return ++uuid;
    }
}

module.exports = Util;