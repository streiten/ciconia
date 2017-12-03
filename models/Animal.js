const fs = require('fs');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;

var animalSchema = new Schema({
  id: Number,
  studyId: Number,
  name: String,
  active: Boolean,
  lastEventAt: Date,
  featureDateStart: Date,
  featureDateEnd: Date,
  featureRange: Number,
  migrationDateStart: Date,
  migrationDateEnd: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

var Animal = mongoose.model('Animal', animalSchema);
module.exports = Animal;




