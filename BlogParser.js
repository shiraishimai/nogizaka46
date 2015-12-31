'use strict';
var gm = require('gm'),
    url = require('url'),
    path = require('path'),
    crypto = require('crypto'),
    fs = require('graceful-fs'),
    Util = require('./Util.js'),
    promise = require('bluebird'),
    // Image = require('./Image.js'),
    cheerio = require('cheerio');

let fileArray = [];
    
class Parser {
    constructor(urlLink) {
        console.log('[Parser constructor]');
        this.sourceUrl = url.parse(urlLink);
    }
    parse() {
        console.log('[Parser parse]')
    }
    static saveImageFromStream(caller, image, readStream, callback) {
        // let signature = '[Parser saveImageFromStream]',
        //     destination = './img'+Util.getUID()+'.jpg',
        //     // destination = './imgData/'+new Date().getTime()+'.jpg',
        //     writeStream = fs.createWriteStream(destination);
        //     // writeStream = fs.createWriteStream(destination),
        //     // hashing = crypto.createHash('md5');
        // console.log(signature);
        // hashing.setEncoding('base64');
        // readStream.pipe(writeStream);
        // // readStream.pipe(hashing);
        // readStream.on('end', () => {
        //     // let hash = hashing.read();
        //     // console.log(signature, destination, 'stream ends', hash);
        //     console.log(signature, destination, 'stream ends');
        //     image.destination = destination;
        //     // image.hash = hash;
        //     return callback(true);
        // });
        let signature = '[Parser saveImageFromStream]', fileExtension, destination, writePromise, gmStream;
        console.log(signature, 'from', caller);

        readStream.on('end', () => {
            console.log(signature, 'read stream ends');
            return callback(true);
        });

        writePromise = new promise((resolve, reject) => {
            gmStream = gm(readStream).format(function(error, properties) {
                if (error) return console.log(signature, 'Error identifying', fileSaveStream.req.path, error);
                // let fileExtension, destination, writeStream;
                console.log(signature, properties);
                switch (properties) {
                    case 'JPEG':
                        fileExtension = '.jpg';
                        break;
                    case 'GIF':
                        fileExtension = '.gif';
                        break;
                    case 'PNG':
                        fileExtension = '.png';
                        break;
                    default:
                        console.log('Format not found!', properties);
                        fileExtension = '.jpg';
                        break;
                }
                destination = image.filename ? './imgData/' + image.filename : './imgData/img'+Util.getUID()+fileExtension;
                if (!~fileArray.indexOf(destination)) {
                    fileArray.push(destination);
                    return resolve(fs.createWriteStream(destination));
                }
                // Rename
                destination = './imgData/blog' + Util.getUUID() + path.extname(destination);
                return resolve(fs.createWriteStream(destination));
                // fs.stat(destination, (error, stats) => {
                //     // If file not found should have ENOENT error
                //     // if (error) return resolve(fs.createWriteStream(destination));
                //     if (error) return console.log('Create file', destination);  //@DEBUG
                //     destination = './imgData/' + (new Date()).getTime() + path.extname(destination);
                //     // return resolve(fs.createWriteStream(destination));
                //     return console.log('Create file', destination);  //@DEBUG
                // });
            }).stream();
        });
        writePromise.then(writeStream => {
            gmStream.pipe(writeStream);
            gmStream.on('end', () => {
                console.log(signature, destination, 'GM stream ends');
            });
        }).error(error => {
            console.log(signature, 'Operational Error:', error);
        }).catch(error => {
            console.log(signature, 'Error:', error);
        });
    }
    static getOptionsFromURL(_url) {
        return {
            host: _url.host,
            port: _url.port,
            path: _url.path,
            method: 'GET'
        }
    }
}

