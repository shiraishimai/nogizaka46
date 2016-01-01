'use strict';
var fs = require('graceful-fs'),
    Util = require('./Util.js'),
    path = require('path'),
    http = require('http');
    
class BaseImageSearcher {
    constructor(sourceUrl, limit) {
        this.sourceUrl = sourceUrl;
        this.failTolerance = 5;
        this.readCount = 0;
        this.limit = limit;
        this.index = 0;
    }
    getImage() {
        let image = {},
            reg = new RegExp(/\d+(?!.*\d)/),
            target = this.sourceUrl.match(reg).toString();
        // Break down links
        switch (true) {
            // Padding zero
            case !!~this.sourceUrl.indexOf('natalie'):
            case !!~this.sourceUrl.indexOf('wws'):
                image.requestUrl = this.sourceUrl.replace(reg, Util.zpad(this.index++, target.length));
                break;
            // No padding
            case !!~this.sourceUrl.indexOf('tokyopopline'):
            case !!~this.sourceUrl.indexOf('mdpr'):
            default:
                image.requestUrl = this.sourceUrl.replace(reg, this.index++);
                break;
        }
        image.quality = 10;
        return image;
    }
    parseAt() {
        let reg = new RegExp(/\d+(?!.*\d)/),
            target = this.sourceUrl.match(reg).toString();
        this.index = parseInt(target);
        return this.parse();
    }
    parse() {
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
        if (this.readCount >= this.limit) return console.log(signature, 'Limit reached!');   // Exit
        console.log(signature, image.requestUrl);
        Util.request(signature, image.requestUrl, result => {
            if (result.statusCode !== 200) {
                console.log(signature, 'Error status:', result.statusCode, image.requestUrl);
                return callback(false, image);
            }
            // Bounce back
            console.log(signature, 'OK', image.requestUrl);
            callback(true, image);
            this.readCount++;
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

// mantan-web.jp
class QualityImageSearcher extends BaseImageSearcher {
    constructor(sourceUrl, limit) {
        super(sourceUrl, limit);
        this.failTolerance = 6;
    }
    getImage() {
        let image = {},
            reg = new RegExp(/(\d+)(_size)\d+/),
            target = this.sourceUrl.match(reg)[1];
        image.quality = 10;
        image.requestUrl = this.sourceUrl.replace(reg, Util.zpad(this.index++, target.length)+'$2'+image.quality);
        return image;
    }
    parse() {
        let setQuality = (image, quality) => {
                image.requestUrl = image.requestUrl.replace(/(_size)\d+/, '$1'+quality);
            }, attempt = success => {
                if (!success) this.failTolerance--;
                if (this.failTolerance <= 0) return; // Exit
                return this.imageRequest(this.getImage(), qualityAttempt);
            }, qualityAttempt = (success, image) => {
                if (success) return attempt(success);
                // Fail
                image.quality--;
                if (image.quality < 3) return attempt(success); // Quality too low, consider fail
                // Set quality
                setQuality(image, image.quality);
                return this.imageRequest(image, qualityAttempt);
            };
        // Attempts
        this.imageRequest(this.getImage(), qualityAttempt);
    }
}

let ImageSearcher = (sourceUrl, limit) => {
    if (!!~sourceUrl.indexOf('mantan')) {
        return new QualityImageSearcher(sourceUrl, limit);
    }
    return new BaseImageSearcher(sourceUrl, limit);
};

module.exports = ImageSearcher;