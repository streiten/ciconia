var fs = require('fs');
var movebank = require('./libs/movebank');

APPconfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var mb = new movebank();
mb.getTestData();

console.log(APPconfig.animals[0].name);

// getJSON(jsonUrl + "?callback=?", {
//     study_id: study_id,
//     individual_local_identifiers: individual_local_identifiers,
//     max_events_per_individual : max_events_per_individual,
//     // timestamp_start: timestamp_start, // !! enable to limit data display to a time range
//     // timestamp_end: timestamp_end, // !! enable to limit data display to a time range
//     sensor_type: "gps" // !! change if needed to specify the sensor type to display; options are gps, argos-doppler-shift, solar-geolocator, radio-transmitter, bird-ring, natural-mark
// }, function (data0) {
//     data = data0;
//     for (i = 0; i < data.individuals.length; i++) {
//         data.individuals[i].color = colors[i];
//     }
//     setBounds();
//     createMarkers();
//     createPolylines();
//     //createPolylines2();

//     startDate = null;
//     endDate = null;
//     for (i = 0; i < data.individuals.length; i++) {
//         for (j = 0; j < data.individuals[i].locations.length; j++) {
//             ts = data.individuals[i].locations[j].timestamp;
//             if (startDate != null) {
//                 startDate = Math.min(startDate, ts);
//                 endDate = Math.max(endDate, ts);
//             } else {
//                 startDate = ts;
//                 endDate = ts;
//             }
//         }
//     }
//   }
// }


function clearConsole() {
  process.stdout.write('\x1B[2J\x1B[0f');
}