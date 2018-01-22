var winston = require('winston');
var moment = require('moment');

const animalModel = require('./models/Animal.js');
const eventModel = require('./models/event.js');

function fetchStories() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - Find events without storydata and not on the que...');

  animalModel.find({ "active": true } ).then( animals => { 
    
    animals.forEach( animal => {

      eventModel.find({ "animalId" : animal.id } ).then(events => {
          
          console.log(events.length + 'events found for ' + animal.name);
          // events.forEach( event => {
          //   storyController.fetchStoryDataForEvent(event);
          // });
      
      });
    
    });

  });

}

fetchStories();