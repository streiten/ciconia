var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var express = require('express');
var movebank = require('./libs/movebank.js');
var WHSites = require('./libs/whsites.js');
var app = express();

var winston = require('winston');
var http = require('http').Server(app);


// /**
//  * The Webserving
//  */

// var httpport = 8080;

// app.use(express.static('public'));
// app.get('/',requestHandlerHome);

// function requestHandlerHome(request, response) {
//   response.sendFile( __dirname + '/views/index.html');
//   winston.log('info', 'Serving another request ' + request.hostname + ' to ' + request.ip );
// }

// http.listen(httpport, function(){
//   winston.log('info', 'Webserver started... on ' + httpport);
// });


function Ciconia() {
  
  //var animal = require('./libs/animal.js');
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

  winston.level = 'debug';
  winston.log('info', 'Cicona started...');


  var mb = new movebank();
  var whs = new WHSites(__dirname + '/data/whc-en.xml');

  mb.getStudyIndividuals(APPconfig.individuals[0].studyId);

  // Initial 
  for (var i = APPconfig.individuals.length - 1; i >= 0; i--) {
    mb.getStudyEvents(APPconfig.individuals[i].studyId,APPconfig.individuals[i].individualId,1);
  }
  
  // Nearest World Heritage Sites
  var ns = whs.nearestSites(52.5200070,13.4049540,100000,10);
  for (var i = ns.length - 1; i >= 0; i--) {
    console.log('WH Site: ' + ns[i].site);
  }

  // Scheduled
  setInterval(function(){
    winston.log('info', '===.===');
    for (var i = APPconfig.individuals.length - 1; i >= 0; i--) {
      mb.getStudyEvents(APPconfig.individuals[i].studyId,APPconfig.individuals[i].individualId,1);
    } 
  },15 * 60 * 1000);

  // mb.getStudyDetails(APPconfig.individuals[0].studyId);


  mb.on('APIdataReady',dataReadyHandler);
  function dataReadyHandler(type) {
    switch(type) {
      case 'studies':
        //mb.downloadAllStudies();
        winston.log('info', 'Event: studies');
      break; 
      case 'studyDetailsReady':
        winston.log('info', 'Studies:');
        for (var i = 0; i <  mb.studies.length; i++) {
          winston.log('info', 'Name:',mb.studies[i].name,'- id:',mb.studies[i].id);
        }
      break; 
      case 'studyEventsReady':
        for (var j = mb.events.individuals.length - 1; j >= 0; j--) {
          for (var i = 0; i <  mb.events.individuals[j].locations.length; i++) {
            
            var format = "llll";
            var ts = moment(mb.events.individuals[j].locations[i].timestamp).format(format); 
            var long = mb.events.individuals[j].locations[i].location_long;
            var lat = mb.events.individuals[j].locations[i].location_lat;

            winston.log('info','___ ___');
            winston.log('info', mb.events.individuals[j].individual_local_identifier,'- t:', ts, ' - l:', long,',', lat);

            var nearestSites = whs.nearestSites(long,lat,100000,5);
            for (var k = nearestSites.length - 1; k >= 0; k--) {
              winston.log('info','WH site(s) nearby: ' + nearestSites[k].site);
            }

          }
        }
      break; 
      case 'studyIndividualsReady':
        winston.log('info', '=== Individuals ===');

        for (var i = 0; i <  mb.individuals.length; i++) {
          winston.log('info',mb.individuals[i].local_identifier,'- id:',mb.individuals[i].id );
        }
        winston.log('info', '=== ===');

      break;


    }
  }
}

Ciconia();
