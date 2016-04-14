'use strict';
const SUFFIX_ORIG = ':orig';

var cheerio = require('cheerio'),
    fs = require('graceful-fs'),
    Util = require('./Util.js'),
    path = require('path'),
    http = require('http');
class ImageFetcher {
    constructor(sourceUrl) {
        this.sourceUrl = sourceUrl;
    }
    imageRequest(image, callback) {
        let signature = '[ImageFetcher imageRequest]';
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
        let signature = '[ImageFetcher saveImageFromStream]',
            dataDisposition = readStream.headers['content-disposition'],
            filenameFound = dataDisposition.match(/filename=(.*)/),
            filename, destination, writeStream;

        filename = filenameFound.length >= 2 ? decodeURIComponent(filenameFound[1].replace(/['"]/g, '')) : path.basename(image.requestUrl);
        destination = './imgData/' + filename,
        writeStream = fs.createWriteStream(destination);
        readStream.pipe(writeStream);
        readStream.on('end', () => {
            console.log(destination, 'saved!');
        });
    }
}
class ImageSearcher extends ImageFetcher {
    constructor(sourceUrl, limit) {
        super(sourceUrl);
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
        if (this.readCount >= this.limit) return console.log(signature, 'Limit reached!');   // Exit
        super.imageRequest(image, (success, image) => {
            if (success) this.readCount++;
            return callback(success, image);
        });
    }
}
// mantan-web.jp
class QualityImageSearcher extends ImageSearcher {
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


class HTMLSearcher extends ImageFetcher {
    parse(callback) {
        let signature = '[HTMLSearcher parse]';
        this.getBody((body) => {
            this.fetchImageElement(cheerio.load(body));
        });
    }
    getBody(callback) {
        let signature = '[HTMLSearcher getBody]';
        Util.request(signature, this.sourceUrl, (result) => {
            let body = "";
            result.setEncoding('utf8');
            result.on('data', line => { body+=line; }).on('end', () => {
                callback(body);
            });
        });
    }
    fetchImageElement($) {
        // @Abstract function
        console.warn('[HTMLSearcher fetchImageElement] not implemented!');
    }
}
class TistoryImageSearcher extends HTMLSearcher {
    fetchImageElement($) {
        let signature = '[TistoryImageSearcher fetchImageElement]';
        console.log(signature);
        $(".imageblock > span").each((function (index, imageElement) {
            let image = {};
            image.requestUrl = $(imageElement).attr('dir');
            this.imageRequest(image);
        }).bind(this));
    }
}
class TwitterImageSearcher extends HTMLSearcher {
    fetchImageElement($) {
        let signature = '[TwitterParser fetchImageElement]';
        console.log(signature);
        $(".AdaptiveMedia-photoContainer").each((index, imageElement) => {
            let image = {};
            image.requestUrl = $(imageElement).attr('data-image-url') + SUFFIX_ORIG;
            this.imageRequest(image);
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

let ImageSearcherMultiplexer = (sourceUrl, limit) => {
    switch (true) {
        case !!~sourceUrl.indexOf('mantan'):
            return new QualityImageSearcher(sourceUrl, limit);
        case !!~sourceUrl.indexOf('tistory'):
            return new TistoryImageSearcher(sourceUrl);
        case !!~sourceUrl.indexOf('twitter'):
            return new TwitterImageSearcher(sourceUrl);
        default:
            return new ImageSearcher(sourceUrl, limit);
    }
};

module.exports = ImageSearcherMultiplexer;