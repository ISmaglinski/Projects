from __future__ import annotations

import shlex
import subprocess
import tempfile
from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np
import soundfile as sf


class VoiceConverter(ABC):
    """Converts source voice audio into target voice audio."""

    @abstractmethod
    def convert(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        """Return converted audio with the same shape and sample rate when possible."""


class PassthroughConverter(VoiceConverter):
    """No-op converter useful for testing device routing."""

    def convert(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        return np.asarray(audio, dtype=np.float32)


class ExternalRvcConverter(VoiceConverter):
    """RVC adapter that shells out to a user-supplied inference command.

    The command may include these placeholders:
    - {input}: temporary input WAV path
    - {output}: temporary converted WAV path
    - {pth}: RVC .pth model path
    - {index}: RVC .index file path
    - {sample_rate}: current sample rate
    """

    def __init__(self, pth_path: Path, index_path: Path, command_template: str) -> None:
        self.pth_path = pth_path
        self.index_path = index_path
        self.command_template = command_template

    def convert(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        source = np.asarray(audio, dtype=np.float32)
        with tempfile.TemporaryDirectory(prefix="ai-voicechanger-") as tmpdir:
            input_path = Path(tmpdir) / "input.wav"
            output_path = Path(tmpdir) / "output.wav"
            sf.write(input_path, source, sample_rate)

            command = self.command_template.format(
                input=str(input_path),
                output=str(output_path),
                pth=str(self.pth_path),
                index=str(self.index_path),
                sample_rate=sample_rate,
            )
            subprocess.run(shlex.split(command), check=True)

            if not output_path.is_file():
                raise RuntimeError(f"RVC command completed but did not create {output_path}")
            converted, converted_rate = sf.read(output_path, dtype="float32", always_2d=False)
            if converted_rate != sample_rate:
                raise RuntimeError(
                    f"RVC command returned {converted_rate} Hz audio, expected {sample_rate} Hz"
                )
            return np.asarray(converted, dtype=np.float32)


def build_converter(
    backend: str,
    pth_path: Path | None = None,
    index_path: Path | None = None,
    rvc_command: str | None = None,
) -> VoiceConverter:
    if backend == "passthrough":
        return PassthroughConverter()
    if backend == "external-rvc":
        if pth_path is None or index_path is None or rvc_command is None:
            raise ValueError("external-rvc requires pth_path, index_path, and rvc_command")
        return ExternalRvcConverter(pth_path, index_path, rvc_command)
    raise ValueError(f"Unsupported backend: {backend}")
