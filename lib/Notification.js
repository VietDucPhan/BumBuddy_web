/**
 * Created by Administrator on 6/4/2015.
 * Sending email using nodemailer and node-email-template
 */
var config = require('../config');
var request = require('request');
var firebase = require('firebase-admin');
var ObjectID = require('mongodb').ObjectID;
var AppModel = require('./Model');
var serviceAccount = require('../firebase_config.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

var Notification = module.exports = {};

Notification.sendNotice = function(data, callback){
  var self = this;
  self.getUserDevicePushToken(data.to._id,function(flag, push_token){
    if(flag){
      var push_data = {
        data:{
          content:JSON.stringify(data)
        },
        notification:{
          body:data.body
        }
      }
      firebase.messaging().sendToDevice(push_token, push_data)
      .then(function(response) {
        console.log("Successfully sent message:", response);
        return callback(true);
      })
      .catch(function(error) {
        console.log("Error sending message:", error);
        return callback(false);
      });
    } else {
      console.log("Error get user push token:");
      return callback(false);
    }
  });
}

Notification.sendMentionedNotices = function(data, callback){
  var self = this;
  self.getUserDevicePushTokensByUserNames(data.data.mentioned,function(flag, push_token){
    if(flag && push_token && push_token[0]){
      var push_data = {
        data:{
          content:JSON.stringify(data)
        },
        notification:{
          body:data.from.username + " mentioned you in a comment"
        }
      }
      for(i = 0; i < push_token.length; i++){
        firebase.messaging().sendToDevice(push_token[i].push_token.token, push_data)
        .then(function(response) {
          console.log("sendMentionedNotices:", push_token.length);
          console.log("sendMentionedNotices:", i);
        })
        .catch(function(error) {
          return callback(false);
        });
        if(i == push_token.length - 1){
          return callback(true);
        }
      }

    } else {
      //console.log("Error get user push token:", error);
      return callback(false);
    }
  });
}

Notification.getUserDevicePushTokensByUserNames = function(usernames, callback){
  var self = this;
  var Users = AppModel.db.collection('users');
  if(usernames && usernames != undefined && usernames[0]){
    var orAgg = [];
    for(i = 0; i < usernames.length; i++){
      var username = usernames[i].replace("@","");
      orAgg.push({username:username});
    }
    console.log("orAgg",orAgg);
    Users.aggregate([{
      $match:{
        $or:orAgg
      }

    }],{}).toArray(function(err,documents){
      if(documents == null){
        return callback(false);
      } else{
        console.log("getUserDevicePushTokensByUserNames",documents);
        return callback(true,documents);
      }
    });
  }
}

Notification.getUserDevicePushToken = function(userID, callback){
  var self = this;
  var Users = AppModel.db.collection('users');
  if(userID && userID != undefined){
    Users.findOne({_id:new ObjectID(userID)}, function (err, rec) {
        if (rec == undefined) {
          return callback(false);
        } else {
          if(rec && rec.push_token && rec.push_token.token){
            return callback(true, rec.push_token.token);
          } else {
            return callback(false);
          }

        }
      });
  }
}

Notification.getCommentCreatorByCommentID = function(commentID, callback){
  var Comments = AppModel.db.collection('comments');
  console.log("Notification getCommentCreatorByCommentID",commentID);
  Comments.aggregate([{
    $match:{_id:new ObjectID(commentID)}
  },
  // {$unwind:{
  //   path:"$comments",
  //   preserveNullAndEmptyArrays:true
  // }},
  // {$group:{
  //   _id:"$comments._id",
  //   creator:{$addToSet:{$cond:[{$eq:["$comments._id",new ObjectID(commentID)]},"$comments.created_by",null]}},
  // }},
  ]).toArray(function(err, documents){
      console.log('BumsModel.getBum.err',err);
      if (documents == null) {
        return callback({
          errors:
          [
            {
              status:'s003',
              source:{pointer:"models/BumsModel.getBum"},
              title:"Commentor not found",
              detail:err.message
            }
          ]
        });
      } else {
        if(documents && documents[0] && documents[0]._id == commentID){
          return callback({
            data:documents[0].created_by
          });
        } else {
          return callback({
            errors:
            [
              {
                status:'s003',
                source:{pointer:"models/BumsModel.getBum"},
                title:"Commentor not found",
                detail:"Could not find commentor"
              }
            ]
          });
        }
      }
  });
}

Notification.totalNotificationSentToUserOnOneTopic = function(fromID, toID, typeOfNotification, onID, callback){
  var Notifications = AppModel.db.collection('notifications');
  Notifications.aggregate([{
    $match:{
      $and:[
        {"from._id":fromID},
        {"to._id":toID},
        {"onID":onID},
        {"typeOfNotification":typeOfNotification}
      ]
    }

  }],{}).toArray(function(err,documents){
    if(documents == null){
      return callback(0);
    } else{
      return callback(documents.length,documents);
    }
  });
}

Notification.add = function(fromData,toData,userAction, content, onID,callback){
  var Notifications = AppModel.db.collection('notifications');
  if(fromData && toData && userAction && onID && fromData._id && toData._id){
    var data = {
      from:fromData,
      to:toData,
      data:content,
      onID:onID,
      created_date:Date.now()
    }

    if(userAction == "upvoted"){
      data.body = data.from.username + " upvoted your comment";
      data.typeOfNotification = "voted";
    } else if(userAction == "downvoted"){
      data.body = data.from.username + " downvoted your comment";
      data.typeOfNotification = "voted";
    } else if(userAction == "replied"){
      data.typeOfNotification = "replied";
      data.body = data.from.username + " replied on your comment " + "\""+ content.description +"\"";
    }

    Notification.totalNotificationSentToUserOnOneTopic(fromData._id, toData._id, data.typeOfNotification, onID,function(total, returnDocuments){
      var flag = true;
      if(data.typeOfNotification == "voted" && total > 0 && fromData._id == toData._id){
        flag = false;
      }
      console.log("Notification.add",flag);
      if(flag){
        Notifications.insert(data,function(err,status){
          if(!err){
            return callback({
              data:status.ops[0]
            });
          } else {
            return callback({
              errors:
              [
                {
                  status:'s001',
                  source:{pointer:"lib/Notification.add"},
                  title:"Unknown collection error",
                  detail:"Error encouters while trying to save notification to notifications collection"
                }
              ]
            });
          }
        });
      } else {
        return callback({
          errors:
          [
            {
              status:'s004',
              source:{pointer:"lib/Notification.add"},
              title:"Spammer",
              detail:"Suck his own dick"
            }
          ]
        });
      }
    })

  } else {
    return callback({
      errors:
      [
        {
          status:'s002',
          source:{pointer:"lib/Notification.add"},
          title:"Same creator",
          detail:"Suck his own dick"
        }
      ]
    });
  }
}
