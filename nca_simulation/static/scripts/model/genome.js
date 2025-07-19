function scaleWeight(rawInt) {
    return ((rawInt / 32767) - 1) * 2.5; // output in [-2.5, +2.5]
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

            const mutatedSourceType = mutateField(gene.source.type, 1, mutationRate);
            const mutatedTargetType = mutateField(gene.target.type, 2, mutationRate);

            const originalRawWeight = Math.floor(((gene.weight + 2.5) / 5.0) * 65535);
            const mutatedRawWeight = mutateField(originalRawWeight, 65535, mutationRate);

            if (!isValidConnection(mutatedSourceType, mutatedTargetType)) {
                console.log('Invalid mutation detected, returning original gene:', hex);
                return hex;
            }

            const mutatedGene = {
                sourceType: mutatedSourceType,
                sourceID: mutateField(gene.source.id, 15, mutationRate),
                targetType: mutatedTargetType,
                targetID: mutateField(gene.target.id, 15, mutationRate),
                weightRaw: mutatedRawWeight
            };
            return encodeGene(mutatedGene);
        });

        return new Genome(mutated, this.innerCount);  
    };
}

export function isValidConnection(srcType, tgtType) {
    return !(srcType === 2 || tgtType === 0);
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