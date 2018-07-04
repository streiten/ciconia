const fs = require('fs');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
var winston = require('winston');
var shortid = require('shortid');

var mongoose = require('mongoose');
var validate = require('mongoose-validator');

mongoose.Promise = global.Promise;
mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;


var emailValidator = [
  validate({
    validator: 'isEmail',
  })
]


var userSchema = new Schema({
  email: { type: String, required: true, validate: emailValidator  },
  active: { type: Boolean, default: false},
  frequency: { type: Number, default: 3},
  hash: { type: String, default: shortid.generate },
  onboarded:{ type: Boolean, default: false },
  subscribed:{ type: Boolean, default: false },
  tester:{ type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  confirmed_at: { type: Date },
  updated_at: Date
});

var User = mongoose.model('User', userSchema);

module.exports = User;


