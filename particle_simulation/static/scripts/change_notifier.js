import { renderPopulationEditor } from './population_ui.js';
import { renderRuleTable } from './rule_ui.js';


export function onTypesChanged(engine) {
    renderPopulationEditor(engine);
    renderRuleTable(engine);
}