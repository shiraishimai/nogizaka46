'use strict';
let gm = require('gm'),
    Url = require('url'),
    path = require('path'),
    crypto = require('crypto'),
    Stream = require('stream'),
    fs = require('graceful-fs'),
    Seed = require('./Seed.js'),
    Util = require('./Util.js'),
    cheerio = require('cheerio'),
    Request = require('request'),
    promise = require('bluebird'),
    config = require('./config.js'),
    regexAddSuffix = (source) => {
        let regex = /(\d+)(?=\)\D*$)/;
        if (!regex.test(source)) {
            return source.replace(/\.[^.]+$/, "(0)$&");
        }
        return source.replace(regex, (selection, match, index, fullText) => {
            return parseInt(selection) + 1;
        });
    },
    hashingPromise = (stream) => {
        return new promise((resolve, reject) => {
            let hashing = crypto.createHash('md5').setEncoding('hex');
            stream.pipe(hashing);
            hashing.on('finish', () => {
                resolve(hashing.read());
            });
            hashing.on('error', error => {
                console.log("[hashingPromise error]", error);
                resolve(null);
            });
        });
    },
    namingPromise = (stream, filename) => {
        return new promise((resolve, reject) => {
            gm(stream).format({bufferStream: true}, (error, properties) => {
                if (error) {
                    console.log('[namingPromise error]', error);
                    return resolve(filename);
                }
                filename = filename.replace(/\.[^.]*$/, '');    // Remove extensions & params
                switch (properties) {
                    case 'JPEG':
                        filename += '.jpg';
                        break;
                    case 'GIF':
                        filename += '.gif';
                        break;
                    case 'PNG':
                        filename += '.png';
                        break;
                    case 'TIFF':
                        filename += '.tiff';
                        break;
                    case 'BMP':
                        filename += '.bmp';
                        break;
                    default:
                        console.log('[namingPromise] Undetected image format:', properties);
                        filename += '.jpg';
                        break;
                }
                resolve(filename);
            });
        });
    },
    dataDisposalPromise = (readStream, writeStream) => {
        return new promise((resolve, reject) => {
            readStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    },
    /**
     * @return [<Stream> stream, <String> filename]
     */
    requestStreamPromise = (options) => {
        return new promise((resolve, reject) => {
            let stream = Request(options).on('response', response => {
                if (response.statusCode !== 200) {
                    return reject(['NetworkError', response.statusCode, JSON.stringify(options)].join(' '));
                }
                let dataDisposition = response.headers['content-disposition'],
                    filenameFound = dataDisposition && dataDisposition.match(/filename=(.*)/i),
                    filename; 
                if (filenameFound && filenameFound.length >= 2) {
                    filename = decodeURIComponent(filenameFound[1].replace(/['"]/g, ''));
                } else {
                    filename = path.basename(options.url || url);
                }
                resolve([stream, filename]);
            })
            .on('error', reject).pipe(Stream.PassThrough());
        });
    },
    requestPromise = promise.promisify(Request),
    // @param <Function> processDelegate(<Object>)
    batchProcess = (seed, processDelegate) => {
        return new promise((resolve, reject) => {
            let promises = [],
                success = 0,
                fail = 0;
            for (let obj of seed) {
                promises.push(processDelegate(obj).then(result => {
                    console.log((++success)+'/'+(success+fail)+':', obj, 'saved to', result);
                }).catch(error => {
                    console.log('\x1b[31m', (++fail)+'/'+(success+fail)+':', 'Failed saving', obj, '\nError:', error, '\x1b[0m');
                }));
            }
            return promise.all(promises).then(() => {
                console.log('[batchProcess] Completed execution...');
            });
        });
    },
    createWriteStream = (targetPath) => {
        if (!Util.isDirectoryExist(path.dirname(targetPath))) {
            let mkdirp = require('mkdirp');
            mkdirp.sync(path.dirname(targetPath));
        }
        return fs.createWriteStream(targetPath);
    },
    renamePromise = (inputTarget, outputTarget) => {
        return new promise((resolve, reject) => {
            while (Util.isFileExist(outputTarget)) {
                outputTarget = regexAddSuffix(outputTarget);
            }
            fs.rename(inputTarget, outputTarget, (error, result) => {
                if (error) {
                    console.log('[FS Rename] temp file', inputTarget, 'failed to rename', outputTarget, 'with Error:', error);
                    return resolve(inputTarget);
                }
                return resolve(outputTarget);
            });
        });
    },
    tokenRequestPromise = (url) => {
        return requestPromise(url).then(response => {
            if (response.statusCode !== 200) {
                throw ['NetworkError', response.statusCode, url].join(' ');
            }
            let cookie = response.headers['set-cookie'];
            return cookie && cookie[0] || cookie;
        }).catch(error => {
            console.log('[tokenRequestPromise] Error:\n', error);
            throw error;
        });
    };

let imagesDisposalRequest = (seed) => {
        console.log('[imagesDisposalRequest]');
        return batchProcess(seed, url => {
            return requestStreamPromise(url)
            .spread((stream, filename) => {
                let promises = [],
                    target = path.resolve(dir, filename, '..', String(Util.getUUID()));
                promises.push(hashingPromise(stream));
                promises.push(namingPromise(stream, filename));
                stream.pipe(createWriteStream(target));
                stream.on('end', () => {
                    console.log('[ReadStream] completed', url);
                });
                return promise.all(promises).spread((hash, name) => {
                    return renamePromise(target, path.resolve(dir, name));
                });
            });
        });
    };
let blogImageDisposalPromise = (tokenUrl) => {
        let imageUrl = tokenUrl.replace('img1', 'img2').replace('id=', 'sec_key=');
        return tokenRequestPromise(tokenUrl)
            .then(token => {
                return requestStreamPromise({
                    url: imageUrl,
                    headers: {
                        'Cookie': token
                    }
                });
            })
            .spread((stream, filename) => {
                let promises = [],
                    target = path.resolve(dir, filename, '..', String(Util.getUUID()));
                promises.push(hashingPromise(stream));
                promises.push(namingPromise(stream, filename));
                stream.pipe(createWriteStream(target));
                stream.on('end', () => {
                    console.log('[ReadStream] completed', tokenUrl);
                });
                return promise.all(promises).spread((hash, name) => {
                    return renamePromise(target, path.resolve(dir, name));
                });
            });
    },
    blogImagesDisposalRequest = (seed) => {
        // console.log('[blogImagesDisposalRequest]');
        return batchProcess(seed, blogImageDisposalPromise);
    };

let pagePromise = (options) => {
        console.log('[pagePromise]', options);
        return requestPromise(options).then(response => {
            // console.log('X-CACHE:', response.headers['x-cache']);
            // console.log('X-ORIGIN-DATE:', response.headers['x-origin-date']);
            if (response.statusCode !== 200) {
                throw ['NetworkError', response.statusCode, JSON.stringify(options)].join(' ');
            }
            return response.body;
        }).catch(error => {
            console.log('[pagePromise] Error:\n', error);
            throw error;
        });
    },
    getMemberDictionaryPromise = () => {
        // console.log('[getMemberDictionaryPromise]');
        return pagePromise(config.blogUrl).then(body => {
            let memberDictionary = {},
                $ = cheerio.load(body),
                memberElementArray = $('#sidemember').find('a');
            memberElementArray.each((index, memberElement) => {
                memberElement = $(memberElement);
                let url = memberElement.attr('href'),
                    key = url.replace(/^\W+/, ''),
                    value = memberElement.find('span[class=kanji]').text();
                memberDictionary[key] = {
                    'name': value || key,
                    'url': url
                };
            });
            return memberDictionary;
        });
    },
    parseImageUrls = (body) => {
        // console.log('[parseImageUrls]');
        let urlArray = [],
            $ = cheerio.load(body),
            imageElementArray = $('.entrybody').find('img');
        imageElementArray.each((index, imageElement) => {
            imageElement = $(imageElement);
            let hyperLink = imageElement.closest('a');
            if (hyperLink.get().length) {
                urlArray.push(hyperLink.attr('href'));
            } else {
                urlArray.push(imageElement.attr('src'));
            }
        });
        return urlArray;
    },
    parseMembersPromise = () => {
        // console.log('[parseMembersPromise]');
        return getMemberDictionaryPromise().then(dict => {
            let seed = new Seed('http://blog.nogizaka46.com/mai.shiraishi/?p={}', Seed.integerGenerator(24, 1));
            return batchProcess(seed, url => {
                return pagePromise(url)
                    .then(parseImageUrls)
                    // .then(urlArray => {return new Seed(urlArray);})
                    .then(blogImagesDisposalRequest);
                    // .then(imagesDisposalRequest);
                    // .then(getPages.bind(this, pageNumber++));
                    // @TODO: unleash recursion
            });
        });
    };
let dir = 'img/blog/';
parseMembersPromise().then(() => {
    console.log('Task completed!');
});
// blogImageDisposalPromise('http://dcimg.awalker.jp/img1.php?id=DDlpr23DwYnfmhETU5mmXFoJ9GgPrCVhNaucxoyirzMkG3X0xxVUiiwiL3NgBs5xy73EoNtC1BI3q1zRKkbPLyTYnRwDZKPXdr0f1IWM6usPUWrV8m0mFa0hcnSMeSOBaKvv2UhGAv191ZuEHsq2y1M4R2Hh2qVxXzPeNYvZ8cbfK2qwCsHTMyfzExwzdFJBmFjy39Mi').then(result => {
//  console.log(result);
// });
// pagePromise('http://blog.nogizaka46.com/manatsu.akimoto/?p=2').then(parseImageUrls);
// pagePromise('http://blog.nogizaka46.com/').then(parseImageUrls).then(arr => {
//  console.log(arr);
// });
// getMemberDictionaryPromise().then(dict => {
//  let seed = new Seed('http://blog.nogizaka46.com/{manatsu.akimoto}/?p={}', Object.keys(dict), integerGenerator(2, 1));
//  for (let x of seed) {
//      console.log(x);
//  }
// });