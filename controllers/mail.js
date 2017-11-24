var fs = require('fs');
var APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var moment = require('moment');
var winston = require('winston');
var mustache = require('mustache');
const parseJson = require('parse-json');
const mjml = require('mjml');

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
                send('Bird Institute',user.email,'Krawh! News from '+ animal.name,htmlbody);
              });
            });
        });
      });
    });
  });
};


