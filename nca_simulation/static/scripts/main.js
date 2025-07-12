import { initializeUI, resizeSimulationCanvas } from './UI/ui.js';

window.addEventListener('DOMContentLoaded', () => {
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
            const stats = sim.getStats();
            if (stats) {
                document.getElementById('stat-generation').textContent = stats.generation;
                document.getElementById('stat-tick').textContent = stats.tick;
                document.getElementById('stat-survivors').textContent = stats.survivors;
                document.getElementById('stat-survival-rate').textContent = `${stats.survivalRate}%`;
            }
        }

        requestAnimationFrame(loop);
    }

    loop();
});
