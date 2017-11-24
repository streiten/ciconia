var fs = require('fs');
var APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var moment = require('moment');
var winston = require('winston');

const User = require('../models/User.js');
const animal = require('../models/Animal.js');
const mail = require('./mail.js');

var shortid = require('shortid');

/**
 * GET /
 * Home page.
 */
 
exports.index = (req, res) => {

  var data = {
    "animal" : { "name" : "AnimalName" },
    "hash" : 'lkajsdlkj'
  }
  
  res.render('mailpreview', {
         body: mail.generateOptInMailMarkup(data)
  });

};

exports.create = (email) => {

    User.findOne({ 'email' : email }).then( user => {
      // user exists
      if(user){
        // return exists
        winston.log('info', user.email + ' exists! Bye.');
      // add user

      } else {
        var newUser = new User();
        newUser.email = email; 
        newUser.save();
        mail.sendOptIn(newUser);
      }

    });
}

exports.confirm = (req,res) => {
  
  // add acticated 
  User.findOne({ "hash" : req.params.hash }).then( user => {
    
    if(user) {
    console.log(user.email,' found and activated.');
      user.active = true;
      user.save();
    } else {
      console.log('nofind user no more');
    }
  
  });

  // if no activated give page  already active see later

};