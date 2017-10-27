const fs = require('fs');
const Sequelize = require('sequelize');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const sequelize = new Sequelize(APPconfig.db.db, APPconfig.db.user, APPconfig.db.pass);

const StoryData = sequelize.define('storydata', {
  id: { type: Sequelize.INTEGER, primaryKey: true }, 
  eventId: Sequelize.INTEGER,
  individualId: Sequelize.INTEGER,
  type: Sequelize.STRING,
  title: Sequelize.TEXT,
  imgurl: Sequelize.TEXT,
  body: Sequelize.TEXT,
  link: Sequelize.TEXT,
  raw: Sequelize.TEXT
});



module.exports = StoryData;
