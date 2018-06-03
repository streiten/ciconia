var fs = require('fs');
var APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var moment = require('moment');
var later = require('later');

var logger = require('./logger.js');

const mail = require('./mail.js');
const storyController = require('./story.js');

const eventController = require('./event.js');

const animal = require('../models/Animal.js');
var movebank = require('../models/Movebank.js');
// const mqModel = require('../models/MessageQue.js');


exports.init = () => {

    later.date.localTime();

    // mailing
    var mailschedule = later.parse.text('at 11:00 am');
    later.setInterval(mailingTime,mailschedule);
    
    var eventUpdateSchedule = later.parse.text('every 2 hour');
    later.setInterval(eventController.updateEvents,eventUpdateSchedule); 
    
    eventController.updateEvents();

    // message que
    // var mqSchedule = later.parse.text('every 2 min');
    // later.setInterval(mqHandler,mqSchedule); 

    // fetch stories que
    var fsSchedule = later.parse.text('every 2 min');
    // later.setInterval(fsHandler,fsSchedule); 

    if(APPconfig.sim.active) {
      // mqHandler();
      // fsHandler();
      // mail.sendSimStory();
      // eventController.updateEvents();
      // mail.sendSimStory();

    }

};

// const mqHandler = () => {

//   // check for events that don't have storydata and no message on the que and add them to the que
//   // remove adding to que from event fetching

//   // get items from que
//   mqModel.find().limit(20).then( messages => {
    
//     if(messages.length > 0) {
//       logger.info('Work on the mq to be done:' + messages.length);
      
//       messages.forEach( msg => {
//          // switch case type later on
//          event.eventModel.findOne({'_id': msg.message.fetchStory.eventId}).then( event => {
//             story.fetchStoryDataForEvent(event);
//          });

//          // do this only after fetchStoryData Success
//          msg.remove();

//       });
//     }
//   });

// };

const fsHandler = () => {
  // get 20 events that don't have storydata
  eventController.findStoryLess(20).then( events => {
    
    if(events.length > 0) {

      logger.info('Getting stories for the next 20 events.');
      
      events.forEach( event => {
        storyController.fetchStoryDataForEvent(event);
      });
    } else {
      logger.info('Yeah! All events seem to have stories...');
    }
  });
};

const mailingTime = () => {

  // send stories
  mail.sendStory();
  if(APPconfig.sim.active) {
    mail.sendSimStory();
  }

};



