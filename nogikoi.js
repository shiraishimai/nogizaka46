'use strict';
let path = require('path'),
    Stream = require('stream'),
    fs = require('graceful-fs'),
    Seed = require('./Seed.js'),
    Util = require('./Util.js'),
    Request = require('request'),
    promise = require('bluebird'),
    memberArray = require('./memberDictionary.json'),
    requestPromise = promise.promisify(Request);

/**
 * @return [<Stream> stream, <String> filename]
 */
let requestStreamPromise = (options) => {
    return new promise((resolve, reject) => {
        let stream = Request(options).on('response', response => {
            if (response.statusCode !== 200) {
                return reject(['NetworkError', response.statusCode, JSON.stringify(options)].join(' '));
            }
            console.log('[requestStreamPromise]', options);
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
};
let createWriteStream = (targetPath) => {
    if (!Util.isDirectoryExist(path.dirname(targetPath))) {
        console.log('Directory not exist!', targetPath);
        let mkdirp = require('mkdirp');
        mkdirp.sync(path.dirname(targetPath));
    }
    return fs.createWriteStream(targetPath);
};
let bruteForceCollection = (id, lv) => {
    let url = 'http://i.nogikoi.jp/assets/img/card/i/{1100075}.jpg',
        collection = [],
        generation = 0,
        promises = [],
        type = 0,
        card,
        _cardInstance;
    // Find type
    for (let member of memberArray) {
        for (let i=1;i<4;i++) {
            type = i;
            card = String(type) + String(lv) + String(generation) + Util.leftPad(id, 4);
            _cardInstance = {
                cardId: id,
                cardLv: lv,
                cardType: type,
                cardGeneration: generation,
                memberId: member.id,
                memberName: member.name
            };
            promises.push(requestStreamPromise(url.replace(/{[^}]*}/, card)).spread(((cardInstance, stream, filename) => {
                stream.pipe(createWriteStream(path.resolve('imgNogikoi', 'i', filename)));
                stream.on('end', () => {
                    console.log('[ReadStream] completed', cardInstance.cardId);
                });
                collection.push(cardInstance);
            }).bind(this, _cardInstance)).catch(() => {}));
        }
        id += 2;
    }
    return promise.all(promises).then(() => {return [collection, id-1];});
};

let bruteForceSearchCollection = (id, toId, lv) => {
    let url = 'http://i.nogikoi.jp/assets/img/card/i/{1100075}.jpg',
        collection = [],
        generation = 0,
        promises = [],
        type = 0,
        card,
        _cardInstance;
    // Find type
    for (id;id<=toId;id=id+2) {
        for (let i=1;i<4;i++) {
            type = i;
            card = String(type) + String(lv) + String(generation) + Util.leftPad(id, 4);
            _cardInstance = {
                cardId: id,
                cardLv: lv,
                cardType: type,
                cardGeneration: generation
            };
            promises.push(requestStreamPromise(url.replace(/{[^}]*}/, card)).spread(((cardInstance, stream, filename) => {
                stream.pipe(createWriteStream(path.resolve('imgNogikoi', 'i', filename)));
                stream.on('end', () => {
                    console.log('[ReadStream] completed', cardInstance.cardId);
                });
                collection.push(cardInstance);
            }).bind(this, _cardInstance)).catch(() => {}));
        }
    }
    return promise.all(promises).then(() => {
        if (!collection.length) return [collection, toId];
        // Find member
        url = 'http://i.nogikoi.jp/assets/img/card/mypage/{17080477}.png';
        let cardIndex = 0,
            memberIndex = 0,
            nextCard = (cardInstance, member) => {
                if (!cardInstance || !member) {
                    // Finalize
                    console.log('[SequentialExecute] Complete at cardIndex:', cardIndex, 'memberIndex:', memberIndex);
                    return [collection, toId];
                }
                card = String(cardInstance.cardType) + String(cardInstance.cardLv) + Util.leftPad(member.id, 2) + Util.leftPad(cardInstance.cardId, 4);
                // console.log('[SequentialExecute]', card);
                return requestStreamPromise(url.replace(/{[^}]*}/, card)).spread((stream, filename) => {
                    stream.pipe(createWriteStream(path.resolve('imgNogikoi', 'mypage', filename)));
                    stream.on('end', () => {
                        console.log('[ReadStream] completed', cardInstance.cardId);
                    });
                    cardInstance.memberId = member.id;
                    cardInstance.memberName = member.name;
                    console.log(cardInstance.cardId, member.name);
                    return nextCard(collection[++cardIndex], memberArray[memberIndex]);
                }).catch(error => {
                    return nextCard(collection[cardIndex], memberArray[++memberIndex]);
                });
            };
        // Sort Collection first
        collection.sort((a, b) => {
            return a.cardId - b.cardId;
        });
        return nextCard(collection[cardIndex], memberArray[memberIndex]).spread((collection, toId) => {
            if (cardIndex === collection.length) {
                return [collection, toId];
            }
            // Fail safe
            promises = [];
            for (let cardInstance of collection) {
                if (cardInstance.hasOwnProperty('memberId')) continue;
                for (let member of memberArray) {
                    card = String(cardInstance.cardType) + String(cardInstance.cardLv) + Util.leftPad(member.id, 2) + Util.leftPad(cardInstance.cardId, 4);
                    promises.push(requestStreamPromise(url.replace(/{[^}]*}/, card)).spread((stream, filename) => {
                        stream.pipe(createWriteStream(path.resolve('imgNogikoi', 'mypage', filename)));
                        stream.on('end', () => {
                            console.log('[ReadStream] completed', cardInstance.cardId);
                        });
                        cardInstance.memberId = member.id;
                        cardInstance.memberName = member.name;
                        console.log(cardInstance.cardId, member.name);
                    }).catch(() => {}));
                }
            }
            return promise.all(promises).then(() => {return [collection, toId];});
        });
    });
};

