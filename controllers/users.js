var winston = require('winston');

const User = require('../models/User.js');
//  var shortid = require('shortid');

exports.index = (req, res) => {
  
  User.find().then( users => {
   res.render('users', {
     title: 'Users',
     users: users
   });
  });
};


exports.getUsers = (socket) => {

  User.find().then( users => {
    socket.emit('onGetUsers',users);
  });

};
