// engine.js

import { Cell } from './cell.js';

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

    randomGene() {
        return [...Array(8)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    randomDNA() {
        return Array.from({ length: this.genomeLength }, () => this.randomGene());
    }

    spawnInitialPopulation() {
        this.cells = [];
        for (let i = 0; i < this.populationSize; i++) {
            const cell = new Cell({
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

            const dummyInputs = Array.from({ length: this.inputCount }).map(() => Math.random());
            const outputs = cell.step(dummyInputs);

            const actionProb = outputs.map(o => Math.max(0, o));
            const sum = actionProb.reduce((a, b) => a + b, 0);
            const probs = actionProb.map(p => (sum === 0 ? 0.25 : p / sum));

            const dir = sampleIndex(probs); // helper for weighted pick

            const deltas = [
                { x: 0, y: -1 }, // up
                { x: 1, y: 0 },  // right
                { x: 0, y: 1 },  // down
                { x: -1, y: 0 }  // left
            ];

            const targetX = cell.position.x + deltas[dir].x;
            const targetY = cell.position.y + deltas[dir].y;

            if (
                targetX >= 0 && targetX < this.gridWidth &&
                targetY >= 0 && targetY < this.gridHeight &&
                !occupied.has(`${targetX},${targetY}`)
            ) {
                occupied.delete(`${cell.position.x},${cell.position.y}`);
                cell.position.x = targetX;
                cell.position.y = targetY;
                occupied.add(`${targetX},${targetY}`);
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