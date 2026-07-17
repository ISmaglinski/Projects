from __future__ import annotations

import queue
import threading
from collections.abc import Callable
from typing import Protocol

import numpy as np


class Transcriber(Protocol):
    def transcribe(self, audio: np.ndarray, sample_rate: int) -> str:
        """Transcribe a mono float32 audio block."""


class NullTranscriber:
    def transcribe(self, audio: np.ndarray, sample_rate: int) -> str:
        return ""


class FasterWhisperTranscriber:
    """Optional faster-whisper transcriber loaded only when requested."""

    def __init__(self, model_name: str) -> None:
        from faster_whisper import WhisperModel

        self.model = WhisperModel(model_name, device="auto", compute_type="auto")

    def transcribe(self, audio: np.ndarray, sample_rate: int) -> str:
        segments, _ = self.model.transcribe(np.asarray(audio, dtype=np.float32), beam_size=1)
        return " ".join(segment.text.strip() for segment in segments).strip()


class AsyncSttWorker:
    """Background speech-to-text worker so audio output is not blocked by transcription."""

    def __init__(self, transcriber: Transcriber, on_text: Callable[[str], None]) -> None:
        self._transcriber = transcriber
        self._on_text = on_text
        self._queue: queue.Queue[tuple[np.ndarray, int] | None] = queue.Queue(maxsize=2)
        self._thread = threading.Thread(target=self._run, name="stt-worker", daemon=True)

    def start(self) -> None:
        self._thread.start()

    def submit(self, audio: np.ndarray, sample_rate: int) -> None:
        try:
            self._queue.put_nowait((np.asarray(audio, dtype=np.float32).copy(), sample_rate))
        except queue.Full:
            pass

    def stop(self) -> None:
        self._queue.put(None)
        self._thread.join(timeout=2)

    def _run(self) -> None:
        while True:
            item = self._queue.get()
            if item is None:
                return
            audio, sample_rate = item
            text = self._transcriber.transcribe(audio, sample_rate)
            if text:
                self._on_text(text)
