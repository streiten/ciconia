var fs = require('fs');
APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var winston = require('winston');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;

var eventSchema = new Schema({
  timestamp: Date,
  // username: { type: String, required: true, unique: true },
  // password: { type: String, required: true },
  // admin: Boolean,
  // location: String,
  // meta: {
  //   age: Number,
  //   website: String
  // },
  created_at: Date,
  updated_at: Date
});

var Event = mongoose.model('Event', eventSchema);

module.exports = Event;