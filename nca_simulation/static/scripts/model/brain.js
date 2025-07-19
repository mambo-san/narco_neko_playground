import { SENSOR_TYPES, ACTION_TYPES } from './neuron_types.js';
import { decodeGene } from './genome.js';

function tanh(x) {
    return Math.tanh(x);  // Native support in JS
}

export class Brain {
    constructor(genome) {
        // Precompute neuron count based on max seen index
        const maxInput = Math.max(...genome.rawDNA.map(decodeGene).map(g => g.source.type === 0 ? g.source.id : -1), 0);
        const maxOutput = Math.max(...genome.rawDNA.map(decodeGene).map(g => g.target.type === 1 ? g.target.id : -1), 0);

        this.inputCount = maxInput + 1;
        this.innerCount = genome.innerCount;
        this.outputCount = maxOutput + 1;

        this.totalNeurons = this.inputCount + this.innerCount + this.outputCount;
        this.neuronOutputs = new Array(this.totalNeurons).fill(0);
        this.connections = genome.rawDNA.map(decodeGene);
    }

    activate(inputs) {
        const totalSize = this.inputCount + this.innerCount + this.outputCount;
        const outputStart = this.inputCount + this.innerCount;

        // Step 1: Clear all neuron outputs
        this.neuronOutputs = new Array(totalSize).fill(0);

        // Step 2: Set input neuron values
        for (let i = 0; i < this.inputCount; i++) {
            this.neuronOutputs[i] = inputs[i] ?? 0;
        }

        // Step 3: Accumulate signals into hidden and output neurons
        for (const conn of this.connections) {
            const fromIndex = this.getNeuronIndex(conn.source.type, conn.source.id);
            const toIndex = this.getNeuronIndex(conn.target.type, conn.target.id);

            if (fromIndex === null || toIndex === null) continue;

            this.neuronOutputs[toIndex] += this.neuronOutputs[fromIndex] * conn.weight;
        }

        // Step 4: Activate hidden neurons (only these are recursive)
        for (let i = this.inputCount; i < outputStart; i++) {
            this.neuronOutputs[i] = tanh(this.neuronOutputs[i]);
        }

        // Step 5: Activate output neurons (final layer)
        for (let i = outputStart; i < totalSize; i++) {
            this.neuronOutputs[i] = tanh(this.neuronOutputs[i]);
        }

        // Step 6: Slice out only the output neuron values
        return this.neuronOutputs.slice(outputStart);
    }

    getNeuronIndex(type, id) {
        if (type === 0) return id; // Input
        if (type === 1) return this.inputCount + id; // Hidden
        if (type === 2) return this.inputCount + this.innerCount + id; // Output
        return null;
    }
}

export function describeNeuron(index, brain) {
    const { inputCount, innerCount, outputCount } = brain;

    if (index < inputCount) {
        const sensor = SENSOR_TYPES[index];
        return sensor ? `Sensor (${sensor.name})` : `IN (${index})`;
    }

    if (index < inputCount + innerCount) {
        const hiddenIndex = index - inputCount;
        return `Inner Neurons (${hiddenIndex})`;
    }

    const outputIndex = index - inputCount - innerCount;
    const action = ACTION_TYPES[outputIndex];
    return action ? `Action (${action.name})` : `OUT (${outputIndex})`;
}