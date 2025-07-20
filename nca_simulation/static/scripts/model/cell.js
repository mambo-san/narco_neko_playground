import { Genome } from './genome.js';
import { Brain } from './brain.js';
import { decodeGene } from './genome.js';
import { SENSOR_TYPES, ACTION_TYPES } from './neuron_types.js';
import { colorFromAbstractDNA } from '../UI/draw.js';

export class Cell {
    constructor({
        id,
        rawDNA,
        innerCount,
        position = { x: 0, y: 0 }
    }) {
        this.id = id
        this.rawDNA = rawDNA
        this.genome = new Genome(rawDNA, innerCount);
        this.brain = new Brain(this.genome, innerCount);
        this.abstractSignature = this.genome.abstractSignature();
        this.rgb = colorFromAbstractDNA(this.abstractSignature);
        this.position = { ...position };
        this.age = 0;
        this.alive = true;
        this.ticksInSurvivalZone = 0;
    }

    step(inputs, isInSurvivalZone) {
        if (!this.alive) return null;

        if (isInSurvivalZone) {
            this.ticksInSurvivalZone++;
        }

        const outputs = this.brain.activate(inputs);
        this.age++;
        return outputs;
    }

    getFitness() {
        return this.ticksInSurvivalZone;
    }

    reproduce(mutationRate, new_id) {
        const mutatedGenome = this.genome.cloneWithMutation(mutationRate);

        return new Cell({
            id: new_id,
            rawDNA: mutatedGenome.rawDNA,
            inputCount: this.brain.inputCount,
            innerCount: this.brain.innerCount,
            outputCount: this.brain.outputCount,
            position: { x: this.position.x, y: this.position.y } // or random spawn
        });
    }

    kill() {
        this.alive = false;
    }

    
}

export function describeGenome(cell) {
    const raw = cell.genome.rawDNA;

    const hexLines = raw.map((hex, i) => `  [${i}] ${hex}`).join('\n');

    const decodedLines = raw.map((hex, i) => {
        const gene = decodeGene(hex);

        const from =
            gene.source.type === 0
                ? SENSOR_TYPES[gene.source.id]?.name ?? `Sensor(${gene.source.id})`
                : gene.source.type === 1
                    ? `Inner Neuron (${gene.source.id})`
                    : `Type ${gene.source.type} (${gene.source.id})`;

        const to =
            gene.target.type === 1
                ? `Inner Neuron (${gene.target.id})`
                : gene.target.type === 2
                    ? `Action (${ACTION_TYPES[gene.target.id]?.name ?? `#${gene.target.id}`})`
                    : `Type ${gene.target.type} (${gene.target.id})`;

        const w = gene.weight.toFixed(2);

        return `  [${i}] ${from} --(${w})--> ${to}`;
    }).join('\n');

    return `Raw DNA:\n${hexLines}\n\nDecoded DNA:\n${decodedLines}`;
}