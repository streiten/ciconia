var winston = require('winston');
var fs = require('fs');
var parser = require('xml2json');
var jsonQuery = require('json-query');
var sphereKnn = require("sphere-knn");
var clone = require("clone");

module.exports = WHsites;

function WHsites(file){
  
  var WHxml = fs.readFileSync(file);
  this.sites = JSON.parse(parser.toJson(WHxml)).query.row;

}

WHsites.prototype.query = function (query){
    var querystr = '['+query+']';
    var result = jsonQuery(querystr, {
      data: this.sites
    }); 
    return result;
};


WHsites.prototype.nearestSites = function (lat,long,dist,count){
    
    var sites = clone(this.sites);

    // location needs to be removed due to incopatibilites with sphereKnn detecing it as lat/long falsly
    for (var i = this.sites.length - 1; i >= 0; i--) {
      delete sites[i].location;
    }
    var lookup = sphereKnn(sites);
    var result = lookup(lat, long, count, dist * 1000);
    return result;

};


  // XML Structure
  // <row>
  //   <category>Cultural</category>
  //   <criteria_txt>(i)(ii)(vi)</criteria_txt>
  //   <danger/>
  //   <date_inscribed>2016</date_inscribed>
  //   <extension>0</extension>
  //   <historical_description/>
  //   <http_url>http://whc.unesco.org/en/list/1321</http_url>
  //   <id_number>1321</id_number>
  //   <image_url>http://whc.unesco.org/uploads/sites/site_1321.jpg</image_url>
  //   <iso_code>ar,be,fr,de,in,jp,ch</iso_code>
  //   <justification/>
  //   <latitude>46.4684138889</latitude>
  //   <location/>
  //   <longitude>6.8293361111</longitude>
  //   <long_description/>
  //   <region>Latin America and the Caribbean</region>
  //   <revision>0</revision>
  //   <secondary_dates/>
  //   <short_description>&lt;p&gt;Chosen from the work of Le Corbusier, the 17 sites comprising this transnational serial property are spread over seven countries and are a testimonial to the invention of a new architectural language that made a break with the past. They were built over a period of a half-century, in the course of what Le Corbusier described as “patient research”. The Complexe du Capitole in Chandigarh (India), the National Museum of Western Art, Tokyo (Japan), the House of Dr Curutchet in La Plata (Argentina) and the Unité d’habitation in Marseille (France) reflect the solutions that the Modern Movement sought to apply during the 20th century to the challenges of inventing new architectural techniques to respond to the needs of society. These masterpieces of creative genius also attest to the internationalization of architectural practice across the planet.&lt;/p&gt;</short_description>
  //   <site>The Architectural Work of Le Corbusier, an Outstanding Contribution to the Modern Movement</site>
  //   <states>Argentina,Belgium,France,Germany,India,Japan,Switzerland</states>
  //   <transboundary>1</transboundary>
  //   <unique_number>2085</unique_number>
  // </row>