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

BumsModel.getBum = function(bumId, callback){
  var Bums = BumsModel.getCollection();
  if(bumId && bumId != null && bumId != undefined){
    Bums.findOne({_id:new ObjectID(bumId)}, function (err, rec) {
        if (rec == null) {
          return callback(false);
        } else {
          return callback(true, rec);
        }
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
  data.comments[0]._id = new ObjectID();
  var token = data.token;
  console.log("BumsModel.add data", data);
  delete data.token;
  Session.verify(token,function(err,userDataDecoded){
    console.log("BumsModel.add", userDataDecoded);
    delete userDataDecoded.iat;
    if(err){
      data.links[0].uploaded_by = userDataDecoded;
      data.comments[0].commentor = userDataDecoded;
      data.comments[0].created_by = userDataDecoded;
      collection.save(data,function(err,status){
        if(!err){
          if(status.result.nModified == 1){
            return callback(true,{msg:"Bum was created",type:'success'})
          } else {
            return callback(true,{msg:"Congratulation, you have successfully created a bum",type:'success'})
          }
        } else {
          return callback(false,{msg:"There is an error occured, Please try again latter",type:'warning'})
        }
      });
    } else {
      return callback(false,{msg:"Please login again",type:'warning'});
    }
  });

}
