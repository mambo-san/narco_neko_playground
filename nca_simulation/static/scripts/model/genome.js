import { SENSOR_TYPES, ACTION_TYPES } from './neuron_types.js'; 

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

            let mutatedGene = null;

            const originalRawWeight = Math.floor(((gene.weight + 2.5) / 5.0) * 65535);

            const maxRetries = 10;
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                const mutatedSourceType = mutateField(gene.source.type, 1, mutationRate);
                const mutatedTargetType = mutateField(gene.target.type, 2, mutationRate);

                if (!isValidConnection(mutatedSourceType, mutatedTargetType)) continue;

                const sourceIDLimit =
                    mutatedSourceType === 0 ? SENSOR_TYPES.length - 1 :
                        mutatedSourceType === 1 ? this.innerCount - 1 : 0;

                const targetIDLimit =
                    mutatedTargetType === 2 ? ACTION_TYPES.length - 1 :
                        mutatedTargetType === 1 ? this.innerCount - 1 : 0;

                mutatedGene = {
                    sourceType: mutatedSourceType,
                    sourceID: mutateField(
                        Math.min(gene.source.id, sourceIDLimit),
                        sourceIDLimit,
                        mutationRate
                    ),
                    targetType: mutatedTargetType,
                    targetID: mutateField(
                        Math.min(gene.target.id, targetIDLimit),
                        targetIDLimit,
                        mutationRate
                    ),
                    weightRaw: mutateField(originalRawWeight, 65535, mutationRate)
                };

                break;
            }

            if (!mutatedGene) {
                return hex;
            }

            return encodeGene(mutatedGene);
        });

        return new Genome(mutated, this.innerCount);
    }

    abstractSignature() {
        const structureStrings = this.rawDNA.map(hex => {
            const g = decodeGene(hex);
            return [
                g.source.type.toString().padStart(2, '0'),
                g.source.id.toString().padStart(2, '0'),
                g.target.type.toString().padStart(2, '0'),
                g.target.id.toString().padStart(2, '0'),
            ].join('');
        });

        structureStrings.sort(); 
        return structureStrings.join('|');
    }
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