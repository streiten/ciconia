var fs = require('fs');
// var winston = require('winston');
var moment = require('moment');
var sphereKnn = require("sphere-knn");
var movebank = require('../models/Movebank.js');
const animal = require('../models/Animal.js');

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

  var start = moment().subtract(30, 'days');
  var end = moment();  

  movebank.getIndividualsEvents(animal.studyId,animal.id,start,end).then( data => {
        
      res.render('individual', {
        title: 'Individual ' + animal.id + ': ' + data.individuals[0].individual_local_identifier,
        ids:  JSON.stringify({ id : animal.id, sid : animal.studyId }),
        featureRange: animal.featureRange
      });

    });
  
  });

};

exports.updateLastEvent = (animalId,socket) => {

  animal.findOne( { 'id': animalId } ).then( animal => {
    // instead use last found in local event table ... TBD
    movebank.getIndividualsEvents(animal.studyId,animal.id,false,false,1).then( data => {
      var events = data.individuals[0].locations.map( event => {
        event.timestamp = moment(event.timestamp).format("llll");
        return event;
      });
      events.reverse();
      
      animal.set({ 'lastEventAt' : events[0].timestamp });
      animal.save();

      socket.emit('lastEventUpdate',{ 'id' : animalId, 'lastEvent': events[0] });

    });

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
s
    movebank.getIndividualsEvents(reqData.ids.sid,reqData.ids.id,moment(reqData.start),moment(reqData.end)).then( data => {

      var events = data.individuals[0].locations.map( event => {
        event.timestamp = moment(event.timestamp).format("llll");
        return event;
      });
      events.reverse();
      socket.emit('mapData',geoJSONify(events));

    });

  });

};

const geoJSONify = (events) => {
  
  // console.log(events);
  
  var points = events.map((event)=> {
      return turf.point([event.location_long , event.location_lat], event );
    }
  );
  var collection = turf.featureCollection(points);

  return collection;
  
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

const getFeatureDate = (individualId) => {
  
};
