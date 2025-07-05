import { updateSimulation } from './simulation.js';
import { updateParticleColors } from './simulation.js';

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

export function renderRuleTable() {
    const table = document.getElementById('rule-table');
    table.innerHTML = '';

    const header = document.createElement('tr');
    const addTh = document.createElement('th');
    const addBtn = document.createElement('button');
    addBtn.id = 'add-type';
    addBtn.textContent = '+';
    addBtn.title = 'Add Type';
    addBtn.classList.add('add-btn');

    addBtn.addEventListener('click', () => {
        if (TYPES.length >= 26) {
            alert("Max type limit reached (Z)");
            return;
        }
        const nextChar = String.fromCharCode(65 + TYPES.length);
        const randomColor = Math.floor(Math.random() * 0xffffff);
        TYPE_COLORS[nextChar] = randomColor;
        rules[nextChar] = {};
        TYPES.forEach(existing => {
            rules[existing][nextChar] = 0;
            rules[nextChar][existing] = 0;
        });
        rules[nextChar][nextChar] = 0.2; //Slightly attracted to it's own kind
        TYPES.push(nextChar);
        renderRuleTable();
        updateSimulation();
    });

    addTh.appendChild(addBtn);
    header.appendChild(addTh);

    TYPES.forEach(type => {
        const th = document.createElement('th');
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = '#' + TYPE_COLORS[type].toString(16).padStart(6, '0');
        colorBox.style.color = getTextColor(TYPE_COLORS[type]);
        colorBox.textContent = type;
        colorBox.style.display = 'flex';
        colorBox.style.alignItems = 'center';
        colorBox.style.justifyContent = 'center';
        colorBox.style.fontWeight = 'bold';

        colorBox.addEventListener('click', () => {
            const picker = document.createElement('input');
            picker.type = 'color';
            picker.value = '#' + TYPE_COLORS[type].toString(16).padStart(6, '0');
            picker.style.position = 'absolute';
            picker.style.left = '-9999px';
            document.body.appendChild(picker);

            picker.click();

            let isCoolingDown = false;

            picker.addEventListener('input', () => {
                if (isCoolingDown) return; //prevents user "drag" on color pallet to fire this event logic

                TYPE_COLORS[type] = parseInt(picker.value.slice(1), 16);
                renderRuleTable();
                
                updateParticleColors();

                isCoolingDown = true;
                setTimeout(() => {
                    isCoolingDown = false;
                }, 200); // Cooldown time (adjust as needed)
              });
            picker.addEventListener('blur', () => picker.remove());
        });

        th.appendChild(colorBox);
        header.appendChild(th);
    });

    header.appendChild(document.createElement('th'));
    table.appendChild(header);

    TYPES.forEach(rowType => {
        const row = document.createElement('tr');
        const labelCell = document.createElement('td');
        const rowColorBox = document.createElement('div');
        rowColorBox.className = 'color-box';
        rowColorBox.style.backgroundColor = '#' + TYPE_COLORS[rowType].toString(16).padStart(6, '0');
        rowColorBox.style.color = getTextColor(TYPE_COLORS[rowType]);
        rowColorBox.textContent = rowType;
        rowColorBox.style.display = 'flex';
        rowColorBox.style.alignItems = 'center';
        rowColorBox.style.justifyContent = 'center';
        rowColorBox.style.fontWeight = 'bold';

        rowColorBox.addEventListener('click', () => {
            const picker = document.createElement('input');
            picker.type = 'color';
            picker.value = '#' + TYPE_COLORS[rowType].toString(16).padStart(6, '0');
            picker.style.position = 'absolute';
            picker.style.left = '-9999px';
            document.body.appendChild(picker);

            picker.click();

            let isCoolingDown = false;

            picker.addEventListener('input', () => {
                if (isCoolingDown) return; //prevents user "drag" on color pallet to fire this event logic

                TYPE_COLORS[rowType] = parseInt(picker.value.slice(1), 16);
                renderRuleTable();
                updateSimulation();

                isCoolingDown = true;
                setTimeout(() => {
                    isCoolingDown = false;
                }, 200); // Cooldown time (adjust as needed)

            });
            picker.addEventListener('blur', () => picker.remove());
        });

        labelCell.appendChild(rowColorBox);
        row.appendChild(labelCell);

        TYPES.forEach(colType => {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = -1;
            input.max = 1;
            input.step = '0.01';
            input.value = rules[rowType][colType] ?? 0;
            input.style.width = '4em';

            input.addEventListener('change', () => {
                let val = parseFloat(input.value);
                if (isNaN(val)) val = 0;
                val = Math.max(-1, Math.min(1, val)); // clamp
                input.value = val;
                rules[rowType][colType] = val;
            });

            const cell = document.createElement('td');
            cell.appendChild(input);
            row.appendChild(cell);
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑';
        delBtn.disabled = true;
        row.appendChild(delBtn);

        table.appendChild(row);
    });
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
            if (is5yo){
                lines.push(describeInteractionLike5yo(value, toType));
            }else{
                lines.push(describeInteraction(value, toType));
            }
        }
        lines.push(""); // blank line between blocks
    }

    return lines.join("\n");
  }