let __mapToObjPolyfill = (map) => {
    let obj = Object.create(null);
    for (let k of map.keys()) {
        // We don’t escape the key '__proto__'
        // which can cause problems on older engines
        obj[k] = map.get(k);
    }
    return obj;
};
let __objToMapPolyfill = (obj) => {
    let map = new Map();
    for (let k of Object.keys(obj)) {
        map.set(k, obj[k]);
    }
    return map;
};

let collections = new Map();
const DATA_DIR = path.resolve('nogikoiData.json');
let collectCollection = (dataCollectingMethod, fromId, toId, lv) => {
    // Execute
    return dataCollectingMethod().spread(collection => {
        // Save collection
        let obj = {
            fromId: fromId,
            toId: toId,
            lv: lv,
            noOfMember: collection.length,
            data: collection
        }, id = obj.fromId + '-' + obj.toId;
        collections.set(id, obj);
        fs.writeFileSync(DATA_DIR, JSON.stringify(__mapToObjPolyfill(collections)));
        console.log('End of process', collection.length);
    });
};

// Read collection
try {
    collections = __objToMapPolyfill(require(DATA_DIR));
} catch(e) {};

let cardId, toCardId, cardLv, chain = promise.resolve(), ref;
// 1 ~ 73 (74)
cardId = 1;
toCardId = 73;
cardLv = 1;
ref = bruteForceCollection.bind(this, cardId, cardLv)
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// 75 ~ 148 (148)
cardId = 75;
toCardId = 148;
cardLv = 1;
ref = bruteForceCollection.bind(this, cardId, cardLv)
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));


// // 149 ~ 221 (222)
cardId = 149;
toCardId = 221;
cardLv = 3;
ref = bruteForceCollection.bind(this, cardId, cardLv)
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));


// // 223 ~ 295 (296)
cardId = 223;
toCardId = 295;
cardLv = 3;
ref = bruteForceCollection.bind(this, cardId, cardLv)
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));


// // Item: 297, 298, 299

// // 300 <Start from Ikoma> ~ 352 (353) <Ends with Mayaa>
cardId = 300;
toCardId = 352;
cardLv = 5;
ref = bruteForceSearchCollection.bind(this, cardId, toCardId, cardLv);
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // 354 ~ 426 (427)
cardId = 354;
toCardId = 426;
cardLv = 5;
ref = bruteForceCollection.bind(this, cardId, cardLv)
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // 428 <Start from Karin> ~ 468 (469) <Ends with Mayaa>
cardId = 428;
toCardId = 468;
cardLv = 5;
ref = bruteForceSearchCollection.bind(this, cardId, toCardId, cardLv);
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // Item: 470, 471, 472

// let tenFrontMemberDict = [{"id":1,"memberId":"manatsu.akimoto","name":"秋元 真夏"},{"id":2,"memberId":"erika.ikuta","name":"生田 絵梨花"},{"id":8,"memberId":"misa.eto","name":"衛藤 美彩"},{"id":12,"memberId":"asuka.saito","name":"齋藤 飛鳥"},{"id":18,"memberId":"mai.shiraishi","name":"白石 麻衣"},{"id":21,"memberId":"kazumi.takayama","name":"高山 一実"},{"id":26,"memberId":"nanase.nishino","name":"西野 七瀬"},{"id":28,"memberId":"nanami.hashimoto","name":"橋本 奈々未"},{"id":30,"memberId":"mai.fukagawa","name":"深川 麻衣"},{"id":31,"memberId":"minami.hoshino","name":"星野 みなみ"}];
// // 10 Front member
// // 473 ~ 491 (492)
cardId = 473;
toCardId = 491;
cardLv = 7;
ref = bruteForceSearchCollection.bind(this, cardId, toCardId, cardLv);
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // 493 ~ 521 (524) <Ends with Matsumura> (15)
cardId = 493;
toCardId = 521;
cardLv = 7;
ref = bruteForceSearchCollection.bind(this, cardId, toCardId, cardLv);
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // Item: 525, 526, 527

// // 528 ~ 600 (601)
cardId = 528;
toCardId = 600;
cardLv = 1;
ref = bruteForceCollection.bind(this, cardId, cardLv)
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // 602 ~ 674 (675)
cardId = 602;
toCardId = 674;
cardLv = 3;
ref = bruteForceCollection.bind(this, cardId, cardLv)
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // 676 ~ 698 (699) <Ends with Nanase> (12)
cardId = 676;
toCardId = 698;
cardLv = 5;
ref = bruteForceSearchCollection.bind(this, cardId, toCardId, cardLv);
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // Item 700, 701, 702

// // 703 ~ 777 ?

// Limited Event
// 891 ~ 923 (924) <Random sequence> (17)
cardId = 891;
toCardId = 923;
cardLv = 7;
ref = bruteForceSearchCollection.bind(this, cardId, toCardId, cardLv);
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));

// // 1133 ~ 1201 (1202) <Ends with Mayaa> (35)
cardId = 1133;
toCardId = 1201;
cardLv = 5;
ref = bruteForceSearchCollection.bind(this, cardId, toCardId, cardLv);
chain = chain.then(collectCollection.bind(this, ref, cardId, toCardId, cardLv));






/**
 * Remarks
 * All: 37
 * Over: 18
 * Under: 19
 * 1st: 26
 * 2nd: 11
 */