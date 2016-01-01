'use strict';
var SessionManager = require('./SessionManager.js'),
    express = require('express'),
    fs = require('graceful-fs'),
    app = express();
    
app.set('port', (process.env.PORT || 8080));
app.listen(app.get('port'), function() {
    console.log('Server started: http://localhost:'+app.get('port')+'/') ;
});

app.use(express.static(__dirname + '/public'));
// app.get('/', function(request, response) {
//     response.send('Maintenance');
//     response.end();
// });

// app.use('/img', express.static('./imgData'));

// app.get('/tou/:token', function(request, response) {
//     console.log('Token:', request.params.token);
//     let path = SessionManager.consumeToken(request.params.token);
//     if (path) {
//         response.setHeader('Cache-Control', 'no-cache');
//         // response.sendFile(path, { root: __dirname });
//         fs.readFile(path, function(error, data) {
//             if (error) response.status(500).send('Error:', error);
//             // data.setEncoding('utf8');
//             response.send(data);
//         });
//     } else {
//         response.status(403).send('Sorry! you cant see that.');
//     }
// });