'use strict';
require('babel-register')({
    presets: ["react"]
});
// require('./server.js');

// var BlogParser = require('./BlogParser.js');
// (new BlogParser()).parse(() => {
// 	console.log('Complete');
// });

// var BlogParser = require('./BlogParser.js'),
// 	parsers = [];
// for (var i = 1; i <= 15; i++) {
// 	parsers.push(new BlogParser("http://blog.nogizaka46.com/?p="+i));
// }
// var timeInterval = setInterval(function() {
// 	var parser = parsers.pop();
// 	if (!parser) return clearInterval(timeInterval);
// 	parser.parse(() => {
// 		console.log('Complete!');
// 	});
// }, 15*1000);

// var Util = require('./Util.js');
// console.log(Util.getUID());

// var http = require('http');
// // // http.request('http://storage.mantan-web.jp/images/2015/12/29/20151229dog00m200047000c/018_size10.jpg', function(result) {
// http.request('http://cfile10.uf.tistory.com/original/244B1D4854ACF89B11E958', function(result) {
// // 	console.log(result.req);
// 	// console.log(result.req.path);
// // 	console.log(result.statusCode);
//     var dataDisposition = result.headers['content-disposition'];
    
// }).end()

// var path = require('path');
// console.log(path.basename("/images/2015/12/29/20151229dog00m200047000c/018_size10.jpg"));

// var gm = require('gm');
// gm('../Udq7Sde.jpg').identify(function(error, properties) {
// 	if (error) return console.log(error);
// 	console.log(properties);
// });
// gm('../9oy4K6.gif').format(function(error, properties) {
// gm('../Udq7Sde.jpg').format(function(error, properties) {
// 	if (error) return console.log(error);
// 	console.log(properties);
// }).size(function(error, properties) {
// 	if (error) return console.log(error);
// 	console.log(properties);
// });

// var gm = require('gm'),
// 	fs = require('graceful-fs'),
// 	pass = require('stream').PassThrough;
// var readStream = fs.createReadStream('../9oy4K6.gif'),
// var readStream = fs.createReadStream('../Udq7Sde.jpg'),
// 	cloneStream = new pass();
// readStream.pipe(cloneStream);
// gm(readStream).format(function(error, properties) {
// 	if (error) return console.log(error);
// 	console.log(properties);
// 	var writeStream = fs.createWriteStream('./testing.jpg');
// 	cloneStream.pipe(writeStream);
// 	cloneStream.on('end', function() {
// 		console.log('cloneStream ends');
// 	});
// });

// var gm = require('gm'),
// 	http = require('http'),
// 	fs = require('graceful-fs'),
// 	stream = require('stream');
// http.request('http://storage.mantan-web.jp/images/2015/12/29/20151229dog00m200047000c/018_size10.jpg', function(readStream) {
// 	var cloneStream = new stream.PassThrough(),
// 		cloneStream2 = new stream.PassThrough();
// 	readStream.pipe(cloneStream);

// 	gm(cloneStream).format(function(error, properties) {
// 		if (error) return console.log(error);
// 		console.log(properties);
// 		var writeStream = fs.createWriteStream('./testing.jpg');
// 		readStream.pipe(writeStream);
// 		readStream.on('end', function() {
// 			console.log('readStream ends');
// 		});
// 	});
// }).end()

// var url = require('url');
// console.log(url.parse("http://blog.nogizaka46.com/?p=2").path);

// var fs = require('graceful-fs');
// fs.stat('./imgData/blablabla.jpg', function(error, stats) {
// 	if (error) return console.log('Error:', error);
// 	console.log(stats);
// });

// var cluster = require('cluster');
// if (cluster.isMaster) {
// 	var fs = require('graceful-fs'),
// 		IOManager = require('./IOManager.js'),
// 		manager = new IOManager();
// 	fs.readdir("/Users/samson/Downloads/nogi", function(error, list) {
// 		list.forEach(function(item) {
// 			manager.check(item);
// 		});
// 	});
// }

// var array = [];
// for (var i = 1; i <= 15; i++) {
// 	array.push({
// 		id: i
// 	});
// }
// var timeInterval = setInterval(function() {
// 	var item = array.pop();
// 	if (!item) {
// 		console.log('End');
// 		return clearInterval(timeInterval);
// 	}
// 	console.log(item.id);
// }, 15*1000);

// var util = require('./Util.js');
// console.log(util.zpad(123, 6));

