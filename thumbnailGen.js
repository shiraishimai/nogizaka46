'use strict';
const DIR = './imgData';
var gm = require('gm'),
    path = require('path'),
    fs = require('graceful-fs'),
    promise = require('bluebird'),
    Parse = require('parse/node');
Parse.initialize(process.env.PARSE_APP_ID, process.env.PARSE_KEY);
class HashThumb extends Parse.Object {
    constructor(md5, data) {
        super('HashThumb');
        super.set('hash', md5);
        super.set('data', data);
    }
}
Parse.Object.registerSubclass('HashThumb', HashThumb);

function recursiveReadDirPromise(dir, callback) {
    let promises = [];
    return new promise((resolve, reject) => {
        fs.readdir(dir, (error, list) => {
            if (error) return reject('Error readdir:'+error);
            list.forEach((item, index) => {
                let target = path.resolve(dir, item);
                fs.stat(target, (error, stats) => {
                    if (error) return reject('Error stat:'+error);
                    if (!stats.isFile()) return promises.push(recursiveReadDirPromise(target, callback));
                    callback(target);
                    if (index === list.length - 1) return promise.all(promises).then(resolve, reject);
                });
            });
        });
    });
}

let promises = [];
let getThumbPromise = (file) => {
    return new promise((resolve, reject) => {
        gm(file)
            .strip()
            .quality(60)
            .resize(200, null, '>')
            .toBuffer((err, buffer) => {
                if (err) return reject(err);
                console.log('Thumb created:', file);
                return resolve(buffer.toString('base64'));
            });
    });
};
// recursiveReadDirPromise(DIR, file => {
//     promises.push(getThumbPromise(file).then(thumb => {
//         return new HashThumb(
//             path.basename(file).replace(/\.\w+/,''),
//             thumb
//         ).save().then(result => {
//             console.log('Success:', result);
//         }, err => {
//             console.error('Error:', err);
//         });
//     }));
// }).then(() => {
//     promise.all(promises).then(hashThumbArray => {
//         console.log(hashThumbArray.length);
//         console.log('DONE!');
//         // Parse.Object.saveAll(hashThumbArray).then(result => {
//         //     console.log('Success:', result);
//         // }, err => {
//         //     // Got reject when any single request failed
//         //     console.error('Error:', err);
//         // });
//     });
// });
// new promise((resolve, reject) => {
//     recursiveReadDir(DIR, (file) => {
//         promises.push(getThumbPromise(file).then(thumb => {
//             new HashThumb(
//                 path.basename(file).replace(/\.\w+/,''),
//                 thumb
//             ).save().then(() => {
//                 console.log('Success:', file);
//             }, (err) => {
//                 console.error('Error:', file, err);
//             })
//         }));
//         resolve();  // activate promise.all
//     });
// }).then(() => {
//     promise.all(promises).then(hashThumbArray => {
//         console.log('Thumbnail gen success!', hashThumbArray.length);
//     });
// });

// gm('/home/ubuntu/workspace/blog/imgData/5bf0603548f779361e298f9568f547a5.png')
//     .strip()
//     .quality(60)
//     .resize(200, null, '>')
// //     .write('./testThumb.jpg', (err) => {
// //         if (!err) console.log('done');
// //     });
//     .toBuffer((err, buffer) => {
//         if (err) return console.log('Error:', err);
//         console.log(buffer.toString('base64'));
//     });

// let query = new Parse.Query(HashThumb);
// query.descending('updateAt');
// query.first().then(result => {
//     console.log(result);
//     console.log(result.get('data'));
// }, err => {
//     console.log('Error:', err);
// });
// query.get('PeAavxYOi3').then(result => {
//     console.log(result);
//     console.log(result.get('data'));
// }, err => {
//     console.log('Error:', err);
// });

// let HashThumb = Parse.Object.extend('HashThumb');
// @RESULT: ParseObjectSubclass { className: 'HashThumb', _objCount: 0, id: 'jdbkk2JEvw' }
// new Parse.Query(HashThumb).descending('updatedAt').skip(100).find(results => {
//     // console.log(results);
//     results.forEach((result) => {
//         console.log(result.id, result.updatedAt, result.createdAt); 
//     });
// }, err => {
//     console.log('Error:', err); 
// });

// var moment = require('moment');
// var now = new moment();
// new Parse.Query(HashThumb)
//     // .lessThan('createdAt', now.subtract(5, 'hours').toDate())
//     .greaterThan('createdAt', now.subtract(5, 'hours').toDate())
//     .count().then(result => {
//         console.log(result);
//     }, err => {
//         console.log('Error:', err, err.message);
//     });
// console.log(now.subtract(3, 'hours'));
// console.log(now.subtract(3, 'hours').toDate());

// Cloud Code Test
// let query = new Parse.Query(HashThumb);
// fs.readdir(DIR, (error, list) => {
//     if (error) return console.log('Error readdir:', error);
//     list = list.map(file => {return path.basename(file).replace(/\.\w+/,'');});
//     // Parse.Cloud.run('findDuplicates', {list:list}).then(result => {
//     //     console.log(result);
//     // }, err => {
//     //     console.log('Error:', err, err.message);
//     // });
//     list.forEach(hash => {
//         query.equalTo('hash', hash).count().then(result => {
//             console.log(hash, result);
//         }, error => {
//             console.log('Error:', error);
//         });
//     });
// });

