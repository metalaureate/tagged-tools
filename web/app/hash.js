


function fuzzyHash(file, callback) {
    var phash = require('phash-image');
    console.time('phash');
    phash.mh(file, function (err, hash) {
        if (err) throw err;
        console.log(hash);
        console.timeEnd('phash');
        callback(err, hash);

    });
}
fuzzyHash(__dirname+'/public/images/dash.jpeg',function(err, hash1) {
    fuzzyHash(__dirname+'/public/images/dash_changed.jpg',function(err, hash2) {
        var compare=require('hamming-distance');
        console.log('distance',compare(hash1, hash2));

    });

})