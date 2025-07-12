
function scaleWeight(rawInt) {
    return (rawInt / 32767) * 5.0;
}

export class Genome {
    constructor(rawDNA) {
        this.rawDNA = rawDNA; // array of 8-char strings
        this.connections = this.decode();
    }

    decode() {
        return this.rawDNA.map(geneStr => {
            const bin = parseInt(geneStr, 16).toString(2).padStart(32, '0');

            const sourceType = parseInt(bin.slice(0, 4), 2);
            const sourceID = parseInt(bin.slice(4, 8), 2);
            const targetType = parseInt(bin.slice(8, 12), 2);
            const targetID = parseInt(bin.slice(12, 16), 2);
            const weightRaw = parseInt(bin.slice(16), 2);

            // Validate feedforward-only logic
            const validSource = sourceType === 0 || sourceType === 1; // IN or HID
            const validTarget = targetType === 0 || targetType === 1; // HID or OUT

            const isFromOUT = sourceType >= 2;
            const isToIN = targetType === 2;

            if (!validSource || !validTarget || isFromOUT || isToIN) {
                return null; // Invalid connection
            }

            return {
                source: { type: sourceType, id: sourceID },
                target: { type: targetType, id: targetID },
                weight: scaleWeight(weightRaw)
            };
        }).filter(conn => conn !== null);
    }

    // Later: add mutation, crossover, random generation
    cloneWithMutation(mutationRate) {
        const mutateHexChar = char => {
            if (Math.random() < mutationRate) {
                return Math.floor(Math.random() * 16).toString(16);
            }
            return char;
        };

        const mutated = this.rawDNA.map(gene =>
            gene.split('').map(mutateHexChar).join('')
        );

        return new Genome(mutated);
    }
  }
