const PH="https://ob67nrhuhoyfvgao.public.blob.vercel-storage.com/event-photos/signal-2026/signal-2026_";
const ph=n=>PH+String(n).padStart(3,"0")+".webp";
const sets={
 foyer:[24,14,301,175,305],
 stage:[124,244,263,221,232],
 room:[78,134,248,253,254],
 hands:[58,66,310,311,312],
 smiles:[23,202,291,40,63],
};
export const jobs=[];
for(const [k,arr] of Object.entries(sets)) arr.forEach((n,i)=>jobs.push([`buzz-${k}-${i+1}`,ph(n),"cover","4:5",{autoLogo:true,overlay:{colour:"dark",placement:"none",strength:0}}]));
