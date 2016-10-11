/**
 * Created by Administrator on 6/2/2015.
 * Helper for session
 */
var async = require('async');
var jwt = require('jsonwebtoken');
var shortermExpire = 60; //1 day = 1440 mins
var longtermExpire = shortermExpire  * 365;
var config = require('../config')


var S = module.exports = {};

S.encode = function (data, callback) {
    var expireTime = shortermExpire;
    if (data.remember) {
        expireTime = longtermExpire;
    }
    var token = jwt.sign(data, config.session_secret, {expiresInMinutes: expireTime});
    if (typeof callback == 'function') {
        return callback(token);
    }
    return token;
}

S.decode = function (token, callback) {
    jwt.verify(token, config.session_secret, function (err, decoded) {
        res = {
            tokenExp: false,
            msg: [],
            data: decoded
        }
        if (err) {
            res.tokenExp = true;
            res.msg.push({msg: 'Please login to access content', type: 'warning'})
        }

        if (typeof callback == "function") {
            return callback(res);
        }
        return res;
    })
};

S.refresh = function (token, callback) {
    var result = {
        refreshed: false,
        err:false,
        response:token.data
    }
    if (!token.tokenExp && !token.data.remember) {
        S.encode(token.data, function (token) {
            result.refreshed = true;
            result.token = token;

            if (typeof callback == 'function') {
                return callback(result)
            }
        })
    } else if (!token.tokenExp && token.data.remember) {
        if (typeof callback == 'function') {
            return callback(result)
        }
    } else {
        if (typeof callback == 'function') {
            result.err = true;
            return callback(result)
        }
    }
}