//import * as d3 from "d3"; // if using modules

// Live Time Display


//Globa variables for our lovely globe. 
let currentZoom = 1;
let rotation = [0, 0];
let isDragging = false;
let lastPos = null;
let countrySelected = false;
let selectedCountryId = null;
let selectedClickLonLat = null;
const rotationSpeed = 0.2; // Degrees per frame
let targetRotation = [0, 0];
let targetScale = null;
let markerLonLat = null;
let lastScale = null;
let lastRotationState = null;

// Load and render the globe
let countries = [];
const svg = d3.select("#globe");
let projection = d3.geoOrthographic();
let path = d3.geoPath().projection(projection);


const maxZoom = 5 * (Math.min(svg.node().clientWidth, svg.node().clientHeight) / 2.2);
const minZoom = 0.5 * (Math.min(svg.node().clientWidth, svg.node().clientHeight) / 2.2);

function animate() {
  requestAnimationFrame(animate);


  if (!countrySelected && !isDragging) {
    const baseSpeed = 0.1;
    const scale = projection.scale();


    const zoomRatio = (scale - minZoom) / (maxZoom - minZoom); // 0 (zoomed out) → 1 (max zoom)
    const speedFactor = 1 - Math.min(Math.max(zoomRatio, 0), 1); // clamp between 0 and 1
    const adjustedSpeed = baseSpeed * speedFactor;

    targetRotation[0] -= adjustedSpeed;
    svg.selectAll("path.graticule").attr("d", path);
  }

  // Interpolate rotation
  rotation[0] += (targetRotation[0] - rotation[0]) * 0.50;
  rotation[1] += (targetRotation[1] - rotation[1]) * 0.50;

  projection.rotate(rotation);
  
  // Interpolate zoom
  if (targetScale !== null) {
    const desired = targetScale * Math.min(svg.node().clientWidth, svg.node().clientHeight) / 2.2;
    const current = projection.scale();
    const newScale = current + (desired - current) * 0.55;
    projection.scale(newScale);
  }

  const currentScale = projection.scale();
  const currentRotation = projection.rotate().slice();

  const rotationChanged = !lastRotationState || currentRotation.some((val, i) => Math.abs(val - lastRotationState[i]) > 0.1);
  const zoomChanged = !lastScale || Math.abs(currentScale - lastScale) > 0.1;

  if (rotationChanged || zoomChanged) {
    svg.selectAll("path.country").attr("d", path);
    svg.select("path.graticule").attr("d", path);
    svg.select(".ocean").attr("d", path);
    lastScale = currentScale;
    lastRotationState = currentRotation;
  }

  //Background color based on center longitude
  const centerLongitude = -projection.rotate()[0];
  setBackgroundByLongitude(centerLongitude);

  // Update the click marker position if it exists
  const marker = svg.select("#click-marker");
  if (markerLonLat && marker.style("display") !== "none") {
    const [x, y] = projection(markerLonLat);
    marker.attr("cx", x).attr("cy", y);
  }


  
  

}


