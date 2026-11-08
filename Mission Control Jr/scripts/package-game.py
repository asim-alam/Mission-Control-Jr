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
allowed_directories = {'assets', 'dist', 'scripts', 'test', 'screenshots', 'missions', 'simulation', 'data', 'public', 'docs'}
excluded = {'node_modules', '__pycache__', 'audio-kokoro', '.git'}
files = []
for directory, children, names in os.walk(project):
    # Prune dependency/cache trees before visiting them, especially on Windows.
    children[:] = [name for name in children if name not in excluded
                   and (Path(directory) != project or name in allowed_directories)]
    for name in names:
        file = Path(directory) / name
        relative = file.relative_to(project)
        if relative.parts[0] == 'screenshots' and not name.startswith(('mission2-', 'orbit-', 'mission-expansion-')):
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
                'assets/models/rover-crewed.glb', 'assets/audio-m2/return.ogg', 'package-lock.json',
                'mission-registry.js', 'mission-routes.js', 'data/normalized.json', 'public/data/provenance.json',
                'public/data/raw/lunar-illumination/patches.json', 'scripts/generate-lunar-models.js',
                'missions/solar-shelter/actions.js', 'missions/greenhouse/actions.js', 'missions/earth-delay/actions.js',
                'missions/lunar-sunlight/actions.js', 'missions/lunar-dust/actions.js', 'missions/lunar-relay/actions.js',
                'expansion.html', 'greenhouse.html', 'earth-delay.html', 'lunar-sunlight.html', 'lunar-dust.html', 'lunar-relay.html',
                'dist/expansion.html', 'dist/greenhouse.html', 'dist/earth-delay.html', 'dist/lunar-sunlight.html', 'dist/lunar-dust.html', 'dist/lunar-relay.html',
                'dist/sources.html', 'dist/ASSET-REFERENCES.md', 'dist/LEARNING-OBJECTIVES.md',
                'assets/models/lunar/lunar-relay-mast.glb', 'assets/models/survival/greenhouse-rack.glb',
                'screenshots/mission-expansion-l01-01-active.png', 'screenshots/mission-expansion-l01-02-simple-options.png',
                'screenshots/mission-expansion-l01-03-panel-deployed.png', 'screenshots/mission-expansion-l01-04-cable-routed.png',
                'screenshots/mission-expansion-l01-05-power-connected.png', 'screenshots/mission-expansion-l01-06-console-connected.png']
    for name in required:
        assert 'Mission Control Jr/' + name in archive.namelist(), name
print(f'{output}\n{len(files)} files\n{output.stat().st_size:,} bytes\nCRC and required files: OK')
