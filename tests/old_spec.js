var fs = require('fs-extra');
var host = browser.params.host;
require('jasmine-bail-fast');

var mail = require('./mail-tester');

/*
 -- command line config
 */


/*
 -- helper functions
 */

var request = require('request');
var jar = request.jar();
var req = request.defaults({
    jar: jar
});

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


describe("Set up testing", function () {
    it("should initialize testing", function () {
        browser.get(host);
        console.log('remove ' + __dirname + '/screenshots/*');
        fs.removeSync(__dirname + '/screenshots/*');
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


    });
});


describe('User follows shared link', function () {
    it('should ask them to log in or sign up', function () {
        browser.get(test_account.social_share_shortlink);
        expect(element(by.id('signup-button')).isDisplayed()).toBeTruthy();
        element(by.id('signup-button')).click(); // should force login
    });
});

describe('User signs up', function () {
    it('should let me sign up', function () {
        // browser.driver.wait(protractor.until.elementIsVisible( element(by.id("signup-button"))));
        expect(browser.getLocationAbsUrl()).toContain('/signup');
        browser.executeScript("$('#username').val('" + test_account.username + "');");
        element(by.model('user.username')).sendKeys('x');
        test_account.username += 'x';
        // browser.executeScript('arguments[0].value = "(123) 456-7890";', element(by.name('masked')).getWebElement());
        // expect(element(by.name('masked')).getAttribute('value')).toEqual("(123) 456-7890");
        element(by.model('user.password')).sendKeys("holonarchy");
        element(by.model('user.email')).sendKeys(test_account.email);

        element(by.model('user.hero')).sendKeys(test_account.target_group);
        element(by.model('user.email')).click(); // clear drop down
        element(by.id('signup-btn')).click();
        expect(browser.getLocationAbsUrl()).toContain('/queue/');
        browser.get(test_account.social_share_shortlink);
        expect(element(by.id('accept-btn')).isDisplayed()).toBeTruthy();
    });

});

describe('Accepts offer', function () {

    it('should ask you to accept the shared link offer', function () {
        expect(browser.getLocationAbsUrl()).toContain('/offered/');
        element(by.id('accept-btn')).click();
        // expect(browser.getLocationAbsUrl()).toContain('/queue/');

        waitForUrlToChangeTo(/queue/ig).then(function () {
            expect(browser.getLocationAbsUrl()).toContain('/queue/');
        });


    });

    it('should show the signup queue', function () {
        expect(browser.getLocationAbsUrl()).toContain('/queue');
        // expect(browser.getLocationAbsUrl()).not.toContain('/queue');
        // element(by.id('login-button')).isPresent();
    });
    it('should now log log out', function () {
        element(by.id('nav-logout')).click();

    })
});

describe("Validates email", function () {
    it("should validate email", function () {
        var flow = protractor.promise.controlFlow();
        console.log('starting test for email');
        flow.execute(function () {
            return mail.waitForMail(protractor.promise.defer(), {
                username: 'daemon@idelog.me',
                password: 'pratityasamutpada0'
            }, "Validate", test_account.username, 90000)
                .then(function resolve(body) {
                    console.log('email', body.text);
                    var validate_path = body.text.match(/user\/validate\/.*[\>|\'|\"\]]/ig);
                    ;

                    console.log('email validated path', validate_path);
                    expect(validate_path[0]).toContain("user/validate");
                    browser.get(host + (validate_path[0].substr(0, validate_path[0].length - 1)));

                }, function failure() {
                    console.log('failure');
                    expect(true).toBe(false);

                })
        })
    });

});


describe('Idelog Log in', function () {
    it('should let me log in', function () {
        element(by.id('login-button')).click(); // should force login
        element(by.model('user.username')).sendKeys(test_account.username);
        element(by.model('user.password')).sendKeys("holonarchy");

        element(by.id('login-button-fm')).click();
        expect(browser.getLocationAbsUrl()).toContain('/messages');

    });
});

describe('Create offer', function () {
    it('should by-pass signup queue', function () {
        var flow = protractor.promise.controlFlow();

        flow.execute(function () {
            return post('api/v1/testing/setUser/', {
                qs: {
                    username: test_account.username,
                    option: 1
                }
            })
        }).then(function (result) {
            var data = JSON.parse(result.body);
            expect(data.response).toContain('ok');
        });
    });

    it('should create a preview', function () {
        browser.get(host + 'offer/');
        expect(browser.getLocationAbsUrl()).toContain('/offer/');
        element(by.id('source-link')).click();
        element(by.id('clear-btn')).click();
        element(by.model('token.tokenURL')).sendKeys(test_account.offer_url);
        element(by.id('button-get')).click();
        var list = element.all(by.repeater('id in token.tagList'));
        expect(list.count()).toBeGreaterThan(2);

    });

    it('should pick a group', function () {
        var list = element(by.repeater('id in token.tagList'));

        list.getText().then(function (label) {
            console.log('selecting ' + label);

            element(by.css('.list-ids div')).click();
            element(by.css('.group-input input')).getAttribute('value').then(function (text) {
                console.log('group picked', text);
                expect(text).toContain(label);
            });

        });
    });

    it('should make the offer', function () {
        element(by.id("submit-offer")).click();
        // browser.driver.wait(protractor.until.elementIsVisible( element(by.id("buy-in-btn"))));
        expect(element(by.id('buy-in-btn')).isDisplayed()).toBeTruthy();

        element(by.id("buy-in-btn")).click();
        element(by.id("charge-btn")).click();

        //expect(element(by.id('ask-friends-btn')).isDisplayed()).toBeTruthy();
        // browser.driver.wait(protractor.until.elementIsVisible( element(by.id("ask-friends-btn"))));
        //expect(browser.getLocationAbsUrl()).toContain('/distribute/');

        waitForUrlToChangeTo(/distribute/ig).then(function () {
            element(by.id("ask-friends-btn")).click();
            expect(browser.getLocationAbsUrl()).toContain('/distribute/');
        });
    });

    it('should share to friend', function () {
        expect(element(by.id('publicize-send-btn')).isDisplayed()).toBeTruthy();
        element(by.id("publicize-send-btn")).click();
    });

    it('should send email invite', function () {
        var flow = protractor.promise.controlFlow();
        console.log('starting test for email');
        flow.execute(function () {
            return mail.waitForMail(protractor.promise.defer(), {
                username: 'daemon@idelog.me',
                password: 'pratityasamutpada0'
            }, "Unleash", test_account.username, 90000)
                .then(function resolve(body) {
                    console.log('email', body.text);
                    // var r=new RegExp(test_account.title,'ig');
                    expect(body.text).toContain("/signed/"); // shortlink

                }, function failure() {
                    console.log('failure');
                    expect(true).toBe(false);
                })
        })
    });

});


describe('Delete test account', function () {
    it('should cleanup db test tables', function () {
        var flow = protractor.promise.controlFlow();

        flow.execute(function () {
            return post('api/v1/testing/cleanup/', {
                qs: {
                    username: test_account.username,
                    target_url: test_account.target_url
                }
            })
        }).then(function (result) {
            var data = JSON.parse(result.body);
            expect(data.response).toContain('ok');
        });
    });
});

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