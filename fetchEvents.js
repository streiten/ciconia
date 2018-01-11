var winston = require('winston');
var moment = require('moment');

const animalModel = require('./models/Animal.js');
const eventController = require('./controllers/event.js');

function fetchEvents() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - Fetching / Updating animals feature date range...');

  // ???
  // eventController.updateEvents();

  animalModel.find({ "active": true } ).then( result => { 
    result.forEach( item => {
        eventController.fetchEvents(item.id,moment(item.featureDateStart),moment(item.featureDateEnd));
    });
  });

}

fetchEvents();