"""Which coordinate convention puts each archive's somas in the regions NeuroMorpho lists?

For a sample of neurons per whole-brain archive (100 by default, --per N to change), reads the soma from the file as deposited, looks it up in the
Allen CCF 2017 annotation volume (25 µm) under each candidate convention, and checks the region found
against the neuron's brain_region label. It also counts how much of each whole tree lands inside the
brain, which catches a wrong scale or a mirrored axis that one point can miss. BICCN is reported per batch.

Run after fetch_nmo.py: python3 lookup_ccf.py [--per N] [--insecure]
Downloads the annotation volume once (about 30 MB, kept in cache/) and two small requests per neuron.
"""
import gzip
import json
import re
import ssl
import struct
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

INSECURE = "--insecure" in sys.argv
PER_ARCHIVE = int(sys.argv[sys.argv.index("--per") + 1]) if "--per" in sys.argv else 100
sys.argv = sys.argv[:1]  # analyze.py reads its own arguments on import
import analyze  # noqa: E402  region matching, synonyms and the ontology walk, shared with the overlap count

HERE = Path(__file__).parent
CACHE = HERE / "cache"
ANNOTATION = ("https://download.alleninstitute.org/informatics-archive/current-release/"
              "mouse_ccf/annotation/ccf_2017/annotation_25.nrrd")
ARCHIVES = {"MouseLight": None, "Peng": None, "BICCN-MOp-miniatlas-anatomy": "_reg"}
CONVENTIONS = {  # each maps a file's (x, y, z) to CCF voxels (anterior–posterior, dorsal–ventral, left–right)
    "µm, x = AP": lambda x, y, z: (x / 25, y / 25, z / 25),
    "µm, x = LR (swap x and z)": lambda x, y, z: (z / 25, y / 25, x / 25),
    "25 µm voxels, x = AP": lambda x, y, z: (x, y, z),
    "25 µm voxels, x = LR (swap x and z)": lambda x, y, z: (z, y, x),
}


def get(url, context):
    with urllib.request.urlopen(url, timeout=300, context=context) as response:
        return response.read()


def cached(name, url, context):
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(exist_ok=True)
        path.write_bytes(get(url, context))
    return path.read_bytes()


def load_annotation(raw):
    """The volume's sizes and a lookup from (AP, DV, LR) voxel to structure id; NRRD stores AP fastest."""
    header, _, data = raw.partition(b"\n\n")
    fields = dict(line.split(": ", 1) for line in header.decode().splitlines()[1:] if ": " in line)
    sizes = [int(s) for s in fields["sizes"].split()]
    if fields.get("encoding") == "gzip":
        data = gzip.decompress(data)
    width = {"unsigned int": 4, "uint32": 4, "uint": 4, "unsigned short": 2, "uint16": 2}[fields["type"]]
    fmt = ("<" if fields.get("endian", "little") == "little" else ">") + ("I" if width == 4 else "H")

    def at(ap, dv, lr):
        if not all(0 <= v < s for v, s in zip((ap, dv, lr), sizes)):
            return None
        return struct.unpack_from(fmt, data, width * (ap + sizes[0] * (dv + sizes[1] * lr)))[0]
    return sizes, at


def points(text):
    """(type, x, y, z) for every sample in an SWC file."""
    out = []
    for line in text.splitlines():
        parts = line.split()
        if len(parts) >= 7 and not line.lstrip().startswith("#"):
            out.append((int(float(parts[1])), *map(float, parts[2:5])))
    return out


def batch_of(archive, name):
    """BICCN mixes labs whose files behave differently; its batch is the name's first number."""
    return f"{archive} {name.split('_')[0].split('-')[0]}" if archive.startswith("BICCN") else archive


