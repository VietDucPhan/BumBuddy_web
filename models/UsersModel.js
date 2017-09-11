/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var ObjectID = require('mongodb').ObjectID;
var Session = require('../lib/Session');


var UsersModel = module.exports = {};

UsersModel.getCollection = function () {
  return AppModel.db.collection('users');
};

/**
* Add new user to database. created new if not already a user.
* @return boolean true on there is a document returned, false otherwise
* @return json Document of user.
**/
UsersModel.add = function(userData, callback){
  var Users = UsersModel.getCollection();
  if(userData.email  && userData.email != undefined && userData.email != null){
    UsersModel.getUserByEmail(userData.email,function(status, rec){
      console.log("getUserByEmail",userData.email);
      userData.settings = {
        radius:2
      };
      if(status){
        Session.encode(rec,function(token){
          rec.token = token;
          console.log(rec);
          return callback(true, rec);
        });
      } else {
        Users.save(userData,function(err,status){
          UsersModel.getUserByEmail(userData.email,function(status, rec){
            Session.encode(rec,function(token){
              rec.token = token;
              console.log(rec);
              return callback(true, rec);
            });
          });
        });
      }
    });
  } else {
    return callback(false);
  }
};

UsersModel.update = function(token,data, callback){
  var Users = UsersModel.getCollection();
  if(token != null && token != undefined){
    Session.verify(token,function(err,userDataDecoded){
      delete userDataDecoded.iat;
      if(err){
        Users.findOneAndUpdate({_id:new ObjectID(userDataDecoded._id)},{$set:data},{returnOriginal:false}, function (err, rec) {
          if (rec == undefined) {
            return callback({
              errors:
              [
                {
                  status:'s002',
                  source:{pointer:"models/UsersModel.update"},
                  title:"Unknown collection error",
                  detail:"Could not update profile"
                }
              ]
            });
          } else {
            var record = rec.value;
            Session.encode(record,function(token){
              record.token = token;
              console.log(rec);
              return callback({data:[record]});
            });
          }
        });
      }
    });


  } else {
    return callback({
      errors:
      [
        {
          status:'s002',
          source:{pointer:"models/UsersModel.update"},
          title:"Unknown collection error",
          detail:"Could not update profile"
        }
      ]
    });
  }
};


/**
* Get user by email
* @return boolean True on there is a user, false otherwise
* @return json Document of user on true.
**/
UsersModel.getUserByEmail = function(email, callback){
  var Users = UsersModel.getCollection();
  if(email != null && email != undefined){
    Users.findOne({email:email}, function (err, rec) {
        if (rec == undefined) {
          return callback(false);
        } else {
          return callback(true, rec);
        }
      });
  } else {
    return callback(false);
  }
};
