
import { getDefaultInteractionValue, normalizePopulation } from './utils.js';
import { onTypesChanged } from './change_notifier.js'

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


export function addType(engine) {
    if (TYPES.length >= 26) return;

    const used = new Set(TYPES);
    const nextChar = [...Array(26).keys()]
        .map(i => String.fromCharCode(65 + i))
        .find(c => !used.has(c));

    if (!nextChar) return alert("No available type name.");

    const randomColor = Math.floor(Math.random() * 0xffffff);

    TYPE_COLORS[nextChar] = randomColor;
    rules[nextChar] = {};

    TYPES.forEach(existing => {
        rules[existing][nextChar] = getDefaultInteractionValue();
        rules[nextChar][existing] = getDefaultInteractionValue();
    });
    rules[nextChar][nextChar] = getDefaultInteractionValue();

    TYPES.push(nextChar);
    populationDistribution[nextChar] = 1;
    normalizePopulation(populationDistribution);

    onTypesChanged(engine);
    engine.rebalance();
}

export function deleteType(engine, type) {
    if (TYPES.length <= 2) return;

    const snapshot = [...TYPES]; 

    delete rules[type];
    for (const t of snapshot) {
        if (rules[t]) delete rules[t][type];
    }

    delete TYPE_COLORS[type];
    delete populationDistribution[type];
    TYPES.splice(TYPES.indexOf(type), 1);

    normalizePopulation(populationDistribution);
    engine.reassignType(type);
    engine.rebalance();
    onTypesChanged(engine);
}