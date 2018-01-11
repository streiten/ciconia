const fs = require('fs');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
var winston = require('winston');
var shortid = require('shortid');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;

var userSchema = new Schema({
  email: { type: String, required: true },
  active: { type: Boolean, default: false},
  frequency: { type: Number, default: 3},
  hash: { type: String, default: shortid.generate },
  onboarded:{ type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: Date
});

var User = mongoose.model('User', userSchema);

module.exports = User;


