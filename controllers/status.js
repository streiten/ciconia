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
        "featureDateStart": item.featureDateStart,
        "featureDateEnd": item.featureDateEnd,
        "featureRange": item.featureRange,
        "updatedAt":item.updatedAt,
        "createdAt": item.createdAt 
     };

      return newItem;

    });

   res.render('status', {
     title: 'Status',
     individuals: mapped
   });
  
  });
};
