var winston = require('winston');
var moment = require('moment');

const animalModel = require('./models/Animal.js');
const eventController = require('./controllers/event.js');
const storyController = require('./controllers/story.js');

function fetchStories() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - Fetching / Updating story data...');

  animalModel.find({ "active": true } ).then( animals => { 
    animals.forEach( animal => {
      
      eventController.findClosest(animal.id,moment()).then(event => {
        console.log(event._id,event.timestamp);
        
        // storyController.fetchStoryDataForEvent(event);
        storyController.generateStoryMarkup(event);
      
      });

    });
  });
}

fetchStories();