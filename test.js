var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var Event = require('./models/Event.js');
var User = require('./models/User.js');

var geonames = require('geonames.js');

function Test() {
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  winston.level = 'debug';
  winston.log('info', 'Test started...');

  // get all the users
  User.find({}, function(err, users) {
    if (err) throw err;

    // object of all the users
    console.log(users);
  });


  var gn = new geonames({username: 'ciconia', lan: 'en', encoding: 'JSON'});  
  
  var latitude = "31";
  var longitude = "-112";
  
  // country
  var fetchCountry = gn.countrySubdivision( { lat : latitude, lng: longitude }).then( data => {
    console.log( { 'key' : 'country' , 'value' : data });
  });


  // Animal.findAll({ where: { active: 1 } }).then(animals => {

  // StoryData.findAll().then( rows => {
  //   console.log(rows);
  // });

  // var data = {
  //   eventId: 321,
  //   type: 'whs',
  //   title: "ABC",
  //   body: "ABC",
  //   link: "ABC",
  //   raw:  "ABC"
  // };

  // StoryData.create( data ).then( result => { 
  //   // console.log(result);
  // });


  // Mare
  // animal = new animal({ id : 128186488} , 128184877);
  
  // animal.getLastEvent(function(event){
  //     console.log(event);
  // });
  
   // mb = new movebank();
  // mb.getStudyDetails(128184877,function(event){
  //     console.log(event);
  // });


  // mb.getStudyIndividuals(8868155,function(data){
  //   console.log(data.studyId);
  //   data.data.forEach(animal => {
  //     console.log('AID:',animal.id,'Name:',animal.local_identifier,'Type:',animal.taxon_canonical_name);
  //   });
  // });

// https://www.movebank.org/movebank/service/json-auth?study_id=10531951&individual_ids[]=186433630&max_events_per_individual=10&sensor_type=gps

  // animal.getWikipedia(41.2639913,31.4371036);
  // animal.getWeather(41.2639913,31.4371036);
  // animal.getPlaces(41.2639913,31.4371036);
  // animal.getPOIs(41.2639913,31.4371036);
  // animal.getWHS(41.2639913,31.4371036);

}


new Test();
