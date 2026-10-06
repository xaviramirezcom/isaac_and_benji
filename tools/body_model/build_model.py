"""Packs the realistic body (Human Reference Atlas / Visible Human male + BodyParts3D stomach & ribs) into one small binary for the app."""
import json, re, struct, numpy as np, fast_simplification as fs
from groups import G, NODES, path_of
from bp3d import find, part

def vh_parts(group, pred=None):
    out=[]
    for n in G.get(group,[]):
        if pred and not pred(n, path_of(n)): continue
        out.append((n,)+NODES[n])
    return out
def simp(v,f,target):
    if len(f)<=target: return v,f
    r=1-target/len(f)
    v2,f2=fs.simplify(v.astype(np.float32),f.astype(np.int32),target_reduction=min(r,0.97),agg=5)
    return v2.astype(np.float32),f2.astype(np.int32)
def col(hexs,j=0.0,rng=None):
    c=np.array([int(hexs[i:i+2],16) for i in (1,3,5)],dtype=np.float32)
    if rng is not None and j: c=c*(1+j*(rng.random()-0.5)*2)
    return np.clip(c,0,255)
rng=np.random.default_rng(3)

# ---- registration of the BodyParts3D pieces onto the Visible Human body: match the centres of spleen, kidneys and bladder
def centroid(vs): return np.vstack(vs).mean(0)
vh_spl=centroid([NODES[n][0] for n in G['spleen']]); vh_blad=centroid([NODES[n][0] for n in G['bladder']])
vh_kid=centroid([NODES[n][0] for n in G['kidneys'] if 'cortex' in n.lower()])
bp_spl=centroid([part(p)[0] for p in find('Spleen')]); bp_blad=centroid([part(p)[0] for p in find('Urinary bladder')]); bp_kid=centroid([part(p)[0] for p in find('Left kidney')+find('Right kidney')])
T=np.mean([vh_spl-bp_spl, vh_blad-bp_blad, vh_kid-bp_kid],axis=0); print('translate',T, [vh_spl-bp_spl, vh_blad-bp_blad, vh_kid-bp_kid])

ORG={}   # id -> list of (verts, faces, rgb) already in body coordinates
def add(oid, v, f, rgb, target):
    v,f=simp(v,f,target); ORG.setdefault(oid,[]).append((v,f,np.tile(rgb,(len(v),1))))

# skin
for n,v,f in vh_parts('skin'): add('skin',v,f,col('#e2a583'),42000)
# modesty: smooth over the crotch and paint a pair of boxer shorts (the scan is anatomically nude)
sv,sf,sc=ORG['skin'][0]
cap=np.interp(sv[:,1],[-0.2,-0.13,-0.09,-0.04,0.2],[0.045,0.058,0.078,0.098,0.2])
m=(np.abs(sv[:,0])<0.07)&(sv[:,1]>-0.21)&(sv[:,1]<0.0)&(sv[:,2]>cap)
sv[m,2]=cap[m]
ORG['skin'][0]=(sv,sf,sc)
# brain: every cortex piece, a little different in tone
parts=vh_parts('brain'); per=max(300,60000//max(1,len(parts)))
for n,v,f in parts: add('brain',v,f,col('#d9a39e',0.10,rng),per)
# lungs + airway
for n,v,f in vh_parts('lungs'): add('lungs',v,f,col('#c98d89',0.04,rng),2500)
for n,v,f in vh_parts('airway'): add('lungs',v,f,col('#e8d8c6'),max(150,12000//38))
# heart: muscle + big vessels (arteries red, veins blue)
for n,v,f in vh_parts('heart'): add('heart',v,f,col('#b23a3a',0.05,rng),3500)
for n,v,f in vh_parts('vessels'):
    vein=re.search(r'vein|vena',' '.join(path_of(n)),re.I)
    add('heart',v,f,col('#4668b0' if vein else '#c4302f'),700)
# liver (+ gallbladder)
for n,v,f in vh_parts('liver'):
    gall='gallbladder' in ' '.join(path_of(n)).lower()
    add('liver',v,f,col('#5f8f38' if gall else '#8f3b2b',0.04,rng),900)
# kidneys (outer cortex + the drainage tubes)
for n,v,f in vh_parts('kidneys', lambda n,p: re.search('cortex|ureter|pelvis',' '.join(p),re.I) and not re.search('calyx|papilla|pyramid|medulla',n,re.I)):
    pel=re.search('ureter|pelvis',' '.join(path_of(n)),re.I)
    add('kidneys',v,f,col('#d9b27f' if pel else '#8c332e'),3000)
for n,v,f in vh_parts('bladder'): add('bladder',v,f,col('#dea58d'),1200)
for n,v,f in vh_parts('smallint'): add('smallint',v,f,col('#e38b78',0.05,rng),6000)
for n,v,f in vh_parts('largeint'): add('largeint',v,f,col('#cf7a62',0.04,rng),5000)
# stomach (BodyParts3D, moved into place)
for p in find('Stomach'):
    v,f=part(p); add('stomach',v+T,f,col('#d9776a'),9000)
# context: spine, pelvis (VH) and ribs + sternum (BodyParts3D)
for n,v,f in vh_parts('spine'): add('bones',v,f,col('#e9dcc0'),900)
for n,v,f in vh_parts('pelvis'): add('bones',v,f,col('#e9dcc0'),900)
for p in A_parts if False else []: pass
import json as _j
A=_j.load(open('atlas/atlas.json'))
for p in A['parts']:
    if re.search(r'\brib\b|sternum|manubrium|costal cartilage',p['name'],re.I) and p['system'] in ('skeletal','connective'):
        v,f=part(p); add('bones',v+T,f,col('#eadfc4'),700)
# extra organs shown as always-there context
for n,v,f in vh_parts('pancreas'): add('context',v,f,col('#d9a86a'),1500)
for n,v,f in vh_parts('spleen'): add('context',v,f,col('#7d2c3b'),1500)

# ---- pack: int16 positions around the centroid, uint8 colours, uint16/32 indices
blob=bytearray(); meta={}
def pad(): 
    while len(blob)%4: blob.append(0)
for oid,lst in ORG.items():
    V=np.vstack([v for v,f,c in lst]); C=np.vstack([c for v,f,c in lst]).astype(np.uint8)
    off=0; F=[]
    for v,f,c in lst: F.append(f+off); off+=len(v)
    F=np.vstack(F)
    lo,hi=V.min(0),V.max(0); ctr=((lo+hi)/2); half=(hi-lo).max()/2+1e-6
    Q=np.round((V-ctr)/half*32767).astype('<i2')
    idt='<u2' if len(V)<65536 else '<u4'
    pad(); pos=len(blob); blob+=Q.tobytes(); pad(); cc=len(blob); blob+=C.tobytes(); pad(); ii=len(blob); blob+=F.astype(idt).tobytes()
    meta[oid]=dict(center=[float(x) for x in ctr],half=float(half),verts=len(V),tris=len(F),pos=pos,col=cc,idx=ii,idxType='u2' if idt=='<u2' else 'u4',
                   bbox=[[float(x) for x in lo],[float(x) for x in hi]])
    print(oid,len(V),'verts',len(F),'tris')
import os
os.makedirs('out',exist_ok=True)
open('out/body.bin','wb').write(blob); json.dump(meta,open('out/body.json','w'))
print('bytes',len(blob), 'tris',sum(m['tris'] for m in meta.values()))
