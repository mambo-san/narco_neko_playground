// main.js
import { ParticleEngine } from './particle_engine.js';
import { initUI } from './ui.js';
import { renderRuleTable } from './rule_ui.js';

const engine = new ParticleEngine();
window.engine = engine; // optional for debug

initUI(engine);          // pass engine to UI module
renderRuleTable(engine);
