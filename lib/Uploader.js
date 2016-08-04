/**
 * Created by Administrator on 6/2/2015.
 * Helper for image uploader
 */
var config = require('../config');
var Model = require('../lib/Model');
var multiparty = require('multiparty');
var async = require('async');
var imageUploader;
var limitSize = 1000000;
var fs = require('fs');

var I = module.exports = {};

module.exports = function (init) {

  var Uploader = {
    fieldName: 'file',
    read: read,
    fileData: null,
    limitSize : 1000000,
    rules:["image/jpeg","image/gif","image/png"]
  }

  if (typeof init == 'object' && init.fieldName) {
    Uploader.fieldName = init.fieldName
  }

  if (typeof init == 'object' && init.rules) {
    Uploader.rules = init.rules
  }

  function read(req, callback) {
    var form = new multiparty.Form();
    var data = {};
    var fileObj;
    form.parse(req, function (err, fields, files) {
      for (var i = 0, total = files.file.length; i < total; i++) {
        if (files && files.file && files.file[i] && files.file[i].fieldName == Uploader.fieldName) {
          fileObj = files.file[i];
        }

        if (i === (total - 1)) {
          if (fileObj) {
            data.originalname = fileObj.originalFilename;
            data.mimetype = fileObj.headers['content-type'];
            data.size = fileObj.size;
            data.path = fileObj.path;
          }

          if(fileObj && Uploader.rules.indexOf(data.mimetype) == -1){
            data = {error:{message:[{msg:'File type is not supported',type:'warning'}]}};
          } else if(fileObj && Uploader.limitSize < data.size){
            data = {error:{message:[{msg:'File is too big',type:'warning'}]}};
          }

          if(typeof callback == 'function'){
            return callback(data);
          }
        }
      }


    });

  }

  return Uploader;
}