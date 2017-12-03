var winston = require('winston');
var moment = require('moment');

const animalModel = require('./models/Animal.js');
const eventModel = require('./models/event.js');
// const eventController = require('./controllers/event.js');
const storyController = require('./controllers/story.js');

function fetchStories() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - Fetching / Updating story data...');

  animalModel.find({ "active": true } ).then( animals => { 
    animals.forEach( animal => {
      eventModel.find({ "animalId" : animal.id } ).limit(1).then(events => {
          events.forEach( event => {
            storyController.fetchStoryDataForEvent(event);
          });
      });
    });
  });

}

fetchStories();