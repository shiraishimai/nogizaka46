'use strict';
var SessionManager = require('./SessionManager.js'),
    express = require('express'),
    fs = require('graceful-fs'),
    app = express();
    
var React = require('react'),
    ReactDOMServer = require('react-dom/server'),
    ImageList = React.createFactory(require("./component/ImageList.js"));
    
app.set('port', (process.env.PORT || 8080));
app.listen(app.get('port'), function() {
    console.log('Server started: http://localhost:'+app.get('port')+'/') ;
});

// app.use(express.static(__dirname + '/public'));
// app.get('/', function(request, response) {
//     response.send('Maintenance');
//     response.end();
// });

app.use('/img', express.static('./imgData'));

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

let htmlCache;

app.get('/', (request, response) => {
    response.setHeader('Content-Type', 'text/html');
    if (!htmlCache) {
        fs.readdir('./imgData', (error, list) => {
            if (error) return response.status(500).send('Error loading directory');
            // let html = ReactDOMServer.renderToStaticMarkup(React.DOM.body(null, 
            //     React.DOM.div({id:'content'}, ImageList({
            //             list: list
            //         })),
            //     React.DOM.script({src: '//fb.me/react-0.14.5.js'}),
            //     React.DOM.script({src: '//fb.me/react-dom-0.14.5.js'})
            //     // React.DOM.script({src: '//fb.me/react-0.14.3.min.js'}),
            //     // React.DOM.script({src: '//fb.me/react-dom-0.14.3.min.js'})
            // ));
            htmlCache = ReactDOMServer.renderToStaticMarkup(React.DOM.html({
                children: [
                    React.DOM.head(null,
                        React.DOM.title(null, "Nogizaka"),
                        React.DOM.link({
                            rel: "stylesheet",
                            href: "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"
                        })
                    ),
                    React.DOM.body(null, 
                        React.DOM.div({id:'content'}, ImageList({
                                list: list
                            })),
                        // React.DOM.script({src: '//fb.me/react-0.14.3.min.js'}),
                        // React.DOM.script({src: '//fb.me/react-dom-0.14.3.min.js'})
                        React.DOM.script({src: '//fb.me/react-0.14.5.js'}),
                        React.DOM.script({src: '//fb.me/react-dom-0.14.5.js'}),
                        React.DOM.script({src: '//ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js'}),
                        React.DOM.script({src: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js'})
                    )
                ]
            }));
            response.send(htmlCache);
            
            setTimeout(function() {
                htmlCache = void 0;
            }, 60 * 60 * 1000);
        });
    } else {
        response.send(htmlCache);
    }
});