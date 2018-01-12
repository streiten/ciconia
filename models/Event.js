var fs = require('fs');
APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var winston = require('winston');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;

var eventSchema = new Schema({
  timestamp: Date,
  animalId: { type : Number },
  hasStoryData : Boolean,
  lat: Number, 
  long: Number, 
  meta: Schema.Types.Mixed,
  created_at: { type : Date , default: Date.now()},
  updated_at: Date
});

// eventSchema.pre('update', function() {
//   this.update({},{ $set: { updated_at: new Date() } });
//   console.log(this._id);
// });

var Event = mongoose.model('Event', eventSchema);

module.exports = Event;