var request = require('request');
var parse = require('csv-parse');

module.exports = MoveBank;

function MoveBank(){
  this.user = APPconfig.user;
  this.password = APPconfig.password;
  this.studies = [];
}

MoveBank.prototype.getTestData = function(){
  request(APPconfig.APITestURL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
    }
  });
};

MoveBank.prototype.getLastAnimalEvent = function (){

};

MoveBank.prototype.getAllAnimalEvents = function (){

};

MoveBank.prototype.getStudies = function() {
  console.log('Getting studies...');
  // Fields:
  //acknowledgements,bounding_box,citation,comments,grants_used,has_quota,i_am_owner,id,license_terms,location_description,main_location_lat,main_location_long,name,number_of_deployments,number_of_events,number_of_individuals,number_of_tags,principal_investigator_address,principal_investigator_email,principal_investigator_name,study_objective,study_type,suspend_license_terms,timestamp_end,timestamp_start,i_can_see_data,there_are_data_which_i_cannot_see
  request('https://www.movebank.org/movebank/service/direct-read?entity_type=study', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var options = { delimiter : ',' , columns: true };
    //var that = this;
    parse(body, options, function(err, output){
      if(err) throw err;

      var counter = 0; 
      for (var study in output ) {
        if(study.i_can_see_data == 'false') {
          // console.log(output[i].id + ' - ' +  output[i].name);
          // delete output[i];
          output.splice(study,1);
        }
      }
      this.studies = output;
    }.bind(this));
  }
}.bind(this)).auth(this.user, this.password, false);
};

