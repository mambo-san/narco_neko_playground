import { particleCount, setParticleCount } from './simulation.js';
import { INTERACTION_RADIUS, setInteractionRadius } from './simulation.js';
import { showRadiusPreview } from './simulation.js';
import { updateSimulation } from './simulation.js';
import { rules, generateRuleExplanation, renderRuleTable } from './rules.js';
import { TYPES, TYPE_COLORS, populationDistribution } from './rules.js';

export function initUI() {
    //Paricle count
    const particleInput = document.getElementById('particle-count-input');
    particleInput.value = particleCount;
    particleInput.addEventListener('change', () => {
        const value = parseInt(particleInput.value);
        if (!isNaN(value) && value > 0) {
            setParticleCount(value);
            updateSimulation();
        }
    });
    //Interaction Radious
    const radiusInput = document.getElementById('interaction-radius-input');
    radiusInput.value = INTERACTION_RADIUS;

    radiusInput.addEventListener('change', () => {
        const value = parseFloat(radiusInput.value);
        if (!isNaN(value) && value >= 0) {
            setInteractionRadius(value);
            showRadiusPreview(value);
        }
    });

    //Population % eidtor
    document.getElementById('toggle-population').addEventListener('click', () => {
        const editor = document.getElementById('population-editor');
        editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
        renderPopulationEditor();
    });

    


    const btn = document.getElementById('fullscreen-btn');
    const panel = document.getElementById('floating-panel');

    // Fullscreen toggle
    btn.addEventListener('click', () => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Drag logic
    makeDraggable(panel)

    // UI hide/show logic
    let inactivityTimer;
    let uiVisible = true;

    function showUI() {
        if (!uiVisible) {
            btn.classList.remove('hidden-ui');
            panel.classList.remove('hidden-ui');
            document.body.classList.remove('hide-cursor');
            uiVisible = true;
        }
        resetInactivityTimer();
    }

    function hideUI() {
        if (isHovering(btn) || isHovering(panel)) return;
        btn.classList.add('hidden-ui');
        panel.classList.add('hidden-ui');
        document.body.classList.add('hide-cursor');
        uiVisible = false;
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        if (document.fullscreenElement) {
            inactivityTimer = setTimeout(hideUI, 1000);
        }
    }

    function isHovering(el) {
        return el.matches(':hover');
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            if (document.fullscreenElement) {
                showUI();
            }
        });
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            showUI();
        } else {
            btn.classList.remove('hidden-ui');
            panel.classList.remove('hidden-ui');
            clearTimeout(inactivityTimer);
            uiVisible = true;
        }
    });

    // Toggle rule panel
    document.getElementById('toggle-rules').addEventListener('click', () => {
        const editor = document.getElementById('rule-editor');
        const toggleBtn = document.getElementById('toggle-rules');
        const isOpen = editor.style.display === 'block';

        editor.style.display = isOpen ? 'none' : 'block';
        toggleBtn.innerText = isOpen ? '⚙️ Rules' : '⬆️ Hide Rules';
      });

    // Expain button
    const explainBtn = document.getElementById('explain-rules-btn');
    const explain5yoBtn = document.getElementById('explain-rules-5yo-btn');
    const explainBox = document.getElementById('explanation-window');
    const explainContent = document.getElementById('explanation-content');
    const closeExplain = document.getElementById('close-explanation');

    explainBtn.addEventListener('click', () => {
        const summary = generateRuleExplanation(rules, false);
        explainContent.innerHTML = summary.split('\n').map(line => `<p>${line}</p>`).join('');
        explainBox.style.display = 'block';
    });
    explain5yoBtn.addEventListener('click', () => {
        const summary = generateRuleExplanation(rules, true);
        explainContent.innerHTML = summary.split('\n').map(line => `<p>${line}</p>`).join('');
        explainBox.style.display = 'block';
    });

    closeExplain.addEventListener('click', () => {
        explainBox.style.display = 'none';
    });
    
    makeDraggable(explainBox);

    
} 

function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    el.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        isDragging = true;
        offsetX = e.clientX - el.getBoundingClientRect().left;
        offsetY = e.clientY - el.getBoundingClientRect().top;
        el.style.transition = 'none'; // disable smooth center transition
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        el.style.left = e.clientX - offsetX + 'px';
        el.style.top = e.clientY - offsetY + 'px';
        el.style.transform = 'none'; // disable center transform when dragged
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

  }

function renderPopulationEditor() {
    const editor = document.getElementById('population-editor');
    editor.innerHTML = '';

    // Add "Add Type" button
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Add Particle Type';
    addBtn.className = 'add-btn';
    addBtn.style.marginBottom = '10px';

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
        rules[nextChar][nextChar] = 0.2;

        TYPES.push(nextChar);
        populationDistribution[nextChar] = 1;

        normalizePopulation();
        renderPopulationEditor();
        import('./simulation.js').then(mod => mod.rebalanceParticles());
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
        label.style.width = '2em'; // Optional: control size
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
                renderPopulationEditor(); // re-render to reflect color
                import('./simulation.js').then(mod => mod.updateParticleColors());

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

            redistributePopulation(changedType, newValue);
            updatePopulationSliders();  // sync values and display
            
            import('./simulation.js').then(mod => mod.rebalanceParticles());
          });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'trash-btn';
        deleteBtn.textContent = '✖️';
        deleteBtn.title = 'Remove this type';
        deleteBtn.style.marginLeft = '8px';

        deleteBtn.addEventListener('click', () => {
            if (TYPES.length <= 2) {
                alert("At least two types are required.");
                return;
            }

            // Remove from data structures
            delete populationDistribution[type];
            delete TYPE_COLORS[type];
            delete rules[type];

            TYPES.splice(TYPES.indexOf(type), 1);
            for (const t of TYPES) {
                delete rules[t][type];
            }

            normalizePopulation();
            renderPopulationEditor();
            renderRuleTable();
            import('./simulation.js').then(mod => {
                mod.reassignParticlesOfType(type);
                mod.rebalanceParticles();
            });
        });

        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(valueLabel);
        container.appendChild(deleteBtn);
        editor.appendChild(container);
    });
  }

function redistributePopulation(changedType, newValue) {
    const allTypes = Object.keys(populationDistribution);
    const others = allTypes.filter(t => t !== changedType);

    const minEach = 1;
    const maxForChanged = 100 - (others.length * minEach);
    const clampedNewValue = Math.max(minEach, Math.min(maxForChanged, newValue));
    populationDistribution[changedType] = clampedNewValue;

    let remaining = 100 - clampedNewValue;

    // Total of current percentages of other types (after reserving minEach)
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

    normalizePopulation();  // Fix rounding error
}
function normalizePopulation() {
    let total = Object.values(populationDistribution).reduce((sum, v) => sum + v, 0);
    let diff = 100 - total;

    if (Math.abs(diff) < 0.01) return;

    const adjustable = Object.entries(populationDistribution)
        .filter(([, val]) => (diff > 0 && val < 100) || (diff < 0 && val > 1));

    if (adjustable.length === 0) return;

    // Adjust random type by +/-1 at a time
    for (let i = 0; i < Math.abs(diff); i++) {
        const [type] = adjustable[Math.floor(Math.random() * adjustable.length)];
        populationDistribution[type] += Math.sign(diff);
    }
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

export function getTextColor(bgHex) {
    const r = (bgHex >> 16) & 0xff;
    const g = (bgHex >> 8) & 0xff;
    const b = bgHex & 0xff;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 128 ? 'black' : 'white';
}
