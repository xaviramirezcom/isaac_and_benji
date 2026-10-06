How models/body.bin was made (needs numpy<2, trimesh, fast-simplification==0.1.7 on Python 3.9):
1. Download the Human Reference Atlas male body (https://cdn.humanatlas.io/digital-objects/ref-organ/united-male/v1.5/assets/3d-vh-m-united.glb → united-male.glb) and the BodyParts3D chunks from https://github.com/ashemag/human-atlas/tree/main/public/models (atlas.json + body-N.bin.gz → atlas/).
2. python load_vh.py   (dumps the scene to vh_nodes.pkl)   3. python build_model.py   (groups, simplifies, registers the stomach and ribs, packs out/body.bin + body.json)
Credits: see models/ATTRIBUTION.md.
