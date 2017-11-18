const fs = require('fs');
const Sequelize = require('sequelize');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const sequelize = new Sequelize(APPconfig.db.db, APPconfig.db.user, APPconfig.db.pass, {

  // disable logging; default: console.log
  logging: false

});

const Animal = sequelize.define('animal', {
  id: { type: Sequelize.INTEGER, primaryKey: true }, 
  studyId: Sequelize.INTEGER,
  name: Sequelize.STRING,
  lastEventAt: Sequelize.DATE,
  active: Sequelize.INTEGER,
  featureDateStart: Sequelize.DATE,
  featureDateEnd: Sequelize.DATE,
  featureRange: Sequelize.INTEGER
});


module.exports = Animal;
