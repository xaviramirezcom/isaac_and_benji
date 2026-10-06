import json,numpy as np
A=json.load(open('atlas/atlas.json'))
CH={}
def chunk(i):
    if i not in CH: CH[i]=open(f'atlas/body-{i}.bin','rb').read()
    return CH[i]
def part(p):
    b=chunk(p['chunk']); n=p['vertexCount']
    v=np.frombuffer(b,dtype='<f4',count=n*3,offset=p['positions']).reshape(n,3)
    f=np.frombuffer(b,dtype='<u4',count=p['indexCount'],offset=p['indices']).reshape(-1,3)
    return v.copy(),f.copy()
def find(name,exact=True):
    return [p for p in A['parts'] if (p['name']==name if exact else name.lower() in p['name'].lower())]
if __name__=='__main__':
    from groups import G,NODES
    def vh(g): return np.vstack([NODES[n][0] for n in G[g]])
    def bp(names):
        vs=[]
        for nm in names:
            for p in find(nm): vs.append(part(p)[0])
        return np.vstack(vs)
    print('BP kidney L',bp(['Left kidney']).min(0),bp(['Left kidney']).max(0))
    print('BP kidney R',bp(['Right kidney']).min(0),bp(['Right kidney']).max(0))
    print('BP bladder',bp(['Urinary bladder']).min(0),bp(['Urinary bladder']).max(0))
    print('BP stomach',bp(['Stomach']).min(0),bp(['Stomach']).max(0))
    print('BP spleen',bp(['Spleen']).min(0),bp(['Spleen']).max(0))
    print('BP trachea',bp(['Trachea']).min(0),bp(['Trachea']).max(0))
    print('VH kidneys',vh('kidneys').min(0),vh('kidneys').max(0))
    print('VH spleen',vh('spleen').min(0),vh('spleen').max(0))
