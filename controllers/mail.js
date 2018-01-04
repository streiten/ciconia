var fs = require('fs');
var APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var moment = require('moment');
var winston = require('winston');
var mustache = require('mustache');
const parseJson = require('parse-json');
const mjml = require('mjml');

const userModel = require('../models/User.js');
const animalModel = require('../models/Animal.js');
const eventModel = require('../models/Event.js');

const storyDataModel = require('../models/StoryData.js');

const storyController = require('./story.js');

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
    console.log('+++ Mail send simulated +++ ');
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
        }

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
        // find latest storydata for animal 
        storyDataModel.findOne({ animalId : animal.id }).sort({ 'timestamp': -1 }).then( lastStory => {
          // generat email markup

          var ts = moment(lastStory.timestamp).toISOString();
          console.log(animal.name, 'last storydata ts:', ts);

          story.generateStoryMarkup(ts, animal, 'Alex' ).then( htmlbody => {
            // find all active subscribers
            userModel.find({ active: true }).then(users => {
              // send each one the email
              users.forEach( user => {
                send('Bird Institute',user.email,'Krawh! News from '+ animal.name,htmlbody);
              });
            });
        });
      });
    });
  });
};

exports.sendSimStory = () => {

  // all active animals that have a start/feature date in the past
  animalModel.find({ "active": true , featureDateStart : { $lte : new Date() } } ).then( animals => { 
      
      // each animal 
      animals.forEach( animal => {

        // animalModel.findOne({ '_id': animal._id }).then((item)=>{
        //     item.simDayOffset = "asdasd";
        //     item.save();
        // });

        // get feature range startdate
        var eventdate = moment(animal.featureDateStart);
        
        eventdate.add(animal.simDayOffset,'day');
        
        winston.log('info','sending mail for ' + animal.name + ' on ' + eventdate.format('LL') + '...');        

        //now find the closest event 
        eventModel.findOne( { 'animalId' : animal.id , 'timestamp': { $gte : eventdate }}).sort({"timestamp" : 1}).then( closestEvent => {
          
          // if there is one, check if there is storyData
          if(closestEvent) {

            winston.log( 'info','closest event for ' + animal.name + ' is on ' + closestEvent.timestamp );        

            // find storydata for lastevent, if none avail. get it
            storyDataModel.findOne( { 'eventId' : closestEvent._id } ).then( story => {
              if(story) {

                storyController.generateStoryMarkup(moment(story.timestamp).toISOString(), animal, 'Alex' ).then( data => {

                // find all active subscribers
                userModel.find({ active: true }).then(users => {
                  
                  // send each one the email
                  users.forEach( user => {
                    send('Bird Institute',user.email,'Krawh! Simulated News from '+ animal.name +' day ' + animal.simDayOffset  ,data);
                  });

                });

                 // res.render('story', {
                 //    'body': data,
                 //    'state': eventdate.format('ll') + ' - Event: ' + moment(closestEvent.timestamp).format('llll') + '_id: ' + closestEvent._id ,
                 //    'prevStoryUrl' : '/story/' + animal.id + '/' + (dayoffset*1-1) ,
                 //    'nextStoryUrl' : '/story/' + animal.id + '/' + (dayoffset*1+1) 
                 //  });

                });
              
              } else {

                winston.log('info','No StoryData found for ' + animal.name + ' Bummer.');

                // exports.fetchStoryDataForEvent(closestEvent).then( all => {
                //   // do the mailing/markup building now
                // });
              }

            });

          } else {
            winston.log('info','sendSimStory: No event found for storybuilding.');
          }

        });


    });
  });

};

    

