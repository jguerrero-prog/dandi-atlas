"""Check every placeable whole-brain neuron, not a sample, before Neurosift Brain draws any of them.

A neuron is placed when its soma lies within 250 µm of its labeled region and at least 90% of its tree is
inside the brain; otherwise it is shown by region only. An archive or batch passes when at least 90% of
its neurons are placed (95% is reported too). Writes placements.json (one record per neuron, soma in
Brain's CCF order: anterior–posterior, dorsal–ventral, left–right, in µm) and check-all.md.

Run after fetch_nmo.py and lookup_ccf.py: python3 check_all.py [--insecure]
About one small download per neuron (roughly 2,900, cached in cache/), 6 at a time.
"""
import json
import re
import ssl
import sys
import urllib.parse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

INSECURE = "--insecure" in sys.argv
sys.argv = sys.argv[:1]
import analyze  # noqa: E402
import lookup_ccf as L  # noqa: E402

HERE = Path(__file__).parent
SOMA_LIMIT_UM = 250
TREE_INSIDE = 0.9
COARSE_LEVEL = 6  # labels above this Allen level (e.g. "Thalamus", "Isocortex") make the soma test easy
# Each batch's convention, from lookup-100-per-archive.md. BICCN 16167 fits none and is left out.
CONVENTION = {
    "MouseLight": "µm, x = LR (swap x and z)",
    "Peng": "25 µm voxels, x = AP",
    "BICCN-MOp-miniatlas-anatomy 195401": "µm, x = AP",
    "BICCN-MOp-miniatlas-anatomy 195409": "µm, x = LR (swap x and z)",
    "BICCN-MOp-miniatlas-anatomy 182280": "µm, x = LR (swap x and z)",
}


