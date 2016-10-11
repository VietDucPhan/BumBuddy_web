/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var ObjectID = require('mongodb').ObjectID;


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
      if(status){
        return callback(true,rec);
      } else {
        Users.save(userData,function(err,status){
          UsersModel.getUserByEmail(userData.email,function(status, rec){
            return callback(true,rec);
          });
        });
      }
    });
  } else {
    return callback(false);
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
