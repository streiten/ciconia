var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var Sequelize = require('sequelize');
var express = require('express');
var movebank = require('./libs/movebank.js');
var environment = require('./libs/environmentData.js');
var animal = require('./libs/animal.js');

var later = require('later');

var app = express();
const nodemailer = require('nodemailer');

var http = require('http').Server(app);

let smtpConfig = {
    host: APPconfig.smtp.host,
    port: 465,
    secure: true, // upgrade later with STARTTLS
    auth: {
        user: APPconfig.smtp.user,
        pass: APPconfig.smtp.pass
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
};

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

  const sequelize = new Sequelize(APPconfig.db.db, APPconfig.db.user, APPconfig.db.pass);

  const Animal = sequelize.define('animal', {
    id: { type: Sequelize.INTEGER, primaryKey: true }, 
    studyId: Sequelize.INTEGER,
    name: Sequelize.STRING
  });
  
  winston.level = 'debug';
  winston.log('info', 'Ciconia started...');


  // this.gatherAnimals(APPconfig.studies,animals => {
  //   animals.forEach(animal => {
  //     console.log(animal.name);
  //   });
  // });

  Animal.findAll().then(animals => {
    this.animals = animals.map(function(aml){
        var mbAnimal = { 'id': aml.id , 'local_identifier' : aml.name };
        return new animal(mbAnimal,aml.studyId);
    }.bind(this));
  }).then(data =>{
    this.updateAndSend();
    var sched = later.parse.text('at 11:00 am');
    // later.setInterval(this.updateAndSend.bind(this), sched);
  });
    
}

Ciconia.prototype.updateAndSend = function(){

    this.animals.forEach( animal => { 
      animal.getLastEvent( event => {
 
        var mailbody = animal.name + '<br>' + 
                       'Lat: ' + event.lat + '<br>' +
                       'Long: ' + event.long + '<br>' +
                       '@: ' + event.timestamp.format('LLLL') + '<br>';
        var staticMapsURL = 'http://maps.googleapis.com/maps/api/staticmap?center='+event.lat+','+event.long+'&zoom=9&size=400x300&maptype=terrain&markers=color:blue|'+event.lat+','+event.long;
        mailbody += '<img src="' + staticMapsURL + '" height="300" width="400" /><br><br>';


        // animal.getPlaces(event.lat,event.long,1,function(data){
        //     mailbody += data.geonames[0].name + 'is a place nearby. Like '+ data.geonames[0].distance +' units away.</br></br>';
        // });

        Promise.all([
           animal.getWikipedia(event.lat,event.long,3),
           // animal.getPOIs(event.lat,event.long,3),
           animal.getWHS(event.lat,event.long,1),
           animal.getWeather(event.lat,event.long)
           ])
        .then(all => {
           
           markup = all.reduce( (a,b) => {
             return a + b;
           });

           mailbody += markup;

           let mailOptions = {
               from: '"Ciconia Ciconia" <alex@streiten.org>', 
               to: 'alex@streiten.org', 
               subject: animal.name + " is here", 
               html: mailbody
           };

          let transporter = nodemailer.createTransport(smtpConfig);

          transporter.sendMail(mailOptions, (error, info) => {
           if (error) {
               return console.log(error);
           }
           console.log('Message %s sent: %s', info.messageId, info.response);
          });

         });
  
      }); 

    });
  };

Ciconia.prototype.composeMail = function(studies,callback){}


// animals factory ... 
Ciconia.prototype.gatherAnimals = function(studies,callback){
  
  winston.log('info','Gathering animals...');
  var m = new movebank();
  studies.forEach( study => {
    m.getStudyIndividuals(study.studyId, data => {
      var animals = data['data'].map(function(mbAnimal){
          return new animal(mbAnimal,data['studyId']);
        });
      if(typeof callback === "function"){
        callback(animals);
      }
    });
  });
};

Ciconia.prototype.getStudyDetails = function (studyId){
  
  winston.log('info','Getting study details...');
  var m = new movebank();
  m.getStudyDetails(studyId,data => {
      winston.log('info', 'Studies:');
      data.forEach( study => { 
        winston.log('info', 'Name:',mb.studies[i].name,'- id:',mb.studies[i].id, ' last update: ', mb.studies[i].timestamp_end);
      });
  });

};

new Ciconia();
