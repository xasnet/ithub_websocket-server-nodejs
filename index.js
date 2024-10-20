const http = require('http');
const url = require('url');
const fs = require('fs');

const setMime = {
    css: 'text/css',
    js: 'application/javascript',
    html: 'text/html',
    png: 'image/png',
    webp: 'image/webp',
    ttf: 'font/ttf',
    woff2: 'font/woff2',
    woff: 'font/woff',
    eot: 'font/eot',
    ico: 'image/x-icon',
    wav: 'audio/x-wav',
    ogg: 'audio/ogg',
    mp3: 'audio/mpeg',
    svg: 'image/svg+xml',
}

const define = function (req, res, postData) {
    let urlParsed = url.parse(req.url, true);
    let path = urlParsed.pathname;
    prePath = __dirname;

    if (path == '/') {
        path = '/index.html'
    }

    fs.stat(prePath + path, function (err, stat) {
        if (err == null && stat.isFile()) {

            let type = path.split('.').pop(),
                mime = 'text/plain', setHead = {}
            if (typeof setMime[type] != 'undefined') {
                mime = setMime[type]
                setHead['Content-Type'] = mime
            }
            res.writeHead(200, setHead);
            let readStream = fs.createReadStream(prePath + path);
            readStream.pipe(res);
            return;

        } else if (err == null && stat.isDirectory()) {
            console.log('Some other error: ', err);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("Not found!");
            return;
        } else {
            console.log('Some other error: ', err.code);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("Not found");
            return;
        }
    });
};

const server = new http.Server(function (req, res) {
    var jsonString = '';
    res.setHeader('Content-Type', 'text/html');
    req.on('data', (data) => {
        jsonString += data;
    });
    req.on('end', () => {
        define(req, res, jsonString);
    });
});

server.listen(3000, () => {
    require('child_process').exec('start http://localhost:3000');
});