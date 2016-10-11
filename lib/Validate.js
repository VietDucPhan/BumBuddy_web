/**
 * Created by Administrator on 6/2/2015.
 * Helper for model before insert data to mongodb
 */
var Auth = require('./Auth');
var AppModel = require('./Model');
var async = require('async');
var v = module.exports = {};
/**
 * Validate all user data, return safe data to store
 * @param data
 * @callback return error in arrays or null, safeData with data ready to be stored
 * @returns {}
 */
v.sanitizeUsers = function (data, callback) {
  var safeData = {};
  var error = {};
  async.waterfall([
    function (callback) {
      v.isEmail(data.email, function (flag, email) {
        if (!flag) {
          callback(true, {msg: 'Please input a valid email', type: 'warning'});
        } else {
          //error = null;
          safeData.email = email;
          callback(null, error, safeData);
        }
      });
    },
    function (error, safeData, callback) {
      v.isEmailExisted(safeData.email, function (flag, email) {
        if (flag) {
          callback(true, {msg: 'Email already in used', type: 'warning'});
        } else {
          callback(null, error, safeData);
        }
      });
    },
    function (error, safeData, callback) {
      v.isValidPassword(data.password, function (flag, password) {
        safeData.raw_password = password;
        if (!flag) {
          callback(true, {msg: 'Password must be more than 6 characters', type: 'warning'});
        } else {
          Auth.generatePassword(data.password, function (err, hashedPassword) {
            safeData.password = hashedPassword;
            //there is a callback and no errors happen
            callback(null, error, safeData);
          })
        }
      });
    }
  ], function (err, error, safeData) {
    if(err){
      return callback(err,error,null);
    }
    return callback(err,error,safeData);
  });


  //bcrypt.genSalt(10, function(err, salt) {
  //  bcrypt.hash(data.password, salt, function(err, hash) {
  //    safeData.password = hash;
  //    //there is a callback and no errors happen
  //    if(typeof callback == 'function' && error.length == 0){
  //      return callback(error,safeData);
  //    } else {
  //      return callback(error);
  //    }
  //  });
  //});

};

/**
 *
 * @param email
 * @param callback had two parameter, first parameter true if email is valid vice versa, second parameter is the email
 * @returns {*} true or false
 */
v.isEmail = function (email, callback) {
  var EmailRegExp = /^([\w.-]+)\@([\w-]+)(\.([a-z]{2,3})){1,2}$/g;
  var flag = false;
  if (EmailRegExp.test(email)) {
    flag = true;
  }

  if (typeof callback == 'function') {
    return callback(flag, email);
  }

  return flag;
};

v.isValidUsername = function (text, callback) {
  var RegExp = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/g;
  var flag = false
  if (RegExp.test(text)) {
    flag = true;
  }

  if (typeof callback == 'function') {
    return callback(flag, text);
  }
  return flag;
};

v.isUsernameExist = function (username, callback) {
  var alias = AppModel.db.collection('alias');
  var flag = false;
  alias.findOne({username:{$regex:"^"+username+"$"}},function (err, explanation) {
    if (explanation) {
      flag = true;
    }
    if (typeof callback == 'function') {
      return callback(flag, explanation);
    }
    return flag;
  });
};

v.isVideo = function (url, callback) {
  var youtube_pattern = /^http(?:s)?:\/\/(?:www\.)?youtube.com\/watch\?(?=.*v=\w+)(?:\S+)?$/i;
  var vimeo_pattern = /^http(?:s)?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)$/i;
  var flag = false;
  var type = 'youtube'
  if(youtube_pattern.test(url)){
    flag = true;
  } else if(vimeo_pattern.test(url)){
    flag = true;
    type = 'vimeo';
  }
  if(typeof callback == "function"){
    return callback(flag, type)
  }
};

v.getVideoId = function(url,type,callback){
  //console.log(url);
  var videoId;
  var vimeoPattern = /(videos|video|channels|\.com)\/([\d]+)/;
  switch(type){
    case 'youtube':
      videoId = url.split('v=')[1];
      var ampersandPosition = videoId.indexOf('&');
      if(ampersandPosition != -1) {
        videoId = videoId.substring(0, ampersandPosition);
      }
      break;
    case 'vimeo':
      var match = url.match(vimeoPattern)
      if (match){
        videoId = match[2];
      }
      break;
  }

  if(typeof callback == 'function'){
    return callback(videoId)
  }
}

v.isEmailExisted = function (email, callback) {
  var users = AppModel.db.collection('users');
  var flag = false;
  users.find({email: email}).limit(1).toArray(function (err, explanation) {
    //console.log(explanation);
    if (explanation.length > 0) {
      flag = true;
    }

    if (typeof callback == 'function') {
      return callback(flag, email);
    }
    return flag;
  });
};

v.isValidPassword = function (password, callback) {
  var flag = true;
  if (password.length < 6 || password.length > 24) {
    flag = false;
  }

  if (typeof callback == 'function') {
    return callback(flag, password);
  }
  return flag;
};
