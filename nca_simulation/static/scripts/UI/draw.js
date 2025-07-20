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
        const { r, g, b } = colorFromDNA(cell.genome.rawDNA);
        //Draw crosshair first
        if (selectedGenomes.has(cell.abstractSignature)) {
            drawCellHighlight(ctx, x, y, cellSize);
        }
        // Draw the cell
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
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

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function colorFromDNA(dna) {
    const values = dna.map(hex => parseInt(hex, 16)); // 32-bit int
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    // Avoid division by zero
    const range = maxVal === minVal ? 1 : (maxVal - minVal);

    // Pick 3 different stats to derive RGB:
    const r = Math.floor(((values[0] - minVal) / range) * 255);
    const g = Math.floor(((values[Math.floor(values.length / 2)] - minVal) / range) * 255);
    const b = Math.floor(((values[values.length - 1] - minVal) / range) * 255);

    return { r, g, b };
}

