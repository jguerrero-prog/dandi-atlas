# Soma and tree lookup in the Allen CCF 2017 annotation (25 µm, [528, 320, 456]), up to 100 per archive

Agrees: the soma is in the labeled region or a part of it. Within 25 µm: a neighboring voxel is. Coarser: the soma is in a parent of the labeled region. Tree inside: the median share of a tree's points inside the brain, and how many trees have at least 95% inside.


## MouseLight (99 tested)

| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside | Tree inside (median) | Trees ≥ 95% inside |
|---|---:|---:|---:|---:|---:|---:|---:|
| µm, x = AP | 5 | 0 | 1 | 83 | 10 | 99% | 64 |
| µm, x = LR (swap x and z) | 68 | 5 | 0 | 26 | 0 | 100% | 96 |
| 25 µm voxels, x = AP | 0 | 0 | 0 | 0 | 99 | 0% | 0 |
| 25 µm voxels, x = LR (swap x and z) | 0 | 0 | 0 | 0 | 99 | 0% | 0 |

Best: **µm, x = LR (swap x and z)**, 73 of 99 in or within 25 µm of the labeled region.

<details><summary>Every neuron</summary>

| Neuron | Label | Region found (µm, x = AP · µm, x = LR (swap x and z) · 25 µm voxels, x = AP · 25 µm voxels, x = LR (swap x and z)) | Soma as deposited |
|---|---|---|---|
| AA0325 | Isocortex | root · ORBl6a · None · None | (6948, 3295, 3276) |
| AA0949 | VISp | VISp4 · VISp5 · None · None | (8668, 1477, 9044) |
| AA0595 | TH | CP · VAL · None · None | (4802, 4508, 6942) |
| AA0764 | MOs | SSp-ll6a · ACAd5 · None · None | (6146, 1764, 4133) |
| AA0422 | MOs | SSp-bfd6a · MOs5 · None · None | (6423, 2188, 2775) |
| AA0779 | LHA | ACB · LHA · None · None | (4550, 6134, 6771) |
| AA0337 | VAL | CP · PCN · None · None | (4778, 4149, 6691) |
| AA0358 | VAL | LSr · VAL · None · None | (4584, 4124, 6386) |
| AA0598 | TH | BST · SMT · None · None | (5215, 4691, 6696) |
| AA0433 | PAG | 0 · PAG · None · None | (5831, 2171, 10146) |
| AA0780 | MOs | or · MOs5 · None · None | (6815, 2590, 2594) |
| AA0332 | MOs | or · MOs5 · None · None | (6784, 2515, 2725) |
| AA0466 | MOs | SSp-bfd6a · MOs5 · None · None | (6825, 2142, 2743) |
| AA0673 | MOp | ccs · MOp1 · None · None | (7488, 1278, 4416) |
| AA0762 | SPF | LGv · PIL · None · None | (7647, 4093, 8425) |
| AA0692 | VAL | CP · VAL · None · None | (4281, 4757, 6593) |
| AA0906 | MOp | CA3 · MOs5 · None · None | (6948, 2315, 3539) |
| AA0307 | CA3 | MOs5 · CA3 · None · None | (2735, 3229, 7620) |
| AA0453 | LD | CP · LD · None · None | (4414, 3522, 6537) |
| AA0772 | MOs | CA1 · MOs5 · None · None | (7268, 2243, 3162) |
| AA0449 | HY | CP · HY · None · None | (4874, 5320, 7179) |
| AA0694 | LD | CP · PO · None · None | (4444, 3732, 6646) |
| AA0427 | Isocortex | CP · ORBvl6a · None · None | (6735, 3050, 2763) |
| AA0533 | DG-mo | DG-mo · DG-mo · None · None | (8625, 3376, 9061) |
| AA0695 | PRE | CA1 · PRE · None · None | (8355, 3368, 9360) |
| AA0424 | MOs | SSp-bfd5 · MOs2/3 · None · None | (6271, 1798, 2912) |
| AA0474 | MOs | SSp-bfd6a · MOs2/3 · None · None | (7020, 2080, 2392) |
| AA0914 | MOs | SSp-bfd5 · MOs2/3 · None · None | (6450, 1819, 2887) |
| AA0333 | MOs | VL · FRP6a · None · None | (6921, 2888, 2811) |
| AA0535 | SUB | ProS · SUB · None · None | (9057, 3105, 9393) |
| AA0826 | SUB | CA1 · SUB · None · None | (8153, 2244, 8837) |
| AA0611 | SUB | ProS · ProS · None · None | (9092, 2725, 9082) |
| AA0423 | SUB | CA1 · SUB · None · None | (8360, 2399, 9059) |
| AA0736 | SUB | CA1 · ProS · None · None | (7412, 1802, 8128) |
| AA0859 | MOs | SSp-ul5 · MOs2/3 · None · None | (6564, 1384, 3677) |
| AA0731 | SUB | CA1 · ProS · None · None | (7801, 1991, 8410) |
| AA0868 | MOs | ccb · MOs5 · None · None | (6409, 1880, 4172) |
| AA0913 | MOs | CA1 · MOs5 · None · None | (6685, 1914, 4094) |
| AA0323 | MOs | fi · ORBl6a · None · None | (6994, 3064, 2922) |
| AA0744 | MOs | scwm · MOs5 · None · None | (6397, 1790, 3992) |
| AA0593 | PCN | CP · PCN · None · None | (4927, 4487, 7098) |
| AA0944 | SSp | PAG · SSp-m6a · None · None | (9112, 2771, 5263) |
| AA0384 | PRE | CA1 · DG-mo · None · None | (8518, 3269, 9124) |
| AA0494 | PRE | CA1 · POST · None · None | (7483, 2301, 8679) |
| AA0480 | PRE | CA1 · PRE · None · None | (8403, 3427, 9200) |
| AA0483 | PRE | CA1 · PRE · None · None | (8407, 3005, 9304) |
| AA0875 | PRE | CA1 · PRE · None · None | (8371, 2811, 9170) |
| AA0643 | CA1 | CA1 · CA1 · None · None | (8228, 1832, 8231) |
| AA0953 | MRN | None · LRNm · None · None | (6629, 6682, 12134) |
| AA0933 | MM | FS · MMd · None · None | (5798, 5891, 8058) |
| AA0729 | fx | SI · fx · None · None | (4749, 6345, 6884) |
| AA0809 | VM | CP · VM · None · None | (4870, 4960, 6914) |
| AA0545 | MOp | CA3 · MOs6a · None · None | (7335, 2754, 3505) |
| AA0654 | MOp | CA3 · MOs5 · None · None | (7309, 2505, 3136) |
| AA0937 | mtt | STR · MMd · None · None | (5947, 5905, 8088) |
| AA0594 | MOs | SSp-tr5 · MOs1 · None · None | (6678, 1094, 4379) |
| AA0434 | BS | 0 · IRN · None · None | (6837, 5981, 10822) |
| AA0974 | CB | None · ANcr2 · None · None | (9195, 3003, 12278) |
| AA0966 | COPY | None · PYR · None · None | (4681, 3897, 12707) |
| AA0754 | VPM | CP · VPM · None · None | (4152, 4311, 6667) |
| AA0698 | cc | VISl6b · VISl6b · None · None | (9066, 2153, 8868) |
| AA0303 | cc | MGv · DG-sg · None · None | (8440, 3860, 8264) |
| AA0979 | PFL | 0 · PFL · None · None | (9861, 5113, 11333) |
| AA0318 | VPM | CP · VPM · None · None | (4069, 4636, 6835) |
| AA1054 | PRNr | ec · PRNr · None · None | (6475, 4869, 9420) |
| AA1015 | SIM | 0 · SIM · None · None | (8364, 1937, 11056) |
| AA1030 | BS | None · SPVI · None · None | (7350, 5252, 12284) |
| AA1080 | ml | PIR · ml · None · None | (5440, 5850, 9160) |
| AA1077 | LRN | None · LRNm · None · None | (3975, 6935, 12389) |
| AA1542 | MOp | APN · MOp6a · None · None | (7839, 2696, 4367) |
| AA1543 | MOp | CA3 · MOs5 · None · None | (7509, 2667, 3423) |
| AA1085 | BS | None · SPVI · None · None | (4100, 5248, 11952) |
| AA1010 | PG | PIR · PG · None · None | (4686, 6119, 8826) |
| AA0067 | ACA | ACAd5 · ACAd5 · None · None | (5200, 1586, 6039) |
| AA0029 | TH | LSr · fi · None · None | (4686, 3681, 5605) |
| AA0144 | DG | CA1 · DG-mo · None · None | (7935, 2874, 8798) |
| AA0162 | DG | CA1 · DG-mo · None · None | (7829, 2748, 8712) |
| AA0084 | DMH | LPO · HY · None · None | (5366, 6078, 6665) |
| AA0201 | ILM | CP · VPMpc · None · None | (4970, 4703, 7137) |
| AA0223 | LHA | CP · pm · None · None | (5251, 5652, 7605) |
| AA0060 | MOp | CA3 · MOs6a · None · None | (7205, 2881, 2898) |
| AA0034 | MOp | MOs5 · MOp5 · None · None | (3860, 2108, 3938) |
| AA0271 | MOp | DG-sg · MOs5 · None · None | (7334, 2370, 3766) |
| AA0042 | MOp | MOs6a · MOp6a · None · None | (4326, 2009, 4633) |
| AA0243 | MOs | MOs6a · ACAd6a · None · None | (5013, 1877, 4670) |
| AA0238 | MOs | MOp6a · ACAd2/3 · None · None | (5448, 1561, 4543) |
| AA0190 | MOs | ccb · MOs5 · None · None | (6857, 2449, 2893) |
| AA0279 | MOs | CA3 · MOs5 · None · None | (6868, 2301, 3549) |
| AA0280 | MOs | CA3 · MOs6a · None · None | (6865, 2508, 3660) |
| AA0110 | MOs | MOp6b · MOs6a · None · None | (4627, 2656, 4001) |
| AA0157 | POST | alv · POST · None · None | (7965, 2499, 9218) |
| AA0173 | PRE | CA1 · PRE · None · None | (8248, 3456, 9360) |
| AA0259 | PRE | CA1 · PRE · None · None | (8422, 3029, 9276) |
| AA0138 | TH | aco · RE · None · None | (5334, 5149, 6145) |
| AA0004 | SSp | MOs5 · MOp5 · None · None | (3326, 2213, 4689) |
| AA0032 | SUB | CA1 · POST · None · None | (7792, 2420, 8959) |
| AA0071 | SUB | CA1 · SUB · None · None | (8249, 2416, 8965) |
| AA0299 | VAL | LSr · VAL · None · None | (4693, 4175, 6467) |
| AA0260 | VISp | VISal6a · dhc · None · None | (8504, 2195, 9361) |

