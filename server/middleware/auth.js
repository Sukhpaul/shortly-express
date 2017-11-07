const models = require('../models');
const Promise = require('bluebird');
const Session = require('../models/session.js');

module.exports.createSession = (req, res, next) => {
  console.log(req);
  
  req.session = {};
  req.session.body = req.body;
  next();
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

