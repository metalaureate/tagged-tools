// Module dependencies.
var async = require('async');
var _ = require('underscore');
var application_root = __dirname,
    path = require('path'); //Utilities for dealing with file paths
var request = require('request');
var Q = require('q');
var POP3Client = require("poplib");
var MailParser = require("mailparser").MailParser;

var login = {username: "daemon@idelog.me", password: "pratityasamutpada0"}

module.exports.waitForMail = waitForMail;


function waitForMail(deferred, login, subject_str, inner_match_str, waitTime) {
    // var deferred = Q.defer();
    console.log('initializing mail check...');
    var poll;
    var next_msg;

    var timeout = setTimeout(function () {
        clearInterval(poll);
        deferred.reject();
    }, waitTime);

    function checkMail() {
        console.log('checking mail...');
        var client = new POP3Client(995, "mail.gandi.net", {
            tlserrs: false,
            enabletls: true,
            debug: false

        });

        client.on("error", function (err) {

            if (err.errno === 111) console.log("Unable to connect to server");
            else console.log("Server error occurred");

            console.log(err);

        });

        client.on("connect", function () {

            console.log("CONNECT success");
            client.login(login.username, login.password);

        });

        client.on("invalid-state", function (cmd) {
            console.log("Invalid state. You tried calling " + cmd);
        });

        client.on("locked", function (cmd) {
            console.log("Current command has not finished yet. You tried calling " + cmd);
        });

        client.on("login", function (status, rawdata) {

            if (status) {

                console.log("LOGIN/PASS success");
                client.list();

            } else {

                console.log("LOGIN/PASS failed");
                client.quit();

            }
        });

// Data is a 1-based index of messages, if there are any messages
        client.on("list", function (status, msgcount, msgnumber, data, rawdata) {

            if (status === false) {

                console.log("LIST failed");
                client.quit();

            } else if (msgcount > 0) {

                totalmsgcount = msgcount;
                currentmsg = 1;

                async.whilst(function () {
                    return currentmsg <= totalmsgcount
                }, function (next) {
                    console.log("LIST success with " + currentmsg + " message(s)");
                    next_msg = next;
                    client.retr(currentmsg);

                }, function (err) {
                    console.warn(err);
                });


            } else {

                console.log("LIST success with 0 message(s)");
                client.quit();

            }
        });

        client.on("retr", function (status, msgnumber, data, rawdata) {
            console.log('test', msgnumber);

            if (status === true) {
                currentmsg += 1;

                console.log("RETR success for msgnumber " + msgnumber);

                var mailparser = new MailParser();
                mailparser.on("end", function (mail_object) {

                    console.log("From:", mail_object.from); //[{address:'sender@example.com',name:'Sender Name'}]
                    console.log("Subject:", mail_object.subject); // Hello world!
                    console.log("Text body:", mail_object.text); // How are you today?

                    var regex = new RegExp(subject_str, "ig");

                    if ((mail_object.subject || '').match(regex)) {

                        var body = mail_object.text;
                        var regex = new RegExp(inner_match_str, "ig");

                        if (body.match(regex)) {

                            clearTimeout(timeout);
                            clearInterval(poll);
                            console.log('yay!!', 'email received');
                            client.dele(msgnumber);

                            deferred.fulfill(mail_object);

                        }
                    }

                });
                mailparser.write(data);
                mailparser.end();
                next_msg();
            } else {

                console.log("RETR failed for msgnumber " + msgnumber);
                client.rset();
                next_msg();

            }

        });

        client.on("dele", function (status, msgnumber, data, rawdata) {

            if (status === true) {

                console.log("DELE success for msgnumber " + msgnumber);
                client.quit();

            } else {

                console.log("DELE failed for msgnumber " + msgnumber);
                client.quit();

            }
        });

        client.on("quit", function (status, rawdata) {

            if (status === true) console.log("QUIT success");
            else console.log("QUIT failed");

        });
    }

    poll = setInterval(checkMail, 7000);
    return deferred.promise;
}


function testMail() {

    var p = waitForMail(Q.defer(), {
        username: 'daemon@idelog.me',
        password: 'pratityasamutpada0'
    }, "Validate", "potato", 30000);
    p.then(function resolve(email) {
        console.log('resolved', email);

    }, function reject(result) {
        console.log('reject', result);

    }).finally(function (result) {
        console.log('finally', result);

    });
}
// testMail();
