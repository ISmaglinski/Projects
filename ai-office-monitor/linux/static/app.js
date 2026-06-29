/* app.js - WebSocket client */
import { Scene } from './scene.js';

const WS_SCHEME = window.location.protocol === 'https:' ? 'wss' : 'ws';
const WS_URL = `${WS_SCHEME}://${window.location.host}/ws`;
const RECONNECT_DELAY = 3000;

let scene = null;
let ws = null;
let connected = false;
let demoInterval = null;

const canvas = document.getElementById('office-canvas');
const loadingOverlay = document.getElementById('loading-overlay');
const connPill = document.getElementById('stat-connection');
const connIcon = document.getElementById('conn-icon');
const connLabel = document.getElementById('conn-label');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');

function init() {
    scene = new Scene(canvas);
    scene.onSelectCallback = handleSelectGpu;
    window.setTimeout(() => {
        if (!connected) startDemoMode();
    }, 700);
    connectWebSocket();
}

function connectWebSocket() {
    try {
        ws = new WebSocket(WS_URL);
    } catch (_err) {
        startDemoMode();
        return;
    }

    ws.onopen = () => {
        connected = true;
        stopDemoMode();
        updateConnectionUI('connected');
        loadingOverlay.classList.add('hidden');
    };

    ws.onmessage = (e) => {
        try {
            applyState(JSON.parse(e.data));
        } catch (_err) {
            // Ignore one bad frame; the next monitor tick will replace it.
        }
    };

    ws.onclose = () => {
        connected = false;
        updateConnectionUI('disconnected');
        startDemoMode();
        window.setTimeout(() => {
            if (!connected) connectWebSocket();
        }, RECONNECT_DELAY);
    };

    ws.onerror = () => {
        if (ws) ws.close();
    };
}

function applyState(state) {
    scene.updateState(state);
    if (scene.selectedGpu !== null && state.gpus && state.gpus[scene.selectedGpu]) {
        handleSelectGpu(scene.selectedGpu, state.gpus[scene.selectedGpu]);
    }
}

function startDemoMode() {
    if (demoInterval || connected) return;
    loadingOverlay.classList.add('hidden');
    updateConnectionUI('demo');
    const startedAt = performance.now();
    const tick = () => {
        const t = (performance.now() - startedAt) / 1000;
        applyState(makeDemoState(t));
    };
    tick();
    demoInterval = window.setInterval(tick, 1000);
}

function stopDemoMode() {
    if (!demoInterval) return;
    window.clearInterval(demoInterval);
    demoInterval = null;
}

function updateConnectionUI(mode) {
    connPill.classList.toggle('connected', mode === 'connected');
    connPill.classList.toggle('disconnected', mode === 'disconnected');
    connPill.classList.toggle('demo', mode === 'demo');

    if (mode === 'connected') {
        connIcon.textContent = 'ON';
        connLabel.textContent = 'Connected';
    } else if (mode === 'demo') {
        connIcon.textContent = 'SIM';
        connLabel.textContent = 'Demo';
    } else {
        connIcon.textContent = 'OFF';
        connLabel.textContent = 'Disconnected';
    }
}

function handleSelectGpu(index, gpuData) {
    if (!gpuData) return;
    detailTitle.textContent = `Office ${index}: ${gpuData.name || `GPU ${index}`}`;

    const vramUsed = ((gpuData.vram && gpuData.vram.used) || 0) / 1024 ** 3;
    const vramTotal = ((gpuData.vram && gpuData.vram.total) || 0) / 1024 ** 3;
    const vramPct = vramTotal > 0 ? (vramUsed / vramTotal) * 100 : 0;
    const util = gpuData.utilization || 0;
    const temp = gpuData.temperature || 0;
    const power = gpuData.power_draw || 0;
    const powerLimit = gpuData.power_limit || 0;
    const fan = gpuData.fan_speed || 0;
    const procs = gpuData.processes || [];

    let html = '<div class="gpu-detail">';
    html += metric('Util', `${Math.round(util)}%`, util, clr(util));
    html += metric('VRAM', `${vramUsed.toFixed(1)}/${vramTotal.toFixed(0)} GB`, vramPct, clr(vramPct));
    html += metric('Temp', `${Math.round(temp)}C`, temp, clrT(temp));
    html += metric(
        'Power',
        powerLimit > 0 ? `${power}W / ${powerLimit}W` : `${power}W`,
        powerLimit > 0 ? (power / powerLimit) * 100 : 0,
        '#f2b84b'
    );
    html += metric('Fan', `${Math.round(fan)}%`, fan, '#69a7ff');
    html += '</div>';

    if (procs.length) {
        html += '<div class="process-list">';
        for (const p of procs) {
            const type = normalizeType(p.type);
            const vMB = (p.vram_used || 0) / 1024 ** 2;
            const rMB = (p.ram_used || 0) / 1024 ** 2;
            const model = p.model_name || p.name || 'Unknown';
            html += `<div class="process-item">
                <span class="proc-icon">${icon(type)}</span>
                <div class="proc-info">
                    <span class="proc-name">${esc(model)} <span class="badge badge-${type}">${type}</span></span>
                    <span class="proc-meta">PID:${esc(String(p.pid || '--'))} CPU:${esc(String(p.cpu_percent || 0))}% RAM:${rMB.toFixed(0)}MB</span>
                </div>
                <span class="proc-vram">${vMB.toFixed(0)}MB</span>
            </div>`;
        }
        html += '</div>';
    } else {
        html += '<p class="empty-state">No GPU processes running.</p>';
    }

    detailContent.innerHTML = html;
}