</details>

## Peng (98 tested)

| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside | Tree inside (median) | Trees ≥ 95% inside |
|---|---:|---:|---:|---:|---:|---:|---:|
| µm, x = AP | 0 | 0 | 0 | 0 | 98 | 0% | 0 |
| µm, x = LR (swap x and z) | 0 | 0 | 0 | 0 | 98 | 0% | 0 |
| 25 µm voxels, x = AP | 71 | 6 | 0 | 20 | 1 | 100% | 94 |
| 25 µm voxels, x = LR (swap x and z) | 4 | 0 | 0 | 82 | 12 | 85% | 45 |

Best: **25 µm voxels, x = AP**, 77 of 98 in or within 25 µm of the labeled region.

<details><summary>Every neuron</summary>

| Neuron | Label | Region found (µm, x = AP · µm, x = LR (swap x and z) · 25 µm voxels, x = AP · 25 µm voxels, x = LR (swap x and z)) | Soma as deposited |
|---|---|---|---|
| 18454_01106-semi_f | VPM | 0 · 0 · VPM · ORBl5 | (288, 161, 137) |
| 18464_00031-semi_r | LGd | 0 · 0 · LP · MOp6a | (317, 120, 148) |
| 18868_4803_x7002_y8311-auto_r | SSp | 0 · 0 · SSp-n5 · PL1 | (243, 91, 93) |
| 18463_00046-semi_r | TH | 0 · 0 · mtt · act | (265, 210, 204) |
| 17781_4710_x13766_y10574-semi_r | SS | 0 · 0 · SSs6a · MOB | (246, 143, 73) |
| 210254_4021_x16401_y21556-semi_r | MOs | 0 · 0 · MOs6a · ACAd5 | (212, 71, 195) |
| 18455_00144-semi_r | VPM | 0 · 0 · VPM · CP | (290, 150, 156) |
| 18458_00280-semi_r | VPM | 0 · 0 · VPM · CP | (285, 153, 154) |
| 18453_4693_x33039_y11636-semi_r | SS | 0 · 0 · SSs2/3 · MOB | (251, 131, 48) |
| 17781_5166_x11993_y10858-semi_r | SS | 0 · 0 · SSs6a · OLF | (270, 122, 78) |
| 18464_00081-semi_r | STR | 0 · 0 · CP · ORBvl5 | (199, 158, 132) |
| 18463_00007-semi_r | STR | 0 · 0 · CP · PL1 | (222, 118, 149) |
| 18868_3389_x28317_y9872-auto_r | SSp | 0 · 0 · SSp-m5 · FRP5 | (173, 118, 105) |
| 18867_4397_x8352_y9768-auto_r | SSp | 0 · 0 · SSp-m5 · ORBvl5 | (203, 118, 89) |
| 18462_00032-semi_r | VPM | 0 · 0 · VPMpc · CP | (301, 181, 187) |
| 18464_00045-semi_r | VPM | 0 · 0 · VPM · CP | (284, 158, 162) |
| 18465_00177-semi_r | VPL | 0 · 0 · VPM · CP | (266, 184, 160) |
| 17545_00055-semi_r | VPL | 0 · 0 · RT · ORBl5 | (280, 150, 127) |
| 18454_01005-semi_r | VPM | 0 · 0 · VPM · ORBl6a | (278, 153, 139) |
| 18452_7249_x11408_y2071-auto_r | VISp | 0 · 0 · 0 · 0 | (391, 28, 146) |
| 18457_00015-semi_f | STR | 0 · 0 · CP · CP | (160, 149, 182) |
| 18462_00013-semi_r | VPM | 0 · 0 · VPM · CP | (284, 147, 153) |
| 18455_00203-semi_r | VPM | 0 · 0 · VPM · fa | (268, 155, 148) |
| 18454_01086-semi_r | VPM | 0 · 0 · VPM · ORBl6a | (289, 155, 140) |
| 18463_00052-semi_r | VPM | 0 · 0 · APN · CP | (309, 138, 183) |
| 17782_3487_x11014_y17041-semi_r | AI | 0 · 0 · AId6a · ORBl2/3 | (161, 167, 118) |
| 17545_00140-semi_r | STR | 0 · 0 · CP · AON | (204, 174, 101) |
| 18457_00099-semi_f | VPL | 0 · 0 · VPL · OLF | (270, 180, 145) |
| 18457_00140-semi_f | STR | 0 · 0 · CP · CP | (178, 180, 168) |
| 17787_00029-semi_r | STR | 0 · 0 · AIp6a · MOB | (250, 198, 69) |
| 17545_00165-semi_r | MG | 0 · 0 · TH · AId5 | (337, 162, 126) |
| 18454_01006-semi_r | RT | 0 · 0 · RT · ORBl2/3 | (278, 174, 129) |
| 17787_00014-semi_r | STR | 0 · 0 · CP · ILA6a | (205, 157, 148) |
| 17302_00125-semi_r | LP | 0 · 0 · LP · MOs6a | (300, 119, 153) |
| 18464_00029-semi_r | MG | 0 · 0 · MGd · MOp2/3 | (344, 147, 127) |
| 18868_4739_x28536_y7468-auto_r | SSp-bfd | 0 · 0 · SSp-bfd5 · MOs2/3 | (254, 73, 115) |
| 18455_00032-semi_r | STR | 0 · 0 · CP · PL2/3 | (221, 121, 145) |
| 18455_00110-semi_r | STR | 0 · 0 · CP · ORBvl1 | (198, 158, 108) |
| 18457_00032-semi_f | STR | 0 · 0 · CP · ccg | (182, 119, 168) |
| 17545_00073-semi_r | STR | 0 · 0 · CP · MOB | (287, 160, 77) |
| 18458_00150-semi_r | LP | 0 · 0 · LD · ccg | (279, 124, 167) |
| 17545_00050-semi_r | STR | 0 · 0 · CP · ORBm6a | (200, 156, 137) |
| 18454_01064-semi_r | VPM | 0 · 0 · VPM · CP | (285, 177, 153) |
| 18867_4473_x25161_y6054-auto_r | SSp | 0 · 0 · MOp5 · MOs2/3 | (214, 61, 164) |
| 18455_00135-semi_r | STR | 0 · 0 · CP · AON | (292, 169, 80) |
| 18864_1871_x3272_y21319-semi_r | MOs | 0 · 0 · MOs2/3 · SSp-m2/3 | (96, 83, 185) |
| 17545_00066-semi_r | STR | 0 · 0 · CP · PL6a | (197, 112, 158) |
| 18458_00277-semi_f | VPM | 0 · 0 · VPM · fa | (286, 150, 150) |
| 191801_4724_x4226_y10240-semi_f | SSp | 0 · 0 · MOp2/3 · 0 | (215, 38, 175) |
| 17545_00155-semi_r | STR | 0 · 0 · CP · ORBm2/3 | (223, 137, 115) |
| 18454_00009-semi_r | STR | 0 · 0 · cing · ACAd6a | (192, 103, 164) |
| 17109_6601_x4384_y7436-semi_r | VISal | 0 · 0 · VISal5 · 0 | (322, 65, 84) |
| 18457_00162-semi_f | VPM | 0 · 0 · VPL · OLF | (274, 181, 147) |
| 18455_00167-semi_r | VPM | 0 · 0 · VPM · CP | (270, 179, 165) |
| 17545_00045-semi_r | STR | 0 · 0 · CP · ORBvl2/3 | (200, 168, 121) |
| 18869_4550_x7203_y4574-semi_r | SSp | 0 · 0 · SSp-n5 · 0 | (230, 91, 105) |
| 17788_3709_x6000_y8213-semi_r | SSp | 0 · 0 · SSp-m4 · FRP5 | (178, 115, 93) |
| 182725_6819_x6109_y7853-semi_r | VISp | 0 · 0 · VISp5 · 0 | (347, 47, 133) |
| 18455_5196_x19752_y14652-semi_r | RH | 0 · 0 · RH · PAL | (261, 193, 227) |
| 18453_4496_x31014_y8304-semi_r | SSp | 0 · 0 · SSp-bfd4 · 0 | (247, 86, 74) |
| 18869_4841_x18666_y8144-semi_r | RT | 0 · 0 · RT · fa | (248, 150, 162) |
| 18457_00001-semi_f | STR | 0 · 0 · CP · PL6a | (192, 115, 154) |
| 18453_6675_x8876_y4461-semi_r | VISal | 0 · 0 · VISal2/3 · 0 | (341, 59, 80) |
| 18868_3207_x27726_y9448-auto_r | SSp | 0 · 0 · MOp5 · MOs5 | (161, 111, 113) |
| 18867_3994_x27846_y7437-auto_r | SSp | 0 · 0 · SSp-ul5 · MOs5 | (196, 86, 127) |
| 18465_00228-semi_r | VPM | 0 · 0 · VPM · ORBl5 | (275, 165, 140) |
| 18868_6196_x17668_y4955-auto_r | RSP | 0 · 0 · RSPv2/3 · SSp-ul1 | (329, 44, 218) |
| 18463_00034-semi_f | VPL | 0 · 0 · VPL · fa | (269, 177, 150) |
| 191812_4664_x8027_y25176-semi_r | SSp | 0 · 0 · SSs5 · 0 | (229, 126, 67) |
| 18462_00007-semi_r | STR | 0 · 0 · CP · CP | (194, 146, 189) |
| 18458_00075-semi_r | LD | 0 · 0 · LD · ccg | (280, 116, 161) |
| 17109_2601_x10213_y8783-semi_r | AI | 0 · 0 · AId5 · AON | (160, 193, 95) |
| 18463_00011-semi_r | STR | 0 · 0 · CP · CP | (174, 127, 178) |
| 18464_00194-semi_r | MG | 0 · 0 · SGN · MOp2/3 | (353, 130, 135) |
| 18461_5025_x23630_y4542-semi_f | SSp-bfd | 0 · 0 · SSp-bfd1 · 0 | (256, 90, 54) |
| 18867_4677_x24410_y14710-auto_r | cc | 0 · 0 · int · LSr | (233, 196, 171) |
| 18454_01027-semi_r | VPM | 0 · 0 · LGd-co · MOs6a | (300, 135, 135) |
| 18867_4647_x12409_y6656-auto_r | SSp | 0 · 0 · SSp-ul5 · ACAd2/3 | (215, 76, 142) |
| 18869_5033_x23046_y6158-semi_r | SSp | 0 · 0 · SSs5 · 0 | (269, 100, 68) |
| 18454_00144-semi_r | VPL | 0 · 0 · HY · CLA | (322, 177, 151) |
| 18465_00036-semi_r | STR | 0 · 0 · CP · ccg | (211, 134, 172) |
| 18455_00007-semi_r | STR | 0 · 0 · CP · PL6a | (201, 123, 133) |
| 17543_3471_x12087_y3637-semi_r | VISC | 0 · 0 · VISC5 · MOB | (207, 176, 63) |
| 18463_00010-semi_r | STR | 0 · 0 · CP · ACAv5 | (208, 106, 174) |
| 18461_7132_x6338_y3287-semi_r | VISrl | 0 · 0 · VISrl4 · 0 | (329, 55, 92) |
| 18458_00584-semi_r | VPM | 0 · 0 · RT · ACB | (277, 194, 147) |
| 18454_00105-semi_r | VPM | 0 · 0 · VPM · CP | (269, 177, 159) |
| 18458_00505-semi_r | VM | 0 · 0 · VM · ACB | (264, 208, 181) |
| 17302_00101-semi_r | STR | 0 · 0 · CP · ccg | (191, 122, 174) |
| 17545_00121-semi_r | STR | 0 · 0 · CP · OLF | (222, 187, 113) |
| 18454_01040-semi_r | VPL | 0 · 0 · or · ORBl5 | (281, 149, 132) |
| 18867_5287_x32054_y8614-auto_r | SSp | 0 · 0 · SSp-bfd5 · FRP1 | (259, 104, 74) |
| 18455_00120-semi_r | VPL | 0 · 0 · VPM · ORBl6a | (270, 154, 138) |
| 17302_00001-semi_r | STR | 0 · 0 · AId6a · AON | (197, 196, 98) |
| 18869_7472_x16444_y11009-semi_r | PRNr | 0 · 0 · PRNr · AIp1 | (386, 212, 184) |
| 17781_6202_x7633_y12296-semi_r | SSp-bfd | 0 · 0 · SSs5 · 0 | (307, 78, 80) |
| 17545_00003-semi_r | VPL | 0 · 0 · TH · OLF | (280, 192, 146) |
| 18455_00264-semi_r | VPM | 0 · 0 · VPM · CP | (276, 185, 157) |

