// ui.js
import { rules } from './rules.js';
import { renderPopulationEditor } from './population_ui.js';
import { makeDraggable } from './draggable_ui.js';
import { WTF_MARKDOWN } from './utils.js';

export function initUI(engine) {

    //WTF icon
    const wtfIcon = document.getElementById('wtf-icon');
    const wtfWindow = document.getElementById('wtf-window');
    const wtfClose = document.getElementById('close-wtf');

    wtfIcon.addEventListener('click', () => {
        const wtfContent = document.getElementById('wtf-content');
        wtfContent.innerHTML = marked.parse(WTF_MARKDOWN);
        wtfWindow.style.display = 'block';
    });

    wtfClose.addEventListener('click', () => {
        wtfWindow.style.display = 'none';
    });
    makeDraggable(wtfWindow);


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
    radiusInput.addEventListener('input', () => {
        const value = parseFloat(radiusInput.value);
        if (!isNaN(value) && value >= 0) {
            engine.setRadius(value);
            engine.showRadiusEffect();
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
            panel.classList.remove('inactive-ui');
            btn.classList.remove('inactive-ui');
            document.body.classList.remove('hide-cursor');
            uiVisible = true;
        }
        resetInactivityTimer();
    }

    function hideUI() {
        if (isHovering(btn) || isHovering(panel)) return;

        if (document.fullscreenElement) {
            btn.classList.add('hidden-ui');
            panel.classList.add('hidden-ui');
            document.body.classList.add('hide-cursor');
        }else{    
            btn.classList.add('inactive-ui')
            panel.classList.add('inactive-ui');
        }
        uiVisible = false;
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(hideUI, 1000);
    }

    function isHovering(el) {
        return el.matches(':hover');
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            showUI();
        });
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            showUI();
        } else {
            btn.classList.remove('hidden-ui');
            panel.classList.remove('hidden-ui');
            btn.classList.remove('hidden-ui');
            clearTimeout(inactivityTimer);
            uiVisible = true;
        }
    });

    makeDraggable(panel);

    //Toggle buttons for Population
    const popBtn = document.getElementById('toggle-population');
    popBtn.addEventListener('click', () => {
        const editor = document.getElementById('population-editor');
        const isOpen = editor.style.display === 'block';
        editor.style.display = isOpen ? 'none' : 'block';
        popBtn.innerText = isOpen ? '📊 Population %' : '⬆️ Hide Population';
        renderPopulationEditor(engine);
    });
    //Toggle buttons for Rules
    const toggleBtn = document.getElementById('toggle-rules');
    toggleBtn.addEventListener('click', () => {
        const editor = document.getElementById('rule-editor');
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
    //Restart button
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', () => {
        engine.reset();
    });

    makeDraggable(explainBox);
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