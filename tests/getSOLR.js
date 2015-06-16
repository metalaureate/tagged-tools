var request = require('request');
var async = require('async');
var fs = require('fs');
var winston = require('winston');
var _ = require('underscore');

var app_dir = __dirname;
winston.info(app_dir);
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({filename: 'solr_data.log'})
    ]
});
var data = JSON.parse(fs.readFileSync(app_dir + '/uids.json'));
winston.info(data);
var solr_data = [];

async.eachSeries(data, function (user, next) {
    var solr_api = "http://solrbrowse-r1s1.tagged.com:8080/solr/browse/select?q=id:" + user.uid + "&fl=*&wt=json&indent=true&shards=solrbrowse-r1s1.tagged.com:8080/solr,solrbrowse-r1s2.tagged.com:8080/solr";
    winston.info(solr_api);
    request.get(solr_api, {json: true}, function (error, response, body) {
        if (body.response.docs.length > 0) {
            var d = body.response.docs[0];
            var extract = {
                id: d.id,
                online: d.user_online, age_min: d.pref_min_age, age_max: d.pref_max_age,
                gender: d.user_gender,
                looking_for: mapLookingFor(d.user_looking_for),
                orientation: mapOrientation(d.user_orientation),
                gender_pref: d.pref_gender,
                pref_country: d.pref_country,
                pref_location_id: d.pref_location_id,
                user_ethnicity: _.reduce(d.user_ethnicity, function (m,n) { return m+=mapEthnicity(n)+', ' },''),
                user_inferred_ethnicity: mapEthnicity(d.user_inferred_ethnicity)
            };
            winston.info(extract);
            solr_data.push(extract);
            logger.info(extract);

        }
        setTimeout(next, 10);
    });

}, function (err) {
});

function mapOrientation(d) {
    var o=_.findWhere([{mask: 1, label: 'Straight'}, {mask: 2, label: 'Gay'}, { mask: 4,  label: 'Bi' }, {mask: 8, label: 'No Answer'}],
        {mask: d})
        if (o) {return o.label} else { return null}
}
function mapEthnicity(d) {
    var o=_.findWhere([{mask: 1, label: 'Black'}, {mask: 2, label: 'Asian'}, { mask: 4,  label: 'Caucasian' }, {mask: 8, label: 'Asian'},{mask: 16, label: 'Hispanic'},{mask: 32, label: 'Asian'}],
        {mask: d})
    if (o) {return o.label} else { return null}
}



function mapLookingFor(looking) {
    if (!looking || looking.length == 0) return null;
    var m = [{mask: 1, label: 'Friends'}, {mask: 2, label: 'Dating'}, {mask: 4, label: 'Serious'}, {
        mask: 8,
        label: 'Networking'
    },{
        mask: 16,
        label: 'Unknown'
    },{
        mask: 32,
        label: 'Unknown'
    }];
    var r = [];
    looking.forEach(function (l) {
        r.push(_.findWhere(m, {mask: l}).label);
    });
    return r.join(', ');
}
/*
 user_gender	M, F, B
 user_looking_for	Friends=1, Dating=2, Serious=4, Networking=8
 user_orientation	Straight=1, Gay=2, Bi=4, No Answer=8
 pref_gender
 pref_country
 pref_min_age
 pref_max_age
 pref_location_id
 user_ethnicity
 user_inferred_ethnicity
 user_online
 */