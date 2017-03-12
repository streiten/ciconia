var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var express = require('express');

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

  var movebank = require('./libs/movebank.js');

  var mb = new movebank();
  
  mb.getStudyEvents(APPconfig.individuals[0].studyId,APPconfig.individuals[0].individualId,1);
  setInterval(function(){
    mb.getStudyEvents(APPconfig.individuals[0].studyId,APPconfig.individuals[0].individualId,1);
  },15 * 60 * 1000);

  // mb.getStudies();
  // mb.getStudyDetails(APPconfig.studyID);
  // mb.getStudyIndividuals(APPconfig.studyID);

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
        winston.log('info', 'Events:');

        for (var j = mb.events.individuals.length - 1; j >= 0; j--) {
          for (var i = 0; i <  mb.events.individuals[j].locations.length; i++) {
            
            var format = "llll";
            var ts = moment(mb.events.individuals[j].locations[i].timestamp).format(format); 

            winston.log('info', 
              mb.events.individuals[j].individual_local_identifier,'- t:',
              ts, ' - l:',
              mb.events.individuals[j].locations[i].location_long,',',
              mb.events.individuals[j].locations[i].location_lat)
            ;
          }
        }

      break; 
      case 'studyIndividualsReady':
        winston.log('info', 'Individuals:');

        for (var i = 0; i <  mb.individuals.length; i++) {
          winston.log('info', 'Name:',mb.individuals[i].local_identifier,'- id:',mb.individuals[i].id );
        }

      break; 
      case 'studyDeploymentsReady':
        winston.log('info', 'Event: studyDeploymentsReady');
        debugger
        winston.log('info', mb.response);

      break; 
    }
  }
}

Ciconia();
