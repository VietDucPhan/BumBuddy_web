var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');
var UsersModel = require('../models/UsersModel');
var RepliesModel = require('../models/RepliesModel');

/* GET users listing. */

router.get('/get-bums', function(req, res, next) {
  BumsModel.getAllBums(function(err, respond){
    return res.json(respond);
  })
});

router.post('/add-comment', function(req, res, next) {
  BumsModel.addComment(req.body,function(respond){
    return res.json(respond);
  })
});

router.post('/add-reply', function(req, res, next) {
  RepliesModel.add(req.body,function(respond){
    return res.json(respond);
  })
});

router.post('/get-surround-bum', function(req, res, next) {
  BumsModel.centerSphere(req.body,function(respond){
    return res.json(respond);
  })
});

router.post('/report', function(req, res, next) {
  if(req.body && req.body.typeOfReport === "comment"){
    console.log("detect comment api",req.body);
    BumsModel.reportComment(req.body,function(respond){
      return res.json(respond);
    })
  } else if(req.body && req.body.typeOfReport === "bum"){
    BumsModel.reportBum(req.body,function(respond){
      return res.json(respond);
    })
  } else if(req.body && req.body.typeOfReport === "reply"){
    RepliesModel.report(req.body,function(respond){
      return res.json(respond);
    })
  }
});

router.post('/delete', function(req, res, next) {
  if(req.body && req.body.typeOfDelete === "comment"){
    console.log("detect comment api",req.body);
    BumsModel.deleteComment(req.body,function(respond){
      return res.json(respond);
    })
  }else if(req.body && req.body.typeOfDelete === "reply"){
    RepliesModel.delete(req.body,function(respond){
      return res.json(respond);
    })
  }
});

router.post('/get-replies', function(req, res, next) {
  RepliesModel.getReplies(req.body._id,function(respond){
    return res.json(respond);
  })
});

router.post('/vote-comment', function(req, res, next) {
  BumsModel.voteComment(req.body,function(respond){
    return res.json(respond);
  })
});

router.post('/get-rating', function(req, res, next) {
  BumsModel.getRating(req.body._id,function(respond){
    return res.json(respond);
  })
});

router.post('/get-bum-comments', function(req, res, next) {
  BumsModel.getBumComments(req.body._id,function(respond){
    return res.json(respond);
  })
});

router.post('/get-bums-comments', function(req, res, next) {
  BumsModel.getBumsComments(function(respond){
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
