//server.js - app controller
var config = require('config');
console.log('Web service initializing');
// Module dependencies.
var _ = require('underscore');
var application_root = __dirname,
    express = require('express'),
    path = require('path'); //Utilities for dealing with file paths

//Create server
var app = express(),
    http = require('http'),
    server = http.createServer(app),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override'),
    errorHandler = require('errorhandler')
// Configure server

//app.use(express.basicAuth('tagged', 'tagged'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
//checks request.body for HTTP method overrides
app.use(methodOverride('X-HTTP-Method-Override'))    //checks request.body for HTTP method overrides
//Where to serve static content
app.use(express.static(path.join(application_root, 'public'), {maxAge: '3d'}));


//app.use(app.router); //moved after static for SPA
// required for passport
console.log('NODE_ENV: ' + config.util.getEnv('NODE_ENV'));

app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

//Start server
var port = config.get('http_port');
server.listen(process.env.PORT || port, function () {
    console.log('Express server listening on port %d in %s mode', process.env.PORT || port, app.settings.env);
});


app.get('/api/v1/search/', function (req, res) {
    var request = require('request');
    var geolib = require('geolib');

    var search = req.query['search'];
    var lat = req.query['lat'];
    var long = req.query['long'];
    var lang = req.query['lang'];
    var api = "http://photon.komoot.de/api/?q=" + search + "&lat=" + lat + "&lon=" + long + "&lang=" + lang;
    console.log(api);
    request.get(api, {json: true}, function (error, result, body) {
        var places = [];
        if (body.features) {
            places = body.features;
            // places= _.filter(places, function (p) { return p.properties.osm_key=='place'});
            places = _.filter(places, function (p) {
                return p.properties.osm_value == 'city' || p.properties.osm_value == 'administrative'
            });
            // dedupe places within 4 miles of each other (this knocks out administrative levels with same centroid as city)
            for (var x = 0; x < places.length; x++) {
                for (var y = 0; y < places.length; y++) {
                    if (x != y &&  places[x] && places[y]) {
                        var distance = geolib.getDistance(
                            {latitude: places[x].geometry.coordinates[1], longitude: places[x].geometry.coordinates[0]},
                            {latitude: places[y].geometry.coordinates[1], longitude: places[y].geometry.coordinates[0]});
                        if (distance < 1609*4) { // ignore anything within 4 miles
                            console.log('deduping', places[y],distance);
                            places[y] = null;
                        }
                    }

                }

            }
            places = _.filter(places, function (p) {
                return p != null
            });
        }

        res.send({places: places, data: body});

    })
    // http://photon.komoot.de/api/?q=berlin&lat=52.3879&lon=13.0582&lang=en


})