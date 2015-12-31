require('babel-register');

var BlogParser = require('./BlogParser.js');
(new BlogParser()).parse(() => {
	console.log('Complete');
});

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
// // http.request('http://storage.mantan-web.jp/images/2015/12/29/20151229dog00m200047000c/018_size10.jpg', function(result) {
// http.request('http://blog.nogizaka46.com/?p=5&d=20151201', function(result) {
// 	// console.log(result.req);
// 	// console.log(result.req.path);
// 	console.log(result.statusCode);
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