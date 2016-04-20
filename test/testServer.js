'use strict';
let express = require('express'),
    Request = require('request'),
    fs = require('graceful-fs'),
    app = express();
    
app.set('port', (process.env.PORT || 8080));
app.listen(app.get('port'), function() {
    console.log('Server started: http://localhost:'+app.get('port')+'/') ;
});

app.use('/img', express.static('./img'));

app.get('/200', (request, response) => {
    return response.status(200).send('HTTP 200');
});
app.get('/400', (request, response) => {
    return response.status(400).send('HTTP 400');
});
app.get('/404', (request, response) => {
    return response.status(404).send('HTTP 404');
});
app.get('/delay/:request', (request, response) => {
    setTimeout(() => {
        Request.get('http://localhost:8080/'+request.params.request).pipe(response);
    }, 1000);
});
app.get('/suddenDead', (request, response) => {
    setTimeout(() => {
        response.end();
    }, 1000);
});