</details>

## BICCN-MOp-miniatlas-anatomy 16167 (41 tested)

| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside | Tree inside (median) | Trees ≥ 95% inside |
|---|---:|---:|---:|---:|---:|---:|---:|
| µm, x = AP | 12 | 1 | 2 | 26 | 0 | 86% | 14 |
| µm, x = LR (swap x and z) | 6 | 0 | 0 | 35 | 0 | 90% | 15 |
| 25 µm voxels, x = AP | 0 | 0 | 0 | 0 | 41 | 0% | 0 |
| 25 µm voxels, x = LR (swap x and z) | 0 | 0 | 0 | 0 | 41 | 0% | 0 |

Best: **µm, x = AP**, 13 of 41 in or within 25 µm of the labeled region.

<details><summary>Every neuron</summary>

| Neuron | Label | Region found (µm, x = AP · µm, x = LR (swap x and z) · 25 µm voxels, x = AP · 25 µm voxels, x = LR (swap x and z)) | Soma as deposited |
|---|---|---|---|
| 16167_reg46 | MOp | alv · MOs6a · None · None | (7107, 2822, 3354) |
| 16167_reg26 | MOp | MOp6a · MOs6a · None · None | (4543, 2545, 3746) |
| 16167_reg34 | MOp | DG-mo · MOp6a · None · None | (7517, 2577, 4282) |
| 16167_reg35 | MOp | LP · ccg · None · None | (7040, 2921, 4278) |
| 16167_reg24 | MOp | MOp6a · MOs6a · None · None | (4342, 2617, 3693) |
| 16167_reg18 | MOp | MOs6a · MOp6a · None · None | (4118, 2637, 4275) |
| 16167_reg20 | MOp | MOs6a · MOp6a · None · None | (4207, 2461, 4654) |
| 16167_reg13 | MOp | MOp6a · MOs6a · None · None | (4370, 2455, 3844) |
| 16167_reg19 | MOp | MOs6b · MOs6b · None · None | (4260, 2697, 4279) |
| 16167_reg5 | MOp | chpl · ACAd6a · None · None | (6519, 2479, 3373) |
| 16167_reg41 | MOp | root · MOs6a · None · None | (7421, 2752, 3689) |
| 16167_reg2 | MOp | VL · ACAd5 · None · None | (6151, 2383, 3947) |
| 16167_reg17 | MOp | MOs6a · MOp6a · None · None | (4174, 2517, 4312) |
| 16167_reg27 | MOp | MOp6a · MOs6a · None · None | (4204, 2634, 3675) |
| 16167_reg47 | MOp | CA3 · MOs6a · None · None | (7113, 2640, 3179) |
| 16167_reg45 | MOp | LGd-co · MOs6a · None · None | (7346, 3080, 3618) |
| 16167_reg40 | MOp | CA3 · MOs6a · None · None | (7395, 2657, 3695) |
| 16167_reg22 | MOp | ccg · ccg · None · None | (4187, 2859, 4584) |
| 16167_reg44 | MOp | LGd-sh · MOs6a · None · None | (7578, 2847, 3577) |
| 16167_reg37 | MOp | LP · fa · None · None | (7250, 3110, 3959) |
| 16167_reg38 | MOp | CA3 · MOs6a · None · None | (7265, 2684, 3629) |
| 16167_reg10 | MOp | MOp6a · MOs6a · None · None | (4232, 2702, 3390) |
| 16167_reg31 | MOp | LP · scwm · None · None | (7332, 2878, 4278) |
| 16167_reg8 | MOp | MOp6a · MOs6a · None · None | (4712, 2316, 3921) |
| 16167_reg4 | MOp | MOp6a · ACAd6a · None · None | (4681, 2579, 3889) |
| 16167_reg43 | MOp | CA3 · MOs6a · None · None | (7338, 2696, 3612) |
| 16167_reg42 | MOp | LP · fa · None · None | (7108, 2972, 3934) |
| 16167_reg1 | MOp | CP · ACAd5 · None · None | (6441, 2582, 3113) |
| 16167_reg6 | MOp | VL · PL6a · None · None | (6449, 2703, 3389) |
| 16167_reg21 | MOp | scwm · MOs6b · None · None | (4482, 2821, 3885) |
| 16167_reg29 | MOp | MOp6a · MOs6a · None · None | (4409, 2715, 3903) |
| 16167_reg11 | MOp | MOp6a · MOs6a · None · None | (3942, 3243, 3420) |
| 16167_reg28 | MOp | MOp6a · MOs6a · None · None | (4551, 2538, 3599) |
| 16167_reg9 | MOp | MOp6a · ACAd6a · None · None | (4884, 2138, 4473) |
| 16167_reg7 | MOp | fi · PL6a · None · None | (6597, 2833, 3665) |
| 16167_reg14 | MOp | ccg · ccb · None · None | (4415, 2753, 4669) |
| 16167_reg12 | MOp | MOs6a · MOp6a · None · None | (4236, 2342, 4662) |
| 16167_reg16 | MOp | MOp6a · MOs6a · None · None | (4411, 2437, 4201) |
| 16167_reg48 | MOp | LGd-sh · MOs6a · None · None | (7476, 2994, 3277) |
| 16167_reg30 | MOp | DG-mo · MOp6a · None · None | (7408, 2709, 4485) |
| 16167_reg39 | MOp | root · MOs6a · None · None | (7343, 2754, 3693) |

