var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var Sequelize = require('sequelize');
var express = require('express');
var movebank = require('./libs/movebank.js');
var environment = require('./libs/environmentData.js');
var animal = require('./libs/animal.js');
var nodemailer = require('nodemailer');
var later = require('later');

var MapboxClient = require('mapbox');


var app = express();
var http = require('http').Server(app);

/**
 * The Webserving
 */

// var httpport = 8080;

// app.use(express.static('public'));
// app.get('/',requestHandlerHome);

// function requestHandlerHome(request, response) {
//   response.sendFile( __dirname + '/views/index.html');
//   // var body = this.mailbodies.reduce( (acc,val) => {
//   //   return acc + val;
//   // });

//   // response.send(body);

//   winston.log('info', 'Serving another request ' + request.hostname + ' to ' + request.ip );

// }

// http.listen(httpport, function(){
//   winston.log('info', 'Webserver started... on ' + httpport);
// });


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



function Ciconia() {
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

  const sequelize = new Sequelize(APPconfig.db.db, APPconfig.db.user, APPconfig.db.pass);

  const Animal = sequelize.define('animal', {
    id: { type: Sequelize.INTEGER, primaryKey: true }, 
    studyId: Sequelize.INTEGER,
    name: Sequelize.STRING,
    active: Sequelize.INTEGER,
  });

  winston.level = 'debug';
  winston.log('info', 'Ciconia started...');

  Animal.findAll({ where: { active: 1 } }).then(animals => {
    this.animals = animals.map(function(aml){
        var mbAnimal = { 'id': aml.id , 'local_identifier' : aml.name };
        // TBD: check if animal exists in MB DB !
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
      animal.getLastEvent( (err,event) => {
        if(!err) {
          this.sendMail({animal,event},(err,result) => {
            if(err) return console.log(err);
            console.log(result);
          });
        } else {
          console.log('Err!',err);
        }
      }); 
    });
  };

Ciconia.prototype.sendMail = function(data,callback){

  var mailbody = data.animal.name + '<br>' + 
                 'Lat: ' + data.event.lat + '<br>' +
                 'Long: ' + data.event.long + '<br>' +
                 '@: ' + data.event.timestamp.format('LLLL') + '<br>';
  var staticMapsURL = 'http://maps.googleapis.com/maps/api/staticmap?center='+data.event.lat+','+data.event.long+'&zoom=9&size=400x300&maptype=terrain&markers=color:blue|'+data.event.lat+','+data.event.long;
  mailbody += '<img src="' + staticMapsURL + '" height="300" width="400" /><br><br>';

  var mapboxClient = new MapboxClient(APPconfig.mapbox.accesstoken);

  var satteliteImageUrl = mapboxClient.getStaticURL('streitenorg', APPconfig.mapbox.mapstyle, 1280, 400, {
    longitude: data.event.long,
    latitude: data.event.lat,
    zoom: 16
  }, {
    attribution: false,
    retina: true,
    logo: false
  });

  mailbody += '<img src="' + satteliteImageUrl + '" height="200" width="640" /><br><br>';

  // data.animal.getPlaces(data.event.lat,data.event.long,1,function(data){
  //     mailbody += data.geonames[0].name + 'is a place nearby. Like '+ data.geonames[0].distance +' units away.</br></br>';
  // });

  Promise.all([
     data.animal.getWikipedia(data.event.lat,data.event.long,3),
     // data.animal.getPOIs(data.event.lat,data.event.long,3),
     data.animal.getWHS(data.event.lat,data.event.long,1),
     data.animal.getWeather(data.event.lat,data.event.long)
     ])
  .then(all => {
     
     markup = all.reduce( (a,b) => {
       return a + b;
     });

     mailbody += markup;

     let mailOptions = {
         from: '"Ciconia Ciconia" <alex@streiten.org>', 
         to: 'alex@streiten.org', 
         subject: data.animal.name + " is here", 
         html: mailbody
     };

    let transporter = nodemailer.createTransport(smtpConfig);

    if( 'simulate 'in APPconfig.smtp || APPconfig.smtp.simulate ) {
      console.log(mailbody);
      
      callback(null,'Mail send logged and simulated...');
    } else {
       transporter.sendMail(mailOptions, (error, info) => {
         if (error) {
            callback(error,null);
         }
         callback(null,'Message ' + info.messageId + ' sent: ' + info.response);
      });
    }

   });

};


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
