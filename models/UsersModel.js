/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var ObjectID = require('mongodb').ObjectID;
var Session = require('../lib/Session');
var Notification = require('./../lib/Notification');


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
  var self = this;
  var Users = UsersModel.getCollection();
  if(userData.email  && userData.email != undefined && userData.email != null){
    UsersModel.getUserByEmail(userData.email,function(status, rec){
      console.log("getUserByEmail",userData.email);
      userData.settings = {
        radius:2
      };
      if(status){
        self.updateExistigDeviceID(userData,true,function(response){
          if(response && response.errors){
            return callback(false);
          } else {
            Session.encode(response,function(token){
              rec.token = token;
              console.log(rec);
              return callback(true, rec);
            });
          }
        });

      } else {
        userData.username = userData.name.replace(/[^a-z0-9._-]/gi, '_').replace(/_{2,}/g, '_').toLowerCase();
        self.createUserNameNotAlreadyExists(userData.username,function(username){
          userData.username = username;
          if(userData.device_token){
            userData.push_token = userData.device_token;
            delete userData.device_token;
          }
          Users.save(userData,function(err,status){
            UsersModel.getUserByEmail(userData.email,function(status, rec){
              if(rec && rec.push_token){
                delete rec.push_token;
              }
              Session.encode(rec,function(token){
                rec.token = token;
                return callback(true, rec);
              });
            });
          });
        });
      }
    });
  } else {
    return callback(false);
  }
};

UsersModel.getUserNotifications = function(_id, callback){
  Notification.getNotificationsFromTOByID(_id,function(result){
    return callback({
      data:result
    })
  });
}

UsersModel.getUserProfile = function(_id, callback){
  var Users = UsersModel.getCollection();
  Users.aggregate([
    {$match:{_id:new ObjectID(_id)}},
    {$project:{
      username:1,
      profile_picture:1
    }}
  ]).toArray(function(err,documents){
      console.log('BumsModel.getBum.err',err);
      if (documents == null) {
        return callback({
          errors:
          [
            {
              status:'s003',
              source:{pointer:"models/BumsModel.getBum"},
              title:"Bum not found",
              detail:err.message
            }
          ]
        });
      } else {
        //console.log('BumsModel.getBum.documents',documents);

          return callback({
            data:documents
          });

      }
  });
}

UsersModel.updateExistigDeviceID = function(userData, flag, callback){
  var self = this;
  var Users = UsersModel.getCollection();
  self.getUserByEmail(userData.email,function(status, rec){
    if(status && userData && userData.device_token){
      if(!flag){
        userData.device_token.token = null
      }
      Users.findOneAndUpdate(
        {email:rec.email}
      ,{$set:{push_token:userData.device_token}},{returnOriginal:false},function(err,rec){
        if (rec == undefined) {
          return callback({
            errors:
            [
              {
                status:'s008',
                source:{pointer:"models/UsersModel.updateExistigDeviceID"},
                title:"Unknown collection error",
                detail:"Could not update device token"
              }
            ]
          });
        } else {
          var record = rec.value;
          delete record.push_token;
          return callback(record);
        }
      });
    } else {
      return callback({
        errors:
        [
          {
            status:'s008',
            source:{pointer:"models/UsersModel.updateExistigDeviceID"},
            title:"Unknown collection error",
            detail:"Could not update device token"
          }
        ]
      });
    }
  });
}

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

UsersModel.createUserNameNotAlreadyExists = function(username,callback){
  var self = this;
  UsersModel.isUserNameExists(username,function(response){
    if(response){
      var timestamp = Math.floor(Math.random() * 9) + 1  ;
      UsersModel.createUserNameNotAlreadyExists(username+timestamp,function(respnoseCon){
        if(respnoseCon){
          return callback(respnoseCon);
        }
      });
    } else {
      return callback(username);
    }
  });
}

UsersModel.isUserNameExists = function(username, callback){
  var Users = UsersModel.getCollection();
  if(username != null && username != undefined){
    Users.findOne({username:username}, function (err, rec) {
        if (rec == undefined) {
          return callback(false);
        } else {
          return callback(true);
        }
      });
  } else {
    return callback(false);
  }
};

UsersModel.getDevicePushToken = function(userID, callback){
  var self = this;
  var Users = UsersModel.getCollection();
  if(userID && userID != undefined){
    Users.findOne({_id:new ObjectID(userID)}, function (err, rec) {
        if (rec == undefined) {
          return callback(false);
        } else {

          return callback(true, rec.push_token);
        }
      });
  }
}

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
