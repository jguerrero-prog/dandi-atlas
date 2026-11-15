"""Why aren't the candidate dandisets in Neurosift Brain? Reads one or two files from each and sorts them.

Uses the atlas pipeline's own code (scripts/dandi_helpers.py) so the answers match the nightly job:
extract_locations and extract_electrode_coords stream only the small location fields and x/y/z columns,
never the recordings, and match_location tries the Allen CCF names the way the pipeline does.

Writes sample.json and sample.csv beside this script and prints a summary. Read-only.
"""

import concurrent.futures as cf
import csv
import json
import math
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[1]
RESULTS = HERE / "results-2026-11-15"
sys.path.insert(0, str(REPO / "scripts"))

import dandi_helpers as dh  # noqa: E402  (the pipeline's helpers, from the repo)

FILES_PER_DANDISET = 2
candidates = json.loads((RESULTS / "candidates.json").read_text())
versions = {r["id"]: r.get("version", "draft") for r in json.loads((RESULTS / "dandisets.json").read_text())}
scanned = json.loads((REPO / "data/atlases/allen_ccf/dandiset_assets.json").read_text())


def flatten(nodes, out):
    for node in nodes:
        out.append(node)
        flatten(node.get("children") or [], out)
    return out


structures = flatten(json.loads((REPO / "data/atlases/allen_ccf/structure_graph.json").read_text()), [])
lookups = dh.build_lookup_dicts(structures)


def species(candidate):
    names = " ".join(candidate["species"]).lower()
    if "mus" in names or "mouse" in names:
        return "mouse"
    if "macaca" in names or "rhesus" in names or "macaque" in names:
        return "macaque"
    return "rat"


def pick_files(did):
    """Files the pipeline already listed, or else the dandiset's first NWB files."""
    if did in scanned and scanned[did]:
        return [(a["asset_id"], a["path"]) for a in scanned[did][:FILES_PER_DANDISET]]
    assets = dh.get_nwb_assets_paged(did, versions.get(did, "draft"), max_assets=FILES_PER_DANDISET)
    return [(a["asset_id"], a["path"]) for a in assets]


def real_coords(coords):
    """Coordinates that say something: not all missing, zero or -1."""
    useful = [
        c for c in coords or []
        if len(c) >= 3 and not any(isinstance(v, float) and math.isnan(v) for v in c[:3])
        and not (c[0] == c[1] == c[2] == 0) and not (c[0] == c[1] == c[2] == -1)
    ]
    return len(useful)


def sample(candidate):
    did = candidate["id"]
    kind = species(candidate)
    row = {"id": did, "species": kind, "files": [], "locations": [], "matched": [], "coordinates": 0, "errors": []}
    try:
        files = pick_files(did)
    except Exception as error:
        row["errors"].append(f"listing: {error}")
        files = []
    for asset_id, path in files:
        url = dh.get_download_url(did, asset_id, versions.get(did, "draft"))
        row["files"].append(path)
        try:
            imaging, electrodes, icephys = dh.extract_locations(url)
            row["locations"].extend(str(v) for v in [*imaging, *electrodes, *icephys])
            row["coordinates"] += real_coords(dh.extract_electrode_coords(url))
        except Exception as error:
            row["errors"].append(f"{path}: {type(error).__name__}: {error}"[:200])
    distinct = sorted(set(v.strip() for v in row["locations"]))
    row["locations"] = distinct
    meaningful = [v for v in distinct if v.lower() not in dh.TRIVIAL_LOCATIONS]
    if kind == "mouse":
        row["matched"] = sorted({s["acronym"] for v in meaningful for s in dh.match_location(v, lookups)})
    row["unmatched"] = [v for v in meaningful if kind != "mouse" or not dh.match_location(v, lookups)]

    # Why it isn't placed, most hopeful first.
    if row["matched"]:
        row["category"] = "matches now (a pipeline issue)"
    elif row["coordinates"]:
        row["category"] = "has coordinates (coordinates to regions would place it)"
    elif meaningful:
        row["category"] = "free text that doesn't match (synonyms would help)"
    elif files and not row["errors"]:
        row["category"] = "blank or placeholder only (needs the lab)"
    else:
        row["category"] = "couldn't read"
    return row


print(f"Sampling {len(candidates)} dandisets, up to {FILES_PER_DANDISET} files each…", file=sys.stderr)
rows = []
with cf.ThreadPoolExecutor(8) as pool:
    for n, row in enumerate(pool.map(sample, candidates), 1):
        rows.append(row)
        if n % 20 == 0:
            print(f"  {n}/{len(candidates)}", file=sys.stderr)

(RESULTS / "sample.json").write_text(json.dumps(rows, indent=1))
with open(RESULTS / "sample.csv", "w", newline="") as out:
    writer = csv.writer(out)
    writer.writerow(["dandiset", "species", "category", "matched", "coordinates", "locations", "errors"])
    for r in sorted(rows, key=lambda r: (r["category"], r["id"])):
        writer.writerow([r["id"], r["species"], r["category"], " ".join(r["matched"]), r["coordinates"],
                         " | ".join(r["locations"])[:500], " | ".join(r["errors"])[:300]])

print("\nWhy the candidates aren't placed:")
for category, n in Counter(r["category"] for r in rows).most_common():
    print(f"  {n:4}  {category}")
print("\nBy species:")
for kind in ("mouse", "rat", "macaque"):
    counts = Counter(r["category"].split(" (")[0] for r in rows if r["species"] == kind)
    print(f"  {kind}: " + ", ".join(f"{k} {v}" for k, v in counts.most_common()))
print("\nMost common location values that don't match (dandisets using each):")
unmatched = Counter(v for r in rows for v in r["unmatched"])
for value, n in unmatched.most_common(50):
    print(f"  {n:3}  {value[:90]}")
print(f"\nWrote {RESULTS / 'sample.json'} and {RESULTS / 'sample.csv'}")
