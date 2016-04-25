'use strict';
const 
    CHECK_FILE_REGEX = /\(\d+\)(?=[^)]*$)/, // check whether it has ()
    OLD_FILE_REGEX = /(\d+)(?=\)\D*$)/, // get number inside ()
    NEW_FILE_REGEX = /\.[^.]+$/,    // get path without extension
    BASE64 = 'base64',
    TEMP_FOLDER = 'temp/',
    CMD_CLEAN = 'clean',
    CMD_DEPTH = '--depth';

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
    requestPromise = promise.promisify(Request),
    readdirPromise = promise.promisify(fs.readdir),
    regexAddSuffix = (source) => {
        let dirDiff = path.relative(path.resolve(config.imgDir), source);
        // Check if fileIndex exist
        if (fileIndex.has(dirDiff)) {
            let index = fileIndex.get(dirDiff) + 1;
            fileIndex.set(dirDiff, index);
            return source.replace(NEW_FILE_REGEX, "("+index+")$&");
        }
        // Check if source is fresh
        if (!CHECK_FILE_REGEX.test(source)) {
            // Add file to fileIndex
            fileIndex.set(dirDiff, 0);
            return source.replace(NEW_FILE_REGEX, "(0)$&");
        }
        // If source has quotational expression
        return source.replace(OLD_FILE_REGEX, (selection, match, index, fullText) => {
            return parseInt(selection) + 1;
        });
    },
    hashingPromise = (stream, encoding) => {
        encoding = encoding || BASE64;  // Can be 'hex'
        return new promise((resolve, reject) => {
            let hashing = crypto.createHash('md5').setEncoding(encoding);
            stream.pipe(hashing);
            hashing.on('finish', () => {
                // If BASE64, last 2 char will be '=='
                let hash = encoding === BASE64 ? (hashing.read()).slice(0, -2) : hashing.read();
                if (hashTable.has(hash)) {
                    reject(['Hash already exist!', hash].join(' '));
                } else {
                    // Add to hashTable
                    hashTable.add(hash);    
                    resolve(hash);
                }
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
    sizeCheckPromise = (stream, filename) => {
        return new promise((resolve, reject) => {
            gm(stream).size({bufferStream: true}, (error, properties) => {
                if (error) {
                    console.log('[sizeCheckPromise error]', error);
                    return resolve();
                }
                if (properties.width < 150 || properties.height < 150) return reject('Size too small');
                return resolve(properties);
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
                    filename = path.basename(options.url || options);
                }
                resolve([stream, filename]);
            })
            .on('error', reject).pipe(Stream.PassThrough());
        });
    },
    // @param <Function> processDelegate(<Object>) => Promise
    batchProcess = (seed, processDelegate) => {
        if (!Util.isFunction(processDelegate)) return promise.reject('processDelegate is not a function');
        let promises = [],
            success = 0,
            fail = 0;
        for (let obj of seed) {
            promises.push(processDelegate(obj).then(result => {
                console.log((++success)+'/'+(success+fail)+':', obj, '=>', result);
            }).catch(error => {
                console.log('\x1b[31m', (++fail)+'/'+(success+fail)+':', 'Failed on', obj, '\nError:', error, '\x1b[0m');
            }));
        }
        return promise.all(promises).then(resultArray => {
            console.log('[batchProcess] Completed execution...', resultArray.length);
            return resultArray.length;
        });
    },
    // @param <Function> processDelegate(<Object>) => Promise
    sequentialProcess = (seed, processDelegate) => {
        if (!Util.isFunction(processDelegate)) return promise.reject('processDelegate is not a function');
        let iterator = seed.getIterator && seed.getIterator() || seed[Symbol.iterator](),
            success = 0,
            fail = 0,
            obj,
            recursiveExecute = (accumulation) => {
                accumulation = accumulation || 0;
                if (obj = iterator.next().value) {
                    return processDelegate(obj).then(result => {
                        console.log((++success)+'/'+(success+fail)+':', obj, '=>', result);
                        return Util.isNumber(result) ? (accumulation + result) : 0;
                    }).catch(error => {
                        console.log('\x1b[31m', (++fail)+'/'+(success+fail)+':', 'Failed on', obj, '\nError:', error, '\x1b[0m');
                        return accumulation;
                    }).finally(recursiveExecute);
                }
                return accumulation;
            };
        return recursiveExecute().then(result => {
            console.log('[sequentialProcess] Completed execution...', result);
            return result;
        });
    },
    // @param <Function> processDelegate(<Object>) => Promise
    sequentialEachProcess = (seed, processDelegate) => {
        if (!Util.isFunction(processDelegate)) return promise.reject('processDelegate is not a function');
        let iterator = seed.getIterator && seed.getIterator() || seed[Symbol.iterator](),
            success = 0,
            fail = 0,
            obj,
            recursiveExecute = (accumulation) => {
                accumulation = accumulation || 0;
                if (obj = iterator.next().value) {
                    return seed.applyParamInstances(processDelegate).then(result => {
                    console.log((++success)+'/'+(success+fail)+':', obj, '=>', result);
                        return Util.isNumber(result) ? (accumulation + result) : 0;
                    }).catch(error => {
                        console.log('\x1b[31m', (++fail)+'/'+(success+fail)+':', 'Failed on', obj, '\nError:', error, '\x1b[0m');
                        return accumulation;
                    }).then(recursiveExecute);
                }
                return accumulation;
            };
        seed.activateParamInstance();
        return recursiveExecute().then(result => {
            console.log('[sequentialEachProcess] Completed execution...', result);
            seed.deactivateParamInstance();
            return result;
        });
    },
    createWriteStream = (targetPath) => {
        if (!Util.isDirectoryExist(path.dirname(targetPath))) {
            console.log('Directory not exist!');
            let mkdirp = require('mkdirp');
            mkdirp.sync(path.dirname(targetPath));
        }
        return fs.createWriteStream(targetPath);
    },
    renamePromise = (inputTarget, outputTarget) => {
        return new promise((resolve, reject) => {
            if (!Util.isDirectoryExist(path.dirname(outputTarget))) {
                console.log('Directory not exist!', outputTarget);
                let mkdirp = require('mkdirp');
                mkdirp.sync(path.dirname(outputTarget));
            }
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
    removeDirPromise = (removingDir) => {
        if (!Util.isDirectoryExist(removingDir)) return promise.resolve();
        let unlinkPromise = promise.promisify(fs.unlink),
            rmdirPromise = promise.promisify(fs.rmdir),
            removingFile;
        return readdirPromise(removingDir).then(list => {
            return batchProcess(list, file => {
                removingFile = path.resolve(removingDir, file);
                return unlinkPromise(removingFile);
            });
        }).then(() => {
            return rmdirPromise(removingDir);
        }).then(() => {
            console.log('Clean up completed!', removingDir);
        }).catch(error => {
            console.log('Clean up Error:', error);
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

// @deprecate
// let imagesDisposalRequest = (seed, dir) => {
//         console.log('[imagesDisposalRequest]');
//         dir = dir || config.blogDir; // @TODO other default dir
//         return batchProcess(seed, url => {
//             return requestStreamPromise(url)
//             .spread((stream, filename) => {
//                 let promises = [],
//                     target = path.resolve(dir, filename, '..', String(Util.getUUID()));
//                 promises.push(hashingPromise(stream));
//                 promises.push(namingPromise(stream, filename));
//                 stream.pipe(createWriteStream(target));
//                 stream.on('end', () => {
//                     console.log('[ReadStream] completed', url);
//                 });
//                 return promise.all(promises).spread((hash, name) => {
//                     return renamePromise(target, path.resolve(dir, name));
//                 });
//             });
//         });
//     };
let blogImageDisposalPromise = (tokenUrl, dir, memberId) => {
        dir = dir || config.blogDir;
        memberId = memberId || '';
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
                    tempFile = path.resolve(dir, TEMP_FOLDER, String(Util.getUUID()));
                promises.push(hashingPromise(stream).then(hash => {
                    // Register hash to temporary dictionary as a key to remove hash from hashTable
                    tempHash.add(hash);
                    return hash;
                }));
                promises.push(namingPromise(stream, filename));
                promises.push(sizeCheckPromise(stream));
                stream.pipe(createWriteStream(tempFile));
                stream.on('end', () => {
                    console.log('[ReadStream] completed', tokenUrl);
                });
                return promise.all(promises).spread((hash, name) => {
                    tempHash.delete(hash);
                    return renamePromise(tempFile, path.resolve(dir, memberId, name));
                }).catch(error => {
                    console.log('[blogImageDisposalPromise] suppress:', error);
                });
            });
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
    parseMembersPromise = (dir) => {
        return getMemberDictionaryPromise().then(dict => {
            let seed = new Seed('http://blog.nogizaka46.com/{mai.shiraishi}/?p={}', Object.keys(dict), Seed.integerGenerator(pageDepth, 1));
            return sequentialEachProcess(seed, (url, memberId, page) => {
                return pagePromise(url)
                    .then(parseImageUrls)
                    .then(seed => {
                        return batchProcess(seed, tokenUrl => {
                            return blogImageDisposalPromise(tokenUrl, dir, memberId);
                        });
                    });
            });
        });
    };

let dir = config.blogDir,
    pageDepth = 24;

let fileIndex = new Map(),
    hashTable = new Set(),
    tempHash = new Set(),
    start = () => {
        try {
            // Check flags
            let hasDepth = false;
            for (let argument of process.argv) {
                if (argument === CMD_CLEAN) {
                    throw console.log('Force rebuild indexing...');
                }
                if (argument === CMD_DEPTH) {
                    hasDepth = true;
                }
                if (hasDepth === true && Util.isNumber(argument)) {
                    pageDepth = parseInt(argument) || pageDepth;
                    hasDepth = false;
                }
            }
            // Prepare database
            let database;
            database = require(config.databasePath);
            hashTable = new Set(database.hashTable);
            fileIndex = new Map(database.fileIndex);
            return promise.resolve();
        } catch (error) {
            console.log('Unable to load', config.databasePath);
            // remove temp folder if exist
            return removeDirPromise(path.resolve(dir, TEMP_FOLDER)).catch(error => {}).finally(() => {
                return promise.all([
                    // Prepare hashTable
                    recursiveReadDirPromise(dir, file => {
                        return hashingPromise(fs.createReadStream(file));
                    }),
                    // Prepare file indexing for optimization (Optional)
                    recursiveReadDirPromise(dir, file => {
                        if (!CHECK_FILE_REGEX.test(file)) return promise.resolve();
                        let key = file.replace(CHECK_FILE_REGEX, ''),
                            match = file.match(OLD_FILE_REGEX),
                            index;
                        key = path.relative(path.resolve(config.imgDir), key);
                        match = match && match[0];
                        index = parseInt(match || 0);
                        if (!fileIndex.has(key) || fileIndex.get(key) < index) {
                            fileIndex.set(key, index);
                        }
                        return promise.resolve();
                    })
                ]);
            }).catch(error => {
                console.log('[Prepare] Error:', error);
            });
        }
    }, end = () => {
        // Save database
        fs.writeFileSync(config.databasePath, JSON.stringify({
            hashTable: [...hashTable],
            fileIndex: [...fileIndex]
        }));
        console.log('End of process');
    };

let recursiveReadDirPromise = (dir, promiseDelegate) => {
    if (!Util.isDirectoryExist(dir)) return promise.reject("[recursiveReadDirPromise] Directory doesn't exist");
    return readdirPromise(dir).then(list => {
        let promises = [],
            target;
        for (let file of list) {
            target = path.resolve(dir, file);
            // @TODO: use a general method to determine whether target is file or directory
            if (Util.isFileExist(target)) {
                promises.push(promiseDelegate(target));
            } else if (Util.isDirectoryExist(target)) {
                promises.push(recursiveReadDirPromise(target, promiseDelegate));
            }
        }
        return promise.all(promises);
    });
};

start().then(() => {
    return parseMembersPromise().then(() => {
        console.log('Task completed!');
    }).then(() => {
        console.log('Cleaning up...');
        let promises = [];
        // remove hash
        promises.push(new promise((resolve, reject) => {
            for (let hash of tempHash) {
                hashTable.delete(hash);
            }
            resolve();
        }));
        // remove temp files
        promises.push(removeDirPromise(path.resolve(dir, TEMP_FOLDER)));
        return promise.all(promises);
    });
}).finally(end);