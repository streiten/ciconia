const fs = require('fs');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
var winston = require('winston');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;

var userSchema = new Schema({
  email: { type: String, required: true },
  active: Boolean,
  url: String,
  created_at: { type: Date, default: Date.now },
  updated_at: Date
});

var User = mongoose.model('User', userSchema);

module.exports = User;



