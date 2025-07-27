export function setupWTFLink() {
    document.getElementById("wtf-link").addEventListener("click", () => {
        // Prevent duplicates
        if (document.getElementById("wtf-window")) return;

        const panel = document.createElement("div");
        panel.id = "wtf-window";

        panel.innerHTML = project_description;

        document.body.appendChild(panel);

        // Close logic
        document.getElementById("wtf-close").addEventListener("click", () => {
            panel.remove();
        });
    });
}


const project_description = `
  <div id="wtf-window-header">
      <span>WTF is this? WFT do I do?</span>
      <button id="wtf-close" title="Close">×</button>
  </div>
  <div id="wtf-window-content">

      <details>
          <summary>Overview</summary>
          <p>
              Welcome to Neural Cellular Automata (NCA) Simulation.
        </p>
          <p>
              This simulation evolves simple digital organisms on a grid. 
              Each cell has a neural network encoded in DNA that determines how it senses, moves, and survives. 
              Over generations, fitter cells reproduce and pass on their genes, while the system tracks survival rate and genetic diversity.
          </p>
      </details>

      <details>
    <summary>Reproduction Zone Mechanism</summary>
        <p>
            A cell accumulates reproduction weight the longer it stays in the survival zone. 
            Additionally, if it ends the generation inside the zone, it receives a bonus. 
            This weight influences how likely the cell is to pass on its genome to the next generation. 
            The survival zone's shape can be adjusted (edge, corners, center, etc.).
        </p>
      </details>

      <details>
        <summary>Inspecting Cell</summary>
        <p>
            Clicking on a living cell opens a floating panel showing its neural network. 
            The network's structure is visualized as graph or text, allowing you to see how the cell processes inputs and generates outputs.
        </p>
        <p >
            When you select a cell, you'll notice that multiple cells are selected. Here's why:
                Each cell's DNA structure (abstract signature) is recorded at the begginging of the generation.
                This signature ignores connection weights and focuses only on the nodes and links involved.
                All cells with the same signature (same neural network topology) are grouped together.
                This allows you to see how many cells share the same DNA structure, even if their weights differ.
                This grouping helps visualize genetic diversity and how many cells share similar neural network designs.
        </p>
      </details>

      <details>
          <summary>Parameters</summary>
          <p><strong>Grid Width</strong>: Size of the simulation grid (square).</p>
          <p><strong>Population</strong>: Number of cells per generation.</p>
          <p><strong>Genome Length</strong>: Number of connections in the DNA (neural links).</p>
          <p><strong>Inner Neurons</strong>: Hidden layer neurons in each cell's brain.</p>
          <p><strong>Ticks per Generation</strong>: Number of steps each generation runs before evaluation.</p>
          <p><strong>Mutation %</strong>: Mutation rate applied to offspring DNA.</p>
      </details>

      <details>
          <summary>Statistics</summary>
          <p><strong>Generation</strong>: Number of generations elapsed.</p>
          <p><strong>Ticks</strong>: Time steps passed in current generation.</p>
          <p><strong>Survivors</strong>: Number of cells alive in the reproduction zone.</p>
          <p><strong>Survival Rate</strong>: Percentage of total population that survived.</p>
          <p><strong>Diversity</strong>: 
          Relative uniqueness of genomes this generation compared to initial gene pool. 
          Calculated as (Unique abstract DNA count this generation) ÷ (Unique count in Gen 0).
          </p>
      </details>

  </div>
`;
