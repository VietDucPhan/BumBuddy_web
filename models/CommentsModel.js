/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var Notification = require('./../lib/Notification');
var ObjectID = require('mongodb').ObjectID;
var Session = require('../lib/Session');

var CommentsModel = module.exports = {};

CommentsModel.getCollection = function () {
  return AppModel.db.collection('comments');
};


CommentsModel.getRating = function(_id, callback){
  var Comments = CommentsModel.getCollection();
  var Bums = AppModel.db.collection('bums');
  if(_id && _id != null && _id != undefined){
    Comments.aggregate([
      {$match:{"bum._id":_id}},
      {$group:{
        _id:"$bum._id",
        name:{$first:"$bum.name"},
        address:{$first:"$bum.address"},
        overall_rating:{$sum:{$ifNull:["$overall_rating",0]}},
        "total_rates":{$sum:{$cond:[{$ifNull:["$overall_rating",false]},1,0]}},
        "level1":{$sum:{$cond:[{$eq:["$bum_rating","level1"]},1,0]}},
        "level2":{$sum:{$cond:[{$eq:["$bum_rating","level2"]},1,0]}},
        "level3":{$sum:{$cond:[{$eq:["$bum_rating","level3"]},1,0]}},
        "level4":{$sum:{$cond:[{$eq:["$bum_rating","level4"]},1,0]}},
        "level5":{$sum:{$cond:[{$eq:["$bum_rating","level5"]},1,0]}},
      }},
      {$project:{
        average_overall_rating:{$floor:{$cond:[{$eq:["$total_rates",0]},0,{$divide:["$overall_rating","$total_rates"]}]}},
        "address":1,
        "total_rates":1,
        "name":1,
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
                detail:err.message
              }
            ]
          });
        } else {
          console.log('BumsModel.getBum.documents',documents);
          if(documents && documents[0]){
            return callback({
              data:documents
            });
          } else {
            Bums.aggregate([
              {$match:{_id:new ObjectID(_id)}},
              {$project:{
                name:1,
                address:1,
              }}
            ]).toArray(function(err,documents){
              return callback({
                data:[{
                  _id:documents[0]._id,
                  name:documents[0].name,
                  address:documents[0].address,
                  total_rates:0,
                  average_overall_rating:0,
                  level1:0,
                  level2:0,
                  level3:0,
                  level4:0,
                  level5:0
                }]
              });
            });
          }

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

CommentsModel.reportComment = function(data, callback){
  var collection = CommentsModel.getCollection();
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
        {_id:new ObjectID(_id)},
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


CommentsModel.deleteComment = function(data, callback){
  var collection = CommentsModel.getCollection();
  var token = data.token;
  var _id = data._id;
  delete data.token;
  Session.verify(token,function(err,userDataDecoded){
    delete userDataDecoded.iat;
    if(err){
      data.created_by = userDataDecoded;
      //data.comments = [];
      collection.remove(
        {_id:new ObjectID(_id)},
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

CommentsModel.voteComment = function(data, callback){
  var collection = CommentsModel.getCollection();
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
        {$pull:{"votes":{"created_by.email":data.created_by.email}}},
        function(err,status){
          collection.findOneAndUpdate(
            {"_id":new ObjectID(_id)},
            {$push: { "votes": data }},{returnOriginal:false},function(err,documents){
            console.log('BumsModel.voteComment.err',err);
            console.log('BumsModel.voteComment.documents',documents);

            if(!err){
                Notification.sendPushNotificationVote(userDataDecoded, data.vote, _id, function(response){
                  if(response){

                    return callback({
                      data:[data]
                    });
                  } else {
                    console.log("could not create notification");
                    return callback({
                      data:[data]
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
                    title:"Unknown collection error",
                    detail:"Error encouters while trying to vote a comment"
                  }
                ]
              });
            }
          });
        }
      );

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

CommentsModel.getComment = function(_id, callback){
  var Comments = CommentsModel.getCollection();
  if(_id && _id != null && _id != undefined){
    Comments.aggregate([
      {$match:{_id:new ObjectID(_id)}},
    ]).toArray(function(err,documents){
        console.log('CommentsModel.getComment',documents);
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
          var returnDocument = {
            _id:documents[0]._id,
            media:documents[0].media,
            bum_id:documents[0].bum._id,
            name:documents[0].bum.name,
            address:documents[0].bum.address,
            description:documents[0].description,
            overall_rating:documents[0].overall_rating,
            created_by:documents[0].created_by,
            created_date:documents[0].created_date,
            points:0,
            upVote:[],
            downVote:[]
          };
          if(documents[0] && documents[0].votes){
            for(i=0;i < documents[0].votes.length; i++){
              if(documents[0].votes[i].vote === 1){
                returnDocument.upVote.push(documents[0].votes[i].created_by.email);
              }
              if(documents[0].votes[i].vote === -1){
                returnDocument.downVote.push(documents[0].votes[i].created_by.email);
              }
              if(documents[0].votes[i].vote){
                returnDocument.points += documents[0].votes[i].vote;
              }
            }
          }
          return callback({
            data:[returnDocument]
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

CommentsModel.getComments = function(data, callback){
  var Comments = CommentsModel.getCollection();
  console.log("getBumsComments.data",data);
  var aggregateObject = [
    {$unwind:{
      path:"$votes",
      preserveNullAndEmptyArrays:true
    }},
    {$group:{
      _id:"$_id",
      bum_id:{$first:"$bum._id"},
      name:{$first:"$bum.name"},
      address:{$first:"$bum.address"},
      media:{$first:"$media"},
      description:{$first:"$description"},
      overall_rating:{$first:"$overall_rating"},
      bum_rating:{$first:"$bum_rating"},
      created_by:{$first:"$created_by"},
      created_date:{$first:"$created_date"},
      points:{$sum:{ $ifNull: [ "$votes.vote", 0 ] }},
      upVote:{$addToSet:{$cond:[{$eq:["$votes.vote",1]},"$votes.created_by.email",null]}},
      downVote:{$addToSet:{$cond:[{$eq:["$votes.vote",-1]},"$votes.created_by.email",null]}}
    }},
    {$project:{
      name:1,
      media:1,
      address:1,
      bum_id:1,
      description:1,
      overall_rating:1,
      bum_rating:1,
      created_by:1,
      created_date:1,
      points:1,
      upVote:1,
      downVote:1
    }},
    {$sort: {_id: -1} },
    {$skip:data.skip},
    {$limit: data.limit}
  ];

  if(data.bum_id){
    aggregateObject.unshift({$match:{"bum._id":data.bum_id}});
  } else if(data.user_id){
    aggregateObject.unshift({$match:{"created_by._id":data.user_id}});
  }
  Comments.aggregate(aggregateObject).toArray(function(err,documents){
      //console.log('BumsModel.getBum.err',err);
      //console.log('BumsModel.getBum.err',documents);
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
        if(data.skip != 0 && documents.length != 0){
          //this is for displaying advertisement
          //documents.unshift({admob:true, size:"MEDIUM_RECTANGLE"});
        }
        return callback({
          data:documents
        });
      }
  });
}


CommentsModel.add = function(data, callback){
  var collection = CommentsModel.getCollection();
  var bums = AppModel.db.collection('bums');
  var token = data.token;
  delete data.token;
  Session.verify(token,function(err,userDataDecoded){
    delete userDataDecoded.iat;
    console.log("CommentsModel",userDataDecoded);
    if(err){
      data.created_by = userDataDecoded;
      data.created_date = new Date();
      data.published = true;
      data._id = new ObjectID();
      if(data && data.bum && data.bum._id){
          bums.aggregate([{$match:{_id:new ObjectID(data.bum._id)}}]).toArray(function(err,documents){
            console.log("CommentsModel",documents);
            if (documents == null || !documents[0]) {
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
              data.bum.name = documents[0].name;
              data.bum.address = documents[0].address;
              collection.insert(data,function(err,status){
                console.log('CommentsModel.addComment.err',err);
                console.log('CommentsModel.addComment.status',status);
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
            }
          });
      }

      //data.comments = [];

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
