
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

    cloneWithMutation(mutationRate) {
        const mutateField = (value, max, rate) => {
            if (Math.random() < rate) {
                return Math.floor(Math.random() * (max + 1));
            }
            return value;
        };

        const mutated = this.rawDNA.map(hex => {
            const gene = decodeGene(hex);
            const mutatedGene = {
                sourceType: mutateField(gene.sourceType, 1, mutationRate),  // only allow IN (0) or HID (1)
                sourceID: mutateField(gene.sourceID, 15, mutationRate),
                targetType: mutateField(gene.targetType, 1, mutationRate),  // only allow HID (0) or OUT (1)
                targetID: mutateField(gene.targetID, 15, mutationRate),
                weightRaw: mutateField(gene.weightRaw, 65535, mutationRate)
            };
            return encodeGene(mutatedGene);
        });

        return new Genome(mutated);
    }
  }

function decodeGene(hex) {
    const bin = parseInt(hex, 16).toString(2).padStart(32, '0');
    return {
        sourceType: parseInt(bin.slice(0, 4), 2),
        sourceID: parseInt(bin.slice(4, 8), 2),
        targetType: parseInt(bin.slice(8, 12), 2),
        targetID: parseInt(bin.slice(12, 16), 2),
        weightRaw: parseInt(bin.slice(16), 2)
    };
}

function encodeGene({ sourceType, sourceID, targetType, targetID, weightRaw }) {
    const bin =
        sourceType.toString(2).padStart(4, '0') +
        sourceID.toString(2).padStart(4, '0') +
        targetType.toString(2).padStart(4, '0') +
        targetID.toString(2).padStart(4, '0') +
        weightRaw.toString(2).padStart(16, '0');
    return parseInt(bin, 2).toString(16).padStart(8, '0');
}