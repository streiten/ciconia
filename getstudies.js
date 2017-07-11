var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var movebank = require('./libs/movebank.js');
var animal = require('./libs/animal.js');
var geonames = require('geonames.js');

function dumpStudies() {
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  winston.level = 'debug';
  winston.log('info', 'Fetch started...');
  
  mb = new movebank();
  mb.getStudies(data => {
    
    var s = data.filter( study => {
      return study.i_can_see_data.localeCompare('false');
    });
    s.map(study => {
      mb.getStudyEvents(study.id,20170623000000000,20170630000000000,function(data){
        if(typeof data == 'object' && data.length > 0) {
          //console.log('---');
          // console.log(study.id,',',study.name);
          // console.log(data[0]);
          // mb.getStudyDetails(study.id,function(data){
          //   console.log(data);
          // });

          mb.getStudyIndividuals(study.id,function(data){
            console.log(data.studyId);
            data.data.forEach(animal => {
              console.log('SNAME',study.name,'SID:',study.id,'AID:',animal.id,'Name:',animal.local_identifier,'Type:',animal.taxon_canonical_name);
            });
          });

                      // { comments: '',
            //       death_comments: '',
            //       earliest_date_born: '',
            //       exact_date_of_birth: '',
            //       id: '177624683',
            //       latest_date_born: '',
            //       local_identifier: '139005-Monroe-Julie',
            //       ring_id: '',
            //       sex: 'f',
            //       taxon_canonical_name: 'Pandion haliaetus' }

        }
      });
    }); 
    console.log('Found '+ s.length +' studies where i can see data.');

  });



}


new dumpStudies();
