var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/create-bum', function(req, res, next) {
  console.log(req);
  res.json({});
});

module.exports = router;
