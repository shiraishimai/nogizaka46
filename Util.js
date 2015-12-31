'use strict';
var promise = require('bluebird'),
    http = require('http'),
    uuid = 0,
    uid = 20396;

class Util {
    static request(caller, requestOption, callback) {
        http.request(requestOption, callback).on('error', error => {
            console.log(caller, 'Error:', error);
        }).end();
    }

    static getUID() {
        return ++uid;
    }
    static getUUID() {
        return ++uuid;
    }
}

module.exports = Util;