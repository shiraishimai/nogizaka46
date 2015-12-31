'use strict';
var fs = require('graceful-fs'),
    Util = require('./Util.js'),
    path = require('path'),
    http = require('http');

class ImageSearcher {
    constructor(sourceUrl) {
        this.sourceUrl = sourceUrl;
        this.failTolerance = 5;
        this.index = 0;
    }
    getImage() {
        let image = {},
            reg = new RegExp(/\d+(?!.*\d)/),
            target = this.sourceUrl.match(reg).toString();
        // image.requestUrl = this.sourceUrl.replace(reg, Util.zpad(this.index++, target.length));
        image.requestUrl = this.sourceUrl.replace(reg, this.index++);
        return image;
    }
    parse() {
        // Break down links
        let attempt = success => {
                if (!success) this.failTolerance--;
                if (this.failTolerance <= 0) return; // Exit
                return this.imageRequest(this.getImage(), attempt);
            };
        // Attempts
        this.imageRequest(this.getImage(), () => {});  // Force attempt
        this.imageRequest(this.getImage(), attempt);
    }
    imageRequest(image, callback) {
        let signature = '[ImageSearcher imageRequest]';
        if (!image.requestUrl) return console.warn(signature, 'RequestUrl empty!');
        console.log(signature, image.requestUrl);
        Util.request(signature, image.requestUrl, result => {
            if (result.statusCode !== 200) {
                console.log(signature, 'Error status:', result.statusCode, image.requestUrl);
                return callback(false);
            }
            // Bounce back
            console.log(signature, 'OK', image.requestUrl);
            callback(true);
            this.saveImageFromStream(signature, image, result, success => {
                // @TODO callback?                   
            });
        });
    }
    saveImageFromStream(caller, image, readStream, callback) {
        let signature = '[ImageSearcher saveImageFromStream]',
            destination = './imgData/' + path.basename(image.requestUrl),
            writeStream = fs.createWriteStream(destination);
        readStream.pipe(writeStream);
        readStream.on('end', () => {
            console.log(destination, 'saved!');
        });
    }
}

module.exports = ImageSearcher;