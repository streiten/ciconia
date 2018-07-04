const animal = require('../models/Animal');
const moment = require('moment');
/**
 * GET /
 * Home page.
 */
 
exports.index = (req, res) => {
  
  moment.locale('de');

  animal.find().then( individuals => {
    
    var mapped = individuals.map( item => {

      var newItem ={ 
        "id": item.id,
        "studyId": item.studyId,
        "name": item.name,
        "lastEventAt":moment(item.lastEventAt).format('llll'),
        "active":item.active,
        "featureDateStart": moment(item.featureDateStart).format('ll'),
        "featureDateEnd": moment(item.featureDateEnd).format('ll'),
        "featureRange": item.featureRange,
        "updatedAt":item.updatedAt,
        "createdAt": item.createdAt 
     };

      return newItem;

    });

   res.render('animals', {
     title: 'Animals',
     individuals: mapped
   });
  
  });
};
