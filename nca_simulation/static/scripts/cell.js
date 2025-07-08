import { Genome } from './genome.js';
import { Brain } from './brain.js';
import { describeNeuron } from './brain.js';

export class Cell {
    constructor({
        id,
        rawDNA,
        inputCount,
        innerCount,
        outputCount,
        position = { x: 0, y: 0 }
    }) {
        this.id = id
        this.rawDNA = rawDNA
        this.genome = new Genome(rawDNA);
        this.brain = new Brain(this.genome.connections, inputCount, innerCount, outputCount);
        this.position = { ...position };
        this.age = 0;
        this.alive = true;
    }

    step(inputs) {
        if (!this.alive) return null;

        const outputs = this.brain.activate(inputs);
        this.age++;

        return outputs;
    }

    reproduce(mutationRate = 0.01) {
        const childDNA = this.genome.cloneWithMutation(mutationRate).rawDNA;

        return new Cell({
            rawDNA: childDNA,
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
    const rawDNA = cell.rawDNA ?? [];
    const decoded = new Genome(rawDNA).decode(); // decode manually
    const brain = cell.brain;
    const inputCount = brain.inputCount;
    const innerCount = brain.innerCount;
    const outputCount = brain.outputCount;

    const lines = [];

    lines.push(`Raw DNA:`);
    rawDNA.forEach((gene, i) => {
        lines.push(`  [${i}] ${gene}`);
      });

    lines.push(`\nDecoded DNA:`);

    decoded.forEach((conn, i) => {
        const fromIndex = (conn.source.type === 0) ? conn.source.id
            : inputCount + conn.source.id;
        const toIndex = (conn.target.type === 0) ? inputCount + conn.target.id
            : inputCount + innerCount + conn.target.id;

        const fromLabel = describeNeuron(fromIndex, brain);
        const toLabel = describeNeuron(toIndex, brain);
        lines.push(`  [${i}] ${fromLabel} --(${conn.weight.toFixed(2)})--> ${toLabel}`);
    });

    return lines.join("\n");
}