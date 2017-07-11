const fs = require('fs');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const request = require('request-promise-native');
const parse = require('csv-parse');
const winston = require('winston');
const util = require('util');
const moment = require('moment');



var jsonApiBaseURL = APPconfig.movebank.jsonApiBaseURL;
var csvApiBaseURL = APPconfig.movebank.csvApiBaseURL;
var options = {
  auth : {
    user: APPconfig.movebank.user,
    pass: APPconfig.movebank.password,
    sendImmediately : false
  }
};

const csvparse = (body) => {
  var options = { delimiter : ',' , columns: true };
  return new Promise((resolve,reject) => {
    parse(body, options, function(err, output){
      if(err) reject('Error parsing: ' + err);
      resolve(output);
    });
  });
};

module.exports.getStudies = () => {
    //Fields:
    //acknowledgements,bounding_box,citation,comments,grants_used,has_quota,i_am_owner,id,license_terms,location_description,main_location_lat,main_location_long,name,number_of_deployments,number_of_events,number_of_individuals,number_of_tags,principal_investigator_address,principal_investigator_email,principal_investigator_name,study_objective,study_type,suspend_license_terms,timestamp_end,timestamp_start,i_can_see_data,there_are_data_which_i_cannot_see
    options.url = csvApiBaseURL + '?entity_type=study';
    return request(options)
           .then( body => csvparse(body))
           .catch(err => {
              console.log('Request Error: ',err);
            });
};

module.exports.getStudyIndividuals = studyId => {
  
  options.url = csvApiBaseURL + '?entity_type=individual&study_id=' + studyId;
  return request(options).then(body => {
    
    // Handle body <p>No data are available for download.</p>
    console.log(body);
    
    return csvparse(body).then(data => {
        return new Promise((resolve,reject) => {
                var result = [];
                result.data = data; 
                result.studyId = studyId;
                resolve(result);
        });
      });
  });
};

module.exports.getIndividualsEvents = (studyId,individualID,startts,endts,count) => {
  
  var countQVar = '';
  var timeQVar = '';
  if(startts && endts ) {
    timeQVar = '&timestamp_start='+startts.valueOf()+'&timestamp_end='+endts.valueOf();
  } else if(count) {
    countQVar = '&max_events_per_individual='+count;
  } else {
    countQVar = '&max_events_per_individual=5';
  } 

  options.url = jsonApiBaseURL + '?study_id='+studyId+'&individual_ids[]='+individualID+countQVar+timeQVar+'&sensor_type=gps&attributes=timestamp,location_long,location_lat,ground_speed,heading,height_above_mean_sea_level,height_above_ellipsoid';
  // https://www.movebank.org/movebank/service/json-auth?study_id=10531951&individual_ids[]=186433630&max_events_per_individual=10&sensor_type=gps

  return request(options).then( body =>  {
        return new Promise( (resolve,reject) => {
          var result = JSON.parse(body);
          // ToDo: reject on non parsable body
          resolve(result);
        });
    }).catch( err => {
      console.log(err);
    });
  };


module.exports.getStudyEvents = function(studyId,start,end,callback) {
    // console.log('Getting studies events...');
    // https://www.movebank.org/movebank/service/direct-read?entity_type=event&study_id=2911040&timestamp_start=20080604133045000&timestamp_end=20080604133046000
    // 20080604133045000
    // console.log(this.csvApiBaseURL + '?entity_type=event&study_id='+studyId+'&timestamp_start='+ start +'&timestamp_end='+ end);
    
    request(csvApiBaseURL + '?entity_type=event&study_id='+studyId+'&timestamp_start='+ start +'&timestamp_end='+ end , function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var options = { delimiter : ',' , columns: true };
      parse(body, options, function(err, output){
        if(err) callback();
        if("function" === typeof callback) {
          callback(output);
        }

      }.bind(this));
    }
  }.bind(this)).auth(mbUser, mbPass, false);
};



module.exports.getStudyDetails = function(studyId,callback){
  // https://www.movebank.org/movebank/service/?entity_type=study&study_id==10531951

  request(csvApiBaseURL + '?entity_type=study&study_id=' + studyId, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var options = { delimiter : ',' , columns: true };
    parse(body, options, function(err, output){
      if(err) throw err;
      if("function" === typeof callback) {
        callback(output);
      }
    }.bind(this));
  }
}.bind(this)).auth(mbUser,mbPass, false);

};






