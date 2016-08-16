var movebank = require('./libs/movebank');
var mb = new movebank();

module.exports = Animal; 

function Animal(data){
  this.studyID = "data";
  this.animalID = "data";
  this.lastEvent = this.getLastEvent();
  this.allEvents = this.getAllEvents();
  this.currentLocation = 0;
  this.currentLocationName = this.getLocation();
}

Animal.prototype.getLastEvent = function(){
  // reuest from movebank
}

Animal.prototype.getAllEvents = function(){
  // reuest from movebank
}

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