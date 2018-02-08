process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


var winston = require('winston');
var winston = require('winston');
var moment = require('moment');

const animalModel = require('./models/Animal.js');
const eventController = require('./controllers/Event.js');

function fetchEvents() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - One event by day ?');

  var s = moment();

  animalModel.find({ "active": true } ).then( animals => { 
    animals.forEach( animal => {
      
      eventController.findOnePerDay(animal.id,s,10).then(events => {
        events.forEach(event => {
          console.log(event.timestamp);
        });

      });

    });
  });
}

fetchEvents();





