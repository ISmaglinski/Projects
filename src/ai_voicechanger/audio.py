from __future__ import annotations

import threading
from collections.abc import Callable

import numpy as np
import sounddevice as sd

from .converters import VoiceConverter
from .device_labels import format_device_choice
from .stt import AsyncSttWorker

TextCallback = Callable[[str], None]


def list_devices() -> str:
    return str(sd.query_devices())


def device_choices(kind: str) -> list[str]:
    """Return UI-friendly sounddevice labels filtered by input or output capability."""

    if kind not in {"input", "output"}:
        raise ValueError("kind must be 'input' or 'output'")
    channel_key = "max_input_channels" if kind == "input" else "max_output_channels"
    choices: list[str] = []
    for index, device in enumerate(sd.query_devices()):
        if int(device.get(channel_key, 0)) > 0:
            hostapi = sd.query_hostapis(device["hostapi"])["name"]
            choices.append(format_device_choice(index, str(device["name"]), str(hostapi)))
    return choices


class VoiceChangerStream:
    """Full-duplex microphone capture, conversion, and output stream."""

    def __init__(
        self,
        converter: VoiceConverter,
        input_device: str | int | None,
        output_device: str | int | None,
        sample_rate: int,
        block_size: int,
        stt_worker: AsyncSttWorker | None = None,
    ) -> None:
        self.converter = converter
        self.input_device = input_device
        self.output_device = output_device
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.stt_worker = stt_worker
        self._stop = threading.Event()

    def run_forever(self) -> None:
        if self.stt_worker is not None:
            self.stt_worker.start()
        try:
            with sd.Stream(
                samplerate=self.sample_rate,
                blocksize=self.block_size,
                dtype="float32",
                channels=1,
                device=(self.input_device, self.output_device),
                callback=self._callback,
            ):
                print("Voice changer running. Press Ctrl+C to stop.")
                self._stop.wait()
        except KeyboardInterrupt:
            pass
        finally:
            if self.stt_worker is not None:
                self.stt_worker.stop()

    def stop(self) -> None:
        self._stop.set()

    def _callback(self, indata, outdata, frames, time, status) -> None:  # noqa: ANN001
        if status:
            print(f"Audio status: {status}")
        source = np.asarray(indata[:, 0], dtype=np.float32)
        if self.stt_worker is not None:
            self.stt_worker.submit(source, self.sample_rate)
        converted = self.converter.convert(source, self.sample_rate)
        outdata[:, 0] = _fit_block(converted, frames)


def _fit_block(audio: np.ndarray, frames: int) -> np.ndarray:
    mono = np.asarray(audio, dtype=np.float32).reshape(-1)
    if len(mono) >= frames:
        return mono[:frames]
    padded = np.zeros(frames, dtype=np.float32)
    padded[: len(mono)] = mono
    return padded
