// Deterministic, bounded matching for at most eight transforms. No recipe edits.
export function pairTransforms(a,b){
 const pairs=Array.from({length:a.length},(_,i)=>[i,-1]),used=new Set();
 for(let k=0;k<Math.min(a.length,b.length);k++){
  let best=Infinity,ai=-1,bi=-1;
  for(let i=0;i<a.length;i++)if(pairs[i][1]<0){
   for(let j=0;j<b.length;j++)if(!used.has(j)){
    let cost=0;
    for(let c=0;c<6;c++)cost+=(a[i].affine[c]-b[j].affine[c])**2;
    for(const v of a[i].variations)if(!b[j].variations.some(w=>w.id===v.id))cost+=2*v.weight;
    for(const v of b[j].variations)if(!a[i].variations.some(w=>w.id===v.id))cost+=2*v.weight;
    cost+=.25*Math.abs(a[i].probability-b[j].probability);
    const score=Math.round(cost*1e6);
    if(score<best){best=score;ai=i;bi=j;}
   }
  }
  pairs[ai][1]=bi;used.add(bi);
 }
 for(let j=0;j<b.length;j++)if(!used.has(j))pairs.push([-1,j]);
 return pairs;
}
