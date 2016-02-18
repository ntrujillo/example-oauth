var express = require('express');
var router = express.Router();

////////////////////////////////////////////
var qs = require('querystring');
var async = require('async');
var bcrypt = require('bcryptjs');
var colors = require('colors');
var cors = require('cors');
var jwt = require('jwt-simple');
var moment = require('moment');
var request = require('request');
var session = require('express-session');
var oauth = require('oauth');
var config = require('../config');
//////////////////////////////////////////////


var session = {};
var base_url = 'https://apisandbox.openbankproject.com';
var consumer = new oauth.OAuth(
  base_url + '/oauth/initiate',
  base_url + '/oauth/token',
  config.OPENBANK_KEY,
  config.OPENBANK_SECRET,
  '1.0',                             //rfc oauth 1.0, includes 1.0a
  'http://127.0.0.1:8080/callback',
  'HMAC-SHA1');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});


/*
 |--------------------------------------------------------------------------
 | Login with Open Bank Project
 |--------------------------------------------------------------------------
 */
router.post('/auth/connect', function(req, res) {    
    var requestTokenUrl = base_url + '/oauth/initiate';
    var accessTokenUrl = base_url + '/oauth/token';

    // Part 1 of 2: Initial request from Satellizer.
    if (!req.body.oauth_token || !req.body.oauth_verifier) {
        var requestTokenOauth = {
            callback: req.body.redirectUri,
            consumer_key: config.OPENBANK_KEY,
            consumer_secret: config.OPENBANK_SECRET
        };

        // Step 1. Obtain request token for the authorization popup.
        request.post({
            url: requestTokenUrl,
            oauth: requestTokenOauth
        }, function(err, response, body) {
            var oauthToken = qs.parse(body);
            session.oauth_token_req = oauthToken.oauth_token;
            session.oauth_token_secret_req = oauthToken.oauth_token_secret;

            // Step 2. Send OAuth token back to open the authorization screen.
            res.send(oauthToken);
        });
    } else {
        res.send({
            token: session.oauth_token
        });
    }

});


/*
 |--------------------------------------------------------------------------
 | Login with Open Bank Project
 |--------------------------------------------------------------------------
 */
router.get('/auth/callback', function(req, res) {   
    var requestTokenUrl = base_url + '/oauth/initiate';
    var accessTokenUrl = base_url + '/oauth/token';


    // Part 2 of 2: Second request after Authorize app is clicked.
    var accessTokenOauth = {
        consumer_key: config.OPENBANK_KEY,
        consumer_secret: config.OPENBANK_SECRET,
        token: session.oauth_token_req,
        token_secret: session.oauth_token_secret_req,
        verifier: req.query.oauth_verifier
    };


    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post({
        url: accessTokenUrl,
        oauth: accessTokenOauth
    }, function(err, response, accessToken) {

        var accessToken = qs.parse(accessToken);

        console.log({
            token: accessToken
        });

        var profileOauth = {
            consumer_key: config.OPENBANK_KEY,
            consumer_secret: config.OPENBANK_SECRET,
            oauth_token: accessToken.oauth_token
        };

        if (err) {

        } else {
            session.oauth_token = accessToken.oauth_token;
            session.oauth_token_secret = accessToken.oauth_token_secret;
            res.send(accessToken.oauth_token);
        };


    });

});



router.get('/private', function(req, res) {
    consumer.get(base_url+"/obp/v1.2.1/banks/rbs/accounts/private",
        session.oauth_token,
        session.oauth_token_secret,
        function(error, data, response) {
            var parsedData = JSON.parse(data);
            res.status(200).send(parsedData)
        });
});

router.get('/public', function(req, res) {
    request( base_url+'/obp/v1.2.1/banks/rbs/accounts',
                function(error, data, response) {
            var parsedData = JSON.parse(response);
            res.status(200).send(parsedData)
        });
});



module.exports = router;