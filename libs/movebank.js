var request = require('request');
var parse = require('csv-parse');
var winston = require('winston');
var util = require('util');

module.exports = MoveBank;

function MoveBank(){
  this.user = APPconfig.movebank.user;
  this.password = APPconfig.movebank.password;
  this.jsonApiBaseURL = APPconfig.movebank.jsonApiBaseURL;
  this.csvApiBaseURL = APPconfig.movebank.csvApiBaseURL;
}

MoveBank.prototype.getStudies = function(callback) {
  console.log('Getting studies...');
  // Fields:
  //acknowledgements,bounding_box,citation,comments,grants_used,has_quota,i_am_owner,id,license_terms,location_description,main_location_lat,main_location_long,name,number_of_deployments,number_of_events,number_of_individuals,number_of_tags,principal_investigator_address,principal_investigator_email,principal_investigator_name,study_objective,study_type,suspend_license_terms,timestamp_end,timestamp_start,i_can_see_data,there_are_data_which_i_cannot_see
  request(this.csvApiBaseURL + '?entity_type=study', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var options = { delimiter : ',' , columns: true };
    parse(body, options, function(err, output){
      if(err) throw err;

      var counter = 0; 
      for (var study in output ) {
        if(study.i_can_see_data == 'false') {
          output.splice(study,1);
        }
      }
      console.log('Fetched ' +  output.length + ' studies...');
      if("function" === typeof callback) {
        callback(output);
      }

    }.bind(this));
  }
}.bind(this)).auth(this.user, this.password, false);
};

MoveBank.prototype.downloadAllStudies = function() {
  var i = 0;

  var getStudyEvents = function (studiesCount){
    console.log('Fetching ' + this.studies[i].id + ' - ' + this.studies[i].name);

    if((i+1) == studiesCount) {
      clearInterval(interval);
    }
    i++;
  }.bind(this);
  
  var interval = setInterval(getStudyEvents,500,this.studies.length);

};

MoveBank.prototype.getStudyDetails = function(studyId,callback){
  // https://www.movebank.org/movebank/service/?entity_type=study&study_id==10531951

  request(this.csvApiBaseURL + '?entity_type=study&study_id=' + studyId, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var options = { delimiter : ',' , columns: true };
    parse(body, options, function(err, output){
      if(err) throw err;
      if("function" === typeof callback) {
        callback(output);
      }
    }.bind(this));
  }
}.bind(this)).auth(this.user, this.password, false);

};

MoveBank.prototype.getStudyEvents = function(studyId,individualID,count,callback){
  
  if( typeof count == undefined ) {
    var count = 10;
  }

  // json-auth endpoint here
  // https://www.movebank.org/movebank/service/json-auth?study_id=10531951&individual_ids[]=186433630&max_events_per_individual=10&sensor_type=gps

  request(this.jsonApiBaseURL + '?study_id='+studyId+'&individual_ids[]='+individualID+'&max_events_per_individual='+count+'&sensor_type=gps', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        
        var result = [];
        result = JSON.parse(body);
        if("function" === typeof callback) {
          callback(null,result);
        }

    } else {
      callback('Movebank API said status: ' + response.statusCode + ' for Animal ID: ' + individualID ,null);
    }
  }.bind(this)).auth(this.user, this.password, false);
};

MoveBank.prototype.getStudyIndividuals = function(studyId,callback){

  request('https://www.movebank.org/movebank/service/direct-read?entity_type=individual&study_id=' + studyId, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var options = { delimiter : ',' , columns: true };
    parse(body, options, function(err, output){
      var result = [];
      result['data'] = output; 
      result['studyId'] = studyId;
      if(err) throw err; 
      if("function" === typeof callback) {
        callback(result);
      }
    }.bind(this));
  }
}.bind(this)).auth(this.user, this.password, false);
};


