// render_brain_graph.js using Cytoscape.js
import { SENSOR_TYPES, ACTION_TYPES } from '../model/neuron_types.js';
import { describeGenome } from '../model/cell.js'
import { selectedGenomes } from '../sim/simulation.js';

//import cytoscape from 'https://cdn.jsdelivr.net/npm/cytoscape@3.24.0/dist/cytoscape.esm.min.js';

let currentDrawContext = null;
//For throttling line redraws
let lastDrawTime = 0; 
const LINE_REDRAW_INTERVAL = 16; // ≈ 60fps

export function renderBrainGraph(cell, drawContext = null, options = {}) {
    if (drawContext) {
        currentDrawContext = drawContext;
    }
    if (!cell || !cell.genome) return;

    const sig = cell.genome.abstractSignature();
    const containerId = `nn-graph-${sig}`;
    let container = document.getElementById(containerId);

    // If already open → close it or remove it
    if (container) {
        if (options.updateOnly) {
            // Just redraw the connection line
            if (currentDrawContext) {
                drawConnectionLines(currentDrawContext.sim, currentDrawContext.canvas, currentDrawContext.cellSize);
            }
            return;
        } else {
            // This is a toggle request — close it
            container.remove();
            selectedGenomes.delete(sig);
            return;
        }
    }
    selectedGenomes.add(sig);
    // Create a new floating window container
    container = document.createElement("div");
    container.id = containerId;
    container.className = "nn-graph";

    // Position with slight offset based on ID
    const sidebar = document.getElementById('sidebar');
    const simContainer = document.getElementById('sim-canvas');

    const baseX = simContainer.offsetWidth + sidebar.offsetWidth;
    const baseY = 100;
    const offset = (cell.id % 10) * 20;

    container.style.left = `${baseX}px`;
    container.style.top = `${baseY + offset}px`;

    document.body.appendChild(container);

    container.style.display = "block";
    const { r, g, b } = cell.rgb;
    container.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    container.innerHTML = "";

    // Create header for floating window
    const header = document.createElement("div");
    header.id = "nn-header";
    header.innerHTML = `
        <span>Neural Network</span>
        <div>
            <button id="nn-toggle">View DNA as text</button>
            <button id="nn-close">✕</button>
        </div>
        `;
    container.appendChild(header);
    
    // Add cytoscape (graph) container
    const cyContainer = document.createElement("div");
    cyContainer.id = "cy-container";
    container.appendChild(cyContainer);
    // Add DNA decoder (text) container
    const textContainer = document.createElement("div");
    textContainer.id = "nn-text";
    textContainer.textContent = describeGenome(cell);

    container.appendChild(textContainer);
    //The toggle behavior 
    const toggleBtn = header.querySelector("#nn-toggle");
    toggleBtn.className = "nn-toggle-btn";
    toggleBtn.onclick = () => {
        const showingGraph = cyContainer.style.display !== "none";
        cyContainer.style.display = showingGraph ? "none" : "block";
        textContainer.style.display = showingGraph ? "block" : "none";
        toggleBtn.textContent = showingGraph ? "View DNA as graph" : "View DNA as text ";
    };

    // Close logic
    header.querySelector("#nn-close").onclick = () => {
        container.style.display = "none";
        container.remove();
        selectedGenomes.delete(sig);
    };
    
    const brain = cell.brain;
    const inputCount = brain.inputCount;
    const hiddenCount = brain.innerCount;

    const usedNodes = new Set();
    for (const conn of brain.connections) {
        usedNodes.add(brain.getNeuronIndex(conn.source.type, conn.source.id));
        usedNodes.add(brain.getNeuronIndex(conn.target.type, conn.target.id));
    }

    //Draw the Brain Graph
    const elements = [];

    Array.from(usedNodes).forEach(i => {
        let type = "hidden";
        let label = "";
        let short = "";

        if (i < inputCount) {
            type = "input";
            label = SENSOR_TYPES[i]?.name || `Input ${i}`;
            short = SENSOR_TYPES[i]?.shortName || `I${i}`;
        } else if (i >= inputCount + hiddenCount) {
            type = "output";
            const outIndex = i - inputCount - hiddenCount;
            label = ACTION_TYPES[outIndex]?.name || `Output ${outIndex}`;
            short = ACTION_TYPES[outIndex]?.shortName || `O${outIndex}`;
        } else {
            const hIndex = i - inputCount;
            label = `Hidden ${hIndex}`;
            short = `H${hIndex}`;
        }

        elements.push({
            data: {
                id: `${i}`,
                label: short,
                title: label,
                type
            }
        });
        
    });

    // Edges
    for (const conn of brain.connections) {
        const from = brain.getNeuronIndex(conn.source.type, conn.source.id);
        const to = brain.getNeuronIndex(conn.target.type, conn.target.id);
        if (typeof from !== 'number' || typeof to !== 'number') continue;

        elements.push({
            data: {
                id: `${from}->${to}`,
                source: `${from}`,
                target: `${to}`,
                weight: conn.weight.toFixed(2),
                label: conn.weight.toFixed(2)
            }
        });
    }

    const cy = cytoscape({
        container: cyContainer,
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': ele => {
                        const type = ele.data('type');
                        return type === 'input' ? '#1f77b4' : type === 'output' ? '#ff7f0e' : '#2ca02c';
                    },
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'color': '#fff',
                    'text-outline-width': 1,
                    'text-outline-color': '#000',
                    'width': 40,
                    'height': 40
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': ele => Math.max(1, Math.abs(ele.data('weight'))),
                    'line-color': '#aaa',
                    'target-arrow-color': '#aaa',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': 10,
                    'color': '#ddd',
                    'text-background-color': '#222',
                    'text-background-opacity': 0.6,
                    'text-background-padding': 2
                }
            }
        ],
        layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 20,
            spacingFactor: 1.3,
            animate: false,
            roots: elements.filter(e => e.data?.type === 'input').map(e => e.data.id)
        }
      });
    //Add tooltip
    cy.nodes().forEach(node => {
        node.qtip({
            content: node.data('title'),
            position: {
                my: 'top center',
                at: 'bottom center'
            },
            style: {
                classes: 'qtip-bootstrap',
                tip: {
                    width: 16,
                    height: 8
                }
            }
        });
      });

    // Make window draggable
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - container.offsetLeft;
        offsetY = e.clientY - container.offsetTop;
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        container.style.left = `${e.clientX - offsetX}px`;
        container.style.top = `${e.clientY - offsetY}px`;

        if (currentDrawContext) {
            tryDrawLinesThrottled(
                currentDrawContext.sim,
                currentDrawContext.canvas,
                currentDrawContext.cellSize
            );
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        //Need to re-render the graph to make cycontainer know the actual click positions
        const showingGraph = cyContainer.style.display !== "none";
        if (showingGraph){
            cyContainer.style.display = "none";
            cyContainer.style.display = "block";
        }       
    });
}  


