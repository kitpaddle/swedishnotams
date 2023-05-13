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

const overlayMaps = {
  "Airfield NOTAMs":  airportsLayer
}

// Create control with layerGroups
let panelLayers = new L.control.layers(baseMaps, overlayMaps);
// Add control AND layers to map
panelLayers.addTo(map);

/// FETCH DATA for airports
// Two different sources for express server with notams data
const replitURL = "https://notaminterpreter.kitpaddle.repl.co/notams";
const glitchURL = "https://tar-piquant-foe.glitch.me/notams";
const serverURL = "https://zenozyne.com/notams";

async function fetchData() {
  try {
    console.log("Fetching data");
    const response1 = await fetch(serverURL);
    const data1 = await response1.json();
    
    const response2 = await fetch("https://raw.githubusercontent.com/kitpaddle/hosting/main/swedishairports.json");
    const data2 = await response2.json();
    // Save data in local variables
    notamData = data1;
    airports = data2;
    
    console.log("Data Fetched successfully: "+notamData.length+" aerodromes received");
    // Sort NOTAM data so all notams are in chronologial order 
    notamData.forEach(notamgroup =>{

    })
                
    drawAirportsData(); // Call drawing of data onto map
    
    let now = new Date();
    let day = now.getDate();
    let month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let timeString = `${day} ${month} ${hours}:${minutes}`;
    document.getElementById('info').innerHTML = 'Swedish Notams Map - All published NOTAMs. <i>Last updated: '+timeString+'</i>';

  } catch (error) {
    console.log(error);
  }
}

// Call the function to fetch data
fetchData();

function drawAirportsData(){
  
  // Loop through the notams
  notamData.forEach((notamgroup) => {
    
    if (Array.isArray(notamgroup.notams)) {
      notamgroup.notams.sort((a, b) => new Date(a.from) - new Date(b.from));
    }
    
    let matchObj = airports.find( airport => notamgroup.icao == airport.ident);
    if (matchObj){
      notamgroup.position = [parseFloat(matchObj.latitude_deg), parseFloat(matchObj.longitude_deg)];
      notamgroup.type = matchObj.type
    }else{
      notamgroup.position = [61.2,19.9];
      notFound.push(notamgroup);
    }
    
    let html = "<style> div.leaflet-popup-content {width:auto !important;}</style>"; //Resize popup auto for grid/flex
    html += '<div class="tooltipcontainer">';
    html += '<div class="tooltipheader">';
    html += '<div><b>'+notamgroup.name + " (" + notamgroup.icao +")</b></div>";
    html += "<div>Nr of published NOTAMs: "+notamgroup.notams.length+"</div>";
    html += '</div>';
    html += '<div class="notamcontainer notamheader"><div class="item-id"><b>NOTAM ID</b></div><div class="item-from"><b>FROM:</b></div><div class="item-to"><b>TO:</b></div></div>';
    for(let i=0; i<notamgroup.notams.length;i++){
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
    }else{
      let inactiveMarker = L.circleMarker(notamgroup.position, {radius: 5, color: '#808080', fillColor: '#808080', fillOpacity: 0.4, opacity: 0.6} ).addTo(airportsLayer);
      inactiveMarker.bindTooltip(tthtml);
    }

  })
  airportsLayer.addTo(map); // Making the layer visible by default
  
  //let uniqueTypes = [...new Set(notamData.map(obj => obj.type))];
  //console.log(uniqueTypes);

}

/*
// prints coordinates to console for debugging
map.on('click', function(e) {
  console.log("Clicked at: " + e.latlng.lat + ", " + e.latlng.lng);
});
*/
