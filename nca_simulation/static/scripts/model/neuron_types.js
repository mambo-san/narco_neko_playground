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
        compute: () => Math.random() * 2 - 1 
    },
    {
        id: 5,
        name: "Forward Density",
        shortName: "FD",
        compute: (cell, sim) => {
            const { x, y } = cell.position;
            const dx = cell.lastDelta?.x ?? 0;
            const dy = cell.lastDelta?.y ?? 0;

            if (dx === 0 && dy === 0) return 0; // no direction

            let count = 0;
            for (const other of sim.cells) {
                if (other === cell || !other.alive) continue;
                const ox = other.position.x - x;
                const oy = other.position.y - y;
                if (dx * ox > 0 || dy * oy > 0) {
                    if (Math.abs(ox) <= 2 && Math.abs(oy) <= 2) count++;
                }
            }
            return count / 8; // normalize
        }
      },
    {
        id: 6,
        name: "Center Pull",
        shortName: "CP",
        compute: (cell, sim) => {
            const dx = sim.gridWidth / 2 - cell.position.x;
            const dy = sim.gridHeight / 2 - cell.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.sqrt(Math.pow(sim.gridWidth / 2, 2) + Math.pow(sim.gridHeight / 2, 2));
            return 1 - (dist / maxDist);
        }
      },
    {
        id: 7,
        name: "Age",
        shortName: "A",
        compute: (cell, sim) => Math.tanh(cell.age / sim.ticksPerGeneration)
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
  