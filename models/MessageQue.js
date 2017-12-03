var fs = require('fs');
APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var winston = require('winston');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;

var mqSchema = new Schema({
  message: Schema.Types.Mixed,
  created_at: { type : Date , default: Date.now()},
  updated_at: Date
});

var Mq = mongoose.model('mq',mqSchema);

module.exports = Mq;