//import * as d3 from "d3"; // if using modules

// Live Time Display
setInterval(() => {
  const now = new Date();
  const userTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("user-time").textContent = "Your time: " + userTimeStr;
}, 1000);

//Store zoom level. Is there better way to do this?
let currentZoom = 1;
//Some rotation for the globe
let rotation = [0, 0];
let isDragging = false;
let lastPos = null;

let autoRotate = true;
const rotationSpeed = 0.1; // Degrees per frame
let targetRotation = [0, 0];
let targetScale = null;

// Load and render the globe
const svg = d3.select("#globe");
let projection = d3.geoOrthographic();
let path = d3.geoPath().projection(projection);
let countries = [];

function animate() {
  requestAnimationFrame(animate);

  if (autoRotate && !isDragging) {
    const baseSpeed = 0.1;
    const scale = projection.scale();
    const maxZoom = 5 * (Math.min(svg.node().clientWidth, svg.node().clientHeight) / 2.2);
    const minZoom = 0.5 * (Math.min(svg.node().clientWidth, svg.node().clientHeight) / 2.2);

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

  //Background color based on center longitude
  const centerLongitude = -projection.rotate()[0];
  setBackgroundByLongitude(centerLongitude);

  // Interpolate zoom
  if (targetScale !== null) {
    const desired = targetScale * Math.min(svg.node().clientWidth, svg.node().clientHeight) / 2.2;
    const current = projection.scale();
    const newScale = current + (desired - current) * 0.55;
    projection.scale(newScale);
  }

  // Redraw
  svg.selectAll("path.country").attr("d", path);
  svg.selectAll("path.graticule").attr("d", path);
}

  const renderGlobe = () => {
    const container = document.getElementById("globe");
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.selectAll("path").remove();// Clear previous render
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
        .datum(graticule())
        .attr("class", "graticule")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("d", path);

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
      //Stop auto-rotation
      autoRotate = false;
      //Focus on the clicked country and zoom in
      d3.selectAll(".country").classed("selected-country", false);
      d3.select(this).classed("selected-country", true);
      const [cx, cy] = d3.geoCentroid(d); // d is the clicked country’s GeoJSON
      targetRotation[0] = -cx;
      targetRotation[1] = -cy;
      targetScale = 2; 

      // Show loading
      document.getElementById("flag-img").classList.remove("show");
      document.getElementById("flag-img").opacity = 0;
      document.getElementById("country-label").opacity = 0;
      const wikiContent = document.getElementById("wiki-content");
      wikiContent.classList.remove("show");
      wikiContent.textContent = "Loading...";
      document.getElementById("holiday-content").textContent = "Loading...";
      document.getElementById("user-time").textContent = "--:--";
      document.getElementById("local-time").textContent = "Loading...";
      document.getElementById("time-diff").textContent = "";
      
      // Get input data to fetch country info
      const countryCode = d.id;
      const [mouseX, mouseY] = d3.pointer(event);
      const [lon, lat] = projection.invert([mouseX, mouseY]);

      fetch("/world_dashboard/country/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryCode })
      }).then(res => res.json())
        .then(countryInfo => {
          if (countryInfo?.alpha2) {
            const flagUrl = `https://flagcdn.com/w80/${countryInfo.alpha2.toLowerCase()}.png`;
            const flagImg = document.getElementById("flag-img");
            const flagBlock = document.getElementById("flag-block");
            flagBlock.classList.remove("show");
            

            flagImg.onload = () => {
              flagImg.classList.add("show");
              flagBlock.classList.add("show");
            };

            flagImg.src = ""; // force image refresh even if cached
            flagImg.src = flagUrl;
            flagImg.alt = `${countryInfo.name} flag`;

            document.getElementById("country-label").textContent = countryInfo.name;
          }
        })

      // Fetch time info
      fetch("/world_dashboard/country/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon })
      })
        .then(res => res.json())
        .then(data => {
          const now = new Date();
          const userTime = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
          const localTime = data.local_time || "--:--";
          const userOffset = -now.getTimezoneOffset() / 60;
          const localOffset = data.offset_hours;
          const diff = localOffset - userOffset;

          const relation = 
            diff > 0 ? 
              `You are ahead by ${diff} hour(s)` 
            : diff < 0 ? 
              `You are behind by ${Math.abs(diff)} hour(s)` 
            : `Same time zone`;

          const localHour = typeof data.local_hour === 'number'
            ? data.local_hour
            : parseInt((localTime || "0:00").split(":")[0], 10);

          document.getElementById("user-time").textContent = "Your time: " + userTime;
          document.getElementById("local-time").textContent = "Local time: " + localTime;
          document.getElementById("time-diff").textContent = relation;
          setBackgroundByTime(localHour);

        });

      // Fetch holidays
      fetch("/world_dashboard/country/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryCode })
      })
        .then(res => res.json())
        .then(holidays => {
          const container = document.getElementById("holiday-content");
          container.innerHTML = "";
          if (holidays.length > 0) {
            holidays.forEach(h => {
              const div = document.createElement("div");
              div.textContent = `${h.date}: ${h.name}`;
              container.appendChild(div);
            });
          } else {
            container.textContent = "No holiday data found.";
          }
        });

      // Fetch Wiki data (placeholder)
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

          const title = document.createElement("h4");
          title.textContent = data.title;

          const text = document.createElement("p");
          text.textContent = data.extract;

          const link = document.createElement("a");
          link.href = data.url;
          link.textContent = "Read more on Wikipedia";
          link.target = "_blank";

          container.appendChild(title);
          container.appendChild(text);
          container.appendChild(link);
        });
    })

    
  };

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
    .scaleExtent([0.5, 5])
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

    if (!expanded && scrollTop > lastScrollTop + 10) {
      // (thumb swipes up) → EXPAND info
      infoSection.style.height = '80vh';
      mapContainer.style.height = '20vh';
      expanded = true;
    } else if (expanded && scrollTop === 0) {
      // (thumb swipes down) COLLAPSE info
      infoSection.style.height = '20vh';
      mapContainer.style.height = '80vh';
      expanded = false;
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