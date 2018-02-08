const util = require('util');

var fs = require('fs');
var logger = require('./logger.js');
var moment = require('moment');
var turf = require('@turf/turf');

var movebankModel = require('../models/Movebank.js');
const animalModel = require('../models/Animal.js');
const eventModel = require('../models/Event.js');
// const mqModel = require('../models/MessageQue.js');

exports.eventModel = eventModel; 

exports.findLastOne = (animalId) => {
    return eventModel.findOne({ "animalId" : animalId } ).sort({'timestamp':-1});
};

exports.findLastN = (animalId,timestamp,amount) => {
    amount = amount || 10
    return eventModel.find({ "animalId" : animalId , 'timestamp' : { '$lte' : timestamp } } ).limit(amount).sort({'timestamp':-1});
};

exports.findFromTo = (animalId,start,end,options) => {
    var events = eventModel.find({ 'animalId' : animalId , timestamp : { '$gte' : new Date(start), '$lte' : new Date(end)} }).sort({'timestamp':-1});
    return events;
};


exports.findClosest = (animalId,time) => {
    
    var aggregateParams = [
    {
        $addFields : {
            differenceToQueriedTime : {
                $abs : {
                    $subtract : [new Date(time), "$timestamp"]
                }
            }
        },
    },
    {
        $match : {
          animalId : animalId
        }
    },
    {
        $sort : {differenceToQueriedTime : 1}
    },
    {
        $limit : 1
    }
    ];

    var resultPromise = eventModel.aggregate(aggregateParams).then(result => {
      // only first/one result
      return result[0];
    });

    return resultPromise;

};

/**
 * find one event per day from start n days backwards, closest to time of of day of start ts
 * 
 * @param  {int} movebank animal ID
 * @param  {moment obj} events upto this moment
 * @param  {int} days backwards from start
 * @return {promise} resolving mongo aggregation query
 */ 

exports.findOnePerDay = (animalId,to,n) => {
      
      var from = to.clone().subtract(n,'days');

      console.log('finding on per day from ', from , 'until ',to);

      var mmtMidnight = to.clone().startOf('day');

      // Difference in minutes
      var targetTime = to.diff(mmtMidnight, 'seconds');
      
      // utilizting aggregation: group events by dayOfYear, sort absolute distance in seconds to time provided
      // return closest event for each day

      var aggregateParams = [
        {
          $match : {
            'animalId' : animalId,
            'timestamp' : { $gte : new Date(from) , $lte : new Date(to) }
          }
        },
        {
          $addFields : {
              differenceToQueriedTime : {
                  $abs : {
                      $subtract : [
                        targetTime, 
                        { $add : [
                            { $multiply : [ { $hour : '$timestamp'} , 3600 ] },
                            { $multiply : [ { $minute : '$timestamp'} , 60 ] },
                            { $second : '$timestamp'}
                          ]
                        }
                      ]
                    }
              }
          },
        },
        {
          $sort : {differenceToQueriedTime : 1}
        },
        {
          $group : {
            
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            },
            events: { $push :  "$$ROOT" }
            
            }
        },
        { "$project": { 
                "date": "$_id",
                "event": { "$slice": [ "$events", 1 ] },
                '_id' : 0
          }
        },
        {
          $sort : { 'date' : -1}
        }
      ];

      var resultPromise = eventModel.aggregate(aggregateParams).then(events => {
        
        // remove ????  
        events = events.map( item => {
          console.log(item.event[0].timestamp);
          return item.event[0];
        });

        return events;
      });

      return resultPromise;

};


exports.geoJsonPoints = (events) => {

  var points = events.map((event)=> {
      
      var properties = {};
      properties.timestamp = event.timestamp;
      properties.animalId = event.animalId;
      properties.hasStoryData = event.hasStoryData;
      properties.lat = event.lat;
      properties.long = event.long;
      Object.assign(properties,event.meta); 

      return turf.point([event.long , event.lat],properties);

    }
  );

  var collection = turf.featureCollection(points);
  // console.log(util.inspect(collection, false, 10))

  return collection;

};

exports.geoJsonLineString = (events) => {

  var points = events.map((event)=> {
      return [event.long , event.lat];
    }
  );

  var properties = { 
    "stroke" : "#000",
    "stroke-width": 2,
  };

  var ls = turf.lineString( points , properties );
  return ls;

};

exports.geoJsonSmoothy = (lineString) => {
  var res =  turf.bezier(lineString,1000,0.75);
  return res;
};

exports.geoJsonSimply = (lineString) => {
  var res = turf.simplify(lineString,0.25,true);
  return res;
};


exports.findStoryLess = (amount) => {
  return eventModel.find({ 'hasStoryData' : { $exists : false } }).limit(amount);
};

exports.setHasStory = (event) => {
    return eventModel.findOne({ "_id" : event._id } ).then((event) => {
      event.hasStoryData = true; 
      event.save();
    });
};

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
        // var mqOps = [];
        // for (var id in result.upsertedIds) {
        //     if (result.upsertedIds.hasOwnProperty(id)) {
        //       var msg = { 'fetchStory' : { 'eventId' : result.upsertedIds[id]}};
        //       mqOps.push( { 
        //         "insertOne" : {
        //           'document' : { 'message' : msg }
        //         }
        //       });
        //     }
        // }
        // mqModel.bulkWrite(mqOps).then(result => {});

    });
  };
};
