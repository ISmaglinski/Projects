from pathlib import Path

import pytest

from ai_voicechanger.config import VoiceChangerConfig


def test_block_size_uses_sample_rate_and_block_ms() -> None:
    config = VoiceChangerConfig(sample_rate=48_000, block_ms=100)

    assert config.block_size == 4_800


def test_external_rvc_requires_model_paths() -> None:
    config = VoiceChangerConfig(backend="external-rvc")

    with pytest.raises(ValueError, match="--pth is required"):
        config.validate()


def test_external_rvc_validates_existing_files(tmp_path: Path) -> None:
    pth = tmp_path / "voice.pth"
    index = tmp_path / "voice.index"
    pth.write_bytes(b"fake model")
    index.write_bytes(b"fake index")
    config = VoiceChangerConfig(
        backend="external-rvc",
        pth_path=pth,
        index_path=index,
        rvc_command="echo {input} {output}",
    )

    config.validate()
