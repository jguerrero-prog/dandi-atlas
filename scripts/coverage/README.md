# Coverage check

How many of DANDI's dandisets the atlas places in a brain, how many more it could, and why the rest aren't placed. The findings are in jguerrero-prog/dandi-atlas#10.

These scripts are separate from the nightly pipeline. They only read DANDI's public API and the files in `data/`, and they send no credentials. The client name is generic.

## Scripts

| Script | What it does | Network |
|---|---|---|
| `fetch.py` | Reads every non-empty public dandiset's summary (species, data standard, neurodata types) into `dandisets.json` | About 700 read-only requests to the DANDI API, 8 at a time |
| `analyze.py` | Splits them into placed, could be placed, and not a fit, by species, and writes `candidates.json` | None |
| `sample.py` | For each candidate, reads the `location` fields and electrode `x/y/z` of one or two files with the pipeline's own `extract_locations`, `extract_electrode_coords` and `match_location`, and sorts each dandiset by why it isn't placed | Streams small fields from about 250–300 NWB files; never the recordings |

## Running them

From the repository root:

```bash
python3 scripts/coverage/fetch.py      # refreshes results-2026-11-15/dandisets.json
python3 scripts/coverage/analyze.py    # no network

# sample.py needs the pipeline's helpers' packages; a separate environment keeps them apart.
python3 -m venv scripts/coverage/.venv
scripts/coverage/.venv/bin/pip install h5py remfile requests tqdm
scripts/coverage/.venv/bin/python scripts/coverage/sample.py
```

For a new run, change the dated folder name in each script, so earlier results stay comparable.

## Results from November 15, 2026

`results-2026-11-15/` holds `dandisets.json` (677 dandisets) and `candidates.json` (216 candidates). `sample.py` hasn't been run yet; it waits on whether the pipeline already logs unmatched locations.

- **Placed:** 103 (71 mouse, 18 macaque, 14 rat).
- **Could be placed:** about 216 more mouse, rat and macaque dandisets with recordings tied to a place in the brain: 150 extracellular, 66 imaging. This is an upper bound until `sample.py` checks their `location` values.
- `data/atlases/allen_ccf/dandiset_assets.json` already lists 286 dandisets, but 216 have no region matched in any file.
- **A quick win:** 000363, 000544, 001511 and 001512 have electrode coordinates but no matched regions.

## Limits

- The summaries say what kind of data a dandiset holds, not whether its `location` values are usable.
- In `sample.py`, the "matches now" check uses the Allen CCF names, so it applies to mouse only. Rat and macaque files are sorted into blank, free text or coordinates, without testing them against their own atlases.
