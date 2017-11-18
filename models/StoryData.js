const fs = require('fs');
const Sequelize = require('sequelize');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const sequelize = new Sequelize(APPconfig.db.db, APPconfig.db.user, APPconfig.db.pass, {

  // disable logging; default: console.log
  logging: false

});

const StoryData = sequelize.define('storydata', {
  id: { type: Sequelize.INTEGER, primaryKey: true , autoIncrement: true }, 
  timestamp: Sequelize.DATE,
  individualId: Sequelize.INTEGER,
  type: Sequelize.STRING,
  json: Sequelize.TEXT
});


module.exports = StoryData;
