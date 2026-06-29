# AI Office Monitor

A real-time visualization tool that shows your GPU workload as animated office workers.

## Features

- Live GPU monitoring (utilization, VRAM, temp, power, fan speed)
- Animated worker figures for each GPU
- Workers type at desks, write on whiteboards, train with particle effects, or relax in lounge
- Automatic model name detection from process command lines
- Click any office for detailed metrics and process list
- PWA installable

## Setup

### Linux GPU Server

1. pip install -r requirements.txt
2. python server.py (starts on port 8765)

### Windows PC

Open http://<server-ip>:8765 in your browser

## Files

- gpu_monitor.py: NVIDIA GPU stats via pynvml
- process_detector.py: Process detection via psutil
- server.py: FastAPI + WebSocket server
- static/: Frontend (HTML/CSS/JS)
