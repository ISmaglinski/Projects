# AI Voicechanger

This project is a Python scaffold for a live voice changer that uses RVC-style `.pth` model files and `.index` feature-index files.

> Important: RVC `.pth` + `.index` models are **voice conversion** models. They convert one audio signal into another voice. They do not accept raw text directly. The practical low-latency flow is:
>
> `microphone audio -> optional speech-to-text captions/logging -> RVC voice conversion -> virtual audio device -> Discord/game`

If you truly want `microphone -> speech-to-text -> generated voice`, that is a speech-to-text plus text-to-speech app, and the `.pth`/`.index` RVC files are not the part that reads the text. This scaffold keeps speech-to-text optional and routes the original microphone audio through an RVC backend.

## What is included

- A desktop UI entry point: `ai-voicechanger-gui`
- A command-line app entry point: `ai-voicechanger`
- Device listing for microphone/output selection
- A stream pipeline that captures microphone audio and writes processed audio to an output device
- Optional speech-to-text worker for captions/debugging
- Validation for `.pth` and `.index` files
- A pluggable RVC converter interface with:
  - `passthrough` mode for testing audio routing
  - `external-rvc` mode that calls a user-provided command for conversion

## Recommended Discord/game routing

Install a virtual audio cable and set it as the app output, then choose that virtual cable as the microphone in Discord or your game:

- Windows: VB-CABLE, VoiceMeeter, SteelSeries Sonar, or similar
- macOS: BlackHole or Loopback
- Linux: PulseAudio/PipeWire virtual sink/source

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[stt,dev]
```

If you only want audio routing without transcription:

```bash
pip install -e .
```

## Put model files in place

Place your model files somewhere on disk, for example:

```text
models/my_voice.pth
models/added_IVF.index
```

Large model files should not be committed to git.

## Launch the desktop UI

```bash
ai-voicechanger-gui
```

Use the UI to:

1. Pick your microphone input.
2. Pick the output device that Discord or your game should hear, usually a virtual audio cable.
3. Start with `passthrough` to confirm routing works.
4. Switch to `external-rvc` and browse for your `.pth` and `.index` files.
5. Enter the RVC command template that converts `{input}` into `{output}`.

The UI also shows a checklist of what you need: microphone, virtual cable, RVC model/index files, optional STT model, and headphones.

## List audio devices from the CLI

```bash
ai-voicechanger --list-devices
```

## Run in passthrough mode from the CLI first

This verifies microphone capture and virtual audio output before adding RVC inference:

```bash
ai-voicechanger \
  --input-device "Your Microphone" \
  --output-device "CABLE Input" \
  --backend passthrough
```

## Run with `.pth` and `.index` validation

```bash
ai-voicechanger \
  --input-device "Your Microphone" \
  --output-device "CABLE Input" \
  --backend external-rvc \
  --pth models/my_voice.pth \
  --index models/added_IVF.index \
  --rvc-command "python path/to/rvc_infer_cli.py --input {input} --output {output} --model {pth} --index {index}"
```

`external-rvc` writes each audio chunk to a temporary WAV file, calls your command, and reads the converted WAV back. This is simple and backend-agnostic, but it is not the lowest-latency architecture. For production realtime use, replace `ExternalRvcConverter` with a direct in-process RVC inference implementation.

## Enable speech-to-text captions

```bash
ai-voicechanger \
  --input-device "Your Microphone" \
  --output-device "CABLE Input" \
  --backend passthrough \
  --stt-model small.en
```

Speech-to-text is for captions/logging in this app. It is intentionally not fed into the RVC `.pth`/`.index` files because those models expect audio, not text.

## Latency notes

For Discord or games, latency matters. Start with:

- Wired headphones to avoid feedback
- A virtual cable as the app output
- `--block-ms 80` or lower if your machine can keep up
- GPU-backed RVC inference if you add a direct backend

The external command backend is best for proving the integration. A direct backend is recommended for real-time usage.
