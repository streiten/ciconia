var fs = require('fs');
// var winston = require('winston');
var moment = require('moment');
var sphereKnn = require("sphere-knn");
var movebank = require('../models/Movebank.js');
const animal = require('../models/Animal.js');

const eventController = require('./event.js');

var turf = require('@turf/turf');

// var animal = require('./libs/animal.js');
// var geonames = require('geonames.js');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));


/**
 * GET /
 * Individual page.
 */

exports.index = (req, res) => {

  animal.findOne( { 'id': req.params.id }).then(animal => {

  res.render('animal', {
    title: 'Animal ' + animal.id + ': ' + animal.name ,
    ids:  JSON.stringify({ id : animal.id, sid : animal.studyId }),
    featureRange: animal.featureRange
  });
  
  });

};

exports.updateLastEvent = (animalId,socket) => {

  animal.findOne( { 'id': animalId } ).then( animal => {

    // instead use last found in local event table ... TBD
    movebank.getIndividualsEvents(animal.studyId,animal.id,false,false,1).then( data => {
      var events = data.individuals[0].locations;
      events.reverse();
      
      animal.set({ 'lastEventAt' : events[0].timestamp });
      animal.save();

      socket.emit('lastEventUpdate',{ 'id' : animalId, 'lastEvent': events[0] });

    });

  });

};

exports.setIndividualStatus = (status,animalId,socket) => {
  
  var updateVals = { $set : { 'active' : status }}; 

  animal.findOneAndUpdate( { 'id': animalId } , updateVals ).then( animal => {
      socket.emit('individualStatus',{ 'id' : animalId, 'active': [status] });
  });

};



exports.getMapData = (reqData,socket) => {

  animal.findOne({ 'id': reqData.ids.id } ).then(animal => {

    if(!reqData.start){
      reqData.start = animal.featureDateStart;
    }
    
    if(!reqData.end){
      reqData.end = animal.featureDateEnd;
    }

    eventController.findFromTo(animal.id,reqData.start,reqData.end).then( events => {
      // console.log('Events found:',events.length);
      socket.emit('mapData',eventController.geoJsonPoints(events));
    });

  });
  
};


const calculateDistance = (waypoints) => {
  
  // var waypoints = waypoints || [
  //   [-75.343, 39.984],
  //   [-75.534, 39.123],
  //   [-75.343, 39.984]
  // ];

  var distance = 0;  
  waypoints.forEach((el,idx,arr)=> {
    if(idx+1<arr.length) {
      var from = [ el.location_lat,el.location_long ];
      var to = [ arr[idx+1].location_lat,arr[idx+1].location_long ];
      // console.log(arr[idx+1]);
      distance += turf.distance(from,to, "kilometers");
    }
  });
  return Math.round(distance);
}

