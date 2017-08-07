/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var ObjectID = require('mongodb').ObjectID;
var Session = require('../lib/Session');

var RepliesModel = module.exports = {};

RepliesModel.getCollection = function () {
  return AppModel.db.collection('replies');
};

RepliesModel.getReplies = function(_id, callback){
  var Replies = RepliesModel.getCollection();
  if(_id && _id != null && _id != undefined){
    Replies.find(
      {"comment_id":_id}
    ).toArray(function(err,documents){
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
          console.log('BumsModel.getReplies.documents',documents);
          if(documents[0] && documents[0]._id && documents[0].created_by){
            return callback({
              data:documents
            });
          } else {
            return callback({
              data:[]
            });
          }

        }
    });
  } else {
    return callback({
      errors:
      [
        {
          status:'s010',
          source:{pointer:"models/BumsModel.getReplies"},
          title:"id not found",
          detail:"id not found"
        }
      ]
    });
  }
}

RepliesModel.add = function(data, callback){
  var collection = RepliesModel.getCollection();
  var token = data.token;
  delete data.token;
  Session.verify(token,function(err,userDataDecoded){
    delete userDataDecoded.iat;
    if(err){
      data.created_by = userDataDecoded;
      data.created_date = new Date();
      //data.comments = [];
      collection.insert(data,function(err,status){
        if(!err){
          return callback({
            data:status.ops[0]
          });
        } else {
          return callback({
            errors:
            [
              {
                status:'s002',
                source:{pointer:"models/BumsModel.add"},
                title:"Unknown collection error",
                detail:"Error encouters while trying to save data to bums collection"
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
            status:'s001',
            source:{pointer:"models/BumsModel.add"},
            title:"User login required",
            detail:"User need to login in order to create bum"
          }
        ]
      });
    }
  });

}