class TaskDeferred {
    constructor(callback) {
        this.resolve = void 0;
        this.reject = void 0;
        this.promise = new promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.__returnValue = this.promise.then(callback);
    }
    execute() {
        this.resolve();
        return this.__returnValue;
    }
}

class PipleLine {
    constructor(list, taskPerSecond) {
        this.queue = list;
        this.results = [];
        this.timeFrame = 0;
        this.timeFrameExecuting = 0
        this.taskPerSecond = taskPerSecond;
        this.deferred = new promise.defer();
    }
    nextTask(resolvedPromise, result) {
        let now = new Date().getTime(),
            delta = now - this.timeFrame,
            newTask = this.queue.shift();
        this.results.push(result);
        if (!newTask) return this.deferred.resolve(this.results);   // Ending promise chain
        if (delta < 0) {
            // Current timeFrame fulled
            this.timeFrameExecuting++;
            console.log('TimeFrame:', this.timeFrame, 'Tasks:', this.timeFrameExecuting);
            return promise.delay(-delta).then(() => {
                return newTask.promise.then(this.nextTask.bind(this, newTask.resolve()));
                // return newTask.promise.then(this.nextTask.bind(this, newTask.execute()));
            });
        } else if (delta > 1000) {
            // New timeFrame
            do {
                this.timeFrame += 1000;
            } while (this.timeFrame < now);
            this.timeFrameExecuting = 1;
            console.log('TimeFrame:', this.timeFrame, 'Tasks:', this.timeFrameExecuting);
            return newTask.promise.then(this.nextTask.bind(this, newTask.resolve()));
            // return newTask.promise.then(this.nextTask.bind(this, newTask.execute()));
        } else {
            // In exisiting timeFrame
            if (this.timeFrameExecuting < this.taskPerSecond) {
                // Within capacity of timeFrame
                this.timeFrameExecuting++;
                console.log('TimeFrame:', this.timeFrame, 'Tasks:', this.timeFrameExecuting);
                return newTask.promise.then(this.nextTask.bind(this, newTask.resolve()));
                // return newTask.promise.then(this.nextTask.bind(this, newTask.execute()));
            } else {
                // Capacity full
                this.timeFrame += 1000;
                this.timeFrameExecuting = 1;
                console.log('TimeFrame:', this.timeFrame, 'Tasks:', this.timeFrameExecuting);
                return promise.delay(1000 - delta).then(() => {
                    return newTask.promise.then(this.nextTask.bind(this, newTask.resolve()));
                    // return newTask.promise.then(this.nextTask.bind(this, newTask.execute()));
                });
            }
        }
    }
    execute() {
        if (!this.queue.length) return;
        this.timeFrame = new Date().getTime();
        this.timeFrameExecuting = 1;
        for (let i = 0; i < this.taskPerSecond; i++) {
            let newTask = this.queue.shift();
            newTask.promise.then(this.nextTask.bind(this, newTask.resolve()));
            // newTask.promise.then(this.nextTask.bind(this, newTask.execute()));
        }
        return this.deferred.promise;
    }
}

// let list = [];
// for (let i = 0; i < 100; i++) {
//     let taskLength = Math.random() * 2,
//         controlledDeferred = new promise.defer();
//     list.push(controlledDeferred);
//     controlledDeferred.promise.then(() => {
//         return new promise((resolve, reject) => {
//             setTimeout(() => {
//                 console.log(taskLength, 'done');
//                 resolve(i);
//             }, Math.floor(taskLength*1000));
//         });
//     });
// }
// let list = [];
// for (let i = 0; i < 100; i++) {
//     let taskLength = Math.random() * 2;
//     list.push(new TaskDeferred(() => {
//         return new promise((resolve, reject) => {
//             setTimeout(() => {
//                 console.log(taskLength, 'done');
//                 resolve(i);
//             }, Math.floor(taskLength*1000));
//         });
//     }));
// }
// new PipleLine(list, 3).execute().then(results => {
//     console.log('Success!', results);
// });

// let query = new Parse.Query(HashThumb);
// fs.readdir(DIR, (error, list) => {
//     let pipe = [];
//     if (error) return console.log('Error readdir:', error);
//     list = list.map(file => {return path.basename(file).replace(/\.\w+/,'');});
//     list.forEach(hash => {
//         pipe.push(query.equalTo('hash', hash).count().then(result => {
//             console.log(hash, result);
//         }, error => {
//             console.log('Error:', error);
//         }));
//     });
//     new PipleLine(pipe, 3).execute().then(results => {
//         console.log('Completed', results, 'items'); 
//     });
// });
let query = new Parse.Query(HashThumb);
fs.readdir(DIR, (error, list) => {
    let pipe = [],
        controlledDeferred = new promise.defer();
    if (error) return console.log('Error readdir:', error);
    list = list.map(file => {return path.basename(file).replace(/\.\w+/,'');});
    list.forEach(hash => {
        pipe.push(controlledDeferred);
        controlledDeferred.promise.then(() => {
            return query.equalTo('hash', hash).count().then(result => {
                console.log(hash, result);
            }, error => {
                console.log('Error:', error);
            });
        });
    });
    new PipleLine(pipe, 3).execute().then(results => {
        console.log('Completed', results, 'items'); 
    });
});