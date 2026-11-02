"""Safety guard. Legacy generator was retired in v4 to preserve clinically reviewed coordinate maps.
Use tools/build_demo.py to regenerate HTML without changing schemas.
"""
from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
w=json.loads((r/'schemas/wpi19.json').read_text())
d=json.loads((r/'schemas/das28.json').read_text())
assert len(w['regions'])==19 and len(d['joints'])==28
print('Protected v4: WPI-19 and DAS28-28 loaded unchanged; no geometry overwritten.')
