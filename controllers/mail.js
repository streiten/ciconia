var fs = require('fs');
var APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var moment = require('moment');
var winston = require('winston');
const user = require('../models/User.js');
const animal = require('../models/Animal.js');
const storyData = require('../models/StoryData.js');

const story = require('./story.js');


const nodemailer = require('nodemailer');

let smtpConfig = {
    host: APPconfig.smtp.host,
    port: 465,
    secure: true, // upgrade later with STARTTLS
    auth: {
        user: APPconfig.smtp.user,
        pass: APPconfig.smtp.pass
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
};


exports.sendStory = () => {

  // all active animals
  animal.find( { 'active': true } ).then( animals => {
      // each animal 
      animals.forEach( animal => {
        // find latest storydata for animal 
        storyData.findOne({where : { individualId : animal.id }, order:  [ [ 'timestamp', 'DESC' ]] }).then( lastStory => {
          // generat email markup

          var ts = moment(lastStory.timestamp).toISOString();
          console.log(animal.name, 'last storydata ts:', ts);

          story.generateStoryMarkup(ts, animal, 'Alex' ).then( htmlbody => {
            // find all active subscribers
            user.find({ active: true }).then(users => {
              // send each one the email
              users.forEach( user => {
                send(animal.name,user.email,'Krawh! News from {country}',htmlbody);
              });
            });
        });
      });
    });
  });
};

const send = (fromName,to,subject,body) => {
   
   let mailOptions = {
       'from': '"'+fromName+'" <kwrah@bird.institute>', 
       'to': to, 
       'subject': subject, 
       'html': body
   };

  let transporter = nodemailer.createTransport(smtpConfig);

  if( 'simulate 'in APPconfig.smtp || APPconfig.smtp.simulate ) {
    console.log(to,subject,body);
    console.log('Mail send simulated...');
  } else {
     transporter.sendMail(mailOptions, (error, info) => {
       if (error) {
          console.log(error);
       }
      console.log('Message ' + info.messageId + ' sent: ' + info.response);
    });
  }
};
