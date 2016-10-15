/**
 * Created by Administrator on 6/2/2015.
 * Helper for session
 */
var jwt = require('jsonwebtoken');
var shortermExpire = 60; //1 day = 1440 mins
var longtermExpire = shortermExpire  * 365;
var config = require('../config')


var S = module.exports = {};

S.encode = function (data, callback) {
  console.log("Session->encode",data);
  console.log("Session->encode->session_secret",config.session_secret);
  jwt.sign(data, config.session_secret, {}, function(err, token) {
    if (typeof callback == 'function') {
        return callback(token);
    }
  });
}

S.verify = function(token, callback){
  jwt.verify(token, config.session_secret,function(err,decoded){
    if(decoded == "undefined"){
      return callback(false);
    } else {
      return callback(true,decoded)
    }
  })
}
