"""Empacota e calcula SHA-256, sem depender da política de scripts PowerShell."""
from pathlib import Path
import hashlib
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
if sys.platform != 'win32':
    raise SystemExit('Gere o executável Windows em um ambiente Windows.')
subprocess.run([sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile',
                '--console', '--name', 'CalculadoraIPv4', '--distpath', 'artifacts',
                '--workpath', 'build/pyinstaller', 'main.py'], cwd=root, check=True)
exe = root / 'artifacts/CalculadoraIPv4.exe'
with exe.open('rb') as binary:
    digest = hashlib.file_digest(binary, 'sha256').hexdigest()
(root / 'artifacts/SHA256.txt').write_text(digest + '  CalculadoraIPv4.exe\n', encoding='utf-8')
print('SHA256:', digest)
