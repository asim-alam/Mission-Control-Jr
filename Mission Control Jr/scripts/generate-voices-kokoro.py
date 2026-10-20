"""Render the mission dialogue with Kokoro into WAV files for later OGG packaging.

The generated clips are intentionally written to a staging directory so an
interrupted render cannot replace the game's known-good audio.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline


VOICE_BY_SPEAKER = {
    "Elena Reyes · Commander": "af_bella",
    "Amara Okafor · Biologist": "af_heart",
    "Jin Park · Engineer": "am_fenrir",
    "Luca Moreau · Medic": "am_michael",
}


def render_line(pipeline: KPipeline, text: str, voice: str) -> np.ndarray:
    chunks: list[np.ndarray] = []
    for _, _, audio in pipeline(text, voice=voice, speed=0.96):
        if audio is not None:
            chunks.append(audio.detach().cpu().numpy())
    if not chunks:
        raise RuntimeError(f"Kokoro returned no audio for {voice}: {text}")
    return np.concatenate(chunks).astype(np.float32, copy=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="assets/audio-kokoro")
    args = parser.parse_args()

    project = Path(__file__).resolve().parents[1]
    dialogue_path = project / "dialogue-lines.json"
    output_dir = project / args.output
    output_dir.mkdir(parents=True, exist_ok=True)
    dialogue = json.loads(dialogue_path.read_text(encoding="utf-8"))

    torch.set_num_threads(max(1, min(8, torch.get_num_threads())))
    pipeline = KPipeline(lang_code="a", device="cpu")
    for clip_name, entry in dialogue.items():
        speaker = entry["speaker"]
        voice = VOICE_BY_SPEAKER.get(speaker)
        if voice is None:
            raise KeyError(f"No Kokoro voice mapping for {speaker}")
        audio = render_line(pipeline, entry["text"], voice)
        path = output_dir / f"{clip_name}.wav"
        sf.write(path, audio, 24000, subtype="PCM_16")
        duration = len(audio) / 24000
        print(f"{clip_name}: {voice} {duration:.2f}s -> {path}", flush=True)


if __name__ == "__main__":
    main()
