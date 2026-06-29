/* worker.js - Animated AI office worker */

const ACTIVITY_LABELS = {
    wander: 'ROAM',
    deskIdle: 'THINK',
    coffee: 'BREW',
    lounge: 'REST',
    boardIdle: 'PLAN',
    typing: 'WORK',
    whiteboard: 'MAP',
    training: 'TRAIN',
    inference: 'CHAT',
    script: 'RUN',
    compute: 'BUILD',
    working: 'TASK',
};

const ACTIVITY_COLORS = {
    wander: '#64d27d',
    deskIdle: '#64d27d',
    coffee: '#f2b84b',
    lounge: '#64d27d',
    boardIdle: '#54d4d2',
    typing: '#69a7ff',
    whiteboard: '#54d4d2',
    training: '#ff6f61',
    inference: '#69a7ff',
    script: '#f2b84b',
    compute: '#b795ff',
    working: '#54d4d2',
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function dist(aX, aY, bX, bY) {
    const dx = bX - aX;
    const dy = bY - aY;
    return Math.sqrt(dx * dx + dy * dy);
}

export class Worker {
    constructor(gpuIndex, officeLayout) {
        this.gpuIndex = gpuIndex;
        this.layout = officeLayout;

        const start = this._spot('desk');
        this.x = start.x;
        this.y = start.y;
        this.targetX = this.x;
        this.targetY = this.y;

        this.activity = 'deskIdle';
        this.workType = 'idle';
        this.workSignature = '';
        this.utilization = 0;
        this.processCount = 0;

        this.facing = 1;
        this.walkPhase = 0;
        this.animFrame = 0;
        this.stateTimer = 0;
        this.idleTimer = 0;
        this.nextIdleChange = 1.8 + Math.random() * 2.2;
        this.bobOffset = 0;
        this.motionLean = 0;

        this.bodyColor = this._pickColor(gpuIndex);
        this.size = officeLayout.scale || 1;
        this.name = `GPU ${gpuIndex}`;
        this.effects = [];
    }

    _pickColor(index) {
        const colors = ['#69a7ff', '#64d27d', '#f2b84b', '#ff6f61', '#b795ff', '#54d4d2'];
        return colors[index % colors.length];
    }

    updateFromGpu(gpuData = {}) {
        const processes = gpuData.processes || [];
        const util = gpuData.utilization || 0;
        const hasWork = processes.length > 0 || util > 8;
        const workType = this._detectWorkType(processes, util);
        const signature = processes
            .map((p) => `${p.pid || '?'}:${p.type || 'unknown'}:${p.model_name || p.name || ''}`)
            .sort()
            .join('|');

        this.utilization = util;
        this.processCount = processes.length;
        this.workType = workType;

        if (hasWork) {
            const desired = this._activityForWork(workType, util);
            if (
                desired !== this.activity ||
                signature !== this.workSignature ||
                (this._nearTarget() && this.stateTimer > 7 && desired !== 'training')
            ) {
                this._setActivity(desired, true);
            }
        } else if (this._isWorkActivity(this.activity)) {
            this._setActivity('wander', true);
        }

        this.workSignature = signature;
    }

    _detectWorkType(processes, util) {
        const types = processes.map((p) => p.type || 'unknown');
        if (types.includes('training')) return 'training';
        if (types.includes('inference')) return 'inference';
        if (types.includes('script')) return 'script';
        if (types.includes('compute')) return 'compute';
        if (types.includes('working')) return 'working';
        return util > 8 ? 'compute' : 'idle';
    }

    _activityForWork(workType, util) {
        if (workType === 'training') return 'training';
        if (workType === 'inference') return util > 70 && Math.random() < 0.2 ? 'whiteboard' : 'inference';
        if (workType === 'script') return 'script';
        if (workType === 'compute') return 'compute';
        if (workType === 'working') return util > 55 ? 'whiteboard' : 'typing';
        return 'typing';
    }

    _isWorkActivity(activity) {
        return ['typing', 'whiteboard', 'training', 'inference', 'script', 'compute', 'working'].includes(activity);
    }

    update(dt) {
        this.stateTimer += dt;
        this.animFrame += dt;
        this._move(dt);

        if (!this._isWorkActivity(this.activity)) {
            this.idleTimer += dt;
            if (this._nearTarget(4) && this.idleTimer >= this.nextIdleChange) {
                this._chooseIdleActivity();
            }
        } else {
            this._updateWorkRetargets();
        }

        this._spawnEffects(dt);
        this._updateEffects(dt);

        const walking = !this._nearTarget(2.5);
        if (walking) {
            this.bobOffset = Math.sin(this.walkPhase * 2) * 1.3;
            this.motionLean = clamp((this.targetX - this.x) / 120, -0.18, 0.18);
        } else if (this.activity === 'lounge' || this.activity === 'deskIdle') {
            this.bobOffset = Math.sin(this.animFrame * 1.7 + this.gpuIndex) * 0.9;
            this.motionLean = 0;
        } else {
            this.bobOffset = Math.sin(this.animFrame * 3.2) * 0.35;
            this.motionLean = 0;
        }
    }

    _move(dt) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 1.5) {
            return;
        }

        const speed = this._speedForActivity() * dt;
        const step = Math.min(speed, distance);
        this.x += (dx / distance) * step;
        this.y += (dy / distance) * step;
        this.walkPhase += dt * (7.5 + this.size);
        if (Math.abs(dx) > 0.8) {
            this.facing = dx > 0 ? 1 : -1;
        }
    }

    _speedForActivity() {
        if (this.activity === 'training') return 86;
        if (this.activity === 'script' || this.activity === 'compute') return 78;
        if (this.activity === 'inference' || this.activity === 'typing') return 68;
        return 52;
    }

    _updateWorkRetargets() {
        if (!this._nearTarget(5)) {
            return;
        }

        if (this.activity === 'training' && this.stateTimer > 1.4) {
            const next = Math.random() < 0.62 ? 'rack' : 'standup';
            this._setTarget(next, next === 'rack' ? 10 : 22);
            this.stateTimer = 0.45;
        } else if (this.activity === 'compute' && this.stateTimer > 3.4) {
            this._setTarget(Math.random() < 0.55 ? 'rack' : 'console', 10);
            this.stateTimer = 0.8;
        } else if (this.activity === 'script' && this.stateTimer > 4.2) {
            this._setTarget(Math.random() < 0.7 ? 'console' : 'desk', 8);
            this.stateTimer = 0.9;
        } else if (this.activity === 'whiteboard' && this.stateTimer > 5.5) {
            this._setTarget('board', 5);
            this.stateTimer = 1.2;
        }
    }

    _chooseIdleActivity() {
        const roll = Math.random();
        if (roll < 0.2) {
            this._setActivity('coffee');
        } else if (roll < 0.39) {
            this._setActivity('boardIdle');
        } else if (roll < 0.58) {
            this._setActivity('lounge');
        } else if (roll < 0.78) {
            this._setActivity('deskIdle');
        } else {
            this._setActivity('wander');
        }
    }

    _setActivity(activity, force = false) {
        if (!force && activity === this.activity && !this._nearTarget(5)) {
            return;
        }

        this.activity = activity;
        this.stateTimer = 0;
        this.idleTimer = 0;
        this.nextIdleChange = 2.2 + Math.random() * 5.2;

        const targetMap = {
            wander: ['standup', 'window', 'coffee', 'board', 'desk'],
            deskIdle: ['desk'],
            coffee: ['coffee'],
            lounge: ['lounge'],
            boardIdle: ['board'],
            typing: ['desk'],
            whiteboard: ['board'],
            training: ['rack', 'standup'],
            inference: ['desk'],
            script: ['console'],
            compute: ['rack', 'console'],
            working: ['desk'],
        };

        const spots = targetMap[activity] || ['standup'];
        const spotName = spots[Math.floor(Math.random() * spots.length)];
        const jitter = activity === 'wander' ? 20 : activity === 'training' ? 13 : 7;
        this._setTarget(spotName, jitter);
    }

    _setTarget(spotName, jitter = 0) {
        const spot = this._spot(spotName);
        const jx = jitter ? (Math.random() - 0.5) * jitter * 2 : 0;
        const jy = jitter ? (Math.random() - 0.5) * jitter : 0;
        const minX = this.layout.x + 22 * this.size;
        const maxX = this.layout.x + this.layout.w - 22 * this.size;
        const minY = this.layout.y + 46 * this.size;
        const maxY = this.layout.y + this.layout.h - 18 * this.size;
        this.targetX = clamp(spot.x + jx, minX, maxX);
        this.targetY = clamp(spot.y + jy, minY, maxY);

        if (this.targetX > this.x + 1) this.facing = 1;
        if (this.targetX < this.x - 1) this.facing = -1;
    }

    _spot(name) {
        const fallback = { x: this.layout.deskX, y: this.layout.deskY };
        return (this.layout.hotspots && this.layout.hotspots[name]) || fallback;
    }

    _nearTarget(tolerance = 3) {
        return dist(this.x, this.y, this.targetX, this.targetY) <= tolerance;
    }

    _spawnEffects(dt) {
        const rateMap = {
            training: 12,
            inference: 7,
            script: 8,
            compute: 8,
            whiteboard: 3,
            typing: 3,
            coffee: 0.8,
        };
        const rate = rateMap[this.activity] || 0.15;
        if (Math.random() > rate * dt) {
            return;
        }

        const color = ACTIVITY_COLORS[this.activity] || this.bodyColor;
        if (this.activity === 'training') {
            this.effects.push({
                kind: 'orb',
                x: this.x + (Math.random() - 0.5) * 24,
                y: this.y - 28,
                vx: (Math.random() - 0.5) * 28,
                vy: -22 - Math.random() * 34,
                life: 0.9,
                size: 2 + Math.random() * 3,
                color,
            });
        } else if (this.activity === 'script') {
            const snippets = ['run', './', '{}', 'log', 'ok'];
            this.effects.push({
                kind: 'text',
                text: snippets[Math.floor(Math.random() * snippets.length)],
                x: this.x + this.facing * (12 + Math.random() * 8),
                y: this.y - 30 - Math.random() * 10,
                vx: this.facing * (8 + Math.random() * 10),
                vy: -14 - Math.random() * 10,
                life: 1.1,
                size: 8,
                color,
            });
        } else if (this.activity === 'inference') {
            const snippets = ['tok', 'ask', 'ans', 'ctx'];
            this.effects.push({
                kind: 'bubble',
                text: snippets[Math.floor(Math.random() * snippets.length)],
                x: this.x + (Math.random() - 0.5) * 18,
                y: this.y - 42,
                vx: (Math.random() - 0.5) * 10,
                vy: -18,
                life: 1.2,
                size: 8,
                color,
            });
        } else if (this.activity === 'compute') {
            this.effects.push({
                kind: 'spark',
                x: this.x + this.facing * 18,
                y: this.y - 18 + (Math.random() - 0.5) * 14,
                vx: this.facing * (14 + Math.random() * 18),
                vy: (Math.random() - 0.5) * 22,
                life: 0.65,
                size: 2 + Math.random() * 2,
                color,
            });
        } else if (this.activity === 'coffee') {
            this.effects.push({
                kind: 'steam',
                x: this.x + 10,
                y: this.y - 10,
                vx: (Math.random() - 0.5) * 5,
                vy: -11 - Math.random() * 6,
                life: 1,
                size: 6,
                color: '#eef2ea',
            });
        } else {
            this.effects.push({
                kind: 'dot',
                x: this.x,
                y: this.y - 34,
                vx: (Math.random() - 0.5) * 8,
                vy: -8,
                life: 0.7,
                size: 1.7,
                color,
            });
        }
    }

    _updateEffects(dt) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const p = this.effects[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.kind === 'spark' ? 22 : 12) * dt;
            p.life -= dt * (p.kind === 'bubble' ? 0.75 : 1.15);
            if (p.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
        if (this.effects.length > 80) {
            this.effects.splice(0, this.effects.length - 80);
        }
    }

    draw(ctx) {
        const x = this.x;
        const y = this.y + this.bobOffset;
        const s = this.size;
        const walking = !this._nearTarget(2.5);

        ctx.save();
        this._drawEffects(ctx, true);

        if (walking) {
            this._drawMotionGhost(ctx, x, y, s);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.beginPath();
        ctx.ellipse(x, y + 19 * s, 15 * s, 4.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.activity === 'lounge') {
            this._drawLounge(ctx, x, y, s);
        } else if (this.activity === 'coffee') {
            this._drawCoffee(ctx, x, y, s, walking);
        } else if (this.activity === 'whiteboard' || this.activity === 'boardIdle') {
            this._drawBoardWork(ctx, x, y, s, walking);
        } else if (this.activity === 'training') {
            this._drawTraining(ctx, x, y, s, walking);
        } else if (this.activity === 'script') {
            this._drawScript(ctx, x, y, s, walking);
        } else if (this.activity === 'compute') {
            this._drawCompute(ctx, x, y, s, walking);
        } else if (this.activity === 'typing' || this.activity === 'inference' || this.activity === 'working') {
            this._drawTyping(ctx, x, y, s, walking);
        } else {
            this._drawAgent(ctx, x, y, s, { pose: 'idle', walking });
        }

        this._drawEffects(ctx, false);
        this._drawStatusTag(ctx, x, y, s);
        ctx.restore();
    }

    _drawEffects(ctx, behind) {
        for (const p of this.effects) {
            const textLike = p.kind === 'text' || p.kind === 'bubble';
            if (behind === textLike) {
                continue;
            }

            ctx.save();
            ctx.globalAlpha = clamp(p.life, 0, 1);
            if (p.kind === 'orb' || p.kind === 'dot') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.kind === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 0.12, p.y - p.vy * 0.12);
                ctx.stroke();
            } else if (p.kind === 'steam') {
                ctx.strokeStyle = 'rgba(238,242,234,0.55)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.quadraticCurveTo(p.x + Math.sin(this.animFrame * 5) * 5, p.y - 8, p.x, p.y - 16);
                ctx.stroke();
            } else if (p.kind === 'bubble') {
                ctx.font = `${p.size}px monospace`;
                const width = ctx.measureText(p.text).width + 10;
                ctx.fillStyle = 'rgba(9, 11, 13, 0.74)';
                ctx.strokeStyle = this._withAlpha(p.color, 0.6);
                ctx.beginPath();
                ctx.roundRect(p.x - width / 2, p.y - 11, width, 15, 7);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = p.color;
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else if (p.kind === 'text') {
                ctx.font = `${p.size}px monospace`;
                ctx.fillStyle = p.color;
                ctx.fillText(p.text, p.x, p.y);
            }
            ctx.restore();
        }
    }

    _drawMotionGhost(ctx, x, y, s) {
        ctx.globalAlpha = 0.16;
        this._drawAgent(ctx, x - this.facing * 8 * s, y, s, { pose: 'idle', walking: true, ghost: true });
        ctx.globalAlpha = 1;
    }

    _drawTyping(ctx, x, y, s, walking) {
        this._drawAgent(ctx, x, y, s, { pose: 'typing', walking });
        if (!walking) {
            ctx.fillStyle = this._withAlpha(ACTIVITY_COLORS[this.activity], 0.26);
            ctx.beginPath();
            ctx.ellipse(x + this.facing * 18 * s, y - 15 * s, 12 * s, 5 * s, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawBoardWork(ctx, x, y, s, walking) {
        this._drawAgent(ctx, x, y, s, { pose: 'board', walking });
        if (!walking) {
            ctx.strokeStyle = ACTIVITY_COLORS[this.activity];
            ctx.lineWidth = 1.6 * s;
            const dir = this.facing;
            ctx.beginPath();
            ctx.moveTo(x + dir * 13 * s, y - 17 * s);
            ctx.lineTo(x + dir * 25 * s, y - 23 * s + Math.sin(this.animFrame * 7) * 4 * s);
            ctx.stroke();
        }
    }

    _drawTraining(ctx, x, y, s, walking) {
        const glow = ctx.createRadialGradient(x, y - 12 * s, 4 * s, x, y - 12 * s, 36 * s);
        glow.addColorStop(0, 'rgba(255,111,97,0.22)');
        glow.addColorStop(1, 'rgba(255,111,97,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y - 12 * s, 36 * s, 0, Math.PI * 2);
        ctx.fill();
        this._drawAgent(ctx, x, y, s, { pose: 'training', walking });
    }

    _drawScript(ctx, x, y, s, walking) {
        this._drawAgent(ctx, x, y, s, { pose: 'tablet', walking });
        if (!walking) {
            const tabletX = this.facing > 0 ? x + 9 * s : x - 31 * s;
            ctx.fillStyle = '#080a0c';
            ctx.beginPath();
            ctx.roundRect(tabletX, y - 26 * s, 22 * s, 15 * s, 3 * s);
            ctx.fill();
            ctx.fillStyle = ACTIVITY_COLORS.script;
            ctx.fillRect(tabletX + 4 * s, y - 22 * s, 14 * s, 1.5 * s);
            ctx.fillRect(tabletX + 4 * s, y - 18 * s, 9 * s, 1.5 * s);
        }
    }

    _drawCompute(ctx, x, y, s, walking) {
        this._drawAgent(ctx, x, y, s, { pose: 'carry', walking });
        if (!walking) {
            ctx.strokeStyle = ACTIVITY_COLORS.compute;
            ctx.lineWidth = 1.2 * s;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const yy = y - 29 * s + i * 7 * s;
                ctx.moveTo(x - 19 * s, yy);
                ctx.lineTo(x + 19 * s, yy + Math.sin(this.animFrame * 4 + i) * 3 * s);
            }
            ctx.stroke();
        }
    }

    _drawCoffee(ctx, x, y, s, walking) {
        this._drawAgent(ctx, x, y, s, { pose: 'coffee', walking });
        if (!walking) {
            ctx.fillStyle = '#f2b84b';
            ctx.beginPath();
            ctx.roundRect(x + this.facing * 14 * s, y - 15 * s, 7 * s, 7 * s, 2 * s);
            ctx.fill();
        }
    }

    _drawLounge(ctx, x, y, s) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.08 * this.facing);
        ctx.translate(-x, -y);

        ctx.strokeStyle = '#2a3038';
        ctx.lineWidth = 5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 6 * s, y + 2 * s);
        ctx.lineTo(x - 12 * s, y + 14 * s);
        ctx.moveTo(x + 4 * s, y + 2 * s);
        ctx.lineTo(x + 13 * s, y + 13 * s);
        ctx.stroke();

        this._drawAgent(ctx, x, y - 2 * s, s, { pose: 'lounge', walking: false });
        ctx.restore();
    }

    _drawAgent(ctx, x, y, s, options = {}) {
        const pose = options.pose || 'idle';
        const walking = options.walking;
        const dir = this.facing;
        const phase = walking ? Math.sin(this.walkPhase) : Math.sin(this.animFrame * 2.2) * 0.15;
        const color = ACTIVITY_COLORS[this.activity] || this.bodyColor;
        const jacket = options.ghost ? this._withAlpha(this.bodyColor, 0.85) : this.bodyColor;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.motionLean);
        ctx.translate(-x, -y);

        ctx.strokeStyle = '#232a32';
        ctx.lineWidth = 5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 5 * s, y + 2 * s);
        ctx.lineTo(x - 6 * s + phase * 6 * s, y + 17 * s);
        ctx.moveTo(x + 5 * s, y + 2 * s);
        ctx.lineTo(x + 6 * s - phase * 6 * s, y + 17 * s);
        ctx.stroke();

        ctx.fillStyle = jacket;
        ctx.beginPath();
        ctx.roundRect(x - 11 * s, y - 16 * s, 22 * s, 21 * s, 5 * s);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(x - 7 * s, y - 11 * s, 14 * s, 2 * s);

        this._drawArms(ctx, x, y, s, pose, walking, color, dir, phase);

        ctx.fillStyle = '#101418';
        ctx.beginPath();
        ctx.roundRect(x - 13 * s, y - 38 * s, 26 * s, 20 * s, 5 * s);
        ctx.fill();
        ctx.strokeStyle = this._withAlpha(color, 0.7);
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        ctx.fillStyle = this._withAlpha(color, 0.2);
        ctx.beginPath();
        ctx.roundRect(x - 9 * s, y - 34 * s, 18 * s, 12 * s, 3 * s);
        ctx.fill();

        const blink = Math.sin(this.animFrame * 5 + this.gpuIndex) > 0.92;
        ctx.fillStyle = color;
        if (blink) {
            ctx.fillRect(x - 6 * s, y - 28 * s, 4 * s, 1.4 * s);
            ctx.fillRect(x + 2 * s, y - 28 * s, 4 * s, 1.4 * s);
        } else {
            ctx.beginPath();
            ctx.arc(x - 5 * s, y - 28 * s, 1.8 * s, 0, Math.PI * 2);
            ctx.arc(x + 5 * s, y - 28 * s, 1.8 * s, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = this._withAlpha(color, 0.5);
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath();
        ctx.moveTo(x, y - 38 * s);
        ctx.lineTo(x, y - 44 * s);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - 45 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawArms(ctx, x, y, s, pose, walking, color, dir, phase) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();

        if (walking) {
            ctx.moveTo(x - 9 * s, y - 10 * s);
            ctx.lineTo(x - 13 * s - phase * 5 * s, y - 1 * s);
            ctx.moveTo(x + 9 * s, y - 10 * s);
            ctx.lineTo(x + 13 * s + phase * 5 * s, y - 1 * s);
        } else if (pose === 'typing') {
            const tap = Math.sin(this.animFrame * 15) * 3 * s;
            ctx.moveTo(x - 8 * s, y - 10 * s);
            ctx.lineTo(x - 17 * s, y - 3 * s + tap);
            ctx.moveTo(x + 8 * s, y - 10 * s);
            ctx.lineTo(x + 17 * s, y - 3 * s - tap);
        } else if (pose === 'board') {
            ctx.moveTo(x - 8 * s, y - 10 * s);
            ctx.lineTo(x - 11 * s, y + 0 * s);
            ctx.moveTo(x + 8 * s, y - 10 * s);
            ctx.lineTo(x + dir * 22 * s, y - 22 * s + Math.sin(this.animFrame * 8) * 2 * s);
        } else if (pose === 'training') {
            const pump = Math.sin(this.animFrame * 10) * 4 * s;
            ctx.moveTo(x - 8 * s, y - 10 * s);
            ctx.lineTo(x - 18 * s, y - 27 * s + pump);
            ctx.moveTo(x + 8 * s, y - 10 * s);
            ctx.lineTo(x + 18 * s, y - 27 * s - pump);
        } else if (pose === 'tablet' || pose === 'carry') {
            ctx.moveTo(x - 8 * s, y - 10 * s);
            ctx.lineTo(x - 12 * s, y - 1 * s);
            ctx.moveTo(x + 8 * s, y - 10 * s);
            ctx.lineTo(x + dir * 18 * s, y - 18 * s);
        } else if (pose === 'coffee') {
            ctx.moveTo(x - 8 * s, y - 10 * s);
            ctx.lineTo(x - 10 * s, y + 0 * s);
            ctx.moveTo(x + 8 * s, y - 10 * s);
            ctx.lineTo(x + dir * 18 * s, y - 11 * s);
        } else if (pose === 'lounge') {
            ctx.moveTo(x - 8 * s, y - 10 * s);
            ctx.lineTo(x - 17 * s, y - 3 * s);
            ctx.moveTo(x + 8 * s, y - 10 * s);
            ctx.lineTo(x + 17 * s, y - 3 * s);
        } else {
            const sway = Math.sin(this.animFrame * 2.1) * 2 * s;
            ctx.moveTo(x - 8 * s, y - 10 * s);
            ctx.lineTo(x - 13 * s, y - 1 * s + sway);
            ctx.moveTo(x + 8 * s, y - 10 * s);
            ctx.lineTo(x + 13 * s, y - 1 * s - sway);
        }
        ctx.stroke();
    }

    _drawStatusTag(ctx, x, y, s) {
        const label = ACTIVITY_LABELS[this.activity] || 'AI';
        const color = ACTIVITY_COLORS[this.activity] || this.bodyColor;
        ctx.font = `${Math.max(8, 9 * s)}px sans-serif`;
        const name = this.name.length > 12 ? this.name.slice(0, 11) : this.name;
        const text = `${label} ${name}`;
        const width = Math.min(92 * s, ctx.measureText(text).width + 16 * s);
        const tagX = x - width / 2;
        const tagY = y - 62 * s;

        ctx.fillStyle = 'rgba(9, 11, 13, 0.72)';
        ctx.strokeStyle = this._withAlpha(color, 0.62);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, width, 17 * s, 8 * s);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, tagY + 8.5 * s, width - 8 * s);
        ctx.textBaseline = 'alphabetic';
    }

    _withAlpha(hex, alpha) {
        const parsed = hex.replace('#', '');
        const bigint = Number.parseInt(parsed, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
    }
}
