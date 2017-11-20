const animal = require('../models/Animal');

/**
 * GET /
 * Home page.
 */
 
exports.index = (req, res) => {
  
  animal.find().then(individuals => {
   res.render('status', {
     title: 'Status',
     individuals: individuals
   });
  });
};
