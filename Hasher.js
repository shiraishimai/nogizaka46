'use strict';
var mongoClient = require('mongodb').MongoClient,
    promise = require('bluebird'),
    fs = require('graceful-fs'),
    crypto = require('crypto'),
    path = require('path');
    
const DIR = './imgData';

function recursiveReadDir(dir, callback) {
    fs.readdir(dir, (error, list) => {
        if (error) return console.log('Error readdir:', error);
        list.forEach((item) => {
            let target = path.resolve(dir, item);
            fs.stat(target, (error, stats) => {
                if (error) return console.log('Error stat:', error);
                if (stats.isFile()) return callback(target);
                return recursiveReadDir(target, callback);
            });
        });
    });
}

// Save md5 to filename linkage
// mongoClient.connect('mongodb://localhost:27017/temporary', (error, db) => {
//     if (error) return console.log('Database error:', error);
//     let imageCollection = db.collection('md5ToFilename'),
//         failure = (error, details) => {
//             console.log(error, details);
//             db.close();
//         };
//     let promises = [];
//     new promise((resolve, reject) => {
//         recursiveReadDir(DIR, (file) => {
//             promises.push(new promise((resolve, reject) => {
//                 let hashing = crypto.createHash('md5'),
//                     readStream = fs.createReadStream(file);
//                 hashing.setEncoding('hex');
//                 readStream.pipe(hashing);
//                 readStream.on('end', () => {
//                     let hash = hashing.read();
//                     console.log(hash, file);
//                     // Output Object
//                     resolve({
//                         md5: hash,
//                         filename: path.basename(file)
//                     });
//                 });
//             }));
//             resolve();  // activate promise.all
//         });
//     }).then(() => {
//         promise.all(promises).then((collection) => {
//             console.log('All hash resolved', collection.length);
//             imageCollection.insertMany(collection, (error, result) => {
//                 if (error) return failure(error);
//                 console.log(result);
//                 db.close();
//             });
//         });
//     });
// });

// Rename
// recursiveReadDir(DIR, (file) => {
//     let hashing = crypto.createHash('md5'),
//         readStream = fs.createReadStream(file);
//     hashing.setEncoding('hex');
//     readStream.pipe(hashing);
//     readStream.on('end', () => {
//         let hash = hashing.read(),
//             filename = path.resolve(__dirname, DIR, hash+path.extname(file));
//         console.log(hash, file);
//         fs.rename(file, filename, (error, result) => {
//             if (error) return console.log('Error rename', error);
//             console.log(file, 'renamed to', filename, result);
//         });
//     });
// });