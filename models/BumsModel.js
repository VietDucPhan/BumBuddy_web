/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var Notification = require('./../lib/Notification');
var ObjectID = require('mongodb').ObjectID;
var Session = require('../lib/Session');

var BumsModel = module.exports = {};

BumsModel.getCollection = function () {
  return AppModel.db.collection('bums');
};

BumsModel.getAllBums = function( callback){
  var Bums = BumsModel.getCollection();
  Bums.aggregate([
    {$sort: {_id: 1} }
  ],{},function(err,cur){
    return callback(err,cur);
  })
}

BumsModel.findBumByText = function(data, callback){
  var Bums = BumsModel.getCollection();
  if(data && data != null && data != undefined){
    console.log("findBumByText",data);
    Bums.find({$text:{$search:data}}).project({name: 1, _id: 1 }).toArray(function(err,documents){

        if (documents == null) {
          console.log('BumsModel.getBum.err',err);
          return callback({
            errors:
            [
              {
                status:'s003',
                source:{pointer:"models/BumsModel.findBumByText"},
                title:"Bum not found",
                detail:err.message
              }
            ]
          });
        } else {
          //
          if(documents[0] && documents[0]._id){
            console.log('BumsModel.getBum.findBumByText',documents);
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
          status:'s004',
          source:{pointer:"models/BumsModel.getBum"},
          title:"id not found",
          detail:"id not found"
        }
      ]
    });
  }
}

BumsModel.centerSphere = function(data, callback){
  var Bums = BumsModel.getCollection();
  if(data && data != null && data != undefined){
    console.log("centerSphere",data);
    Bums.find({coordinate: {
      $geoWithin: {
        $centerSphere: [ data.coordinate, data.radius*0.621371192/3963.2 ]
      } }}).project({name: 1, _id: 1, coordinate:1 }).toArray(function(err,documents){

        if (documents == null) {
          console.log('BumsModel.getBum.err',err);
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
          //
          if(documents[0] && documents[0]._id){
            //console.log('BumsModel.getBum.centerSphere',documents);
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
          status:'s004',
          source:{pointer:"models/BumsModel.getBum"},
          title:"id not found",
          detail:"id not found"
        }
      ]
    });
  }
}

BumsModel.getBumComments = function(data, callback){
  var Bums = BumsModel.getCollection();
  console.log("getBumComments",data);
  if(data && data._id != null && data._id != undefined){
    Bums.aggregate([

      {$match:{_id:new ObjectID(data._id)}},
      {$unwind:{
        path:"$comments",
        preserveNullAndEmptyArrays:true
      }},
      {$unwind:{
        path:"$comments.votes",
        preserveNullAndEmptyArrays:true
      }},

      {$group:{
        _id:"$comments._id",
        name:{$first:"$name"},
        bum_id:{$first:"$_id"},
        media:{$first:"$comments.media"},
        description:{$first:"$comments.description"},
        overall_rating:{$first:"$comments.overall_rating"},
        bum_rating:{$first:"$comments.bum_rating"},
        created_by:{$first:"$comments.created_by"},
        created_date:{$first:"$comments.created_date"},
        points:{$sum:{ $ifNull: [ "$comments.votes.vote", 0 ] }},
        upVote:{$addToSet:{$cond:[{$eq:["$comments.votes.vote",1]},"$comments.votes.created_by.email",null]}},
        downVote:{$addToSet:{$cond:[{$eq:["$comments.votes.vote",-1]},"$comments.votes.created_by.email",null]}}
      }},
      {$project:{
        media:1,
        bum_id:1,
        description:1,
        overall_rating:1,
        bum_rating:1,
        created_by:1,
        created_date:1,
        points:1,
        downVote:1,
        upVote:1
      }},
      {$sort: {_id: -1} },
      {$skip:data.skip},
      {$limit: data.limit},

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
  } else {
    return callback({
      errors:
      [
        {
          status:'s004',
          source:{pointer:"models/BumsModel.getBum"},
          title:"id not found",
          detail:"id not found"
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


BumsModel.reportBum = function(data, callback){
  var collection = BumsModel.getCollection();
  var token = data.token;
  var _id = data._id;
  delete data.token;
  delete data._id;
  Session.verify(token,function(err,userDataDecoded){
    delete userDataDecoded.iat;
    if(err){
      data.created_by = userDataDecoded;
      data.created_date = new Date();
      data._id = new ObjectID();
      //data.comments = [];
      collection.update(
        {"_id":new ObjectID(_id)},
        {$push: { "reports": data }},function(err,status){
        if(!err){
          return callback({
            data:[data]
          });
        } else {

          return callback({
            errors:
            [
              {
                status:'s008',
                source:{pointer:"models/BumsModel.vote"},
                title:"Unknown collection error",
                detail:"Error encouters while trying to vote a comment"
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
            status:'s008',
            source:{pointer:"models/BumsModel.vote"},
            title:"User login required",
            detail:"User need to login in order to vote comment"
          }
        ]
      });
    }
  });

}

BumsModel.deleteComment = function(data, callback){
  var collection = BumsModel.getCollection();
  var token = data.token;
  var _id = data._id;
  delete data.token;
  Session.verify(token,function(err,userDataDecoded){
    delete userDataDecoded.iat;
    if(err){
      data.created_by = userDataDecoded;
      //data.comments = [];
      collection.update(
        {"comments._id":new ObjectID(_id)},
        {$pull:{"comments":{
          "_id":new ObjectID(_id),
          "created_by.email":userDataDecoded.email
        }}},
        function(err,status){
        if(!err){
          console.log("deletecomment",status);
          return callback({
            data:[data]
          });
        } else {

          return callback({
            errors:
            [
              {
                status:'s008',
                source:{pointer:"models/BumsModel.vote"},
                title:"Unknown collection error",
                detail:"Error encouters while trying to vote a comment"
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
            status:'s008',
            source:{pointer:"models/BumsModel.vote"},
            title:"User login required",
            detail:"User need to login in order to vote comment"
          }
        ]
      });
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
      data.published = true;
      //data.comments = [];
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
