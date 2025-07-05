// ui.js
import { generateRuleExplanation } from './utils.js';
import { rules } from './rules.js';
import { renderPopulationEditor } from './population_ui.js';
import { makeDraggable } from './draggable_ui.js';

export function initUI(engine) {
    // Particle count input
    const particleInput = document.getElementById('particle-count-input');
    particleInput.value = engine.count;
    particleInput.addEventListener('change', () => {
        const value = parseInt(particleInput.value);
        if (!isNaN(value) && value > 0) {
            engine.setCount(value);
        }
    });

    // Interaction radius input
    const radiusInput = document.getElementById('interaction-radius-input');
    radiusInput.value = engine.radius;
    radiusInput.addEventListener('change', () => {
        const value = parseFloat(radiusInput.value);
        if (!isNaN(value) && value >= 0) {
            engine.setRadius(value);
        }
    });

    const btn = document.getElementById('fullscreen-btn');
    const panel = document.getElementById('floating-panel');

    btn.addEventListener('click', () => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => alert(err.message));
        } else {
            document.exitFullscreen();
        }
    });

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
            if (document.fullscreenElement) showUI();
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

    makeDraggable(panel);

    document.getElementById('toggle-population').addEventListener('click', () => {
        const editor = document.getElementById('population-editor');
        editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
        renderPopulationEditor(engine);
    });

    document.getElementById('toggle-rules').addEventListener('click', () => {
        const editor = document.getElementById('rule-editor');
        const toggleBtn = document.getElementById('toggle-rules');
        const isOpen = editor.style.display === 'block';
        editor.style.display = isOpen ? 'none' : 'block';
        toggleBtn.innerText = isOpen ? '⚙️ Rules' : '⬆️ Hide Rules';
    });

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