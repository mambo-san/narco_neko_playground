// particle_engine.js
import { TYPES, TYPE_COLORS, rules, populationDistribution } from './rules.js';
import { createCircleTexture } from './utils.js';

export class ParticleEngine {
    constructor(container = document.body) {
        this.particles = [];
        this.radius = 50;
        this.count = 500;

        this.app = new PIXI.Application({
            resizeTo: window,
            backgroundColor: 0x000000,
        });
        container.appendChild(this.app.view);

        this.initParticles();
        this.app.ticker.add(() => this.update());
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.count; i++) {
            const type = TYPES[Math.floor(Math.random() * TYPES.length)];
            const p = this.createParticle(type);
            this.particles.push(p);
            this.app.stage.addChild(p);
        }
    }

    createParticle(type) {
        const color = TYPE_COLORS[type];
        const sprite = new PIXI.Sprite(createCircleTexture(this.app.renderer, color));
        sprite.x = Math.random() * this.app.screen.width;
        sprite.y = Math.random() * this.app.screen.height;
        sprite.vx = (Math.random() - 0.5) * 2;
        sprite.vy = (Math.random() - 0.5) * 2;
        sprite.type = type;
        return sprite;
    }

    update() {
        const SENSITIVITY = 0.1;
        const MIN_DISTANCE = 10;
        const softShell = 6;
        const width = this.app.screen.width;
        const height = this.app.screen.height;

        for (let i = 0; i < this.particles.length; i++) {
            let p1 = this.particles[i];
            let fx = 0, fy = 0;

            for (let j = 0; j < this.particles.length; j++) {
                if (i === j) continue;
                let p2 = this.particles[j];

                let dx = p2.x - p1.x;
                let dy = p2.y - p1.y;

                if (dx > width / 2) dx -= width;
                if (dx < -width / 2) dx += width;
                if (dy > height / 2) dy -= height;
                if (dy < -height / 2) dy += height;

                const distSq = dx * dx + dy * dy;
                if (distSq < this.radius * this.radius) {
                    const dist = Math.sqrt(distSq) + 0.001;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const raw = rules[p1.type]?.[p2.type] ?? 0;
                    const force = raw * SENSITIVITY / dist;
                    fx += force * dx;
                    fy += force * dy;

                    if (dist < MIN_DISTANCE) {
                        const overlap = (MIN_DISTANCE - dist) / MIN_DISTANCE;
                        const repelForce = 0.5 + overlap * 2;
                        fx -= nx * repelForce;
                        fy -= ny * repelForce;
                        continue;
                    }

                    if (dist < softShell) {
                        const repelStrength = 0.2 * (1 - dist / softShell);
                        fx -= nx * repelStrength;
                        fy -= ny * repelStrength;
                    }
                }
            }

            p1.vx += fx;
            p1.vy += fy;
            const maxSpeed = 2;
            const speed = Math.sqrt(p1.vx ** 2 + p1.vy ** 2);
            if (speed > maxSpeed) {
                p1.vx *= maxSpeed / speed;
                p1.vy *= maxSpeed / speed;
            }

            p1.x = (p1.x + p1.vx + width) % width;
            p1.y = (p1.y + p1.vy + height) % height;
        }
    }

    updateColors() {
        for (const sprite of this.particles) {
            sprite.texture = createCircleTexture(this.app.renderer, TYPE_COLORS[sprite.type]);
        }
    }

    setCount(newCount) {
        this.count = newCount;
        const diff = newCount - this.particles.length;

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                const type = TYPES[Math.floor(Math.random() * TYPES.length)];
                const p = this.createParticle(type);
                this.particles.push(p);
                this.app.stage.addChild(p);
            }
        } else if (diff < 0) {
            for (let i = 0; i < Math.abs(diff); i++) {
                const p = this.particles.pop();
                this.app.stage.removeChild(p);
            }
        }
    }

    setRadius(r) {
        this.radius = r;
    }

    rebalance() {
        const total = this.particles.length;
        const targetCounts = {};
        for (const type of TYPES) {
            targetCounts[type] = Math.round((populationDistribution[type] / 100) * total);
        }

        const currentCounts = {};
        for (const type of TYPES) currentCounts[type] = 0;
        for (const p of this.particles) currentCounts[p.type]++;

        const surplus = [];
        for (const p of this.particles) {
            if (currentCounts[p.type] > targetCounts[p.type]) {
                surplus.push(p);
                currentCounts[p.type]--;
            }
        }

        for (const type of TYPES) {
            while (currentCounts[type] < targetCounts[type] && surplus.length > 0) {
                const p = surplus.pop();
                p.type = type;
                p.texture = createCircleTexture(this.app.renderer, TYPE_COLORS[type]);
                currentCounts[type]++;
            }
        }
    }

    reassignType(oldType) {
        const pool = TYPES.filter(t => t !== oldType);
        if (pool.length === 0) return;
        for (const p of this.particles) {
            if (p.type === oldType) {
                const newType = pool[Math.floor(Math.random() * pool.length)];
                p.type = newType;
                p.texture = createCircleTexture(this.app.renderer, TYPE_COLORS[newType]);
            }
        }
    }
}
