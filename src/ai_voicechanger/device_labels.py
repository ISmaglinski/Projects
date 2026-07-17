from __future__ import annotations


def format_device_choice(index: int, name: str, hostapi: str) -> str:
    """Format a sounddevice entry for display in the UI."""

    return f"{index}: {name} ({hostapi})"


def parse_device_selection(selection: str) -> int | None:
    """Return the sounddevice index from a UI label like '3: Microphone'."""

    if not selection.strip():
        return None
    index_text = selection.split(":", 1)[0]
    return int(index_text)
