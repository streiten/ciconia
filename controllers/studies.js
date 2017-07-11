var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var movebank = require('../models/Movebank.js');

// var animal = require('./libs/animal.js');
// var geonames = require('geonames.js');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

/**
 * GET /
 * Studies page.
 */
 
exports.index = (req, res) => {

  movebank.getStudies().then(data => {
    
    var studies =  data.filter( study => {
      if(study.i_can_see_data.localeCompare('false')) {
        return true;
        // filter for events and latest update later
        // mb.getStudyEvents(study.id,20170623000000000,20170630000000000,function(data) {
        //   if(typeof data == 'object' && data.length > 0) {
        //     console.log(study.id,study.name);
        //   }
        // });
      }
    });

    res.render('studies', {
      title: studies.length + ' Studies',
      studies: studies
    });

  });
};

exports.studyDetail = (req, res) => {
  movebank.getStudyIndividuals(req.params.id).then(data => {
      res.render('study', {
        title: 'Study details for ' + req.params.id,
        individuals: data.data,
        studyId: req.params.id
      });
  });
};
