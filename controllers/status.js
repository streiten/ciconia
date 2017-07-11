const Animal = require('../models/Animal');

/**
 * GET /
 * Home page.
 */
 
exports.index = (req, res) => {
  
  Animal.findAll().then(individuals => {
   res.render('status', {
     title: 'Status',
     individuals: individuals
   });
  });
};
