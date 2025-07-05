

export const TYPE_COLORS = {
    A: 0xff4d4d,
    B: 0x4dff4d,
    C: 0x4d4dff
};

export let TYPES = Object.keys(TYPE_COLORS);

export let rules = {
    A: { A: 0.1, B: 1, C: -0.1 },
    B: { A: -0.6, B: 0.20, C: 0.05 },
    C: { A: 0.1, B: 0.5, C: 0.5 }
};

export let populationDistribution = {
    A: 45,
    B: 30,
    C: 25,
};

export function setPopulationDistribution(type, value) {
    populationDistribution[type] = value;
}
