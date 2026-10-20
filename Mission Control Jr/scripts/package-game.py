"""Package the runnable project and built game, excluding dependency caches/staging audio."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import os

project = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=project.parent / 'Mission Control Jr - Unified Expedition.zip')
args = parser.parse_args()
output = args.output.resolve()
if output.is_relative_to(project):
    raise SystemExit('Choose an output outside the project so the archive cannot include itself.')
allowed_directories = {'assets', 'dist', 'scripts', 'test', 'screenshots'}
excluded = {'node_modules', '__pycache__', 'audio-kokoro', '.git'}
files = []
for directory, children, names in os.walk(project):
    # Prune dependency/cache trees before visiting them, especially on Windows.
    children[:] = [name for name in children if name not in excluded
                   and (Path(directory) != project or name in allowed_directories)]
    for name in names:
        file = Path(directory) / name
        relative = file.relative_to(project)
        if relative.parts[0] == 'screenshots' and not name.startswith(('mission2-', 'orbit-')):
            continue
        if file.suffix.lower() in {'.zip', '.wav', '.pyc', '.log'} or name.startswith('.env') or name == '.npmrc':
            continue
        files.append((file, relative))
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for file, relative in sorted(files):
        archive.write(file, 'Mission Control Jr/' + relative.as_posix())
with ZipFile(output) as archive:
    assert archive.testzip() is None, 'Archive CRC check failed'
    required = ['index.html', 'journey.js', 'journey-state.js', 'storm.html', 'dist/storm.html', 'assets/audio-orbit/arrival.ogg', 'assets/audio-orbit/touchdown.ogg', 'orbit.html', 'dist/orbit.html', 'orbital-mission.js', 'station-model.js', 'assets/mars-orbit.webp', 'mission2.html', 'mission2-demo.js', 'dist/mission2.html',
                'assets/models/rover-crewed.glb', 'assets/audio-m2/return.ogg', 'package-lock.json']
    for name in required:
        assert 'Mission Control Jr/' + name in archive.namelist(), name
print(f'{output}\n{len(files)} files\n{output.stat().st_size:,} bytes\nCRC and required files: OK')
