var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');

/* GET home page. */
router.get('/', function(req, res, next) {
  BumsModel.getAllBums(function(err, respond){
    return res.render('index', { title: 'Express',jsonOutPut:JSON.stringify(respond) });
  })

});

module.exports = router;
