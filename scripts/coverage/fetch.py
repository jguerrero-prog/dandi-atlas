"""Reads every non-empty, public dandiset's summary from the DANDI API into dandisets.json.

Read-only: one list request per 200 dandisets, then one request per dandiset for its metadata,
8 at a time. Takes a minute or two.
"""

import concurrent.futures as cf
import json
import sys
import urllib.request
from pathlib import Path

API = "https://api.dandiarchive.org/api"
HEAD = {"User-Agent": "dandi-coverage-check/1.0", "Accept": "application/json"}
# Writes into a dated results folder; make a new one for a new run.
OUT = Path(__file__).parent / "results-2026-11-15" / "dandisets.json"


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEAD), timeout=60) as r:
        return json.load(r)


def listed():
    url = f"{API}/dandisets/?page_size=200&empty=false&embargoed=false&draft=true"
    while url:
        page = get(url)
        for d in page["results"]:
            v = d.get("most_recent_published_version") or d.get("draft_version") or {}
            yield d["identifier"], v.get("version", "draft"), v.get("asset_count", 0)
        url = page.get("next")


def meta(item):
    did, ver, n = item
    try:
        m = get(f"{API}/dandisets/{did}/versions/{ver}/")
        s = m.get("assetsSummary") or {}
        return {
            "id": did,
            "version": ver,
            "assets": n,
            "species": [x.get("name", "") for x in s.get("species") or []],
            "standards": [x.get("name", "") for x in s.get("dataStandard") or []],
            "variables": s.get("variableMeasured") or [],
            "approach": [x.get("name", "") for x in s.get("approach") or []],
            "techniques": [x.get("name", "") for x in s.get("measurementTechnique") or []],
        }
    except Exception as error:
        return {"id": did, "error": str(error)}


ids = list(listed())
print("dandisets listed:", len(ids), file=sys.stderr)
with cf.ThreadPoolExecutor(8) as pool:
    rows = list(pool.map(meta, ids))
OUT.write_text(json.dumps(rows))
print(f"fetched {len(rows)}, errors {sum('error' in r for r in rows)} -> {OUT}", file=sys.stderr)
