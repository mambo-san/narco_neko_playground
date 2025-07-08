import { SENSOR_TYPES, ACTION_TYPES } from '../neuron_types.js';

export function renderBrainGraph(cell) {
    const brain = cell.brain;
    const container = document.getElementById("nn-graph");
    if (!container) return;

    container.style.display = "block";
    container.innerHTML = "";

    
    const svg = d3.select(container)
        .append("svg")
        .attr("width", container.clientWidth)
        .attr("height", container.clientHeight);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const inputCount = brain.inputCount;
    const hiddenCount = brain.innerCount;
    const outputCount = brain.outputCount;

    const totalNodes = inputCount + hiddenCount + outputCount;

    // Generate nodes
    const nodes = Array.from({ length: totalNodes }, (_, i) => {
        let type = "hidden";
        if (i < inputCount) type = "input";
        else if (i >= inputCount + hiddenCount) type = "output";

        return {
            id: i,
            label: getNeuronLabel(i, brain),
            type
        };
    });

    // Layer positioning
    const layers = {
        input: nodes.filter(n => n.type === "input"),
        hidden: nodes.filter(n => n.type === "hidden"),
        output: nodes.filter(n => n.type === "output")
    };

    const layerKeys = Object.keys(layers);
    const nodePositions = {};
    layerKeys.forEach((layer, li) => {
        const nodesInLayer = layers[layer];
        const ySpacing = height / (nodesInLayer.length + 1);
        const x = (li + 1) * width / (layerKeys.length + 1);
        nodesInLayer.forEach((node, i) => {
            node.x = x;
            node.y = (i + 1) * ySpacing;
            nodePositions[node.id] = node;
        });
    });

    // Draw links
    svg.selectAll("line")
        .data(brain.connections)
        .enter()
        .append("line")
        .attr("x1", d => nodePositions[d.from].x)
        .attr("y1", d => nodePositions[d.from].y)
        .attr("x2", d => nodePositions[d.to].x)
        .attr("y2", d => nodePositions[d.to].y)
        .attr("stroke", "#888")
        .attr("stroke-width", d => Math.abs(d.weight))
        .append("title")
        .text(d => `${getNeuronLabel(d.from, brain)} → ${getNeuronLabel(d.to, brain)} | weight: ${d.weight.toFixed(2)}`);

    // Draw nodes
    svg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 15)
        .attr("fill", d => {
            if (d.type === "input") return "#1f77b4";
            if (d.type === "output") return "#ff7f0e";
            return "#2ca02c";
        })
        .append("title")
        .text(d => d.label);

    // Labels
    svg.selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", d => d.x + 20)
        .attr("y", d => d.y)
        .text(d => d.label)
        .attr("alignment-baseline", "middle")
        .attr("fill", "#fff");

    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "10px";
    closeBtn.style.right = "10px";
    closeBtn.style.zIndex = "10000";
    closeBtn.style.background = "transparent";
    closeBtn.style.color = "white";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.cursor = "pointer";
    closeBtn.onclick = () => {
        container.style.display = "none";
    };

    // Append close button to container
    container.appendChild(closeBtn);
}

function getNeuronLabel(index, brain) {
    const { inputCount, innerCount, outputCount } = brain;
    if (index < inputCount) return `IN (${SENSOR_TYPES[index]?.name || index})`;
    if (index < inputCount + innerCount) return `HID (${index - inputCount})`;
    const outIndex = index - inputCount - innerCount;
    return `OUT (${ACTION_TYPES[outIndex]?.name || outIndex})`;
}
