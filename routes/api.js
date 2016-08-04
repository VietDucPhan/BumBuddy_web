var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');

/* GET users listing. */
router.get('/get-bum', function(req, res, next) {
  BumsModel.get(function(err, respond){
    res.json(respond);
  })
});

router.post('/create-bum', function(req, res, next) {
  BumsModel.save(req.body, function(err, respond){
    res.json(respond);
  })
});

module.exports = router;
