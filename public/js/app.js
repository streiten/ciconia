(function(window){

  mapController.prototype.constructor = mapController;
  

  function mapController(socket){

    this.socket = socket;
    this.range = 90;
    this.eventsStart = moment().subtract(this.range,'days');
    this.eventsEnd =  moment();

    this.init();

    this.socket.on('mapData', data => {
      this.updateEventsMap(data); 
    });

  }

  mapController.prototype.init = function (){

      mapboxgl.accessToken = 'pk.eyJ1Ijoic3RyZWl0ZW5vcmciLCJhIjoiY2l5enZoOWcxMDAwazMza2FhNDEya256ZSJ9.O_ikSSrFzwLnOzB860SQpg';
      
      this.map = new mapboxgl.Map({
          container: 'map-individual',
          style: 'mapbox://styles/mapbox/outdoors-v10',
      });

      this.socket.emit('getMapData', { 'ids':  ids , 'start' : this.eventsStart , 'end': this.eventsEnd});

  };

  mapController.prototype.showNextWeek = function(){
    
    var currEnd = this.eventsStart.format();
    this.eventsEnd = moment(this.eventsEnd).add(this.range,'days');
    this.eventsStart =  moment(currEnd);
    
    this.socket.emit('getMapData', { 'ids':  ids , 'start' : this.eventsStart , 'end': this.eventsEnd});
  
  };

  mapController.prototype.showPrevWeek = function(){

    var currStart = this.eventsStart.format();
    this.eventsStart = moment(this.eventsStart).subtract(this.range,'days');
    this.eventsEnd =  moment(currStart);

    this.socket.emit('getMapData', { 'ids':  ids , 'start' : this.eventsStart , 'end': this.eventsEnd});
  
  };

  mapController.prototype.updateEventsMap = function(events){
    
    // console.log("data:",events);

    var coordinates = events.map((event)=> {
      return [ event.location_long , event.location_lat ];
      }
    );

    if(this.map.getLayer('events') != undefined) {
        this.map.removeLayer('events');
        this.map.removeSource('events');
    }

    var tPoints = events.map((event)=> {
      return turf.point([event.location_long , event.location_lat]);
      }
    );
    var fc = turf.featureCollection(tPoints);
    this.map.fitBounds(turf.bbox(fc),{ padding: 20});


    this.map.addLayer({
        "id": "events",
        "type": "line",
        "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                }
            }
        },
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": "#2AF",
            "line-width": 2
        }
    });
  };

  window.mapController = mapController;

}(window));









