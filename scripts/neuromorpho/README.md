# NeuroMorpho overlap

Could Neurosift Brain show NeuroMorpho.Org's reconstructed neurons next to the DANDI recordings it places? These scripts count how many mouse neurons can be matched to an Allen CCF region, how many have a traced axon, and which regions have recordings, reconstructions, or only one of the two.

They only read NeuroMorpho's public API and the files in `data/atlases/allen_ccf/`, and they send no credentials.

## Scripts

| Script | What it does | Network |
|---|---|---|
| `fetch_nmo.py` | Reads the metadata of every mouse neuron into `pages/` (not committed, about 60 MB). Resumable; add `--insecure` if NeuroMorpho's certificate fails | About 325 read-only requests, 500 neurons each |
| `check_ccf.py` | Downloads a few neurons per whole-brain archive, standardized and as deposited, and prints soma positions and spans to see which are in Allen CCF space | About 40 small file downloads |
| `lookup_ccf.py` | Looks up each sampled soma in the Allen CCF 2017 annotation volume (25 µm) under four coordinate conventions and checks the region found against NeuroMorpho's label | The annotation volume once (about 30 MB, cached) and the sampled files |
| `distance_ccf.py` | For each sampled soma, the distance to the nearest voxel of its labeled region under the archive's best convention, and which neighbors the misses land in | None (reads `cache/`) |
| `analyze.py` | Matches each neuron's `brain_region` path to an Allen region, rolls counts up the ontology, compares them with `dandi_regions.json`, and writes `report.md` | None |

## Running them

```bash
python3 scripts/neuromorpho/fetch_nmo.py
python3 scripts/neuromorpho/analyze.py
```

## How regions are matched

NeuroMorpho has no atlas coordinates, only a free-text region path from general to specific, such as `hippocampus › dentate gyrus › granule layer`. `analyze.py` keeps the finest term that matches an Allen region by name, by `SYNONYMS`, or, for terms that depend on their parent, by `PATH_SYNONYMS`. Every synonym is checked against `structure_graph.json` before the run.

Parenthetical acronyms such as "(DP)" are dropped before matching. Known limits: cortical layers aren't mapped yet, so layer-level cells count at their area; NeuroMorpho's plain "superior colliculus" maps to Allen's sensory part only; a region counts as recorded when any placed electrode is in it, including probes that only pass through.

## Results

`results-2026-11-19/check_ccf.md`: MouseLight originals are in CCF micrometers; BICCN `_reg` files likely are; Peng is unconfirmed; standardized (CNG) files are always re-centered.

`results-2026-11-19/lookup-100-per-archive.md` and `distance-100-per-archive.md`: with 100 per archive, MouseLight has 73 of 99 somas in or within 25 µm of the labeled region and 92 within 250 µm; Peng 77 of 98 and 95. Misses land in neighboring regions (MOp/MOs, SUB/ProS, VPM/VPL), consistent with registration error. BICCN 195401 fits (42 of 43 within 250 µm); BICCN 16167 doesn't (16 of 41 farther than 1 mm).

`results-2026-11-19/lookup-20-per-archive.md`: MouseLight is CCF micrometers with x = left–right and z = anterior–posterior (16 of 20 somas in or within 25 µm of the labeled region); Peng is 25 µm CCF voxels in (AP, DV, LR) order (17 of 20); BICCN `_reg` files aren't reliable (8 of 20, two batches with different behavior).

`results-2026-11-19/report.md`: 161,361 mouse neurons; 145,468 of the 146,769 in the brain matched to an Allen region; 14,722 with a traced axon; 205 regions with both recordings and reconstructions.
