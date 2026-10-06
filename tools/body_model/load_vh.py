import trimesh, numpy as np, pickle, time
t=time.time()
sc=trimesh.load('united-male.glb', force='scene')
print('loaded',time.time()-t, len(sc.geometry))
out={}
for node in sc.graph.nodes_geometry:
    T,gname=sc.graph[node]
    g=sc.geometry[gname]
    v=trimesh.transform_points(g.vertices,T)
    out[node]=(v.astype(np.float32), np.asarray(g.faces,dtype=np.int32))
pickle.dump(out,open('vh_nodes.pkl','wb'))
allv=np.vstack([v for v,f in out.values()]); print('bounds',allv.min(0),allv.max(0), 'tris',sum(len(f) for v,f in out.values()))
for k in ['VH_M_skin','VH_M_left_kidney','VH_M_urinary_bladder']:
    ks=[n for n in out if k in n]; print(k,ks[:3])
