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

router.get('/get-bum', function(req, res, next) {
  console.log(req);
  BumsModel.getBum(req.id,function(err, respond){
    return res.json(respond);
  })
});

router.post('/create-bum', function(req, res, next) {
  BumsModel.add(req.body, function(err, respond){
    return res.json(respond);
  })

});

router.post('/login', function(req, res, next) {
  UsersModel.add(req.body, function(err, respond){
    if(err){
      return res.json({status:true, content:respond});
    } else {
      return res.json({status:false, msg:{content:"There is a bum in your ass"}});
    }

  })

});

module.exports = router;
