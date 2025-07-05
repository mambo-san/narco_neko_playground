// utils.js

export function getTextColor(bgHex) {
    const r = (bgHex >> 16) & 0xff;
    const g = (bgHex >> 8) & 0xff;
    const b = bgHex & 0xff;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 128 ? 'black' : 'white';
}

export function normalizePopulation(populationDistribution) {
    let total = Object.values(populationDistribution).reduce((sum, v) => sum + v, 0);
    let diff = 100 - total;

    const adjustable = Object.entries(populationDistribution)
        .filter(([, val]) => (diff > 0 && val < 100) || (diff < 0 && val > 1));

    for (let i = 0; i < Math.abs(diff); i++) {
        const [type] = adjustable[Math.floor(Math.random() * adjustable.length)];
        populationDistribution[type] += Math.sign(diff);
    }
}

export function redistributePopulation(populationDistribution, changedType, newValue) {
    const allTypes = Object.keys(populationDistribution);
    const others = allTypes.filter(t => t !== changedType);

    const minEach = 1;
    const maxForChanged = 100 - (others.length * minEach);
    const clampedNewValue = Math.max(minEach, Math.min(maxForChanged, newValue));
    populationDistribution[changedType] = clampedNewValue;

    let remaining = 100 - clampedNewValue;
    let totalAvailable = others.reduce((sum, t) => sum + (populationDistribution[t] - minEach), 0);

    others.forEach(t => {
        let current = populationDistribution[t];
        let base = minEach;

        if (totalAvailable > 0) {
            let proportional = (current - minEach) / totalAvailable;
            base += Math.round(proportional * (remaining - (others.length * minEach)));
        }

        populationDistribution[t] = Math.max(minEach, base);
    });

    normalizePopulation(populationDistribution);
}

export function createCircleTexture(renderer, color, radius = 3) {
    const g = new PIXI.Graphics();
    g.beginFill(color);
    g.drawCircle(0, 0, radius);
    g.endFill();
    return renderer.generateTexture(g);
}

export function describeInteraction(value, targetType) {
    if (value === 0) return '';

    const abs = Math.abs(value);
    const direction = value > 0 ? 'Attracted to' : 'Repelled by';
    const intensity = abs < 0.05 ? 'Slightly ' : abs < 0.2 ? '' : 'Strongly ';

    return `- ${intensity}${direction} ${targetType} (${value.toFixed(2)})`;
}

export function describeInteractionLike5yo(value, targetType) {
    if (value === 0) return '';

    const abs = Math.abs(value);
    let feeling = '';

    if (value > 0) {
        feeling = abs < 0.05 ? "kinda likes" : abs < 0.2 ? "likes" : "really likes";
    } else {
        feeling = abs < 0.05 ? "kinda avoids" : abs < 0.2 ? "avoids" : "really hates";
    }

    return `- ${feeling} ${targetType}`;
}

export function generateRuleExplanation(rules, is5yo) {
    const lines = [];

    for (const fromType in rules) {
        lines.push(`<strong>${fromType} particles:</strong>`);
        for (const toType in rules[fromType]) {
            const value = rules[fromType][toType];
            const explanation = is5yo
                ? describeInteractionLike5yo(value, toType)
                : describeInteraction(value, toType);
            if (explanation) lines.push(explanation);
        }
        lines.push('');
    }

    return lines.join("\n");
}

export function createColorBox(type, TYPE_COLORS, onChangeColor) {
    const box = document.createElement('div');
    box.className = 'color-box';
    box.textContent = type;
    box.style.backgroundColor = '#' + TYPE_COLORS[type].toString(16).padStart(6, '0');
    box.style.color = getTextColor(TYPE_COLORS[type]);
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.style.fontWeight = 'bold';
    box.style.cursor = 'pointer';

    box.addEventListener('click', () => {
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.value = '#' + TYPE_COLORS[type].toString(16).padStart(6, '0');
        picker.style.position = 'absolute';
        picker.style.left = '-9999px';
        document.body.appendChild(picker);
        picker.click();

        let isCoolingDown = false;
        picker.addEventListener('input', () => {
            if (isCoolingDown) return;
            TYPE_COLORS[type] = parseInt(picker.value.slice(1), 16);
            onChangeColor();
            isCoolingDown = true;
            setTimeout(() => isCoolingDown = false, 200);
        });

        picker.addEventListener('blur', () => picker.remove());
    });

    return box;
}

export function getDefaultInteractionValue() {
    // To be adjusted later. Let's do 0 to 1 for now.
    return (Math.random() * 2 - 1).toFixed(2);
}