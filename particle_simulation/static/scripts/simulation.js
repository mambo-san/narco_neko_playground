// scripts/simulation.js
import { TYPES, TYPE_COLORS, rules } from './rules.js';
import { populationDistribution } from './rules.js';

export let particleCount = 500;
export let INTERACTION_RADIUS = 50;

const SENSITIVITY = 0.1;

const MIN_DISTANCE = 10;
const softShell = 6; // Distance threshold for soft repulsion

let particles = [];

let app;

//UI state
let previewParticles = null;
let previewTicker = null;
let previewGfx = null;


export function initSimulation() {
    app = new PIXI.Application({
        resizeTo: window,
        backgroundColor: 0x000000,
    });
    document.body.appendChild(app.view);

    for (let i = 0; i < particleCount; i++) {
        const type = TYPES[Math.floor(Math.random() * TYPES.length)];
        const color = TYPE_COLORS[type];

        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(0, 0, 3);
        g.endFill();

        const tex = app.renderer.generateTexture(g);
        const sprite = new PIXI.Sprite(tex);
        sprite.x = Math.random() * app.screen.width;
        sprite.y = Math.random() * app.screen.height;
        sprite.vx = (Math.random() - 0.5) * 2;
        sprite.vy = (Math.random() - 0.5) * 2;
        sprite.type = type;

        app.stage.addChild(sprite);
        particles.push(sprite);
    }

    app.ticker.add(updateParticles);
}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        let p1 = particles[i];
        let fx = 0, fy = 0;

        for (let j = 0; j < particles.length; j++) {
            if (i === j) continue;
            let p2 = particles[j];

            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;

            // Toroidal (wraparound) correction
            if (dx > app.screen.width / 2) dx -= app.screen.width;
            if (dx < -app.screen.width / 2) dx += app.screen.width;
            if (dy > app.screen.height / 2) dy -= app.screen.height;
            if (dy < -app.screen.height / 2) dy += app.screen.height;


            const distSq = dx * dx + dy * dy;


            if (distSq < INTERACTION_RADIUS * INTERACTION_RADIUS) {
                const dist = Math.sqrt(distSq) + 0.001;
                const nx = dx / dist;
                const ny = dy / dist;

                if (!rules[p1.type] || !rules[p1.type][p2.type]) continue; //In case type is deleted

                const raw = rules[p1.type][p2.type];
                const force = raw * SENSITIVITY / dist;
                fx += force * dx;
                fy += force * dy;

                if (dist < MIN_DISTANCE) {
                    const overlap = (MIN_DISTANCE - dist) / MIN_DISTANCE;
                    const repelForce = 0.5 + overlap * 2; // stronger repulsion
                    fx -= nx * repelForce;
                    fy -= ny * repelForce;
                    continue; // skip force attraction for overlapping particles
                }

                if (dist < softShell) {
                    const repelStrength = 0.2 * (1 - dist / softShell); // taper off as they get further
                    fx -= nx * repelStrength;
                    fy -= ny * repelStrength;
                }
            }
        }

        p1.vx += fx;
        p1.vy += fy;

        const maxSpeed = 2;
        const speed = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy);
        if (speed > maxSpeed) {
            p1.vx *= maxSpeed / speed;
            p1.vy *= maxSpeed / speed;
        }

        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = app.screen.width;
        if (p1.x > app.screen.width) p1.x = 0;
        if (p1.y < 0) p1.y = app.screen.height;
        if (p1.y > app.screen.height) p1.y = 0;
    }
}

export function reassignParticlesOfType(typeToRemove) {
    const remainingTypes = TYPES.filter(t => t !== typeToRemove);
    if (remainingTypes.length === 0) return;

    for (const p of particles) {
        if (p.type === typeToRemove) {
            const newType = remainingTypes[Math.floor(Math.random() * remainingTypes.length)];
            p.type = newType;

            // Update texture
            const color = TYPE_COLORS[newType];
            const g = new PIXI.Graphics();
            g.beginFill(color);
            g.drawCircle(0, 0, 3);
            g.endFill();
            const tex = app.renderer.generateTexture(g);
            p.texture = tex;
        }
    }
}

