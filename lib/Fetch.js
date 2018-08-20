
var Request = require('request');
var Sha1 = require('./Sha1');

var Fetch = module.exports = {};

Fetch.get = function(url,callback){
  if(url && url.indexOf('http') != -1){
    Request.get(url, function (err, response, body) {
      if(body){
        var resBody = JSON.parse(body);
        return callback(resBody);
      }
      return callback(null);
    })
  }
  return callback(null);
};

Fetch.post = function(url,data,callback){
  if(url && data && url.indexOf('http') != -1){
    Request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     url,
      body:    JSON.stringify(data)
    }, function (err, response, body) {
      if(body){
        var resBody = JSON.parse(body);
        return callback(resBody);
      }
      return callback(null);
    })
  }
  return callback(null);
};

Fetch.getFacebookProfile = function(accessToken, callback){
  if(accessToken){
    var url = 'https://graph.facebook.com/v2.9/me?access_token='+accessToken+'&fields=id,name,email,picture';
    Fetch.get(url, function(res){
      return callback(res);
    });
  }
  return callback(null);
};

Fetch.getGoogleProfile = function(accessToken, callback){
  if(accessToken){
    var url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token='+accessToken;
    Fetch.get(url, function(res){
      return callback(res);
    });
  }
  return callback(null);
};