from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

BackendName = Literal["passthrough", "external-rvc"]


@dataclass(frozen=True)
class VoiceChangerConfig:
    """Runtime configuration for the microphone-to-voice-conversion pipeline."""

    input_device: str | int | None = None
    output_device: str | int | None = None
    sample_rate: int = 48_000
    block_ms: int = 120
    backend: BackendName = "passthrough"
    pth_path: Path | None = None
    index_path: Path | None = None
    rvc_command: str | None = None
    stt_model: str | None = None

    @property
    def block_size(self) -> int:
        return max(1, int(self.sample_rate * self.block_ms / 1000))

    def validate(self) -> None:
        if self.sample_rate <= 0:
            raise ValueError("sample_rate must be positive")
        if self.block_ms <= 0:
            raise ValueError("block_ms must be positive")
        if self.backend == "external-rvc":
            if self.pth_path is None:
                raise ValueError("--pth is required when --backend external-rvc is used")
            if self.index_path is None:
                raise ValueError("--index is required when --backend external-rvc is used")
            if self.rvc_command is None:
                raise ValueError("--rvc-command is required when --backend external-rvc is used")
            if not self.pth_path.is_file():
                raise FileNotFoundError(f"PTH model not found: {self.pth_path}")
            if not self.index_path.is_file():
                raise FileNotFoundError(f"Index file not found: {self.index_path}")
