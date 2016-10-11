/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var ObjectID = require('mongodb').ObjectID;


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
        if (rec == undefined) {
          return callback(false);
        } else {
          return callback(true, rec);
        }
      });
  }

}

BumsModel.add = function(data, callback){
  var collection = BumsModel.getCollection();
  data.comments[0]._id = new ObjectID();
  collection.save(data,function(err,status){
    if(!err){
      if(status.result.nModified == 1){
        callback(null,{msg:"Bum was created",type:'success'})
      } else {
        callback(null,{msg:"Congratulation, you have successfully created a bum",type:'success'})
      }
    } else {
      callback(true,{msg:"There is an error occured, Please try again latter",type:'warning'})
    }
  });
}
