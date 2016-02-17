var express = require('express');
var router = express.Router();

////////////////////////////////////////////
//var path = require('path');
var qs = require('querystring');
var mongoose = require('mongoose');
var async = require('async');
var bcrypt = require('bcryptjs');
//var bodyParser = require('body-parser');
var colors = require('colors');
var cors = require('cors');
//var express = require('express');
//var logger = require('morgan');
var jwt = require('jwt-simple');
var moment = require('moment');
var request = require('request');
var session = require('express-session');
var oauth = require('oauth');
var config = require('../config');
//////////////////////////////////////////////

var User = mongoose.model('User');


var session = {};


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/*
 |--------------------------------------------------------------------------
 | Login with Open Bank Project
 |--------------------------------------------------------------------------
 */
router.post('/auth/connect', function(req, res) {
  var base_url = 'https://apisandbox.openbankproject.com';
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
    request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
      var oauthToken = qs.parse(body);
      session.oauth_token_req = oauthToken.oauth_token;
      session.oauth_token_secret_req = oauthToken.oauth_token_secret;

      // Step 2. Send OAuth token back to open the authorization screen.
      res.send(oauthToken);
    });
  }else {
      res.send({token : session.oauth_token});
  }

});


/*
 |--------------------------------------------------------------------------
 | Login with Open Bank Project
 |--------------------------------------------------------------------------
 */
router.get('/auth/callback', function(req, res) {
  var base_url = 'https://apisandbox.openbankproject.com';
  var requestTokenUrl = base_url + '/oauth/initiate';
  var accessTokenUrl = base_url + '/oauth/token';
 
 
    // Part 2 of 2: Second request after Authorize app is clicked.
    var accessTokenOauth = {
      consumer_key: config.OPENBANK_KEY,
      consumer_secret: config.OPENBANK_SECRET,     
      token: session.oauth_token_req,       
      token_secret : session.oauth_token_secret_req,
      verifier: req.query.oauth_verifier   
    };

   
    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {

      var accessToken = qs.parse(accessToken);

      console.log({token :accessToken});

      var profileOauth = {
        consumer_key: config.OPENBANK_KEY,
        consumer_secret: config.OPENBANK_SECRET,
        oauth_token: accessToken.oauth_token
      };

      if(err){

      }else {
        session.oauth_token = accessToken.oauth_token;
        session.oauth_token_secret = accessToken.oauth_token_secret;
        res.send(accessToken.oauth_token);
      };
      
     
    });

});


/*
 |--------------------------------------------------------------------------
 | Login with GitHub
 |--------------------------------------------------------------------------
 */
router.post('/auth/github', function(req, res) {
  var accessTokenUrl = 'https://github.com/login/oauth/access_token';
  var userApiUrl = 'https://api.github.com/user';
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.GITHUB_SECRET,
    redirect_uri: req.body.redirectUri
  };

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params }, function(err, response, accessToken) {
    accessToken = qs.parse(accessToken);
    var headers = { 'User-Agent': 'Satellizer' };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function(err, response, profile) {

      // Step 3a. Link user accounts.
      if (req.header('Authorization')) {
        User.findOne({ github: profile.id }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a GitHub account that belongs to you' });
          }
          var token = req.header('Authorization').split(' ')[1];
          var payload = jwt.decode(token, config.TOKEN_SECRET);
          User.findById(payload.sub, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
            user.github = profile.id;
            user.picture = user.picture || profile.avatar_url;
            user.displayName = user.displayName || profile.name;
            user.save(function() {
              var token = createJWT(user);
              res.send({ token: token });
            });
          });
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        User.findOne({ github: profile.id }, function(err, existingUser) {
          if (existingUser) {
            var token = createJWT(existingUser);
            return res.send({ token: token });
          }
          var user = new User();
          user.github = profile.id;
          user.picture = profile.avatar_url;
          user.displayName = profile.name;
          user.save(function() {
            var token = createJWT(user);
            res.send({ token: token });
          });
        });
      }
    });
  });
});


module.exports = router;
