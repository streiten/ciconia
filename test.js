var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var movebank = require('./libs/movebank.js');
var environment = require('./libs/environmentData.js');
var animal = require('./libs/animal.js');
var geode = require('geode');


function Test() {
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  winston.level = 'debug';
  winston.log('info', 'Test started...');

  // Mare
  $animal = new animal({ id : 186433630} , 10531951);
  
  $animal.getLastEvent(function(event){
    console.log(event);
  });

  var pos = { "long": 31.4371036 , "lat": 41.2639913 };

  var geo = new geode('ciconia', {language: 'en', country : 'DE'});    
  
  geo.weather({ lat :'41.2639913', lng:'31.4371036' }, function(err, results){
    console.log(results);
    for (var i = results.length - 1; i >= 0; i--) {
      console.log(result[i]);
    }

  });

}


new Test();
