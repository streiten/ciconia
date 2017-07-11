var fs = require('fs');
// var winston = require('winston');
var moment = require('moment');
var sphereKnn = require("sphere-knn");
var movebank = require('../models/Movebank.js');
var turf = require('@turf/turf');

// var animal = require('./libs/animal.js');
// var geonames = require('geonames.js');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));


/**
 * GET /
 * Individual page.
 */

exports.index = (req, res) => {

  var nowminus7 = moment().subtract(7, 'days');
  var now = moment();

  movebank.getIndividualsEvents(req.params.sid,req.params.id,nowminus7,now).then( data => {

    var events = data.individuals[0].locations.map( event => {
      event.timestamp = moment(event.timestamp).format("llll");
      return event;
    });
    
    events.reverse();
    
    // console.log(events);
    
    res.render('individual', {
      title: 'Individual ' + req.params.id + ': ' + data.individuals[0].individual_local_identifier,
      events: events,
      distance: calculateDistance(events)
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