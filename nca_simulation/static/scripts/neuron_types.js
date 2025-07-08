export const SENSOR_TYPES = [
    { 
        id: 0, 
        name: "Bias", 
        shortName: "B",
        compute: () => 1 },
    {
        id: 1, 
        name: "Crowded Area", 
        shortName: "CA",
        compute: (cell, sim) => {
            const { x, y } = cell.position;
            let count = 0;
            for (const other of sim.cells) {
                if (other === cell || !other.alive) continue;
                const dx = other.position.x - x;
                const dy = other.position.y - y;
                if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) count++;
            }
            return count / 8; // normalize to [0, 1]
        }
    },
    {
        id: 2, 
        name: "Touching Wall", 
        shortName: "Tw",
        compute: (cell, sim) => {
            const { x, y } = cell.position;
            return (x === 0 || y === 0 || x === sim.gridWidth - 1 || y === sim.gridHeight - 1) ? 1 : 0;
        }
    },
    {
        id: 3,
        name: "Wall Proximity",
        shortName: "Wp",
        compute: (cell, sim) => {
            const { x, y } = cell.position;
            const dx = Math.min(x, sim.gridWidth - 1 - x);
            const dy = Math.min(y, sim.gridHeight - 1 - y);
            const minDistToEdge = Math.min(dx, dy);
            const maxPossible = Math.floor(Math.min(sim.gridWidth, sim.gridHeight) / 2);
            return minDistToEdge / maxPossible; // normalized to [0, 1]: returns 0 when hugging edge and ~1 in the center.
        }
      },
    { 
        id: 4, 
        name: "Random Signal", 
        shortName: "RN",
        compute: () => Math.random() * 2 - 1 }
];

export const ACTION_TYPES = [
    { 
        id: 0, 
        name: "Move Up", 
        shortName: "MU",
        delta: { x: 0, y: -1 } },
    { 
        id: 1, 
        name: "Move Right", 
        shortName: "MR",
        delta: { x: 1, y: 0 } },
    { 
        id: 2, 
        name: "Move Down",
        shortName: "MD", 
        delta: { x: 0, y: 1 } },
    { 
        id: 3, name: "Move Left", 
        shortName: "ML",
        delta: { x: -1, y: 0 } },
    { 
        id: 3, 
        name: "Do nothing", 
        shortName: "Dn",
        delta: { x: 0, y: 0 } }
];
  