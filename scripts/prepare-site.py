"""Copia a interface para um checkout Sites separado do repositório principal."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
target = root / 'artifacts/site-source'
target.mkdir(parents=True, exist_ok=True)
for entry in (root / 'web').iterdir():
    if entry.name == '.git':
        continue
    destination = target / entry.name
    if entry.is_dir():
        shutil.copytree(entry, destination, dirs_exist_ok=True)
    else:
        shutil.copy2(entry, destination)
print(target)
