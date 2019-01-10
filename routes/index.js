var express = require('express');
var router = express.Router();
var BumsModel = require('../models/BumsModel');

/* GET home page. */
router.get('/', function(req, res, next) {
  BumsModel.getAllBums(function(err, respond){
    return res.render('index', { title: 'Bum Buddy'});
  })

});

router.get('/privacy', function(req, res, next) {
    return res.render('privacy', { title: 'Bum Buddy'});
});

router.get('/terms', function(req, res, next) {
    return res.render('terms', { title: 'Bum Buddy'});
});

router.get('/open-source-libraries', function(req, res, next) {
    return res.render('openSourceLibraries', { title: 'Bum Buddy'});
});

router.get('/feedback', function(req, res, next) {
    return res.render('feedback', { title: 'Bum Buddy'});
});

module.exports = router;
