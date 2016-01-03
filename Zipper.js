'use strict';
var promise = require('bluebird'),
    fs = require('graceful-fs'),
    JSZip = require('jszip'),
    path = require('path');

const DIR = './imgData/test';

function singleFileZip(zip, file) {
    return new promise((resolve, reject) => {
         fs.readFile(file, (error, data) => {
             if (error) return reject('Error readFile:', error);
             zip.file(path.basename(file), data);
             console.log('Zipping', file, '...');
             return resolve();
         });
    });
}

let zip = new JSZip();
let zipPromise = new promise((resolve, reject) => {
    fs.readdir(DIR, (error, list) => {
        if (error) return console.log('Error readdir:', error);
        // console.log(list);
        let promises = []; 
        list.forEach((dir, index) => {
            let fileDir = path.resolve(DIR, dir);
            if (!fs.statSync(fileDir).isFile()) return console.log('Directory', fileDir, 'skipped');
            promises.push(singleFileZip(zip, fileDir));
            if (index === list.length-1) resolve(promise.all(promises));
        });
    });
});
zipPromise.then(() => {
    console.log('Generating zip...');
    let data = zip.generate({
        base64: false,
        compression: 'DEFLATE'
    });
    fs.writeFile('img.zip', data, 'binary', (error) => {
        if (error) return console.log('Error writeFile:', error);
        console.log('Zip complete!');
    });
});