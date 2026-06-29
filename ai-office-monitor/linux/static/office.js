/* office.js - Office environment rendering */

const COLORS = {
    bgTop: '#101216',
    bgBottom: '#151923',
    floorLine: 'rgba(226, 231, 222, 0.055)',
    roomFloorA: '#1a1f24',
    roomFloorB: '#22252b',
    wall: '#2c3138',
    wallDark: '#171b20',
    border: '#3b4149',
    text: '#eef2ea',
    muted: '#9aa39a',
    blue: '#69a7ff',
    green: '#64d27d',
    amber: '#f2b84b',
    coral: '#ff6f61',
    violet: '#b795ff',
    cyan: '#54d4d2',
};

const STATUS_COLORS = {
    idle: COLORS.green,
    training: COLORS.coral,
    inference: COLORS.blue,
    script: COLORS.amber,
    compute: COLORS.violet,
    working: COLORS.cyan,
    unknown: COLORS.muted,
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Represents the office building layout.
 * Each GPU gets a room with activity zones that the worker can move between.
 */
export class Office {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.offices = [];
        this.gpuCount = 0;
        this.selectedOffice = null;
        this.hoveredOffice = null;
        this.time = 0;
        this._decorations = [];
        this._initDecorations();
    }

    _initDecorations() {
        const types = ['plant', 'lamp', 'terminal', 'bench'];
        for (let i = 0; i < 14; i++) {
            this._decorations.push({
                type: types[i % types.length],
                x: 0,
                y: 0,
                seed: i * 1.913,
            });
        }
    }

    /**
     * Compute office layouts based on GPU count and canvas size.
     */
    layout(gpuCount) {
        this.gpuCount = gpuCount;
        this.offices = [];

        if (gpuCount <= 0) {
            return;
        }

        const w = this.canvas.width;
        const h = this.canvas.height;
        const padding = clamp(Math.min(w, h) * 0.045, 18, 36);
        const gap = clamp(Math.min(w, h) * 0.035, 14, 30);
        const aspect = w / Math.max(h, 1);
        const cols = clamp(
            Math.ceil(Math.sqrt(gpuCount * Math.max(aspect, 0.7))),
            1,
            gpuCount
        );
        const rows = Math.ceil(gpuCount / cols);
        const officeW = (w - padding * 2 - gap * (cols - 1)) / cols;
        const officeH = (h - padding * 2 - gap * (rows - 1)) / rows;

        for (let i = 0; i < gpuCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * (officeW + gap);
            const y = padding + row * (officeH + gap);
            const scale = clamp(Math.min(officeW / 300, officeH / 210), 0.68, 1.16);
            const left = x + officeW * 0.18;
            const mid = x + officeW * 0.5;
            const right = x + officeW * 0.82;
            const top = y + 42;
            const bottom = y + officeH - 24;

            const layoutObj = {
                index: i,
                x,
                y,
                w: officeW,
                h: officeH,
                scale,
                deskX: left + officeW * 0.08,
                deskY: y + officeH * 0.58,
                boardX: right,
                boardY: top + officeH * 0.22,
                rackX: right,
                rackY: y + officeH * 0.64,
                consoleX: mid,
                consoleY: y + officeH * 0.66,
                loungeX: left,
                loungeY: bottom - officeH * 0.05,
                coffeeX: x + officeW * 0.62,
                coffeeY: bottom - officeH * 0.04,
                standupX: mid,
                standupY: y + officeH * 0.5,
                doorX: mid,
                doorY: y + officeH,
            };

            layoutObj.hotspots = {
                desk: { x: layoutObj.deskX, y: layoutObj.deskY },
                board: { x: layoutObj.boardX - 22 * scale, y: layoutObj.boardY + 34 * scale },
                rack: { x: layoutObj.rackX - 26 * scale, y: layoutObj.rackY + 30 * scale },
                console: { x: layoutObj.consoleX, y: layoutObj.consoleY + 26 * scale },
                lounge: { x: layoutObj.loungeX + 4 * scale, y: layoutObj.loungeY - 2 * scale },
                coffee: { x: layoutObj.coffeeX - 16 * scale, y: layoutObj.coffeeY },
                standup: { x: layoutObj.standupX, y: layoutObj.standupY },
                window: { x: layoutObj.deskX + 34 * scale, y: top + 40 * scale },
            };

            this.offices.push(layoutObj);
        }

        for (let i = 0; i < this._decorations.length; i++) {
            const col = i % Math.max(cols + 1, 2);
            const row = Math.floor(i / Math.max(cols + 1, 2));
            this._decorations[i].x = padding * 0.7 + col * (w / Math.max(cols + 0.4, 1));
            this._decorations[i].y = padding * 0.8 + row * Math.max(officeH * 0.48, 84);
        }
    }

    /**
     * Get office layout at a screen position (for click detection).
     */
    getOfficeAt(x, y) {
        for (const office of this.offices) {
            if (
                x >= office.x &&
                x <= office.x + office.w &&
                y >= office.y &&
                y <= office.y + office.h
            ) {
                return office;
            }
        }
        return null;
    }

    /**
     * Draw the entire office environment.
     */
    draw(dt, gpus) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.time += dt;

        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, COLORS.bgTop);
        bg.addColorStop(1, COLORS.bgBottom);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        this._drawFloor(ctx, w, h);
        this._drawAmbientLights(ctx, w, h);
        this._drawHallway(ctx);

        for (let i = 0; i < this.offices.length; i++) {
            this._drawOfficeRoom(ctx, this.offices[i], gpus[i] || {});
        }
    }

    _drawFloor(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = COLORS.floorLine;
        ctx.lineWidth = 1;

        const gridSize = 46;
        const drift = (this.time * 8) % gridSize;
        for (let x = -gridSize + drift; x < w + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + h * 0.24, h);
            ctx.stroke();
        }
        for (let y = -gridSize; y < h + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y + w * 0.08);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawAmbientLights(ctx, w, h) {
        const pulse = 0.45 + Math.sin(this.time * 0.7) * 0.08;
        const leftGlow = ctx.createRadialGradient(w * 0.12, h * 0.18, 10, w * 0.12, h * 0.18, w * 0.5);
        leftGlow.addColorStop(0, `rgba(84, 212, 210, ${0.1 * pulse})`);
        leftGlow.addColorStop(1, 'rgba(84, 212, 210, 0)');
        ctx.fillStyle = leftGlow;
        ctx.fillRect(0, 0, w, h);

        const rightGlow = ctx.createRadialGradient(w * 0.88, h * 0.82, 8, w * 0.88, h * 0.82, w * 0.45);
        rightGlow.addColorStop(0, `rgba(242, 184, 75, ${0.08 * pulse})`);
        rightGlow.addColorStop(1, 'rgba(242, 184, 75, 0)');
        ctx.fillStyle = rightGlow;
        ctx.fillRect(0, 0, w, h);
    }

    _drawHallway(ctx) {
        for (const dec of this._decorations) {
            if (dec.type === 'plant') {
                this._drawPlant(ctx, dec.x, dec.y, dec.seed);
            } else if (dec.type === 'lamp') {
                this._drawLamp(ctx, dec.x, dec.y);
            } else if (dec.type === 'terminal') {
                this._drawMiniTerminal(ctx, dec.x, dec.y, dec.seed);
            } else {
                this._drawBench(ctx, dec.x, dec.y);
            }
        }
    }

    _drawOfficeRoom(ctx, office, gpu) {
        const { x, y, w, h } = office;
        const isSelected = this.selectedOffice === office.index;
        const isHovered = this.hoveredOffice === office.index;
        const activity = this._getWorkType(gpu);
        const activityColor = STATUS_COLORS[activity] || STATUS_COLORS.unknown;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = isSelected ? 24 : 14;
        ctx.shadowOffsetY = 9;
        ctx.fillStyle = COLORS.wallDark;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();
        ctx.restore();

        const floor = ctx.createLinearGradient(x, y, x + w, y + h);
        floor.addColorStop(0, COLORS.roomFloorA);
        floor.addColorStop(1, COLORS.roomFloorB);
        ctx.fillStyle = floor;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();

        this._drawRoomWalls(ctx, office, activityColor);
        this._drawRoomHeader(ctx, office, gpu, activity, activityColor);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 30, w - 2, h - 31, 8);
        ctx.clip();

        this._drawFloorInRoom(ctx, office);
        this._drawWindow(ctx, office, activityColor);
        this._drawWhiteboard(ctx, office, activity);
        this._drawDesk(ctx, office, gpu, activityColor);
        this._drawServerRack(ctx, office, gpu, activity, activityColor);
        this._drawConsole(ctx, office, activity, activityColor);
        this._drawLoungeChair(ctx, office);
        this._drawCoffeeStation(ctx, office);
        this._drawResourceBars(ctx, office, gpu);

        ctx.restore();

        ctx.strokeStyle = isSelected ? COLORS.blue : isHovered ? COLORS.text : COLORS.border;
        ctx.lineWidth = isSelected ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 10);
        ctx.stroke();
    }

    _drawRoomWalls(ctx, office, activityColor) {
        const { x, y, w, h } = office;
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x + 1, y + 28, w - 2, 9);

        const shine = ctx.createLinearGradient(x, y, x + w, y);
        shine.addColorStop(0, 'rgba(255,255,255,0.03)');
        shine.addColorStop(0.52, 'rgba(255,255,255,0.11)');
        shine.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.fillStyle = shine;
        ctx.fillRect(x + 1, y + 37, w - 2, 2);

        ctx.strokeStyle = this._withAlpha(activityColor, 0.18);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + h - 18);
        ctx.lineTo(x + w - 16, y + h - 18);
        ctx.stroke();
    }

    _drawRoomHeader(ctx, office, gpu, activity, activityColor) {
        const { x, y, w } = office;
        ctx.fillStyle = 'rgba(15, 17, 20, 0.82)';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, w - 2, 29, 9);
        ctx.fill();
        ctx.fillRect(x + 1, y + 15, w - 2, 16);

        const gpuName = gpu.name ? this._shortName(gpu.name) : `GPU ${office.index}`;
        ctx.fillStyle = COLORS.text;
        ctx.font = '700 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(gpuName, x + 12, y + 19);

        const label = activity.toUpperCase();
        ctx.font = '700 9px sans-serif';
        const labelW = ctx.measureText(label).width + 18;
        ctx.fillStyle = this._withAlpha(activityColor, 0.2);
        ctx.strokeStyle = this._withAlpha(activityColor, 0.65);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + w - labelW - 12, y + 7, labelW, 16, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = activityColor;
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w - labelW / 2 - 12, y + 18);

        const util = gpu.utilization || 0;
        const meterW = Math.max(36, Math.min(88, w * 0.22));
        const meterX = x + w - labelW - meterW - 22;
        ctx.fillStyle = '#090b0d';
        ctx.beginPath();
        ctx.roundRect(meterX, y + 11, meterW, 7, 4);
        ctx.fill();
        ctx.fillStyle = activityColor;
        ctx.beginPath();
        ctx.roundRect(meterX, y + 11, (util / 100) * meterW, 7, 4);
        ctx.fill();
    }

    _drawFloorInRoom(ctx, office) {
        const { x, y, w, h } = office;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.035)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const yy = y + 52 + i * 24;
            ctx.beginPath();
            ctx.moveTo(x + 12, yy);
            ctx.lineTo(x + w - 12, yy + 10);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + h - 28);
        ctx.lineTo(x + w - 18, y + h - 28);
        ctx.stroke();
        ctx.restore();
    }

    _drawWindow(ctx, office, activityColor) {
        const { x, y, w, scale } = office;
        const wx = x + 16 * scale;
        const wy = y + 48 * scale;
        const ww = clamp(w * 0.24, 54, 86);
        const wh = 34 * scale;

        ctx.fillStyle = 'rgba(84, 212, 210, 0.08)';
        ctx.beginPath();
        ctx.roundRect(wx, wy, ww, wh, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(226, 231, 222, 0.16)';
        ctx.stroke();

        ctx.strokeStyle = this._withAlpha(activityColor, 0.28);
        ctx.beginPath();
        ctx.moveTo(wx + ww * 0.33, wy + 4);
        ctx.lineTo(wx + ww * 0.33, wy + wh - 4);
        ctx.moveTo(wx + ww * 0.66, wy + 4);
        ctx.lineTo(wx + ww * 0.66, wy + wh - 4);
        ctx.stroke();

        const scan = (this.time * 18) % wh;
        ctx.strokeStyle = this._withAlpha(activityColor, 0.35);
        ctx.beginPath();
        ctx.moveTo(wx + 6, wy + scan);
        ctx.lineTo(wx + ww - 6, wy + scan - 8);
        ctx.stroke();
    }

    _drawDesk(ctx, office, gpu, color) {
        const { deskX: x, deskY: y, scale: s } = office;
        const util = gpu.utilization || 0;
        const glow = clamp(util / 100, 0.12, 1);

        ctx.fillStyle = '#4b3f35';
        ctx.beginPath();
        ctx.roundRect(x - 42 * s, y + 12 * s, 84 * s, 10 * s, 4 * s);
        ctx.fill();
        ctx.fillStyle = '#2a2522';
        ctx.fillRect(x - 38 * s, y + 22 * s, 7 * s, 24 * s);
        ctx.fillRect(x + 31 * s, y + 22 * s, 7 * s, 24 * s);

        this._drawScreen(ctx, x - 19 * s, y - 18 * s, 30 * s, 24 * s, color, glow, 0);
        this._drawScreen(ctx, x + 15 * s, y - 13 * s, 26 * s, 20 * s, COLORS.cyan, glow * 0.65, 2);

        ctx.fillStyle = '#090b0d';
        ctx.beginPath();
        ctx.roundRect(x - 20 * s, y + 6 * s, 42 * s, 5 * s, 2 * s);
        ctx.fill();

        const pulseX = x - 16 * s + ((this.time * 18) % (34 * s));
        ctx.fillStyle = this._withAlpha(color, 0.55);
        ctx.fillRect(pulseX, y + 7 * s, 5 * s, 2 * s);
    }

    _drawWhiteboard(ctx, office, activity) {
        const { boardX: x, boardY: y, scale: s } = office;
        const color = STATUS_COLORS[activity] || COLORS.muted;

        ctx.fillStyle = '#dce7da';
        ctx.beginPath();
        ctx.roundRect(x - 34 * s, y - 24 * s, 68 * s, 44 * s, 5 * s);
        ctx.fill();
        ctx.strokeStyle = '#57606a';
        ctx.lineWidth = 2 * s;
        ctx.stroke();

        ctx.strokeStyle = this._withAlpha(color, 0.75);
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        const phase = this.time * 2.4;
        for (let i = 0; i < 4; i++) {
            const yy = y - 14 * s + i * 8 * s;
            const start = x - 25 * s;
            const end = x - 4 * s + Math.sin(phase + i) * 8 * s;
            ctx.moveTo(start, yy);
            ctx.lineTo(end, yy);
        }
        if (activity === 'training') {
            ctx.moveTo(x + 6 * s, y + 11 * s);
            ctx.lineTo(x + 15 * s, y - 8 * s);
            ctx.lineTo(x + 25 * s, y + 9 * s);
        } else if (activity === 'script') {
            ctx.strokeRect(x + 6 * s, y - 14 * s, 20 * s, 17 * s);
            ctx.moveTo(x + 10 * s, y - 6 * s);
            ctx.lineTo(x + 22 * s, y - 6 * s);
        } else {
            ctx.arc(x + 16 * s, y - 4 * s, 10 * s, 0, Math.PI * 2);
        }
        ctx.stroke();

        ctx.fillStyle = '#24282f';
        ctx.fillRect(x - 26 * s, y + 20 * s, 52 * s, 4 * s);
    }

    _drawServerRack(ctx, office, gpu, activity, color) {
        const { rackX: x, rackY: y, scale: s } = office;
        const util = gpu.utilization || 0;
        const vram = gpu.vram || {};
        const vramPct = vram.total ? vram.used / vram.total : 0;

        ctx.fillStyle = '#12161b';
        ctx.beginPath();
        ctx.roundRect(x - 28 * s, y - 35 * s, 56 * s, 70 * s, 7 * s);
        ctx.fill();
        ctx.strokeStyle = this._withAlpha(color, 0.45);
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();

        for (let i = 0; i < 5; i++) {
            const yy = y - 27 * s + i * 12 * s;
            ctx.fillStyle = i % 2 ? '#20252b' : '#242a31';
            ctx.fillRect(x - 22 * s, yy, 44 * s, 8 * s);
            const active = Math.sin(this.time * 5 + i + office.index) > 0 || util > 35;
            ctx.fillStyle = active ? color : '#454b54';
            ctx.globalAlpha = active ? 0.9 : 0.45;
            ctx.beginPath();
            ctx.arc(x + 14 * s, yy + 4 * s, 2.3 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x - 18 * s, yy + 3 * s, 22 * s * clamp(vramPct + i * 0.04, 0.08, 1), 2 * s);
        }

        if (activity === 'training' || activity === 'compute') {
            const heat = ctx.createRadialGradient(x, y, 4 * s, x, y, 54 * s);
            heat.addColorStop(0, this._withAlpha(color, 0.18 + Math.sin(this.time * 6) * 0.04));
            heat.addColorStop(1, this._withAlpha(color, 0));
            ctx.fillStyle = heat;
            ctx.beginPath();
            ctx.arc(x, y, 54 * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawConsole(ctx, office, activity, color) {
        const { consoleX: x, consoleY: y, scale: s } = office;
        const active = ['script', 'compute', 'training'].includes(activity);
        ctx.fillStyle = '#15191e';
        ctx.beginPath();
        ctx.roundRect(x - 34 * s, y - 10 * s, 68 * s, 26 * s, 6 * s);
        ctx.fill();
        ctx.strokeStyle = active ? this._withAlpha(color, 0.5) : 'rgba(255,255,255,0.1)';
        ctx.stroke();

        this._drawScreen(ctx, x - 24 * s, y - 36 * s, 48 * s, 25 * s, color, active ? 0.95 : 0.25, 4);

        ctx.fillStyle = active ? this._withAlpha(color, 0.55) : '#3b4149';
        for (let i = 0; i < 5; i++) {
            const blink = active && Math.sin(this.time * 7 + i) > -0.25;
            ctx.globalAlpha = blink ? 1 : 0.28;
            ctx.beginPath();
            ctx.arc(x - 20 * s + i * 10 * s, y + 3 * s, 2.1 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _drawLoungeChair(ctx, office) {
        const { loungeX: x, loungeY: y, scale: s } = office;
        ctx.fillStyle = '#38404a';
        ctx.beginPath();
        ctx.roundRect(x - 28 * s, y - 10 * s, 52 * s, 24 * s, 8 * s);
        ctx.fill();
        ctx.fillStyle = '#232a32';
        ctx.beginPath();
        ctx.roundRect(x - 30 * s, y - 25 * s, 12 * s, 34 * s, 6 * s);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x - 18 * s, y - 5 * s, 32 * s, 4 * s);
    }

    _drawCoffeeStation(ctx, office) {
        const { coffeeX: x, coffeeY: y, scale: s } = office;
        ctx.fillStyle = '#2b2f35';
        ctx.beginPath();
        ctx.roundRect(x - 16 * s, y - 24 * s, 32 * s, 36 * s, 5 * s);
        ctx.fill();
        ctx.fillStyle = '#15191e';
        ctx.fillRect(x - 10 * s, y - 16 * s, 20 * s, 12 * s);
        ctx.fillStyle = COLORS.amber;
        ctx.globalAlpha = 0.75 + Math.sin(this.time * 4) * 0.18;
        ctx.fillRect(x - 7 * s, y - 12 * s, 14 * s, 3 * s);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(238,242,234,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const steam = Math.sin(this.time * 2.8) * 2 * s;
        ctx.moveTo(x + 13 * s, y - 21 * s);
        ctx.quadraticCurveTo(x + 16 * s + steam, y - 28 * s, x + 13 * s, y - 35 * s);
        ctx.stroke();
    }

    _drawResourceBars(ctx, office, gpu) {
        const { x, y, w, h } = office;
        const vram = gpu.vram || {};
        const vramUsed = vram.used || 0;
        const vramTotal = vram.total || 1;
        const vramPct = clamp(vramUsed / vramTotal, 0, 1);
        const temp = gpu.temperature || 0;
        const power = gpu.power_draw || 0;
        const powerLimit = gpu.power_limit || 0;

        const barY = y + h - 9;
        ctx.fillStyle = 'rgba(9, 11, 13, 0.82)';
        ctx.fillRect(x + 10, barY, w - 20, 4);

        const fill = vramPct > 0.85 ? COLORS.coral : COLORS.blue;
        ctx.fillStyle = fill;
        ctx.fillRect(x + 10, barY, (w - 20) * vramPct, 4);

        ctx.fillStyle = COLORS.muted;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        if (temp > 0) {
            ctx.fillText(`${Math.round(temp)}C`, x + 12, barY - 4);
        }
        if (power > 0) {
            const powerText = powerLimit > 0 ? `${power}/${powerLimit}W` : `${power}W`;
            ctx.textAlign = 'right';
            ctx.fillText(powerText, x + w - 12, barY - 4);
        }
    }

    _drawScreen(ctx, x, y, w, h, color, glow, seed) {
        ctx.fillStyle = '#090b0d';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(226,231,222,0.12)';
        ctx.stroke();

        const innerX = x + 3;
        const innerY = y + 3;
        const innerW = w - 6;
        const innerH = h - 6;
        ctx.fillStyle = this._withAlpha(color, 0.12 + glow * 0.18);
        ctx.fillRect(innerX, innerY, innerW, innerH);

        ctx.fillStyle = this._withAlpha(color, 0.68);
        for (let i = 0; i < 4; i++) {
            const yy = innerY + 4 + i * 4;
            const offset = ((this.time * (11 + seed) + i * 9) % innerW) * 0.35;
            ctx.globalAlpha = 0.25 + glow * 0.6;
            ctx.fillRect(innerX + 3, yy, clamp(innerW * 0.4 + offset, 5, innerW - 4), 1.3);
        }
        ctx.globalAlpha = 1;
    }

    _drawPlant(ctx, x, y, seed = 0) {
        ctx.fillStyle = '#6b4d36';
        ctx.beginPath();
        ctx.roundRect(x - 8, y - 5, 16, 13, 3);
        ctx.fill();
        ctx.fillStyle = COLORS.green;
        const sway = Math.sin(this.time * 1.4 + seed) * 2;
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.translate(x + sway, y - 12);
            ctx.rotate((i - 1.5) * 0.45 + Math.sin(this.time + i) * 0.05);
            ctx.beginPath();
            ctx.ellipse(0, -3, 5, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    _drawLamp(ctx, x, y) {
        ctx.strokeStyle = '#59616b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x, y - 23);
        ctx.stroke();
        ctx.fillStyle = COLORS.amber;
        ctx.globalAlpha = 0.68;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 21);
        ctx.lineTo(x + 10, y - 21);
        ctx.lineTo(x + 6, y - 31);
        ctx.lineTo(x - 6, y - 31);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        const glow = ctx.createRadialGradient(x, y - 26, 3, x, y - 26, 46);
        glow.addColorStop(0, 'rgba(242,184,75,0.14)');
        glow.addColorStop(1, 'rgba(242,184,75,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y - 26, 46, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawMiniTerminal(ctx, x, y, seed) {
        ctx.fillStyle = '#101418';
        ctx.beginPath();
        ctx.roundRect(x - 18, y - 16, 36, 23, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(84,212,210,0.3)';
        ctx.stroke();
        ctx.fillStyle = COLORS.cyan;
        ctx.globalAlpha = 0.35 + Math.sin(this.time * 3 + seed) * 0.18;
        ctx.fillRect(x - 12, y - 9, 20, 2);
        ctx.fillRect(x - 12, y - 4, 12, 2);
        ctx.globalAlpha = 1;
    }

    _drawBench(ctx, x, y) {
        ctx.fillStyle = '#282d34';
        ctx.beginPath();
        ctx.roundRect(x - 22, y - 6, 44, 11, 4);
        ctx.fill();
        ctx.fillStyle = '#171b20';
        ctx.fillRect(x - 18, y + 4, 4, 13);
        ctx.fillRect(x + 14, y + 4, 4, 13);
    }

    _getWorkType(gpu) {
        const processes = gpu.processes || [];
        if (!processes.length && (gpu.utilization || 0) <= 4) {
            return 'idle';
        }

        const types = processes.map((p) => p.type || 'unknown');
        if (types.includes('training')) return 'training';
        if (types.includes('inference')) return 'inference';
        if (types.includes('script')) return 'script';
        if (types.includes('compute')) return 'compute';
        if (types.includes('working')) return 'working';
        return (gpu.utilization || 0) > 4 ? 'compute' : 'idle';
    }

    _shortName(name) {
        const parts = name.split(' ').filter(Boolean);
        const rtx = parts.findIndex((p) => /^(RTX|GTX|A\d+|H\d+|L\d+)$/i.test(p));
        if (rtx >= 0) {
            return parts.slice(rtx).join(' ');
        }
        if (parts.length > 2) return parts.slice(-2).join(' ');
        return name;
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
