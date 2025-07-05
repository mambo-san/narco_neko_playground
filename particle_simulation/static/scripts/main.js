import { initSimulation } from './simulation.js';
import { initUI } from './ui.js';
import { TYPES, TYPE_COLORS, rules, renderRuleTable } from './rules.js';

window.TYPES = TYPES;
window.TYPE_COLORS = TYPE_COLORS;
window.rules = rules;
window.renderRuleTable = renderRuleTable;

initSimulation();
initUI();
renderRuleTable();