// var ImageSearcher = require('./ImageSearcher.js');
// (new ImageSearcher('http://tokyopopline.com/images/2015/12/151230kouhaku5.jpg')).parseAt();
// (new ImageSearcher('http://tokyopopline.com/images/2015/12/151230sachiko1.jpg')).parse();
// (new ImageSearcher('http://tokyopopline.com/images/2015/12/151229nogizaka18.jpg')).parse();
// (new ImageSearcher('http://cdn2.natalie.mu/media/1512/1229/kohaku29/nogizaka46/extra/news_large_nogizaka46_kohaku29_01.jpg')).parse();
// ImageSearcher('http://www.wws-channel.com/music/nhk-kouhaku_2015/images/nogizaka46/00.jpg').parse();
// (new ImageSearcher('http://cdn2.natalie.mu/media/1512/1229/kohaku29/nogizaka46/extra/news_large_nogizaka46_kohaku29_01.jpg')).parse();
// (new ImageSearcher('http://mdpr.jp/photo/images/2015/12/29/w788c-e_1935728.jpg', 30)).parseAt();
// ImageSearcher('http://storage.mantan-web.jp/images/2015/12/24/20151224dog00m200017000c/001_size6.jpg').parse();
// ImageSearcher('http://storage.mantan-web.jp/images/2015/12/30/20151230dog00m200018000c/021_size6.jpg').parse()
// ImageSearcher('http://storage.mantan-web.jp/images/2015/12/29/20151229dog00m200047000c/018_size10.jpg').parse()

// added 2016-01-19
// ImageSearcher('http://storage.mantan-web.jp/images/2016/01/18/20160118dog00m200014000c/007_size10.jpg').parse()
//// ImageSearcher('http://mdpr.jp/photo/images/2016/01/18/w720c-e_1952109.jpg').parse()
// ImageSearcher('http://mdpr.jp/photo/images/2016/01/18/c-e_1952109.jpg').parse() // !!!!
// http://nikkan-spa.jp/1020992/img_0040
// http://mdpr.jp/news/detail/1560381
// http://tokyopopline.com/archives/55782
// http://tokyopopline.com/archives/55689

// @TODO
// (new ImageSearcher('http://tokyopopline.com/archives/54057')).crawl();

// http://mantan-web.jp/gallery/2015/12/30/20151230dog00m200057000c/002.html
// http://news.dwango.jp/2015/12/31/69608/idol/
// http://news.dwango.jp/2016/01/04/70181/idol/
// http://www.asahi.com/articles/ASHDS428PHDSUCVL00G.html

// var SessionManager = require('./SessionManager.js');
// SessionManager.setToken('./imgData/00.jpg');

// var TwitterParser = require('./TwitterParser.js');
// (new TwitterParser('https://twitter.com/BLTTV/status/683241261596147712')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/683225395378831360')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/683203401543323652')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/683200724562399233')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/683197791699513344')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/682194797893783553')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/681698310197936128')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/680997256661606400')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/680650526019616769')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/680643873786310656')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/680328351848857600')).parse();
// (new TwitterParser('https://twitter.com/BLTTV/status/679906389674754050')).parse();

// ImageSearcher('http://chisaem.tistory.com/164').parse();
// ImageSearcher('http://940525.tistory.com/90').parse();

// ImageSearcher('http://notitle33.tistory.com/1027').parse();

// ImageSearcher('https://twitter.com/BLTTV/status/683638331557597184').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683628259410489344').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683620404720619520').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683614761016135680').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683608422994984960').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683601250500255744').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683589311875293184').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683581461966925824').parse();
// ImageSearcher('https://twitter.com/BLTTV/status/683570770811826176').parse();
// ImageSearcher('https://twitter.com/7_netshopping/status/683919071704780800').parse();


// console.log(process.env.PARSE_APP_ID, process.env.PARSE_KEY);
// var Parse = require('parse/node');
// var promise = require('bluebird');
// Parse.initialize(process.env.PARSE_APP_ID, process.env.PARSE_KEY);
// var TestClass = Parse.Object.extend('TestClass'),
//     testInstance = new TestClass();
// testInstance.save({
//     md5: "testMD5",
//     filename: "testFilename"
// }).then(obj => {
//     console.log('Success!', obj);
// }, error => {
//     console.log('Error Parse.save:', error);
// });

// class TestClass extends Parse.Object {
//     constructor(md5, filename) {
//         super('TestClass');
//         super.set('md5', md5);
//         super.set('filename', filename);
//     }
// }
// Parse.Object.registerSubclass('TestClass', TestClass);

// (new TestClass("setInsideConstructor", "yesyesyes")).save().then(obj => {
//     console.log('Success!', obj);
// }, error => {
//     console.log('Error Parse.save:', error);
// });
// let promises = [];
// for (let i=0;i<3;i++) {
//     promises.push((new TestClass("looping"+i, i+"ObjectTest")).save())
// }
// promise.all(promises).then((results) => {
//     console.log('Promise mutation successful!', results);
// });
// new Parse.Query(TestClass).first().then(result => {
//     console.log(result);
//     console.log(result.get('md5'), result.get('filename'));
// }, err => {
//     console.log('Error:', err); 
// });

// require("./thumbnailGen.js");
