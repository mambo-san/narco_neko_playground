

export const TYPE_COLORS = {
    A: 0xff4d4d,
    B: 0x4dff4d,
    C: 0x4d4dff
};

export let TYPES = Object.keys(TYPE_COLORS);

export let rules = {
    A: { A: 0.2, B: -0.3, C: 0.01 },
    B: { A: -0.2, B: 0.2, C: 0.1 },
    C: { A: 0.3, B: 0, C: -0.1 }
};

export let populationDistribution = {
    A: 33,
    B: 33,
    C: 34,
};

export function setPopulationDistribution(type, value) {
    populationDistribution[type] = value;
}

export function getTextColor(bgHex) {
    const r = (bgHex >> 16) & 0xff;
    const g = (bgHex >> 8) & 0xff;
    const b = bgHex & 0xff;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 128 ? 'black' : 'white';
}




function describeInteraction(value, targetType) {
    if (value === 0) return '';

    const abs = Math.abs(value);
    const direction = value > 0 ? 'Attracted to' : 'Repelled by';

    const intensity =
        abs < 0.05 ? 'Slightly ' :
            abs < 0.2 ? '' :
                'Strongly ';

    return `- ${intensity}${direction} ${targetType} (${value.toFixed(2)})`;
}

function describeInteractionLike5yo(value, targetType) {
    if (value === 0) return '';

    const abs = Math.abs(value);
    let feeling = '';
    let toward = targetType;

    if (value > 0) {
        if (abs < 0.05) feeling = "kinda likes";
        else if (abs < 0.2) feeling = "likes";
        else feeling = "really likes";
    } else {
        if (abs < 0.05) feeling = "kinda avoids";
        else if (abs < 0.2) feeling = "avoids";
        else feeling = "really hates";
    }

    return `- ${feeling} ${toward}`;
}

export function generateRuleExplanation(rules, is5yo) {
    const lines = [];

    for (const fromType in rules) {
        lines.push(`<strong>${fromType} particles:</strong>`);
        for (const toType in rules[fromType]) {
            const value = rules[fromType][toType];
            if (is5yo) {
                lines.push(describeInteractionLike5yo(value, toType));
            } else {
                lines.push(describeInteraction(value, toType));
            }
        }
        lines.push(""); // blank line between blocks
    }

    return lines.join("\n");
}