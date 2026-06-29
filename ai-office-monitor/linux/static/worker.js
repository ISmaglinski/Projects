/* worker.js - Animated figure class for office workers */

export class Worker {
    constructor(gpuIndex, officeLayout) {
        this.gpuIndex = gpuIndex;
        this.layout = officeLayout; // {x, y, w, h, deskX, deskY, whiteboardX, whiteboardY, loungeX, loungeY}

        // Position (starts at desk)
        this.x = officeLayout.deskX;
        this.y = officeLayout.deskY;
        this.targetX = this.x;
        this.targetY = this.y;

        // State: 'idle' | 'walking' | 'typing' | 'whiteboard' | 'training' | 'lounge'
        this.state = 'idle';
        this.prevState = 'idle';

        // Animation
        this.facing = 1; // 1 = right, -1 = left
        this.walkPhase = 0;
        this.animFrame = 0;
        this.stateTimer = 0;
        this.bobOffset = 0;

        // Visual properties
        this.bodyColor = this._pickColor(gpuIndex);
        this.size = 1; // scale factor
        this.name = `GPU ${gpuIndex}`;

        // Particle effects (for training)
        this.particles = [];
    }

    _pickColor(index) {
        const colors = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#ff7b72'];
        return colors[index % colors.length];
    }

    /**
     * Update worker state based on GPU data.
     * @param {Object} gpuData - GPU info from backend
     */
    updateFromGpu(gpuData) {
        const util = gpuData.utilization || 0;
        const processes = gpuData.processes || [];
        const hasWork = processes.length > 0;

        // Determine work type from processes
        let workType = 'idle';
        if (hasWork) {
            const types = processes.map(p => p.type);
            if (types.includes('training')) {
                workType = 'training';
            } else if (types.includes('inference')) {
                workType = 'inference';
            } else if (types.includes('compute')) {
                workType = 'compute';
            } else {
                workType = 'working';
            }
        }

        // Decide target state
        let newState;
        if (util > 5 && hasWork) {
            if (workType === 'training') {
                newState = 'training';
            } else if (workType === 'inference' || workType === 'compute' || workType === 'working') {
                // Alternate between typing and whiteboard for variety
                newState = this._shouldGoToWhiteboard(gpuData) ? 'whiteboard' : 'typing';
            }
        } else if (util > 0 && !hasWork) {
            // Some GPU utilization but no detectable process - typing
            newState = 'typing';
        } else {
            // Idle - go lounge occasionally
            newState = Math.random() < 0.3 ? 'lounge' : 'idle';
        }

        // Only change state if current task is "complete" (or forced)
        if (newState !== this.state && this.stateTimer > 30) {
            this._setState(newState);
        }
    }

    _shouldGoToWhiteboard(gpuData) {
        // Go to whiteboard when there's high utilization
        return (gpuData.utilization || 0) > 60;
    }

    _setState(newState) {
        this.prevState = this.state;
        this.state = newState;
        this.stateTimer = 0;

        switch (newState) {
            case 'typing':
                this.targetX = this.layout.deskX;
                this.targetY = this.layout.deskY;
                break;
            case 'whiteboard':
                this.targetX = this.layout.whiteboardX;
                this.targetY = this.layout.whiteboardY;
                break;
            case 'training':
                // Training: pace in the middle of the office
                this.targetX = this.layout.x + this.layout.w / 2;
                this.targetY = this.layout.y + this.layout.h / 2 + 20;
                break;
            case 'lounge':
                this.targetX = this.layout.loungeX;
                this.targetY = this.layout.loungeY;
                break;
            case 'idle':
            default:
                // Sit at desk but not typing
                this.targetX = this.layout.deskX;
                this.targetY = this.layout.deskY;
                break;
        }

        // Face direction of movement
        if (this.targetX > this.x) this.facing = 1;
        else if (this.targetX < this.x) this.facing = -1;
    }

    update(dt) {
        this.stateTimer += dt;
        this.animFrame += dt;

        // Movement
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
            // Walking
            const speed = 60 * dt; // pixels per second
            const move = Math.min(speed, dist);
            this.x += (dx / dist) * move;
            this.y += (dy / dist) * move;
            this.walkPhase += dt * 8;
            if (Math.abs(dx) > 1) {
                this.facing = dx > 0 ? 1 : -1;
            }
        } else {
            // Arrived - do state-specific animation
            this.walkPhase = 0;
        }

