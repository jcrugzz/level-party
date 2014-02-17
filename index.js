var level = require('level');
var multilevel = require('multilevel');
var levelProxy = require('level-proxy');
var net = require('net');
var fs = require('fs');
var path = require('path');

module.exports = function (dir, opts) {
    var proxy = levelProxy();
    var db = level(dir, opts);
    var sockfile = path.join(dir, 'level-multihandle.sock');
    
    db.once('error', function (err) {
        db.removeListener('open', onopen);
        
        if (err.type === 'OpenError') createStream();
    });
    db.once('open', onopen);
    
    function onopen () {
        var server = net.createServer(function (stream) {
            stream.pipe(multilevel.server(db)).pipe(stream);
        });
        server.listen(sockfile);
        var close = db.close;
        db.close = function () {
            server.close();
            return close.apply(this, arguments);
        };
        proxy.swap(db);
    }
    return proxy;
    
    function createStream () {
        var xdb = multilevel.client();
        
        (function connect () {
            var stream = net.connect(sockfile);
            stream.on('connect', function () {
                xdb.on('open', function () {
                    proxy.swap(xdb);
                    db.emit('open');
                });
                var close = xdb.close;
                xdb.close = function () {
                    stream.end();
                    return close.apply(this, arguments);
                };
            });
            
            stream.on('error', function (err) {
                setTimeout(connect, 50);
            });
            stream.pipe(xdb.createRpcStream()).pipe(stream);
        })();
    }
};
