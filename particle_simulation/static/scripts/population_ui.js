// population_ui.js
import { TYPES, TYPE_COLORS, populationDistribution, rules } from './rules.js';
import { getTextColor, normalizePopulation, redistributePopulation } from './utils.js';
import { onTypesChanged } from './change_notifier.js'

export function renderPopulationEditor(engine) {
    const editor = document.getElementById('population-editor');
    editor.innerHTML = '';

    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Add Particle Type';
    addBtn.className = 'add-btn';
    addBtn.style.marginBottom = '10px';

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
        normalizePopulation(populationDistribution);
        onTypesChanged(engine);
        engine.rebalance();
    });

    editor.appendChild(addBtn);

    Object.entries(populationDistribution).forEach(([type, percent]) => {
        const container = document.createElement('div');
        container.className = 'pop-row';

        const label = document.createElement('div');
        label.className = 'color-box';
        label.textContent = type;
        label.style.backgroundColor = '#' + TYPE_COLORS[type].toString(16).padStart(6, '0');
        label.style.color = getTextColor(TYPE_COLORS[type]);
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.justifyContent = 'center';
        label.style.fontWeight = 'bold';
        label.style.width = '2em';
        label.style.cursor = 'pointer';

        label.addEventListener('click', () => {
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
                onTypesChanged(engine);
                updateParticleColors();
                isCoolingDown = true;
                setTimeout(() => isCoolingDown = false, 200);
            });

            picker.addEventListener('blur', () => picker.remove());
        });

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 1;
        slider.step = 1;
        slider.max = 100;
        slider.value = percent;
        slider.dataset.type = type;
        slider.className = 'pop-slider';

        const valueLabel = document.createElement('span');
        valueLabel.textContent = ` ${percent}%`;
        valueLabel.className = 'pop-value';

        slider.addEventListener('input', (e) => {
            const changedType = e.target.dataset.type;
            const newValue = parseInt(e.target.value);

            redistributePopulation(populationDistribution, changedType, newValue);
            updatePopulationSliders();
            engine.rebalance();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'trash-btn';
        deleteBtn.textContent = '✖️';
        deleteBtn.title = 'Remove this type';
        deleteBtn.style.marginLeft = '8px';

        deleteBtn.addEventListener('click', () => {
            if (TYPES.length <= 2) return alert("At least two types are required.");

            delete populationDistribution[type];
            delete TYPE_COLORS[type];
            delete rules[type];
            TYPES.splice(TYPES.indexOf(type), 1);
            for (const t of TYPES) delete rules[t][type];

            engine.reassignType(type);
            engine.rebalance();

            normalizePopulation(populationDistribution);
            onTypesChanged(engine);
            engine.reassignType(type);
            engine.rebalance();
        });

        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(valueLabel);
        container.appendChild(deleteBtn);
        editor.appendChild(container);
    });
}

function updatePopulationSliders() {
    document.querySelectorAll('.pop-slider').forEach(slider => {
        const type = slider.dataset.type;
        const value = Math.round(populationDistribution[type]);
        slider.value = value;
        const valueLabel = slider.parentElement.querySelector('.pop-value');
        if (valueLabel) valueLabel.textContent = ` ${value}%`;
    });
}
