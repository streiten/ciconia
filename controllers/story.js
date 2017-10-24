var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var mustache = require('mustache');

var geonames = require('geonames.js');
var WHSites = require('../libs/whsites.js');
var movebank = require('../models/Movebank.js');
const animal = require('../models/Animal.js');
var StoryData = require('../models/StoryData.js');


const mjml = require('mjml');
const nodemailer = require('nodemailer');

var turf = require('@turf/turf');

// var animal = require('./libs/animal.js');
// var geonames = require('geonames.js');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));



/**
 * GET /
 * Story page.
 */

exports.index = (req, res) => {

    generateStoryMarkup(123).then( data => {
    
      res.render('story', {
        // title: 'Todays story for ' + req.params.id + ': ' + animal.name,
        body: data
      });
    
    });

};

// exports.generateStory ?
// stories are generated for this time moment in time
const generateStoryMarkup = ( eid ) => {

  return StoryData.find( { where: { eventId: eid } }).then( result => {
    
    // friemel together all the markup
    mjmltpl = fs.readFileSync('./views/mail/template.mjml', 'utf8');
    
    try {
      const { html, errors } = mjml.mjml2html(mjmltpl, { beautify: true, minify: false, level: "soft" })

      if (errors) {
        console.log(errors.map(e => e.formattedMessage).join('\n'))
      }

      // mjmlUtils.inject(pathToHtmlEmailTemplate, {
      //   name: 'bob',
      //   profileURL: 'https://app.com/bob',
      // })
      // .then(finalTemplate => {
      //   // finalTemplate is an HTML string containing the template with all occurrences 
      //   // of `{name}` replaced with "bob", and all occurrences of `{profileURL}` 
      //   // replaced with "https://app.com/bob". 
      // });

      var view = {
        name: "Alex",
        individual: "Kerko",
        distance: "324",
        country: "Armenia",
        temperature: "24°",
        wind: "windy",
        weather: "sunny",
        wiki_title: 'Maricopa County - Arizona',
        wiki_body: 'Maricopa County is a county located in the south-central part of the U.S. state of Arizona. As of the 2010 census, its population was 3,817,117, making it the most populous county in the state, and the fourth-most populous in the United States. It is more populous than 23 states',
        wiki_distance: "1.234",
        wiki_img_src: "https://upload.wikimedia.org/wikipedia/commons/4/45/Maricopa_County_Courthouse_October_6_2013_Phoenix_Arizona_2816x2112_Rear.JPG",
        wiki_url: "https://en.wikipedia.org/wiki/Maricopa_County%2C_Arizona",
        wh_title: "El Pinacate and Gran Desierto de Altar Biosphere Reserve",
        wh_body:'The 714,566 hectare site comprises two distinct parts: the dormant volcanic Pinacate Shield of black and red lava flows and desert pavements to the east, and, in the west, the Gran Altar Desert with its ever changing and varied sand dunes that can reach a height of 200 metres. This landscape of dramatic contrast notably features linear, star and dome dunes as well as several arid granite massifs, some as high as 650 metres. The dunes emerge like islands from the sea of sand and harbour distinct and highly diverse plant and wildlife communities, including endemic freshwater fish species and the endemic Sonoran Pronghorn, which is only to be found in northwestern Sonora and in southwestern Arizona (USA). Ten enormous, deep and almost perfectly circular craters, believed to have been formed by a combination of eruptions and collapses, also contribute to the dramatic beauty of the site whose exceptional combination of features are of great scientific interest.',
        wh_img_src: "http://whc.unesco.org/uploads/thumbs/site_1410_0002-1200-630-20151105134855.jpg",
        wh_url: "http://whc.unesco.org/en/list/1410",
        wh_category: "Natural"
      };

      var output = mustache.render(html, view);
      console.log(output);
      return output;

      } catch(e) {
        if (e.getMessages) {
        console.log(e.getMessages())
        } else {
          throw e
        }
      }
  });
};

// get all data from external sources (and store in db locally)
const getStoryData = ( eid, lat,long ) => {

    // check if data is in the db

    StoryData.find( { where: { eventId: 123 } }).then( result => {
      console.log(result);
    });

    // ? else fetch data for this event

    // Promise.all([
    //    data.animal.getView(lat,long),
    //    data.animal.getWikipedia(lat,long,3),
    //    // data.animal.getPOIs(lat,long,3),
    //    data.animal.getWHS(lat,long,1),
    //    data.animal.getWeather(lat,long)
    //    ])
    // .then(all => {
        
    //     // uhmm... well, what now ?
    //     // write all to db and return story id ?

    //  });

};


const sendMail = (to,subject,body) => {
   
   let mailOptions = {
       from: '"Ciconia Ciconia" <alex@streiten.org>', 
       to: to, 
       subject: subject, 
       html: body
   };

  let transporter = nodemailer.createTransport(smtpConfig);

  if( 'simulate 'in APPconfig.smtp || APPconfig.smtp.simulate ) {
    console.log(mailbody);
    callback(null,'Mail send logged and simulated...');
  } else {
     transporter.sendMail(mailOptions, (error, info) => {
       if (error) {
          callback(error,null);
       }
       callback(null,'Message ' + info.messageId + ' sent: ' + info.response);
    });
  }

};


