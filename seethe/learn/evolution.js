import {PRESETS,hexRgb,rgbHex,rgbHsl,hslRgb} from './color.js';
import {rng,validRecipe,variationParams,parameterBounds} from './genetics.js';
const clone=x=>structuredClone(x), clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
export function nextTarget(anchor,previous,strength=.35){
 const random=rng(previous.seed),seed=Math.floor(random()*4294967296)||1, target=clone(previous);
 target.seed=seed;target.parentSeed=previous.seed;target.depth=Math.min(100000,previous.depth+1);
 target.transforms.forEach((t,i)=>{
  const base=anchor.transforms[i],a=(random()-.5)*strength*.9,c=Math.cos(a),s=Math.sin(a),scale=Math.exp((random()-.5)*strength*.3);
  const [x0,x1,y0,y1]=t.affine;
  const proposed=[(c*x0-s*y0)*scale,(c*x1-s*y1)*scale,(s*x0+c*y0)*scale,(s*x1+c*y1)*scale,t.affine[4]+(random()-.5)*strength*.4,t.affine[5]+(random()-.5)*strength*.4];
  t.affine=proposed.map((x,j)=>clamp(mix(x,base.affine[j],.035),Math.max(-2,base.affine[j]-.65),Math.min(2,base.affine[j]+.65)));
  // Bound relative to the founding recipe so a long random walk cannot erase branches.
  t.probability=clamp(t.probability*Math.exp((random()-.5)*strength*.6),Math.max(.00001,base.probability*.25),Math.max(.00001,base.probability*4));
 });
 // Independent parameter stream preserves the existing geometry random sequence.
 const paramRandom=rng((previous.seed^0x7a6d132b)>>>0);
 target.transforms.forEach((t,i)=>{
  const v=t.variations[0];if(v.id<25)return;
  const p=variationParams(v),base=variationParams(anchor.transforms[i].variations[0]);
  v.params=p.map((x,j)=>{
   if(j===0&&(v.id===25||v.id===26))return base[0];
   const [lo,hi]=parameterBounds(v.id,j);
   return clamp(mix(x+(paramRandom()-.5)*Math.min(strength,1)*.06,base[j],.04),Math.max(lo,base[j]-.2),Math.min(hi,base[j]+.2));
  });
 });
 const sum=target.transforms.reduce((s,t)=>s+t.probability,0);target.transforms.forEach(t=>t.probability/=sum);
 if(target.transforms.some(t=>t.probability<.000001)){const floor=.000002;target.transforms.forEach(t=>t.probability=floor+(1-floor*target.transforms.length)*t.probability);}
 // A separate stream leaves geometry unchanged. Drift gently within the founding palette.
 const colorRandom=rng((previous.seed^0xc01a5eed)>>>0);
 target.transforms.forEach((t,i)=>{
  const base=anchor.transforms[i].color;
  t.color=clamp(mix(t.color+(colorRandom()-.5)*.035,base,.025),Math.max(0,base-.15),Math.min(1,base+.15));
 });
 // Twelve degrees per six-second transition: visible drift, a three-minute hue cycle.
 target.evolutionHue=(previous.evolutionHue??0)+12;
 const hue=target.evolutionHue-(anchor.evolutionHue??0);
 target.customColors=(anchor.customColors?anchor.customColors.map(hexRgb):PRESETS[anchor.palette]).map(rgb=>{const [h,s,l]=rgbHsl(rgb);return rgbHex(hslRgb(h+hue,s,l));});
 return target;
}
export function wanderTarget(anchor,strength=.25,step=0,totalSteps=4){
 const seedSalt=(0x3d82a17f+Math.imul(step,0x9e3779b9))>>>0;
 const random=rng((anchor.seed^seedSalt)>>>0),target=clone(anchor);
 target.transforms.forEach((t,i)=>{
  const base=anchor.transforms[i];
  // Pure radial scale breathing: orientation angle is strictly invariant (c=1, s=0)
  const scale=clamp(Math.exp((random()-.5)*strength*.3),.82,1.22);
  const [x0,x1,y0,y1]=base.affine;
  // Translation is strictly invariant: delta e = 0, delta f = 0
  t.affine=[clamp(x0*scale,-2,2),clamp(x1*scale,-2,2),clamp(y0*scale,-2,2),clamp(y1*scale,-2,2),base.affine[4],base.affine[5]];
  // Gentle density flow between branches
  t.probability=clamp(base.probability*Math.exp((random()-.5)*strength*.35),Math.max(.00001,base.probability*.5),Math.max(.00001,base.probability*2));
 });
 const sum=target.transforms.reduce((s,t)=>s+t.probability,0);target.transforms.forEach(t=>t.probability/=sum);
 if(target.transforms.some(t=>t.probability<.000001)){const floor=.000002;target.transforms.forEach(t=>t.probability=floor+(1-floor*target.transforms.length)*t.probability);}
 // Internal variation parameter flex for nonlinear variations (Julia, Curl, Bubble, Swirl, etc.)
 const paramSalt=(0x7a6d132b+Math.imul(step,0x85ebca6b))>>>0;
 const paramRandom=rng((anchor.seed^paramSalt)>>>0);
 target.transforms.forEach((t,i)=>{
  const v=t.variations[0];if(v.id<25)return;
  const p=variationParams(v),base=variationParams(anchor.transforms[i].variations[0]);
  v.params=p.map((x,j)=>{
   if(j===0&&(v.id===25||v.id===26))return base[0];
   const [lo,hi]=parameterBounds(v.id,j);
   return clamp(base[j]+(paramRandom()-.5)*Math.min(strength,1)*.08,lo,hi);
  });
 });
 // Subtle color coordinate drift within founding palette
 const colorSalt=(0xc01a5eed+Math.imul(step,0xc2b2ae35))>>>0;
 const colorRandom=rng((anchor.seed^colorSalt)>>>0);
 target.transforms.forEach((t,i)=>{
  const base=anchor.transforms[i].color;
  t.color=clamp(base+(colorRandom()-.5)*.04,Math.max(0,base-.12),Math.min(1,base+.12));
 });
 // Phase-shifted shimmer arc across progressive mutation stages
 const hue=Math.sin((step+1)*(2*Math.PI/totalSteps))*8;
 target.evolutionHue=(anchor.evolutionHue??0)+hue;
 target.customColors=(anchor.customColors?anchor.customColors.map(hexRgb):PRESETS[anchor.palette]).map(rgb=>{const [h,s,l]=rgbHsl(rgb);return rgbHex(hslRgb(h+hue,s,l));});
 return target;
}
// RMS parameter distance keeps the pace independent of transform count.
const vector=r=>r.transforms.flatMap(t=>[...t.affine,t.probability]);
const distance=(a,b)=>Math.sqrt(a.reduce((sum,x,i)=>sum+(x-b[i])**2,0)/a.length);
export function interpolateRecipe(a,b,progress){
 if(progress<=0)return clone(a);if(progress>=1)return clone(b);
 // Blend 10% smoothstep into linear motion: endpoint speed stays at 90%.
 const t=mix(progress,progress*progress*(3-2*progress),.1);
 const out=clone(a);
 out.transforms.forEach((v,i)=>{
  const target=b.transforms[i];
  v.affine=v.affine.map((x,j)=>mix(x,target.affine[j],t));
  v.probability=mix(v.probability,target.probability,t);
  v.color=mix(v.color,target.color,t);
  if(v.variations[0].id>=25){const p=variationParams(v.variations[0]),q=variationParams(target.variations[0]);v.variations[0].params=p.map((x,j)=>j===0&&(v.variations[0].id===25||v.variations[0].id===26)?x:mix(x,q[j],t));}
 });
 const ca=a.customColors?a.customColors.map(hexRgb):PRESETS[a.palette];
 const cb=b.customColors?b.customColors.map(hexRgb):PRESETS[b.palette];
 out.customColors=ca.map((c,i)=>rgbHex(c.map((v,j)=>mix(v,cb[i][j],t))));
 out.evolutionHue=mix(a.evolutionHue??0,b.evolutionHue??0,t);
 return out;
}
export class Evolution {
 constructor(recipe,strength=.35){
  if(!validRecipe(recipe))throw Error('Invalid evolution recipe');
  this.anchor=clone(recipe);this.from=clone(recipe);
  this.travel=0;this.steps=0;this.prepare(strength);
 }
 prepare(strength){
  this.to=nextTarget(this.anchor,this.from,strength);
  // Keep the color clock running even when the geometry is stationary.
  this.length=Math.max(1e-9,distance(vector(this.from),vector(this.to)));
 }
 advance(seconds,speed=8,strength=.35){
  // 48 seconds at 1×, six seconds at 8×, regardless of target distance.
  let progress=this.travel/this.length+Math.max(0,seconds)*Math.max(0,speed)/48;
  while(progress>=1){
   progress-=1;
   this.from=this.to;this.steps++;this.prepare(strength);
  }
  this.travel=progress*this.length;
  return this.snapshot();
 }
 serialize(){return structuredClone({anchor:this.anchor,from:this.from,to:this.to,travel:this.travel,steps:this.steps});}
 static restore(data){
  if(!data||![data.anchor,data.from,data.to].every(validRecipe)||data.from.transforms.length!==data.to.transforms.length||data.anchor.transforms.length!==data.from.transforms.length||!Number.isFinite(data.travel)||data.travel<0||!Number.isInteger(data.steps)||data.steps<0)throw Error('Invalid evolution state');
  const e=Object.assign(Object.create(Evolution.prototype),structuredClone(data));
  e.length=Math.max(1e-9,distance(vector(e.from),vector(e.to)));
  if(e.travel>e.length)throw Error('Invalid evolution position');
  return e;
 }
 snapshot(){return interpolateRecipe(this.from,this.to,this.length?this.travel/this.length:0);}
}
