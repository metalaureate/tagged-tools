var config=require('config');
var winston=require('winston');
if (config.get('DEBUG_MODE')) { winston.level='debug';}

var db = require("any-db-postgres");

var conString="postgres://"+config.get("postgres.username")+":"+
    config.get("postgres.password")+
    "@"+config.get("postgres.host")+
    ":"+config.get("postgres.port")+
    "/"+config.get("postgres.db");

winston.info(conString);
var conn = db.createConnection(conString);

module.exports = conn;
winston.info('Initialized db connection');

/**
 * Created by shill on 5/11/15.
 */
