//server.js - app controller
var config = require('config');
console.log('Web service initializing');
// Module dependencies.
var _ = require('underscore');
var uuid=require('node-uuid');

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

app.post('/api/v1/save/', function (req, res) {
    var shortlink= uuid.v1();
    var fs=require('fs');
    fs.writeFileSync(__dirname+'/tmp/save-'+shortlink,req.body.data);
    res.send({shortlink: shortlink});

});
app.get('/api/v1/read/', function (req,res) {
    var shortlink=req.query['shortlink'];
    var fs=require('fs');
    var data=fs.readFileSync(__dirname+'/tmp/save-'+shortlink).toString();
    res.send({data: data});

});

app.get('*', function (req, res) {
    //
    var url_path = req.path ;
    res.redirect('/#' + url_path);
});