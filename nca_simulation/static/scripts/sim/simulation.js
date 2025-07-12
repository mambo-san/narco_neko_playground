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
        this.populationSize = config.populationSize;
        this.ticksPerGeneration = config.ticksPerGeneration;
        this.spawnOutside = config.spawnOutside;
        this.zoneTemplate = config.zoneTemplate;

        this.inputCount = SENSOR_TYPES.length; //Number of sensor (e.g. am I close to wall)
        this.innerCount = 3; //Number of hidden nodes
        this.outputCount = ACTION_TYPES.length; //Number of actions (e.g. move right)

        this._paused = false;

        this.generation = 0;
        this.tickCount = 0;
        this.lastSurvivalRate = 0;

        this.survivalMask = createSurvivalMask(this.gridWidth, this.gridHeight, this.zoneTemplate);

        this.sim = new NCASimulation({
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            inputCount: this.inputCount,
            innerCount: this.innerCount,
            outputCount: this.outputCount,
            genomeLength: this.genomeLength,
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

            this.sim.evolve(this.survivalMask, this.spawnOutside, survivors);
            this.tickCount = 0;
            this.generation++;
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

    const marginX = Math.floor(width * 0.1);
    const marginY = Math.floor(height * 0.1);

    switch (template) {
        case "edge":
            // Everything is survival, carve out center
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
            break;

        case "corners":
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const inCorner =
                        (x < marginX && y < marginY) ||
                        (x >= width - marginX && y < marginY) ||
                        (x < marginX && y >= height - marginY) ||
                        (x >= width - marginX && y >= height - marginY);
                    if (inCorner) mask[y][x] = true;
                }
            }
            break;

        case "center":
            for (let y = marginY; y < height - marginY; y++) {
                for (let x = marginX; x < width - marginX; x++) {
                    mask[y][x] = true;
                }
            }
            break;

        case "right":
            for (let y = 0; y < height; y++) {
                for (let x = Math.floor(width / 2); x < width; x++) {
                    mask[y][x] = true;
                }
            }
            break;

        case "custom":
            // Placeholder: everything is dead for now
            // Will be editable by the user in future UI
            break;
    }

    return mask;
}