var fs = require('fs');
var moment = require('moment');
var later = require('later');

var logger = require('./logger.js');

const mail = require('./mail.js');
const story = require('./story.js');
const event = require('./event.js');

const animal = require('../models/Animal.js');
var movebank = require('../models/Movebank.js');
const mqModel = require('../models/MessageQue.js');


exports.init = () => {

    later.date.localTime();

    // mailing
    var mailschedule = later.parse.text('at 11:00 am');
    // var mailschedule = later.parse.text('every 10 seconds');   
    later.setInterval(mailingTime,mailschedule);
    
    // checking for new events
    event.updateEvents();
    var eventUpdateSchedule = later.parse.text('every 2 hour');
    later.setInterval(event.updateEvents,eventUpdateSchedule); 

    // message que
    var mqSchedule = later.parse.text('every 2 min');
    later.setInterval(mqHandler,mqSchedule); 

    mail.sendSimStory();

};

const mqHandler = () => {

  // get items from que
  mqModel.find().limit(10).then( messages => {
    if(messages.length > 0) {
      logger.info('Work on the mq to be done:' + messages.length);
      messages.forEach( msg => {
         // switch case type later on
         event.eventModel.findOne({'_id': msg.message.fetchStory.eventId}).then( event => {
            story.fetchStoryDataForEvent(event);
         });
         msg.remove();
      });
    }
  });

};

const mailingTime = () => {


  // send stories
  // mail.sendStory();

};



