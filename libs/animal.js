var fs = require('fs');
var winston = require('winston');
var movebank = require('./movebank.js');
var moment = require('moment');

APPconfig = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf8'));

// var movebank = require('./movebank');
// var mb = new movebank();

module.exports = Animal; 

function Animal(data,studyId){

  this.ID = data.id;
  this.studyId = studyId;
  this.name = data.local_identifier;

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

Animal.prototype.getLocation = function(lat,long) {
  // Reverse GeoCode MapBox API 
} 

Animal.prototype.getWeather = function (lat,long,timestamp) {
  // https://www.wunderground.com/weather/api/d/docs
}

Animal.prototype.getPOIs = function (lat,long,timestamp) {
        // var nearestSites = whs.nearestSites(lat,long,100000,3);
        // for (var k = nearestSites.length - 1; k >= 0; k--) {
        //   winston.log('info','WH site(s) nearby: ' + nearestSites[k].site);
        // }
}

// getMood
// a bit rainy today 
// perfect weather for moving on
// interesing points around