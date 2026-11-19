# Are the whole-brain archives in Allen CCF space?

`check_ccf.py`, November 19, 2026. Four neurons each from Peng, MouseLight and BICCN-MOp, two from Allen Cell Types. "CNG" is NeuroMorpho's standardized file, "original" the file as deposited.

| Archive | CNG files | Original files | Verdict |
|---|---|---|---|
| MouseLight (1,112) | Soma at (0, 0, 0) | Soma 2,000–9,000 µm from the origin, whole tree inside the CCF extent, positions match the labeled regions | In CCF micrometers; axes look like x = left–right, y = dorsal–ventral, z = anterior–posterior, to confirm before drawing |
| BICCN-MOp (301) | Soma at (0, 0, 0) | `_reg` GTree files: CCF-scale values such as (6151, 2383, 3947). The Vaa3D file: (16791, 21815, 4395), the image coordinates in its name | `_reg` files likely registered (first run failed only on decimal ids, fixed); others in image space |
| Peng (1,711) | Soma at (0, 0, 0) | Values of about 60–350; CNG spans divided by original spans give 19–35 µm per unit, unequal by axis | Possibly a downsampled CCF grid; confirm with Peng et al.'s methods or an atlas lookup |
| Allen Cell Types (1,116) | Soma at (0, 0, 0) | Local slice coordinates, under 1,000 | Not CCF |

## Raw output

```
== Peng (4 of 1711)
- 18454_01106-semi_f  region: thalamus › ventral posteromedial nucleus  original format: Vaa3D.swc
    CNG: soma (0, 0, 0), span -1204…191 × -2432…183 × -83…1271, 3007 points, not CCF
    original: soma (288, 161, 137), span 251…291 × 60…171 × 81…141, 3081 points, not CCF
- 18453_1641_x24165_y10580-semi_r  region: neocortex › frontal › secondary motor › layer 2-3  original format: Vaa3D.swc
    CNG: soma (0, 0, 0), span -4292…1116 × -3609…848 × -1364…2568, 9619 points, not CCF
    original: soma (83, 112, 151), span 70…229 × 65…241 × 102…305, 9760 points, not CCF
- 18454_00028-semi_r  region: basal ganglia › striatum  original format: Vaa3D.swc
    CNG: soma (0, 0, 0), span -5103…37 × -436…1416 × -523…811, 1393 points, not CCF
    original: soma (147, 148, 181), span 145…347 × 140…241 × 147…191, 1425 points, not CCF
- 18457_00145-semi_f  region: thalamus › ventral posteromedial nucleus  original format: Vaa3D.swc
    CNG: soma (0, 0, 0), span -116…1964 × -118…2851 × -1491…107, 3788 points, not CCF
    original: soma (277, 177, 154), span 167…282 × 108…188 × 79…158, 3932 points, not CCF

== MouseLight (4 of 1112)
- AA0325  region: neocortex › frontal › orbital gyri › layer 6a › ventrolateral  original format: Janelia Workstation-Large Volume Viewer.swc
    CNG: soma (0, 0, 0), span -1838…3191 × -1534…1607 × -875…3318, 2776 points, not CCF
    original: soma (6948, 3295, 3276), span 5685…8761 × 1119…4791 × 1818…7349, 2777 points, looks like CCF
- AA0666  region: neocortex › frontal › secondary motor › layer 2-3  original format: Janelia Workstation-Large Volume Viewer.swc
    CNG: soma (0, 0, 0), span -581…2338 × -689…2906 × -2988…4174, 3191 points, not CCF
    original: soma (7262, 1989, 3000), span 2744…9844 × 1325…3929 × 2327…5442, 3187 points, looks like CCF
- AA0472  region: neocortex › frontal › secondary motor › layer 1  original format: Janelia Workstation-Large Volume Viewer.swc
    CNG: soma (0, 0, 0), span -2742…348 × -1921…4585 × -1079…762, 10635 points, not CCF
    original: soma (6748, 1983, 2340), span 4076…9356 × 1419…5575 × 2030…5353, 10634 points, looks like CCF
- AA0091  region: hippocampus › dentate gyrus  original format: Janelia Workstation-Large Volume Viewer.swc
    CNG: soma (0, 0, 0), span -240…997 × -1181…218 × -205…381, 253 points, not CCF
    original: soma (8649, 3473, 8979), span 8380…9454 × 3177…4096 × 7707…9197, 250 points, looks like CCF

== BICCN-MOp-miniatlas-anatomy (4 of 301)
- 210254_04397-04406-X16794-Y21812swc_sorted-ano  region: neocortex › frontal › primary motor › layer 6a  original format: Vaa3D.swc
    CNG: soma (0, 0, 0), span -4744…638 × -7423…1468 × -1282…618, 3512 points, not CCF
    original: soma (16791, 21815, 4395), span 9329…17873 × 20743…26240 × 3840…5693, 3513 points, not CCF
- 16167_reg2  region: neocortex › frontal › primary motor › layer 5  original format: GTree.swc
    CNG: soma (0, 0, 0), span -239…2047 × -3922…572 × -183…5280, 4063 points, not CCF
    original: not SWC; first line: 1.000000	1.000000	6150.977586	2382.940056	3946.612266	0.000000	-1.000000
- 16167_reg10  region: neocortex › frontal › primary motor › layer 5  original format: GTree.swc
    CNG: soma (0, 0, 0), span -5035…221 × -6096…735 × -7887…228, 9545 points, not CCF
    original: not SWC; first line: 1.000000	1.000000	4232.313469	2701.594381	3390.242130	0.000000	-1.000000
- 16167_reg28  region: neocortex › frontal › primary motor › layer 5  original format: GTree.swc
    CNG: soma (0, 0, 0), span -223…3466 × -3581…943 × -2076…4305, 18233 points, not CCF
    original: not SWC; first line: 1.000000	1.000000	4550.949077	2537.996578	3599.353463	0.000000	-1.000000

== Allen Cell Types (2 of 1116)
- Chat-IRES-Cre-neo_Ai14-287662-04-02-01_614444566_m  region: neocortex › occipital › primary visual › layer 4  original format: Vaa3D.swc
    CNG: soma (0, 0, 0), span -104…132 × -431…514 × -15…55, 3842 points, not CCF
    original: soma (257, 476, 14), span 84…377 × 26…1010 × 3…63, 3841 points, not CCF
- 718188717_transformed  region: neocortex › occipital › primary visual › layer 6a › right  original format: Vaa3D.swc
    CNG: soma (0, 0, 0), span -152…227 × -94…296 × -338…136, 11213 points, not CCF
    original: soma (494, 510, 23), span 354…881 × 392…736 × -23…274, 11210 points, not CCF
```
