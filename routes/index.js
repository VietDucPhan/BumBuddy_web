var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');
var Config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
  BumsModel.getAllBums(function(err, respond){
    return res.render('index', { title: Config.sitename});
  });
});

router.get('/privacy', function(req, res, next) {
    return res.render('privacy', { title: Config.sitename});
});

router.get('/terms', function(req, res, next) {
    return res.render('terms', { title: Config.sitename});
});

router.get('/open-source-libraries', function(req, res, next) {
    return res.render('openSourceLibraries', { title: Config.sitename});
});

module.exports = router;
