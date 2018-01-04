var fs = require('fs');
var logger = require('./logger.js');
var moment = require('moment');

var movebankModel = require('../models/Movebank.js');
const animalModel = require('../models/Animal.js');
const eventModel = require('../models/Event.js');
const mqModel = require('../models/MessageQue.js');

exports.eventModel = eventModel; 

exports.updateEvents = () => {

  logger.debug('Updating Events...');
  animalModel.find({ "active": true } ).then( result => { 

    result.forEach( animal => {
     
      eventModel.findOne({ 'animalId' : animal.id }).sort({ timestamp: -1 }).then( lastEvent => {
        
        if(lastEvent) {
          // get new ones since lastEvent
          var start = moment(lastEvent.timestamp);
          // logger.log('debug',animal.name + ': Last event in DB @ ' + start.format());
        } else {
          var start = moment().subtract(2,'day');
          // logger.log('debug',animal.name + ': No event data found. Starting @ ' + start.format());
        }
        
        // console.log(animal.studyId,animal.id,start.add(1,'seconds'),moment());

        movebankModel.getIndividualsEvents(animal.studyId,animal.id,start.add(1,'seconds'),moment()).then( data => {
          // could be empty
          if(data.individuals[0]) {
            processAndInsertEvents(animal,data.individuals[0]);
          } else {
            // logger.log('debug',animal.name + ': No new events in Movebank.');
          }
        });
      
      });
    });
  });

};

exports.fetchEvents = (animalId,start,end) => {

  animalModel.findOne({ "id": animalId } ).then( animal => { 

    movebankModel.getIndividualsEvents(animal.studyId,animal.id,start,end).then( data => {
      // could be empty
      if(data.individuals[0]) {
        processAndInsertEvents(animal,data.individuals[0]);
      } else {
        // logger.log('debug',animal.name + ': No events found in Movebank.');
      }
    });
  
  });
};

const processAndInsertEvents = (animal,events) => {

  logger.info(animal.id + ' - ' + animal.name + ': ' + events.locations.length + ' new events found in Movebank. Upserting now.');
  
  // map data for db
  var eventsProcessed = events.locations.map( item => {

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

    return obj;

  });

  // Initialise the bulk operations array
  var bulkOps = [], mqOps = [], counter = 0;

  eventsProcessed.forEach(item => {

    counter++;

    var filter = { 
     'animalId' :  item.animalId, 
     'timestamp' : item.timestamp
    };

    bulkOps.push({
      "updateOne": {
          "filter" : filter,
          "update" : { $setOnInsert: item }, 
          "upsert" : true
      }
    });

    // 500 at a time
    if (counter % 500 == 0) {
      bulkInsertEvents(bulkOps);
      bulkOps = []; // re-initialize
    }
  });

  // the rest of the last batch 
  if (counter % 500 != 0) { 
    bulkInsertEvents(bulkOps);
  }

  function bulkInsertEvents(bulkOps) {
    eventModel.bulkWrite(bulkOps).then( result => {
        
        logger.log('debug','Mongo bulk result:' + ' inserted:' + result.nInserted + ' upserted:' +result.nUpserted+ ' ,matched:' +result.nMatched+ ' modified:' +result.nModified+ ' removed:' +result.nRemoved);

        // putting upserted ids on the messageque for story fetching
        var mqOps = [];
        for (var id in result.upsertedIds) {
            if (result.upsertedIds.hasOwnProperty(id)) {
              var msg = { 'fetchStory' : { 'eventId' : result.upsertedIds[id]}};
              mqOps.push( { 
                "insertOne" : {
                  'document' : { 'message' : msg }
                }
              });
            }
        }

        mqModel.bulkWrite(mqOps).then(result => {});

    });
  };
};
