var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var later = require('later');

const mail = require('./mail.js');
const story = require('./story.js');
const animal = require('../models/Animal.js');


exports.init = () => {

    // mailing
    var mailschedule = later.parse.text('at 11:00 am');
    later.setInterval(mail.sendStory,mailschedule);

    // mail.sendStory();

    // storydata
    var storyDataschedule = later.parse.text('every 15 min');
    later.setInterval(updateStoryData,storyDataschedule); 

    updateStoryData();
};

const updateStoryData = () => {

      // get all active animals 
      animal.find({ "active": true } ).then( result => { 
        result.forEach( item => {
          story.fetchStoryData(item.id,moment().subtract(3,'hours'),true);
        });
      });

};