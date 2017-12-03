const fs = require('fs');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(APPconfig.mongodb.host,{  useMongoClient: true });

var Schema = mongoose.Schema;
var storyDataSchema = new Schema({
  timestamp: Date,
  animalId: Number,
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  type: String,
  json: Schema.Types.Mixed,
  created_at: { type : Date , default: Date.now()},
  updated_at: Date
});
var StoryData = mongoose.model('StoryData', storyDataSchema);

module.exports = StoryData;