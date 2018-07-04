process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

var fs = require('fs');
var querystring = require('querystring');
var winston = require('winston');
var moment = require('moment');
var later = require('later');
var auth = require('http-auth');

const path = require('path');
const express = require('express');

const nodemailer = require('nodemailer');
const compression = require('compression');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var pageController = require('./controllers/page.js');

var studiesController = require('./controllers/studies.js');
var animalController = require('./controllers/animal.js');
var storyController = require('./controllers/story.js');
var statusController = require('./controllers/status.js');
var scheduleController = require('./controllers/schedule.js');
var userController = require('./controllers/user.js');
var usersController = require('./controllers/users.js');
var mailController = require('./controllers/mail.js');

// scheduleController.init();

var httpport = 8888;

var basic = auth.basic({
    realm: "Backend",
    file:  "../users.htpasswd"
});

var authMiddleware = auth.connect(basic);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// app.use(compression());

app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));

// app.use(express.static('public'));
app.use('/static', express.static(path.join(__dirname, 'public')));

// public facing
app.get('/',pageController.home);

app.get('/user/confirm/:hash',userController.confirm);
app.get('/user/unsubscribe/:hash',userController.unsubscribe);


// Backend
app.use('/admin',authMiddleware);

app.get('/admin',statusController.index);
app.get('/admin/animals',statusController.index);
app.get('/admin/studies',studiesController.index);
app.get('/admin/studies/:id',studiesController.studyDetail);
app.get('/admin/story/:id/:day',storyController.index);
app.get('/admin/story/:id/',storyController.index);
app.get('/admin/animal/:id',animalController.index);
app.get('/admin/users/',usersController.index);

app.get('/admin/preview/optin',mailController.previewOptIn);
 
app.get('*',pageController.notfound);


// Websockets
io.on('connection', function (socket) {

  socket.on('activateIndividual', function (animal) {
    animalController.setIndividualStatus(true,animal.id,socket);
  });

  socket.on('deactivateIndividual', function (animal) {
    animalController.setIndividualStatus(false,animal.id,socket);
  });
  
  socket.on('getMapData', function (reqData) {
    animalController.getMapData(reqData,socket);
  });

  socket.on('updateStoryData', function (animal)  {
    storyController.fetchStoryData(animal.id,moment().subtract(5,'days'));
  });

  socket.on('updateLastEvent', function (animal)  {
    animalController.updateLastEvent(animal.id,socket);
  });

  socket.on('createUser', function (email)  {
    userController.create(email,socket);
  });

  socket.on('setUserStatus', function (data)  {
    userController.setUserStatus(data.email,data.status,socket);
  });

  socket.on('getUsers', function ()  {
    usersController.getUsers(socket);
  });

});
    
http.listen(httpport, function(){
  winston.log('info', 'Webserver listening on: ' + httpport);
});

function Ciconia() {
  winston.level = 'debug';
  winston.log('info', moment().format() + ' - Ciconia started...');
}

new Ciconia();