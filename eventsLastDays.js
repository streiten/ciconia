var winston = require('winston');
var winston = require('winston');
var moment = require('moment');

const animalModel = require('./models/Animal.js');
const eventModel = require('./models/Event.js');

function fetchEvents() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - One event by day ?');

  var s = moment().subtract(30,'days');
  var targetTime = 16 * 3600; 

  animalModel.find({ "active": true } ).limit(1).then( animals => { 
    
    animals.forEach( animal => {


      // find events closest to provided moments time for the last n days
      // utilizting aggregation: group events by dayOfYear, sort absolute distance in seconds to time provided
      // return closest event for each day

      var aggregateParams = [
        {
          $match : {
            'animalId' : animal.id,
            'timestamp' : { $gt : new Date(s) }
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
        
        // remove 
        var events = events.map( item => {
          return item.event[0];
        });

        console.log(events); 
        return events;

      });


    });
  });

}

fetchEvents();





