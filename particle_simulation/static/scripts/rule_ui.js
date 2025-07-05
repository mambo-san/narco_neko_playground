// rule_ui.js
import { onTypesChanged } from './change_notifier.js';
import { TYPE_COLORS, TYPES, rules, populationDistribution } from './rules.js';
import { getTextColor } from './utils.js';

export function renderRuleTable(engine) {
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
        if (TYPES.length >= 26) return alert("Max type limit reached (Z)");
        const nextChar = String.fromCharCode(65 + TYPES.length);
        const randomColor = Math.floor(Math.random() * 0xffffff);
        TYPE_COLORS[nextChar] = randomColor;
        rules[nextChar] = {};
        TYPES.forEach(existing => {
            rules[existing][nextChar] = 0;
            rules[nextChar][existing] = 0;
        });
        rules[nextChar][nextChar] = 0.2;
        TYPES.push(nextChar);
        populationDistribution[nextChar] = 1; 
        onTypesChanged(engine);
        engine.update();
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
                if (isCoolingDown) return;
                TYPE_COLORS[type] = parseInt(picker.value.slice(1), 16);
                onTypesChanged(engine)
                engine.updateColors();
                isCoolingDown = true;
                setTimeout(() => { isCoolingDown = false; }, 200);
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
                if (isCoolingDown) return;
                TYPE_COLORS[rowType] = parseInt(picker.value.slice(1), 16);
                onTypesChanged(engine);
                engine.updateColors();
                isCoolingDown = true;
                setTimeout(() => { isCoolingDown = false; }, 200);
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
                val = Math.max(-1, Math.min(1, val));
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
