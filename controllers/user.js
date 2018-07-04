var fs = require('fs');
var APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var moment = require('moment');
var winston = require('winston');

const User = require('../models/User.js');
const animal = require('../models/Animal.js');
const mail = require('./mail.js');

var shortid = require('shortid');

exports.create = (email,socket) => {

  User.findOne({ 'email' : email }).then( user => {
    if(user){

      winston.log('info', user.email + ' exists! Bye.');
      socket.emit('createUserResult',{ "success" : false , "msg" : 'Nice try. But you are signed up already.' });
    
    } else {

      var newUser = new User();
      newUser.email = email;
      newUser.save()
      .then(()=>{
        mail.sendOptIn(newUser);

        winston.log('info', newUser.email + ' signed up. waiting for cofirmation.');
        socket.emit('createUserResult', { 
          "success" : true , 
          "msg" : "Awe! Please check your email for confirmation now."
        });
      })
      .catch(err => {
        // console.log(err);
        socket.emit('createUserResult', { 
          "success" : false , 
          "msg" : "Please enter a valid email address."
        });
      });
      
    }
  })
};

exports.confirm = (req,res) => {
  
  User.findOne({ "hash" : req.params.hash }).then( user => {
    
    var msg = '';
    if(user) {

      if(!user.subscribed) {
        
        user.subscribed = true;
        user.confirmed_at = new Date();

        user.save();

        msg = 'Talk to you in a bit!';
      } else {
        msg = "Looks like you've been here before. All good."; 
      }

    } else {
      msg = 'Bye bye. You should not see this.';    
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

      if(user.subscribed) {
        user.subscribed = false;
        
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

exports.setUserStatus = (email,status,socket) => {

  User.findOne({ 'email' : email }).then( user => {
    if(user){

      //winston.log('info', user.email + ' found.');
      user.active = status;
      user.save().then(()=>{
        socket.emit('setUserStatusResult',{ "success" : true, "email" : email ,"msg" : status });
      }).catch( err => { 
        console.log(err);
        socket.emit('setUserStatusResult',{ "success" : false, "email" : email ,"msg" : 'Status change failed!' });
      });
    
    } else {

      socket.emit('setUserStatusResult', { 
          "success" :false, 
          "email" : email ,
          "msg" : "User nor found."
      });
    }
  })
};
