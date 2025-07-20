import { NCASimulation } from '../sim/engine.js';
import { drawSimulation } from '../UI/draw.js';
import { SENSOR_TYPES, ACTION_TYPES } from '../model/neuron_types.js';


export const selectedCellIds = new Set();

export function toggleSelectedCellId(id) {
    if (selectedCellIds.has(id)) {
        selectedCellIds.delete(id);
    } else {
        selectedCellIds.add(id);
    }
}

export function clearSelectedCells() {
    selectedCellIds.clear();
}

export class Simulation {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = config.cellSize;

        this.gridWidth = config.gridWidth;
        this.gridHeight = config.gridHeight;
        this.genomeLength = config.genomeLength;
        this.innerCount = config.innerCount;
        this.mutationRate = config.mutationRate;
        this.populationSize = config.populationSize;
        this.ticksPerGeneration = config.ticksPerGeneration;
        this.spawnOutside = config.spawnOutside;
        this.zoneTemplate = config.zoneTemplate;
    
        this._paused = false;

        this.cachedGenerationStats = {
            generation: 0,
            survivors: 0,
            survivalRate: 0,
            geneticEntropy: 1.000
        };
        this.tickCount = 0;
        this.survivors = [];
        this.lastSurvivalRate = 0;

        this.survivalMask = createSurvivalMask(this.gridWidth, this.gridHeight, this.zoneTemplate);

        this.sim = new NCASimulation({
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            genomeLength: this.genomeLength,
            innerCount: this.innerCount,
            populationSize: this.populationSize,
            survivalMask: this.survivalMask,
            spawnOutside: this.spawnOutside
        });

        this.initialGenomeVariety = this.countUniqueSignatures(this.sim.cells);
    }

    tick() {
        this.sim.runTick();
        this.tickCount++;
        if (this.tickCount >= this.ticksPerGeneration) {
            this.survivors = this.sim.getSurvivors(this.survivalMask);
            this.lastSurvivalRate = (this.survivors.length / this.populationSize) * 100;

            const newSelectedIds = this.sim.evolve(
                       this.survivalMask, 
                       this.spawnOutside, 
                       this.survivors, 
                       Array.from(selectedCellIds),
                       this.mutationRate
            );

            // Gather stats to be displayed to users
            this.computeGenerationStats();
            
            this.tickCount = 0;
            clearSelectedCells();
            newSelectedIds.forEach(id => selectedCellIds.add(id));
        }
    }
    
    countUniqueSignatures(cells) {
        const unique = new Set();
        for (const cell of cells) {
            unique.add(cell.genome.abstractSignature());
        }
        return unique.size;
    }

    computeGenerationStats() {
        const currentUnique = this.countUniqueSignatures(this.sim.cells);
        const relativeDiversity = currentUnique / this.initialGenomeVariety;

        this.cachedGenerationStats.generation = this.cachedGenerationStats.generation + 1;
        this.cachedGenerationStats.survivors = this.survivors.length;
        this.cachedGenerationStats.survivalRate = parseFloat(this.lastSurvivalRate.toFixed(1));
        this.cachedGenerationStats.geneticEntropy = parseFloat(relativeDiversity.toFixed(3));
    }

    

    draw() {
        drawSimulation(this.sim, this.ctx, this.cellSize, this.survivalMask);
    }

    getCellAt(px, py) {
        const x = Math.floor(px / this.cellSize);
        const y = Math.floor(py / this.cellSize);
        return this.sim.cells.find(c => c.position.x === x && c.position.y === y && c.alive);
    }

    getRealtimeStats() {
        return {
            generation: this.generation,
            tick: this.tickCount
        };
    }

    setCellSize(newSize) {
        this.cellSize = newSize;
    }

    setPaused(p) {
        this._paused = p;
    }

    isPaused() {
        return this._paused;
    }
}


function createSurvivalMask(width, height, template = "edge") {
    const mask = Array.from({ length: height }, () => Array(width).fill(false));

    switch (template) {
        case "edge":
            applyEdgeMask(mask, width, height);
            break;
        case "corners":
            applyCornerMask(mask, width, height);
            break;
        case "center":
            applyCenterMask(mask, width, height);
            break;
        case "right":
            applyRightEdgeMask(mask, width, height);
            break;
        case "donut":
            applyDonutMask(mask, width, height);
            break;
    }

    return mask;
}

function applyEdgeMask(mask, width, height) {
    const marginX = Math.floor(width * 0.1);
    const marginY = Math.floor(height * 0.1);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            mask[y][x] = true;
        }
    }
    for (let y = marginY; y < height - marginY; y++) {
        for (let x = marginX; x < width - marginX; x++) {
            mask[y][x] = false;
        }
    }
}

function applyCornerMask(mask, width, height) {
    const cornerSizeX = Math.floor(width * 0.2);
    const cornerSizeY = Math.floor(height * 0.2);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const inCorner =
                (x < cornerSizeX && y < cornerSizeY) ||
                (x >= width - cornerSizeX && y < cornerSizeY) ||
                (x < cornerSizeX && y >= height - cornerSizeY) ||
                (x >= width - cornerSizeX && y >= height - cornerSizeY);
            if (inCorner) mask[y][x] = true;
        }
    }
}

function applyCenterMask(mask, width, height) {
    const centerW = Math.floor(width * 0.3);
    const centerH = Math.floor(height * 0.3);
    const startX = Math.floor((width - centerW) / 2);
    const startY = Math.floor((height - centerH) / 2);

    for (let y = startY; y < startY + centerH; y++) {
        for (let x = startX; x < startX + centerW; x++) {
            mask[y][x] = true;
        }
    }
}

function applyRightEdgeMask(mask, width, height) {
    const startX = Math.floor(width * 0.9); // rightmost 10%

    for (let y = 0; y < height; y++) {
        for (let x = startX; x < width; x++) {
            mask[y][x] = true;
        }
    }
}

function applyDonutMask(mask, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;

    const maxRadius = Math.min(width, height) * 0.3; // outer radius (~80% diameter)
    const minRadius = maxRadius * 0.5;               // inner radius (~40% of outer)

    for (let y = 1; y < height - 1; y++) { // avoid edges
        for (let x = 1; x < width - 1; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            mask[y][x] = dist >= minRadius && dist <= maxRadius;
        }
    }
}