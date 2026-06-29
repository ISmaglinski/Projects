/* scene.js - Game loop and state management */

import { Office } from './office.js?v=3';
import { Worker } from './worker.js?v=3';

export class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.office = new Office(canvas);
        this.workers = [];
        this.gpus = [];
        this.system = {};
        this.lastTime = performance.now();
        this.selectedGpu = null;
        this.onSelectCallback = null;

        this._setupEvents();
        this._resize();

        this._running = true;
        this._loop();
    }

    _resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this._resize();
            if (this.gpus.length > 0) {
                this._rebuildLayout();
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const office = this.office.getOfficeAt(x, y);
            if (office) {
                this.selectGpu(office.index);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const office = this.office.getOfficeAt(x, y);
            this.office.hoveredOffice = office ? office.index : null;
            this.canvas.style.cursor = office ? 'pointer' : 'default';
        });

        const detailHeader = document.querySelector('.detail-header');
        const detailPanel = document.getElementById('detail-panel');
        if (detailHeader) {
            detailHeader.addEventListener('click', () => {
                detailPanel.classList.toggle('collapsed');
            });
        }
    }

    updateState(state) {
        const gpuCount = (state.gpus || []).length;
        this.gpus = state.gpus || [];
        this.system = state.system || {};

        if (gpuCount !== this.office.gpuCount) {
            this._rebuildLayout();
        }

        for (let i = 0; i < this.gpus.length; i++) {
            if (this.workers[i]) {
                this.workers[i].updateFromGpu(this.gpus[i]);
            }
        }

        this._updateTopBar();
    }

    _rebuildLayout() {
        const count = this.gpus.length;
        this.office.layout(count);
        this.workers = [];
        for (let i = 0; i < count; i++) {
            const layoutObj = this.office.offices[i];
            const worker = new Worker(i, layoutObj);
            if (this.gpus[i] && this.gpus[i].name) {
                worker.name = this.office._shortName(this.gpus[i].name);
            }
            this.workers.push(worker);
        }
    }

    _updateTopBar() {
        const cpuEl = document.getElementById('cpu-value');
        if (cpuEl && this.system.cpu_percent !== undefined) {
            cpuEl.textContent = `${this.system.cpu_percent}%`;
        }

        const ramEl = document.getElementById('ram-value');
        if (ramEl && this.system.ram) {
            const ramUsed = (this.system.ram.used / (1024 ** 3)).toFixed(1);
            const ramTotal = (this.system.ram.total / (1024 ** 3)).toFixed(0);
            ramEl.textContent = `${ramUsed}/${ramTotal}GB`;
        }

        const gpuEl = document.getElementById('gpu-count');
        if (gpuEl) {
            gpuEl.textContent = this.gpus.length;
        }
    }

    selectGpu(index) {
        this.selectedGpu = index;
        this.office.selectedOffice = index;
        if (this.onSelectCallback) {
            this.onSelectCallback(index, this.gpus[index]);
        }
    }

    _loop() {
        if (!this._running) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        this._update(dt);
        this._draw(dt);
        requestAnimationFrame(() => this._loop());
    }

    _update(dt) {
        for (const worker of this.workers) {
            worker.update(dt);
        }
    }

    _draw(dt) {
        this.office.draw(dt, this.gpus);
        for (const worker of this.workers) {
            worker.updateFromGpu(this.gpus[worker.gpuIndex] || {});
            const layoutObj = worker.layout;
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(layoutObj.x, layoutObj.y + 24, layoutObj.w, layoutObj.h - 24);
            this.ctx.clip();
            worker.draw(this.ctx);
            this.ctx.restore();
        }
    }

    stop() {
        this._running = false;
    }
}
