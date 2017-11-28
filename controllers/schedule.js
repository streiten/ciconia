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

    later.date.localTime();

    // mailing
    var mailschedule = later.parse.text('at 11:00 am');
    later.setInterval(mail.sendStory,mailschedule);
 
    // updateEvents();

    // storydata
    var eventUpdateSchedule = later.parse.text('every 30 min');
    later.setInterval(updateEvents,eventUpdateSchedule); 

    // var dailySchedule = later.parse.recur().every(5).second().startingOn(0);
    // later.setInterval(function (){
    //   console.log(moment());
    // },weeklySchedule);
    
    winston.log('info','Setting up Mail schedule...');

    animal.find({ "active": true , featureDateStart : { $lte : new Date() } } ).then( result => { 
      
      var animalMailIntervals = result.map(item => {
        // generate the schedule accroding to frequency (might vary depending on events publishe )
        
        console.log(new Date(item.featureDateStart));
        console.log(new Date('2017-11-27'));
        // var schedule = later.parse.recur().on(3).dayOfMonth().on()every(3).day().after(new Date('2017-11-29')).fullDate();
          
        // setting up the interval
        var interval = later.setInterval(function (){
            
            console.log(moment());
            // do the mailing
            
        },schedule);

        // return the object for stopping/updating later
        return { "animalId" : item.id, "schedule" : schedule, "interval" : interval };
      
      });
      
      animalMailIntervals.forEach(( item ) => {
        winston.log('info', item.animalId + ' next mailings:' + later.schedule(item.schedule).next(3));
      });


    });

};



const updateStoryData = () => {

      // get all active animals 
      animal.find({ "active": true } ).then( result => { 
        result.forEach( item => {
          story.fetchStoryData(item.id,moment().subtract(3,'hours'),true);
        });
      });

};

const processAndInsertEvents = (animal,events) => {

  winston.log('info',animal.name + ': ' + events.locations.length + ' new events in Movebank.');
  
  // lets upsert each one
  events.locations.forEach( item => {

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
            processAndInsertEvents(animal,data.individuals[0]);
          } else {
            winston.log('info',animal.name + ': No new events in Movebank.');
          }
        });
      
      });
    });
  });

};

const fetchEvents = (animalId,start,end) => {

  winston.log('info',moment().format(),'fetch events started...');
  animal.findOne({ "id": animalId } ).then( animal => { 
     
    movebank.getIndividualsEvents(animal.studyId,animal.id,start,end).then( data => {
      // could be empty
      if(data.individuals[0]) {
        processAndInsertEvents(animal,data.individuals[0]);
      } else {
        winston.log('info',animal.name + ': No events found in Movebank.');
      }
    });
  
  });
};


