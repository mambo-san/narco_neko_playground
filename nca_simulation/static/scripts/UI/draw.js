import { selectedGenomes } from '../sim/simulation.js';

export function drawSimulation(sim, ctx, cellSize, survivalZone) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawSurvivalZone(ctx, survivalZone, cellSize);
    drawCells(ctx, sim.cells, cellSize);
}

function drawSurvivalZone(ctx, survivalZone, cellSize) {
    if (!survivalZone) return;

    ctx.fillStyle = 'rgba(16, 231, 231, 0.8)';
    for (let y = 0; y < survivalZone.length; y++) {
        for (let x = 0; x < survivalZone[y].length; x++) {
            if (survivalZone[y][x]) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
}

function drawCells(ctx, cells, cellSize) {
    for (const cell of cells) {
        if (!cell.alive) continue;

        const { x, y } = cell.position;
        //Draw crosshair first
        if (selectedGenomes.has(cell.abstractSignature)) {
            drawCellHighlight(ctx, x, y, cellSize);
        }
        // Draw the cell
        ctx.fillStyle = `rgb(${cell.rgb.r}, ${cell.rgb.g}, ${cell.rgb.b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

       
    }
}

function drawCellHighlight(ctx, x, y, cellSize) {
    const contrastColor = '#04df9b';

    const px = x * cellSize;
    const py = y * cellSize;

    // Outer bright border
    ctx.lineWidth = 10;
    ctx.strokeStyle = contrastColor;
    ctx.strokeRect(px - 1, py - 1, cellSize + 2, cellSize + 2);

    // Inner black border
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(px, py, cellSize, cellSize);

}


export function colorFromAbstractDNA(abstractDNA) {
    // Hash the abstractDNA string
    let hash = 0;
    for (let i = 0; i < abstractDNA.length; i++) {
        const char = abstractDNA.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    // Use parts of the hash to generate RGB values
    const r = (hash >> 16) & 0xFF;
    const g = (hash >> 8) & 0xFF;
    const b = hash & 0xFF;

    return { r, g, b };
}