import { selectedCellId } from './simulation.js';


export function drawSimulation(sim, ctx, cellSize, survivalZone) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Survival zone
    if (survivalZone) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(survivalZone.x * cellSize, survivalZone.y * cellSize, survivalZone.w * cellSize, survivalZone.h * cellSize);
    }

    for (const cell of sim.cells) {
        if (!cell.alive) continue;
        const { x, y } = cell.position;
        const hash = hashString(cell.genome.rawDNA.join(''));
        const r = (hash >> 16) & 0xFF;
        const g = (hash >> 8) & 0xFF;
        const b = hash & 0xFF;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        if (cell.id === selectedCellId) {
            // Outer bold border
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#000"; // black outer glow
            ctx.strokeRect(x * cellSize - 1, y * cellSize - 1, cellSize + 2, cellSize + 2);

            // Inner bright border
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#ff00ff"; // magenta
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}
