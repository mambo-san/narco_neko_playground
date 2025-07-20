// render_brain_graph.js using Cytoscape.js
import { SENSOR_TYPES, ACTION_TYPES } from '../model/neuron_types.js';
import { describeGenome } from '../model/cell.js'
import { toggleSelectedCellId, clearSelectedCells } from '../sim/simulation.js';
import { colorFromDNA } from './draw.js';
//import cytoscape from 'https://cdn.jsdelivr.net/npm/cytoscape@3.24.0/dist/cytoscape.esm.min.js';

export function renderBrainGraph(cell) {
    
    const containerId = `nn-graph-${cell.id}`;
    let container = document.getElementById(containerId);

    // If already open → close it
    if (container) {
        container.remove();
        toggleSelectedCellId(cell.id);
        return;
    }
    // Create a new floating window container
    container = document.createElement("div");
    container.id = containerId;
    container.className = "nn-graph"; // We'll define this class

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
    const { r, g, b } = colorFromDNA(cell.genome.rawDNA);
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
        clearSelectedCells();
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


