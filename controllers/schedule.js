var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var later = require('later');

const mail = require('./mail.js');
const story = require('./story.js');
const animal = require('../models/Animal.js');
const event = require('../models/Event.js');
var movebank = require('../models/Movebank.js');


exports.init = () => {

    // mailing
    var mailschedule = later.parse.text('at 11:00 am');
    later.setInterval(mail.sendStory,mailschedule);

    // mail.sendStory();
 
    updateEvents();

    // storydata
    var storyDataschedule = later.parse.text('every 30 min');
    later.setInterval(updateEvents,storyDataschedule); 

    // updateStoryData();
};

const updateStoryData = () => {

      // get all active animals 
      animal.find({ "active": true } ).then( result => { 
        result.forEach( item => {
          story.fetchStoryData(item.id,moment().subtract(3,'hours'),true);
        });
      });

};

const updateEvents = () => {

  winston.log('info',moment().format(),'event update started...');
  animal.find({ "active": true } ).then( result => { 

    result.forEach( animal => {
     
      event.findOne({ 'animalId' : animal.id }).sort({ timestamp: -1 }).then( lastEvent => {
        
        if(lastEvent) {
          // get new ones since lastEvent
          var start = moment(lastEvent.timestamp);
          winston.log('info',animal.name + ': Last event in DB @ ' + start.format());
        } else {
          var start = moment().subtract(1,'day');
          winston.log('info',animal.name + ': No event data found. Starting @ ' + start.format());
        }

        movebank.getIndividualsEvents(animal.studyId,animal.id,start.add(1,'seconds'),moment()).then( data => {
          // could be empty
          if(data.individuals[0]) {
             winston.log('info',animal.name + ': ' + data.individuals[0].locations.length + ' new events in Movebank.');

             // lets upsert each one
             data.individuals[0].locations.forEach( item => {

              var query = { 
                'animalId' :  animal.id , 
                'timestamp' : item.timestamp
              };

               var obj = { 
                'animalId' :  animal.id , 
                'timestamp' : item.timestamp,
                'lat' : item.location_lat,
                'long' : item.location_long
               };

               // removing extracted properties
               delete item.timestamp;
               delete item.location_lat;
               delete item.location_long;
               obj.meta = item;

               event.findOneAndUpdate(query, obj ,{ 'upsert' : true , 'new': true }).then( item => {
                  // winston.log('info',animal.name + ': ' + item.timestamp + ' upserted.');
               });
             });

          } else {
            winston.log('info',animal.name + ': No new events in Movebank.');
          }
        });
      
      });
      

    });
  });

};

