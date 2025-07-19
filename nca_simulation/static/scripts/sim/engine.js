import { Cell } from '../model/cell.js';
import { SENSOR_TYPES, ACTION_TYPES } from '../model/neuron_types.js';
import { encodeGene, decodeGene } from '../model/genome.js';

let nextCellId = 1;

// Use module-level INPUT_TYPE, HIDDEN_TYPE, OUTPUT_TYPE

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
        genomeLength,
        innerCount,
        populationSize,
        survivalMask,
        spawnOutside
    }) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.innerCount = innerCount;
        this.genomeLength = genomeLength;
        this.populationSize = populationSize;
        this.survivalMask = survivalMask;
        this.spawnOutside = spawnOutside;

        this.cells = [];
        this.generation = 0;

        this.spawnInitialPopulation();
    }

    randomDNA() {
        const used = new Set();
        const dna = [];

        while (dna.length < this.genomeLength) {
            const gene = this.randomGeneValid(used);
            
            if (gene) {
                dna.push(gene);
            }
        }

        return dna;
    }

    randomGeneValid(usedEdges) {
        const INPUT_TYPE = 0;
        const HIDDEN_TYPE = 1;
        const OUTPUT_TYPE = 2;

        let sourceType = Math.random();
        let sourceID;

        if (Math.random() < 0.5) {
            sourceType = INPUT_TYPE;
            sourceID = Math.floor(Math.random() * SENSOR_TYPES.length);
        } else {
            sourceType = HIDDEN_TYPE;
            sourceID = Math.floor(Math.random() * this.innerCount);
        }

        let targetType ;
        let targetID;

        if (Math.random() < 0.7) {
            targetType = HIDDEN_TYPE;
            targetID = Math.floor(Math.random() * this.innerCount);
        } else {
            targetType = OUTPUT_TYPE;
            targetID = Math.floor(Math.random() * ACTION_TYPES.length);
        }

        // Reject invalid paths (e.g. OUTPUT as source, SENSOR→SENSOR)
        if (sourceType === OUTPUT_TYPE || targetType === INPUT_TYPE) return null;

        const edgeKey = `${sourceType}-${sourceID}-${targetType}-${targetID}`;
        if (usedEdges.has(edgeKey)) return null;

        const weightRaw = Math.floor(Math.random() * 65536);
        usedEdges.add(edgeKey);
        
        return encodeGene({ sourceType, sourceID, targetType, targetID, weightRaw });
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
                innerCount: this.innerCount,
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
        cell.brain.connections
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
        cell.brain.connections
            .filter(conn => conn.target.type === 2) // OUT
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