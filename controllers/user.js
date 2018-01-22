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

exports.create = (email,socket) => {

  User.findOne({ 'email' : email }).then( user => {
    if(user){

      winston.log('info', user.email + ' exists! Bye.');
      socket.emit('createUserResult',{ "status" : -1 , "msg" : 'Nice try. But you are signed up already' });
    
    } else {

      var newUser = new User();
      newUser.email = email;
      newUser.save();
      
      mail.sendOptIn(newUser);

      winston.log('info', newUser.email + ' signed up. waiting for cofirmation.');
      socket.emit('createUserResult',{ "status" : 1 , "msg" : "Awe. Please check your email for confirmation it's really you now."});

    }
  });
};

exports.confirm = (req,res) => {
  
  User.findOne({ "hash" : req.params.hash }).then( user => {
    
    var msg = '';
    if(user) {

      if(!user.active) {
        user.active = true;
        user.save();
        msg = 'Talk to you in a bit!';
      } else {
        msg = "Looks like you've been here before. No worries, talk to you in a bit anyways of course."; 
      }

    } else {
      msg = 'Bye bye.';    
    }

    res.render('optIn', {
         "msg" : msg
    });

  
  });
};

exports.unsubscribe = (req,res) => {
  
  User.findOne({ "hash" : req.params.hash }).then( user => {
    
    var msg = '';
    if(user) {

      if(user.active) {
        user.active = false;
        user.save();
        msg = 'You are unsubscribed now. Come back any time you like of course!';
      } else {
        msg = "You are unsubscribed already. No worries no more mail from us. Promise!"; 
      }

    } else {
      msg = 'Bye bye.';    
    }

    res.render('unsub', {
         "msg" : msg
    });

  
  });
};

