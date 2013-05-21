var http = require('http');
var url=require('url');

var proxyMap = {};
var proxyHandler = null;

var request = function(req, res) {
    if(req.protocol == 'https') {
        res.send('error.https');
        return;
    }
    var port=req.headers.host.split(":")[1];
    var _url=url.parse(req.url);

    var option = {
        'host': req.host,
        'port': port || '80',
        'path': _url['pathname']+(_url['search']||""),
        'method': req.method,
        'headers': req.headers
    };

    var clientReq = http.request(option);
    req.on('data', function(c) {
        clientReq.write(c);
    });
    req.on('end', function() {
        clientReq.end();
    });

    clientReq.on('response', function(response) {
        res.writeHeader(response.statusCode, response.headers);
        response.on('data', function(chunk) {
            res.write(chunk);
        });
        response.on('end', function() {
            res.end();
            proxyHandler && proxyHandler('response', res);
        });
    });

    clientReq.on('error', function(e) {
        console.log(e);
    });
};

exports.register = function(source, service) {
    proxyMap[source] = service;
};

exports.unregister = function(source) {
    proxyMap[source] = null
};

exports.proxy = function(req, res) {
    proxyHandler && proxyHandler('request', req);
    var url = req.protocol + '://' + req.host + req.path;
    console.log('on service proxy: ', url, proxyMap[url]);
    if (proxyMap[url] && proxyMap[url]._method.toLocaleLowerCase() == req.method.toLocaleLowerCase()) {
        // there is a proxt on this proxy
        proxyMap[url]._proxy(req, res, function() {
            proxyHandler && proxyHandler('response', res);
        });
    } else {
        // none proxy
        request(req, res);
    }
};

exports.onProxy = function(handler) {
    proxyHandler = handler;
};