</details>

## BICCN-MOp-miniatlas-anatomy 195409 (13 tested)

| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside | Tree inside (median) | Trees ≥ 95% inside |
|---|---:|---:|---:|---:|---:|---:|---:|
| µm, x = AP | 5 | 0 | 0 | 8 | 0 | 98% | 9 |
| µm, x = LR (swap x and z) | 7 | 2 | 0 | 4 | 0 | 100% | 11 |
| 25 µm voxels, x = AP | 0 | 0 | 0 | 0 | 13 | 0% | 0 |
| 25 µm voxels, x = LR (swap x and z) | 0 | 0 | 0 | 0 | 13 | 0% | 0 |

Best: **µm, x = LR (swap x and z)**, 9 of 13 in or within 25 µm of the labeled region.

<details><summary>Every neuron</summary>

| Neuron | Label | Region found (µm, x = AP · µm, x = LR (swap x and z) · 25 µm voxels, x = AP · 25 µm voxels, x = LR (swap x and z)) | Soma as deposited |
|---|---|---|---|
| 195409-010_000_reg | MOp | MOp5 · MOs5 · None · None | (4133, 2175, 4095) |
| 195409-008_000_reg | MOp | MOp5 · MOs5 · None · None | (4283, 1925, 4021) |
| 195409-001_000_reg | MOp | MOs6a · MOp6a · None · None | (4017, 2562, 4372) |
| 195409-003_000_reg | MOp | MOp5 · MOs5 · None · None | (4521, 1810, 4201) |
| 195409-002_000_reg | MOp | MOs6a · MOp6a · None · None | (4066, 2370, 4331) |
| 195409-020_000_reg | MOp | MOp5 · MOs5 · None · None | (3823, 2151, 3687) |
| 195409-022_000_reg | MOp | MOs6a · scwm · None · None | (3956, 2727, 4603) |
| 195409-031_000_reg | MOp | ACAd6a · MOp6a · None · None | (3935, 2262, 5009) |
| 195409-023_000_reg | MOp | MOs5 · MOp5 · None · None | (3879, 2126, 4392) |
| 195409-024_000_reg | MOp | MOs5 · MOp5 · None · None | (4194, 2060, 4366) |
| 195409-028_000_reg | MOp | MOs5 · MOp2/3 · None · None | (3853, 1639, 4980) |
| 195409-025_000_reg | MOp | MOp5 · MOs5 · None · None | (4609, 1875, 4292) |
| 195409-006_000_reg | MOp | MOs5 · MOp5 · None · None | (3411, 2215, 4267) |

