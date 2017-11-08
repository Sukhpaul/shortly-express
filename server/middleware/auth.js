const models = require('../models');
const Promise = require('bluebird');
const Session = require('../models/session.js');
const db = require('../db/index.js');
var request = require('request');

module.exports.createSession = (req, res, next) => {
  Session.create()
  .then(result => {
    return Session.get({id: result.insertId});
  })
  .then(session => {
    req.session = {};
    req.session['hash'] = session.hash;

    
    if (res.cookies) {
      res.cookies['shortlyid'] = {};
      res.cookies['shortlyid'].value = session.hash;
    } else {
      res.cookies = {};
      res.cookies['shortlyid'] = {};
      res.cookies['shortlyid'].value = session.hash;
    }
        
    res.cookie('shortlyid', session.hash);

    req.session.user = {};
    req.session.user['username'] = '';
     
    next();
  });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

