var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var Sequelize = require('sequelize');
var express = require('express');
var movebank = require('./libs/movebank.js');
var environment = require('./libs/environmentData.js');
var animal = require('./libs/animal.js');
var mysql
var app = express();

var winston = require('winston');
var http = require('http').Server(app);

const sequelize = new Sequelize('ciconia', 'root', 'root');

const Animal = sequelize.define('animal', {
  id: { type: Sequelize.INTEGER, primaryKey: true }, 
  studyId: Sequelize.INTEGER,
  name: Sequelize.STRING
});

Animal.findAll().then(animals => {
  console.log(animals);
});

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
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  winston.level = 'debug';
  winston.log('info', 'Ciconia started...');
  
  //this.animals = [];
  //this.gatherAnimals();
  
  // update data from api scheduler (every h) -> send E-Mail

  // // Scheduled
  // setInterval(function(){
  //   winston.log('info', '===.===');
  //   for (var i = APPconfig.individuals.length - 1; i >= 0; i--) {
  //     mb.getStudyEvents(APPconfig.individuals[i].studyId,APPconfig.individuals[i].individualId,5);
  //   } 
  // },15 * 60 * 1000);

}

// animals factory ... 
Ciconia.prototype.gatherAnimals = function (){
  
  winston.log('info','Gathering animals...');
  var m = new movebank();
  
  m.on('APIdataReady',dataReadyHandler);
  function dataReadyHandler(type,data) {
    if(type == 'studyIndividualsReady'){
        this.animals = data['data'].map(function(mbAnimal){
          return new animal(mbAnimal,data['studyID']);
      });
    }
  }

  for (var i = APPconfig.studies.length - 1; i >= 0; i--) {
    m.getStudyIndividuals(APPconfig.studies[i].studyId);
  }

  // promise ? wait for all animals gathered
  return ;

};

Ciconia.prototype.getStudyDetails = function (){

  var m = new movebank();

  m.on('APIdataReady',dataReadyHandler);
  
  function dataReadyHandler(type,data) {
    if(type == 'studyDetailsReady'){
      winston.log('info', 'Studies:');
      for (var i = 0; i <  mb.studies.length; i++) {
        winston.log('info', 'Name:',mb.studies[i].name,'- id:',mb.studies[i].id, ' last update: ', mb.studies[i].timestamp_end);
      }
    }
  }

  // Get Studies Details
  // for (var i = APPconfig.studies.length - 1; i >= 0; i--) {
  //   mb.getStudyDetails(APPconfig.studies[i].studyId);
  // }
}

new Ciconia();
