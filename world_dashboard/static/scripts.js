//import * as d3 from "d3"; // if using modules

// Live Time Display
setInterval(() => {
  const now = new Date();
  const userTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("user-time").textContent = "Your time: " + userTimeStr;
}, 1000);

// When a country is selected, calculate time diff
function updateTimeInfo(countryOffset) {
  const now = new Date();
  const userOffset = now.getTimezoneOffset() / -60; // e.g. -360 => +6 hours
  const localHour = (now.getUTCHours() + countryOffset + 24) % 24;

  document.getElementById("local-time").textContent = `Local time: ${localHour}:${String(now.getMinutes()).padStart(2, '0')}`;

  const diff = countryOffset - userOffset;
  let relation = diff > 0 ? `You are ahead by ${diff} hour(s)` :
                diff < 0 ? `You are behind by ${Math.abs(diff)} hour(s)` :
                `Same time zone`;

  document.getElementById("time-diff").textContent = relation;
}

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

    targetRotation[0] += adjustedSpeed;
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
      const countryCode = d.id;
      const [mouseX, mouseY] = d3.pointer(event);
      const [lon, lat] = projection.invert([mouseX, mouseY]);

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
          const diff = data.offset_hours;
          const relation = diff == null ? "" :
            diff > 0 ? `You are ahead by ${diff} hour(s)` :
              diff < 0 ? `You are behind by ${Math.abs(diff)} hour(s)` :
                `Same time zone`;

          document.getElementById("user-time").textContent = "Your time: " + userTime;
          document.getElementById("local-time").textContent = "Local time: " + localTime;
          document.getElementById("time-diff").textContent = relation;
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

animate();