var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');
var UsersModel = require('../models/UsersModel');

/* GET users listing. */

router.get('/get-bums', function(req, res, next) {
  BumsModel.getAllBums(function(err, respond){
    return res.json(respond);
  })
});

router.post('/get-bum', function(req, res, next) {
  BumsModel.getBum(req.body._id,function(respond){
    return res.json(respond);
  })
});

router.post('/like-bum', function(req, res, next) {
  BumsModel.likeBum(req.body._id, req.body.userData,function(err, respond){
    //console.log(respond);
    if(err){
      return res.json({status:true,content:respond});
    } else {
      return res.json({status:false,content:respond});
    }

  })
});

router.post('/create-bum', function(req, res, next) {
  BumsModel.add(req.body, function(respond){
    return res.json(respond);
  })
});

router.post('/login', function(req, res, next) {
  UsersModel.add(req.body, function(err, respond){
    if(err){
      return res.json({status:true, content:respond});
    } else {
      return res.json({status:false, content:{msg:"something went wrong asshole"}});
    }

  })

});

module.exports = router;
