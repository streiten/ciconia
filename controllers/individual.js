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

  var start = moment().subtract(30, 'days');
  var end = moment();

  movebank.getIndividualsEvents(req.params.sid,req.params.id,start,end).then( data => {

    var events = data.individuals[0].locations.map( event => {
      event.timestamp = moment(event.timestamp).format("llll");
      return event;
    });
    
    events.reverse();

    animal.find({ where: { id: req.params.id } }).then(animal => {
    
      res.render('individual', {
        title: 'Individual ' + req.params.id + ': ' + data.individuals[0].individual_local_identifier,
        ids:  JSON.stringify({ id : req.params.id, sid : req.params.sid }),
        featureRange: animal.featureRange
      });

    });


  
  });
};


exports.getMapData = (reqData,socket) => {

  animal.find({ where: { id: reqData.ids.id } }).then(animal => {
    
    if(!reqData.start){
      reqData.start = animal.featureDateStart;
    }
    
    if(!reqData.end){
      reqData.end = animal.featureDateEnd;
    }

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
