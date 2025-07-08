import { Cell } from './cell.js';
import { SENSOR_TYPES, ACTION_TYPES } from './neuron_types.js';

let nextCellId = 1;

export function generateCellId() {
    return nextCellId++;
}

export function getGeneratedCellCount(){
    return nextCellId;
}

export class NCASimulation {
    constructor({
        gridWidth,
        gridHeight,
        inputCount,
        innerCount,
        outputCount,
        genomeLength,
        populationSize
    }) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.inputCount = inputCount;
        this.innerCount = innerCount;
        this.outputCount = outputCount;
        this.genomeLength = genomeLength;
        this.populationSize = populationSize;

        this.cells = [];
        this.generation = 0;

        this.spawnInitialPopulation();
    }

    randomGeneValid(inputCount, hiddenCount, outputCount) {
        // Valid source type: 0 (IN), 1 (HID)
        const sourceType = Math.random() < 0.5 ? 0 : 1;
        const sourceID = (sourceType === 0)
            ? Math.floor(Math.random() * inputCount)
            : Math.floor(Math.random() * hiddenCount);

        // Valid target type: 0 (HID), 1 (OUT)
        const targetType = Math.random() < 0.7 ? 0 : 1; // Bias toward HID
        const targetID = (targetType === 0)
            ? Math.floor(Math.random() * hiddenCount)
            : Math.floor(Math.random() * outputCount);

        const weightRaw = Math.floor(Math.random() * 65536); // Unsigned 16-bit

        // Build binary string
        const bin =
            sourceType.toString(2).padStart(4, '0') +
            sourceID.toString(2).padStart(4, '0') +
            targetType.toString(2).padStart(4, '0') +
            targetID.toString(2).padStart(4, '0') +
            weightRaw.toString(2).padStart(16, '0');

        return parseInt(bin, 2).toString(16).padStart(8, '0');
    }

    randomDNA() {
        return Array.from({ length: this.genomeLength }, () =>
            this.randomGeneValid(this.inputCount, this.innerCount, this.outputCount)
        );
    }

    spawnInitialPopulation() {
        this.cells = [];
        for (let i = 0; i < this.populationSize; i++) {
            const cell = new Cell({
                id: generateCellId(),
                rawDNA: this.randomDNA(),
                inputCount: this.inputCount,
                innerCount: this.innerCount,
                outputCount: this.outputCount,
                position: {
                    x: Math.floor(Math.random() * this.gridWidth),
                    y: Math.floor(Math.random() * this.gridHeight)
                }
            });
            this.cells.push(cell);
        }
    }

    runTick() {
        const occupied = new Set();
        for (const cell of this.cells) {
            if (!cell.alive) continue;
            occupied.add(`${cell.position.x},${cell.position.y}`);
        }

        for (const cell of this.cells) {
            if (!cell.alive) continue;

            // Gather sensory inputs
            const inputs = SENSOR_TYPES.map(sensor => {
                try {
                    return sensor.compute(cell, this);
                } catch {
                    return 0;
                }
            });

            const outputs = cell.step(inputs);

            // Apply softmax to outputs
            const exp = outputs.map(x => Math.exp(x));
            const sumExp = exp.reduce((a, b) => a + b, 0);
            const probs = sumExp > 0 ? exp.map(e => e / sumExp) : Array(outputs.length).fill(1 / outputs.length);

            // Optional threshold: only move if one output is significantly dominant
            const maxOutput = Math.max(...outputs);
            if (maxOutput < 0.3) continue; // no movement this tick

            const dir = sampleIndex(probs);
            const delta = ACTION_TYPES[dir]?.delta;
            if (!delta) continue;

            const targetX = cell.position.x + delta.x;
            const targetY = cell.position.y + delta.y;

            const isInBounds =
                targetX >= 0 && targetX < this.gridWidth &&
                targetY >= 0 && targetY < this.gridHeight;

            const key = `${targetX},${targetY}`;
            if (isInBounds && !occupied.has(key)) {
                occupied.delete(`${cell.position.x},${cell.position.y}`);
                cell.position.x = targetX;
                cell.position.y = targetY;
                occupied.add(key);
            }
        }
    }
    

    

    setPopulation(newCells) {
        this.cells = newCells;
    }

    nextGeneration() {
        return;
        const survivors = this.cells.filter(c => c.alive && this.isInSurvivalZone(c));
        const nextGen = [];

        while (nextGen.length < this.populationSize) {
            const parent = survivors[Math.floor(Math.random() * survivors.length)];
            const child = parent.reproduce(0.01); // 1% mutation rate
            child.position = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            nextGen.push(child);
        }

        this.cells = nextGen;
        this.tickCount = 0;
        this.generation++;
    }
}


function sampleIndex(probabilities) {
    const r = Math.random();
    let total = 0;
    for (let i = 0; i < probabilities.length; i++) {
        total += probabilities[i];
        if (r < total) return i;
    }
    return probabilities.length - 1;
}
