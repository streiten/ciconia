var request = require('request');

module.exports = MoveBank;

function MoveBank(){
}

MoveBank.prototype.getTestData = function(){
request(APPconfig.APITestURL, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body);
  }
})
}

MoveBank.prototype.getLastAnimalEvent = function (){

}

MoveBank.prototype.getAllAnimalEvents = function (){

}