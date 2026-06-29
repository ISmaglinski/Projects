/* office.js - Pixel office building and GPU room renderer */

const COLORS = {
    bgTop: '#10141a',
    bgBottom: '#171a20',
    glass: '#26313a',
    wall: '#20262d',
    wallDark: '#13171c',
    floorA: '#1b2025',
    floorB: '#25282e',
    rail: '#49515c',
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

const TYPE_LABELS = {
    idle: 'IDLE',
    training: 'TRAINING',
    inference: 'INFERENCE',
    script: 'SCRIPT',
    compute: 'COMPUTE',
    working: 'WORKING',
    unknown: 'UNKNOWN',
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function bytesToMb(bytes) {
    return Math.round((bytes || 0) / 1024 ** 2);
}

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
        const types = ['plant', 'lamp', 'terminal', 'poster', 'bench'];
        for (let i = 0; i < 18; i++) {
            this._decorations.push({
                type: types[i % types.length],
                x: 0,
                y: 0,
                seed: i * 1.771,
            });
        }
    }

    layout(gpuCount) {
        this.gpuCount = gpuCount;
        this.offices = [];

        if (gpuCount <= 0) {
            return;
        }

        const w = this.canvas.width;
        const h = this.canvas.height;
        const padding = clamp(Math.min(w, h) * 0.034, 18, 34);
        const gap = clamp(Math.min(w, h) * 0.026, 16, 28);
        const cols = this._columnsFor(gpuCount, w, h);
        const rows = Math.ceil(gpuCount / cols);
        const officeW = (w - padding * 2 - gap * (cols - 1)) / cols;
        const officeH = (h - padding * 2 - gap * (rows - 1)) / rows;

        for (let i = 0; i < gpuCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * (officeW + gap);
            const y = padding + row * (officeH + gap);
            const scale = clamp(Math.min(officeW / 560, officeH / 340), 0.68, 1.22);
            const s = scale;
            const wallTop = y + 32 * s;
            const wallBottom = y + officeH - 44 * s;

            const layoutObj = {
                index: i,
                x,
                y,
                w: officeW,
                h: officeH,
                scale,
                wallTop,
                wallBottom,
                deskX: x + officeW * 0.31,
                deskY: y + officeH - 85 * s,
                boardX: x + officeW * 0.18,
                boardY: wallTop + 72 * s,
                processX: x + officeW * 0.51,
                processY: wallTop + 66 * s,
                rackX: x + officeW - 72 * s,
                rackY: wallTop + 96 * s,
                consoleX: x + officeW * 0.54,
                consoleY: y + officeH - 91 * s,
                loungeX: x + officeW * 0.19,
                loungeY: y + officeH - 61 * s,
                coffeeX: x + officeW - 154 * s,
                coffeeY: y + officeH - 74 * s,
                standupX: x + officeW * 0.49,
                standupY: y + officeH - 130 * s,
                windowX: x + 29 * s,
                windowY: wallTop + 25 * s,
            };

            layoutObj.hotspots = {
                desk: { x: layoutObj.deskX + 5 * s, y: layoutObj.deskY - 5 * s },
                board: { x: layoutObj.boardX + 48 * s, y: layoutObj.boardY + 57 * s },
                rack: { x: layoutObj.rackX - 52 * s, y: layoutObj.rackY + 55 * s },
                console: { x: layoutObj.consoleX + 2 * s, y: layoutObj.consoleY - 4 * s },
                lounge: { x: layoutObj.loungeX + 10 * s, y: layoutObj.loungeY },
                coffee: { x: layoutObj.coffeeX - 20 * s, y: layoutObj.coffeeY },
                standup: { x: layoutObj.standupX, y: layoutObj.standupY },
                window: { x: layoutObj.windowX + 48 * s, y: layoutObj.windowY + 62 * s },
                process: { x: layoutObj.processX - 8 * s, y: layoutObj.processY + 74 * s },
            };

            this.offices.push(layoutObj);
        }

        for (let i = 0; i < this._decorations.length; i++) {
            const col = i % Math.max(cols + 1, 2);
            const row = Math.floor(i / Math.max(cols + 1, 2));
            this._decorations[i].x = padding * 0.65 + col * (w / Math.max(cols + 0.25, 1));
            this._decorations[i].y = padding * 0.7 + row * Math.max(officeH * 0.55, 105);
        }
    }

    _columnsFor(gpuCount, w, h) {
        if (gpuCount <= 1) return 1;
        if (gpuCount <= 4) return 2;
        const aspect = w / Math.max(h, 1);
        if (aspect > 1.9) {
            return Math.min(gpuCount, Math.ceil(gpuCount / 2));
        }
        return Math.ceil(Math.sqrt(gpuCount));
    }

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

    draw(dt, gpus) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.time += dt;

        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, COLORS.bgTop);
        bg.addColorStop(0.6, '#15191f');
        bg.addColorStop(1, COLORS.bgBottom);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        this._drawBuildingBackdrop(ctx, w, h);
        this._drawAmbientLights(ctx, w, h);
        this._drawHallwayDecor(ctx);

        for (let i = 0; i < this.offices.length; i++) {
            this._drawOfficeRoom(ctx, this.offices[i], gpus[i] || {});
        }
    }

    _drawBuildingBackdrop(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = 'rgba(226, 231, 222, 0.055)';
        ctx.lineWidth = 1;
        const gridSize = 42;
        const drift = (this.time * 5) % gridSize;
        for (let x = -gridSize + drift; x < w + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + h * 0.17, h);
            ctx.stroke();
        }
        for (let y = -gridSize; y < h + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y + w * 0.055);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(12, 15, 18, 0.52)';
        for (let x = 0; x < w; x += 260) {
            ctx.fillRect(x + 16, 0, 8, h);
            ctx.fillRect(x + 140, 0, 3, h);
        }
        ctx.restore();
    }

    _drawAmbientLights(ctx, w, h) {
        const pulse = 0.5 + Math.sin(this.time * 0.8) * 0.09;
        const cyan = ctx.createRadialGradient(w * 0.08, h * 0.15, 10, w * 0.08, h * 0.15, w * 0.55);
        cyan.addColorStop(0, `rgba(84, 212, 210, ${0.11 * pulse})`);
        cyan.addColorStop(1, 'rgba(84, 212, 210, 0)');
        ctx.fillStyle = cyan;
        ctx.fillRect(0, 0, w, h);

        const amber = ctx.createRadialGradient(w * 0.9, h * 0.82, 8, w * 0.9, h * 0.82, w * 0.42);
        amber.addColorStop(0, `rgba(242, 184, 75, ${0.08 * pulse})`);
        amber.addColorStop(1, 'rgba(242, 184, 75, 0)');
        ctx.fillStyle = amber;
        ctx.fillRect(0, 0, w, h);
    }

    _drawHallwayDecor(ctx) {
        for (const dec of this._decorations) {
            if (dec.type === 'plant') {
                this._drawPlant(ctx, dec.x, dec.y, dec.seed);
            } else if (dec.type === 'lamp') {
                this._drawLamp(ctx, dec.x, dec.y);
            } else if (dec.type === 'terminal') {
                this._drawMiniTerminal(ctx, dec.x, dec.y, dec.seed);
            } else if (dec.type === 'poster') {
                this._drawPoster(ctx, dec.x, dec.y, dec.seed);
            } else {
                this._drawBench(ctx, dec.x, dec.y);
            }
        }
    }

    _drawOfficeRoom(ctx, office, gpu) {
        const { x, y, w, h, scale: s } = office;
        const activity = this._getWorkType(gpu);
        const activityColor = STATUS_COLORS[activity] || STATUS_COLORS.unknown;
        const isSelected = this.selectedOffice === office.index;
        const isHovered = this.hoveredOffice === office.index;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = isSelected ? 24 : 13;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = COLORS.wallDark;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 9);
        ctx.fill();
        ctx.restore();

        const room = ctx.createLinearGradient(x, y, x + w, y + h);
        room.addColorStop(0, COLORS.floorA);
        room.addColorStop(0.52, '#20252a');
        room.addColorStop(1, COLORS.floorB);
        ctx.fillStyle = room;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 9);
        ctx.fill();

        this._drawRoomShell(ctx, office, activityColor);
        this._drawRoomHeader(ctx, office, gpu, activity, activityColor);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 31 * s, w - 4, h - 34 * s, 8);
        ctx.clip();

        this._drawFloor(ctx, office, activityColor);
        this._drawWindow(ctx, office, activityColor);
        this._drawProcessWall(ctx, office, gpu, activity, activityColor);
        this._drawBoard(ctx, office, gpu, activity, activityColor);
        this._drawServerBay(ctx, office, gpu, activity, activityColor);
        this._drawCommandDesk(ctx, office, gpu, activity, activityColor);
        this._drawConsole(ctx, office, gpu, activity, activityColor);
        this._drawIdleFurniture(ctx, office, activity);
        this._drawDataLinks(ctx, office, gpu, activity, activityColor);
        this._drawResourceBars(ctx, office, gpu);

        ctx.restore();

        ctx.strokeStyle = isSelected ? COLORS.blue : isHovered ? COLORS.text : 'rgba(226,231,222,0.18)';
        ctx.lineWidth = isSelected ? 2.4 : 1.1;
        ctx.beginPath();
        ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 9);
        ctx.stroke();
    }

    _drawRoomShell(ctx, office, color) {
        const { x, y, w, h, scale: s } = office;
        ctx.fillStyle = '#252b32';
        ctx.fillRect(x + 1, y + 28 * s, w - 2, 11 * s);

        const glass = ctx.createLinearGradient(x, y, x + w, y);
        glass.addColorStop(0, 'rgba(255,255,255,0.03)');
        glass.addColorStop(0.45, 'rgba(255,255,255,0.1)');
        glass.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.fillStyle = glass;
        ctx.fillRect(x + 2, y + 39 * s, w - 4, 3 * s);

        ctx.strokeStyle = this._withAlpha(color, 0.2);
        ctx.beginPath();
        ctx.moveTo(x + 18 * s, y + h - 36 * s);
        ctx.lineTo(x + w - 18 * s, y + h - 36 * s);
        ctx.stroke();
    }

    _drawRoomHeader(ctx, office, gpu, activity, activityColor) {
        const { x, y, w, scale: s } = office;
        ctx.fillStyle = 'rgba(10, 12, 15, 0.86)';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, w - 2, 29 * s, 8);
        ctx.fill();
        ctx.fillRect(x + 1, y + 15 * s, w - 2, 16 * s);

        const gpuName = gpu.name ? this._shortName(gpu.name) : `GPU ${office.index}`;
        ctx.fillStyle = COLORS.text;
        ctx.font = `700 ${Math.max(11, 12 * s)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(gpuName, x + 12 * s, y + 16 * s, w * 0.43);

        const label = TYPE_LABELS[activity] || activity.toUpperCase();
        ctx.font = `800 ${Math.max(8, 9 * s)}px sans-serif`;
        const labelW = Math.min(ctx.measureText(label).width + 20 * s, w * 0.3);
        const labelX = x + w - labelW - 11 * s;
        ctx.fillStyle = this._withAlpha(activityColor, 0.18);
        ctx.strokeStyle = this._withAlpha(activityColor, 0.6);
        ctx.beginPath();
        ctx.roundRect(labelX, y + 7 * s, labelW, 16 * s, 7 * s);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = activityColor;
        ctx.textAlign = 'center';
        ctx.fillText(label, labelX + labelW / 2, y + 15.5 * s, labelW - 8 * s);

        const util = gpu.utilization || 0;
        const meterW = clamp(w * 0.18, 48 * s, 92 * s);
        const meterX = labelX - meterW - 12 * s;
        ctx.fillStyle = '#07090b';
        ctx.beginPath();
        ctx.roundRect(meterX, y + 11 * s, meterW, 6 * s, 3 * s);
        ctx.fill();
        ctx.fillStyle = activityColor;
        ctx.beginPath();
        ctx.roundRect(meterX, y + 11 * s, meterW * clamp(util / 100, 0, 1), 6 * s, 3 * s);
        ctx.fill();
        ctx.textBaseline = 'alphabetic';
    }

    _drawFloor(ctx, office, color) {
        const { x, y, w, h, scale: s } = office;
        const floorTop = y + 42 * s;
        ctx.save();
        ctx.strokeStyle = 'rgba(238,242,234,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const yy = floorTop + i * 22 * s;
            ctx.beginPath();
            ctx.moveTo(x + 14 * s, yy);
            ctx.lineTo(x + w - 14 * s, yy + 13 * s);
            ctx.stroke();
        }
        for (let i = 0; i < 7; i++) {
            const xx = x + 26 * s + i * 44 * s;
            ctx.beginPath();
            ctx.moveTo(xx, floorTop);
            ctx.lineTo(xx - 22 * s, y + h - 34 * s);
            ctx.stroke();
        }
        ctx.strokeStyle = this._withAlpha(color, 0.16);
        ctx.beginPath();
        ctx.moveTo(x + 18 * s, y + h - 54 * s);
        ctx.lineTo(x + w - 18 * s, y + h - 54 * s);
        ctx.stroke();
        ctx.restore();
    }

    _drawWindow(ctx, office, color) {
        const { windowX: x, windowY: y, scale: s } = office;
        const w = 82 * s;
        const h = 48 * s;
        ctx.fillStyle = 'rgba(84, 212, 210, 0.08)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 5 * s);
        ctx.fill();
        ctx.strokeStyle = 'rgba(226, 231, 222, 0.16)';
        ctx.stroke();

        ctx.strokeStyle = this._withAlpha(color, 0.28);
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + (w / 3) * i, y + 5 * s);
            ctx.lineTo(x + (w / 3) * i, y + h - 5 * s);
            ctx.stroke();
        }

        const scan = (this.time * 18) % h;
        ctx.strokeStyle = this._withAlpha(color, 0.38);
        ctx.beginPath();
        ctx.moveTo(x + 7 * s, y + scan);
        ctx.lineTo(x + w - 7 * s, y + scan - 8 * s);
        ctx.stroke();
    }

    _drawProcessWall(ctx, office, gpu, activity, color) {
        const { processX: x, processY: y, w: roomW, scale: s } = office;
        const panelW = clamp(roomW * 0.36, 170 * s, 250 * s);
        const panelH = 104 * s;
        const processes = gpu.processes || [];
        const primary = this._primaryProcess(gpu);
        const title = primary ? this._taskName(primary) : TYPE_LABELS[activity] || 'IDLE';

        ctx.fillStyle = '#0a0d10';
        ctx.beginPath();
        ctx.roundRect(x - panelW / 2, y - 18 * s, panelW, panelH, 7 * s);
        ctx.fill();
        ctx.strokeStyle = this._withAlpha(color, 0.58);
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();

        const glow = ctx.createLinearGradient(x - panelW / 2, y, x + panelW / 2, y);
        glow.addColorStop(0, this._withAlpha(color, 0.12));
        glow.addColorStop(0.5, this._withAlpha(color, 0.03));
        glow.addColorStop(1, this._withAlpha(color, 0.17));
        ctx.fillStyle = glow;
        ctx.fillRect(x - panelW / 2 + 3 * s, y - 15 * s, panelW - 6 * s, panelH - 6 * s);

        ctx.fillStyle = color;
        ctx.font = `800 ${Math.max(9, 10 * s)}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`TASK ${TYPE_LABELS[activity] || 'LIVE'}`, x - panelW / 2 + 10 * s, y - 6 * s);

        ctx.fillStyle = COLORS.text;
        ctx.font = `700 ${Math.max(10, 12 * s)}px sans-serif`;
        ctx.fillText(this._clipText(ctx, title, panelW - 22 * s), x - panelW / 2 + 10 * s, y + 13 * s);

        const command = primary ? this._commandHint(primary) : 'waiting for gpu process';
        ctx.fillStyle = COLORS.muted;
        ctx.font = `${Math.max(8, 9 * s)}px monospace`;
        ctx.fillText(this._clipText(ctx, command, panelW - 22 * s), x - panelW / 2 + 10 * s, y + 29 * s);

        const rows = processes.slice(0, 3);
        if (!rows.length) {
            ctx.fillStyle = 'rgba(238,242,234,0.12)';
            ctx.fillRect(x - panelW / 2 + 10 * s, y + 46 * s, panelW - 20 * s, 1);
            ctx.fillStyle = COLORS.muted;
            ctx.fillText('no active gpu process', x - panelW / 2 + 10 * s, y + 61 * s);
        }

        for (let i = 0; i < rows.length; i++) {
            const proc = rows[i];
            const rowY = y + 47 * s + i * 16 * s;
            const type = (proc.type || 'unknown').toUpperCase();
            const vram = `${bytesToMb(proc.vram_used)}MB`;
            ctx.fillStyle = this._withAlpha(STATUS_COLORS[proc.type] || color, 0.14);
            ctx.beginPath();
            ctx.roundRect(x - panelW / 2 + 8 * s, rowY - 8 * s, panelW - 16 * s, 12 * s, 3 * s);
            ctx.fill();

            ctx.fillStyle = STATUS_COLORS[proc.type] || color;
            ctx.font = `800 ${Math.max(7, 8 * s)}px monospace`;
            ctx.fillText(type.slice(0, 5), x - panelW / 2 + 13 * s, rowY - 1 * s);
            ctx.fillStyle = COLORS.text;
            ctx.font = `${Math.max(7, 8 * s)}px monospace`;
            ctx.fillText(this._clipText(ctx, this._taskName(proc), panelW * 0.36), x - panelW / 2 + 50 * s, rowY - 1 * s);
            ctx.textAlign = 'right';
            ctx.fillStyle = COLORS.muted;
            ctx.fillText(vram, x + panelW / 2 - 12 * s, rowY - 1 * s);
            ctx.textAlign = 'left';
        }

        this._drawTinyWave(ctx, x + panelW / 2 - 54 * s, y - 7 * s, 42 * s, 11 * s, color);
        ctx.textBaseline = 'alphabetic';
    }

    _drawBoard(ctx, office, gpu, activity, color) {
        const { boardX: x, boardY: y, scale: s } = office;
        const w = 100 * s;
        const h = 72 * s;
        const proc = this._primaryProcess(gpu);

        ctx.fillStyle = '#dce7da';
        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - 17 * s, w, h, 5 * s);
        ctx.fill();
        ctx.strokeStyle = '#5b6570';
        ctx.lineWidth = 2 * s;
        ctx.stroke();

        ctx.fillStyle = '#22313b';
        ctx.font = `800 ${Math.max(7, 8 * s)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(activity === 'idle' ? 'QUEUE' : 'PLAN', x - w / 2 + 8 * s, y - 4 * s);

        ctx.strokeStyle = this._withAlpha(color, 0.72);
        ctx.lineWidth = 1.4 * s;
        ctx.beginPath();
        if (activity === 'training') {
            ctx.moveTo(x - 32 * s, y + 35 * s);
            ctx.lineTo(x - 13 * s, y + 11 * s);
            ctx.lineTo(x + 6 * s, y + 27 * s);
            ctx.lineTo(x + 30 * s, y - 2 * s);
        } else if (activity === 'inference') {
            for (let i = 0; i < 4; i++) {
                const yy = y + 10 * s + i * 10 * s;
                ctx.moveTo(x - 34 * s, yy);
                ctx.lineTo(x + 4 * s + Math.sin(this.time * 3 + i) * 12 * s, yy);
            }
            ctx.arc(x + 26 * s, y + 24 * s, 11 * s, 0, Math.PI * 2);
        } else if (activity === 'script') {
            ctx.strokeRect(x - 30 * s, y + 7 * s, 58 * s, 32 * s);
            ctx.moveTo(x - 22 * s, y + 19 * s);
            ctx.lineTo(x + 20 * s, y + 19 * s);
            ctx.moveTo(x - 22 * s, y + 30 * s);
            ctx.lineTo(x + 4 * s, y + 30 * s);
        } else {
            ctx.arc(x - 16 * s, y + 23 * s, 13 * s, 0, Math.PI * 2);
            ctx.arc(x + 19 * s, y + 23 * s, 13 * s, 0, Math.PI * 2);
            ctx.moveTo(x - 3 * s, y + 23 * s);
            ctx.lineTo(x + 6 * s, y + 23 * s);
        }
        ctx.stroke();

        ctx.fillStyle = '#22313b';
        ctx.font = `${Math.max(7, 8 * s)}px monospace`;
        ctx.fillText(this._clipText(ctx, proc ? this._taskName(proc) : 'standby', w - 18 * s), x - w / 2 + 8 * s, y + 53 * s);
        ctx.fillStyle = '#24282f';
        ctx.fillRect(x - w / 2 + 8 * s, y + h - 18 * s, w - 16 * s, 4 * s);
    }

    _drawServerBay(ctx, office, gpu, activity, color) {
        const { rackX: x, rackY: y, scale: s } = office;
        const util = gpu.utilization || 0;
        const vram = gpu.vram || {};
        const vramPct = clamp(vram.total ? vram.used / vram.total : 0, 0, 1);
        const bayW = 82 * s;
        const bayH = 154 * s;

        ctx.fillStyle = '#101418';
        ctx.beginPath();
        ctx.roundRect(x - bayW / 2, y - 34 * s, bayW, bayH, 8 * s);
        ctx.fill();
        ctx.strokeStyle = this._withAlpha(color, 0.5);
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();

        ctx.fillStyle = 'rgba(238,242,234,0.05)';
        ctx.fillRect(x - bayW / 2 + 6 * s, y - 27 * s, bayW - 12 * s, 14 * s);
        ctx.fillStyle = color;
        ctx.font = `800 ${Math.max(7, 8 * s)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('GPU BAY', x, y - 18 * s);

        for (let i = 0; i < 7; i++) {
            const yy = y - 4 * s + i * 17 * s;
            ctx.fillStyle = i % 2 ? '#20262d' : '#252b33';
            ctx.beginPath();
            ctx.roundRect(x - 29 * s, yy, 58 * s, 12 * s, 2 * s);
            ctx.fill();

            ctx.fillStyle = 'rgba(238,242,234,0.09)';
            ctx.fillRect(x - 22 * s, yy + 4 * s, 29 * s * clamp(vramPct + i * 0.025, 0.08, 1), 2 * s);

            const blink = Math.sin(this.time * (4.5 + util / 35) + i + office.index) > -0.2 || util > 45;
            ctx.fillStyle = blink ? color : '#414852';
            ctx.globalAlpha = blink ? 0.92 : 0.45;
            ctx.beginPath();
            ctx.arc(x + 19 * s, yy + 6 * s, 2.2 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (activity !== 'idle') {
            const heat = ctx.createRadialGradient(x, y + 44 * s, 8 * s, x, y + 44 * s, 82 * s);
            heat.addColorStop(0, this._withAlpha(color, 0.16 + Math.sin(this.time * 5) * 0.04));
            heat.addColorStop(1, this._withAlpha(color, 0));
            ctx.fillStyle = heat;
            ctx.beginPath();
            ctx.arc(x, y + 44 * s, 82 * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawCommandDesk(ctx, office, gpu, activity, color) {
        const { deskX: x, deskY: y, scale: s } = office;
        const proc = this._primaryProcess(gpu);
        const glow = proc ? 0.88 : clamp((gpu.utilization || 0) / 100, 0.14, 0.7);

        ctx.fillStyle = '#5a4635';
        ctx.beginPath();
        ctx.roundRect(x - 64 * s, y + 10 * s, 128 * s, 13 * s, 4 * s);
        ctx.fill();
        ctx.fillStyle = '#2d2722';
        ctx.fillRect(x - 56 * s, y + 23 * s, 8 * s, 30 * s);
        ctx.fillRect(x + 48 * s, y + 23 * s, 8 * s, 30 * s);

        this._drawScreen(ctx, x - 58 * s, y - 31 * s, 46 * s, 31 * s, color, glow, 0, activity);
        this._drawScreen(ctx, x - 8 * s, y - 38 * s, 54 * s, 36 * s, COLORS.cyan, glow, 1, activity);
        this._drawScreen(ctx, x + 50 * s, y - 28 * s, 38 * s, 27 * s, COLORS.blue, glow * 0.72, 2, activity);

        ctx.fillStyle = '#080a0c';
        ctx.beginPath();
        ctx.roundRect(x - 34 * s, y + 1 * s, 72 * s, 7 * s, 2 * s);
        ctx.fill();

        if (proc) {
            const pulse = ((this.time * 28) % (62 * s));
            ctx.fillStyle = this._withAlpha(color, 0.65);
            ctx.fillRect(x - 29 * s + pulse, y + 3 * s, 7 * s, 2 * s);
        }
    }

    _drawConsole(ctx, office, gpu, activity, color) {
        const { consoleX: x, consoleY: y, scale: s } = office;
        const active = activity !== 'idle';
        const proc = this._primaryProcess(gpu);

        ctx.fillStyle = '#12161b';
        ctx.beginPath();
        ctx.roundRect(x - 45 * s, y - 7 * s, 90 * s, 28 * s, 6 * s);
        ctx.fill();
        ctx.strokeStyle = active ? this._withAlpha(color, 0.48) : 'rgba(238,242,234,0.1)';
        ctx.stroke();

        this._drawScreen(ctx, x - 33 * s, y - 42 * s, 66 * s, 31 * s, color, active ? 0.94 : 0.2, 5, activity);
        ctx.fillStyle = active ? this._withAlpha(color, 0.58) : '#414852';
        for (let i = 0; i < 6; i++) {
            const blink = active && Math.sin(this.time * 7 + i) > -0.3;
            ctx.globalAlpha = blink ? 1 : 0.28;
            ctx.beginPath();
            ctx.arc(x - 27 * s + i * 11 * s, y + 7 * s, 2.2 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (proc) {
            ctx.fillStyle = COLORS.muted;
            ctx.font = `${Math.max(7, 8 * s)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(this._clipText(ctx, `PID ${proc.pid || '--'}`, 66 * s), x, y + 28 * s);
        }
    }

    _drawIdleFurniture(ctx, office, activity) {
        if (activity !== 'idle') {
            this._drawTaskCrates(ctx, office, activity);
            return;
        }

        const { loungeX: x, loungeY: y, coffeeX, coffeeY, scale: s } = office;
        ctx.fillStyle = '#38404a';
        ctx.beginPath();
        ctx.roundRect(x - 31 * s, y - 12 * s, 58 * s, 22 * s, 7 * s);
        ctx.fill();
        ctx.fillStyle = '#222831';
        ctx.beginPath();
        ctx.roundRect(x - 33 * s, y - 28 * s, 12 * s, 35 * s, 5 * s);
        ctx.fill();

        ctx.fillStyle = '#303842';
        ctx.beginPath();
        ctx.roundRect(coffeeX - 14 * s, coffeeY - 25 * s, 31 * s, 39 * s, 5 * s);
        ctx.fill();
        ctx.fillStyle = COLORS.amber;
        ctx.globalAlpha = 0.65 + Math.sin(this.time * 4) * 0.18;
        ctx.fillRect(coffeeX - 7 * s, coffeeY - 12 * s, 14 * s, 3 * s);
        ctx.globalAlpha = 1;
    }

    _drawTaskCrates(ctx, office, activity) {
        const { coffeeX: x, coffeeY: y, scale: s } = office;
        const color = STATUS_COLORS[activity] || COLORS.cyan;
        ctx.fillStyle = '#242a31';
        ctx.beginPath();
        ctx.roundRect(x - 25 * s, y - 16 * s, 50 * s, 26 * s, 5 * s);
        ctx.fill();
        ctx.strokeStyle = this._withAlpha(color, 0.32);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = `800 ${Math.max(7, 8 * s)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('JOB', x, y - 5 * s);
        for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = 0.45 + Math.sin(this.time * 4 + i) * 0.25;
            ctx.fillRect(x - 15 * s + i * 10 * s, y + 2 * s, 5 * s, 4 * s);
        }
        ctx.globalAlpha = 1;
    }

    _drawDataLinks(ctx, office, gpu, activity, color) {
        if (activity === 'idle') return;

        const { processX, processY, rackX, rackY, deskX, deskY, consoleX, consoleY, scale: s } = office;
        const links = [
            [processX, processY + 35 * s, rackX - 38 * s, rackY + 54 * s],
            [processX - 18 * s, processY + 60 * s, deskX + 18 * s, deskY - 36 * s],
            [processX + 12 * s, processY + 64 * s, consoleX, consoleY - 41 * s],
        ];
        ctx.save();
        ctx.lineWidth = 1.2 * s;
        for (let i = 0; i < links.length; i++) {
            const [x1, y1, x2, y2] = links[i];
            ctx.strokeStyle = this._withAlpha(color, 0.18);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            const t = (this.time * (0.55 + i * 0.17) + i * 0.25) % 1;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            ctx.fillStyle = this._withAlpha(color, 0.82);
            ctx.beginPath();
            ctx.arc(px, py, 2.2 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawResourceBars(ctx, office, gpu) {
        const { x, y, w, h, scale: s } = office;
        const vram = gpu.vram || {};
        const vramPct = clamp(vram.total ? vram.used / vram.total : 0, 0, 1);
        const temp = gpu.temperature || 0;
        const power = gpu.power_draw || 0;
        const powerLimit = gpu.power_limit || 0;
        const barY = y + h - 10 * s;

        ctx.fillStyle = 'rgba(7, 9, 11, 0.86)';
        ctx.fillRect(x + 12 * s, barY, w - 24 * s, 5 * s);
        ctx.fillStyle = vramPct > 0.85 ? COLORS.coral : COLORS.blue;
        ctx.fillRect(x + 12 * s, barY, (w - 24 * s) * vramPct, 5 * s);

        ctx.fillStyle = COLORS.muted;
        ctx.font = `${Math.max(8, 9 * s)}px monospace`;
        ctx.textAlign = 'left';
        if (temp > 0) ctx.fillText(`${Math.round(temp)}C`, x + 13 * s, barY - 5 * s);
        if (power > 0) {
            const powerText = powerLimit > 0 ? `${power}/${powerLimit}W` : `${power}W`;
            ctx.textAlign = 'right';
            ctx.fillText(powerText, x + w - 13 * s, barY - 5 * s);
        }
    }

    _drawScreen(ctx, x, y, w, h, color, glow, seed, activity = 'idle') {
        ctx.fillStyle = '#07090b';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(226,231,222,0.13)';
        ctx.stroke();

        const ix = x + 3;
        const iy = y + 3;
        const iw = w - 6;
        const ih = h - 6;
        ctx.fillStyle = this._withAlpha(color, 0.11 + glow * 0.19);
        ctx.fillRect(ix, iy, iw, ih);

        ctx.fillStyle = this._withAlpha(color, 0.7);
        const rows = activity === 'inference' ? 5 : 4;
        for (let i = 0; i < rows; i++) {
            const yy = iy + 4 + i * Math.max(3, ih / 6);
            const offset = ((this.time * (12 + seed) + i * 11) % iw) * 0.35;
            ctx.globalAlpha = 0.25 + glow * 0.62;
            ctx.fillRect(ix + 4, yy, clamp(iw * 0.35 + offset, 5, iw - 8), 1.3);
        }
        if (activity === 'training') {
            ctx.strokeStyle = this._withAlpha(color, 0.72);
            ctx.beginPath();
            ctx.moveTo(ix + 5, iy + ih - 5);
            ctx.lineTo(ix + iw * 0.38, iy + ih * 0.36);
            ctx.lineTo(ix + iw * 0.62, iy + ih * 0.58);
            ctx.lineTo(ix + iw - 5, iy + 6);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    _drawTinyWave(ctx, x, y, w, h, color) {
        ctx.strokeStyle = this._withAlpha(color, 0.75);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            const px = x + (i / 19) * w;
            const py = y + h / 2 + Math.sin(this.time * 5 + i * 0.7) * (h * 0.35);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
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

    _drawPoster(ctx, x, y, seed) {
        ctx.fillStyle = 'rgba(238,242,234,0.06)';
        ctx.beginPath();
        ctx.roundRect(x - 14, y - 19, 28, 26, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(105,167,255,0.22)';
        ctx.stroke();
        ctx.fillStyle = seed % 2 ? COLORS.blue : COLORS.cyan;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x - 8, y - 11, 16, 2);
        ctx.fillRect(x - 8, y - 5, 10, 2);
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
        if (!processes.length && (gpu.utilization || 0) <= 4) return 'idle';
        const types = processes.map((p) => p.type || 'unknown');
        if (types.includes('training')) return 'training';
        if (types.includes('inference')) return 'inference';
        if (types.includes('script')) return 'script';
        if (types.includes('compute')) return 'compute';
        if (types.includes('working')) return 'working';
        return (gpu.utilization || 0) > 4 ? 'compute' : 'idle';
    }

    _primaryProcess(gpu) {
        const processes = gpu.processes || [];
        if (!processes.length) return null;
        return [...processes].sort((a, b) => (b.vram_used || 0) - (a.vram_used || 0))[0];
    }

    _taskName(proc) {
        return proc.model_name || proc.name || proc.cmdline || `pid ${proc.pid || '--'}`;
    }

    _commandHint(proc) {
        if (proc.cmdline) {
            return proc.cmdline.replace(/\s+/g, ' ');
        }
        return `${proc.type || 'process'} pid:${proc.pid || '--'} cpu:${proc.cpu_percent || 0}% ram:${bytesToMb(proc.ram_used)}MB`;
    }

    _clipText(ctx, text, maxWidth) {
        const value = String(text || '');
        if (ctx.measureText(value).width <= maxWidth) return value;
        let clipped = value;
        while (clipped.length > 3 && ctx.measureText(`${clipped}...`).width > maxWidth) {
            clipped = clipped.slice(0, -1);
        }
        return `${clipped}...`;
    }

    _shortName(name) {
        const parts = name.split(' ').filter(Boolean);
        const rtx = parts.findIndex((p) => /^(RTX|GTX|A\d+|H\d+|L\d+)$/i.test(p));
        if (rtx >= 0) return parts.slice(rtx).join(' ');
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