def main():
    context = ssl._create_unverified_context() if INSECURE else ssl.create_default_context()
    structures = analyze.walk(json.load(open(analyze.ATLAS / "structure_graph.json"))[0])
    by_name = {s["name"].lower(): sid for sid, s in structures.items()}
    by_acronym = {s["acronym"].lower(): sid for sid, s in structures.items()}
    missing = [v for v in [*analyze.SYNONYMS.values(), *analyze.PATH_SYNONYMS.values()] if v.lower() not in by_name]
    if missing:
        sys.exit(f"Synonyms not in the Allen ontology, fix these first: {missing}")

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

    def ancestors(sid):
        out = []
        while sid is not None and sid in structures:
            out.append(sid)
            sid = structures[sid]["parent"]
        return out

    print("Loading the annotation volume…")
    sizes, at = load_annotation(cached("annotation_25.nrrd", ANNOTATION, context))
    neurons = [n for page in sorted((HERE / "pages").glob("*.json")) for n in json.load(open(page))]
    scores, trees, rows, skipped = {}, {}, {}, Counter()

    for archive, name_filter in ARCHIVES.items():
        pool = [n for n in neurons if n["archive"] == archive and (not name_filter or name_filter in n["neuron_name"])]
        picked = pool[:: max(1, len(pool) // PER_ARCHIVE)][:PER_ARCHIVE]
        print(f"{archive}: {len(picked)} of {len(pool)}")
        for n in picked:
            batch = batch_of(archive, n["neuron_name"])
            scores.setdefault(batch, {c: Counter() for c in CONVENTIONS})
            trees.setdefault(batch, {c: [] for c in CONVENTIONS})
            try:
                meta = json.loads(get(f"https://neuromorpho.org/api/neuron/id/{n['neuron_id']}", context))
                extension = (meta.get("original_format") or "swc").rsplit(".", 1)[-1]
                folder = urllib.parse.quote(archive.lower())
                url = (f"https://neuromorpho.org/dableFiles/{folder}/Source-Version/"
                       f"{urllib.parse.quote(n['neuron_name'])}.{extension}")
                samples = points(cached(f"{archive}-{n['neuron_id']}.{extension}", url, context).decode("utf-8", "replace"))
            except Exception as error:
                skipped[f"{batch}: could not download ({type(error).__name__})"] += 1
                continue
            label = label_region([r for r in n["brain_region"] or [] if r])
            somas = [p[1:] for p in samples if p[0] == 1]
            if not samples or not somas or label is None:
                skipped[f"{batch}: {'no soma' if not somas else 'label not matched'}"] += 1
                continue
            point, found = somas[0], {}
            for convention, convert in CONVENTIONS.items():
                ap, dv, lr = (round(v) for v in convert(*point))
                centre = at(ap, dv, lr)
                hits = [at(ap + a, dv + b, lr + c) for a in (-1, 0, 1) for b in (-1, 0, 1) for c in (-1, 0, 1)]
                if centre in (None, 0):
                    verdict = "outside"
                elif label in ancestors(centre):
                    verdict = "agrees"
                elif any(h and label in ancestors(h) for h in hits):
                    verdict = "within 25 µm"
                elif centre in ancestors(label):
                    verdict = "coarser"
                else:
                    verdict = "disagrees"
                scores[batch][convention][verdict] += 1
                found[convention] = structures.get(centre, {}).get("acronym", centre)
                step = max(1, len(samples) // 2000)  # up to 2,000 points per tree is plenty
                checked = samples[::step]
                inside = sum(1 for _, x, y, z in checked if at(*(round(v) for v in convert(x, y, z))) not in (None, 0))
                trees[batch][convention].append(inside / len(checked))
            rows.setdefault(batch, []).append(
                f"| {n['neuron_name']} | {structures[label]['acronym']} | "
                + " · ".join(str(found[c]) for c in CONVENTIONS) + f" | {tuple(round(v) for v in point)} |")

    lines = [f"# Soma and tree lookup in the Allen CCF 2017 annotation (25 µm, {sizes}), up to {PER_ARCHIVE} per archive\n",
             "Agrees: the soma is in the labeled region or a part of it. Within 25 µm: a neighboring voxel is. "
             "Coarser: the soma is in a parent of the labeled region. Tree inside: the median share of a tree's points "
             "inside the brain, and how many trees have at least 95% inside.\n"]
    for batch, by_convention in scores.items():
        tested = sum(by_convention[next(iter(CONVENTIONS))].values())
        lines += [f"\n## {batch} ({tested} tested)\n",
                  "| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside | Tree inside (median) | Trees ≥ 95% inside |",
                  "|---|---:|---:|---:|---:|---:|---:|---:|"]
        for convention, score in by_convention.items():
            shares = sorted(trees[batch][convention])
            median = shares[len(shares) // 2] if shares else 0
            lines.append(f"| {convention} | {score['agrees']} | {score['within 25 µm']} | {score['coarser']} | "
                         f"{score['disagrees']} | {score['outside']} | {median:.0%} | {sum(s >= 0.95 for s in shares)} |")
        best = max(by_convention, key=lambda c: by_convention[c]["agrees"] + by_convention[c]["within 25 µm"])
        good = by_convention[best]["agrees"] + by_convention[best]["within 25 µm"]
        lines += [f"\nBest: **{best}**, {good} of {tested} in or within 25 µm of the labeled region.\n",
                  "<details><summary>Every neuron</summary>\n",
                  "| Neuron | Label | Region found (" + " · ".join(CONVENTIONS) + ") | Soma as deposited |",
                  "|---|---|---|---|", *rows.get(batch, []), "\n</details>"]
        print(f"{batch}: best {best}, {good} of {tested}")
    if skipped:
        lines += ["\n## Skipped\n", *[f"- {k}: {v}" for k, v in skipped.items()]]
    (HERE / "lookup.md").write_text("\n".join(lines) + "\n")
    print(f"Full table: {HERE / 'lookup.md'}")


if __name__ == "__main__":
    main()
