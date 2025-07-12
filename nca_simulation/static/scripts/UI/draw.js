import { selectedCellId } from '../sim/simulation.js';


export function drawSimulation(sim, ctx, cellSize, survivalZone) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Survival zone
    if (survivalZone) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        for (let y = 0; y < survivalZone.length; y++) {
            for (let x = 0; x < survivalZone[y].length; x++) {
                if (survivalZone[y][x]) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
    }

    for (const cell of sim.cells) {
        if (!cell.alive) continue;
        const { x, y } = cell.position;
        const { r, g, b } = colorFromDNA(cell.genome.rawDNA);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        if (cell.id === selectedCellId) {
            // Compute contrasting color
            const invert = (value) => 255 - value;
            const contrastR = invert(r);
            const contrastG = invert(g);
            const contrastB = invert(b);
            const contrastColor = `rgb(${contrastR},${contrastG},${contrastB})`;

            // Outer bright border (contrasting color)
            ctx.lineWidth = 10;
            ctx.strokeStyle = contrastColor;
            ctx.strokeRect(x * cellSize - 1, y * cellSize - 1, cellSize + 2, cellSize + 2);

            // Inner black border for clean visual break
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#000";
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

function colorFromDNA(dna) {
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