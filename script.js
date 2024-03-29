// SIZE MAP AND INTERFACE TO WINDOW
let viewport_width = document.documentElement.clientWidth;
let viewport_height = document.documentElement.clientHeight;
document.getElementById('main').style.width = viewport_width+'px';
document.getElementById('main').style.height = viewport_height+'px';

// Add listener to resize when window resizes.
window.addEventListener('resize', function(event) {
  viewport_width = document.documentElement.clientWidth;
  viewport_height = document.documentElement.clientHeight;
  document.getElementById('main').style.width = viewport_width+'px';
  document.getElementById('main').style.height = viewport_height+'px';
}, true);

//// Global Variables

let airports;
let notamData;
let metarData;

let greyRadius = 5;
let notamRadius = 9;
let metarRadius = 12;

//// JS RELATED TO MAP / LEAFLET

//const startingPos =[59.651, 17.941]; //Starting at Arlanda
const startingPos = [62.59, 17.44];
const URL_OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const URL_WHITE = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png';
const URL_SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Creating MAP and baseMap Layer and adding them to the DIV
// So even if other layers take time to load map shows right away
const map = L.map('map', {
  center: startingPos,
  zoom: 5,
  attributionControl: false,
  renderer: L.canvas()
});

L.control.attribution({
  position: 'bottomleft'
}).addTo(map);

// Creating Basemaps
const baseMapGrey = new L.tileLayer(URL_WHITE, {
  attribution: '&copy; <a href="https://carto.com/">CartoDB</a> & <a href="https://www.openstreetmap.org/copyright">OSM</a> kitpaddle',
  minZoom: 5,
  updateWhenIdle: true,
  keepBuffer: 5,
  edgeBufferTiles: 2
}).addTo(map);
const baseMap = L.tileLayer(URL_OSM, {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kitpaddle',
  minZoom: 5,
  fillOpacity: 0.25
});
const baseMapSat = new L.tileLayer(URL_SAT, {
  attribution: '&copy; <a href="https://carto.com/">CartoDB</a> & <a href="https://www.openstreetmap.org/copyright">OSM</a>& <a href="https://www.esri.com/en-us/home">ESRI</a> kitpaddle',
  minZoom: 5,
  updateWhenIdle: true,
  keepBuffer: 5,
  edgeBufferTiles: 2
});
// Creating Layergroup for basemaps
const baseMaps = {
  "Detailed Map": baseMap,
  "Satellite": baseMapSat,
  "Base Map": baseMapGrey
};
// Creating layergroups for overlay and control
let airportsLayer = L.layerGroup();
let metarLayer = L.layerGroup();


const overlayMaps = {
  "Airfield NOTAMs":  airportsLayer,
  "METARs": metarLayer
}

// Create control with layerGroups
L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(map);
// Draw one layer always on top
map.on("overlayadd", function (event) {
	airportsLayer.eachLayer(function (l) {
      l.bringToFront();
  });
});

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Usage example
if (isMobileDevice()) {
  greyRadius = 10;
  notamRadius = 18;
  metarRadius = 21;
  console.log("You are on a mobile device (phone or tablet).");
} else {
  console.log("You are not on a mobile device (desktop or laptop).");
}

/// FETCH DATA for airports
// Two different sources for express server with notams data
const replitURL = "https://notaminterpreter.kitpaddle.repl.co/notams";
const replitMetarURL = "https://notaminterpreter.kitpaddle.repl.co/metars";
const glitchURL = "https://tar-piquant-foe.glitch.me/notams";
const serverURL = "https://zenozyne.ddns.net/notams";
const serverMetarURL = "https://zenozyne.ddns.net/metars";

async function fetchData() {
  try {
    console.log("Fetching data");
    const request1 = axios.get(serverURL);
    document.getElementById('stattime').innerHTML = 'Loading NOTAMS...';
    const request2 = axios.get("https://raw.githubusercontent.com/kitpaddle/hosting/main/swedishairports.json");
    document.getElementById('stattime').innerHTML = 'Loading NOTAMS...';
    const request3 = axios.get(serverMetarURL);
    
    // Wait for both requests to complete
    const responses = await Promise.all([request1, request2, request3]);

    // Both requests have completed successfully
    // Save data in local variables
    notamData = responses[0].data;
    airports = responses[1].data;
    metarData = responses[2].data;
    metarData.shift(); // Remove first item in array as it's not a METAR (should fix it in server-side)
	  
    console.log("Data Fetched successfully: "+notamData.length+" aerodromes received");
             
    drawMetarData();  
    drawAirportsData(); // Call drawing of data onto map
    
    
    let now = new Date();
    let day = now.getDate();
    let month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let timeString = `${day} ${month} ${hours}:${minutes}`;
    document.getElementById('stattime').innerHTML = 'Updated: '+timeString;

  } catch (error) {
    console.log(error);
  }
}

// Call the function to fetch data
fetchData();

