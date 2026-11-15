"""Splits DANDI's dandisets by whether Neurosift Brain could place them. Reads dandisets.json and Brain's index."""

import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[1]
RESULTS = HERE / "results-2026-11-15"
rows = [r for r in json.loads((RESULTS / "dandisets.json").read_text()) if "error" not in r]
index = json.loads((REPO / "data/atlases_index.json").read_text())
in_brain = {d for atlas in index["atlases"] for d in atlas["dandisets"]}

# Data types that record from a place in the brain: what an atlas could show.
PLACED = (
    "ElectrodeGroup", "ElectricalSeries", "Units", "LFP",
    "ImagingPlane", "TwoPhotonSeries", "OnePhotonSeries", "PlaneSegmentation",
    "OptogeneticStimulusSite", "FiberPhotometry", "IntracellularElectrode",
)


def group(species):
    names = " ".join(species).lower()
    if "mus musculus" in names or "house mouse" in names:
        return "mouse"
    if "macaca" in names or "macaque" in names or "rhesus" in names:
        return "macaque"
    if "rattus" in names or "norway rat" in names or "brown rat" in names:
        return "rat"
    if "homo sapiens" in names or "human" in names:
        return "human"
    return "other" if species else "no species given"


def kind(r):
    if r["id"] in in_brain:
        return "in Brain"
    nwb = any("nwb" in s.lower() for s in r["standards"])
    placed = any(any(p.lower() in v.lower() for p in PLACED) for v in r["variables"])
    if not nwb:
        return "not NWB (BIDS or other)"
    return "recordings with a place" if placed else "no recordings with a place (behavior, other)"


total = len(rows)
by_group = Counter(group(r["species"]) for r in rows)
print(f"Non-empty public dandisets: {total}")
print(f"In Brain today: {len(in_brain & {r['id'] for r in rows})} (index lists {len(in_brain)})\n")

print("By species:")
for g, n in by_group.most_common():
    print(f"  {g:18} {n}")

print("\nMouse, macaque and rat, by whether Brain could place them:")
target = [r for r in rows if group(r["species"]) in ("mouse", "macaque", "rat")]
for g in ("mouse", "macaque", "rat"):
    counts = Counter(kind(r) for r in target if group(r["species"]) == g)
    print(f"  {g}: " + ", ".join(f"{k} {v}" for k, v in counts.most_common()))
candidates = [r for r in target if kind(r) == "recordings with a place"]
print(f"\nCould be added with better location matching: {len(candidates)}")

print("\nOther species, by name (top 15):")
others = Counter(
    s for r in rows if group(r["species"]) == "other" for s in r["species"]
)
for name, n in others.most_common(15):
    print(f"  {name:40} {n}")

human = [r for r in rows if group(r["species"]) == "human"]
human_placed = [r for r in human if kind(r) == "recordings with a place"]
print(f"\nHuman: {len(human)}, of which NWB with recordings that have a place: {len(human_placed)}")

(RESULTS / "candidates.json").write_text(
    json.dumps([{"id": r["id"], "species": r["species"], "variables": r["variables"]} for r in candidates], indent=1)
)
print(f"\nCandidate list written to {RESULTS / 'candidates.json'}")
