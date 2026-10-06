import struct,json,pickle,re,numpy as np
f=open('united-male.glb','rb'); f.read(12); clen,_=struct.unpack('<I4s',f.read(8)); J=json.loads(f.read(clen))
nodes=J['nodes']; parent={}
for i,n in enumerate(nodes):
    for c in n.get('children',[]): parent[c]=i
name2i={}
for i,n in enumerate(nodes): name2i.setdefault(n.get('name'),[]).append(i)
def ancestors(i):
    out=[]
    while i in parent: i=parent[i]; out.append(nodes[i].get('name'))
    return out
NODES=pickle.load(open('vh_nodes.pkl','rb'))
def path_of(node):
    base=re.sub(r'_\d+$','',node)
    idx=name2i.get(node) or name2i.get(base) or []
    return [node]+(ancestors(idx[0]) if idx else [])
RULES=[('skin',lambda p:'VH_M_skin' in p[0]),
 ('lungs',lambda p:any(x in('VH_M_lungs',) for x in p)),
 ('airway',lambda p:any(x in('VH_M_tracheobronchial_tree',) for x in p)),
 ('heart',lambda p:any(x in('VH_M_heart',) for x in p)),
 ('vessels',lambda p:any(x in('VH_M_aorta','VH_M_pulmonary_artery','VH_M_vena_cava','VH_M_pulmonary_vein','VH_M_brachiocephalic_vein') for x in p)),
 ('liver',lambda p:any(x in('VH_M_liver','VH_M_gallbladder_') for x in p) ),
 ('kidneys',lambda p:any(x in('VH_M_kidney','VH_M_renal_pelvis_ureter') for x in p)),
 ('bladder',lambda p:any(x=='VH_M_urinary_bladder' for x in p)),
 ('smallint',lambda p:any(x=='VH_M_small_intestine' for x in p)),
 ('largeint',lambda p:any(x=='VH_M_colon' for x in p)),
 ('pancreas',lambda p:any(x=='VH_M_pancreas' for x in p)),
 ('spleen',lambda p:any(x=='VH_M_spleen' for x in p)),
 ('spine',lambda p:any(x=='VH_M_vertebrae' for x in p)),
 ('pelvis',lambda p:any(x=='VH_M_pelvis' for x in p)),
 ('brain',lambda p:p[0].startswith('Allen_') and re.search(r'gyrus|lobule|precuneus|cuneus|operculum|pole|planum|cerebellar_vermis|cortex|temporal|orbital|cingulate|isthmus|rectus|fusiform',p[0],re.I) and not re.search(r'ventricle|nucleus|nuclei|white_matter|tract|commissure|callosum|fornix|bulb|hippocampus|amygdal|thalamus|caudate|putamen|claustrum|pallidus|septal|forebrain|zona|habenular|pineal|accumbens|hth|region',p[0],re.I)),
]
G={}
for node in NODES:
    p=path_of(node)
    for g,fn in RULES:
        if fn(p): G.setdefault(g,[]).append(node); break
if __name__=='__main__':
    for g,l in G.items():
        v=np.vstack([NODES[n][0] for n in l]); tris=sum(len(NODES[n][1]) for n in l)
        print(g,len(l),'tris',tris,'min',v.min(0).round(3),'max',v.max(0).round(3))
