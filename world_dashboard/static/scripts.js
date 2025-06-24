// Live Time Display
setInterval(() => {
  const now = new Date();
  document.getElementById("time").textContent = now.toLocaleTimeString();
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
      fetch("/world-dashboard/country-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryCode })
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById("info-panel").innerHTML = `
          <h2>${data.country}</h2>
          <p>This is where info about the country will appear.</p>
        `;
      });
    });
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