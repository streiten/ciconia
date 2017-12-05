var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var mustache = require('mustache');
const parseJson = require('parse-json');
const request = require('request-promise-native');

var MapboxClient = require('mapbox');
var geonames = require('geonames.js');
var WHSites = require('../libs/whsites.js');
var movebank = require('../models/Movebank.js');

const animal = require('../models/Animal.js');
const eventModel = require('../models/Event.js');

var storyData = require('../models/StoryData.js');

const mjml = require('mjml');

var turf = require('@turf/turf');

const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));


/**
 * GET /
 * Story page.
 */

exports.index = (req, res) => {
  

  animal.findOne({ 'id': req.params.id }).then(animal => {

    // get feature range startdate
    var eventdate = moment(animal.featureDateStart);
    var dayoffset = 0;
    // day offset ? -> clac the event to display

    if(req.params.day) {
      dayoffset = req.params.day;
      eventdate.add(dayoffset,'day');
    }

    //now find the closest event 
    eventModel.findOne( { 'animalId' : animal.id , 'timestamp': { $gte : eventdate }}).sort({"timestamp" : 1}).then( closestEvent => {
      
      // if there is one, check if there is storyDate else getit
      if(closestEvent) {
        
        // find last timestamp for this animals storydata available
        storyData.findOne( { 'eventId' : closestEvent._id } ).then( story => {
          if(story) {
            
            exports.generateStoryMarkup(moment(story.timestamp).toISOString(), animal, 'Alex' ).then( data => {
             res.render('story', {
                'body': data,
                'state': eventdate.format('ll') + ' - Event: ' + moment(closestEvent.timestamp).format('llll') + '_id: ' + closestEvent._id ,
                'prevStoryUrl' : '/story/' + animal.id + '/' + (dayoffset*1-1) ,
                'nextStoryUrl' : '/story/' + animal.id + '/' + (dayoffset*1+1) 
              });
            });
          
          } else {

            winston.log('info','No Story found. Bummer. But fetching now...');

            exports.fetchStoryDataForEvent(closestEvent).then( all => {
              console.log('... fetch done. reload/redirect now!');
              res.redirect(req.originalUrl);
            });
          }

        });

      } else {
        winston.log('info','No event found for storybuilding.');
      }

    });
    
  });

};


exports.fetchStoryData = (animalID,start) => {

  animal.findOne({ 'id': animalID }).then( animal => {

    // find timestamp of last story data in DB and use it as start date for range
    storyData.findOne({ 'animalId' : animal.id }).sort({'timestamp': -1 }).then( result => {
      
      if(result) {
       winston.log('info',animal.name + ': Last story data @ ' + result.timestamp.toISOString());
       start = moment(result.timestamp);
      } else {
        // if there isn't a previous one  the start date from fn arguement is used
        winston.log('info',animal.name + ': No story data found. Starting @ ' + moment(start).toISOString());
      };

      movebank.getIndividualsEvents(animal.studyId,animal.id,start.add(1,'seconds'),moment()).then( data => {
        if( data.individuals[0] ) {  
          
          var events = data.individuals[0].locations.map( event => {
            // sequelize needs ISO 8601 Format
            event.timestamp = moment(event.timestamp).toISOString();
            return event;
          });
          
         winston.log('info','Fetching data for ' + animal.name +' now. '+ events.length + ' events...');
          
          if(events.length > 200 ) {
              winston.log('warning',events.length + 'are too much. Droping everything beyond 200.');
              events.splice(200);            
          }

          events.forEach((item,idx) => {
            fetchStoryData(events[idx],animal);
            winston.log('info','Data fetched for...' + item.timestamp);
          });
        
        } else {
          winston.log('info',animal.name + ': No events for that timerange.');
        }
      });

    });

  });

};

