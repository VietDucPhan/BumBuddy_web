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
  self.getUserDevicePushToken(data.to[0]._id,function(flag, push_token){
    if(flag){
      var push_data = {
        data:{
          content:JSON.stringify(data)
        },
        notification:{
          body:data.body,
          sound: 'default'
        }
      }
      var options = {
        priority: 'high'
      }
      firebase.messaging().sendToDevice(push_token, push_data, options)
      .then(function(response) {
        return callback(true);
      })
      .catch(function(error) {
        return callback(false);
      });
    } else {
      return callback(false);
    }
  });
}

Notification.getNotificationsFromTOByID = function(_id, callback){
  var self = this;
  var Notifications = AppModel.db.collection('notifications');
  if(_id){
    Notifications.aggregate([{
      $match:{
        "to._id":_id
      }
    }
  ],{}).toArray(function(err,documents){
      if(documents == null){
        return callback([]);
      } else{
        return callback(documents);
      }
    });
  } else {
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
  }
}

Notification.sendMentionedNotices = function(data, callback){
  var self = this;
  self.getUserDevicePushTokensByUserNames(data.data.mentioned,function(flag, pushTokenDatas){
    if(flag && pushTokenDatas){
      var push_data = {
        data:{
          content:JSON.stringify(data)
        },
        notification:{
          body:data.body
        }
      }
      var push_tokens = [];
      for(i = 0; i < pushTokenDatas.length; i++){
        push_tokens.push(pushTokenDatas[i].push_token);
      }

      firebase.messaging().sendToDevice(push_tokens, push_data)
      .then(function(response) {
        return callback(true);
      })
      .catch(function(error) {
        return callback(false);
      });
    } else {
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
    Users.aggregate([{
      $match:{
        $or:orAgg
      }
    }
  ],{}).toArray(function(err,documents){
      if(documents == null){
        return callback(false);
      } else{
        return callback(true,documents);
      }
    });
  }
}

Notification.getUserDataByUserNames = function(usernames, callback){
  var self = this;
  var Users = AppModel.db.collection('users');
  if(usernames && usernames != undefined && usernames[0]){
    var orAgg = [];
    for(i = 0; i < usernames.length; i++){
      var username = usernames[i].replace("@","");
      orAgg.push({username:username});
    }
    Users.aggregate([{
      $match:{
        $or:orAgg
      }
    },
    {
      $project:{
        name:1,
        username:1,
        email:1,
        profile_picture:1
      }
    }
  ],{}).toArray(function(err,documents){
      if(documents == null){
        return callback(false);
      } else{
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
        if(rec && rec.push_token){
          return callback(true, rec.push_token);
        } else {
          return callback(false);
        }

      }
    });
  }
}

Notification.getCommentCreatorByCommentID = function(commentID, callback){
  var Comments = AppModel.db.collection('comments');
  Comments.aggregate([{
    $match:{_id:new ObjectID(commentID)}
  },
  {
    $project:{
      created_by:1
    }
  }
  ]).toArray(function(err, documents){
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
        if(documents && documents[0]){
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

Notification.sendPushNotificationVote = function(fromData, vote,onID,callback){
  var Notifications = AppModel.db.collection('notifications');
  var data = {
    from:fromData,
    to:[],
    data:null,
    onID:onID,
    body:fromData.username + " downvoted your comment",
    typeOfNotification:"voted",
    created_date:Date.now()
  }
  if(vote > 0){
    data.body = fromData.username + " upvoted your comment";
  }
  Notification.getCommentCreatorByCommentID(onID,function(result){
    if(result.errors){
      return callback(false)
    } else {
      data.to.push(result.data);
      Notification.totalNotificationSentToUserOnOneTopic(data.from._id, data.to[0]._id, data.typeOfNotification, onID,function(total, returnDocuments){
        var flag = true;
        if(total > 0 || data.from._id == data.to[0]._id){
          flag = false;
        }

        if(flag){
          Notifications.insert(data,function(err,status){
            if(!err){
              Notification.sendNotice(data,function(flag){
                if(flag){
                  return callback(true);
                } else {
                  return callback(false);
                }
              });
            } else {
              return callback(false);
            }
          });
        } else {
          return callback(false);
        }
      });
    }
  });
}

Notification.sendPushNotificationReply = function(fromData, content,onID,callback){
  var Notifications = AppModel.db.collection('notifications');
  var data = {
    from:fromData,
    to:[],
    data:content,
    onID:onID,
    body:fromData.username + " replied on your comment",
    typeOfNotification:"replied",
    created_date:Date.now()
  }
  if(content.mentioned.indexOf("@"+fromData.username) > -1){
    delete content.mentioned[content.mentioned.indexOf("@"+fromData.username)];
  }
  Notification.getCommentCreatorByCommentID(onID,function(result){
    if(result.errors){
      return callback(false)
    } else {
      if(result.data._id != fromData._id){
        data.to.push(result.data);
        Notifications.insert(data,function(err,status){
          if(!err){
            Notification.sendNotice(data,function(flag){
              if(content && content.mentioned.length > 0){
                data.body = fromData.username + " mentioned you on a comment";
                Notification.getUserDataByUserNames(content.mentioned, function(flag, userData){
                  if(flag){
                    data.to = userData;
                    data._id = new ObjectID();
                    Notifications.insert(data,function(err,status){
                      if(!err){
                        Notification.sendMentionedNotices(data,function(flag){
                          if(flag){
                            return callback(true);
                          } else {
                            return callback(false);
                          }
                        })
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
                    return callback(false);
                  }
                });
              } else {
                return callback(false);
              }
            })
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
          if(content && content.mentioned.length > 0){
            data.body = fromData.username + " mentioned you on a comment";
            Notification.getUserDataByUserNames(content.mentioned, function(flag,userData) {
              if(flag){
                data.to = userData;
                Notifications.insert(data,function(err,status){
                  if(!err){
                    Notification.sendMentionedNotices(data,function(flag){
                      if(flag){
                        return callback(true);
                      } else {
                        return callback(false);
                      }
                    })
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
                return callback(false);
              }
            });
          } else {
            return callback(false);
          }
      }

    }
  })
}

Notification.add = function(fromData,toData,userAction, content, onID,callback){
  var Notifications = AppModel.db.collection('notifications');
  if(fromData && toData && userAction && onID && fromData._id && toData._id){
    var data = {
      from:fromData._id,
      to:[],
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

    if(data.typeOfNotification == "replied"){

    } else {
      data.to.push({_id:toData._id});
      Notification.totalNotificationSentToUserOnOneTopic(fromData._id, toData._id, data.typeOfNotification, onID,function(total, returnDocuments){
        var flag = true;
        if((data.typeOfNotification == "voted" && total > 0) || (data.typeOfNotification == "voted" && fromData._id == toData._id)){
          flag = false;
        }
        if(flag){
          Notifications.insert(data,function(err,status){
            if(!err){
              return callback({
                data:status.ops[0]
              });
              Notifications.sendNotice();
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
      });
    }





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
