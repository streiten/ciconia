var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var later = require('later');

const path = require('path');
const express = require('express');

const nodemailer = require('nodemailer');
const compression = require('compression');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var homeController = require('./controllers/home.js');
var studiesController = require('./controllers/studies.js');
var individualController = require('./controllers/individual.js');
var storyController = require('./controllers/story.js');
var statusController = require('./controllers/status.js');
var scheduleController = require('./controllers/schedule.js');
scheduleController.init();

var httpport = 888;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(express.static('public'));

app.get('/',homeController.index);
app.get('/status',statusController.index);
app.get('/studies',studiesController.index);
app.get('/studies/:id',studiesController.studyDetail);
app.get('/individual/:id',individualController.index);
app.get('/story/:id/',storyController.index);


// Websocket
io.on('connection', function (socket) {
  
  socket.on('getMapData', function (reqData) {
    individualController.getMapData(reqData,socket);
  });

  socket.on('updateStoryData', function (animal)  {
    storyController.fetchStoryData(animal.id,moment().subtract(1,'days'));
  });

  socket.on('updateLastEvent', function (animal)  {
    individualController.updateLastEvent(animal.id,socket);
  });

});
    
http.listen(httpport, function(){
  winston.log('info', 'Webserver started... on ' + httpport);
});


function Ciconia() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - Ciconia started...');
}

new Ciconia();
