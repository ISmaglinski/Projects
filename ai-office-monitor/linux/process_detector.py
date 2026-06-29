"""Process detection and model name identification using psutil."""
import psutil
import logging
import re
import os

logger = logging.getLogger(__name__)

# Common model file patterns
MODEL_PATTERNS = [
    (re.compile(r'([\w\-\.]+\.gguf)', re.IGNORECASE), 'gguf'),
    (re.compile(r'([\w\-\.]+\.safetensors)', re.IGNORECASE), 'safetensors'),
    (re.compile(r'([\w\-\.]+\.bin)\b', re.IGNORECASE), 'bin'),
    (re.compile(r'([\w\-\.]+\.pt)\b', re.IGNORECASE), 'pt'),
    (re.compile(r'([\w\-\.]+\.pth)\b', re.IGNORECASE), 'pth'),
    (re.compile(r'([\w\-\.]+\.ckpt)', re.IGNORECASE), 'ckpt'),
]

# Common model path patterns (HuggingFace, local dirs)
HF_PATTERN = re.compile(r'(?:models|hub|hf)[\/\\]([\w\-\.\/]+)', re.IGNORECASE)
GENERAL_MODEL_PATTERN = re.compile(r'--model[ =]+([^\s]+)', re.IGNORECASE)
SERVE_PATTERN = re.compile(r'(?:vllm|sglang|tgi|triton|text-generation|ollama)', re.IGNORECASE)
TRAIN_PATTERN = re.compile(r'(?:train|finetune|trainer|deepspeed|accelerate)', re.IGNORECASE)
INFERENCE_PATTERN = re.compile(r'(?:inference|generate|complet|chat|serve|llama\.cpp|llama-cpp|vllm)', re.IGNORECASE)
SCRIPT_PATTERN = re.compile(r'(?:^|\s|[\/\\])[\w\-.]+\.py\b|python(?:3)?\s+-m\s+[\w.]+', re.IGNORECASE)


def enrich_processes(gpu_processes):
    """Take GPU process list (from nvml) and enrich with psutil info."""
    enriched = []
    for proc in gpu_processes:
        pid = proc.get("pid")
        if not pid:
            continue
        try:
            p = psutil.Process(pid)
            cmdline = p.cmdline()
            name = p.name()
            cpu_percent = p.cpu_percent(interval=0.05)
            memory_info = p.memory_info()
            try:
                cwd = p.cwd()
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                cwd = ""

            model_name = _detect_model_name(cmdline, name)
            work_type = _detect_work_type(cmdline, name)

            enriched.append({
                "pid": pid,
                "name": name,
                "cmdline": " ".join(cmdline[:16]) if cmdline else "",
                "cwd": cwd,
                "status": p.status(),
                "threads": p.num_threads(),
                "model_name": model_name,
                "type": work_type,
                "cpu_percent": round(cpu_percent, 1),
                "ram_used": memory_info.rss if memory_info else 0,
                "vram_used": proc.get("vram_used", 0),
                "create_time": p.create_time(),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            # Process may have died or we don't have permissions
            enriched.append({
                "pid": pid,
                "name": "unknown",
                "cmdline": "",
                "model_name": None,
                "type": "unknown",
                "cpu_percent": 0,
                "ram_used": 0,
                "vram_used": proc.get("vram_used", 0),
                "create_time": 0,
            })
        except Exception as e:
            logger.warning(f"Error enriching process {pid}: {e}")
            enriched.append({
                "pid": pid,
                "name": "error",
                "cmdline": "",
                "model_name": None,
                "type": "unknown",
                "cpu_percent": 0,
                "ram_used": 0,
                "vram_used": proc.get("vram_used", 0),
                "create_time": 0,
            })
    return enriched


def _detect_model_name(cmdline, process_name):
    """Try to identify the model name from command line arguments."""
    if not cmdline:
        return None
    full_cmd = " ".join(cmdline)

    # Check for explicit --model flag
    m = GENERAL_MODEL_PATTERN.search(full_cmd)
    if m:
        path = m.group(1)
        return os.path.basename(path.rstrip("/"))

    # Check for model file patterns
    for pattern, _ext in MODEL_PATTERNS:
        m = pattern.search(full_cmd)
        if m:
            return m.group(1)

    # Check HuggingFace-style paths
    m = HF_PATTERN.search(full_cmd)
    if m:
        parts = m.group(1).split("/")
        return parts[-1] if parts else m.group(1)

    # Ollama: ollama run llama2 -> model is next arg after "run"
    if "ollama" in full_cmd.lower():
        parts = full_cmd.split()
        if "run" in parts:
            idx = parts.index("run")
            if idx + 1 < len(parts):
                return parts[idx + 1]

    return None


def _detect_work_type(cmdline, process_name):
    """Determine the type of work the process is doing."""
    if not cmdline:
        return "unknown"
    full_cmd = " ".join(cmdline).lower()

    if TRAIN_PATTERN.search(full_cmd):
        return "training"
    if SERVE_PATTERN.search(full_cmd) or INFERENCE_PATTERN.search(full_cmd):
        return "inference"
    if SCRIPT_PATTERN.search(full_cmd):
        return "script"
    if "python" in (process_name or "").lower() or "python3" in (process_name or "").lower():
        return "compute"
    return "working"


def get_system_info():
    """Get overall system CPU/RAM info."""
    try:
        vm = psutil.virtual_memory()
        return {
            "cpu_percent": round(psutil.cpu_percent(interval=0.1), 1),
            "cpu_count": psutil.cpu_count(),
            "ram": {
                "used": vm.used,
                "total": vm.total,
                "percent": vm.percent,
            },
            "load_avg": list(psutil.getloadavg()) if hasattr(psutil, "getloadavg") else [],
        }
    except Exception as e:
        logger.warning(f"Error getting system info: {e}")
        return {
            "cpu_percent": 0,
            "cpu_count": 0,
            "ram": {"used": 0, "total": 0, "percent": 0},
            "load_avg": [],
        }