const getView = function(lat,long) {

  var satteliteImageUrl = this.mapboxClient.getStaticURL('streitenorg', APPconfig.mapbox.mapstyle, 1280, 400, {
    longitude: long,
    latitude: lat,
    zoom: 16
  }, {
    attribution: false,
    retina: true,
    logo: false
  });

  return new Promise((resolve,reject) => {
    resolve('<img src="' + satteliteImageUrl + '" height="200" width="640" /><br><br>');
  });
}; 

// const getPlaces = function(latitude,longitude,count) {
//   return this.geonames.findNearbyPlaceName( { lat :latitude, lng:longitude, maxRows: count}); //get continents
// };


// const getPlacesText = function(data) {
//      let markup = 'The weather today:</br>' + 
//      data.weatherObservation.clouds + '</br>' +
//      data.weatherObservation.temperature + ' °</br>' +
//      data.weatherObservation.humidity + ' humid</br>' +
//      data.weatherObservation.windSpeed + ' windspeed</br>' +
//      data.weatherObservation.windDirection + ' winddirection</br></br>'; 
//   return markup;
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

const getWeather = function (latitude,longitude) {
  
  return geonames.findNearByWeather( { lat : latitude, lng: longitude })
  .then( data => {
    //{ status: { message: 'no observation found', value: 15 } }
    if('status' in data ){
      return data.status.message;
    } else {
      return getWeatherText(data);
    }
  });

};

const getWeatherText = function(data) {
     let markup = '<b>The weather today:</b></br>';
     
     markup += data.weatherObservation.clouds + '</br>';
     markup += data.weatherObservation.temperature + ' °</br>' +
     data.weatherObservation.humidity + ' humid</br>' +
     data.weatherObservation.windSpeed + ' windspeed</br>' +
     data.weatherObservation.windDirection + ' winddirection</br></br>'; 
  
  return markup;
};

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


const getPOIs = function (latitude,longitude,count) {
  var mapboxClient = new MapboxClient(APPconfig.mapbox.accesstoken);
  
  return mapboxClient.geocodeReverse({ latitude: latitude, longitude: longitude,options: { type: 'poi',limit: 3 } }, function(err, res) {
  console.log(res);
  return res;
  // res is a GeoJSON document with up to 3 geocoding matches
  });

};

// const getPOIText = function(data) {
//     let markup = '<b>Some POIs:</b></br>'; 
//     data.poi.forEach( poi => {
//       markup += poi.name +
//       'is a ' + poi.typeClass + ' of type ' + poi.typeName + ' thing ' +
//       'and '+ poi.distance + ' away.</br></br>' ;
//     });
//     return markup;
// };



// exports.getPOIs = function (latitude,longitude,count) {
//   return this.geonames.findNearbyPOIsOSM( { lat :latitude, lng:longitude, maxRows: count })
//   .then( data => {
//     return this.getPOIText(data);
//   });
// };

// exports.getPOIText = function(data) {
//     let markup = '<b>Some POIs:</b></br>'; 
//     data.poi.forEach( poi => {
//       markup += poi.name +
//       'is a ' + poi.typeClass + ' of type ' + poi.typeName + ' thing ' +
//       'and '+ poi.distance + ' away.</br></br>' ;
//     });
//     return markup;
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

exports.getWikipedia = function (latitude,longitude,count) {
  return geonames.findNearbyWikipedia( { lat : latitude, lng: longitude, maxRows: count })
  .then( data => {
    // also harvest image from og:image of page
    return getWikipediaText(data);
  });
};

exports.getWikipediaText = function(data) {
  let markup = '<b>Some wikipedia:</b></br>'; 
  data.geonames.forEach(article => {
    markup += article.title + '</br>' +
    article.summary + '</br>' +
    'That is: '+ article.distance + ' units away</br>' +
    '<a href="https://'+ article.wikipediaUrl +'">Read more...</a></br></br>';
  });
  return markup;
};

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

exports.getWHS = function (latitude,longitude,count) {
    var whs = new WHSites(__dirname + '/../data/whc-en.xml');
    return Promise.all(whs.nearestSites(latitude,longitude,500,count)).then( data => {
      return getWHSText(data);
    });
};

exports.getWHSText = function(data) {
  let markup = '<b>WH Sites within 500km:</b></br>';
       data.forEach(site => {
         markup += site.site + ' - ' +
         'Category: '+ site.category + '</br>' +
         site.short_description + '</br>' +
         '<img src="' + site.ogimg_url + '"/></br>' +
         '<a href="'+ site.http_url +'">Read more...</a></br></br>';
       });
    return markup;
};

// { category: 'Cultural',
//    criteria_txt: '(i)(ii)(iii)(iv)',
//    danger: {},
//    date_inscribed: '1985',
//    extension: '0',
//    historical_description: {},
//    http_url: 'http://whc.unesco.org/en/list/356',
//    id_number: '356',
//    image_url: 'http://whc.unesco.org/uploads/sites/site_356.jpg',
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

// getMood
// a bit rainy today 
// perfect weather for moving on

// interesing points around





