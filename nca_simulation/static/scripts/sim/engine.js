import { Cell } from '../model/cell.js';
import { SENSOR_TYPES, ACTION_TYPES } from '../model/neuron_types.js';

let nextCellId = 1;

export function generateCellId() {
    return nextCellId++;
}

export function getGeneratedCellCount() {
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
        populationSize,
        survivalMask,
        spawnOutside
    }) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.inputCount = inputCount;
        this.innerCount = innerCount;
        this.outputCount = outputCount;
        this.genomeLength = genomeLength;
        this.populationSize = populationSize;
        this.survivalMask = survivalMask;
        this.spawnOutside = spawnOutside;

        this.cells = [];
        this.generation = 0;

        this.spawnInitialPopulation();
    }

    randomGeneValid(inputCount, hiddenCount, outputCount) {
        const sourceType = Math.random() < 0.5 ? 0 : 1;
        const sourceID = (sourceType === 0)
            ? Math.floor(Math.random() * inputCount)
            : Math.floor(Math.random() * hiddenCount);

        const targetType = Math.random() < 0.7 ? 0 : 1;
        const targetID = (targetType === 0)
            ? Math.floor(Math.random() * hiddenCount)
            : Math.floor(Math.random() * outputCount);

        const weightRaw = Math.floor(Math.random() * 65536);

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
        const { survivalMask, spawnOutside } = this;

        for (let i = 0; i < this.populationSize; i++) {
            let position;
            while (true) {
                const x = Math.floor(Math.random() * this.gridWidth);
                const y = Math.floor(Math.random() * this.gridHeight);
                const inSurvival = survivalMask?.[y]?.[x];

                if ((spawnOutside && !inSurvival) || (!spawnOutside && inSurvival)) {
                    position = { x, y };
                    break;
                }
            }

            const cell = new Cell({
                id: generateCellId(),
                rawDNA: this.randomDNA(),
                inputCount: this.inputCount,
                innerCount: this.innerCount,
                outputCount: this.outputCount,
                position
            });

            this.cells.push(cell);
        }
    }

    getSurvivors(survivalMask) {
        return this.cells.filter(c => {
            const { x, y } = c.position;
            return c.alive && survivalMask?.[y]?.[x];
        });
    }

    evolve(survivalMask, spawnOutside, survivors, selectedCellId, mutationRate) {
        let newSelectedId = null;
        const nextGen = [];

        // Step 1: If selectedCell survived, force it to reproduce
        const selectedParent = survivors.find(c => c.id === selectedCellId);
        if (selectedParent) {
            const child = selectedParent.reproduce(mutationRate, generateCellId());
            let position;
            while (true) {
                const x = Math.floor(Math.random() * this.gridWidth);
                const y = Math.floor(Math.random() * this.gridHeight);
                const inSurvival = survivalMask?.[y]?.[x];
                if ((spawnOutside && !inSurvival) || (!spawnOutside && inSurvival)) {
                    position = { x, y };
                    break;
                }
            }
            child.position = position;
            newSelectedId = child.id;
            nextGen.push(child);
        }

        // Step 2: Fill in the rest of the population
        while (nextGen.length < this.populationSize && survivors.length > 0) {
            const parent = survivors[Math.floor(Math.random() * survivors.length)];
            const child = parent.reproduce(mutationRate, generateCellId());

            let position;
            while (true) {
                const x = Math.floor(Math.random() * this.gridWidth);
                const y = Math.floor(Math.random() * this.gridHeight);
                const inSurvival = survivalMask?.[y]?.[x];
                if ((spawnOutside && !inSurvival) || (!spawnOutside && inSurvival)) {
                    position = { x, y };
                    break;
                }
            }

            child.position = position;
            nextGen.push(child);
        }

        this.setPopulation(nextGen);
        this.generation++;

        return newSelectedId;
    }

    runTick() {
        const occupied = new Set();
        for (const cell of this.cells) {
            if (!cell.alive) continue;
            occupied.add(`${cell.position.x},${cell.position.y}`);
        }

        for (const cell of this.cells) {
            if (!cell.alive) continue;

            const inputs = computeUsedInputs(cell, this);
            const outputs = cell.step(inputs);
            if (!outputs) continue;


            const maxOutput = Math.max(...outputs);
            if (maxOutput < 0.3) continue;

            const activeActions = getActiveActions(cell, outputs);
            if (activeActions.length === 0) continue;

            const exp = activeActions.map(a => Math.exp(a.value));
            const sumExp = exp.reduce((a, b) => a + b, 0);
            const probs = exp.map(e => e / sumExp);

            const chosenIndex = sampleIndex(probs);
            const chosen = activeActions[chosenIndex];
            
            if (!chosen || !chosen.action || !chosen.action.delta) continue;

            const delta = chosen.action.delta;

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
            const child = parent.reproduce(0.01);
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

function computeUsedInputs(cell, sim) {
    const inputUsed = new Set(
        cell.genome.connections
            .filter(conn => conn.source.type === 0)
            .map(conn => conn.source.id)
    );

    return Array.from({ length: cell.brain.inputCount }, (_, i) => {
        if (!inputUsed.has(i)) return 0;
        const sensor = SENSOR_TYPES[i];
        if (!sensor) return 0;
        try {
            return sensor.compute(cell, sim);
        } catch {
            return 0;
        }
    });
}


function getActiveActions(cell, outputs) {
    const outputUsed = new Set(
        cell.genome.connections
            .filter(conn => conn.target.type === 1) // OUT
            .map(conn => conn.target.id)
    );

    const active = [];
    for (let i = 0; i < outputs.length; i++) {
        if (outputUsed.has(i) && ACTION_TYPES[i]) {
            active.push({ index: i, value: outputs[i], action: ACTION_TYPES[i] });
        }
    }

    return active;
}