export function updateSimulation() {
    const diff = particleCount - particles.length;

    if (diff > 0) {
        // Add new particles
        for (let i = 0; i < diff; i++) {
            const type = TYPES[Math.floor(Math.random() * TYPES.length)];
            const sprite = createParticle(type);
            app.stage.addChild(sprite);
            particles.push(sprite);
        }
    } else if (diff < 0) {
        // Remove particles
        for (let i = 0; i < Math.abs(diff); i++) {
            const removed = particles.pop();
            app.stage.removeChild(removed);
        }
    }
  }

function createParticle(type) {
    const color = TYPE_COLORS[type];

    const g = new PIXI.Graphics();
    g.beginFill(color);
    g.drawCircle(0, 0, 3);
    g.endFill();

    const tex = app.renderer.generateTexture(g);
    const sprite = new PIXI.Sprite(tex);
    sprite.x = Math.random() * app.screen.width;
    sprite.y = Math.random() * app.screen.height;
    sprite.vx = (Math.random() - 0.5) * 2;
    sprite.vy = (Math.random() - 0.5) * 2;
    sprite.type = type;

    return sprite;
  }

// Getters and setters

export function setParticleCount(value) {
    particleCount = value;
  }

export function setInteractionRadius(value) {
    INTERACTION_RADIUS = value;
  }


export function showRadiusPreview(radius) {
    if (particles.length < 2) return;

    // Clear any previous preview
    if (previewTicker) {
        previewTicker.stop();
        previewTicker.destroy();
        previewTicker = null;
    }
    if (previewGfx) {
        app.stage.removeChild(previewGfx);
        previewGfx.destroy();
        previewGfx = null;
    }

    // Reuse or pick fresh particles
    if (!previewParticles) {
        let a, b, attempts = 0;
        do {
            a = particles[Math.floor(Math.random() * particles.length)];
            b = particles[Math.floor(Math.random() * particles.length)];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            var distSq = dx * dx + dy * dy;
            attempts++;
        } while ((a === b || distSq < radius * radius) && attempts < 20);
        previewParticles = [a, b];
    }

    const [a, b] = previewParticles;

    // Create new graphics
    const gfx = new PIXI.Graphics();
    app.stage.addChild(gfx);
    previewGfx = gfx;

    const draw = () => {
        gfx.clear();
        gfx.lineStyle(1, 0xffff00, 0.6);
        gfx.drawCircle(a.x, a.y, radius);
        gfx.drawCircle(b.x, b.y, radius);
        gfx.moveTo(a.x, a.y);
    };

    const ticker = new PIXI.Ticker();
    ticker.add(draw);
    ticker.start();
    previewTicker = ticker;

    setTimeout(() => {
        ticker.stop();
        ticker.destroy();
        previewTicker = null;
        previewParticles = null;

        app.stage.removeChild(gfx);
        gfx.destroy();
        previewGfx = null;
    }, 5000);
  }
  


export function updateParticleColors() {
    for (const sprite of particles) {
        const color = TYPE_COLORS[sprite.type];

        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(0, 0, 3);
        g.endFill();

        const tex = app.renderer.generateTexture(g);
        sprite.texture = tex;
    }
  }

export function rebalanceParticles() {
    const total = particles.length;
    const targetCounts = {};

    // Determine how many particles should belong to each type
    for (const type of TYPES) {
        targetCounts[type] = Math.round((populationDistribution[type] / 100) * total);
    }

    // Count current number of particles per type
    const currentCounts = {};
    for (const type of TYPES) currentCounts[type] = 0;
    for (const p of particles) currentCounts[p.type]++;

    // Reassign excess particles
    const surplus = [];

    for (const p of particles) {
        if (currentCounts[p.type] > targetCounts[p.type]) {
            surplus.push(p);
            currentCounts[p.type]--;
        }
    }

    for (const type of TYPES) {
        while (currentCounts[type] < targetCounts[type] && surplus.length > 0) {
            const p = surplus.pop();
            p.type = type;

            const color = TYPE_COLORS[type];
            const g = new PIXI.Graphics();
            g.beginFill(color);
            g.drawCircle(0, 0, 3);
            g.endFill();
            const tex = app.renderer.generateTexture(g);
            p.texture = tex;

            currentCounts[type]++;
        }
    }
}