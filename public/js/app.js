(function(window){

  mapController.prototype.constructor = mapController;
  

  function mapController(socket){

    this.socket = socket;
    this.range = 30;
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
      this.map.addControl(new mapboxgl.NavigationControl());

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

    $('#next-week[disabled]').removeAttr('disabled');

    this.socket.emit('getMapData', { 'ids':  ids , 'start' : this.eventsStart , 'end': this.eventsEnd});
  
  };

  mapController.prototype.updateEventsMap = function(eventsFC){
    
    this.map.fitBounds(turf.bbox(eventsFC),{ padding: 20});

    if(this.map.getLayer('events') != undefined) {
        this.map.removeLayer('events');
        this.map.removeSource('events');
    }

    this.map.addLayer({
        "id": "events",
        "type": "circle",
        "paint": {
            "circle-radius": 5,
            "circle-color": "#007cbf"
        },
        "source": {
            "type": "geojson",
            "data": eventsFC
        }
    });

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

    $('#events-range-start').html(this.eventsStart.format('L'));
    $('#events-range-end').html(this.eventsEnd.format('L'));

  };

  window.mapController = mapController;

}(window));









