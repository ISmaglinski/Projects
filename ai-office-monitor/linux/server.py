"""FastAPI server with WebSocket for real-time GPU monitoring."""
import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import gpu_monitor
import process_detector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

STATIC_DIR = Path(__file__).parent / "static"
UPDATE_INTERVAL = 1.0  # seconds between updates

connected_clients: set[WebSocket] = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Office Monitor server...")
    gpu_monitor.init()
    logger.info(f"Detected {gpu_monitor.get_gpu_count()} GPU(s)")
    yield
    gpu_monitor.shutdown()
    logger.info("Server shutting down.")


app = FastAPI(title="AI Office Monitor", lifespan=lifespan)


def collect_state() -> dict:
    """Collect full system state for broadcasting."""
    try:
        gpus = gpu_monitor.get_all_gpus()
        for gpu in gpus:
            gpu["processes"] = process_detector.enrich_processes(gpu.get("processes", []))
        system = process_detector.get_system_info()
        return {
            "gpus": gpus,
            "system": system,
            "timestamp": asyncio.get_event_loop().time(),
        }
    except Exception as e:
        logger.error(f"Error collecting state: {e}")
        return {"gpus": [], "system": {}, "timestamp": 0, "error": str(e)}


async def broadcast_loop():
    """Background task that broadcasts state to all connected clients."""
    logger.info("Broadcast loop started")
    while True:
        if connected_clients:
            state = collect_state()
            message = json.dumps(state)
            # Send to all clients, remove disconnected ones
            disconnected = set()
            for client in connected_clients:
                try:
                    await client.send_text(message)
                except Exception:
                    disconnected.add(client)
            connected_clients.difference_update(disconnected)
        await asyncio.sleep(UPDATE_INTERVAL)


@app.on_event("startup")
async def start_broadcast():
    asyncio.create_task(broadcast_loop())


@app.get("/api/state")
async def get_state():
    """REST endpoint for one-shot state (useful for testing)."""
    return collect_state()


@app.get("/api/health")
async def health():
    return {"status": "ok", "gpus": gpu_monitor.get_gpu_count()}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"Client connected. Total: {len(connected_clients)}")
    # Send initial state immediately
    try:
        await websocket.send_text(json.dumps(collect_state()))
        while True:
            # Keep connection alive; we broadcast from the loop
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
    finally:
        connected_clients.discard(websocket)
        logger.info(f"Client removed. Total: {len(connected_clients)}")


# Serve static frontend files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def index():
    return FileResponse(str(STATIC_DIR / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="info")