import { SENSOR_TYPES, ACTION_TYPES } from './neuron_types.js';

function tanh(x) {
    return Math.tanh(x);  // Native support in JS
}

export class Brain {
    constructor(genome, inputCount, innerCount, outputCount) {
        this.inputCount = inputCount;
        this.innerCount = innerCount;
        this.outputCount = outputCount;

        const totalNeurons = inputCount + innerCount + outputCount;
        this.neuronOutputs = new Array(totalNeurons).fill(0);
        this.connections = [];

        for (const gene of genome) {
            const fromOffset = (gene.source.type === 0) ? 0 : inputCount;
            const toOffset = (gene.target.type === 0) ? inputCount : inputCount + innerCount;

            const fromIndex = fromOffset + gene.source.id;
            const toIndex = toOffset + gene.target.id;

            if (fromIndex < totalNeurons && toIndex < totalNeurons) {
                this.connections.push({
                    from: fromIndex,
                    to: toIndex,
                    weight: gene.weight
                });
            }
        }
    }

    activate(inputs) {
        // Reset neuron outputs
        this.neuronOutputs.fill(0);

        // Set input values
        for (let i = 0; i < this.inputCount; i++) {
            this.neuronOutputs[i] = inputs[i] ?? 0;
        }

        // Apply connections
        for (const conn of this.connections) {
            this.neuronOutputs[conn.to] += this.neuronOutputs[conn.from] * conn.weight;
        }

        // Activate inner and output neurons
        const start = this.inputCount;
        const end = this.inputCount + this.innerCount + this.outputCount;
        for (let i = start; i < end; i++) {
            this.neuronOutputs[i] = tanh(this.neuronOutputs[i]);
        }

        // Return output neuron activations
        return this.neuronOutputs.slice(
            this.inputCount + this.innerCount,
            this.inputCount + this.innerCount + this.outputCount
        );
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