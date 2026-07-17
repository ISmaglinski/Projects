from ai_voicechanger.device_labels import format_device_choice, parse_device_selection


def test_parse_device_selection_reads_index_prefix() -> None:
    assert parse_device_selection("12: Microphone (Host API)") == 12


def test_parse_device_selection_allows_empty_selection() -> None:
    assert parse_device_selection("") is None


def test_format_device_choice_includes_index_name_and_host_api() -> None:
    assert format_device_choice(3, "Cable Input", "Windows WASAPI") == "3: Cable Input (Windows WASAPI)"
