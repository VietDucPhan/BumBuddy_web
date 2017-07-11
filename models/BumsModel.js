/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var ObjectID = require('mongodb').ObjectID;
var Session = require('../lib/Session');

var BumsModel = module.exports = {};

BumsModel.getCollection = function () {
  return AppModel.db.collection('bums');
};

BumsModel.getAllBums = function( callback){
  var Bums = BumsModel.getCollection();
  Bums.aggregate([],{},function(err,cur){
    return callback(err,cur)
  })
}

BumsModel.getComments = function(_id, callback){
  var Bums = BumsModel.getCollection();
  if(_id && _id != null && _id != undefined){
    Bums.aggregate([
      {$match:{_id:new ObjectID(_id)}},
      {$unwind:"$comments"},
      {$unwind:"$comments.replies"},
      {$group:{
        _id:"$comments._id",
        media:{$first:"$comments.media"},
        description:{$first:"$comments.description"},
        overall_rating:{$first:"$comments.overall_rating"},
        bum_rating:{$first:"$comments.bum_rating"},
        created_by:{$first:"$comments.created_by"},
        created_date:{$first:"$comments.created_date"},
        total_comments:{$sum:["$comments.replies"]}
      }},
      {$project:{
        media:1,
        description:1,
        overall_rating:1,
        bum_rating:1,
        created_by:1,
        created_date:1,
        total_comments:1
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
                detail:"This bum does not exist"
              }
            ]
          });
        } else {
          console.log('BumsModel.getBum.documents',documents);
          return callback({
            data:documents
          });
        }
    });
  } else {
    return callback({
      errors:
      [
        {
          status:'s003',
          source:{pointer:"models/BumsModel.getBum"},
          title:"Bum not found",
          detail:"This bum does not exist"
        }
      ]
    });
  }
}

BumsModel.getBum = function(_id, callback){
  var Bums = BumsModel.getCollection();
  if(_id && _id != null && _id != undefined){
    Bums.aggregate([
      {$match:{_id:new ObjectID(_id)}},
      {$unwind:"$comments"},
      {$group:{
        _id:"$_id",
        name:{$first:"$name"},
        address:{$first:"$address"},
        coordinate:{$first:"$coordinate"},
        zipcode:{$first:"$zipcode"},
        average_overall_rating:{$avg:"$comments.overall_rating"},
        "total_rates":{$sum:1},
        "level1":{$sum:{$cond:[{$eq:["$comments.bum_rating","level1"]},1,0]}},
        "level2":{$sum:{$cond:[{$eq:["$comments.bum_rating","level2"]},1,0]}},
        "level3":{$sum:{$cond:[{$eq:["$comments.bum_rating","level3"]},1,0]}},
        "level4":{$sum:{$cond:[{$eq:["$comments.bum_rating","level4"]},1,0]}},
        "level5":{$sum:{$cond:[{$eq:["$comments.bum_rating","level5"]},1,0]}},
      }},
      {$project:{
        average_overall_rating:{$floor:"$average_overall_rating"},
        "address":1,
        "total_rates":1,
        "name":1,
        coordinate:1,
        zipcode:1,
        "level1":1,
        "level2":1,
        "level3":1,
        "level4":1,
        "level5":1
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
                detail:"This bum does not exist"
              }
            ]
          });
        } else {
          console.log('BumsModel.getBum.documents',documents);
          return callback({
            data:documents
          });
        }
    });
  } else {
    return callback({
      errors:
      [
        {
          status:'s003',
          source:{pointer:"models/BumsModel.getBum"},
          title:"Bum not found",
          detail:"This bum does not exist"
        }
      ]
    });
  }
}

BumsModel.likeBum = function(bumId, userData, callback){
  var Bums = BumsModel.getCollection();
  if(bumId && bumId != null && bumId != undefined){
    BumsModel.isLikedBum(bumId, userData._id, function(status, rec){
      //console.log("BumsModel.likeBum",status);
      if(status){
        Bums.findAndModify({
          $and:[
            {_id:new ObjectID(bumId)},
            {"likes._id":userData._id}
          ]
        }, [], {$pull: {likes:{_id:userData._id}}}, {new: true}, function (err, updatedDoc) {
          return callback(false, updatedDoc.value);
        });

      } else {
        Bums.findAndModify({
          $and:[
            {_id:new ObjectID(bumId)}
          ]
        }, [], {$push: {likes:userData}}, {new: true}, function (err, updatedDoc) {
          return callback(true, updatedDoc.value);
        });
      }
    });
  }
}

BumsModel.isLikedBum = function(bumId, userId, callback){
  var Bums = BumsModel.getCollection();
  Bums.findOne({
    $and:[
      {_id:new ObjectID(bumId)},
      {"likes._id":userId}
    ]
  }, function (err, rec) {
      //console.log("BumsModel.isLikedBum", rec);
      if (rec == null) {
        return callback(false);
      } else {
        return callback(true, rec);
      }
  });
}

BumsModel.add = function(data, callback){
  var collection = BumsModel.getCollection();
  var token = data.token;
  delete data.token;
  Session.verify(token,function(err,userDataDecoded){
    delete userDataDecoded.iat;
    if(err){
      data.created_by = userDataDecoded;
      data.created_date = new Date();
      collection.insert(data,function(err,status){
        //console.log('BumsModel.add',status);
        status.ops[0].type = "bum";
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
