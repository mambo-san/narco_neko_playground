import { Genome } from './genome.js';
import { Brain } from './brain.js';

export class Cell {
    constructor({
        rawDNA,
        inputCount,
        innerCount,
        outputCount,
        position = { x: 0, y: 0 }
    }) {
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

