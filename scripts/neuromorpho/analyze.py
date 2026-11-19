"""Match NeuroMorpho mouse neurons to Allen CCF regions and compare with DANDI sessions in Neurosift Brain.

Run after fetch_nmo.py: python3 analyze.py   (defaults to this repo; writes report.md here)
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
BRAIN = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
ATLAS = BRAIN / "data/atlases/allen_ccf"

# NeuroMorpho terms whose Allen name differs; checked against structure_graph.json at startup.
SYNONYMS = {
    "neocortex": "Isocortex",
    "hippocampus": "Hippocampal formation",
    "ca1": "Field CA1",
    "ca2": "Field CA2",
    "ca3": "Field CA3",
    "subiculum": "Subiculum",
    "basal ganglia": "Cerebral nuclei",
    "main olfactory bulb": "Main olfactory bulb",
    "olfactory bulb": "Main olfactory bulb",
    "primary visual": "Primary visual area",
    "primary somatosensory": "Primary somatosensory area",
    "barrel": "Primary somatosensory area, barrel field",
    "primary motor": "Primary motor area",
    "secondary motor": "Secondary motor area",
    "medial prefrontal": "Prelimbic area",
    "prefrontal": "Prelimbic area",
    "somatosensory": "Somatosensory areas",
    "visual": "Visual areas",
    "auditory": "Auditory areas",
    "motor": "Somatomotor areas",
    "entorhinal": "Entorhinal area",
    "piriform": "Piriform area",
    "retrosplenial": "Retrosplenial area",
    "anterior cingulate": "Anterior cingulate area",
    "insula": "Agranular insular area",
    "brainstem": "Brain stem",
    "mesencephalon": "Midbrain",
    "midbrain": "Midbrain",
    "medulla": "Medulla",
    "pons": "Pons",
    "thalamus": "Thalamus",
    "hypothalamus": "Hypothalamus",
    "amygdala": "Cortical subplate",
    "basolateral amygdala": "Basolateral amygdalar nucleus",
    "central amygdala": "Central amygdalar nucleus",
    "cerebellar cortex": "Cerebellar cortex",
    "cerebellum": "Cerebellum",
    "cochlear nucleus": "Cochlear nuclei",
    "superior colliculus": "Superior colliculus, sensory related",
    "substantia nigra": "Substantia nigra, compact part",
    "ventral tegmental area": "Ventral tegmental area",
    "nucleus accumbens": "Nucleus accumbens",
    "striatum": "Striatum",
    "dorsal striatum": "Striatum dorsal region",
    "ventral striatum": "Striatum ventral region",
    "globus pallidus": "Pallidum",
    "claustrum": "Claustrum",
    "olfactory cortex": "Olfactory areas",
    "dentate gyrus": "Dentate gyrus",
    "dorsolateral geniculate nucleus": "Dorsal part of the lateral geniculate complex",
    "lateral geniculate nucleus": "Geniculate group, dorsal thalamus",
    "medial geniculate body": "Medial geniculate complex",
    "thalamic reticular nucleus": "Reticular nucleus of the thalamus",
    "ventral lateral nucleus": "Ventral anterior-lateral complex of the thalamus",
    "entorhinal cortex": "Entorhinal area",
    "medial septum": "Medial septal nucleus",
    "lateral septum": "Lateral septal nucleus",
    "putamen": "Caudoputamen",
    "presubiculum": "Presubiculum",
    "pre-subiculum": "Presubiculum",
    "pro-subiculum": "Prosubiculum",
    "solitary nucleus": "Nucleus of the solitary tract",
    "inferior olive": "Inferior olivary complex",
    "lateral dorsal nucleus": "Lateral dorsal nucleus of thalamus",
    "posterior complex": "Posterior complex of the thalamus",
}
# Terms whose Allen region depends on the term before them, keyed "parent › term".
PATH_SYNONYMS = {
    "dentate gyrus › granule layer": "Dentate gyrus, granule cell layer",
    "dentate gyrus › molecular layer": "Dentate gyrus, molecular layer",
    "dentate gyrus › hilus": "Dentate gyrus, polymorph layer",
    "lateral geniculate nucleus › dorsal": "Dorsal part of the lateral geniculate complex",
    "lateral geniculate nucleus › ventral": "Ventral part of the lateral geniculate complex",
}
OUTSIDE_BRAIN = {"retina", "spinal cord", "peripheral nervous system", "dorsal root ganglion",
                 "enteric nervous system", "ganglion", "trigeminal ganglion", "cochlea"}


def walk(node, parent=None, out=None):
    out = {} if out is None else out
    out[node["id"]] = {**{k: node[k] for k in ("acronym", "name", "st_level")}, "parent": parent}
    for child in node.get("children", []):
        walk(child, node["id"], out)
    return out


def main():
    structures = walk(json.load(open(ATLAS / "structure_graph.json"))[0])
    by_name = {s["name"].lower(): sid for sid, s in structures.items()}
    by_acronym = {s["acronym"].lower(): sid for sid, s in structures.items()}
    missing = sorted(v for v in [*SYNONYMS.values(), *PATH_SYNONYMS.values()] if v.lower() not in by_name)
    if missing:
        sys.exit(f"Synonyms not in the Allen ontology, fix these first: {missing}")

    def match(term):
        t = re.sub(r"\s+", " ", term.strip().lower())
        for candidate in (SYNONYMS.get(t, "").lower(), t, t + " area", t + " areas"):
            if candidate and candidate in by_name:
                return by_name[candidate]
        return by_acronym.get(t)

    neurons = [n for page in sorted((HERE / "pages").glob("*.json")) for n in json.load(open(page))]
    stats = Counter()
    per_region = Counter()
    unmatched = Counter()
    archives_with_axons = Counter()
    for n in neurons:
        stats["mouse neurons"] += 1
        regions = [r for r in (n.get("brain_region") or []) if r]
        domain = (n.get("domain") or "").lower()
        has_axon = "axon" in domain and "no axon" not in domain
        if has_axon:
            stats["with an axon traced"] += 1
            archives_with_axons[n.get("archive")] += 1
        if any(r.lower() in OUTSIDE_BRAIN for r in regions):
            stats["outside the brain (retina, spinal cord, ganglia …)"] += 1
            continue
        best = None
        for i, term in enumerate(regions):  # general to specific, so the last match is the finest
            pair = f"{regions[i - 1]} › {term}".lower() if i else ""
            sid = by_name[PATH_SYNONYMS[pair].lower()] if pair in PATH_SYNONYMS else match(term)
            if sid is not None:
                best = sid
        if best is None:
            stats["brain, region not matched"] += 1
            unmatched[" › ".join(regions) or "(no region)"] += 1
            continue
        stats["brain, matched to an Allen region"] += 1
        stats[f"matched at Allen level {structures[best]['st_level']}"] += 1
        per_region[best] += 1

    # Roll neuron counts up to every ancestor, so they compare with DANDI's total_dandisets.
    rolled = Counter()
    for sid, count in per_region.items():
        node = sid
        while node is not None:
            rolled[node] += count
            node = structures[node]["parent"]

    dandi = {int(k): v for k, v in json.load(open(ATLAS / "dandi_regions.json")).items()}
    both, recordings_only, morphology_only = [], [], []
    for sid in set(dandi) | set(rolled):
        recorded = dandi.get(sid, {}).get("total_dandiset_count", 0)
        cells = rolled.get(sid, 0)
        row = (structures.get(sid, {}).get("name", sid), recorded, cells)
        (both if recorded and cells else recordings_only if recorded else morphology_only).append(row)

    report = [f"# NeuroMorpho × Neurosift Brain overlap\n", f"{len(neurons)} mouse neurons read.\n"]
    report += [f"- {k}: {v:,}" for k, v in stats.items()]
    report += ["\n## Regions with both recordings and morphology (by dandisets, then cells)\n",
               "| Region | DANDI dandisets | NeuroMorpho cells |", "|---|---:|---:|"]
    report += [f"| {r} | {d} | {c:,} |" for r, d, c in sorted(both, key=lambda x: (-x[1], -x[2]))[:60]]
    # A recorded region without cells is a real gap only if its parent has no cells labeled at the parent itself.
    name_to_id = {s["name"]: sid for sid, s in structures.items()}
    real_gaps, coarse_only = [], []
    for row in recordings_only:
        parent = structures.get(name_to_id.get(row[0]), {}).get("parent")
        (coarse_only if per_region.get(parent, 0) else real_gaps).append(row)
    report += [f"\n{len(both)} regions have both, {len(recordings_only)} have recordings only "
               f"({len(real_gaps)} with no cells at all nearby, {len(coarse_only)} whose cells are labeled "
               f"only at the parent region), {len(morphology_only)} have morphology only.\n",
               "## Recordings, no reconstructed cells in the region or labeled at its parent (top 30)\n",
               "Fiber tracts and ventricles are listed too; they hold no cell bodies.\n"]
    report += [f"- {r}: {d} dandisets" for r, d, _ in sorted(real_gaps, key=lambda x: -x[1])[:30]]
    report += ["\n## Recordings, cells labeled only at the parent region (top 15)\n"]
    report += [f"- {r}: {d} dandisets" for r, d, _ in sorted(coarse_only, key=lambda x: -x[1])[:15]]
    report += ["\n## Archives with traced axons (top 20)\n"]
    report += [f"- {a}: {c:,}" for a, c in archives_with_axons.most_common(20)]
    report += ["\n## Unmatched region paths (top 40, to extend SYNONYMS)\n"]
    report += [f"- {r}: {c:,}" for r, c in unmatched.most_common(40)]
    (HERE / "report.md").write_text("\n".join(report))
    print("\n".join(report[:12]))
    print(f"\nFull report: {HERE / 'report.md'}")


if __name__ == "__main__":
    main()