exports.generateStoryMarkup = ( timestamp , animal , username ) => {
  
  const queryStoryViewData = ( timestamp , animalId ) => {
      return storyData.findOne( { "timestamp" : timestamp, "animalId":animalId , "type" : "view" } ).then( result => {
          
          if(result) {
              var url = parseJson(result.json);
              var view = {
                view_img_src: url.imgurl
              };
          
              var viewtpl = fs.readFileSync('./views/mail/view.mjml', 'utf8');
              var mjmltpl =  mustache.render(viewtpl, view);
              return { "key" : "view" , "value" : mjmltpl };
          } else return { "key" : "view" , "value" : null };
      });
  };

  const queryStoryWHSData = ( timestamp , animalId ) => {
      
      return storyData.findOne( { "timestamp" : timestamp, "animalId":animalId , "type" : "whs" } ).then( result => {
        if(result) {

            var data = parseJson(result.json);

            // update to loop if multiple sites ???
            var view = {
              wh_title: data.site,
              wh_body: data.short_description,
              wh_img_src: data.ogimg_url,
              wh_url: data.http_url,
              wh_category: data.category
            };

            var whstpl = fs.readFileSync('./views/mail/whs.mjml', 'utf8');
            var mjmltpl = mustache.render(whstpl, view);
              return {"key" : "whs", "value" : mjmltpl };
        } else return { "key" : "whs" , "value" : null };
      });
  };

  const queryStoryWikipediaData = ( timestamp , animalId ) => {
      
      return storyData.find( { "timestamp" : timestamp, "animalId":animalId ,  "type" : "wikipedia" } ).then( result => {
          if(result) {
              
              var view = { wikis : []};

              // { summary: 'Alemdar, aka Gazi Alemdar, was a former Turkish salvage tug, which is best known for her victorious engagement with a French navy warship during the Turkish War of Independence. Built in 1898 in Denmark, the Danish-flagged vessel was seized by the Ottoman Empire during World War I (...)',
              //        elevation: 5,
              //        lng: 31.41616,
              //        distance: '1.8119',
              //        rank: 77,
              //        lang: 'en',
              //        title: 'Alemdar (ship)',
              //        lat: 41.2682,
              //        wikipediaUrl: 'en.wikipedia.org/wiki/Alemdar_%28ship%29' 
              // }

              result.forEach( (wikiItem,idx) => {

                var wikiItemObj = parseJson(wikiItem.json);

                view.wikis[idx] = { 
                  "wiki_title": wikiItemObj.title,
                  "wiki_body": wikiItemObj.summary,
                  "wiki_distance": wikiItemObj.distance,
                  "wiki_img_src": "https://upload.wikimedia.org/wikipedia/commons/4/45/Maricopa_County_Courthouse_October_6_2013_Phoenix_Arizona_2816x2112_Rear.JPG",
                  "wiki_url": 'https://' + wikiItemObj.wikipediaUrl
                };
              });

              wikitpl = fs.readFileSync('./views/mail/wiki.mjml', 'utf8');
              mjmltpl = mustache.render(wikitpl, view);

              return {"key" : "wikipedia" , "value" : mjmltpl };
          } else return { "key" : "wikipedia" , "value" : null };

      });
  };

  const queryStoryWeatherData = ( timestamp , animalId ) => {
      
      return storyData.findOne( { "timestamp" : timestamp, "animalId":animalId , "type" : "weather" } ).then( result => {
          if(result) {
            return {"key" : "weather" , "value" : parseJson(result.json) };
          } else return { "key" : "weather" , "value" : null };

      });
  };

  const queryStoryStatsData = ( timestamp , animalId ) => {
      return storyData.findOne( { "timestamp" : timestamp, "animalId":animalId ,  "type" : "stat" } ).then( result => {
          if(result) {
            return {"key" : "stat" , "value" : parseJson(result.json) };
          } else return { "key" : "stat" , "value" : null };
      });
  };


  return Promise.all([
       
       queryStoryViewData(timestamp,animal.id),
       queryStoryWikipediaData(timestamp,animal.id),
       queryStoryWHSData(timestamp,animal.id),
       queryStoryStatsData(timestamp,animal.id),
       queryStoryWeatherData(timestamp,animal.id)

       ]).then(storyParts => {

        // press results to object
        var storyPartsObj = {};
        storyParts.forEach( part => {
          storyPartsObj[part['key']] = part['value'];
        });

        
        var markup = '';
        var introview = {};

        introview.individual = animal.name;
        introview.name = username;

        if(storyPartsObj['weather']) {
          introview.temperature = storyPartsObj['weather'].weatherObservation.temperature;
          introview.wind = storyPartsObj['weather'].weatherObservation.windSpeed;
          introview.weather = storyPartsObj['weather'].weatherObservation.clouds;
        }

        // distance ... last spoke ? start of migration ?
        if(storyPartsObj['stat']) {
          introview.elevation = storyPartsObj['stat'].elevation.srtm1;
          introview.country = storyPartsObj['stat'].country.countryName;
        }

        var viewtpl = fs.readFileSync('./views/mail/intro.mjml', 'utf8');
        markup =  mustache.render(viewtpl, introview);
    
        // compositing the story parts now
        markup += storyPartsObj['view'] + storyPartsObj['wikipedia'] + storyPartsObj['whs'];

        // Others - loop
        view = {
          individuals : [
          {
            name: 'Joe',
            country: 'Belarus',
          },
          {
            name: 'Sepp',
            country: 'Bavaria',
          }
        ]};

        var moretpl = fs.readFileSync('./views/mail/more.mjml', 'utf8');
        markup += mustache.render(moretpl, view);
        
        wraptpl = fs.readFileSync('./views/mail/template.mjml', 'utf8');
        view = { 'body' : markup };
        mjmlmail = mustache.render(wraptpl, view);

        try {
          const { html, errors } = mjml.mjml2html( mjmlmail, { beautify: true, minify: false, level: "soft" } );

          if(errors.length > 0) {
            console.log(errors.map(e => e.formattedMessage).join('\n'))
          }

          return html;

        } catch(e) {
          if (e.getMessages) {
              console.log(e.getMessages());
            } else {
              throw e;
            }
        }
       });
};