        // State-specific updates
        if (this.state === 'training') {
            this._updateParticles(dt);
            // Pacing: occasionally pick a new spot
            if (this.stateTimer > 2 + Math.random() * 2) {
                this.targetX = this.layout.x + 20 + Math.random() * (this.layout.w - 40);
                this.targetY = this.layout.y + this.layout.h / 2 + Math.random() * 30;
                this.stateTimer = 1;
            }
        }

        // Bobbing animation for idle/lounge
        if (this.state === 'idle' || this.state === 'lounge') {
            this.bobOffset = Math.sin(this.animFrame * 2) * 1.5;
        } else {
            this.bobOffset = 0;
        }
    }

    _updateParticles(dt) {
        // Spawn particles for training effect
        if (Math.random() < 0.3) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y - 30,
                vx: (Math.random() - 0.5) * 30,
                vy: -20 - Math.random() * 20,
                life: 1.0,
                color: this.bodyColor,
            });
        }
        // Update existing
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 30 * dt; // gravity
            p.life -= dt * 1.5;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        const x = this.x;
        const y = this.y + this.bobOffset;
        const s = this.size; // scale

        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 28 * s, 14 * s, 4 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw based on state
        switch (this.state) {
            case 'typing':
                this._drawTyping(ctx, x, y, s);
                break;
            case 'whiteboard':
                this._drawWhiteboard(ctx, x, y, s);
                break;
            case 'training':
                this._drawTraining(ctx, x, y, s);
                break;
            case 'lounge':
                this._drawLounge(ctx, x, y, s);
                break;
            case 'idle':
            default:
                this._drawIdle(ctx, x, y, s);
                break;
        }

        // Walking animation overlay (legs moving)
        if (Math.abs(this.targetX - this.x) > 2 || Math.abs(this.targetY - this.y) > 2) {
            this._drawWalking(ctx, x, y, s);
        }

        // Name label above
        ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
        ctx.fillRect(x - 24, y - 42, 48, 14);
        ctx.fillStyle = '#e6edf3';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, x, y - 32);

        ctx.restore();
    }

    _drawBody(ctx, x, y, s, armAngle = 0, legPhase = 0) {
        // Head
        ctx.fillStyle = '#f0d0a0';
        ctx.beginPath();
        ctx.arc(x, y - 22 * s, 8 * s, 0, Math.PI * 2);
        ctx.fill();

        // Body (torso)
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.roundRect(x - 10 * s, y - 14 * s, 20 * s, 18 * s, 4 * s);
        ctx.fill();

        // Arms
        ctx.strokeStyle = this.bodyColor;
        ctx.lineWidth = 4 * s;
        ctx.lineCap = 'round';
        // Left arm
        ctx.beginPath();
        ctx.moveTo(x - 8 * s, y - 10 * s);
        ctx.lineTo(x - 8 * s - Math.sin(armAngle) * 8 * s, y - 4 * s + Math.cos(armAngle) * 4 * s);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(x + 8 * s, y - 10 * s);
        ctx.lineTo(x + 8 * s + Math.sin(armAngle) * 8 * s, y - 4 * s + Math.cos(armAngle) * 4 * s);
        ctx.stroke();

        // Legs
        ctx.strokeStyle = '#2d333b';
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(x - 5 * s, y + 4 * s);
        ctx.lineTo(x - 5 * s + Math.sin(legPhase) * 4 * s, y + 16 * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 5 * s, y + 4 * s);
        ctx.lineTo(x + 5 * s - Math.sin(legPhase) * 4 * s, y + 16 * s);
        ctx.stroke();
    }

    _drawIdle(ctx, x, y, s) {
        // Leaning back, relaxed
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.05 * this.facing);
        ctx.translate(-x, -y);
        this._drawBody(ctx, x, y, s, 0.2);
        ctx.restore();
    }

    _drawTyping(ctx, x, y, s) {
        // Typing animation - arms moving fast
        const armAngle = Math.sin(this.animFrame * 15) * 0.8;
        this._drawBody(ctx, x, y, s, armAngle);

        // Desk and monitor in front
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x - 25 * s, y + 12 * s, 50 * s, 4 * s); // desk surface
        ctx.fillRect(x - 22 * s, y + 16 * s, 6 * s, 10 * s); // desk leg
        ctx.fillRect(x + 16 * s, y + 16 * s, 6 * s, 10 * s); // desk leg

        // Monitor
        ctx.fillStyle = '#161b22';
        ctx.fillRect(x - 15 * s, y - 5 * s, 30 * s, 18 * s);
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(x - 12 * s, y - 2 * s, 24 * s, 12 * s);
        // Screen text effect
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        const flicker = Math.sin(this.animFrame * 20) * 0.1 + 0.3;
        ctx.globalAlpha = flicker;
        ctx.fillRect(x - 10 * s, y, 20 * s, 2 * s);
        ctx.fillRect(x - 10 * s, y + 3 * s, 16 * s, 1 * s);
        ctx.fillRect(x - 10 * s, y + 6 * s, 18 * s, 1 * s);
        ctx.globalAlpha = 1;

        // Monitor stand
        ctx.fillStyle = '#30363d';
        ctx.fillRect(x - 2 * s, y + 13 * s, 4 * s, 3 * s);
    }

    _drawWhiteboard(ctx, x, y, s) {
        // Drawing on whiteboard
        this._drawBody(ctx, x, y, s, Math.sin(this.animFrame * 8) * 0.5);

        // Whiteboard
        const wbX = x + 15 * s * this.facing;
        const wbY = y - 20 * s;
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(wbX - 2 * s, wbY, 35 * s, 25 * s);
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 2;
        ctx.strokeRect(wbX - 2 * s, wbY, 35 * s, 25 * s);

        // Random "writing" on whiteboard (animated)
        ctx.strokeStyle = this.bodyColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const writePhase = this.animFrame * 3;
        for (let i = 0; i < 5; i++) {
            const ly = wbY + 5 + i * 4;
            const lx = wbX + 2 + Math.sin(writePhase + i) * 8;
            ctx.moveTo(wbX + 2, ly);
            ctx.lineTo(lx, ly);
        }
        ctx.stroke();

        // Marker in hand
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.arc(x + 10 * s * this.facing, y - 6 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawTraining(ctx, x, y, s) {
        // Agitated/excited pose - arms up
        const armAngle = Math.sin(this.animFrame * 10) * 1.2;
        this._drawBody(ctx, x, y, s, armAngle);

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _drawLounge(ctx, x, y, s) {
        // Sitting in a lounge chair, relaxed
        // Chair
        ctx.fillStyle = '#30363d';
        ctx.beginPath();
        ctx.roundRect(x - 16 * s, y + 2 * s, 32 * s, 16 * s, 4 * s);
        ctx.fill();
        // Chair back
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x - 16 * s * this.facing, y - 18 * s, 4 * s, 24 * s);

        // Body sitting (compressed)
        ctx.fillStyle = '#f0d0a0';
        ctx.beginPath();
        ctx.arc(x, y - 16 * s, 7 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.roundRect(x - 8 * s, y - 10 * s, 16 * s, 14 * s, 3 * s);
        ctx.fill();

        // Legs outstretched
        ctx.strokeStyle = '#2d333b';
        ctx.lineWidth = 4 * s;
        ctx.beginPath();
        ctx.moveTo(x - 4 * s, y + 4 * s);
        ctx.lineTo(x - 4 * s, y + 14 * s);
        ctx.moveTo(x + 4 * s, y + 4 * s);
        ctx.lineTo(x + 4 * s, y + 14 * s);
        ctx.stroke();

        // Coffee cup
        ctx.fillStyle = '#d29922';
        ctx.beginPath();
        ctx.arc(x + 14 * s, y, 3 * s, 0, Math.PI * 2);
        ctx.fill();
        // Steam
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const steamPhase = this.animFrame * 3;
        ctx.moveTo(x + 14 * s, y - 4 * s);
        ctx.quadraticCurveTo(
            x + 14 * s + Math.sin(steamPhase) * 3, y - 8 * s,
            x + 14 * s, y - 12 * s
        );
        ctx.stroke();
    }

    _drawWalking(ctx, x, y, s) {
        // Leg animation when walking - already handled in _drawBody via legPhase
        const legPhase = Math.sin(this.walkPhase) * 0.5;
        // Redraw legs with walk phase
        ctx.strokeStyle = '#2d333b';
        ctx.lineWidth = 5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 5 * s, y + 4 * s);
        ctx.lineTo(x - 5 * s + Math.sin(legPhase) * 6 * s, y + 16 * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 5 * s, y + 4 * s);
        ctx.lineTo(x + 5 * s - Math.sin(legPhase) * 6 * s, y + 16 * s);
        ctx.stroke();
    }
}