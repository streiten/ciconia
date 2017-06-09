var fs = require('fs');
var winston = require('winston');
var movebank = require('./movebank.js');
var moment = require('moment');
var geonames = require('geonames.js');

APPconfig = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf8'));

// var movebank = require('./movebank');
// var mb = new movebank();

module.exports = Animal; 

function Animal(data,studyId){

  this.ID = data.id;
  this.studyId = studyId;
  this.name = data.local_identifier;
  
  this.geonames = new geonames({username: 'ciconia', lan: 'en', encoding: 'JSON'});  

  // this.getLastEvent(event => {
  //   console.log(this.name,':',JSON.stringify(event,null,2));
  // });
  
  // {   comments: '3rd nest in Feres',
  //     death_comments: '',
  //     earliest_date_born: '2013-05-15 00:00:00.000',
  //     exact_date_of_birth: '',
  //     id: '10467330',
  //     latest_date_born: '2013-05-01 00:00:00.000',
  //     local_identifier: 'Nenni / GRA51165 (2550) +',
  //     ring_id: 'GRA51165',
  //     sex: 'm',
  //     taxon_canonical_name: '' }

  // if( this.mbData.death_comments !== '' ) {
  //   winston.log('info','Oh no...', this.mbData.death_comments);
  //   winston.log('info',JSON.stringify(this.mbData,null,2));
  //   winston.log('info',this.mbData.local_identifier,'- id:',this.mbData.id );
  // }

  // this.allEvents = this.getAllEvents();
  // this.currentLocation = 0;
  // this.currentLocationName = this.getLocation();

}

Animal.prototype.getLastEvent = function(callback){
   
   var m = new movebank();
         
   m.getStudyEvents(this.studyId,this.ID,1,data => {
    // for each ?? last Event => only should return only one ?
    data.individuals[0].locations.forEach( location => {
      var format = "llll";
      var ts = moment(location.timestamp); 
      var long = location.location_long;
      var lat = location.location_lat;

      var event = {
        'timestamp' :  moment(location.timestamp),
        'long' : location.location_long,
        'lat' : location.location_lat
      };

      if(typeof callback === "function"){
        callback(event);
      }
    });
  });

};

Animal.prototype.getAllEvents = function(){
  // reuest from movebank
};

Animal.prototype.getView = function(lat,long) {
  // Static MapBox API 
  // https://www.mapbox.com/api-documentation/?language=cURL#static
} 

Animal.prototype.getPlaces = function(latitude,longitude) {
  this.geonames.findNearbyPlaceName( { lat :latitude, lng:longitude }) //get continents
  .then(function(resp){
    console.log(resp);
  })
  .catch(function(err){
  }); 
} 


Animal.prototype.getWeather = function (latitude,longitude) {
   this.geonames.findNearByWeather( { lat : latitude, lng: longitude }) //get continents
  .then(function(resp){
    console.log(resp);
  })
  .catch(function(err){
  });
}

Animal.prototype.getPOIs = function (latitude,longitude) {
       this.geonames.findNearbyPOIsOSM( { lat :latitude, lng:longitude }) //get continents
      .then(function(resp){
        console.log(resp);
      })
      .catch(function(err){
      });
}

Animal.prototype.getWikipedia = function (latitude,longitude) {

   this.geonames.findNearbyWikipedia( { lat : latitude, lng: longitude }) //get continents
  .then(function(resp){
    console.log(resp);
  })
  .catch(function(err){
  });

}
  

// getMood
// a bit rainy today 
// perfect weather for moving on
// interesing points around