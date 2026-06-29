/* office.js - Office environment rendering */

/**
 * Represents the office building layout.
 * Each GPU gets its own office room with a desk, whiteboard, and lounge area.
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

        // Background decorations
        this._decorations = [];
        this._initDecorations();
    }

    _initDecorations() {
        // Plants, lamps, etc. in the hallway
        for (let i = 0; i < 8; i++) {
            this._decorations.push({
                type: Math.random() < 0.5 ? 'plant' : 'lamp',
                x: 0,
                y: 0,
            });
        }
    }

    /**
     * Compute office layouts based on GPU count and canvas size.
     */
    layout(gpuCount) {
        this.gpuCount = gpuCount;
        this.offices = [];
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Determine grid: 2 columns for 4 GPUs, adapt for other counts
        const cols = gpuCount <= 2 ? gpuCount : Math.ceil(gpuCount / 2);
        const rows = Math.ceil(gpuCount / cols);

        const padding = 30;
        const hallGap = 50; // gap between rows for hallway
        const totalW = w - padding * 2;
        const totalH = h - padding * 2 - hallGap * (rows - 1);

        const officeW = totalW / cols - 20;
        const officeH = totalH / rows;

        for (let i = 0; i < gpuCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * (officeW + 20) + 10;
            const y = padding + row * (officeH + hallGap);

            const layoutObj = {
                index: i,
                x: x,
                y: y,
                w: officeW,
                h: officeH,
                // Desk position (left side of office)
                deskX: x + officeW * 0.3,
                deskY: y + officeH * 0.6,
                // Whiteboard position (right wall area)
                whiteboardX: x + officeW * 0.75,
                whiteboardY: y + officeH * 0.5,
                // Lounge position (bottom-left corner)
                loungeX: x + officeW * 0.2,
                loungeY: y + officeH * 0.75,
                // Door position
                doorX: x + officeW / 2,
                doorY: y + officeH,
            };
            this.offices.push(layoutObj);
        }

        // Update decoration positions along hallway
        if (rows > 1) {
            const hallwayY = padding + officeH + hallGap / 2;
            for (let i = 0; i < this._decorations.length; i++) {
                this._decorations[i].x = padding + (i + 0.5) * (w / this._decorations.length);
                this._decorations[i].y = hallwayY;
            }
        }
    }

    /**
     * Get office layout at a screen position (for click detection).
     */
    getOfficeAt(x, y) {
        for (const office of this.offices) {
            if (x >= office.x && x <= office.x + office.w &&
                y >= office.y && y <= office.y + office.h) {
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

        // Clear with floor background
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, w, h);

        // Draw floor pattern (subtle grid)
        this._drawFloor(ctx, w, h);

        // Draw hallway
        if (this.offices.length > 2) {
            this._drawHallway(ctx, w, h);
        }

        // Draw each office room
        for (let i = 0; i < this.offices.length; i++) {
            const office = this.offices[i];
            const gpu = gpus[i] || {};
            this._drawOfficeRoom(ctx, office, gpu);
        }
    }

    _drawFloor(ctx, w, h) {
        // Subtle floor grid
        ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    _drawHallway(ctx, w, h) {
        // Draw decorations along the hallway
        for (const dec of this._decorations) {
            if (dec.type === 'plant') {
                this._drawPlant(ctx, dec.x, dec.y);
            } else {
                this._drawLamp(ctx, dec.x, dec.y);
            }
        }
    }

    _drawPlant(ctx, x, y) {
        // Pot
        ctx.fillStyle = '#d29922';
        ctx.beginPath();
        ctx.roundRect(x - 8, y - 5, 16, 12, 2);
        ctx.fill();
        // Leaves
        ctx.fillStyle = '#3fb950';
        const sway = Math.sin(this.time * 1.5 + x * 0.01) * 2;
        ctx.beginPath();
        ctx.ellipse(x - 5 + sway, y - 12, 6, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 5 + sway, y - 12, 6, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + sway, y - 16, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawLamp(ctx, x, y) {
        // Floor lamp
        ctx.strokeStyle = '#7d8590';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 5);
        ctx.lineTo(x, y - 20);
        ctx.stroke();
        // Shade
        ctx.fillStyle = '#d29922';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 20);
        ctx.lineTo(x + 8, y - 20);
        ctx.lineTo(x + 5, y - 28);
        ctx.lineTo(x - 5, y - 28);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        // Light glow
        const glow = ctx.createRadialGradient(x, y - 24, 2, x, y - 24, 30);
        glow.addColorStop(0, 'rgba(210, 153, 34, 0.15)');
        glow.addColorStop(1, 'rgba(210, 153, 34, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y - 24, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawOfficeRoom(ctx, office, gpu) {
        const { x, y, w, h } = office;
        const isSelected = this.selectedOffice === office.index;
        const isHovered = this.hoveredOffice === office.index;

        // Room background (slightly different shade)
        ctx.fillStyle = '#161b22';
        ctx.fillRect(x, y, w, h);

        // Room border
        ctx.strokeStyle = isSelected ? '#58a6ff' : (isHovered ? '#7d8590' : '#30363d');
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, w, h);

        // Room header bar
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x, y, w, 24);
        ctx.fillStyle = '#e6edf3';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        const gpuName = gpu.name ? this._shortName(gpu.name) : `GPU ${office.index}`;
        ctx.fillText(`🖥️ ${gpuName}`, x + 8, y + 16);

        // Utilization indicator bar on header
        const util = gpu.utilization || 0;
        const barW = 60;
        const barX = x + w - barW - 12;
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(barX, y + 8, barW, 8);
        const fillW = (util / 100) * barW;
        const fillColor = util > 80 ? '#f85149' : util > 40 ? '#d29922' : '#3fb950';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, y + 8, fillW, 8);
        ctx.fillStyle = '#e6edf3';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(util)}%`, x + w - 12, y + 16);

        // Clip to room interior for furniture
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y + 24, w, h - 24);
        ctx.clip();

        // Floor of the room (slightly lighter)
        ctx.fillStyle = 'rgba(33, 38, 45, 0.5)';
        ctx.fillRect(x, y + 24, w, h - 24);

        // Draw furniture: desk, whiteboard, lounge chair
        this._drawDesk(ctx, office.deskX, office.deskY);
        this._drawWhiteboard(ctx, office.whiteboardX, office.whiteboardY);
        this._drawLoungeChair(ctx, office.loungeX, office.loungeY);

        // VRAM usage indicator (bottom of room)
        const vram = gpu.vram || {};
        const vramUsed = vram.used || 0;
        const vramTotal = vram.total || 1;
        const vramPct = Math.min(vramUsed / vramTotal, 1);
        const vramBarY = y + h - 6;
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(x + 4, vramBarY, w - 8, 4);
        ctx.fillStyle = vramPct > 0.85 ? '#f85149' : '#58a6ff';
        ctx.fillRect(x + 4, vramBarY, (w - 8) * vramPct, 4);

        // Temperature indicator
        const temp = gpu.temperature || 0;
        if (temp > 0) {
            ctx.fillStyle = temp > 75 ? '#f85149' : temp > 60 ? '#d29922' : '#7d8590';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`🌡️ ${Math.round(temp)}°C`, x + 6, y + h - 10);
        }

        // Power draw
        if (gpu.power_draw) {
            ctx.fillStyle = '#7d8590';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`⚡ ${gpu.power_draw}W`, x + w - 6, y + h - 10);
        }

        ctx.restore();

        // Door at bottom of room (visual indicator)
        if (h > 24) {
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(office.doorX - 12, y + h - 2, 24, 4);
        }
    }

    _drawDesk(ctx, x, y) {
        // Desk surface
        ctx.fillStyle = '#30363d';
        ctx.fillRect(x - 30, y + 10, 60, 6);
        // Desk legs
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x - 28, y + 16, 4, 14);
        ctx.fillRect(x + 24, y + 16, 4, 14);
        // Monitor stand
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x - 2, y + 16, 4, 3);
        // Keyboard hint
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(x - 12, y + 6, 24, 3);
    }

    _drawWhiteboard(ctx, x, y) {
        // Whiteboard frame
        ctx.fillStyle = '#30363d';
        ctx.fillRect(x - 22, y - 22, 44, 30);
        // Whiteboard surface
        ctx.fillStyle = '#c9d1d9';
        ctx.fillRect(x - 20, y - 20, 40, 26);
        // Some pre-drawn lines
        ctx.strokeStyle = 'rgba(125, 133, 144, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 18, y - 16 + i * 5);
            ctx.lineTo(x + 18, y - 16 + i * 5);
            ctx.stroke();
        }
        // Marker tray
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x - 18, y + 6, 36, 3);
    }

    _drawLoungeChair(ctx, x, y) {
        // Lounge chair
        ctx.fillStyle = '#30363d';
        ctx.beginPath();
        ctx.roundRect(x - 18, y - 8, 36, 18, 4);
        ctx.fill();
        // Cushion highlight
        ctx.fillStyle = 'rgba(125, 133, 144, 0.2)';
        ctx.fillRect(x - 16, y - 6, 32, 4);
        // Side table
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x + 22, y - 4, 10, 8);
    }

    _shortName(name) {
        // "NVIDIA GeForce RTX 3090" -> "RTX 3090"
        const parts = name.split(' ');
        const idx = parts.findIndex(p => p.length >= 3 && p === p.toUpperCase());
        if (idx >= 0 && idx < parts.length - 1) {
            return parts.slice(idx).join(' ');
        }
        // Fallback: last 2 words
        if (parts.length > 2) return parts.slice(-2).join(' ');
        return name;
    }
}