function drawAirportsData(){
  let statactive = 0; //Local variable for statistics
  let nrofnotams = 0; //Local variables for statistics
  // Loop through the notams
  notamData.forEach((notamgroup) => {
    
    if (Array.isArray(notamgroup.notams)) {
      // Sort NOTAM data so all notams are in chronologial order 
      notamgroup.notams.sort((a, b) => new Date(a.from) - new Date(b.from));
    }
    
    let matchObj = airports.find( airport => notamgroup.icao == airport.ident);
    if (matchObj){
      notamgroup.position = [parseFloat(matchObj.latitude_deg), parseFloat(matchObj.longitude_deg)];
      notamgroup.type = matchObj.type
    }else{ //
      notamgroup.position = [0,0];
      //notFound.push(notamgroup);
    }
                      
    let html = "<style> div.leaflet-popup-content {width:auto !important;}</style>"; //Resize popup auto for grid/flex
    html += '<div class="tooltipcontainer">';
    html += '<div class="tooltipheader">';
    html += '<div><b>'+notamgroup.name + " (" + notamgroup.icao +")</b></div>";
    html += "<div>Nr of published NOTAMs: "+notamgroup.notams.length+"</div>";
    
    metarData.forEach( metar => {
      if (notamgroup.icao == metar.icao){
        html += '<div><b><br>METAR</b></div>';
        html += '<div>'+metar.metar+'</div>';
      }
    });
    
    html += '</div>';
    html += '<div class="notamcontainer notamheader"><div class="item-id"><b>NOTAM ID</b></div><div class="item-from"><b>FROM:</b></div><div class="item-to"><b>TO:</b></div></div>';
    for(let i=0; i<notamgroup.notams.length;i++){
      nrofnotams++;
      let statuscolor = "lightgrey";
      if(new Date(notamgroup.notams[i].from) < new Date()){ statuscolor = "#f9c666"}
      
      html += '<div class="notamcontainer">';
      html += '<div class="item-status" style="background-color:'+statuscolor+'; margin:1px 0;"></div>';
      html += '<div class="item-id"><b>'+notamgroup.notams[i].id + '</b></div>';
      html += '<div class="item-from"><b>' + notamgroup.notams[i].from + "</b></div>";
      html += '<div class="item-to"><b>' +notamgroup.notams[i].to +"</b></div>";
      html += '<div class="item-content">'+notamgroup.notams[i].content+'</div>';
      html += '</div>'
    }
    html += '</div>';
    
    
    let tthtml = '<div class="popupcontainer">';
    tthtml += '<div><b>'+notamgroup.name + " (" + notamgroup.icao +")</b></div>";
    if(notamgroup.notams == 'NIL'){
      tthtml += '<div>No published NOTAMs</div>';
    }else{
      tthtml += "<div>Nr of published NOTAMs: "+notamgroup.notams.length+"</div>";
      tthtml+='<div class="rowsmall">Click the aerodrome to see the NOTAMs</div>';
    }
    
    tthtml += '</div>';
    
    if(notamgroup.notams != 'NIL'){
      let activeMarker = L.circleMarker(notamgroup.position, {radius: 9, color: '#f9c666',fillColor: '#f9c666', fillOpacity: 0.3}).addTo(airportsLayer);
      activeMarker.bindTooltip(tthtml);
      activeMarker.bindPopup(html);
      statactive++;
    }else{
      let inactiveMarker = L.circleMarker(notamgroup.position, {radius: 5, color: '#808080', fillColor: '#808080', fillOpacity: 0.4, opacity: 0.6} ).addTo(airportsLayer);
      inactiveMarker.bindTooltip(tthtml);
    }

  })
  document.getElementById('statnotam').innerHTML = nrofnotams+' Notams';
  document.getElementById('statfield').innerHTML = statactive+'/180 airfields';
  airportsLayer.addTo(map); // Making the layer visible by default

  //let uniqueTypes = [...new Set(notamData.map(obj => obj.type))];
  //console.log(uniqueTypes);

}

function drawMetarData(){
  metarData.forEach( metar => {
    let matchObj = airports.find( airport => metar.icao == airport.ident);
    if (matchObj){
      metar.position = [parseFloat(matchObj.latitude_deg), parseFloat(matchObj.longitude_deg)];
    }
    
    let tthtml = '<div class="popupcontainer">';
    tthtml += '<div><b>'+metar.icao +"</b></div>";
    tthtml += "<div>METAR: "+metar.metar+"</div></div>";

    let activeMarker = L.circleMarker(metar.position, {radius: 12, color: '#3a9bdc',fillColor: '#3a9bdc', fillOpacity: 0.3}).addTo(metarLayer);
    //activeMarker.bindTooltip(html);
    activeMarker.bindPopup(tthtml);    
  })
}

/*
// prints coordinates to console for debugging
map.on('click', function(e) {
  console.log("Clicked at: " + e.latlng.lat + ", " + e.latlng.lng);
});
*/
/*
document.getElementById("myButton").addEventListener("click", myFunction);
}*/

