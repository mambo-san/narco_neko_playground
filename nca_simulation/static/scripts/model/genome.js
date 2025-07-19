
function scaleWeight(rawInt) {
    return (rawInt / 32767) * 5.0;
}

export class Genome {
    constructor(rawDNA, innerCount) {
        this.rawDNA = rawDNA; // array of 8-char strings
        this.innerCount = innerCount;
    }

    decode() {
        return this.rawDNA.map(decodeGene);
    
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
                sourceType: mutateField(gene.source.type, 1, mutationRate),
                sourceID: mutateField(gene.source.id, 15, mutationRate),
                targetType: mutateField(gene.target.type, 2, mutationRate),
                targetID: mutateField(gene.target.id, 15, mutationRate),
                weightRaw: Math.floor((mutateField(gene.weight, 1, mutationRate) / 5.0) * 32767)
            };
            return encodeGene(mutatedGene);
        });

        return new Genome(mutated);
    }
  }

export function decodeGene(hex) {
    const bin = parseInt(hex, 16).toString(2).padStart(32, '0');
    return {
        source: {
            type: parseInt(bin.slice(0, 4), 2),
            id: parseInt(bin.slice(4, 8), 2)
        },
        target: {
            type: parseInt(bin.slice(8, 12), 2),
            id: parseInt(bin.slice(12, 16), 2)
        },
        weight: scaleWeight(parseInt(bin.slice(16), 2))
    };
}

export function encodeGene({ sourceType, sourceID, targetType, targetID, weightRaw }) {
    const bin =
        sourceType.toString(2).padStart(4, '0') +
        sourceID.toString(2).padStart(4, '0') +
        targetType.toString(2).padStart(4, '0') +
        targetID.toString(2).padStart(4, '0') +
        weightRaw.toString(2).padStart(16, '0');
    return parseInt(bin, 2).toString(16).padStart(8, '0');
}