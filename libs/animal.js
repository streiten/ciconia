var fs = require('fs');
var winston = require('winston');
var movebank = require('./movebank.js');
var moment = require('moment');

APPconfig = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf8'));

// var movebank = require('./movebank');
// var mb = new movebank();

module.exports = Animal; 

function Animal(data,studyID){

  this.mbData = data;
  this.ID = this.mbData.id;
  this.studyID = studyID;

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

  this.lastEvent = this.getLastEvent();
  // this.allEvents = this.getAllEvents();
  // this.currentLocation = 0;
  // this.currentLocationName = this.getLocation();

}

Animal.prototype.getLastEvent = function(){
   
   var m = new movebank();
   
   m.on('APIdataReady',dataReadyHandler.bind(this));
   function dataReadyHandler(type,data) {
     if(type == 'studyEventsReady'){
      for (var j = data.individuals.length - 1; j >= 0; j--) {
        for (var i = 0; i <  data.individuals[j].locations.length; i++) {
          
          var format = "llll";
          var ts = moment(data.individuals[j].locations[i].timestamp); 
          var long = data.individuals[j].locations[i].location_long;
          var lat = data.individuals[j].locations[i].location_lat;

          if( ts.year() == 2017) {
            winston.log('info','___',this.studyID,'____',this.ID,'___');
            winston.log('info', data.individuals[j].individual_local_identifier,'- t:', ts.format(format), ' - long:', long,' lat:', lat);
          }

          // var nearestSites = whs.nearestSites(lat,long,100000,3);
          // for (var k = nearestSites.length - 1; k >= 0; k--) {
          //   winston.log('info','WH site(s) nearby: ' + nearestSites[k].site);
          // }

        }
      }
     }
   }
    
   m.getStudyEvents(this.studyID,this.ID,1);

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

}

// getMood
// a bit rainy today 
// perfect weather for moving on
// interesing points around