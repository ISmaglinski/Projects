/* worker.js - Process-driven pixel agents */

const ACTIVITY_LABELS = {
    wander: 'ROAM',
    deskIdle: 'THINK',
    coffee: 'BREW',
    lounge: 'REST',
    boardIdle: 'PLAN',
    inference: 'INFER',
    training: 'TRAIN',
    script: 'SCRIPT',
    compute: 'COMPUTE',
    working: 'WORK',
};

const ACTIVITY_COLORS = {
    wander: '#64d27d',
    deskIdle: '#64d27d',
    coffee: '#f2b84b',
    lounge: '#64d27d',
    boardIdle: '#54d4d2',
    inference: '#69a7ff',
    training: '#ff6f61',
    script: '#f2b84b',
    compute: '#b795ff',
    working: '#54d4d2',
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function bytesToMb(bytes) {
    return Math.round((bytes || 0) / 1024 ** 2);
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
        this.primaryProcess = null;
        this.taskName = `GPU ${gpuIndex}`;
        this.taskMeta = 'standby';
        this.lockedToWork = false;
        this.utilization = 0;
        this.processCount = 0;

        this.facing = 1;
        this.walkPhase = 0;
        this.animFrame = 0;
        this.stateTimer = 0;
        this.idleTimer = 0;
        this.nextIdleChange = 2.2 + Math.random() * 2.8;
        this.nextWorkMove = 1.4;
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
        const workType = this._detectWorkType(processes, util);
        const primary = this._primaryProcess(processes);
        const signature = processes
            .map((p) => `${p.pid || '?'}:${p.type || 'unknown'}:${p.model_name || p.name || ''}`)
            .sort()
            .join('|');
        const hasWork = processes.length > 0 || util > 8;

        this.utilization = util;
        this.processCount = processes.length;
        this.workType = workType;
        this.primaryProcess = primary;
        this.lockedToWork = hasWork;

        if (primary) {
            this.taskName = this._taskName(primary);
            this.taskMeta = `pid ${primary.pid || '--'} vram ${bytesToMb(primary.vram_used)}MB`;
        } else if (hasWork) {
            this.taskName = `${workType} workload`;
            this.taskMeta = `gpu ${Math.round(util)}%`;
        } else {
            this.taskName = this.name;
            this.taskMeta = 'standby';
        }

        if (hasWork) {
            const desired = this._activityForWork(workType);
            if (desired !== this.activity || signature !== this.workSignature || !this._isWorkActivity(this.activity)) {
                this._setActivity(desired, true);
            }
        } else if (this._isWorkActivity(this.activity)) {
            this._setActivity('deskIdle', true);
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

    _primaryProcess(processes) {
        if (!processes.length) return null;
        return [...processes].sort((a, b) => (b.vram_used || 0) - (a.vram_used || 0))[0];
    }

    _taskName(proc) {
        return proc.model_name || proc.name || proc.cmdline || `pid ${proc.pid || '--'}`;
    }

    _activityForWork(workType) {
        if (workType === 'training') return 'training';
        if (workType === 'inference') return 'inference';
        if (workType === 'script') return 'script';
        if (workType === 'compute') return 'compute';
        return 'working';
    }

    _isWorkActivity(activity) {
        return ['inference', 'training', 'script', 'compute', 'working'].includes(activity);
    }

    update(dt) {
        this.stateTimer += dt;
        this.animFrame += dt;

        if (this.lockedToWork) {
            this._maintainWorkTarget();
        } else {
            this._maintainIdleTarget(dt);
        }

        this._move(dt);
        this._spawnEffects(dt);
        this._updateEffects(dt);

        const walking = !this._nearTarget(2.5);
        if (walking) {
            this.bobOffset = Math.sin(this.walkPhase * 2) * 1.2;
            this.motionLean = clamp((this.targetX - this.x) / 130, -0.16, 0.16);
        } else if (this.activity === 'lounge' || this.activity === 'deskIdle') {
            this.bobOffset = Math.sin(this.animFrame * 1.8 + this.gpuIndex) * 0.75;
            this.motionLean = 0;
        } else {
            this.bobOffset = Math.sin(this.animFrame * 3.1) * 0.35;
            this.motionLean = 0;
        }
    }

    _maintainWorkTarget() {
        if (!this._nearTarget(5) || this.stateTimer < this.nextWorkMove) {
            return;
        }

        const targetMap = {
            inference: ['desk', 'process', 'desk', 'console'],
            training: ['rack', 'process', 'board', 'rack'],
            script: ['console', 'desk', 'process', 'console'],
            compute: ['rack', 'console', 'rack', 'process'],
            working: ['desk', 'console', 'board'],
        };
        const route = targetMap[this.activity] || ['desk'];
        const next = route[Math.floor(Math.random() * route.length)];
        const jitter = this.activity === 'training' || this.activity === 'compute' ? 9 : 5;
        this._setTarget(next, jitter);
        this.stateTimer = 0;
        this.nextWorkMove = this._workMoveDelay();
    }

    _maintainIdleTarget(dt) {
        this.idleTimer += dt;
        if (this._nearTarget(4) && this.idleTimer >= this.nextIdleChange) {
            this._chooseIdleActivity();
        }
    }

    _workMoveDelay() {
        if (this.activity === 'inference') return 4.8 + Math.random() * 2.4;
        if (this.activity === 'script') return 3.1 + Math.random() * 1.5;
        if (this.activity === 'training') return 1.5 + Math.random() * 1.2;
        if (this.activity === 'compute') return 2.0 + Math.random() * 1.1;
        return 3.4 + Math.random() * 1.6;
    }

    _move(dt) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 1.5) return;

        const speed = this._speedForActivity() * dt;
        const step = Math.min(speed, dist);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        this.walkPhase += dt * (7.2 + this.size);
        if (Math.abs(dx) > 0.6) this.facing = dx > 0 ? 1 : -1;
    }

    _speedForActivity() {
        if (this.activity === 'training') return 86;
        if (this.activity === 'compute' || this.activity === 'script') return 74;
        if (this.activity === 'inference' || this.activity === 'working') return 62;
        return 48;
    }

    _chooseIdleActivity() {
        const roll = Math.random();
        if (roll < 0.24) this._setActivity('deskIdle');
        else if (roll < 0.44) this._setActivity('boardIdle');
        else if (roll < 0.62) this._setActivity('coffee');
        else if (roll < 0.78) this._setActivity('lounge');
        else this._setActivity('wander');
    }

    _setActivity(activity, force = false) {
        if (!force && activity === this.activity && !this._nearTarget(5)) return;

        this.activity = activity;
        this.stateTimer = 0;
        this.idleTimer = 0;
        this.nextIdleChange = 2.4 + Math.random() * 5.4;
        this.nextWorkMove = this._workMoveDelay();

        const targetMap = {
            wander: ['standup', 'window', 'board', 'desk'],
            deskIdle: ['desk'],
            coffee: ['coffee'],
            lounge: ['lounge'],
            boardIdle: ['board'],
            inference: ['desk'],
            training: ['rack'],
            script: ['console'],
            compute: ['rack'],
            working: ['desk'],
        };
        const spots = targetMap[activity] || ['standup'];
        const spotName = spots[Math.floor(Math.random() * spots.length)];
        const jitter = this.lockedToWork ? 4 : 15;
        this._setTarget(spotName, jitter);
    }

    _setTarget(spotName, jitter = 0) {
        const spot = this._spot(spotName);
        const jx = jitter ? (Math.random() - 0.5) * jitter * 2 : 0;
        const jy = jitter ? (Math.random() - 0.5) * jitter : 0;
        const minX = this.layout.x + 24 * this.size;
        const maxX = this.layout.x + this.layout.w - 24 * this.size;
        const minY = this.layout.y + 50 * this.size;
        const maxY = this.layout.y + this.layout.h - 24 * this.size;
        this.targetX = clamp(spot.x + jx, minX, maxX);
        this.targetY = clamp(spot.y + jy, minY, maxY);
        if (this.targetX > this.x + 1) this.facing = 1;
        if (this.targetX < this.x - 1) this.facing = -1;
    }

    _spot(name) {
        return (this.layout.hotspots && this.layout.hotspots[name]) || {
            x: this.layout.deskX,
            y: this.layout.deskY,
        };
    }

    _nearTarget(tolerance = 3) {
        return distance(this.x, this.y, this.targetX, this.targetY) <= tolerance;
    }

    _spawnEffects(dt) {
        const rates = {
            inference: 13,
            training: 15,
            script: 11,
            compute: 12,
            working: 6,
            coffee: 1,
            boardIdle: 0.5,
            deskIdle: 0.25,
        };
        const rate = rates[this.activity] || 0.15;
        if (Math.random() > rate * dt) return;

        const color = ACTIVITY_COLORS[this.activity] || this.bodyColor;
        if (this.activity === 'inference') {
            const tokens = ['tok', 'ctx', 'attn', 'kv', 'logit', 'resp'];
            this.effects.push(this._effect('bubble', tokens[Math.floor(Math.random() * tokens.length)], color));
        } else if (this.activity === 'training') {
            const text = Math.random() < 0.35 ? `loss ${(Math.random() * 0.8 + 0.1).toFixed(2)}` : '';
            this.effects.push(this._effect(text ? 'text' : 'orb', text, color));
        } else if (this.activity === 'script') {
            const chunks = ['run', './', 'ok', 'log', '{}', 'sh'];
            this.effects.push(this._effect('text', chunks[Math.floor(Math.random() * chunks.length)], color));
        } else if (this.activity === 'compute') {
            this.effects.push(this._effect('spark', '', color));
        } else if (this.activity === 'coffee') {
            this.effects.push(this._effect('steam', '', '#eef2ea'));
        } else {
            this.effects.push(this._effect('dot', '', color));
        }
    }

    _effect(kind, text, color) {
        if (kind === 'spark') {
            return {
                kind,
                text,
                color,
                x: this.x + this.facing * 19 * this.size,
                y: this.y - 18 * this.size + (Math.random() - 0.5) * 13 * this.size,
                vx: this.facing * (18 + Math.random() * 24),
                vy: (Math.random() - 0.5) * 24,
                size: 2 + Math.random() * 2,
                life: 0.62,
            };
        }
        return {
            kind,
            text,
            color,
            x: this.x + (Math.random() - 0.5) * 18 * this.size,
            y: this.y - 43 * this.size - Math.random() * 7 * this.size,
            vx: (Math.random() - 0.5) * 18,
            vy: -14 - Math.random() * 19,
            size: kind === 'orb' ? 2 + Math.random() * 3 : 8,
            life: kind === 'bubble' ? 1.15 : 0.92,
        };
    }

    _updateEffects(dt) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const p = this.effects[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.kind === 'spark' ? 24 : 10) * dt;
            p.life -= dt * (p.kind === 'bubble' ? 0.7 : 1.12);
            if (p.life <= 0) this.effects.splice(i, 1);
        }
        if (this.effects.length > 90) {
            this.effects.splice(0, this.effects.length - 90);
        }
    }

    draw(ctx) {
        const x = this.x;
        const y = this.y + this.bobOffset;
        const s = this.size;
        const walking = !this._nearTarget(2.5);

        ctx.save();
        this._drawEffects(ctx, true);
        if (walking) this._drawMotionTrail(ctx, x, y, s);

        ctx.fillStyle = 'rgba(0,0,0,0.36)';
        ctx.beginPath();
        ctx.ellipse(x, y + 18 * s, 15 * s, 4.2 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        const pose = this._poseForActivity();
        this._drawPixelAgent(ctx, x, y, s, pose, walking);
        this._drawHeldTool(ctx, x, y, s, pose, walking);
        this._drawEffects(ctx, false);
        this._drawStatusTag(ctx, x, y, s);
        ctx.restore();
    }

    _poseForActivity() {
        if (this.activity === 'inference') return 'typing';
        if (this.activity === 'training') return 'training';
        if (this.activity === 'script') return 'tablet';
        if (this.activity === 'compute') return 'rack';
        if (this.activity === 'working') return 'typing';
        if (this.activity === 'boardIdle') return 'board';
        if (this.activity === 'coffee') return 'coffee';
        if (this.activity === 'lounge') return 'lounge';
        return 'idle';
    }

    _drawPixelAgent(ctx, x, y, s, pose, walking) {
        const color = ACTIVITY_COLORS[this.activity] || this.bodyColor;
        const phase = walking ? Math.sin(this.walkPhase) : Math.sin(this.animFrame * 2.3) * 0.15;
        const dir = this.facing;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.motionLean);
        ctx.translate(-x, -y);

        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = '#14191f';
        ctx.fillRect(x - 8 * s + phase * 4 * s, y + 2 * s, 6 * s, 15 * s);
        ctx.fillRect(x + 2 * s - phase * 4 * s, y + 2 * s, 6 * s, 15 * s);
        ctx.fillStyle = '#080a0c';
        ctx.fillRect(x - 9 * s + phase * 4 * s, y + 15 * s, 8 * s, 4 * s);
        ctx.fillRect(x + 1 * s - phase * 4 * s, y + 15 * s, 8 * s, 4 * s);

        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(x - 13 * s, y - 18 * s, 26 * s, 22 * s);
        ctx.fillStyle = this._withAlpha(color, 0.8);
        ctx.fillRect(x - 10 * s, y - 15 * s, 20 * s, 4 * s);
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(x - 6 * s, y - 7 * s, 12 * s, 2 * s);

        this._drawPixelArms(ctx, x, y, s, pose, walking, color, dir, phase);

        ctx.fillStyle = '#0b0f13';
        ctx.fillRect(x - 14 * s, y - 40 * s, 28 * s, 21 * s);
        ctx.fillStyle = '#151c23';
        ctx.fillRect(x - 11 * s, y - 37 * s, 22 * s, 15 * s);
        ctx.strokeStyle = this._withAlpha(color, 0.74);
        ctx.lineWidth = Math.max(1, 1.4 * s);
        ctx.strokeRect(x - 14 * s, y - 40 * s, 28 * s, 21 * s);

        const blink = Math.sin(this.animFrame * 5.2 + this.gpuIndex) > 0.94;
        ctx.fillStyle = color;
        if (blink) {
            ctx.fillRect(x - 7 * s, y - 31 * s, 5 * s, 1.5 * s);
            ctx.fillRect(x + 2 * s, y - 31 * s, 5 * s, 1.5 * s);
        } else {
            ctx.fillRect(x - 7 * s, y - 32 * s, 4 * s, 4 * s);
            ctx.fillRect(x + 3 * s, y - 32 * s, 4 * s, 4 * s);
        }

        ctx.strokeStyle = this._withAlpha(color, 0.52);
        ctx.beginPath();
        ctx.moveTo(x, y - 40 * s);
        ctx.lineTo(x, y - 47 * s);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(x - 2 * s, y - 50 * s, 4 * s, 4 * s);

        ctx.restore();
    }

    _drawPixelArms(ctx, x, y, s, pose, walking, color, dir, phase) {
        ctx.fillStyle = color;
        if (walking) {
            ctx.fillRect(x - 19 * s - phase * 4 * s, y - 14 * s, 6 * s, 19 * s);
            ctx.fillRect(x + 13 * s + phase * 4 * s, y - 14 * s, 6 * s, 19 * s);
            return;
        }

        if (pose === 'typing') {
            const tap = Math.sin(this.animFrame * 16) * 2 * s;
            ctx.fillRect(x - 20 * s, y - 11 * s + tap, 8 * s, 16 * s);
            ctx.fillRect(x + 12 * s, y - 11 * s - tap, 8 * s, 16 * s);
        } else if (pose === 'training') {
            const pump = Math.sin(this.animFrame * 10) * 5 * s;
            ctx.fillRect(x - 21 * s, y - 29 * s + pump, 7 * s, 19 * s);
            ctx.fillRect(x + 14 * s, y - 29 * s - pump, 7 * s, 19 * s);
        } else if (pose === 'tablet' || pose === 'rack') {
            ctx.fillRect(x - 19 * s, y - 12 * s, 7 * s, 16 * s);
            ctx.fillRect(x + dir * 13 * s, y - 22 * s, 7 * s, 17 * s);
        } else if (pose === 'board') {
            ctx.fillRect(x - 19 * s, y - 12 * s, 7 * s, 17 * s);
            ctx.fillRect(x + dir * 13 * s, y - 30 * s + Math.sin(this.animFrame * 8) * 3 * s, 7 * s, 18 * s);
        } else if (pose === 'coffee') {
            ctx.fillRect(x - 19 * s, y - 12 * s, 7 * s, 16 * s);
            ctx.fillRect(x + dir * 14 * s, y - 18 * s, 7 * s, 12 * s);
        } else if (pose === 'lounge') {
            ctx.fillRect(x - 20 * s, y - 9 * s, 8 * s, 10 * s);
            ctx.fillRect(x + 12 * s, y - 9 * s, 8 * s, 10 * s);
        } else {
            const sway = Math.sin(this.animFrame * 2.1) * 2 * s;
            ctx.fillRect(x - 19 * s, y - 12 * s + sway, 7 * s, 17 * s);
            ctx.fillRect(x + 12 * s, y - 12 * s - sway, 7 * s, 17 * s);
        }
    }

    _drawHeldTool(ctx, x, y, s, pose, walking) {
        if (walking) return;
        const color = ACTIVITY_COLORS[this.activity] || this.bodyColor;
        const dir = this.facing;
        if (pose === 'tablet') {
            const tx = dir > 0 ? x + 18 * s : x - 37 * s;
            ctx.fillStyle = '#06080a';
            ctx.fillRect(tx, y - 28 * s, 19 * s, 15 * s);
            ctx.fillStyle = color;
            ctx.fillRect(tx + 4 * s, y - 24 * s, 11 * s, 2 * s);
            ctx.fillRect(tx + 4 * s, y - 19 * s, 7 * s, 2 * s);
        } else if (pose === 'rack') {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.4 * s;
            ctx.beginPath();
            ctx.moveTo(x + dir * 18 * s, y - 20 * s);
            ctx.lineTo(x + dir * 31 * s, y - 28 * s + Math.sin(this.animFrame * 11) * 4 * s);
            ctx.stroke();
        } else if (pose === 'coffee') {
            ctx.fillStyle = '#f2b84b';
            ctx.fillRect(x + dir * 18 * s, y - 16 * s, 8 * s, 7 * s);
        }
    }

    _drawMotionTrail(ctx, x, y, s) {
        ctx.globalAlpha = 0.12;
        this._drawPixelAgent(ctx, x - this.facing * 8 * s, y, s, 'idle', true);
        ctx.globalAlpha = 1;
    }

    _drawEffects(ctx, behind) {
        for (const p of this.effects) {
            const foreground = p.kind === 'text' || p.kind === 'bubble';
            if (behind === foreground) continue;

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
                ctx.strokeStyle = 'rgba(238,242,234,0.58)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.quadraticCurveTo(p.x + Math.sin(this.animFrame * 5) * 5, p.y - 8, p.x, p.y - 16);
                ctx.stroke();
            } else if (p.kind === 'bubble') {
                ctx.font = `${p.size}px monospace`;
                const width = ctx.measureText(p.text).width + 10;
                ctx.fillStyle = 'rgba(7, 9, 11, 0.8)';
                ctx.strokeStyle = this._withAlpha(p.color, 0.66);
                ctx.beginPath();
                ctx.roundRect(p.x - width / 2, p.y - 11, width, 15, 6);
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

    _drawStatusTag(ctx, x, y, s) {
        const color = ACTIVITY_COLORS[this.activity] || this.bodyColor;
        const label = ACTIVITY_LABELS[this.activity] || 'AI';
        const task = this.lockedToWork ? this.taskName : this.name;
        const text = `${label} ${this._shortTask(task)}`;
        ctx.font = `${Math.max(8, 9 * s)}px monospace`;
        const width = Math.min(142 * s, ctx.measureText(text).width + 16 * s);
        const tagX = x - width / 2;
        const tagY = y - 66 * s;

        ctx.fillStyle = 'rgba(7, 9, 11, 0.78)';
        ctx.strokeStyle = this._withAlpha(color, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, width, 18 * s, 7 * s);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, tagY + 8.8 * s, width - 8 * s);

        if (this.lockedToWork && this.taskMeta) {
            ctx.font = `${Math.max(7, 7.5 * s)}px monospace`;
            const metaW = Math.min(112 * s, ctx.measureText(this.taskMeta).width + 12 * s);
            ctx.fillStyle = 'rgba(7, 9, 11, 0.62)';
            ctx.beginPath();
            ctx.roundRect(x - metaW / 2, tagY + 20 * s, metaW, 14 * s, 6 * s);
            ctx.fill();
            ctx.fillStyle = '#9aa39a';
            ctx.fillText(this.taskMeta, x, tagY + 27 * s, metaW - 7 * s);
        }
        ctx.textBaseline = 'alphabetic';
    }

    _shortTask(task) {
        const value = String(task || '').replace(/\s+/g, ' ');
        if (value.length <= 16) return value;
        return `${value.slice(0, 15)}...`;
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
