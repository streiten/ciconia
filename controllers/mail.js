var fs = require('fs');
var APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var moment = require('moment');
var winston = require('winston');
var mustache = require('mustache');
const parseJson = require('parse-json');
const mjml = require('mjml');

const userModel = require('../models/User.js');
const animalModel = require('../models/Animal.js');

const storyController = require('./story.js');
const eventController = require('./event.js');


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

const send = (fromName,to,subject,body) => {
   
   let mailOptions = {
       'from': '"'+fromName+'" <kwrah@bird.institute>', 
       'to': to, 
       'subject': subject, 
       'html': body
   };

  let transporter = nodemailer.createTransport(smtpConfig);

  if( 'simulate 'in APPconfig.smtp || APPconfig.smtp.simulate ) {
    console.log('+++ Mail/SMTP send simulated +++ ');
    // console.log(to,subject,body);
    // console.log('+++ Mail send simulated +++ ');

  } else {
     transporter.sendMail(mailOptions, (error, info) => {
       if (error) {
          console.log(error);
       }
      console.log('Message ' + info.messageId + ' sent: ' + info.response);
    });
  }
};


exports.sendOptIn = (user) => {

        // assigned animal
        var data = {
          "animal" : { "name" : "Kerk" },
          "hash" : user.hash
        };

        var htmlbody = exports.generateOptInMailMarkup(data);
        send('Bird Institute',user.email,'Please confirm your subscription',htmlbody);

};


exports.generateOptInMailMarkup = ( data ) => {

        var tpl = fs.readFileSync('./views/mail/optIn.mjml', 'utf8');
        markup = mustache.render(tpl, data);
        
        var wraptpl = fs.readFileSync('./views/mail/template.mjml', 'utf8');
        view = { 'body' : markup };
        mjmlmail = mustache.render(wraptpl, view);

        try {
          const { html, errors } = mjml.mjml2html(mjmlmail, { beautify: true, minify: false, level: "soft" });

          if (errors) {
            console.log(errors.map(e => e.formattedMessage).join('\n'))
          }

          return html;

        } catch(e) {
          if (e.getMessages) {
            console.log(e.getMessages());
          } else {
            throw e;
          }
       }

};



exports.sendStory = () => {

  // all active animals
  animalModel.find( { 'active': true } ).then( animals => {
      // each animal 
      animals.forEach( animal => {

        // find closest event for animal 
        eventController.findClosest(animal.id,moment()).then( closestEvent => {

          storyController.generateStoryMarkup(closestEvent, animal ).then( template => {
    
            // find all active subscribers
            userModel.find({ active: true }).then(users => {

              // ToDo: Mustache in subscriber specific data like name und unsub

              // send each one the email
              users.forEach( user => {
                var unsubUrl = APPconfig.baseurl + 'user/unsubscribe/' + user.hash;
                view = { 'username' : user.email , 'unsubscribe' : unsubUrl };
                htmlbody = mustache.render(template, view);

                send('Bird Institute',user.email,'Krawh! News from '+ animal.name,htmlbody);
              });

            });
        });
      });
    });
  });
};

exports.sendSimStory = () => {

  // current date - start
  var simStartDate = moment(APPconfig.sim.start);
  var simDayOffset = moment().diff(simStartDate,'days');
  winston.log( 'info','+++ Send simulated migration story with days offset ' +  simDayOffset + ' +++' );

  // all active animals that have a start/feature date in the past
  animalModel.find({ "active": true , featureDateStart : { $lt : new Date() } } ).then( animals => { 
      
      // each animal 
      animals.forEach( animal => {

        // get feature range startdate
        var eventdate = moment(animal.featureDateStart);
        eventdate.add(simDayOffset,'day');
        
        //now find the closest event 
        eventController.findClosest(animal.id,eventdate).then( closestEvent => {
          
            // console.log('startdate ts:',moment(animal.featureDateStart));
            // console.log('enddate ts:',moment(animal.featureDateEnd));
            // console.log('event ts:',moment(closestEvent.timestamp));

            // is the event found within the feature range, otherwise skip the whole thing
            if(moment(closestEvent.timestamp).isBefore(moment(animal.featureDateEnd))) {
            
              winston.log( 'info','Closest event in DB for ' + animal.name + ' is on ' + closestEvent.timestamp );        
              winston.log('info','Sending mail for ' + animal.name + ' event on ' + eventdate.format('LL') + '...'); 

              // ToDo: Mustache in subscriber specific data like name und unsub

              storyController.generateStoryMarkup(closestEvent, animal ).then( template => {

              // find all active subscribers
              userModel.find({ active: true }).then(users => {
                
                // send each one the email
                users.forEach( user => {
                  
                  var unsubUrl = APPconfig.baseurl + 'user/unsubscribe/' + user.hash;
                  view = { 'username' : user.email , 'unsubscribe' : unsubUrl };
                  htmlbody = mustache.render(template, view);

                  send('Bird Institute',user.email,'Krawh!  +++ simulated +++ update from '+ animal.name +' for ' + eventdate.format('LL')  ,htmlbody);
                });

              });

              });
                                          
            } else {
              winston.log('info','For ' + animal.name + ' it is out of featured date range...');
            }

        });


    });
  });

};


/**
 * GET
 * Preview optin page.
 */
 
exports.previewOptIn = (req, res) => {

  var data = {
    "animal" : { "name" : "AnimalName" },
    "hash" : '[hash]'
  }
  
  res.render('mailpreview', {
    body: exports.generateOptInMailMarkup(data)
  });
};


    

