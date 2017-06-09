var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var movebank = require('./libs/movebank.js');
var environment = require('./libs/environmentData.js');
var animal = require('./libs/animal.js');
// var geode = require('geode');
var geonames = require('geonames.js');

function Test() {
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  winston.level = 'debug';
  winston.log('info', 'Test started...');

  // Mare
  animal = new animal({ id : 186433630} , 10531951);
  
  // $animal.getLastEvent(function(event){
  //    console.log(event);
  // });

  // animal.getWikipedia(41.2639913,31.4371036);
  // animal.getWeather(41.2639913,31.4371036);
  // animal.getPlaces(41.2639913,31.4371036);
  animal.getPOIs(41.2639913,31.4371036);

}


new Test();
