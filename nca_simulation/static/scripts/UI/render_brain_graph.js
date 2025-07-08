// render_brain_graph.js using Cytoscape.js
import { SENSOR_TYPES, ACTION_TYPES } from '../neuron_types.js';
import { describeGenome } from '../cell.js'
//import cytoscape from 'https://cdn.jsdelivr.net/npm/cytoscape@3.24.0/dist/cytoscape.esm.min.js';

export function renderBrainGraph(cell) {
    const brain = cell.brain;
    const container = document.getElementById("nn-graph");
    if (!container) return;

    container.style.display = "block";
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
    };

    const inputCount = brain.inputCount;
    const hiddenCount = brain.innerCount;
    const outputCount = brain.outputCount;

    const usedNodes = new Set();
    for (const conn of brain.connections) {
        usedNodes.add(conn.from);
        usedNodes.add(conn.to);
    }

    const elements = [];

    // Nodes
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
        elements.push({
            data: {
                id: `${conn.from}->${conn.to}`,
                source: `${conn.from}`,
                target: `${conn.to}`,
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
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
}  