const renderGlobe = () => {
  const container = document.getElementById("globe");
  const width = container.clientWidth;
  const height = container.clientHeight;

  
  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  projection
    .scale(currentZoom * Math.min(width, height) / 2.2)
    .translate([width / 2, height / 2])
    .clipAngle(90);

  path = d3.geoPath().projection(projection);

  const graticule = d3.geoGraticule();

  svg.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "ocean")
    .attr("d", path)
    .attr("fill", "#008891")          
    .attr("fill-opacity", 0.5); 

  svg.append("path")
    .datum(d3.geoGraticule10())
    .attr("class", "graticule")
    .attr("d", path)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5)
    .attr("fill", "none");
    
  

  svg.selectAll("path.country")
    .data(countries)
    .enter().append("path")
    .attr("class", "country")
    .attr("fill", "#87ceeb")
    .attr("stroke", "#555")
    .attr("d", path)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill", "#ffa07a");
      document.getElementById("country-name").textContent = d.properties.name || "Unknown";
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "#87ceeb");
      document.getElementById("country-name").textContent = "";
    })
    .on("click", function (event, d) {
      const clickedId = d.id;
      const [mouseX, mouseY] = d3.pointer(event);
      const [clickedLon, clickedLat] = projection.invert([mouseX, mouseY]);

      

      // Track what to refresh
      let refreshTime = false;
      let refreshWiki = false;
      let refreshHoliday = false;

      // Detect if same location
      const isSameLocation = selectedClickLonLat &&
        Math.abs(clickedLon - selectedClickLonLat[0]) < 1 &&
        Math.abs(clickedLat - selectedClickLonLat[1]) < 1;

      // Reset case
      if (selectedCountryId === clickedId && isSameLocation) {
        autoRotate = true;
        countrySelected = false;
        selectedCountryId = null;
        selectedClickLonLat = null;
        markerLonLat = null;
        d3.selectAll(".country").classed("selected-country", false);
        svg.select("#click-marker").style("display", "none");
        return;
      }

      // Same country, different location → refresh time only
      if (selectedCountryId === clickedId && !isSameLocation) {
        refreshTime = true;
      } else {
        // New country → refresh everything
        refreshTime = refreshWiki = refreshHoliday = true;
      }

      // Update state
      autoRotate = false;
      countrySelected = true;
      selectedCountryId = clickedId;
      selectedClickLonLat = [clickedLon, clickedLat];
      markerLonLat = [clickedLon, clickedLat];

      // Set marker
      svg.select("#click-marker").style("display", "block");

      // Focus view
      targetRotation[0] = -clickedLon;
      targetRotation[1] = -clickedLat;

      // Highlight selection
      d3.selectAll(".country").classed("selected-country", false);
      d3.select(this).classed("selected-country", true);

      // Show UI loading
      if (refreshHoliday) { //Country changed
        document.getElementById("flag-img").classList.remove("show");
        document.getElementById("country-label").opacity = 0;
        document.getElementById("wiki-content").textContent = "Loading...";
        document.getElementById("holiday-content").textContent = "Loading...";
      }
      if (refreshTime) {
        document.getElementById("user-time").textContent = "--:--";
        document.getElementById("local-time").textContent = "Loading...";
        document.getElementById("time-diff").textContent = "";
      }


      const countryCode = d.id;

      // Fetch flag/country only if country changed (using refreshHoliday flag)
      if (refreshHoliday){
        fetch("/world_dashboard/country/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: countryCode })
        })
          .then(res => res.json())
          .then(countryInfo => {
            if (countryInfo?.alpha2) {
              const flagImg = document.getElementById("flag-img");
              const flagBlock = document.getElementById("flag-block");
              flagBlock.classList.remove("show");

              flagImg.onload = () => {
                flagImg.classList.add("show");
                flagBlock.classList.add("show");
              };

              flagImg.src = "";
              flagImg.src = `https://flagcdn.com/w80/${countryInfo.alpha2.toLowerCase()}.png`;
              flagImg.alt = `${countryInfo.name} flag`;
              document.getElementById("country-label").textContent = countryInfo.name;
            }
          })
        };
      // 🌍 Refresh only if flagged
      if (refreshTime) {
        fetch("/world_dashboard/country/time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: clickedLat, lon: clickedLon })
        })
          .then(res => res.json())
          .then(data => {
            const now = new Date();
            const userTime = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
            const localTime = data.local_time || "--:--";
            const userOffset = -now.getTimezoneOffset() / 60;
            const localOffset = data.offset_hours;
            let diff = userOffset - localOffset;
            let absDiff = Math.abs(diff);
            let diffHours = Math.floor(absDiff);
            let diffMinutes = Math.round((absDiff - diffHours) * 60);
            if (diffMinutes === 60) { diffMinutes = 0; diffHours += 1; }

            let relation = "Same time zone";
            if (diff !== 0) {
              const direction = diff > 0 ? "ahead" : "behind";
              const hourPart = diffHours ? `${diffHours} hour${diffHours !== 1 ? "s" : ""}` : "";
              const minutePart = diffMinutes ? `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}` : "";
              const joiner = hourPart && minutePart ? " and " : "";
              relation = `You are ${direction} by ${hourPart}${joiner}${minutePart}`;
            }

            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const localTimeZone = data.timezone || "Unknown";
            document.getElementById("user-time").textContent = `Your time: ${userTime} (${userTimeZone})`;
            document.getElementById("local-time").textContent = `Local time: ${localTime} (${localTimeZone})`;
            document.getElementById("time-diff").textContent = relation;
          });
      }

      if (refreshHoliday) {
        fetch("/world_dashboard/country/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: countryCode })
        })
          .then(res => res.json())
          .then(holidays => {
            const container = document.getElementById("holiday-content");
            container.innerHTML = "";
            const todayStr = new Date().toISOString().split("T")[0];
            let todayInserted = false;

            holidays.forEach(h => {
              if (!todayInserted && todayStr < h.date) {
                const todayDiv = document.createElement("div");
                todayDiv.textContent = ` ${todayStr}     ── Today ──`;
                todayDiv.style.color = "#666";
                todayDiv.style.fontStyle = "italic";
                container.appendChild(todayDiv);
                todayInserted = true;
              }

              const div = document.createElement("div");
              div.textContent = `${h.date}: ${h.name}`;
              if (h.date === todayStr) {
                div.style.color = "#e63946";
                div.style.fontWeight = "bold";
                div.textContent += " ← Today";
                todayInserted = true;
              }

              container.appendChild(div);
            });

            if (!holidays.length) {
              container.textContent = "No holiday data found.";
            }
          });
      }

      if (refreshWiki) {
        fetch("/world_dashboard/country/wiki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: countryCode })
        })
          .then(res => res.json())
          .then(data => {
            const container = document.getElementById("wiki-content");
            container.innerHTML = "";

            if (data.error) {
              container.textContent = "No Wikipedia data found.";
              return;
            }

            const text = document.createElement("p");
            text.textContent = data.extract;

            const link = document.createElement("a");
            link.href = data.url;
            link.textContent = "Read more on Wikipedia";
            link.target = "_blank";

            container.appendChild(text);
            container.appendChild(link);
          });
      }
    });

  //Marker for user click
  svg.append("circle") 
    .attr("id", "click-marker")
    .attr("r", 5)
    .attr("fill", "#e63946")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("display", "none")
    .style("pointer-events", "none"); // 👈 This mother f*cker swallows pointer event which prevents reset.
}; //End of renderGlobe function

