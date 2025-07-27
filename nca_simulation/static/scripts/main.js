import { initializeUI, resizeSimulationCanvas } from './UI/ui.js';
import { setupWTFLink } from './UI/wtf_link.js';

window.addEventListener('DOMContentLoaded', () => {

    //The help page
    setupWTFLink()
    
    const canvas = document.getElementById('sim-canvas');
    let sim = null;
    
    
    initializeUI(canvas, s => {
        sim = s;

        // Once sim is ready, respond to window resize
        window.addEventListener('resize', () => {
            if (sim) {
                resizeSimulationCanvas(sim, canvas);
            }
        });
        
    });

    function loop() {
        if (sim) {
            if (!sim.isPaused()) {
                sim.tick();
                sim.draw();
            }
            const realtime = sim.getRealtimeStats();
           
            document.getElementById('stat-tick').textContent = realtime.tick;

            if (sim.cachedGenerationStats) {
                const gen = sim.cachedGenerationStats;
                document.getElementById('stat-generation').textContent = gen.generation;
                document.getElementById('stat-survivors').textContent = gen.survivors;
                document.getElementById('stat-survival-rate').textContent = `${gen.survivalRate}%`;
                document.getElementById('stat-entropy').textContent = gen.geneticEntropy;
            }
        }

        requestAnimationFrame(loop);
    }

    loop();
});
