from __future__ import annotations

import queue
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from .audio import VoiceChangerStream, device_choices
from .config import VoiceChangerConfig
from .converters import build_converter
from .device_labels import parse_device_selection
from .stt import AsyncSttWorker, FasterWhisperTranscriber


class VoiceChangerApp(tk.Tk):
    """Tkinter desktop UI for configuring and running the voice changer."""

    def __init__(self) -> None:
        super().__init__()
        self.title("AI Voicechanger")
        self.minsize(860, 640)

        self.input_var = tk.StringVar()
        self.output_var = tk.StringVar()
        self.backend_var = tk.StringVar(value="passthrough")
        self.sample_rate_var = tk.StringVar(value="48000")
        self.block_ms_var = tk.StringVar(value="120")
        self.pth_var = tk.StringVar()
        self.index_var = tk.StringVar()
        self.rvc_command_var = tk.StringVar()
        self.stt_model_var = tk.StringVar()
        self.status_var = tk.StringVar(value="Ready. Start with passthrough to test routing.")

        self._stream: VoiceChangerStream | None = None
        self._stream_thread: threading.Thread | None = None
        self._log_queue: queue.Queue[str] = queue.Queue()

        self._build_ui()
        self.refresh_devices()
        self._poll_log_queue()

    def _build_ui(self) -> None:
        root = ttk.Frame(self, padding=16)
        root.grid(row=0, column=0, sticky="nsew")
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)
        root.columnconfigure(0, weight=1)
        root.rowconfigure(5, weight=1)

        ttk.Label(root, text="AI Voicechanger", font=("TkDefaultFont", 18, "bold")).grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            root,
            text=(
                "Route your microphone through passthrough or an RVC .pth/.index backend, "
                "then send the result to a virtual audio cable for Discord or games."
            ),
            wraplength=780,
        ).grid(row=1, column=0, sticky="we", pady=(4, 14))

        self._build_device_section(root).grid(row=2, column=0, sticky="we", pady=6)
        self._build_model_section(root).grid(row=3, column=0, sticky="we", pady=6)
        self._build_requirements_section(root).grid(row=4, column=0, sticky="we", pady=6)
        self._build_log_section(root).grid(row=5, column=0, sticky="nsew", pady=6)
        self._build_controls(root).grid(row=6, column=0, sticky="we", pady=(10, 0))

    def _build_device_section(self, parent: ttk.Frame) -> ttk.LabelFrame:
        frame = ttk.LabelFrame(parent, text="1. Audio devices", padding=12)
        frame.columnconfigure(1, weight=1)

        ttk.Label(frame, text="Microphone input").grid(row=0, column=0, sticky="w", padx=(0, 10), pady=4)
        self.input_combo = ttk.Combobox(frame, textvariable=self.input_var, state="readonly")
        self.input_combo.grid(row=0, column=1, sticky="we", pady=4)

        ttk.Label(frame, text="Output to Discord/game").grid(row=1, column=0, sticky="w", padx=(0, 10), pady=4)
        self.output_combo = ttk.Combobox(frame, textvariable=self.output_var, state="readonly")
        self.output_combo.grid(row=1, column=1, sticky="we", pady=4)

        ttk.Button(frame, text="Refresh devices", command=self.refresh_devices).grid(
            row=0, column=2, rowspan=2, padx=(10, 0), sticky="ns"
        )
        ttk.Label(
            frame,
            text="Tip: set the output to a virtual cable, then pick that cable as your mic in Discord/game.",
        ).grid(row=2, column=0, columnspan=3, sticky="w", pady=(8, 0))
        return frame

    def _build_model_section(self, parent: ttk.Frame) -> ttk.LabelFrame:
        frame = ttk.LabelFrame(parent, text="2. Voice conversion settings", padding=12)
        frame.columnconfigure(1, weight=1)

        ttk.Label(frame, text="Backend").grid(row=0, column=0, sticky="w", padx=(0, 10), pady=4)
        ttk.Combobox(
            frame,
            textvariable=self.backend_var,
            state="readonly",
            values=["passthrough", "external-rvc"],
        ).grid(row=0, column=1, sticky="we", pady=4)

        ttk.Label(frame, text="Sample rate").grid(row=0, column=2, sticky="w", padx=(14, 10), pady=4)
        ttk.Entry(frame, textvariable=self.sample_rate_var, width=10).grid(row=0, column=3, sticky="w", pady=4)
        ttk.Label(frame, text="Block ms").grid(row=0, column=4, sticky="w", padx=(14, 10), pady=4)
        ttk.Entry(frame, textvariable=self.block_ms_var, width=8).grid(row=0, column=5, sticky="w", pady=4)

        self._path_row(frame, 1, "PTH model", self.pth_var, [("PTH model", "*.pth"), ("All files", "*.*")])
        self._path_row(frame, 2, "Index file", self.index_var, [("Index file", "*.index"), ("All files", "*.*")])

        ttk.Label(frame, text="RVC command").grid(row=3, column=0, sticky="nw", padx=(0, 10), pady=4)
        ttk.Entry(frame, textvariable=self.rvc_command_var).grid(
            row=3, column=1, columnspan=5, sticky="we", pady=4
        )
        ttk.Label(
            frame,
            text="Use placeholders: {input}, {output}, {pth}, {index}, {sample_rate}",
        ).grid(row=4, column=1, columnspan=5, sticky="w")

        ttk.Label(frame, text="STT model (optional)").grid(row=5, column=0, sticky="w", padx=(0, 10), pady=(10, 4))
        ttk.Entry(frame, textvariable=self.stt_model_var).grid(row=5, column=1, columnspan=5, sticky="we", pady=(10, 4))
        ttk.Label(frame, text="Example: small.en. STT logs captions; RVC still converts audio, not text.").grid(
            row=6, column=1, columnspan=5, sticky="w"
        )
        return frame

    def _path_row(
        self,
        frame: ttk.LabelFrame,
        row: int,
        label: str,
        variable: tk.StringVar,
        filetypes: list[tuple[str, str]],
    ) -> None:
        ttk.Label(frame, text=label).grid(row=row, column=0, sticky="w", padx=(0, 10), pady=4)
        ttk.Entry(frame, textvariable=variable).grid(row=row, column=1, columnspan=4, sticky="we", pady=4)
        ttk.Button(
            frame,
            text="Browse...",
            command=lambda: self._browse_file(variable, filetypes),
        ).grid(row=row, column=5, sticky="e", pady=4)

    def _build_requirements_section(self, parent: ttk.Frame) -> ttk.LabelFrame:
        frame = ttk.LabelFrame(parent, text="3. What you need", padding=12)
        requirements = [
            "A working microphone selected above.",
            "A virtual audio cable selected as output if you want Discord/game routing.",
            "For external-rvc: your .pth model, .index file, and an RVC CLI command that writes {output}.",
            "Optional STT: install the stt extra and enter a faster-whisper model name.",
            "Headphones are strongly recommended to prevent feedback.",
        ]
        for row, text in enumerate(requirements):
            ttk.Label(frame, text=f"✓ {text}").grid(row=row, column=0, sticky="w", pady=1)
        return frame

    def _build_log_section(self, parent: ttk.Frame) -> ttk.LabelFrame:
        frame = ttk.LabelFrame(parent, text="Status log", padding=12)
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(0, weight=1)
        self.log_text = tk.Text(frame, height=10, wrap="word", state="disabled")
        self.log_text.grid(row=0, column=0, sticky="nsew")
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.log_text.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.log_text.configure(yscrollcommand=scrollbar.set)
        return frame

    def _build_controls(self, parent: ttk.Frame) -> ttk.Frame:
        frame = ttk.Frame(parent)
        frame.columnconfigure(0, weight=1)
        ttk.Label(frame, textvariable=self.status_var).grid(row=0, column=0, sticky="w")
        self.start_button = ttk.Button(frame, text="Start voice changer", command=self.start_stream)
        self.start_button.grid(row=0, column=1, padx=(10, 0))
        self.stop_button = ttk.Button(frame, text="Stop", command=self.stop_stream, state="disabled")
        self.stop_button.grid(row=0, column=2, padx=(8, 0))
        return frame

    def refresh_devices(self) -> None:
        try:
            inputs = device_choices("input")
            outputs = device_choices("output")
        except Exception as exc:  # sounddevice can fail if PortAudio has no host APIs configured.
            self._log(f"Could not query audio devices: {exc}")
            return

        self.input_combo.configure(values=inputs)
        self.output_combo.configure(values=outputs)
        if inputs and not self.input_var.get():
            self.input_var.set(inputs[0])
        if outputs and not self.output_var.get():
            self.output_var.set(outputs[0])
        self._log(f"Loaded {len(inputs)} input device(s) and {len(outputs)} output device(s).")

    def start_stream(self) -> None:
        if self._stream is not None:
            return
        try:
            config = self._config_from_form()
            config.validate()
            converter = build_converter(
                config.backend,
                pth_path=config.pth_path,
                index_path=config.index_path,
                rvc_command=config.rvc_command,
            )
            stt_worker = self._build_stt_worker(config)
        except Exception as exc:
            messagebox.showerror("Cannot start voice changer", str(exc))
            self._log(f"Start failed: {exc}")
            return

        self._stream = VoiceChangerStream(
            converter=converter,
            input_device=config.input_device,
            output_device=config.output_device,
            sample_rate=config.sample_rate,
            block_size=config.block_size,
            stt_worker=stt_worker,
        )
        self._stream_thread = threading.Thread(target=self._run_stream, daemon=True, name="voicechanger-stream")
        self._stream_thread.start()
        self.start_button.configure(state="disabled")
        self.stop_button.configure(state="normal")
        self.status_var.set("Running")
        self._log("Voice changer started.")

    def stop_stream(self) -> None:
        if self._stream is not None:
            self._stream.stop()
        self._stream = None
        self.start_button.configure(state="normal")
        self.stop_button.configure(state="disabled")
        self.status_var.set("Stopped")
        self._log("Stop requested.")

    def _run_stream(self) -> None:
        try:
            if self._stream is not None:
                self._stream.run_forever()
        except Exception as exc:
            self._log_queue.put(f"Stream stopped with error: {exc}")
        finally:
            self._log_queue.put("Stream thread exited.")
            self.after(0, self._reset_buttons_after_thread_exit)

    def _reset_buttons_after_thread_exit(self) -> None:
        self._stream = None
        self.start_button.configure(state="normal")
        self.stop_button.configure(state="disabled")
        if self.status_var.get() == "Running":
            self.status_var.set("Stopped")

    def _config_from_form(self) -> VoiceChangerConfig:
        backend = self.backend_var.get()
        pth_path = Path(self.pth_var.get()).expanduser() if self.pth_var.get().strip() else None
        index_path = Path(self.index_var.get()).expanduser() if self.index_var.get().strip() else None
        return VoiceChangerConfig(
            input_device=parse_device_selection(self.input_var.get()),
            output_device=parse_device_selection(self.output_var.get()),
            sample_rate=int(self.sample_rate_var.get()),
            block_ms=int(self.block_ms_var.get()),
            backend=backend,  # type: ignore[arg-type]
            pth_path=pth_path,
            index_path=index_path,
            rvc_command=self.rvc_command_var.get().strip() or None,
            stt_model=self.stt_model_var.get().strip() or None,
        )

    def _build_stt_worker(self, config: VoiceChangerConfig) -> AsyncSttWorker | None:
        if not config.stt_model:
            return None
        transcriber = FasterWhisperTranscriber(config.stt_model)
        return AsyncSttWorker(transcriber, lambda text: self._log_queue.put(f"[stt] {text}"))

    def _browse_file(self, variable: tk.StringVar, filetypes: list[tuple[str, str]]) -> None:
        path = filedialog.askopenfilename(filetypes=filetypes)
        if path:
            variable.set(path)

    def _log(self, message: str) -> None:
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"{message}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def _poll_log_queue(self) -> None:
        while True:
            try:
                self._log(self._log_queue.get_nowait())
            except queue.Empty:
                break
        self.after(100, self._poll_log_queue)


def main() -> None:
    app = VoiceChangerApp()
    app.mainloop()


if __name__ == "__main__":
    main()
