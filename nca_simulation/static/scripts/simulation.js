import { NCASimulation } from './engine.js';
import { drawSimulation } from './draw.js';
import { SENSOR_TYPES, ACTION_TYPES } from './neuron_types.js';

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

        this.inputCount = SENSOR_TYPES.length; //Number of sensor (e.g. am I close to wall)
        this.innerCount = 3; //Number of hidden nodes
        this.outputCount = ACTION_TYPES.length; //Number of actions (e.g. move right)

        this.generation = 0;
        this.tickCount = 0;
        this.lastSurvivalRate = 0;

        this.survivalZone = {
            x: Math.floor(this.gridWidth * 0.4),
            y: Math.floor(this.gridHeight * 0.4),
            w: Math.floor(this.gridWidth * 0.2),
            h: Math.floor(this.gridHeight * 0.2)
        };

        this.sim = new NCASimulation({
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            inputCount: this.inputCount,
            innerCount: this.innerCount,
            outputCount: this.outputCount,
            genomeLength: this.genomeLength,
            populationSize: this.populationSize
        });
    }

    tick() {
        this.sim.runTick();
        this.tickCount++;
        if (this.tickCount >= this.ticksPerGeneration) {
            this.evolve();
        }
    }

    evolve() {
        const survivors = this.sim.cells.filter(c => {
            const { x, y } = c.position;
            const sz = this.survivalZone;
            return c.alive && x >= sz.x && x < sz.x + sz.w && y >= sz.y && y < sz.y + sz.h;
        });

        this.lastSurvivalRate = (survivors.length / this.populationSize) * 100;

        const nextGen = [];
        while (nextGen.length < this.populationSize && survivors.length > 0) {
            const parent = survivors[Math.floor(Math.random() * survivors.length)];
            const child = parent.reproduce(0.01);
            child.position = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            nextGen.push(child);
        }

        this.sim.setPopulation(nextGen);
        this.tickCount = 0;
        this.generation++;
    }

    draw() {
        drawSimulation(this.sim, this.ctx, this.cellSize, this.survivalZone);
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
}