const enableDrag = () => {
  svg
    .call(
      d3.drag()
        .on("start", (event) => {
          isDragging = true;
          lastPos = [event.x, event.y];
        })
        .on("drag", (event) => {
          if (!isDragging) return;
          const dx = event.x - lastPos[0];
          const dy = event.y - lastPos[1];
          targetRotation[0] += dx * 0.1;
          targetRotation[1] -= dy * 0.1;
          targetRotation[1] = Math.max(-90, Math.min(90, targetRotation[1]));
          lastPos = [event.x, event.y];
        })
        .on("end", () => {
          isDragging = false;
        })
    );
};

const enableZoom = () => {
  const zoom = d3.zoom()
    .scaleExtent([0.5, 12])
    .on("zoom", (event) => {
      targetScale = event.transform.k;
    });

  svg.call(zoom);
};


// Logic for resizable divider
const resizer = document.getElementById("resizer");
const leftPane = document.getElementById("map-container");
const rightPane = document.getElementById("info-section");

let isResizing = false;

resizer.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "ew-resize";
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const offsetRight = document.body.offsetWidth - e.clientX;
  const minRight = 400;
  rightPane.style.width = `${Math.max(offsetRight, minRight)}px`;
});

document.addEventListener("mouseup", () => {
  isResizing = false;
  document.body.style.cursor = "";
});

//Load the map and enable drag and zoom
d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(worldData => {
  countries = topojson.feature(worldData, worldData.objects.countries).features;
  renderGlobe();
  enableDrag();
  enableZoom();
  window.addEventListener("resize", () => {
    //renderGlobe();
    enableDrag();
    enableZoom();
  });
});

if (window.innerWidth <= 768) {
  const infoSection = document.getElementById('info-section');
  const mapContainer = document.getElementById('map-container');

  let lastScrollTop = 0;
  let expanded = false;

  infoSection.addEventListener('scroll', () => {
    const scrollTop = infoSection.scrollTop;
    const countryNameEl = document.getElementById("country-name");
    if (!expanded && scrollTop > lastScrollTop + 10) {
      // (thumb swipes up) → EXPAND info
      infoSection.style.height = '100vh';
      mapContainer.style.height = '0vh'; // hide map when fully expanded

      expanded = true;
      //Make the country name (on the globe) disappear for mobile users
      countryNameEl.style.opacity = "0";
      countryNameEl.style.pointerEvents = "none";

    } else if (expanded && scrollTop === 0) {
      // (thumb swipes down) COLLAPSE info
      infoSection.style.height = '20vh';
      mapContainer.style.height = '80vh';
      expanded = false;
      //Make the country name (on the globe) appear for mobile users
      countryNameEl.style.opacity = "1";
      countryNameEl.style.pointerEvents = "auto";
    }

    lastScrollTop = scrollTop;
  });
}

function interpolateColor(hex1, hex2, t) {
  const c1 = parseInt(hex1.slice(1), 16);
  const c2 = parseInt(hex2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getGradientForHour(hour) {
  const stops = [
    { h: 0, top: "#0b0c2a", bottom: "#000814" },  // Midnight
    { h: 6, top: "#ffb347", bottom: "#ffe4b5" },  // Sunrise
    { h: 9, top: "#87ceeb", bottom: "#e0f7ff" },  // Morning
    { h: 12, top: "#00bfff", bottom: "#ffffff" },  // Noon
    { h: 16, top: "#ff7e5f", bottom: "#feb47b" },  // Sunset
    { h: 19, top: "#2c3e50", bottom: "#34495e" },  // Dusk
    { h: 22, top: "#1a1a40", bottom: "#0b0c2a" },  // Night
    { h: 24, top: "#0b0c2a", bottom: "#000814" },  // Wrap-around to midnight
  ];

  // Find two surrounding stops
  let i = 0;
  while (i < stops.length - 1 && hour >= stops[i + 1].h) i++;

  const t = (hour - stops[i].h) / (stops[i + 1].h - stops[i].h);
  const top = interpolateColor(stops[i].top, stops[i + 1].top, t);
  const bottom = interpolateColor(stops[i].bottom, stops[i + 1].bottom, t);

  return `linear-gradient(to bottom, ${top}, ${bottom})`;
}

function setBackgroundByLongitude(longitude) {
  // Normalize longitude to -180 ~ 180
  const clamped = ((longitude + 180) % 360 + 360) % 360 - 180;

  // Approximate timezone offset
  const offset = Math.round(clamped / 15);
  const utcHour = new Date().getUTCHours();
  const localHour = (utcHour + offset + 24) % 24;

  const gradient = getGradientForHour(localHour);
  document.body.style.setProperty('--bg-gradient', gradient);
}

window.addEventListener("DOMContentLoaded", () => {
  const lon = -projection.rotate()[0];
  setBackgroundByLongitude(lon);

});

animate();