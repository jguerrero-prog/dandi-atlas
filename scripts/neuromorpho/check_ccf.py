"""Are the whole-brain archives' reconstructions drawn in Allen CCF space?

Downloads a few neurons per archive, in NeuroMorpho's standardized (CNG) version and as originally
deposited, and prints where each soma sits and how far each tree spans. CCF space in micrometers runs
about 0–13,200 (anterior–posterior), 0–8,000 (dorsal–ventral), 0–11,400 (left–right); a soma at the
origin means the file was re-centered.

Run after fetch_nmo.py: python3 check_ccf.py [--insecure]
"""
import json
import ssl
import sys
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
ARCHIVES = {"Peng": 4, "MouseLight": 4, "BICCN-MOp-miniatlas-anatomy": 4, "Allen Cell Types": 2}
FILES = "https://neuromorpho.org/dableFiles/{}/{}/{}"
CCF_EXTENT = (13200, 8000, 11400)


def get(url, context):
    with urllib.request.urlopen(url, timeout=120, context=context) as response:
        return response.read()


def summarize(text):
    """Soma position and bounding box of an SWC file, or None if it doesn't parse as SWC."""
    points, soma = [], None
    for line in text.splitlines():
        parts = line.split()
        if not parts or line.lstrip().startswith("#") or len(parts) < 7:
            continue
        try:
            kind, x, y, z = int(float(parts[1])), *map(float, parts[2:5])  # GTree writes ids as 1.000000
        except ValueError:
            return None
        points.append((x, y, z))
        if kind == 1 and soma is None:
            soma = (x, y, z)
    if not points:
        return None
    low = [min(p[i] for p in points) for i in range(3)]
    high = [max(p[i] for p in points) for i in range(3)]
    soma = soma or points[0]
    inside = all(0 <= low[i] and high[i] <= CCF_EXTENT[i] * 1.05 for i in range(3)) and max(map(abs, soma)) > 500
    return soma, low, high, len(points), inside


def main():
    context = ssl._create_unverified_context() if "--insecure" in sys.argv else ssl.create_default_context()
    neurons = [n for page in sorted((HERE / "pages").glob("*.json")) for n in json.load(open(page))]
    for archive, count in ARCHIVES.items():
        picked = [n for n in neurons if n["archive"] == archive][:: max(1, sum(n["archive"] == archive for n in neurons) // count)][:count]
        print(f"\n== {archive} ({len(picked)} of {sum(n['archive'] == archive for n in neurons)})")
        folder = urllib.parse.quote(archive.lower())
        for n in picked:
            meta = json.loads(get(f"https://neuromorpho.org/api/neuron/id/{n['neuron_id']}", context))
            name, fmt = n["neuron_name"], meta.get("original_format") or ""
            print(f"- {name}  region: {' › '.join(n['brain_region'] or [])}  original format: {fmt}")
            sources = [("CNG", FILES.format(folder, "CNG%20version", urllib.parse.quote(name) + ".CNG.swc"))]
            if fmt:
                extension = fmt.rsplit(".", 1)[-1]  # e.g. "Neurolucida.dat" → "dat"
                sources.append(("original", FILES.format(folder, "Source-Version", urllib.parse.quote(f"{name}.{extension}"))))
            for label, url in sources:
                try:
                    text = get(url, context).decode("utf-8", "replace")
                except Exception as error:
                    print(f"    {label}: could not download ({error})")
                    continue
                result = summarize(text)
                if result is None:
                    print(f"    {label}: not SWC; first line: {text.splitlines()[0][:100] if text else '(empty)'}")
                    continue
                soma, low, high, points, inside = result
                box = " × ".join(f"{low[i]:.0f}…{high[i]:.0f}" for i in range(3))
                print(f"    {label}: soma ({soma[0]:.0f}, {soma[1]:.0f}, {soma[2]:.0f}), span {box}, "
                      f"{points} points, {'looks like CCF' if inside else 'not CCF'}")


if __name__ == "__main__":
    main()
