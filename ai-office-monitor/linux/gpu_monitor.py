"""GPU monitoring using pynvml (NVIDIA Management Library)."""
import pynvml
import logging

logger = logging.getLogger(__name__)
_initialized = False


def init():
    global _initialized
    if _initialized:
        return
    try:
        pynvml.nvmlInit()
        _initialized = True
        logger.info("NVML initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize NVML: {e}")
        raise


def shutdown():
    global _initialized
    if _initialized:
        pynvml.nvmlShutdown()
        _initialized = False


def get_gpu_count():
    if not _initialized:
        init()
    return pynvml.nvmlDeviceGetCount()


def get_gpu_info(index):
    """Get detailed info for a single GPU."""
    if not _initialized:
        init()
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(index)
        name = pynvml.nvmlDeviceGetName(handle)
        if isinstance(name, bytes):
            name = name.decode("utf-8", errors="replace")

        utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
        memory = pynvml.nvmlDeviceGetMemoryInfo(handle)
        temperature = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
        power_draw = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0  # mW -> W
        power_limit = pynvml.nvmlDeviceGetPowerManagementLimit(handle) / 1000.0

        # Get processes on this GPU
        processes = []
        try:
            procs = pynvml.nvmlDeviceGetComputeRunningProcesses(handle)
            for p in procs:
                processes.append({
                    "pid": p.pid,
                    "vram_used": p.usedGpuMemory if hasattr(p, "usedGpuMemory") else 0,
                })
        except Exception as e:
            logger.warning(f"Could not get processes for GPU {index}: {e}")

        return {
            "id": index,
            "name": name,
            "utilization": utilization.gpu,
            "memory_utilization": utilization.memory,
            "vram": {
                "used": memory.used,
                "total": memory.total,
                "free": memory.free,
            },
            "temperature": temperature,
            "power_draw": round(power_draw, 1),
            "power_limit": round(power_limit, 1),
            "fan_speed": _safe_get_fan(handle),
            "processes": processes,
        }
    except Exception as e:
        logger.error(f"Error getting GPU {index} info: {e}")
        return {
            "id": index,
            "name": "Unknown",
            "utilization": 0,
            "memory_utilization": 0,
            "vram": {"used": 0, "total": 0, "free": 0},
            "temperature": 0,
            "power_draw": 0,
            "power_limit": 0,
            "fan_speed": 0,
            "processes": [],
        }


def _safe_get_fan(handle):
    try:
        return pynvml.nvmlDeviceGetFanSpeed(handle)
    except Exception:
        return 0


def get_all_gpus():
    """Get info for all GPUs."""
    if not _initialized:
        init()
    count = get_gpu_count()
    return [get_gpu_info(i) for i in range(count)]