"""Download the metadata of every mouse neuron on NeuroMorpho.Org, 500 per request.

Run: python3 fetch_nmo.py   (resumable; writes pages/ next to this file)
"""
import json
import ssl
import sys
import time
import urllib.request
from pathlib import Path

API = "https://neuromorpho.org/api/neuron/select?q=species:mouse&size=500&page={}"
KEEP = ["neuron_id", "neuron_name", "archive", "brain_region", "cell_type", "domain",
        "physical_Integrity", "attributes", "protocol", "reference_doi"]
OUT = Path(__file__).parent / "pages"
OUT.mkdir(exist_ok=True)


def fetch(page, context):
    with urllib.request.urlopen(API.format(page), timeout=120, context=context) as response:
        return json.load(response)


def main():
    context = ssl.create_default_context()
    if "--insecure" in sys.argv:  # NeuroMorpho's certificate chain has failed before
        context = ssl._create_unverified_context()
    first = fetch(0, context)
    total_pages = first["page"]["totalPages"]
    print(f"{first['page']['totalElements']} mouse neurons in {total_pages} pages")
    for page in range(total_pages):
        path = OUT / f"{page:04d}.json"
        if path.exists():
            continue
        data = first if page == 0 else None
        for attempt in range(4):
            try:
                data = data or fetch(page, context)
                break
            except Exception as error:  # retry on timeouts and server errors
                print(f"page {page} attempt {attempt + 1}: {error}")
                time.sleep(5 * (attempt + 1))
        else:
            sys.exit(f"Stopped at page {page}; run again to resume.")
        neurons = data["_embedded"]["neuronResources"]
        path.write_text(json.dumps([{k: n.get(k) for k in KEEP} for n in neurons]))
        print(f"page {page + 1}/{total_pages}")
        time.sleep(0.3)
    print("Done.")


if __name__ == "__main__":
    main()
