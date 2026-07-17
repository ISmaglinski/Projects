import pytest

np = pytest.importorskip("numpy")
pytest.importorskip("sounddevice")

from ai_voicechanger.audio import _fit_block
from ai_voicechanger.converters import PassthroughConverter, build_converter


def test_passthrough_returns_float32_audio() -> None:
    audio = np.array([0.1, -0.2], dtype=np.float64)

    converted = PassthroughConverter().convert(audio, 48_000)

    assert converted.dtype == np.float32
    np.testing.assert_allclose(converted, audio.astype(np.float32))


def test_fit_block_truncates_or_pads_audio() -> None:
    np.testing.assert_allclose(_fit_block(np.array([1, 2, 3], dtype=np.float32), 2), [1, 2])
    np.testing.assert_allclose(_fit_block(np.array([1], dtype=np.float32), 3), [1, 0, 0])


def test_build_converter_rejects_unknown_backend() -> None:
    with pytest.raises(ValueError, match="Unsupported backend"):
        build_converter("missing")
