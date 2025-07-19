export const SENSOR_TYPES = [
    { id: 0, name: "Bias", shortName: "B", compute: () => 0.2 },

    {
        id: 1, name: "Crowded Area", shortName: "CA",
        compute: (cell, sim) => {
            let count = 0;
            const { x, y } = cell.position;
            for (const other of sim.cells) {
                if (other === cell || !other.alive) continue;
                const dx = other.position.x - x;
                const dy = other.position.y - y;
                if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) count++;
            }
            return (count / 4) - 1;  // range [-1, 1]
        }
    },

    {
        id: 2, name: "Touching Wall", shortName: "Tw",
        compute: (cell, sim) => {
            const { x, y } = cell.position;
            const touching = x === 0 || y === 0 || x === sim.gridWidth - 1 || y === sim.gridHeight - 1;
            return touching ? 1 : -1;
        }
    },

    {
        id: 3, name: "Wall Proximity", shortName: "Wp",
        compute: (cell, sim) => {
            const { x, y } = cell.position;
            const dx = Math.min(x, sim.gridWidth - 1 - x);
            const dy = Math.min(y, sim.gridHeight - 1 - y);
            const minDistToEdge = Math.min(dx, dy);
            const maxDist = Math.floor(Math.min(sim.gridWidth, sim.gridHeight) / 2);
            const proximity = minDistToEdge / maxDist;
            return proximity * 2 - 1; // normalized to [-1, 1]
        }
    },

    {
        id: 4, name: "Random Signal", shortName: "RN",
        compute: () => Math.random() * 2 - 1
    },

    {
        id: 5, name: "Forward Density", shortName: "FD",
        compute: (cell, sim) => {
            const { x, y } = cell.position;
            const dx = cell.lastDelta?.x ?? 0;
            const dy = cell.lastDelta?.y ?? 0;
            if (dx === 0 && dy === 0) return -1;

            let count = 0;
            for (const other of sim.cells) {
                if (other === cell || !other.alive) continue;
                const ox = other.position.x - x;
                const oy = other.position.y - y;
                if (dx * ox > 0 || dy * oy > 0) {
                    if (Math.abs(ox) <= 2 && Math.abs(oy) <= 2) count++;
                }
            }
            return (count / 4) - 1; // normalized to [-1, 1]
        }
    },

    {
        id: 6, name: "DistNorth", shortName: "DN",
        compute: (cell, sim) => {
            const mid = sim.gridHeight / 2;
            return ((mid - cell.position.y) / mid);  // top = +1, bottom = -1
        }
    },
    {
        id: 7, name: "DistSouth", shortName: "DS",
        compute: (cell, sim) => {
            const mid = sim.gridHeight / 2;
            return ((cell.position.y - mid) / mid);  // bottom = +1, top = -1
        }
    },
    {
        id: 8, name: "DistWest", shortName: "DW",
        compute: (cell, sim) => {
            const mid = sim.gridWidth / 2;
            return ((mid - cell.position.x) / mid);  // left = +1, right = -1
        }
    },
    {
        id: 9, name: "DistEast", shortName: "DE",
        compute: (cell, sim) => {
            const mid = sim.gridWidth / 2;
            return ((cell.position.x - mid) / mid);  // right = +1, left = -1
        }
    },
    {
        id: 10, name: "Age", shortName: "A",
        compute: (cell, sim) => Math.tanh((cell.age / sim.ticksPerGeneration) * 2 - 1)
    }
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
        id: 3, 
        name: "Move Left", 
        shortName: "ML",
        delta: { x: -1, y: 0 } },
    { 
        id: 4, 
        name: "Do nothing", 
        shortName: "Dn",
        delta: { x: 0, y: 0 } }
];
  