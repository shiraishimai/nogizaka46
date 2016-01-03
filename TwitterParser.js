'use strict';
const SUFFIX_ORIG = ':orig';

var path = require('path'),
    fs = require('graceful-fs'),
    Util = require('./Util.js'),
    cheerio = require('cheerio');

class TwitterParser {
    constructor(urlLink) {
        console.log('[TwitterParser constructor]');
        this.sourceUrl = urlLink;
    }
    parse(callback) {
        let signature = '[TwitterParser parse]';
        Util.request(signature, this.sourceUrl, (result) => {
            let body = "";
            result.setEncoding('utf8');
            result.on('data', line => { body+=line; }).on('end', () => {
                this.fetchImageElement(cheerio.load(body));
            });
        });
    }
    fetchImageElement($) {
        let signature = '[TwitterParser fetchImageElement]';
        console.log(signature);
        $(".AdaptiveMedia-photoContainer").each((index, imageElement) => {
            let image = {};
            image.requestUrl = $(imageElement).attr('data-image-url') + SUFFIX_ORIG;
            this.imageRequest(image);
        });
    }
    imageRequest(image, callback) {
        let signature = '[TwitterParser imageRequest]';
        if (!image.requestUrl) return console.warn(signature, 'RequestUrl empty!');
        console.log(signature, image.requestUrl);
        Util.request(signature, image.requestUrl, result => {
            if (result.statusCode !== 200) {
                return console.log(signature, 'Error status:', result.statusCode, image.requestUrl);
            }
            // Bounce back
            console.log(signature, 'OK', image.requestUrl);
            this.saveImageFromStream(signature, image, result, success => {
                // @TODO callback?
            });
        });
    }
    saveImageFromStream(caller, image, readStream, callback) {
        let signature = '[TwitterParser saveImageFromStream]',
            destination = './imgData/' + path.basename(image.requestUrl.replace(SUFFIX_ORIG, '')),
            writeStream = fs.createWriteStream(destination);
        readStream.pipe(writeStream);
        readStream.on('end', () => {
            console.log(destination, 'saved!');
        });
    }
}

module.exports = TwitterParser;