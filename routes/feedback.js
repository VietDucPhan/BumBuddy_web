var express = require('express');
var router = express.Router();
var Email = require('../lib/Email');
/* GET feedback. */
router.get('/', function(req, res, next) {
    return res.render('feedback', { title: 'Bum Buddy'});
});

router.post('/', function(req, res, next) {
  req.body.template = 'feedback';
  Email.sendEmailtoAdmin(req.body,function(response){
    return res.json(JSON.stringify(response));
  });
});

module.exports = router;