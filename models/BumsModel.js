/**
 * Created by Administrator on 5/29/2015.
 */
var AppModel = require('./../lib/Model');
var ObjectID = require('mongodb').ObjectID;


var BumsModel = module.exports = {};

BumsModel.getCollection = function () {
  return AppModel.db.collection('bums');
};

BumsModel.get = function( callback){
  var Bums = BumsModel.getCollection();
  Bums.find(function(err,doc){
    return callback(err,doc);
  });
}

BumsModel.save = function(data, callback){
  var collection = BumsModel.getCollection();
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
