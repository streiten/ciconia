var fs = require('fs');
var winston = require('winston');
var moment = require('moment');

var mjml = require('mjml');

function Test() {
  
  APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  winston.level = 'debug';
  winston.log('info', 'Mail started...');




}


new Test();
