'use strict';
let promise = require('bluebird'),
    fs = require('graceful-fs'),
    https = require('https'),
    http = require('http'),
    uuid = 0,
    uid = 20396;

const STRING = '[object String]',
    FUNCTION = 'function';

class Util {
    static isNumber(ref) {
        return Number.isInteger(ref) || isNaN(ref) === false;
    }
    static isArray(ref) {
        return Array.isArray(ref);
    }
    static isString(ref) {
        return Object.prototype.toString.call(ref) === STRING;
    }
    static isFunction(ref) {
        return typeof ref === FUNCTION;
    }
    static isObject(ref) {
        return ref === Object(ref);
    }
    static isFileExist(filePath) {
        try {
            return fs.statSync(filePath).isFile();
        } catch (err) {
            return false;
        }
    }
    static isDirectoryExist(dirPath) {
        try {
            return fs.statSync(dirPath).isDirectory();
        } catch (err) {
            return false;
        }
    }
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
}

module.exports = Util;