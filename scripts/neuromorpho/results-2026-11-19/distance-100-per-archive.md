# Distance from each soma to its labeled region, 100 per archive

`distance_ccf.py`, November 19, 2026, using each batch's best convention from `lookup-100-per-archive.md`. Each count is one distance band (for example, "≤100 µm" means 26–100 µm), searched in shells of 25 µm voxels up to 1 mm.

Cumulative, within 250 µm: MouseLight 92 of 99, Peng 95 of 98, BICCN 195401 42 of 43, BICCN 195409 13 of 13, BICCN 16167 16 of 41 (16 farther than 1 mm).

```
BICCN-MOp-miniatlas-anatomy 16167 (41): in region 12, ≤25 µm 1, ≤100 µm 3, ≤500 µm 5, ≤1 mm 4, farther than 1 mm 16
BICCN-MOp-miniatlas-anatomy 195409 (13): in region 7, ≤25 µm 2, ≤100 µm 1, ≤250 µm 3
BICCN-MOp-miniatlas-anatomy 195401 (43): in region 39, ≤100 µm 1, ≤250 µm 2, ≤500 µm 1
MouseLight (99): in region 68, ≤25 µm 5, ≤100 µm 13, ≤250 µm 6, ≤500 µm 4, ≤1 mm 2, farther than 1 mm 1
Peng (98): in region 71, ≤25 µm 7, ≤100 µm 8, ≤250 µm 9, ≤500 µm 2, farther than 1 mm 1

Misses beyond 25 µm, labeled → found:
  BICCN-MOp-miniatlas-anatomy: MOp → MOs5  ×7
  BICCN-MOp-miniatlas-anatomy: MOp → MOs6a  ×5
  MouseLight: MOp → MOs5  ×4
  MouseLight: SUB → ProS  ×3
  BICCN-MOp-miniatlas-anatomy: MOp → VL  ×2
  BICCN-MOp-miniatlas-anatomy: MOp → ccg  ×2
  MouseLight: MOp → MOs6a  ×2
  Peng: SSp → MOp5  ×2
  Peng: SSp → SSs5  ×2
  BICCN-MOp-miniatlas-anatomy: MOp → MOs6b  ×1
  BICCN-MOp-miniatlas-anatomy: MOp → chpl  ×1
  BICCN-MOp-miniatlas-anatomy: MOp → CP  ×1
  BICCN-MOp-miniatlas-anatomy: MOp → fi  ×1
  MouseLight: VAL → PCN  ×1
  MouseLight: SPF → PIL  ×1
  MouseLight: LD → PO  ×1
  MouseLight: MOs → FRP6a  ×1
  MouseLight: MOs → ORBl6a  ×1
  MouseLight: PRE → POST  ×1
  MouseLight: mtt → MMd  ×1
  MouseLight: COPY → PYR  ×1
  MouseLight: cc → VISl6b  ×1
  MouseLight: cc → DG-sg  ×1
  MouseLight: TH → fi  ×1
  MouseLight: ILM → VPMpc  ×1
  MouseLight: LHA → pm  ×1
  MouseLight: MOs → ACAd2/3  ×1
  MouseLight: SUB → POST  ×1
  MouseLight: VISp → dhc  ×1
  Peng: LGd → LP  ×1
  Peng: VPM → VPMpc  ×1
  Peng: VPL → VPM  ×1
  Peng: VPL → RT  ×1
  Peng: VPM → APN  ×1
  Peng: STR → AIp6a  ×1
  Peng: LP → LD  ×1
  Peng: SSp → MOp2/3  ×1
  Peng: STR → cing  ×1
  Peng: VPM → VPL  ×1
  Peng: VPM → LGd-co  ×1
```
