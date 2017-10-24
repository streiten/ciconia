(function(window){

  mapController.prototype.constructor = mapController;

  var map,eventsStart,eventsEnd;

  function mapController(socket){

    this.socket = socket;

    this.socket.emit('getMapData', { 'ids':  ids });

    this.socket.on('mapData', data => {
      
      this.eventsStart =  moment(data.features[data.features.length-1].properties.timestamp);
      this.eventsEnd = moment(data.features[0].properties.timestamp);

      $('#events-range-start').html(this.eventsStart.format('L'));
      $('#events-range-end').html(this.eventsEnd.format('L'));

      var stats = this.calculateStats(data);
      $('#events-distance').html(stats.distance);
      $('#events-distanceAB').html(stats.distanceAB);
      $('#events-count').html(stats.count);
      $('#events-avg').html(stats.eventsbyday);

      this.updateEventsMap(data); 

    });

    
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3RyZWl0ZW5vcmciLCJhIjoiY2l5enZoOWcxMDAwazMza2FhNDEya256ZSJ9.O_ikSSrFzwLnOzB860SQpg';

    this.map = new mapboxgl.Map({
        container: 'map-individual',
        style: 'mapbox://styles/mapbox/outdoors-v10',
        //style: 'mapbox://styles/mapbox/satellite-v9',

    });
    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('moveend', function(e){

      if(this.flying) {
        this.map.fire('flyend');
        this.flyToNextEvent();
      }
    }.bind(this));
    
    this.map.on('flystart', function(){
      this.flying = true;
      //console.log('flystart');

    }.bind(this));

    this.map.on('flyend', function(){
      this.flying = false;
      console.log('flyend');

    }.bind(this));

    // zoomlevel logging
    this.map.on('zoomend',function (){
      //console.log('zoom level',this.map.getZoom());
    }.bind(this));

    this.range = window.eventFeature.range;

    this.currentCenter = {};

    window.themap = this.map; 

  }

  mapController.prototype.init = function (){
  };

  mapController.prototype.showNextWeek = function(){
    
    var currEnd = this.eventsEnd.format();
    this.eventsEnd = moment(this.eventsEnd).add(this.range,'days');
    this.eventsStart =  moment(currEnd);
    
    this.socket.emit('getMapData', { 'ids':  ids , 'start' : this.eventsStart , 'end': this.eventsEnd});
  
  };

  mapController.prototype.resetWeek = function(){
    
    this.eventsEnd = moment();
    this.eventsStart = moment(this.eventsEnd).subtract(this.range,'days');
    $('#next-week[disabled]').attr('disabled');

    this.socket.emit('getMapData', { 'ids':  ids , 'start' : this.eventsStart , 'end': this.eventsEnd});
  
  };

  mapController.prototype.showPrevWeek = function(){

    var currStart = this.eventsStart.format();
    this.eventsStart = moment(this.eventsStart).subtract(this.range,'days');
    this.eventsEnd =  moment(currStart);

    $('#next-week[disabled]').removeAttr('disabled');

    this.socket.emit('getMapData', { 'ids':  ids , 'start' : this.eventsStart , 'end': this.eventsEnd});
  
  };

  mapController.prototype.calculateStats = function(eventsFC) { 
    
    var stats = {};

    stats.count = eventsFC.features.length;

    var startDate = moment(eventsFC.features[0].properties.timestamp);
    var endDate = moment(eventsFC.features[stats.count-1].properties.timestamp);
    
    stats.eventsbyday =  Math.round(stats.count / startDate.diff(endDate, 'days'));

    var cords = turf.combine(eventsFC).features[0].geometry.coordinates;
    stats.distance = this.calculateDistance(cords);
    stats.distanceAB = this.calculateDistance([ eventsFC.features[0].geometry.coordinates,eventsFC.features[stats.count-1].geometry.coordinates]);

    return stats;

  };

  mapController.prototype.calculateDistance = (waypoints) => {
    
    var distance = 0;  
    waypoints.forEach((el,idx,arr)=> {
      if(idx+1<arr.length) {
        var from = [ el[1],el[0] ];
        var to = [ arr[idx+1][1],arr[idx+1][0] ];
        distance += turf.distance(from,to, "kilometers");
      }
    });
    return Math.round(distance);
  }

  mapController.prototype.convertToLineStringGeoJson = (obj) => {

    var cordsForLineString = turf.combine(obj).features[0].geometry.coordinates;

    var lineGeoJson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": cordsForLineString
        }
      }]
    };

    return lineGeoJson;
  
  };

  mapController.prototype.updateEventsMap = function(eventsFC){

    this.map.fitBounds(turf.bbox(eventsFC),{ padding: 20});

    if(this.map.getLayer('events') != undefined) {
        this.map.removeLayer('events');
        this.map.removeSource('events');
        this.map.removeLayer('events-line');
        this.map.removeSource('events-line');

        this.map.removeLayer('events-simple');
        this.map.removeSource('events-simple');

        this.map.removeLayer('events-smooth');
        this.map.removeSource('events-smooth');

        this.map.removeLayer('events-smooth-points');
        this.map.removeSource('events-smooth-points');

    }

    var linestring = this.convertToLineStringGeoJson(eventsFC);
    this.map.addLayer({
        "id": "events-line",
        "type": "line",
        "layout": {
                   "line-join": "round",
                   "line-cap": "round"
               },
         "paint": {
             "line-color": "#FFF",
             "line-width": 1
         },
        "source": {
            "type": "geojson",
            "data": linestring
        }
    });


    // evenout location clusters first    
    var simpleGeoJson = turf.simplify(linestring,0.05,true);
    //console.log('sls',simpleGeoJson);

    // the simple way
    this.map.addLayer({
            "id": "events-simple",
            "type": "line",
            "layout": {
                       "line-join": "round",
                       "line-cap": "round"
                   },
             "paint": {
                 "line-color": "#0F0",
                 "line-width": 1
             },
            "source": {
                "type": "geojson",
                "data": simpleGeoJson
            }
        });

    var smoothlineFeature = turf.bezier(simpleGeoJson.features[0],100000,0.5);
    // console.log('smooth ls',smoothlineFeature);

    // the smooth way
    this.map.addLayer({
            "id": "events-smooth",
            "type": "line",
            "layout": {
                       "line-join": "round",
                       "line-cap": "round"
                   },
             "paint": {
                 "line-color": "#00F",
                 "line-width": 2
             },
            "source": {
                "type": "geojson",
                "data": smoothlineFeature
            }
        });

    // the events postitions
    this.map.addLayer({
        "id": "events",
        "type": "circle",
        "paint": {
            "circle-radius": 2,
            "circle-color": "#F00"
        },
        "source": {
            "type": "geojson",
            "data": eventsFC
        }
    });

    var smoothPoints = turf.multiPoint(smoothlineFeature.geometry.coordinates);

    // console.log(smoothlineFeature.geometry.coordinates);

    // the smooth ways points
    this.map.addLayer({
        "id": "events-smooth-points",
        "type": "circle",
        "paint": {
            "circle-radius": 2,
            "circle-color": "#FF0"
        },
        "source": {
            "type": "geojson",
            "data": smoothPoints
        }
    });

    this.currentCenter.index = 0;
    this.currentCenter.coordinates = this.map.getSource('events')._data.features[0].geometry.coordinates;

    // Create a popup, but don't add it to the map yet.
     var popup = new mapboxgl.Popup({
         closeButton: false,
         closeOnClick: false
     });

     this.map.on('mouseenter', 'events', function(e) {
         // Change the cursor style as a UI indicator.
         this.map.getCanvas().style.cursor = 'pointer';

         // Populate the popup and set its coordinates
         // based on the feature found.
         popup.setLngLat(e.features[0].geometry.coordinates)
             .setHTML(getBubbleMarkup(e.features[0].properties))
             .addTo(this.map);

         function getBubbleMarkup(props) {
           var m = '';
           for(prop in props){
            m += '<b>' + prop + ':</b> ' + props[prop] + '<br>';
           }
           return m;
         }

     }.bind(this));

     this.map.on('mouseleave', 'events', function () {
         this.map.getCanvas().style.cursor = '';
         popup.remove();
     }.bind(this));

  };

  mapController.prototype.flyToNextEvent = function(){

    this.map.fire('flystart');

    this.currentCenter.coordinates = this.map.getSource('events')._data.features[this.currentCenter.index].geometry.coordinates;
    
    console.log('flynow to index',this.currentCenter.index);
    console.log('flynow to',this.currentCenter.coordinates);
    
    // this.map.setZoom(13);
    
    this.map.flyTo({
          center: this.currentCenter.coordinates,
          speed: 0.1, // make the flying slow
          minZoom: 13, 
          zoom: 13,
          easing: function (t) {
            return t;
          }
      });

    // this.map.panTo(this.currentCenter.coordinates,{
    //   duration: 2000
    // });

    this.currentCenter.index++;

  };

  mapController.prototype.flyStop = function(){
    
    console.log('flyStop called');

    this.map.fire('flyend');
  
  };



  window.mapController = mapController;

}(window));









