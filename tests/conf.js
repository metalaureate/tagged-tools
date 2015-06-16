// conf.js
var ScreenShotReporter = require('protractor-screenshot-reporter');
var path = require('path');
var multi = [{
    'browserName': 'chrome'
}];

exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['spec.js'],
    allScriptsTimeout: 90000,
    getPageTimeout: 90000,
    multiCapabilities: multi,
    onPrepare: function () {
        // Add a screenshot reporter and store screenshots to `/tmp/screnshots`:
        if (multi.length == 1) {
            jasmine.getEnv().addReporter(new ScreenShotReporter({
                baseDirectory: __dirname + '/screenshots',
                pathBuilder: function pathBuilder(spec, descriptions, results, capabilities) {
                    var seed = (new Date()).getTime() + Math.random();
                    var passed = (results.passed()) ? 'pass' : 'FAIL';
                    return path.join(capabilities.caps_.browserName, passed, descriptions.join('-')) + "_" + seed;
                }
            }));
        }
        global.dv = browser.driver;
        global.isAngularSite = function(flag){
            browser.ignoreSynchronization = !flag;
        };


    },
    jasmineNodeOpts: {
        defaultTimeoutInterval: 90000,
        realtimeFailure: true
    }
}