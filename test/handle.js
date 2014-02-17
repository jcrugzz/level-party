var test = require('tape');
var level = require('../');
var path = require('path');
var tmpdir = require('os').tmpdir();
var datadir = path.join(tmpdir, 'level-multilevel-' + Math.random());

test('two handles', function (t) {
    t.plan(1);
    var adb = level(datadir, { encoding: 'json' });
    var bdb = level(datadir, { encoding: 'json' });
    var value = Math.floor(Math.random() * 100000);
    
    adb.put('a', value, function (err) {
        if (err) t.fail(err);
        var times = 0;
        
        bdb.get('a', function (err, x) {
            t.equal(x, value);
        });
    });
    
    t.on('end', function () {
        adb.close();
        bdb.close();
    });
});
