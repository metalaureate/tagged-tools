var fs = require('fs-extra');
var host = browser.params.host;
var winston = require('winston');
var async = require('async');
var cheerio = require('cheerio');
var _ = require('underscore');
require('jasmine-bail-fast');

var mail = require('./mail-tester');

var request = require('request');
var jar = request.jar();
var req = request.defaults({
    jar: jar
});

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'data.log' })
    ]
});

browser.driver.manage().window().maximize();

function post(url, params) {
    var defer = protractor.promise.defer();
    console.log("Calling", host + url);
    req.post(host + url, params, function (error, message) {
        console.log("Done call to", url);
        if (error || message.statusCode >= 400) {
            defer.reject({
                error: error,
                message: message
            });
        } else {
            defer.fulfill(message);
        }
    });
    return defer.promise;
}

/*
 -- tests start
 */

var test_account = {};
jasmine.getEnv().bailFast();
var uids = [];

describe("Set up testing", function () {
    it("should initialize testing", function () {

        fs.removeSync(__dirname + '/screenshots/*');
        /*
         var flow = protractor.promise.controlFlow();

         flow.execute(function () {
         return post('api/v1/testing/setup/', {
         qs: {
         key: browser.params.purgeSecret
         }
         })
         }).then(function (result) {
         var data = JSON.parse(result.body);
         expect(data.response).toContain('ok');
         test_account = data.test_account;
         browser.tester = data.test_account;
         console.log('test account', test_account);
         });
         */


    });
});


describe('Log in', function () {
    beforeEach(function () {
        isAngularSite(false);
    });

    it('should log in with test account', function () {
        browser.get('http://www.tagged.com/');
        dv.switchTo().frame(dv.findElement(protractor.By.id('login_frame')));
        element(by.id('username')).sendKeys('simon@tagged.com');
        element(by.id('password')).sendKeys('holonarchy');
        element(by.id('signInBtn')).click();
        dv.switchTo().defaultContent();

        // And WAIT for angular!!

    });
    it('navigate to Browse', function () {
        element(by.id('nav_people')).click();
        browser.driver.sleep(2000).then(function () {
            expect(element(by.css('.icon-filters')).isDisplayed()).toBeTruthy();

        });

    });
});

describe('Set Browse filters', function () {
    beforeEach(function () {
        isAngularSite(true);
    });

    it('set filters', function () {

        expect(element(by.css('.icon-filters')).isDisplayed()).toBeTruthy();
        element(by.css('.icon-filters')).click();

        expect(element(by.model('filters.newlocation')).isDisplayed()).toBeTruthy();

        var gender = element(by.model('filters.gender'));
        gender.element(by.cssContainingText('option', 'Females')).click();

        // -- min age
        element(by.model('filters.minAge')).clear();
        element(by.model('filters.minAge')).sendKeys('20');
        element(by.model('filters.minAge')).getAttribute('value');

        // -- max age
        element(by.model('filters.maxAge')).clear();
        element(by.model('filters.maxAge')).sendKeys('40');
        element(by.model('filters.maxAge')).getAttribute('value');
        var country = element(by.model('filters.country'));
        country.element(by.cssContainingText('option', 'United States')).click();

        element(by.model('filters.newlocation')).clear();
        element(by.model('filters.newlocation')).sendKeys('San Francisco, CA');

        var distance = element(by.model('filters.distance'));
        distance.click();
        distance.element(by.cssContainingText('option', '100 miles')).click();

        element(by.buttonText('Update Filters')).click();


        /*
         .then(function (text) {
         console.log('group picked', text);
         browser.pause();
         })
         */

        // filters.newlocation


    });

});

describe('Records results', function () {
    beforeEach(function () {
        isAngularSite(true);
    });
    it('should paginated and collect results', function () {
        async.eachSeries([1, 2, 3], function (i, next) {
            winston.info('retrive UIDS on this page');
            element.all(by.repeater('user in browseResults.users track by user.userId'))
                .each(function (ele, index) {
                    // Will print 0 First, 1 Second, 2 Third.
                    return ele.getInnerHtml().then(function (e) {
                        var card = e.match(/\/[1234567890]*\"|\/[1234567890]*\?/ig);
                        if (card) {
                            var uid = card[0].substr(1, (card[0].length) - 2);
                            var $ = cheerio.load(e);

                            var online = ($(".status").text() == "Online");
                            var name = $(".name").text();
                            var details = $(".details").text();

                            uids.push({
                                uid: uid,
                                online: online,
                                name: name,
                                age: details.split(',')[0],
                                location: details.split(',')[1]
                            });
                            // winston.info(uid);
                        }
                    });
                })
                .then(function () {
                    element(by.cssContainingText(".next", "Next")).click();
                    browser.driver.sleep(2000).then(function () {
                        next();
                    });
                });
        }, function (err) {
            expect(uids.length).toBeGreaterThan(24);
        });

        // expect(list.count()).toBeGreaterThan(2);
    });
    it('should lookup results', function () {
        console.log(uids);

        uids.forEach(function (r) {
            var log={uid:r.uid}; // , location: r.location, age: r.age, name: r.name
            logger.info(log);

        })

        /*


        var flow = protractor.promise.controlFlow();
        winston.info('retrieving gp data');
        flow.execute(function () {
            return getUserDataGP(uids)
        }).then(function resolve(users) {
            winston.info(users);
            expect(users.length).toBeGreaterThan(2);
        });
         */
    });

});

function getUserDataGP(uids) {

    var deferred = protractor.promise.defer();
    var conn = require('./db-gp-prod');
    var ins = _.map(uids, function (u) {
        return u.uid;
    }).join(',');
    winston.info('uids', ins);
    conn.query("SELECT * FROM userdata_light WHERE user_id IN (" + ins + ")", [], function (error, result) {
        if (error) throw error;
        winston.warn('userdata light count', result.rowCount);
        deferred.fulfill(result.rows);
    });
    return deferred;
}
/**
 * @name waitForUrlToChangeTo
 * @description Wait until the URL changes to match a provided regex
 * @param {RegExp} urlRegex wait until the URL changes to match this regex
 * @returns {!webdriver.promise.Promise} Promise
 */
function waitForUrlToChangeTo(urlRegex) {
    var currentUrl;

    return browser.getCurrentUrl().then(function storeCurrentUrl(url) {
            currentUrl = url;
        }
    ).then(function waitForUrlToChangeTo() {
            return browser.wait(function waitForUrlToChangeTo() {
                return browser.getCurrentUrl().then(function compareCurrentUrl(url) {
                    return urlRegex.test(url);
                });
            }, 90000);
        }
    );
}