var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/create-bum', function(req, res, next) {
  BumsModel.save(req.body, function(err, respond){
    res.json(respond);
  })
});

module.exports = router;
