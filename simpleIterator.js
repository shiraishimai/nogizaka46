'use strict';
let gm = require('gm'),
	path = require('path'),
	crypto = require('crypto'),
	fs = require('graceful-fs'),
	Util = require('./Util.js'),
	Request = require('request'),
	promise = require('bluebird'),
	Stream = require('stream'),
	isString = (ref) => {
		return Object.prototype.toString.call(ref) === '[object String]';
	},
	isFunction = (ref) => {
		return typeof ref === 'function';
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
	destinationPromise = (dir, stream, filename) => {
		// Form metadata
        let destination = path.resolve(dir || '.');
		if (filename.indexOf('?') > 0) {
			filename = filename.replace(/\?.*$/, '');	// Remove parameter
		}
		// Find extension
		switch (path.extname(filename).toLowerCase()) {
			case '.bmp':
			case '.jpg':
			case '.gif':
			case '.png':
			case '.jpeg':
			case '.tiff':
				break;
			default:
				// @TODO pipe to GM to obtain filename
				return new promise((resolve, reject) => {
					let gm = require('gm'),
						gmStream = gm(stream).format((error, properties) => {
							if (error) {
								console.log('[GM Error]', error);
								return resolve([stream, path.resolve(destination, filename, '.jpg')]);
							}
							console.log('[GM format]', properties);
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
									filename += '.jpg';
									break;
							}
							destination = path.resolve(destination, filename);
							return resolve([gmStream, destination]);
						}).stream();
				});
				break;
		}
		destination = path.resolve(destination, filename);
		return [stream, destination];
	},
	/**
	 * @return [<Stream> stream, <String> filename]
	 */
	requestPromise = (url) => {
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
	// @param <Function> requestDelegate(<String> url)
	request = (seed, requestDelegate) => {
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
	};

class Seed {
	constructor(url, regex, pool) {
		if (!regex || !pool) {
			this._iterator = this[Symbol.iterator] = function* () {
				if (Array.isArray(url)) {
					for (let seed of pool) yield seed;
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
// let seed = new Seed('https://nogikoi.jp/images/play_story/member/story/n28_02_a.png', /^(.+\/n)(\d+)(_02_\w\.png)$/, integerGenerator(37))
// 				.subLoop(/^(.+\/n\d+_02_)(\w)(\.png)$/, charGenerator(10));
let seed = new Seed('https://nogikoi.jp/images/play_story/member/story/n28_02_a.png', /^(.+\/n)(\d+)(_02_\w\.png)$/, integerGenerator(37));
request(seed, url => {
	let dir = 'img';
	return requestPromise(url)
	.spread((stream, filename) => {
		let promises = [],
			// hashing = crypto.createHash('md5').setEncoding('hex'),
			// @TODO: resolve filename as dir
			target = path.resolve(dir, String(Util.getUUID()));
		if (!fs.existsSync(path.dirname(target))) {
			fs.mkdirSync(path.dirname(target));
		}
		promises.push(hashingPromise(stream));
		// promises.push(namingPromise(stream, filename));
		// promises.push(dataDisposalPromise(stream, fs.createWriteStream(target)));
		// passedStream.pipe(hashing);
		// stream.pipe(hashing);
		stream.pipe(fs.createWriteStream(target));
		stream.on('end', () => {
			console.log('[ReadStream] completed');
		});
		return promise.all(promises).spread((hash, name) => {
			return new promise((resolve, reject) => {
				fs.rename(target, path.resolve(dir, name), (error, result) => {
					if (error) {
						console.log('[FS Rename] temp file', target, 'failed to rename', result, 'with Error:', error);
						return resolve(target);
					}
					return resolve(result);
				});
			});
			// console.log(hash);
			// return hash;
		});
	});
});
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
// 	return requestPromise('https://nogikoi.jp/images/play_story/member/story/n36_02_a.png')
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
