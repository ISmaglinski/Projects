/* app.js - WebSocket client */
import { Scene } from './scene.js';

const WS_URL = 'ws://' + window.location.host + '/ws';
const RECONNECT_DELAY = 3000;
let scene = null, ws = null, connected = false;

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
  connectWebSocket();
}

function connectWebSocket() {
  ws = new WebSocket(WS_URL);
  ws.onopen = () => { connected = true; updateConnectionUI(true); loadingOverlay.classList.add('hidden'); };
  ws.onmessage = (e) => { try { scene.updateState(JSON.parse(e.data)); } catch(err) {} };
  ws.onclose = () => { connected = false; updateConnectionUI(false); setTimeout(() => { if (!connected) connectWebSocket(); }, RECONNECT_DELAY); };
}

function updateConnectionUI(c) {
  if (c) { connPill.classList.add('connected'); connPill.classList.remove('disconnected'); connIcon.textContent = 'OK'; connLabel.textContent = 'Connected'; }
  else { connPill.classList.remove('connected'); connPill.classList.add('disconnected'); connIcon.textContent = '--'; connLabel.textContent = 'Disconnected'; }
}

function handleSelectGpu(index, gpuData) {
  if (!gpuData) return;
  detailTitle.textContent = 'Office ' + index + ': ' + (gpuData.name || ('GPU ' + index));
  const vramUsed = ((gpuData.vram && gpuData.vram.used) || 0) / (1024**3);
  const vramTotal = ((gpuData.vram && gpuData.vram.total) || 0) / (1024**3);
  const vramPct = vramTotal > 0 ? (vramUsed/vramTotal)*100 : 0;
  const util = gpuData.utilization || 0;
  const temp = gpuData.temperature || 0;
  const power = gpuData.power_draw || 0;
  const powerLimit = gpuData.power_limit || 0;
  const fan = gpuData.fan_speed || 0;
  const procs = gpuData.processes || [];
  let h = '<div class="gpu-detail">';
  h += metric('Util', Math.round(util)+'%', util, clr(util));
  h += metric('VRAM', vramUsed.toFixed(1)+'/'+vramTotal.toFixed(0)+' GB', vramPct, clr(vramPct));
  h += metric('Temp', Math.round(temp)+'C', temp/100, clrT(temp));
  h += metric('Power', power+'W / '+powerLimit+'W', powerLimit>0?power/powerLimit*100:0, '#d29922');
  h += metric('Fan', Math.round(fan)+'%', fan, '#58a6ff');
  h += '</div>';
  if (procs.length) {
    h += '<div class="process-list">';
    for (const p of procs) {
      const vMB = (p.vram_used||0)/(1024**2);
      const rMB = (p.ram_used||0)/(1024**2);
      const model = p.model_name || 'Unknown';
      h += '<div class="process-item"><span class="proc-icon">' + icon(p.type) + '</span><div class="proc-info"><span class="proc-name">' + esc(model) + ' <span class="badge badge-' + p.type + '">' + p.type + '</span></span><span class="proc-meta">PID:' + p.pid + ' CPU:' + p.cpu_percent + '% RAM:' + rMB.toFixed(0) + 'MB</span></div><span class="proc-vram">' + vMB.toFixed(0) + 'MB</span></div>';
    }
    h += '</div>';
  } else { h += '<p style="color:var(--text-secondary);font-size:13px;">No processes running.</p>'; }
  detailContent.innerHTML = h;
}

function metric(l,v,p,c) { return '<div class="metric-card"><div class="metric-label">' + l + '</div><div class="metric-value">' + v + '</div><div class="metric-bar"><div class="metric-bar-fill" style="width:' + Math.min(p,100) + '%;background:' + c + ';"></div></div></div>'; }
function clr(v) { return v>80?'#f85149':v>40?'#d29922':'#3fb950'; }
function clrT(t) { return t>75?'#f85149':t>60?'#d29922':'#3fb950'; }
function icon(t) { return {training:'[T]',inference:'[I]',compute:'[C]',working:'[W]',unknown:'[?]?'}[t]||'[?]'; }
function esc(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
init();
