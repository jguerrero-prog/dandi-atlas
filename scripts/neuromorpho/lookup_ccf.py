"""Which coordinate convention puts each archive's somas in the regions NeuroMorpho lists?

For 20 neurons per whole-brain archive, reads the soma from the file as deposited, looks it up in the
Allen CCF 2017 annotation volume (25 µm) under each candidate convention, and checks the region found
against the neuron's brain_region label. The convention that agrees for most neurons is the archive's.

Run after fetch_nmo.py: python3 lookup_ccf.py [--insecure]
Downloads the annotation volume once (about 30 MB, kept in cache/) and about 120 small files.
"""
import gzip
import json
import ssl
import struct
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

INSECURE = "--insecure" in sys.argv
sys.argv = sys.argv[:1]  # analyze.py reads its own arguments on import
import analyze  # noqa: E402  region matching, synonyms and the ontology walk, shared with the overlap count

HERE = Path(__file__).parent
CACHE = HERE / "cache"
ANNOTATION = ("https://download.alleninstitute.org/informatics-archive/current-release/"
              "mouse_ccf/annotation/ccf_2017/annotation_25.nrrd")
ARCHIVES = {"MouseLight": None, "Peng": None, "BICCN-MOp-miniatlas-anatomy": "_reg"}
PER_ARCHIVE = 20
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


def soma(text):
    for line in text.splitlines():
        parts = line.split()
        if len(parts) >= 7 and not line.lstrip().startswith("#") and int(float(parts[1])) == 1:
            return tuple(map(float, parts[2:5]))
    return None


def main():
    context = ssl._create_unverified_context() if INSECURE else ssl.create_default_context()
    structures = analyze.walk(json.load(open(analyze.ATLAS / "structure_graph.json"))[0])
    by_name = {s["name"].lower(): sid for sid, s in structures.items()}
    by_acronym = {s["acronym"].lower(): sid for sid, s in structures.items()}

    def label_region(regions):
        best = None
        for i, term in enumerate(regions):
            pair = f"{regions[i - 1]} › {term}".lower() if i else ""
            t = term.lower().strip()
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
    lines = [f"# Soma lookup in the Allen CCF 2017 annotation (25 µm, {sizes})\n"]

    for archive, name_filter in ARCHIVES.items():
        pool = [n for n in neurons if n["archive"] == archive and (not name_filter or name_filter in n["neuron_name"])]
        picked = pool[:: max(1, len(pool) // PER_ARCHIVE)][:PER_ARCHIVE]
        scores = {c: Counter() for c in CONVENTIONS}
        rows = []
        for n in picked:
            meta = json.loads(get(f"https://neuromorpho.org/api/neuron/id/{n['neuron_id']}", context))
            extension = (meta.get("original_format") or "swc").rsplit(".", 1)[-1]
            folder = urllib.parse.quote(archive.lower())
            url = f"https://neuromorpho.org/dableFiles/{folder}/Source-Version/{urllib.parse.quote(n['neuron_name'])}.{extension}"
            try:
                point = soma(cached(f"{archive}-{n['neuron_id']}.{extension}", url, context).decode("utf-8", "replace"))
            except Exception as error:
                rows.append(f"| {n['neuron_name']} | could not download ({error}) | | |")
                continue
            label = label_region([r for r in n["brain_region"] or [] if r])
            if point is None or label is None:
                rows.append(f"| {n['neuron_name']} | {'no soma' if point is None else 'label not matched'} | | |")
                continue
            found = {}
            for convention, convert in CONVENTIONS.items():
                ap, dv, lr = (round(v) for v in convert(*point))
                hits = [at(ap + a, dv + b, lr + c) for a in (-1, 0, 1) for b in (-1, 0, 1) for c in (-1, 0, 1)]
                centre = at(ap, dv, lr)
                if centre in (None, 0):
                    verdict = "outside the brain"
                elif label in ancestors(centre):
                    verdict = "agrees"
                elif any(h and label in ancestors(h) for h in hits):
                    verdict = "agrees within 25 µm"
                elif centre in ancestors(label):
                    verdict = "coarser than the label"
                else:
                    verdict = "disagrees"
                scores[convention][verdict] += 1
                found[convention] = structures.get(centre, {}).get("acronym", centre)
            rows.append(f"| {n['neuron_name']} | {structures[label]['acronym']} | "
                        + " · ".join(f"{found[c]}" for c in CONVENTIONS) + f" | {tuple(round(v) for v in point)} |")

        tested = len([r for r in rows if r.count("|") > 4 and "could not" not in r and "no soma" not in r and "not matched" not in r])
        lines += [f"\n## {archive} ({len(picked)} sampled{', names with ' + name_filter if name_filter else ''}; {tested} testable)\n",
                  "| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside |", "|---|---:|---:|---:|---:|---:|"]
        for convention, score in scores.items():
            lines.append(f"| {convention} | {score['agrees']} | {score['agrees within 25 µm']} | "
                         f"{score['coarser than the label']} | {score['disagrees']} | {score['outside the brain']} |")
        best = max(scores, key=lambda c: scores[c]["agrees"] + scores[c]["agrees within 25 µm"])
        lines += [f"\nBest: **{best}**\n", "| Neuron | Label | Region found (" + " · ".join(CONVENTIONS) + ") | Soma as deposited |",
                  "|---|---|---|---|", *rows]
        print(f"{archive}: best {best} — " + ", ".join(f"{k} {v}" for k, v in scores[best].items()))

    (HERE / "lookup.md").write_text("\n".join(lines) + "\n")
    print(f"Full table: {HERE / 'lookup.md'}")


if __name__ == "__main__":
    main()
