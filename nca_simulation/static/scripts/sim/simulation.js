import { NCASimulation } from '../sim/engine.js';
import { drawSimulation } from '../UI/draw.js';
import { SENSOR_TYPES, ACTION_TYPES } from '../model/neuron_types.js';


export let selectedCellId = null;

export function setSelectedCellId(id) {
    selectedCellId = id;
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

        this.generation = 0;
        this.tickCount = 0;
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
    }

    tick() {
        this.sim.runTick();
        this.tickCount++;
        if (this.tickCount >= this.ticksPerGeneration) {
            const survivors = this.sim.getSurvivors(this.survivalMask);
            this.lastSurvivalRate = (survivors.length / this.populationSize) * 100;

            const newSelectedId = this.sim.evolve(this.survivalMask, this.spawnOutside, survivors, selectedCellId, this.mutationRate);
            
            this.tickCount = 0;
            this.generation++;
            if (selectedCellId && newSelectedId){
                setSelectedCellId(newSelectedId);
            }
        }
    }

    

    draw() {
        drawSimulation(this.sim, this.ctx, this.cellSize, this.survivalMask);
    }

    getCellAt(px, py) {
        const x = Math.floor(px / this.cellSize);
        const y = Math.floor(py / this.cellSize);
        return this.sim.cells.find(c => c.position.x === x && c.position.y === y && c.alive);
    }

    getStats() {
        return {
            generation: this.generation,
            tick: this.tickCount,
            survivors: this.sim.cells.filter(c => c.alive).length,
            survivalRate: this.lastSurvivalRate.toFixed(1)
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
            applyRightHalfMask(mask, width, height);
            break;
        case "custom":
            // leave as all false for now
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

function applyRightHalfMask(mask, width, height) {
    const mid = Math.floor(width / 2);
    for (let y = 0; y < height; y++) {
        for (let x = mid; x < width; x++) {
            mask[y][x] = true;
        }
    }
}