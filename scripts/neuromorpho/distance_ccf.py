"""How far is each sampled soma from its labeled region, under each archive's best convention?

Run after lookup_ccf.py (offline; reads cache/ and pages/): python3 distance_ccf.py
BEST holds the convention lookup_ccf.py found for each batch. Distances search shells of 25 µm voxels up to 1 mm.
"""
import json, re, sys
from collections import Counter
from pathlib import Path
sys.argv = sys.argv[:1]
import lookup_ccf as L, analyze

BEST = {"MouseLight": "µm, x = LR (swap x and z)", "Peng": "25 µm voxels, x = AP",
        "BICCN-MOp-miniatlas-anatomy 195401": "µm, x = AP", "BICCN-MOp-miniatlas-anatomy 195409": "µm, x = LR (swap x and z)",
        "BICCN-MOp-miniatlas-anatomy 16167": "µm, x = AP"}
structures = analyze.walk(json.load(open(analyze.ATLAS / "structure_graph.json"))[0])
by_name = {s["name"].lower(): k for k, s in structures.items()}
by_acr = {s["acronym"].lower(): k for k, s in structures.items()}
def label_region(regions):
    best = None
    for i, term in enumerate(regions):
        pair = f"{regions[i-1]} › {term}".lower() if i else ""
        t = re.sub(r"\s*\([^)]*\)", "", term).lower().strip()
        name = (analyze.PATH_SYNONYMS.get(pair) or analyze.SYNONYMS.get(t) or t).lower()
        for c in (name, name + " area", name + " areas"):
            if c in by_name: best = by_name[c]; break
        else: best = by_acr.get(t, best)
    return best
def anc(s):
    out = []
    while s is not None and s in structures: out.append(s); s = structures[s]["parent"]
    return out
sizes, at = L.load_annotation((L.CACHE / "annotation_25.nrrd").read_bytes())
neurons = {n["neuron_id"]: n for p in sorted(Path("pages").glob("*.json")) for n in json.load(open(p))}
dist, pairs = {}, Counter()
for f in sorted(L.CACHE.glob("*-*.*")):
    if f.name.startswith("annotation"): continue
    nid = int(f.stem.rsplit("-", 1)[1]); n = neurons.get(nid)
    if not n: continue
    batch = L.batch_of(n["archive"], n["neuron_name"])
    if batch not in BEST: continue
    label = label_region([r for r in n["brain_region"] or [] if r])
    somas = [p[1:] for p in L.points(f.read_text(errors="replace")) if p[0] == 1]
    if label is None or not somas: continue
    ap, dv, lr = (round(v) for v in L.CONVENTIONS[BEST[batch]](*somas[0]))
    found = None
    for r in range(0, 41):  # search shells up to 1 mm
        hit = False
        for a in range(-r, r + 1):
            for b in range(-r, r + 1):
                for c in (-r, r) if abs(a) != r and abs(b) != r else range(-r, r + 1):
                    v = at(ap + a, dv + b, lr + c)
                    if v and label in anc(v): hit = True; break
                if hit: break
            if hit: break
        if hit: found = r * 25; break
    dist.setdefault(batch, []).append(found)
    if found and found > 25:
        centre = at(ap, dv, lr)
        pairs[(batch.split()[0], structures[label]["acronym"], structures.get(centre, {}).get("acronym", centre))] += 1
for batch, ds in dist.items():
    bins = Counter("farther than 1 mm" if d is None else "in region" if d == 0 else "≤25 µm" if d == 25 else "≤100 µm" if d <= 100 else "≤250 µm" if d <= 250 else "≤500 µm" if d <= 500 else "≤1 mm" if d <= 1000 else "farther than 1 mm" for d in ds)
    order = ["in region", "≤25 µm", "≤100 µm", "≤250 µm", "≤500 µm", "≤1 mm", "farther than 1 mm"]
    print(f"{batch} ({len(ds)}): " + ", ".join(f"{k} {bins[k]}" for k in order if bins[k]))
print("\nMisses beyond 25 µm, labeled → found:")
for (a, l, f), c in pairs.most_common(40): print(f"  {a}: {l} → {f}  ×{c}")
