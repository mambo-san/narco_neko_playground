// population_ui.js
import { TYPES, TYPE_COLORS, populationDistribution, rules } from './rules.js';
import { normalizePopulation, redistributePopulation, createColorBox } from './utils.js';
import { onTypesChanged } from './change_notifier.js'
import { addType, deleteType } from './rules.js';

export function renderPopulationEditor(engine) {
    const editor = document.getElementById('population-editor');
    editor.innerHTML = '';

    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Add Particle Type';
    addBtn.className = 'add-btn';

    addBtn.addEventListener('click', () => {
        addType(engine);
    });

    editor.appendChild(addBtn);

    const currentTypes = [...TYPES]; 

    currentTypes.forEach(type => {
        const container = document.createElement('div');
        container.className = 'pop-row';

        const label = createColorBox(type, TYPE_COLORS, () => {
            onTypesChanged(engine);
            engine.updateColors();
        });
        
        const percent = populationDistribution[type];

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
            deleteType(engine, type);
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