def main():
    context = ssl._create_unverified_context() if INSECURE else ssl.create_default_context()
    structures = analyze.walk(json.load(open(analyze.ATLAS / "structure_graph.json"))[0])
    by_name = {s["name"].lower(): k for k, s in structures.items()}
    by_acronym = {s["acronym"].lower(): k for k, s in structures.items()}
    within = {}  # region id → set of itself and all descendants

    def region_set(label):
        if label not in within:
            within[label] = {k for k in structures if label in ancestors(k)}
        return within[label]

    def ancestors(sid):
        out = []
        while sid is not None and sid in structures:
            out.append(sid)
            sid = structures[sid]["parent"]
        return out

    def label_region(regions):
        best = None
        for i, term in enumerate(regions):
            pair = f"{regions[i - 1]} › {term}".lower() if i else ""
            t = re.sub(r"\s*\([^)]*\)", "", term).lower().strip()
            name = (analyze.PATH_SYNONYMS.get(pair) or analyze.SYNONYMS.get(t) or t).lower()
            for candidate in (name, name + " area", name + " areas"):
                if candidate in by_name:
                    best = by_name[candidate]
                    break
            else:
                best = by_acronym.get(t, best)
        return best

    neurons = [n for page in sorted((HERE / "pages").glob("*.json")) for n in json.load(open(page))]
    todo = [n for n in neurons if L.batch_of(n["archive"], n["neuron_name"]) in CONVENTION
            and (not n["archive"].startswith("BICCN") or "_reg" in n["neuron_name"])]
    print(f"{len(todo)} neurons to check")

    def download(n):
        url = (f"https://neuromorpho.org/dableFiles/{urllib.parse.quote(n['archive'].lower())}/Source-Version/"
               f"{urllib.parse.quote(n['neuron_name'])}.swc")
        try:
            L.cached(f"{n['archive']}-{n['neuron_id']}.swc", url, context)
            return None
        except Exception as error:
            return f"{type(error).__name__}"

    with ThreadPoolExecutor(6) as pool:
        failures = {n["neuron_id"]: e for n, e in zip(todo, pool.map(download, todo)) if e}
    print(f"Downloaded; {len(failures)} failed")

    sizes, at = L.load_annotation((L.CACHE / "annotation_25.nrrd").read_bytes())
    records, tally = [], {}
    for n in todo:
        batch = L.batch_of(n["archive"], n["neuron_name"])
        convert = L.CONVENTIONS[CONVENTION[batch]]
        record = {"neuron_id": n["neuron_id"], "neuron_name": n["neuron_name"], "archive": n["archive"], "batch": batch,
                  "brain_region": n["brain_region"], "convention": CONVENTION[batch]}
        label = label_region([r for r in n["brain_region"] or [] if r])
        path = L.CACHE / f"{n['archive']}-{n['neuron_id']}.swc"
        samples = L.points(path.read_text(errors="replace")) if path.exists() else []
        somas = [p[1:] for p in samples if p[0] == 1]
        if n["neuron_id"] in failures or not samples:
            record.update(status="region only", reason=f"file unavailable ({failures.get(n['neuron_id'], 'empty')})")
        elif not somas:
            record.update(status="region only", reason="no soma in the file")
        elif label is None:
            record.update(status="region only", reason="label not matched to an Allen region")
        else:
            ap, dv, lr = (round(v) for v in convert(*somas[0]))
            targets = region_set(label)
            distance = None
            for r in range(0, SOMA_LIMIT_UM // 25 + 1):
                shell = [(a, b, c) for a in range(-r, r + 1) for b in range(-r, r + 1) for c in range(-r, r + 1)
                         if max(abs(a), abs(b), abs(c)) == r]
                if any(at(ap + a, dv + b, lr + c) in targets for a, b, c in shell):
                    distance = r * 25
                    break
            checked = samples[:: max(1, len(samples) // 2000)]
            inside = sum(1 for _, x, y, z in checked if at(*(round(v) for v in convert(x, y, z))) not in (None, 0)) / len(checked)
            centre = at(ap, dv, lr)
            record.update(
                soma_ccf_um=[round(v * 25) for v in convert(*somas[0])], label=structures[label]["acronym"],
                coarse_label=structures[label]["st_level"] < COARSE_LEVEL,
                found=structures.get(centre, {}).get("acronym", "outside"), soma_distance_um=distance,
                tree_inside=round(inside, 3), points=len(samples))
            if distance is None:
                record.update(status="region only", reason=f"soma more than {SOMA_LIMIT_UM} µm from the labeled region")
            elif inside < TREE_INSIDE:
                record.update(status="region only", reason=f"only {inside:.1%} of the tree inside the brain")
            else:
                record.update(status="placed")
        records.append(record)
        reason = record.get("reason", "placed")
        reason = "only part of the tree inside the brain (under 90%)" if reason.startswith("only ") else reason.split(" (")[0]
        tally.setdefault(batch, Counter())[reason] += 1

    (HERE / "placements.json").write_text(json.dumps(records, indent=1))
    lines = [f"# Every placeable neuron checked\n",
             f"Placed: soma within {SOMA_LIMIT_UM} µm of its labeled region and at least {TREE_INSIDE:.0%} of the tree inside "
             "the brain. An archive passes at 90% placed; 95% is the higher mark.\n",
             "| Batch | Neurons | Placed | Share | ≥ 90% | ≥ 95% | Share with detailed labels only |", "|---|---:|---:|---:|---|---|---:|"]
    for batch, counts in tally.items():
        total, placed = sum(counts.values()), counts["placed"]
        share = placed / total if total else 0
        fine = [r for r in records if r["batch"] == batch and r.get("coarse_label") is False]
        fine_share = sum(r["status"] == "placed" for r in fine) / len(fine) if fine else 0
        lines.append(f"| {batch} | {total:,} | {placed:,} | {share:.1%} | {'yes' if share >= 0.9 else 'no'} | "
                     f"{'yes' if share >= 0.95 else 'no'} | {fine_share:.1%} of {len(fine):,} |")
    lines += ["\n## Why neurons are shown by region only\n"]
    for batch, counts in tally.items():
        for reason, count in counts.most_common():
            if reason != "placed":
                lines.append(f"- {batch}: {reason}: {count}")
    misses = Counter((r["batch"].split()[0], r["label"], r["found"]) for r in records
                     if r.get("reason", "").startswith("soma more than"))
    lines += ["\n## Somas beyond the limit, labeled → found (top 30)\n"]
    lines += [f"- {a}: {lab} → {found} ×{c}" for (a, lab, found), c in misses.most_common(30)]
    (HERE / "check-all.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines[:4 + len(tally)]))


if __name__ == "__main__":
    main()
