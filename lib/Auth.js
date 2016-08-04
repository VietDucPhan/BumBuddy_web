/**
 * Created by Administrator on 6/2/2015.
 * Helper for model before insert data to mongodb
 */
var bcrypt = require('bcrypt');
var AppModel = require('./Model');
var async = require('async');
var jwt = require('jsonwebtoken');
var config = require('../config');

var A = module.exports = {}

A.auth = function(username,password,callback){
  var users = AppModel.db.collection('users');
  var alias = AppModel.db.collection('alias');
  var error = [];
  async.waterfall([
    function(callback){
      users.findOne({email:username},function(err,rec){
        if(rec == undefined){
          error.push({msg:'User name not found!',type:'warning'});
          callback(true,error);
        } else {
          callback(null, rec);
        }

      });
    },
    function(respond,callback){
      if(respond.activate == 0){
        callback(null, respond);
      } else {
        error.push({msg:'Please activate your account',type:'warning'});
        callback(true,error);
      }
    },
    function(respond,callback){
      bcrypt.compare(password, respond.password, function(err, res) {
        if(res){
          callback(null,error,respond);
        } else {
          error.push({msg:'Wrong password!',type:'warning'});
          callback(true,error);
        }

      });
    },
    function(error,respond,callback){
      alias.findOne({admin:respond._id},{_id:1,name:1,username:1,type:1,picture:1},function(err,rec){
        if(rec){
          respond.alias = rec;
        }

        callback(null,error,respond);
      })
    }
  ],function(err,errorMessage,record){
    if(typeof callback == 'function'){
      return callback(errorMessage,record);
    }
  });
}

A.jwtDecode = function(token,callback){
  jwt.verify(token,config.session_secret,function(err,decoded){
    res = {
      tokenExp : false,
      msg : [],
      data : decoded
    }
    if(err){
      res.tokenExp = true;
      res.msg.push({msg:'Please login to access content',type:'warning'})
    }

    if(typeof callback == "function"){
      return callback(res);
    }
    return res;
  })
}

A.generatePassword = function(password,callback){
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      if(typeof callback == 'function'){
        return callback(err, hash);
      } else {
        return hash
      }
    });
  });
}