export function drawConnectionLines(sim, canvas, cellSize) {
    const overlay = document.getElementById("connection-lines");
    const simCanvas = document.getElementById("sim-canvas");

    // Step 1: Match pixel dimensions
    overlay.width = simCanvas.width;
    overlay.height = simCanvas.height;

    // Step 2: Match on-screen size
    overlay.style.width = simCanvas.style.width;
    overlay.style.height = simCanvas.style.height;
    const ctx = overlay.getContext("2d");

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const canvasRect = canvas.getBoundingClientRect();

    for (const cell of sim.cells) {
        if (!cell.alive) continue;

        const sig = cell.genome.abstractSignature();
        if (!selectedGenomes.has(sig)) continue;

        const win = document.getElementById(`nn-graph-${sig}`);
        if (!win) continue;

        // Get screen position of the cell (center of cell in screen space)
        const cellX = (cell.position.x + 0.5) * cellSize;
        const cellY = (cell.position.y + 0.5) * cellSize;

        // Let top of the floating window
        const winRect = win.getBoundingClientRect();
        const winX = (winRect.left - canvasRect.left) + 15;
        const winY = (winRect.top - canvasRect.top) + 15;

        // Draw the connection line
        ctx.beginPath();
        ctx.moveTo(cellX, cellY);
        ctx.lineTo(winX, winY);
        const { r, g, b } = cell.rgb
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();


        // Optional: draw a square at the origin
        ctx.fillStyle = '#04df9b';
        ctx.fillRect(cellX - 2, cellY - 2, 4, 4);
    }
}

function tryDrawLinesThrottled(sim, canvas, cellSize) {
    const now = performance.now();
    if (now - lastDrawTime > LINE_REDRAW_INTERVAL) {
        drawConnectionLines(sim, canvas, cellSize);
        lastDrawTime = now;
    }
}