function metric(label, value, percent, color) {
    return `<div class="metric-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}</div>
        <div class="metric-bar"><div class="metric-bar-fill" style="width:${Math.min(percent, 100)}%;background:${color};"></div></div>
    </div>`;
}

function clr(value) {
    return value > 80 ? '#ff6f61' : value > 40 ? '#f2b84b' : '#64d27d';
}

function clrT(temp) {
    return temp > 75 ? '#ff6f61' : temp > 60 ? '#f2b84b' : '#64d27d';
}

function normalizeType(type) {
    const allowed = ['training', 'inference', 'script', 'compute', 'working', 'unknown'];
    return allowed.includes(type) ? type : 'unknown';
}

function icon(type) {
    return {
        training: 'TR',
        inference: 'AI',
        script: 'SH',
        compute: 'GPU',
        working: 'WK',
        unknown: '--',
    }[type] || '--';
}

function esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function makeDemoState(t) {
    const gb = 1024 ** 3;
    const specs = [
        { name: 'NVIDIA RTX 4090', type: 'inference', model: 'llama-router', base: 52, phase: 0 },
        { name: 'NVIDIA RTX 3090', type: 'script', model: 'batch_render.py', base: 37, phase: 1.8 },
        { name: 'NVIDIA A6000', type: 'training', model: 'vision-finetune', base: 82, phase: 3.1 },
        { name: 'NVIDIA L40S', type: 'compute', model: 'embedding-build', base: 64, phase: 4.7 },
    ];

    const gpus = specs.map((spec, index) => {
        const wave = Math.sin(t * 0.75 + spec.phase);
        const utilization = Math.round(clamp(spec.base + wave * 16, 5, 98));
        const total = index === 2 ? 48 * gb : index === 3 ? 46 * gb : 24 * gb;
        const usedPct = clamp(utilization / 115 + 0.08 * Math.sin(t + index), 0.06, 0.92);
        return {
            id: index,
            name: spec.name,
            utilization,
            memory_utilization: Math.round(usedPct * 100),
            vram: {
                used: total * usedPct,
                total,
                free: total * (1 - usedPct),
            },
            temperature: Math.round(44 + utilization * 0.36 + Math.sin(t + index) * 3),
            power_draw: Math.round(90 + utilization * 2.2),
            power_limit: index === 0 ? 450 : 350,
            fan_speed: Math.round(clamp(20 + utilization * 0.65, 20, 94)),
            processes: [
                {
                    pid: 8000 + index,
                    name: spec.model,
                    model_name: spec.model,
                    type: spec.type,
                    cpu_percent: Math.round(4 + utilization * 0.18),
                    ram_used: (1.2 + index * 0.7) * gb,
                    vram_used: total * usedPct * 0.86,
                    cmdline: '',
                    create_time: 0,
                },
            ],
        };
    });

    return {
        gpus,
        system: {
            cpu_percent: Math.round(clamp(28 + Math.sin(t * 0.9) * 15, 6, 88)),
            cpu_count: 16,
            ram: {
                used: (34 + Math.sin(t * 0.6) * 7) * gb,
                total: 64 * gb,
                percent: 55,
            },
        },
        timestamp: t,
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

init();
