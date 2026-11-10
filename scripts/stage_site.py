"""Package the public site without unused original image collections.

Originals remain in Git. Keep every optimized image, video and 3D dependency.
Fail rather than omit a collection if future site code references it.
"""
from pathlib import Path
from urllib.parse import unquote
import argparse
import shutil

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {
    'assets/img/works', 'assets/img/POSTER', 'assets/img/PHOTOGRAPHY',
    'assets/img/thumbnail', 'assets/img/CLOTHING DESIGN',
    'assets/img/manipulation', 'assets/img/3d', 'assets/img/wedding',
    'assets/img/REALISTIC', 'assets/FOnts',
}

def stage(destination):
    if destination.exists():
        raise SystemExit(f'Refusing to overwrite existing destination: {destination}')
    code = list(ROOT.glob('*.html')) + [p for p in (ROOT/'assets').rglob('*')
        if p.suffix.lower() in {'.html','.css','.js','.json','.gltf','.svg'}]
    for file in code:
        content = unquote(file.read_text(encoding='utf-8', errors='replace')).replace('\\', '/')
        for directory in EXCLUDED:
            # Check both root-relative and stylesheet-relative references.
            if directory + '/' in content or '../' + directory.removeprefix('assets/') + '/' in content:
                raise SystemExit(f'{file.relative_to(ROOT)} still references excluded collection {directory}')
    destination.mkdir(parents=True)
    for file in [*ROOT.glob('*.html'), ROOT/'robots.txt', ROOT/'sitemap.xml']:
        shutil.copy2(file, destination/file.name)
    copied = skipped = 0
    for file in (ROOT/'assets').rglob('*'):
        if not file.is_file():
            continue
        relative = file.relative_to(ROOT)
        if any(relative.as_posix().startswith(directory + '/') for directory in EXCLUDED):
            skipped += file.stat().st_size
            continue
        target = destination/relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, target)
        copied += file.stat().st_size
    (destination/'.nojekyll').touch()
    print(f'Published assets: {copied / 1024**2:.1f} MiB; unused originals excluded: {skipped / 1024**2:.1f} MiB')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT/'_site')
    stage(parser.parse_args().output.resolve())