// get all data from external sources (and store in db locally)
const fetchStoryData = ( event,animal ) => {

    fetchViewData(event.location_lat,event.location_long).then( data => {
      
      data = JSON.stringify(data);
      storyData
        .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'view', 'animalId' : animal.id }, { '$setOnInsert' : { 'eventId' : event._id, 'json': data }},{ 'upsert':true })
        .catch((error) => {
          console.log(error);
        });
    });
    
    fetchWeatherData(event.location_lat,event.location_long).then( data => {
      if(data) { 
        data = JSON.stringify(data);
        storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'weather', 'animalId' : animal.id }, { '$setOnInsert' : {'eventId' : event._id, 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      };
    });
    
    fetchWikipediaData(event.location_lat,event.location_long,1).then( data => {
      if(data) { 
        data = JSON.stringify(data); 
        storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'wikipedia', 'animalId' : animal.id }, { '$setOnInsert' : {'eventId' : event._id, 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      }
    });
    
    fetchWHSData(event.location_lat,event.location_long,1).then( data => {
      if(data[0]) { 
        data = JSON.stringify(data[0]);
        storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'whs', 'animalId' : animal.id }, { '$setOnInsert' : {'eventId' : event._id, 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      }
    });

    fetchStatData(event).then( data => {
      if(data) { 
        data = JSON.stringify(data);
        storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'stat', 'animalId' : animal.id }, { '$setOnInsert' : {'eventId' : event._id, 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      }
    });
};

// get all data from external sources (and store in db locally)
exports.fetchStoryDataForEvent = ( event ) => {
    
    // console.log('Fetching for' + event);
    var animalDir = 'data/' + event.animalId;
    
    if (!fs.existsSync(animalDir)){
        fs.mkdirSync(animalDir);
    }

    var ViewDataPromise = fetchViewData(event.lat,event.long).then( data => {
      
      // now save the file to disk
      var options = { 
          "url" : data.imgurl,
          "encoding":"binary"
      };

      data.localPath = 'data/'+event.animalId+'/'+event.animalId +'-'+ moment(event.timestamp).valueOf() + '.jpg';

      var mapImageSave = request(options).then( body  => {
        var writeTo = 'data/'+event.animalId+'/'+event.animalId +'-'+ moment(event.timestamp).valueOf() + '.jpg';
        
        fs.writeFile(writeTo, body, 'binary', function (err) {
          if(err) {
            winston.log('error',err);
          }
        });
      }).catch(err =>  {
        winston.log('error',err);
      });
      
      data = JSON.stringify(data);
      

      var writeDBPromise = storyData
        .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'view', 'animalId' : event.animalId }, {'eventId' : event._id, '$setOnInsert' : { 'json': data }},{ 'upsert':true })
        .catch((error) => {
          winston.log('error',error);
        });

      return Promise.all([
          mapImageSave,
          writeDBPromise
        ]);
        
    });
    
    var WeatherDataPromise = fetchWeatherData(event.lat,event.long).then( data => {
      if(data) { 
        data = JSON.stringify(data);
        return storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'weather', 'animalId' : event.animalId }, {'eventId' : event._id, '$setOnInsert' : { 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      };
    });
    
    var WikipediaDataPromise = fetchWikipediaData(event.lat,event.long,1).then( data => {
      if(data) { 
        data = JSON.stringify(data); 
        return storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'wikipedia', 'animalId' : event.animalId }, {'eventId' : event._id, '$setOnInsert' : { 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      }
    });
    
    var WHSDataPromise = fetchWHSData(event.lat,event.long,1).then( data => {
      if(data[0]) { 
        data = JSON.stringify(data[0]);
        return storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'whs', 'animalId' : event.animalId }, { '$setOnInsert' : {'eventId' : event._id, 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      }
    });

    var StatDataPromise = fetchStatData(event).then( data => {
      if(data) { 
        data = JSON.stringify(data);
        return storyData
          .findOneAndUpdate({"timestamp": event.timestamp , 'type' : 'stat', 'animalId' : event.animalId }, { '$setOnInsert' : {'eventId' : event._id, 'json' : data }},{ 'upsert':true })
          .catch((error) => {
            console.log(error);
          });
      }
    });


    // return Promise all fetches
    return Promise.all([
        StatDataPromise,
        WHSDataPromise,
        WikipediaDataPromise,
        WeatherDataPromise,
        ViewDataPromise
      ]);

};


const fetchViewData = function(lat,long) {
  
  var mbc = new MapboxClient(APPconfig.mapbox.accesstoken);
  var satteliteImageUrl = mbc.getStaticURL('streitenorg', APPconfig.mapbox.mapstyle, 1280, 720, {
    longitude: long,
    latitude: lat,
    zoom: 15
  }, {
    attribution: false,
    retina: true,
    logo: false
  });

  return new Promise((resolve,reject) => {
    resolve( { "imgurl" : satteliteImageUrl } );
  });
}; 

// const fetchPlaces = function(latitude,longitude,count) {
//   return this.geonames.findNearbyPlaceName( { lat :latitude, lng:longitude, maxRows: count}); //get continents
// };


/*
{ geonames: 
   [ { distance: '1.44003',
       timezone: [Object],
       asciiName: 'Guluc',
       countryId: '298795',
       fcl: 'P',
       countryCode: 'TR',
       adminId1: '737021',
       lat: '41.2515',
       fcode: 'PPL',
       continentCode: 'AS',
       elevation: 0,
       adminCode1: '85',
       lng: '31.4325',
       geonameId: 746449,
       toponymName: 'Gülüç',
       population: 0,
       adminName5: '',
       adminName4: '',
       adminName3: '',
       alternateNames: [Object],
       adminName2: '',
       name: 'Gülüç',
       fclName: 'city, village,...',
       countryName: 'Turkey',
       fcodeName: 'populated place',
       adminName1: 'Zonguldak' } ] }  
*/

const fetchWeatherData = function (latitude,longitude) {
  
  var gn = new geonames({username: 'ciconia', lan: 'en', encoding: 'JSON'});  
  return gn.findNearByWeather( { lat : latitude, lng: longitude }).then( data => {
    //{ status: { message: 'no observation found', value: 15 } }
    if('status' in data ){
      // console.log(data);
      return false;
    } else {
      return data;      
    }
  });

  /* { weatherObservation: 
     { elevation: 136,
       lng: 31.8,
       observation: 'LTAS 091350Z 16004KT 080V210 4000 -TSRA BR FEW020CB SCT030 BKN100 19/17 Q1011 RETS',
       ICAO: 'LTAS',
       clouds: 'few clouds',
       dewPoint: '17',
       cloudsCode: 'FEW',
       datetime: '2017-06-09 13:50:00',
       countryCode: 'TR',
       temperature: '19',
       humidity: 88,
       stationName: 'Zonguldak',
       weatherCondition: 'n/a',
       windDirection: 160,
       hectoPascAltimeter: 1011,
       windSpeed: '04',
       lat: 41.45 } }
  */

};


// const fetchPOIs = function (latitude,longitude,count) {
//   var mapboxClient = new MapboxClient(APPconfig.mapbox.accesstoken);
  
//   return mapboxClient.geocodeReverse({ latitude: latitude, longitude: longitude,options: { type: 'poi',limit: 3 } }, function(err, res) {
//   console.log(res);
//   return res;
//   // res is a GeoJSON document with up to 3 geocoding matches
//   });

// };


// exports.getPOIs = function (latitude,longitude,count) {
//   return this.geonames.findNearbyPOIsOSM( { lat :latitude, lng:longitude, maxRows: count })
//   .then( data => {
//     return this.getPOIText(data);
//   });
// };

/*

{ poi: 
   { lng: '31.4382373',
     distance: '0.1',
     name: 'Elmatepe',
     typeClass: 'place',
     typeName: 'neighbourhood',
     lat: '41.2642693' } }
*/

const fetchWikipediaData = function (latitude,longitude,count) {

  var gn = new geonames({username: 'ciconia', lan: 'en', encoding: 'JSON'});  

  return gn.findNearbyWikipedia( { lat : latitude, lng: longitude, maxRows: count, radius : 20 })
  .then( data => {
    // also harvest image from og:image of page
    return data['geonames'][0];
  });

  /*
  { geonames: 
     [ { summary: 'Alemdar, aka Gazi Alemdar, was a former Turkish salvage tug, which is best known for her victorious engagement with a French navy warship during the Turkish War of Independence. Built in 1898 in Denmark, the Danish-flagged vessel was seized by the Ottoman Empire during World War I (...)',
         elevation: 5,
         lng: 31.41616,
         distance: '1.8119',
         rank: 77,
         lang: 'en',
         title: 'Alemdar (ship)',
         lat: 41.2682,
         wikipediaUrl: 'en.wikipedia.org/wiki/Alemdar_%28ship%29' 
        }
      ] 
  } 
  */ 
};

const fetchWHSData = function (latitude,longitude,count) {
    
    var whs = new WHSites(__dirname + '/../data/whc-en.xml');
    return whs.nearestSites(latitude,longitude,500,count);

    // { category: 'Cultural',
    //    criteria_txt: '(i)(ii)(iii)(iv)',
    //    danger: {},
    //    date_inscribed: '1985',
    //    extension: '0',
    //    historical_description: {},
    //    http_url: 'http://whc.unesco.org/en/list/356',
    //    id_number: '356',
    //    image_url: 'http://whc.unesco.org/uploads/sites/site_356.jpg',
    //    ogimg_url: 
    //    iso_code: 'tr',
    //    justification: {},
    //    latitude: '41.0084700000',
    //    longitude: '28.9799300000',
    //    long_description: '<p>Istanbul bears unique testimony to the Byzantine and Ottoman civilizations. Throughout history, the monuments in the centre of the city have exerted considerable influence on the development of architecture, monumental arts and the organization of space, in both Europe and Asia. Thus, the 6,650&nbsp;m terrestrial wall of Theodosius II with its second line of defences, created in AD 447, was one of the leading references for military architecture even before St Sophia became a model for an entire family of churches and later mosques and before the mosaics of the palaces and churches of Constantinople influenced Eastern and Western Christian art.</p>\r\n<p>Istanbul was built at the crossroads of two continents; it was successively the capital of the Eastern Roman Empire, the Byzantine Empire and the Ottoman Empire, and it has constantly been associated with major events in political history, religious history and art history in Europe and Asia for some 20 centuries.</p>\r\n<p>At the same time, however, Istanbul is a large metropolis. With its population of some 3&nbsp;million inhabitants, this historic city has undergone population growth in the past 30 years, which has profoundly changed its conservation conditions. The threat of pollution arising from industrialization and rapid and initially uncontrolled urbanization have jeopardized the historical and cultural heritage of the old town.</p>\r\n<p>The World Heritage site covers four zones, illustrating the major phases of the city\'s history using its most prestigious monuments:</p>\r\n<ul class="unIndentedList">\r\n<li>the Archaeological Park, which in 1953 and 1956 was defined at the tip of the peninsula; </li>\r\n<li>the S&uuml;leymaniye quarter, protected in 1980 and 1981; </li>\r\n<li>the Zeyrek quarter, protected in 1979; </li>\r\n<li>the zone of the ramparts, protected in 1981. </li>\r\n</ul>\r\n<p>The ancient city and the capital of the Eastern Roman Empire are both represented: by the hippodrome of Constantine (324) in the Archaeological Park, by the aqueduct of Valens (378) in the S&uuml;leymaniye quarter, and by the ramparts built starting in 413 upon the order of Theodosius II, located in the last of the four zones.</p>\r\n<p>The capital of the Byzantine Empire is highlighted by several major monuments. In the Archaeological Park there are the churches of St Sophia and St Irene, which were built in the reign of Justinian (527-65); In the Zeyrek quarter there is the ancient Pantocrator Monastery which was founded under John II Comnenus (1118-43) by the Empress Irene; in the zone of the ramparts there is the old church of the Holy Saviour in Chora (now the Kariye Camii) with its marvellous mosaics and paintings from the 14th and 15th centuries. Moreover, the current layout of the walls results from modifications performed in the 7th and 12th centuries to include the quarter and the Palace of the Blachernes.</p>\r\n<p>The capital of the Ottoman Empire is represented by its most important monuments: Topkapı Saray and the Blue Mosque in the archaeological zone; the Sehzade and S&uuml;leymaniye mosques, which are two of the architect Ko&ccedil;a Sinan\'s major works, constructed under S&uuml;leyman the Magnificent (1520-66) in the S&uuml;leymaniye quarter; and the vernacular settlement vestiges of this quarter (525 wooden houses which are listed and protected).</p>',
    //    region: 'Europe and North America',
    //    revision: '0',
    //    secondary_dates: {},
    //    short_description: '<p>With its strategic location on the Bosphorus peninsula between the Balkans and Anatolia, the Black Sea and the Mediterranean, Istanbul has been associated with major political, religious and artistic events for more than 2,000 years. Its masterpieces include the ancient Hippodrome of Constantine, the 6th-century Hagia Sophia and the 16th-century S&uuml;leymaniye Mosque, all now under threat from population pressure, industrial pollution and uncontrolled urbanization.</p>',
    //    site: 'Historic Areas of Istanbul',
    //    states: 'Turkey',
    //    transboundary: '0',
    //    unique_number: '409' }
};

const fetchStatData = function (event) {

  var latitude = event.location_lat;
  var longitude = event.location_long;

  var gn = new geonames({username: 'ciconia', lan: 'en', encoding: 'JSON'});  

  // country
  var fetchCountry = gn.countrySubdivision( { lat : latitude, lng: longitude }).then( data => {
    return { 'key' : 'country' , 'value' : data };
  });
  
  // elevation: flat lands, alps, glacier ...
  // birds flying height
  var fetchElevation = gn.srtm1( { lat : latitude, lng: longitude }).then( data => {
        
    if(data.srtm1 == -32768) {
      console.log('Elevation: looks like over the sea...');
      data.srtm1 = 0;
    }
    return { 'key' : 'elevation' , 'value' : data };

  });

    return Promise.all([
       fetchElevation,
       fetchCountry
       ]).then(items => {

        // press results to object
        var statobj = {};
        items.forEach( item => {
          statobj[item['key']] = item['value'] ;
        });

        return statobj;
      
      });

};


const updateStoryData = () => {

      // get all active animals 
      animal.find({ "active": true } ).then( result => { 
        result.forEach( item => {
          story.fetchStoryData(item.id,moment().subtract(3,'hours'),true);
        });
      });

};






