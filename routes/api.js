var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');

/* GET users listing. */

router.post('/get-bum', function(req, res, next) {
  BumsModel.get(function(err, respond){
    return res.json(respond);
  })
});

router.post('/create-bum', function(req, res, next) {
  BumsModel.save(req.body, function(err, respond){
    return res.json(respond);
  })

});

module.exports = router;
