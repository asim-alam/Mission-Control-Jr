"""Generate Asteria's bundled orbital dialogue using the existing local Kokoro voices.

Requires kokoro, torch, numpy, soundfile and ffmpeg. Existing cached Kokoro
model/voices are reused. Each OGG is encoded in a temporary staging directory
and moved into the output folder only after ffmpeg succeeds.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
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


def spoken_text(text: str) -> str:
    # Keep subtitle spelling intact. Explicit pronunciations also allow the
    # bundled local phonemizer to work without any external speech fallback.
    pronunciations = {
        "Asteria": "[Asteria](/æˈstɪɹiə/)",
        "Jin": "[Jin](/dʒɪn/)",
        "Meridian": "[Meridian](/məˈɹɪdiən/)",
        "sol": "[sol](/sɑl/)",
    }
    for spelling, pronunciation in pronunciations.items():
        text = re.sub(r"\b" + re.escape(spelling) + r"\b", lambda _: pronunciation, text)
    return text


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="assets/audio-orbit")
    parser.add_argument("--only", nargs="*", help="Optional clip IDs to regenerate")
    args = parser.parse_args()
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg must be installed and available on PATH")

    project = Path(__file__).resolve().parents[1]
    dialogue = json.loads((project / "dialogue-lines-orbit.json").read_text(encoding="utf-8"))
    output_dir = project / args.output
    output_dir.mkdir(parents=True, exist_ok=True)
    selected = args.only or list(dialogue)
    unknown = set(selected) - dialogue.keys()
    if unknown:
        raise ValueError(f"Unknown clip IDs: {sorted(unknown)}")

    torch.set_num_threads(max(1, min(8, torch.get_num_threads())))
    print("Loading cached Kokoro model and local phonemizer...", flush=True)
    pipeline = KPipeline(lang_code="a", device="cpu")
    # Fail before rendering if a word cannot be phonemized by this local setup.
    for clip_id in selected:
        print(f"Checking pronunciation: {clip_id}", flush=True)
        pipeline.g2p(spoken_text(dialogue[clip_id]["text"]))
    with tempfile.TemporaryDirectory(prefix="orbit-kokoro-") as staging:
        staging_dir = Path(staging)
        for clip_id in selected:
            entry = dialogue[clip_id]
            voice = VOICE_BY_SPEAKER[entry["speaker"]]
            chunks = [
                chunk.detach().cpu().numpy()
                for _, _, chunk in pipeline(spoken_text(entry["text"]), voice=voice, speed=0.96)
                if chunk is not None
            ]
            if not chunks:
                raise RuntimeError(f"Kokoro returned no audio for {clip_id}")
            samples = np.concatenate(chunks).astype(np.float32, copy=False)
            if not np.isfinite(samples).all() or len(samples) < 2400:
                raise RuntimeError(f"Invalid or empty waveform for {clip_id}")
            wav_path = staging_dir / f"{clip_id}.wav"
            ogg_path = staging_dir / f"{clip_id}.ogg"
            sf.write(wav_path, samples, 24000, subtype="PCM_16")
            subprocess.run(
                [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path),
                 "-af", "loudnorm=I=-18:TP=-1.5:LRA=7", "-ar", "24000", "-ac", "1",
                 "-c:a", "libvorbis", "-q:a", "5", str(ogg_path)],
                check=True,
            )
            destination = output_dir / ogg_path.name
            shutil.move(str(ogg_path), str(destination))
            print(f"{clip_id}: {voice}, {len(samples) / 24000:.2f}s -> {destination}", flush=True)


if __name__ == "__main__":
    main()

