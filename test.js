var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var movebank = require('./libs/movebank.js');
var animal = require('./libs/animal.js');
// var geode = require('geode');
var geonames = require('geonames.js');

function Test() {
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  winston.level = 'debug';
  winston.log('info', 'Test started...');

  // Mare
  animal = new animal({ id : 186433630} , 10531951);
  
  // animal.getLastEvent(function(event){
  //     console.log(event);
  // });
  
  mb = new movebank();
  mb.getStudyDetails(128184877,function(event){
      console.log(event);
  });

// https://www.movebank.org/movebank/service/json-auth?study_id=10531951&individual_ids[]=186433630&max_events_per_individual=10&sensor_type=gps

  // animal.getWikipedia(41.2639913,31.4371036);
  // animal.getWeather(41.2639913,31.4371036);
  // animal.getPlaces(41.2639913,31.4371036);
  // animal.getPOIs(41.2639913,31.4371036);
  // animal.getWHS(41.2639913,31.4371036);

}


new Test();