</details>

## BICCN-MOp-miniatlas-anatomy 195401 (43 tested)

| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside | Tree inside (median) | Trees ≥ 95% inside |
|---|---:|---:|---:|---:|---:|---:|---:|
| µm, x = AP | 39 | 0 | 0 | 4 | 0 | 98% | 28 |
| µm, x = LR (swap x and z) | 9 | 1 | 0 | 33 | 0 | 99% | 31 |
| 25 µm voxels, x = AP | 0 | 0 | 0 | 0 | 43 | 0% | 0 |
| 25 µm voxels, x = LR (swap x and z) | 0 | 0 | 0 | 0 | 43 | 0% | 0 |

Best: **µm, x = AP**, 39 of 43 in or within 25 µm of the labeled region.

<details><summary>Every neuron</summary>

| Neuron | Label | Region found (µm, x = AP · µm, x = LR (swap x and z) · 25 µm voxels, x = AP · 25 µm voxels, x = LR (swap x and z)) | Soma as deposited |
|---|---|---|---|
| 195401-036_000_reg | MOp | MOs5 · MOp5 · None · None | (3003, 3272, 3409) |
| 195401-024_000_reg | MOp | MOp6a · MOs6a · None · None | (4042, 3096, 2969) |
| 195401-041_000_reg | MOp | MOp5 · MOs6a · None · None | (3750, 2837, 3406) |
| 195401-003_000_reg | MOp | MOp2/3 · MOs5 · None · None | (3611, 2891, 2640) |
| 195401-028_000_reg | MOp | MOp5 · MOp5 · None · None | (3749, 2564, 3705) |
| 195401-007_000_reg | MOp | MOp6a · MOs6a · None · None | (3627, 3349, 3262) |
| 195401-045_000_reg | MOp | MOp5 · MOs5 · None · None | (3810, 2396, 3339) |
| 195401-027_000_reg | MOp | MOs5 · MOp5 · None · None | (3281, 2750, 3733) |
| 195401-001_000_reg | MOp | MOp2/3 · MOs5 · None · None | (3973, 2561, 2720) |
| 195401-043_000_reg | MOp | MOp5 · MOs5 · None · None | (3846, 2653, 3447) |
| 195401-008_000_reg | MOp | MOp6a · MOs6a · None · None | (3862, 3265, 3273) |
| 195401-038_000_reg | MOp | MOp6a · MOs6a · None · None | (3794, 3056, 3408) |
| 195401-032_000_reg | MOp | MOp5 · MOs5 · None · None | (3723, 2560, 3598) |
| 195401-011_000_reg | MOp | MOp5 · MOs6a · None · None | (3762, 2915, 3169) |
| 195401-010_000_reg | MOp | MOp5 · MOs5 · None · None | (3604, 3024, 3149) |
| 195401-040_000_reg | MOp | MOp5 · MOs5 · None · None | (3659, 2860, 3410) |
| 195401-048_000_reg | MOp | MOp5 · MOs6a · None · None | (3560, 3040, 3335) |
| 195401-033_000_reg | MOp | MOp6a · MOs6a · None · None | (4010, 2688, 3540) |
| 195401-012_000_reg | MOp | MOp5 · MOs5 · None · None | (3511, 2957, 3237) |
| 195401-047_000_reg | MOp | MOp6a · MOp6a · None · None | (3388, 3224, 3405) |
| 195401-019_000_reg | MOp | MOp2/3 · MOs5 · None · None | (3831, 2487, 2968) |
| 195401-042_000_reg | MOp | MOp5 · MOs5 · None · None | (3739, 2672, 3487) |
| 195401-005_000_reg | MOp | MOp5 · AId6a · None · None | (3720, 3367, 2950) |
| 195401-025_000_reg | MOp | MOp6a · MOs6a · None · None | (4124, 3168, 3090) |
| 195401-051_000_reg | MOp | MOp2/3 · MOs5 · None · None | (3849, 2383, 3222) |
| 195401-015_000_reg | MOp | MOp2/3 · MOp2/3 · None · None | (3139, 2727, 3189) |
| 195401-018_000_reg | MOp | MOp2/3 · MOs5 · None · None | (3950, 2340, 3050) |
| 195401-044_000_reg | MOp | MOp5 · MOs5 · None · None | (3824, 2552, 3391) |
| 195401-046_000_reg | MOp | MOp6a · MOs6a · None · None | (3532, 3523, 3371) |
| 195401-053_000_reg | MOp | MOs6a · MOp6a · None · None | (3499, 3069, 4086) |
| 195401-049_000_reg | MOp | MOp5 · MOs5 · None · None | (3726, 2597, 3287) |
| 195401-035_000_reg | MOp | MOp6a · MOp6a · None · None | (3629, 3131, 3629) |
| 195401-029_000_reg | MOp | MOp6a · MOs6a · None · None | (3974, 2832, 3709) |
| 195401-020_000_reg | MOp | MOp5 · MOs5 · None · None | (3756, 2959, 2980) |
| 195401-023_000_reg | MOp | MOp6a · MOs6a · None · None | (3713, 3372, 3059) |
| 195401-030_000_reg | MOp | MOp5 · MOs5 · None · None | (3907, 2560, 3571) |
| 195401-016_000_reg | MOp | MOp5 · MOp5 · None · None | (3295, 2862, 3228) |
| 195401-009_000_reg | MOp | MOp5 · MOs5 · None · None | (3381, 3197, 3119) |
| 195401-031_000_reg | MOp | MOp5 · MOs5 · None · None | (3861, 2634, 3505) |
| 195401-052_000_reg | MOp | MOp5 · MOs5 · None · None | (3972, 2485, 3293) |
| 195401-006_000_reg | MOp | MOp5 · MOs5 · None · None | (3430, 3161, 2876) |
| 195401-002_000_reg | MOp | MOp2/3 · MOs5 · None · None | (3921, 2860, 2712) |
| 195401-014_000_reg | MOp | MOs5 · MOp5 · None · None | (3075, 2973, 3222) |

