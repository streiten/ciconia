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

  // event attributes from https://www.movebank.org/movebank/service/direct-read?attributes
  var eventAttributes = "acceleration_axes,acceleration_raw_x,acceleration_raw_y,acceleration_raw_z,acceleration_sampling_frequency_per_axis,acceleration_x,acceleration_y,acceleration_z,accelerations_raw,activity_count,activity_count,algorithm_marked_outlier,argos_altitude,argos_best_level,argos_calcul_freq,argos_error_radius,argos_gdop,argos_iq,argos_lat1,argos_lat2,argos_lc,argos_lon1,argos_lon2,argos_nb_mes,argos_nb_mes_120,argos_nb_mes_identical,argos_nopc,argos_orientation,argos_pass_duration,argos_sat_id,argos_semi_major,argos_semi_minor,argos_sensor_1,argos_sensor_2,argos_sensor_3,argos_sensor_4,argos_transmission_timestamp,argos_valid_location_algorithm,argos_valid_location_manual,barometric_depth,barometric_height,barometric_pressure,bas_compensated_latitute,bas_confidence,bas_fix_type,bas_mid_value_secs,bas_stationary_latitute,bas_transition_1,bas_transition_2,battery_charge_percent,battery_charging_current,behavioural_classification,comments,compass_heading,deployment_id,eobs_acceleration_axes,eobs_acceleration_sampling_frequency_per_axis,eobs_accelerations_raw,eobs_activity,eobs_activity_samples,eobs_battery_voltage,eobs_fix_battery_voltage,eobs_horizontal_accuracy_estimate,eobs_key_bin_checksum,eobs_speed_accuracy_estimate,eobs_start_timestamp,eobs_status,eobs_temperature,eobs_type_of_fix,eobs_used_time_to_get_fix,event_id,event_set_id,external_temperature,flt_switch,gps_dop,gps_fix_type,gps_hdop,gps_maximum_signal_strength,gps_satellite_count,gps_time_to_fix,gps_vdop,ground_speed,gsm_mcc_mnc,gsm_signal_strength,gt_activity_count,gt_sys_week,gt_tx_count,habitat,heading,height_above_ellipsoid,height_above_msl,height_raw,individual_id,internal_temperature,light_level,location_error_numerical,location_error_percentile,location_error_text,location_lat,location_long,magnetic_field_raw_x,magnetic_field_raw_y,magnetic_field_raw_z,manually_marked_outlier,manually_marked_valid,migration_stage,migration_stage_standard,modelled,mw_activity_count,mw_show_in_kml,ornitela_transmission_protocol,proofed,raptor_workshop_behaviour,raptor_workshop_deployment_special_event,raptor_workshop_migration_state,sensor_type_id,study_id,study_specific_measurement,tag_battery_voltage,tag_id,tag_tech_spec,tag_voltage,technosmart_activity,technosmart_signal_quality,tilt_angle,tilt_x,tilt_y,tilt_z,timestamp,transmission_timestamp,underwater_count,underwater_time,update_ts,vertical_error_numerical,visible,waterbird_workshop_behaviour,waterbird_workshop_deployment_special_event,waterbird_workshop_migration_state";
  // https://www.movebank.org/movebank/service/json-auth?study_id=10531951&individual_ids[]=186433630&max_events_per_individual=10&sensor_type=gps
  options.url = jsonApiBaseURL + '?study_id='+studyId+'&individual_ids[]='+individualID+countQVar+timeQVar+'&sensor_type=gps&attributes=' + eventAttributes;
  
  return request(options).then( body =>  {
        return new Promise( (resolve,reject) => {
          var result = JSON.parse(body);
          // ToDo: reject on non parsable body
          resolve(result);
        });
    }).catch( err => {
      console.log('Err! Movebank said:' + err.statusCode);
        reject(err);
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






