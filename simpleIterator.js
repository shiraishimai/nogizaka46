'use strict';
let gm = require('gm'),
	Url = require('url'),
	path = require('path'),
	crypto = require('crypto'),
	Stream = require('stream'),
	fs = require('graceful-fs'),
	Util = require('./Util.js'),
	cheerio = require('cheerio'),
	Request = require('request'),
	promise = require('bluebird'),
	config = require('./config.js'),
	isString = (ref) => {
		return Object.prototype.toString.call(ref) === '[object String]';
	},
	isFunction = (ref) => {
		return typeof ref === 'function';
	},
	isObject = (ref) => {
		return ref === Object(ref);
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
				filename = filename.replace(/\.[^.]*$/, '');	// Remove extensions & params
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
	// destinationPromise = (dir, stream, filename) => {
	// 	// Form metadata
 //        let destination = path.resolve(dir || '.');
	// 	if (filename.indexOf('?') > 0) {
	// 		filename = filename.replace(/\?.*$/, '');	// Remove parameter
	// 	}
	// 	// Find extension
	// 	switch (path.extname(filename).toLowerCase()) {
	// 		case '.bmp':
	// 		case '.jpg':
	// 		case '.gif':
	// 		case '.png':
	// 		case '.jpeg':
	// 		case '.tiff':
	// 			break;
	// 		default:
	// 			// @TODO pipe to GM to obtain filename
	// 			return new promise((resolve, reject) => {
	// 				let gm = require('gm'),
	// 					gmStream = gm(stream).format((error, properties) => {
	// 						if (error) {
	// 							console.log('[GM Error]', error);
	// 							return resolve([stream, path.resolve(destination, filename, '.jpg')]);
	// 						}
	// 						console.log('[GM format]', properties);
	// 						switch (properties) {
	// 							case 'JPEG':
	// 								filename += '.jpg';
	// 								break;
	// 							case 'GIF':
	// 								filename += '.gif';
	// 								break;
	// 							case 'PNG':
	// 								filename += '.png';
	// 								break;
	// 							case 'TIFF':
	// 								filename += '.tiff';
	// 								break;
	// 							case 'BMP':
	// 								filename += '.bmp';
	// 								break;
	// 							default:
	// 								filename += '.jpg';
	// 								break;
	// 						}
	// 						destination = path.resolve(destination, filename);
	// 						return resolve([gmStream, destination]);
	// 					}).stream();
	// 			});
	// 			break;
	// 	}
	// 	destination = path.resolve(destination, filename);
	// 	return [stream, destination];
	// },
	/**
	 * @return [<Stream> stream, <String> filename]
	 */
	requestStreamPromise = (url) => {
		return new promise((resolve, reject) => {
			let stream = Request(url).on('response', response => {
				if (response.statusCode !== 200) {
	                return reject(['NetworkError', response.statusCode, url].join(' '));
	            }
	            let dataDisposition = response.headers['content-disposition'],
					filenameFound = dataDisposition && dataDisposition.match(/filename=(.*)/i),
					filename; 
				if (filenameFound && filenameFound.length >= 2) {
					filename = decodeURIComponent(filenameFound[1].replace(/['"]/g, ''));
				} else {
					filename = path.basename(url);
				}
	            resolve([stream, filename]);
			})
			.on('error', reject).pipe(Stream.PassThrough());
		});
	},
	requestPromise = promise.promisify(Request),
	// @param <Function> requestDelegate(<String> url)
	request = (seed, requestDelegate) => {
		console.log('[request]');
		return new promise((resolve, reject) => {
			let promises = [],
				success = 0,
				fail = 0;
			for (let url of seed) {
				promises.push(requestDelegate(url).then(result => {
					console.log((++success)+'/'+(success+fail)+':', url, "saved to", result);
				}).catch(error => {
					console.log((++fail)+'/'+(success+fail)+':', "Failed saving", url, "Error:", error);
				}));
			}
			return promise.all(promises).then(() => {
				console.log("Completed execution...");
			});
		});
	},
	createWriteStream = (targetPath) => {
		if (!fs.existsSync(path.dirname(targetPath))) {
			fs.mkdirSync(path.dirname(targetPath));
		}
		return fs.createWriteStream(targetPath);
	};

class Seed {
	constructor(url, regex, pool) {
		if (!regex || !pool) {
			this._iterator = this[Symbol.iterator] = function* () {
				if (Array.isArray(url)) {
					for (let seed of pool) yield seed;
				} else if (isObject(url)) {
					// Key/Value pair
					for (let key in url) {
						if (url.hasOwnProperty(key)) {
							let obj = url[key];
							obj.id = key;
							yield obj;
						}
					}
				} else {
					yield url;
				}
			};
		} else {
			let regexp = new RegExp(regex);
			this._iterator = this[Symbol.iterator] = function* () {
				pool = isFunction(pool) ? pool() : pool;
				for (let seed of pool) {
					yield url.replace(regexp, "$1"+seed+"$3");
				}
			};
		}
		return this;
	}
	subLoop(regex, pool) {
		let regexp = new RegExp(regex),
			outterLoop = this._iterator;
		this._iterator = this[Symbol.iterator] = function* () {
			let iterator = outterLoop();
			for (let result of iterator) {
				let newPool = isFunction(pool) ? pool() : pool;
				for (let seed of newPool) {
					yield result.replace(regexp, "$1"+seed+"$3");
				}
			}
		};
		return this;
	}
}

let integerGenerator = (limit, start) => {
		return function* () {
			let base = start || 0,
				i = 0;
			while (i < limit) yield base + i++;
		};
	}, 
	charGenerator = (limit, startChar) => {
		return function* () {
			let base = startChar && startChar.charCodeAt(0) || 'a'.charCodeAt(0),
				i = 0;
			while (i < limit) yield String.fromCharCode(base + i++);
		};
	};
let dir = 'img';
// let seed = new Seed('https://nogikoi.jp/images/play_story/member/story/n28_02_a.png', /^(.+\/n)(\d+)(_02_\w\.png)$/, integerGenerator(37))
// 				.subLoop(/^(.+\/n\d+_02_)(\w)(\.png)$/, charGenerator(10));
// let seed = new Seed('https://nogikoi.jp/images/play_story/member/story/n28_02_a.png', /^(.+\/n)(\d+)(_02_\w\.png)$/, integerGenerator(37));
// request(seed, url => {
// 	return requestStreamPromise(url)
// 	.spread((stream, filename) => {
// 		let promises = [],
// 			// hashing = crypto.createHash('md5').setEncoding('hex'),
// 			target = path.resolve(dir, filename, '..', String(Util.getUUID()));
// 		promises.push(hashingPromise(stream));
// 		promises.push(namingPromise(stream, filename));
// 		// promises.push(dataDisposalPromise(stream, fs.createWriteStream(target)));
// 		// passedStream.pipe(hashing);
// 		// stream.pipe(hashing);
// 		stream.pipe(createWriteStream(target));
// 		stream.on('end', () => {
// 			console.log('[ReadStream] completed');
// 		});
// 		return promise.all(promises).spread((hash, name) => {
// 			return new promise((resolve, reject) => {
// 				fs.rename(target, path.resolve(dir, name), (error, result) => {
// 					if (error) {
// 						console.log('[FS Rename] temp file', target, 'failed to rename', result, 'with Error:', error);
// 						return resolve(target);
// 					}
// 					return resolve(result);
// 				});
// 			});
// 			// console.log(hash);
// 			// return hash;
// 		});
// 	});
// });
		// .spread(destinationPromise.bind(this, dir))
		// .spread((stream, destination) => {
		// 	if (!fs.existsSync(path.dirname(destination))) {
		// 		fs.mkdirSync(path.dirname(destination));
		// 	}
		// 	return new promise((resolve, reject) => {
		// 		stream.pipe(fs.createWriteStream(destination));
		// 		stream.on('end', () => {
		// 			stream = void 0;
		// 			resolve(destination);
		// 		});
		// 		stream.on('error', error => {
		// 			reject(error);
		// 		});
		// 	});
		// });

// Test
// let hashing = crypto.createHash('md5').setEncoding('hex');
// let stream = Request('http://nogibingo.com/wp-content/uploads/2015/11/saitouasuka_13th_prof.jpg').on('response', response => {
// 	console.log("[Request response]", response);
// }).pipe(Stream.PassThrough());
// stream.pipe(fs.createWriteStream(path.resolve('img', 'temp')));
// stream.pipe(hashing);
// stream.on('end', () => console.log('stream end'));
// stream.on('error', error => console.log('stream error', error));
// hashing.on('finish', () => console.log('hashing finished', hashing.read()));

// Test
// let seed = new Seed(path.resolve('./test'));
// request(seed, url => {
// 	let dir = 'img';
// 	// return promise.resolve([
// 	// 	fs.createReadStream(url), 
// 	// 	'img2.php?sec_key=uJS0zpWWJU91lOSPoea00jUgkVPY8rg0cf5zifL5kexRNVYmKh1fwnglVkXo52dqUpuIbVV8aS6sALVd6lHguBeAn9dhPZzvTiyo0sk7K9fCkGtwbdboIlG301vPVUve0TQ2KOhtEpHsoJDDE5Di7XW7HyTgQuesjZaWUYDOVQEmjSDSqty1X5HALEogMllLydv55met'
// 	// ])
// 	return requestStreamPromise('https://nogikoi.jp/images/play_story/member/story/n36_02_a.png')
// 	.spread((stream, filename) => {
// 		let promises = [];
// 		promises.push(hashingPromise(stream));
// 		promises.push(namingPromise(stream, 'test'));
// 		stream.pipe(fs.createWriteStream(path.resolve('img', 'temp3')));
// 		stream.on('end', () => {
// 			console.log('Stream written end');
// 		});
// 		return promise.all(promises).spread((hash, name) => {
// 			console.log('Promises completed', hash, name);
// 		});
// 	});
// });


let pagePromise = (url) => {
		console.log('[pagePromise]');
		return requestPromise(url).then(response => {
			console.log('X-CACHE:', response.headers['x-cache']);
			console.log('X-ORIGIN-DATE:', response.headers['x-origin-date']);
			if (response.statusCode !== 200) {
				console.log('[pagePromise] Status:', response.statusCode, response.statusMessage);
				throw 'Invalid Status';
			}
			return response.body;
		}).catch(error => {
			console.log('[pagePromise] Error:', error);
			throw error;
		});
	},
	getMemberDictionaryPromise = () => {
		console.log('[getMemberDictionaryPromise]');
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
		let $ = cheerio.load(body),
			imageElementArray = $('.entrybody').find('img');
		imageElementArray.each((index, imageElement) => {
			imageElement = $(imageElement);
			let hyperLink = imageElement.closest('a');
			if (hyperLink.get().length) {
				console.log(imageElement.attr('src'), 'has hyperLink', hyperLink.attr('href'));
			} else {
				console.log(imageElement.attr('src'), 'doesnt have links...');
			}
		});
	},
	parseMembersPromise = () => {
		console.log('[parseIndividualMember]');
		return getMemberDictionaryPromise().then(dict => {
			// for (let member in dict) {
			// 	console.log(member.url);
			// }
			return request(new Seed(dict), member => {
				let memberUrl = Url.resolve(config.blogUrl, member.url),
					getPages = (pageNumber) => {
						pageNumber = pageNumber || 1;
						return pagePromise(Url.resolve(memberUrl, '?p='+pageNumber))
							.then(parseImageUrls)
							.then(getPages.bind(this, pageNumber++));
					};

				return getPages().catch(error => {
					console.log('[getPages] Error:', error);
				});
			});
		});
	};
// parseMembersPromise();
// pagePromise('http://blog.nogizaka46.com/manatsu.akimoto/?p=2').then(parseImageUrls);
pagePromise('http://blog.nogizaka46.com/').then(parseImageUrls);