</details>

## BICCN-MOp-miniatlas-anatomy 182280 (3 tested)

| Convention | Agrees | Within 25 µm | Coarser | Disagrees | Outside | Tree inside (median) | Trees ≥ 95% inside |
|---|---:|---:|---:|---:|---:|---:|---:|
| µm, x = AP | 0 | 0 | 0 | 3 | 0 | 100% | 3 |
| µm, x = LR (swap x and z) | 3 | 0 | 0 | 0 | 0 | 100% | 3 |
| 25 µm voxels, x = AP | 0 | 0 | 0 | 0 | 3 | 0% | 0 |
| 25 µm voxels, x = LR (swap x and z) | 0 | 0 | 0 | 0 | 3 | 0% | 0 |

Best: **µm, x = LR (swap x and z)**, 3 of 3 in or within 25 µm of the labeled region.

<details><summary>Every neuron</summary>

| Neuron | Label | Region found (µm, x = AP · µm, x = LR (swap x and z) · 25 µm voxels, x = AP · 25 µm voxels, x = LR (swap x and z)) | Soma as deposited |
|---|---|---|---|
| 182280-001_000_reg | MOp | MOs6a · MOp5 · None · None | (3154, 3205, 3667) |
| 182280-003_000_reg | MOp | MOs5 · MOp5 · None · None | (3435, 2514, 3615) |
| 182280-004_000_reg | MOp | MOs5 · MOp5 · None · None | (3155, 2776, 3568) |

</details>

## Skipped

- MouseLight: no soma: 1
- Peng: label not matched: 2
