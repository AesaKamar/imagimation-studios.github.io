import {variationParams} from './genetics.js';
import {pairTransforms} from './morph-pairs.js';
import {PRESETS,hexRgb,rgbHex} from './color.js';
const copy=x=>structuredClone(x),mix=(a,b,t)=>a+(b-a)*t;
const pairCache=new WeakMap();
function matched(a,b){
 let cached=pairCache.get(a);
 if(!cached||cached.target!==b){cached={target:b,pairs:pairTransforms(a.transforms,b.transforms)};pairCache.set(a,cached);}
 return cached.pairs;
}
// Overlap compatible functions instead of detouring through the linear fallback.
// Version-two recipes allow two slots, with parameterized functions in slot zero.
function variations(a,b,t){
 const same=(x,y)=>x.id===y.id&&(!(x.id===25||x.id===26)||variationParams(x)[0]===variationParams(y)[0]);
 const result=a.map(x=>({...copy(x),weight:x.weight*(1-t)})),used=new Set();
 for(const y of b){
  const i=a.findIndex((x,j)=>!used.has(j)&&same(x,y));
  if(i<0)result.push({...copy(y),weight:y.weight*t});
  else {
   used.add(i);
   result[i].weight+=y.weight*t;
   if(y.id>=25)result[i].params=variationParams(a[i]).map((v,j)=>mix(v,variationParams(y)[j],t));
  }
 }
 if(result.length<=2&&result.filter(v=>v.id>=25).length<=1){
  // Stable sorting leaves the ordinary function order intact.
  return result.sort((x,y)=>(y.id>=25)-(x.id>=25));
 }
 // Keep complex handovers in parameter space: switch identities only at zero
 // contribution, rather than switching at full weight and hiding it with a dissolve.
 return legacyVariations(a,b,t);
}
// Preserve already-shared version-one transition routes. New morphs use overlap.
const smooth=t=>t*t*(3-2*t);
function legacyVariations(a,b,t){
 // Align shared distortion IDs before fading between unrelated slots.
 if(b.length===2&&a[0].id<25&&b[0].id<25&&a[0].id!==b[0].id&&(a[0].id===b[1].id||(a.length===2&&a[1].id===b[0].id)))b=[b[1],b[0]];
 const result=Array.from({length:Math.max(a.length,b.length)},(_,i)=>{
  const x=a[i]||{id:b[i].id,weight:0},y=b[i]||{id:a[i].id,weight:0};
  const xp=variationParams(x),yp=variationParams(y);
  const same=x.id===y.id&&(!(x.id===25||x.id===26)||xp[0]===yp[0]);
  if(same)return {...copy(x),weight:mix(x.weight,y.weight,t),...(x.id>=25?{params:xp.map((p,j)=>mix(p,yp[j],t))}:{})};
  const pivot=i===0?.4:.6;
  return t<pivot?{...copy(x),weight:x.weight*(1-smooth(t/pivot))}:{...copy(y),weight:y.weight*smooth((t-pivot)/(1-pivot))};
 });
 const total=result.reduce((sum,v)=>sum+v.weight,0);
 if(total>1)result.forEach(v=>v.weight/=total);
 return result;
}
export function morphGenome(from,to,progress,legacy=false){
 if(progress<=0)return copy(from);if(progress>=1)return copy(to);
 const t=progress*.9+progress*progress*(3-2*progress)*.1,out=copy(from);
 const a=from.recipe,b=to.recipe,n=Math.max(a.transforms.length,b.transforms.length);
 out.recipe.transforms=matched(a,b).map(([ai,bi])=>{
  const x=a.transforms[ai]||b.transforms[bi],y=b.transforms[bi]||a.transforms[ai];
  return {affine:x.affine.map((v,j)=>mix(v,y.affine[j],t)),variations:(legacy?legacyVariations:variations)(x.variations,y.variations,t),probability:mix(a.transforms[ai]?.probability||.000001,b.transforms[bi]?.probability||.000001,t),color:mix(x.color,y.color,t),speed:mix(x.speed,y.speed,t)};
 });
 const total=out.recipe.transforms.reduce((s,x)=>s+x.probability,0),floor=.000002;
 out.recipe.transforms.forEach(x=>x.probability=floor+(1-n*floor)*x.probability/total);
 // Discrete symmetry changes are crossfaded by the presentation layer.
 out.recipe.symmetry=t<.5?a.symmetry:b.symmetry;
 const ca=from.colors?from.colors.map(hexRgb):PRESETS[from.palette],cb=to.colors?to.colors.map(hexRgb):PRESETS[to.palette];
 out.colors=ca.map((c,i)=>rgbHex(c.map((v,j)=>mix(v,cb[i][j],t))));out.recipe.customColors=[...out.colors];delete out.colorSettings;
 out.zoom=mix(from.zoom,to.zoom,t);out.exposure=mix(from.exposure,to.exposure,t);
 return out;
}
