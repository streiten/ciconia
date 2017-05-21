var fs = require('fs');
var winston = require('winston');
var WHSites = require('./whsites.js');
console.log(__dirname);
module.exports = envdata;

function envdata(){

    var whs = new WHSites(__dirname + '/data/whc-en.xml');

}

envdata.prototype.bar = function () {
  // // Nearest World Heritage Sites
  // var ns = whs.nearestSites(52.5200070,13.4049540,100000,10);
  // for (var i = ns.length - 1; i >= 0; i--) {
  //   console.log('WH Site: ' + ns[i].site);
  // }
};
