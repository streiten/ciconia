const fs = require('fs');
const Sequelize = require('sequelize');
const APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const sequelize = new Sequelize(APPconfig.db.db, APPconfig.db.user, APPconfig.db.pass);

const Animal = sequelize.define('animal', {
  id: { type: Sequelize.INTEGER, primaryKey: true }, 
  studyId: Sequelize.INTEGER,
  name: Sequelize.STRING,
  active: Sequelize.INTEGER,
});

module.exports = Animal;
