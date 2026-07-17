from __future__ import annotations

import argparse
from pathlib import Path

from .audio import VoiceChangerStream, list_devices
from .config import VoiceChangerConfig
from .converters import build_converter
from .stt import AsyncSttWorker, FasterWhisperTranscriber


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Microphone -> optional STT captions -> RVC voice conversion -> output device"
    )
    parser.add_argument("--list-devices", action="store_true", help="Print audio device list and exit")
    parser.add_argument("--input-device", help="Input device name or index")
    parser.add_argument("--output-device", help="Output device name or index, ideally a virtual cable")
    parser.add_argument("--sample-rate", type=int, default=48_000)
    parser.add_argument("--block-ms", type=int, default=120)
    parser.add_argument("--backend", choices=["passthrough", "external-rvc"], default="passthrough")
    parser.add_argument("--pth", type=Path, help="Path to RVC .pth model")
    parser.add_argument("--index", type=Path, help="Path to RVC .index file")
    parser.add_argument(
        "--rvc-command",
        help="External RVC command. Supports {input}, {output}, {pth}, {index}, and {sample_rate}.",
    )
    parser.add_argument("--stt-model", help="Optional faster-whisper model name, e.g. small.en")
    return parser.parse_args()


def _coerce_device(value: str | None) -> str | int | None:
    if value is None:
        return None
    try:
        return int(value)
    except ValueError:
        return value


def main() -> None:
    args = parse_args()
    if args.list_devices:
        print(list_devices())
        return

    config = VoiceChangerConfig(
        input_device=_coerce_device(args.input_device),
        output_device=_coerce_device(args.output_device),
        sample_rate=args.sample_rate,
        block_ms=args.block_ms,
        backend=args.backend,
        pth_path=args.pth,
        index_path=args.index,
        rvc_command=args.rvc_command,
        stt_model=args.stt_model,
    )
    config.validate()

    converter = build_converter(
        backend=config.backend,
        pth_path=config.pth_path,
        index_path=config.index_path,
        rvc_command=config.rvc_command,
    )

    stt_worker = None
    if config.stt_model:
        transcriber = FasterWhisperTranscriber(config.stt_model)
        stt_worker = AsyncSttWorker(transcriber, lambda text: print(f"[stt] {text}"))

    stream = VoiceChangerStream(
        converter=converter,
        input_device=config.input_device,
        output_device=config.output_device,
        sample_rate=config.sample_rate,
        block_size=config.block_size,
        stt_worker=stt_worker,
    )
    stream.run_forever()


if __name__ == "__main__":
    main()
