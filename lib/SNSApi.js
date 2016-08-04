/**
 * Created by Administrator on 7/29/2015.
 */
var fs = require('fs'),
  path = require('path'),
  request = require('request'),
  config = require('../config'),
  SNSApi = module.exports = {},
  uploader = require('./Uploader');
  FBgraph = 'https://graph.facebook.com/v2.2/',
  FBRequestPostDetail = '?fields=source,link,created_time,height,width,from,name,picture&access_token=' + config.fb_access_token,
  fbResponse = null,
  errorResponse = {error:{message:[]}},
  reqModule = null,
  form = null;

SNSApi.getFBPostDetailByID = function (id, callback) {
  request.get(FBgraph + id + FBRequestPostDetail, function (err, response, body) {
    fbResponse = JSON.parse(body);
    if(fbResponse && fbResponse.error){
      if(typeof callback == "function"){
        return callback(errorResponse.error.message.push({msg:fbResponse.error.message,type:'danger'}))
      }
    }

    if(typeof callback == 'function'){
      fbResponse.type = "facebook";
      return callback(fbResponse)
    }
  })
}

SNSApi.postAnImageToFB = function(fieldName,msg,req,callback){
  var Uploader = new uploader({fieldName:fieldName});
  Uploader.read(req,function(fileData){
    if(fileData && fileData.error){
      return callback(fileData);
    }

    reqModule = request.post('https://graph.facebook.com/493609344136222/photos?access_token='+config.fb_access_token, function (err, response, body) {
      if(body == undefined){
        return callback({
          error: {message: [{msg: 'An unexpected error happened, please try again latter', type: 'danger'}]},
          status: 'facebook_error'
        });
      }
      fbResponse = JSON.parse(body);
      if(fbResponse && fbResponse.error){
        return callback({
          error: {message: [{msg: fbResponse.error.message, type: 'danger'}]},
          status: 'facebook_error'
        });
      }

      return callback(fbResponse);
    })
    form = reqModule.form()
    form.append('message', msg);
    form.append('source', fs.createReadStream(fileData.path));
  })
}

SNSApi.deleteAPostOnFB = function(id,callback){
  request.del(FBgraph+id+"?access_token="+config.fb_access_token,function(err, response, body){
    if(body && body.error){
      return callback({
        error: {message: [{msg: body.error.message, type: 'danger'}]},
        status: 'facebook_error'
      })
    }
    return callback(true)
  });
}