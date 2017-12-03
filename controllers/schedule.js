var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var later = require('later');

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
    mailingTime();
    
    // event.updateEvents();

    // checking for new events
    var eventUpdateSchedule = later.parse.text('every 30 min');
    later.setInterval(event.updateEvents,eventUpdateSchedule); 

    // message que
    var mqSchedule = later.parse.text('every 2 min');
    later.setInterval(mqHandler,mqSchedule); 
    mqHandler();
};

const mqHandler = () => {

  winston.log('info','Working the message que...');
  // get items from que
  mqModel.find().limit(10).then( messages => {
    
    messages.forEach( msg => {
       
       // switch case type later on
       event.eventModel.findOne({'_id': msg.message.fetchStory.eventId}).then( event => {
          story.fetchStoryDataForEvent(event);
       });

       msg.remove();

    });
  });

};

const mailingTime = () => {

  // each animal that is active 
  // animal.find({ "active": true , featureDateStart : { $lte : new Date() } } ).then( result => { 
  // animal.find({ "active": true }).then( result => { 
    
  //   // special event ?
  //   result.forEach( item => {
  //     console.log(item.featureDateStart);
  //   });

  // });

  // send stories
  mail.sendStory();

};