class BlogParser extends Parser {
    static get URL_LINK() {return 'http://blog.nogizaka46.com/';}
    constructor (urlLink) {
        console.log('[BlogParser constructor]');
        super(urlLink || BlogParser.URL_LINK);
        this.parser = 'BlogParser';
    }
    parse(callback) {
        console.log('[BlogParser parse]');
        let internalParser = (body) => {
            // Parser
            let $ = cheerio.load(body),
                imageArray = [],
                imageElementArray = $('.entrybody').find('img');
                
            imageElementArray.each((index, imageElement) => {
                let image = {};
                // Image with HyperLink
                if ($(imageElement).parent().is('a')) {
                    // Create Image Object
                    let src = $(imageElement).parent().attr('href');
                        // image = new Image({
                        //     fastIdentifier: $(imageElement).attr('src'),
                        //     parser: this.parser
                        // });
                    
                    // Extract direct image
                    if (!src.match(/php/g)) {
                        image.requestUrl = src;
                        image.filename = path.basename(src);
                        this.imageRequest(image, success => {
                            // @TODO
                        });

                        // End check
                        if (index === imageElementArray.length-1) {
                            callback(imageArray);
                        }
                        return;
                    }
                    // Extract PHP protected image
                    image.requestUrl = src.replace('img1', 'img2').replace('id=', 'sec_key=');
                    this._tokenRequest(src, token => {
                        image.token = token;
                        this.imageRequest(image, success => {
                            console.log(success, token, image.requestUrl);
                            if (success) {
                                // imageArray.push(image);
                            }
                            // End check
                            if (index === imageElementArray.length-1) {
                                callback(imageArray);
                            }
                        });
                    });
                    return;
                }
                // Image without HyperLink
                image.requestUrl = $(imageElement).attr('src');
                image.filename = path.basename(image.requestUrl);
                image.element = $(imageElement);
                this.imageRequestCheckSize(image, success => {
                    // @TODO
                });
                // End check
                if (index === imageElementArray.length-1) {
                    callback(imageArray);
                }
            });
        };
        // Parse all pages
        let page = 1, timeInterval;
        this._pageRequest(page, internalParser);
        timeInterval = setInterval(() => {
            if (++page > 15) return clearInterval(timeInterval);
            this._pageRequest(page, internalParser);
        }, 15*1000);
    }
    _pageRequest(pageNumber, callback) {
        let signature = '[BlogParser _pageRequest]';
        console.log(signature);
        Util.request(signature, this.sourceUrl.resolve('?p='+pageNumber), result => {
            let body = "";
            result.setEncoding('utf8');
            result.on('data', line => {
                body += line;
            }).on('end', () => {
                // return body
                callback(body);
            });
        });
    }
    _tokenRequest(tokenUrl, callback) {
        let signature = '[BlogParser _tokenRequest]';
        console.log(signature, tokenUrl);
        Util.request(signature, tokenUrl, result => {
            // Get PHPSession
            let token = result.headers['set-cookie'][0];
            if (!token) return console.log(signature, 'Unexpected Error, no token');
            callback(token);
        });
    }
    imageRequest(image, callback) {
        let signature = '[BlogParser imageRequest]';
        if (!image.requestUrl) {
            return console.warn(signature, 'RequestUrl not found, maybe dummy image');
        }
        console.log(signature, image.token, image.requestUrl);
        let options = Parser.getOptionsFromURL(url.parse(image.requestUrl));
        // PHPSession injection
        if (image.token) {
            options.headers = {
                'Cookie': image.token
            };
        }
        Util.request(signature, options, result => {
            if (result.statusCode !== 200) {
                console.log(signature, 'Error status:', result.statusCode);
                return callback(false);
            }
            Parser.saveImageFromStream(signature, image, result, success => {
                callback(success);
            });
        });
    }
    imageRequestCheckSize(image, callback) {
        let signature = '[BlogParser imageRequestCheckSize]';
        if (!image.requestUrl) {
            return console.warn(signature, 'RequestUrl not found, maybe dummy image');
        }
        console.log(signature, image.requestUrl);
        let options = Parser.getOptionsFromURL(url.parse(image.requestUrl));
        Util.request(signature, options, result => {
            if (result.statusCode !== 200) {
                console.log(signature, 'Error status:', result.statusCode);
                return callback(false);
            }
            let gmStream, writePromise;
            writePromise = new promise((resolve, reject) => {
                gmStream = gm(result).size((error, properties) => {
                    if (error) return console.log(signature, 'Error:', error);
                    console.log(signature, properties);
                    if (properties.width < 150 || properties.height < 150) return;
                    resolve(gmStream);
                }).stream();
            });
            writePromise.then(writeStream => {
                Parser.saveImageFromStream(signature, image, writeStream, success => {
                    callback(success);
                });
            });
        });   
    }
}

module.exports = BlogParser;