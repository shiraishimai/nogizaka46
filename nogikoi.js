let Stream = require('stream'),
    fs = require('graceful-fs'),
    Seed = require('./Seed.js'),
    Util = require('./Util.js'),
    Request = require('request'),
    promise = require('bluebird'),
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

// let seed = new Seed('http://i.nogikoi.jp/assets/img/member/l/{18}.png', Seed.integerGenerator(40));
// let seed = new Seed('http://i.nogikoi.jp/assets/img/card/m/{2}{3}00{165}.jpg', Seed.integerGenerator(3, 1), Seed.integerGenerator(4, 3), Seed.integerGenerator(, ));
// let seed = new Seed('http://i.nogikoi.jp/assets/img/card/i/1100075.jpg');
// batchProcess(seed, url => {
//     return requestStreamPromise(url).spread((stream, filename) => {
//         stream.pipe(createWriteStream(tempFile));
//         stream.on('end', () => {
//             console.log('[ReadStream] completed', tokenUrl);
//         });
//     });
// });

let bruteForceCollection = (id, lv) => {
    let collection = [],
        generation = 0,
        type = 0;
    // Find type
    collection.push({
        cardId: id,
        cardLv: lv,
        cardType: type,
        card: type + lv + generation + Util.leftpad(id, 4)
    });
};

let cardId, cardLv;
// 1 ~ 73 (74)
cardId = 1;
cardLv = 1;

// 75 ~ 148 (148)
cardId = 75;
cardLv = 1;

// 149 ~ 221 (222)
cardId = 149;
cardLv = 3;

// 223 ~ 295 (296)
cardId = 223;
cardLv = 3;

// Item: 297, 298, 299

// 300 <Start from Ikoma> ~ 352 (353) <Ends with Mayaa>
cardId = 300;
cardLv = 5;
// ???

// 354 ~ 426 (427)
cardId = 354;
cardLv = 5;

// 428 <Start from Karin> ~ 468 (469) <Ends with Mayaa>
cardId = 428;
cardLv = 5;
// ???

// Item: 470, 471, 472

let tenFrontMemberDict = [{"id":1,"memberId":"manatsu.akimoto","name":"秋元 真夏"},{"id":2,"memberId":"erika.ikuta","name":"生田 絵梨花"},{"id":8,"memberId":"misa.eto","name":"衛藤 美彩"},{"id":12,"memberId":"asuka.saito","name":"齋藤 飛鳥"},{"id":18,"memberId":"mai.shiraishi","name":"白石 麻衣"},{"id":21,"memberId":"kazumi.takayama","name":"高山 一実"},{"id":26,"memberId":"nanase.nishino","name":"西野 七瀬"},{"id":28,"memberId":"nanami.hashimoto","name":"橋本 奈々未"},{"id":30,"memberId":"mai.fukagawa","name":"深川 麻衣"},{"id":31,"memberId":"minami.hoshino","name":"星野 みなみ"}];
// 10 Front member
// 473 ~ 491 (492)
cardId = 473;
cardLv = 7;

// 493 ~ 521 (524) <Ends with Matsumura> (15)
cardId = 493;
cardLv = 7;
// ???

// Item: 525, 526, 527

// 528 ~ 600 (601)
cardId = 528;
cardLv = 1;

// 602 ~ 674 (675)
cardId = 602;
cardLv = 3;

// 676 ~ 698 (699) <Ends with Nanase> (12)
cardId = 676;
cardLv = 5;
// ???

// Item 700, 701, 702

// 703 ~ 777 ?

// 1133 ~ 1201 (1202) <Ends with Mayaa> (35)
cardId = 1133;
cardLv = 7;
// ???






/**
 * Remarks
 * All: 37
 * Over: 18
 * Under: 19
 * 1st: 26
 * 2nd: 11
 */