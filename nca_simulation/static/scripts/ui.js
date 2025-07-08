import { DEFAULT_CONFIG } from './defaults.js';
import { Simulation } from './simulation.js';
import { renderBrainGraph } from './UI/render_brain_graph.js';

export function initializeUI(canvas, onStart) {
    // Set defaults
    const entries = {
        gridWidth: DEFAULT_CONFIG.gridSize,
        populationSize: DEFAULT_CONFIG.populationSize,
        genomeLength: DEFAULT_CONFIG.genomeLength,
        ticksPerGeneration: DEFAULT_CONFIG.ticksPerGeneration
    };

    for (const [id, value] of Object.entries(entries)) {
        const input = document.getElementById(id);
        if (input) input.value = value;
    }
    
    // Wire start button
    const startBtn = document.getElementById('startBtn');
    startBtn.addEventListener('click', () => {
        const gridSize = parseInt(document.getElementById('gridWidth').value) || DEFAULT_CONFIG.gridSize;
        const populationSize = parseInt(document.getElementById('populationSize').value) || DEFAULT_CONFIG.populationSize;
        const genomeLength = parseInt(document.getElementById('genomeLength').value) || DEFAULT_CONFIG.genomeLength;
        const ticksPerGeneration = parseInt(document.getElementById('ticksPerGeneration').value) || DEFAULT_CONFIG.ticksPerGeneration;

        // Resize canvas square based on sim-container
        const availableWidth = container.clientWidth;
        const availableHeight = window.innerHeight; // or container.clientHeight if reliable

        const size = Math.min(availableWidth, availableHeight);

        // Make canvas square
        canvas.width = size;
        canvas.height = size;
        canvas.style.visibility = 'visible';

        const cellSize = Math.floor(size / gridSize); 

        const sim = new Simulation(canvas, {
            gridWidth: gridSize,
            gridHeight: gridSize,
            populationSize,
            genomeLength,
            cellSize,
            ticksPerGeneration
        });

        setUpCellClick({ canvas, simulation: sim });
        onStart(sim);
    });
}

function setUpCellClick({ canvas, simulation }) {
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();

        // Adjust click coordinates to canvas scale
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        const cell = simulation.getCellAt(x, y);
        if (cell) {
            renderBrainGraph(cell);
        } else {
            console.log('No cell found at this position.');
        }
    });
}

function setResponsiveCanvas(canvas) {
    const container = document.getElementById('sim-container');
    const size = Math.min(container.clientWidth, container.clientHeight);

    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
}

// Wrapper for event listener use
function resizeCanvasHandler() {
    const canvas = document.getElementById('sim-canvas');
    
    if (canvas) {
        setResponsiveCanvas(canvas);
    }
}


export function resizeSimulationCanvas(sim, canvas) {
    const container = document.getElementById('sim-container');
    const gridSize = sim.gridWidth;

    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;

    const cellSize = Math.floor(size / gridSize);
    sim.setCellSize(cellSize); 
}


window.addEventListener('load', resizeCanvasHandler);
window.addEventListener('resize', resizeCanvasHandler);
