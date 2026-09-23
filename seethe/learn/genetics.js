import {WEB_RECIPE_FAMILIES} from './web-recipe-families.js';
import {RECIPE_FAMILIES} from './recipe-families.js';
import {validColors,setCoreColors} from './color.js';
// Version 2 stores the actual recipe, so discoveries survive changes to the generator.
export const VARIATIONS=['Linear','Sine','Spherical','Swirl','Julia','Curl','Horseshoe','Bubble','Disc','Diamond','Ripple','Fold','Polar','Handkerchief','Heart','Spiral','Bent','Cylinder','Hyperbolic','Ex','Fisheye','Exponential','Power','Cosine','Eyefish','JuliaN','JuliaScope','Parametric Curl','Rings2','Fan2','Bipolar'];
export const FORMS=['Freeform','Ring','Branches','Chain','Clusters','Nested',...Object.keys(RECIPE_FAMILIES),...Object.keys(WEB_RECIPE_FAMILIES)];
export const LEVELS=['gentle','adventurous','wild'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rounded=x=>Math.round(x*1e6)/1e6||0;
export function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
const pick=(r,x)=>x[Math.floor(r()*x.length)];
const NAME_TEXTURES='Velvet|Distant|Hidden|Glass|Electric|Tidal|Amber|Lunar|Soft|Endless|Silent|Prismatic|Opaline|Molten|Iridescent|Midnight|Solar|Crystalline|Wild|Weightless|Violet|Golden|Silver|Scarlet|Cobalt|Lucent|Hollow|Wandering|Forgotten|Secret|Fractured|Radiant|Submerged|Suspended|Saffron|Obsidian|Pearlescent|Vermilion|Cerulean|Ephemeral|Glacial|Burnished|Feathered|Incandescent|Nocturnal|Ultraviolet|Frosted|Woven|Liquid|Ancient|Unwritten|Dissolving|Mercurial|Infinite|Delicate|Untamed|Phosphorescent|Rosewater|Celestial|Dreaming|Astral|Sidereal|Nebulous|Gossamer|Diaphanous|Nacreous|Evanescent|Penumbral|Spectral|Resonant|Harmonic|Elliptic|Asymptotic|Quasiperiodic|Interstellar|Interwoven|Aetheric|Luminous|Vaporous|Auroral|Polar|Translucent|Entangled|Refracted|Diffracted|Scattered|Fugitive|Equinoctial|Hushed|Drifting|Numinous|Ineffable'.split('|');
const NAME_FORMS='lattice|current|bloom|echo|ribbon|chamber|orbit|garden|spiral|constellation|filament|tide|cathedral|orchid|nebula|vortex|archipelago|mirage|tapestry|halo|chrysalis|labyrinth|estuary|petal|comet|reverie|cascade|sanctuary|horizon|crown|feather|circuit|lantern|mandala|delta|aurora|cocoon|fugue|wavelength|coral|anemone|origami|oasis|monolith|arabesque|afterimage|firefly|veil|prism|symphony|tendril|supernova|whorl|portal|seashell|serpent|waterfall|diadem|mosaic|pendulum|manifold|attractor|geodesic|torus|helix|lemniscate|caustic|harmonic|resonance|interference|symmetry|tessellation|quasicrystal|parabola|hyperbola|asymptote|eigenvector|wavefront|soliton|singularity|epicycle|aphelion|perihelion|eclipse|parallax|asterism|pulsar|quasar|accretion|umbra|penumbra|syzygy|firmament|aether|eventide|isoline|catenary|infinity|vesper|ephemeris'.split('|');
const NAME_MATERIALS='starlight|rain|embers|mercury|silk|glass|mist|moonlight|salt|honey|lightning|dust|opal|smoke|frost|copper|velvet|ink|fire|water|pollen|sunlight|jade|shadow|porcelain|amethyst|gold|sapphire|quartz|flame|snow|pearls|neon|silver|saffron|ochre|rosewater|obsidian|daybreak|twilight|aether|ionlight|comet dust|cosmic dust|afterglow|airglow|radiance|halflight|void|vacuum|equinox|solstice|starfire|helium|hydrogen|plasma|infrared|haze|gossamer|labradorite|selenite|fluorite|bismuth|iridium'.split('|');
// Separate mood from light/color so adjective pairs read naturally.
const NAME_MOODS='Silent|Distant|Hidden|Endless|Wandering|Forgotten|Secret|Suspended|Ancient|Delicate|Untamed|Dreaming|Weightless|Submerged|Fractured|Hushed|Drifting|Fugitive|Unfolding|Unmoored|Uncharted|Unbound|Unseen|Unspoken|Elusive|Fleeting|Evanescent|Liminal|Latent|Nascent|Remote|Solitary|Serene|Still|Patient|Restless|Slumbering|Awakening|Remembered|Lost|Veiled|Unhurried|Driftless|Boundless|Fathomless|Timeless|Ageless|Formless|Nameless|Untethered|Unbroken|Unending|Unfurling|Enigmatic|Numinous|Ineffable|Ethereal|Intangible|Reticent|Quiet|Tranquil|Transient|Vanishing'.split('|');
const NAME_LIGHT='electric|violet|golden|silver|scarlet|cobalt|lunar|solar|prismatic|radiant|glacial|opaline|iridescent|crystalline|ultraviolet|celestial|astral|sidereal|spectral|luminous|auroral|polar|infrared|pearlescent|nacreous|pale|diffuse|refracted|diffracted|nebulous|interstellar|penumbral|amethyst|argent|coronal|phosphorescent|translucent|holographic|starlit|moonlit'.split('|');
export function recipeName(recipe){
  const r=rng(recipe.seed^0x91ba735d);
  // Warm up the naming RNG so nearby seeds also vary their title structure.
  for(let i=0;i<4;i++)r();
  const form=()=>pick(r,NAME_FORMS),material=()=>pick(r,NAME_MATERIALS);
  const patterns=[
    ()=>{const texture=pick(r,NAME_TEXTURES),substance=pick(r,NAME_MATERIALS.filter(x=>x!==texture.toLowerCase()));return `${texture} ${substance} ${form()}`;},
    ()=>`${pick(r,NAME_MOODS)} ${form()} of ${material()}`,
    ()=>{const first=material(),second=pick(r,NAME_MATERIALS.filter(x=>x!==first));return `${pick(r,NAME_MOODS)} ${first} and ${second}`;},
    ()=>`${pick(r,NAME_MOODS)} ${pick(r,NAME_LIGHT)} ${form()}`,
  ];
  // Usually three evocative words; connectors are extra. Occasionally stay brief.
  const name=r()<.15?`${pick(r,NAME_TEXTURES)} ${form()}`:pick(r,patterns)();
  return name[0].toUpperCase()+name.slice(1);
}
function transform(r,wildness){
  const a=r()*Math.PI*2, sx=.25+r()*.78,sy=sx*(.5+r()*.8),shear=(r()-.5)*.35;
  // Parameterized effects use the primary slot; the second slot remains legacy.
  const first=Math.floor(r()*VARIATIONS.length);
  const weight=r()<.6?1:.5+r()*.5;
  const variations=[{id:first,weight,...(first>=25?{params:randomParams(first,r)}:{})}];
  if(r()<[.12,.35,.65][LEVELS.indexOf(wildness)]){
    const second=first<25?(first+1+Math.floor(r()*24))%25:Math.floor(r()*25);
    const share=.12+r()*.3;variations[0].weight=1-share;variations.push({id:second,weight:share});
  }
  return {affine:[Math.cos(a)*sx,-Math.sin(a)*sy+shear,Math.sin(a)*sx,Math.cos(a)*sy,(r()-.5)*1.5,(r()-.5)*1.5],variations,probability:.05+r()**2,color:r(),speed:.25+r()*.5};
}
function finish(recipe){
  const sum=recipe.transforms.reduce((s,t)=>s+t.probability,0);
  recipe.transforms.forEach(t=>{
    t.probability=rounded(t.probability/sum);t.affine=t.affine.map(rounded);t.color=rounded(t.color);t.speed=rounded(t.speed);
    t.variations.forEach(v=>v.weight=rounded(v.weight));
    // Roundoff must not make the remaining linear contribution negative.
    if(t.variations.length===2)t.variations[1].weight=Math.min(t.variations[1].weight,rounded(1-t.variations[0].weight));
  });
  return recipe;
}
function arrange(transforms,form,r){
 const turn=r()*Math.PI*2;
 transforms.forEach((t,i)=>{
  const f=i/Math.max(1,transforms.length-1),angle=turn+i*Math.PI*2/transforms.length;
  let x=t.affine[4],y=t.affine[5],scale=1;
  if(form==='Ring'){x=.85*Math.cos(angle);y=.85*Math.sin(angle);scale=.8;}
  if(form==='Branches'){x=(i%2?1:-1)*(.25+.55*f);y=-.65+1.3*f;scale=.7;}
  if(form==='Chain'){x=-1+2*f;y=.25*Math.sin(f*Math.PI*2+turn);scale=.65;}
  if(form==='Clusters'){x=(i%2?-.65:.65)+(r()-.5)*.4;y=(r()-.5)*.65;scale=.7;}
  if(form==='Nested'){x=.35*f*Math.cos(angle);y=.35*f*Math.sin(angle);scale=.45+.5*f;}
  t.affine=t.affine.map((v,j)=>j<4?v*scale:j===4?x:y);
 });
}
// Independent stream assigns 40% of seeds to composed families.
function composedRecipe(seed,wildness){
 const r=rng((seed^0x6d2b79f5)>>>0);
 for(let i=0;i<4;i++)r();
 if(r()>=.4)return null;
 const families={...RECIPE_FAMILIES,...WEB_RECIPE_FAMILIES};
 const form=pick(r,Object.keys(families)),turn=r()*Math.PI*2;
 const spread=.85+r()*.3,jitter={gentle:.025,adventurous:.06,wild:.1}[wildness];
 const transforms=families[form].map((row,i,rows)=>{
  const [sx,sy,angle,x,y,id,weight,probability,params]=row;
  const a=angle+(r()-.5)*jitter*2,scale=1+(r()-.5)*jitter;
  const tx=x*spread+(r()-.5)*jitter,ty=y*spread+(r()-.5)*jitter;
  const c=Math.cos(turn),s=Math.sin(turn),ca=Math.cos(a),sa=Math.sin(a);
  return {affine:[(c*ca-s*sa)*sx*scale,(-c*sa-s*ca)*sy*scale,(s*ca+c*sa)*sx*scale,(-s*sa+c*ca)*sy*scale,c*tx-s*ty,s*tx+c*ty],variations:[{id,weight,...(params?{params:randomParams(id,r)}:{})}],probability:probability*(.85+r()*.3),color:i/(rows.length-1),speed:.5};
 });
 return finish({version:2,seed:seed>>>0,parentSeed:null,depth:0,wildness,form,symmetry:1,palette:Math.floor(r()*4),transforms});
}
export function randomRecipe(seed,wildness='adventurous'){
  if(!LEVELS.includes(wildness))throw Error('Unknown wildness');
  const composed=composedRecipe(seed,wildness);if(composed)return composed;
  const r=rng(seed), max={gentle:4,adventurous:6,wild:8}[wildness];
  const n=2+Math.floor(r()*(max-1));
  const transforms=Array.from({length:n},()=>transform(r,wildness));
  const form=pick(r,FORMS.slice(0,6));arrange(transforms,form,r);
  // At least one non-expanding linear branch helps trajectories return to a bounded region.
  if(transforms.every(t=>t.variations[0].id===2))transforms[0].variations=[{id:0,weight:1}];
  return finish({version:2,seed:seed>>>0,parentSeed:null,depth:0,wildness,form,symmetry:pick(r,[1,1,1,2,3,4,5,6,8]),palette:Math.floor(r()*4),transforms});
}
export function mutateRecipe(parent,seed,wildness='gentle',amount=1){
  if(!validRecipe(parent)||!LEVELS.includes(wildness))throw Error('Invalid parent recipe');
  const r=rng(seed),child=structuredClone(parent), intensity={gentle:.055,adventurous:.19,wild:.45}[wildness]*clamp(amount,0,8);
  child.seed=seed>>>0;child.parentSeed=parent.seed;child.depth=parent.depth+1;child.wildness=wildness;
  for(const t of child.transforms){
    const a=(r()-.5)*intensity*3,c=Math.cos(a),s=Math.sin(a),[x0,x1,y0,y1]=t.affine;
    const scale=Math.exp((r()-.5)*intensity);
    t.affine=[(c*x0-s*y0)*scale,(c*x1-s*y1)*scale,(s*x0+c*y0)*scale,(s*x1+c*y1)*scale,t.affine[4]+(r()-.5)*intensity,t.affine[5]+(r()-.5)*intensity].map(x=>clamp(x,-2,2));
    t.probability=clamp(t.probability*Math.exp((r()-.5)*intensity*4),.002,2);
    t.color=clamp(t.color+(r()-.5)*intensity,0,1);t.speed=clamp(t.speed+(r()-.5)*intensity,.1,.9);
    if(wildness!=='gentle'&&r()<intensity){t.variations=transform(r,wildness).variations;}
  }
  if(wildness!=='gentle'&&amount>0){
    if(r()<.45&&child.transforms.length<8)child.transforms.push(transform(r,wildness));
    if(r()<.3&&child.transforms.length>2)child.transforms.splice(Math.floor(r()*child.transforms.length),1);
    if(r()<intensity)child.symmetry=pick(r,[1,1,2,3,4,5,6,8]);
    if(r()<intensity*.5)child.palette=Math.floor(r()*4);
  }
  return finish(child);
}
// The two spare ABI floats belong to the primary variation; legacy slots stay zero.
export function variationParams(v){return v.params??(v.id===25||v.id===26?[3,1]:v.id>=27&&v.id<=29?[.5,0]:[0,0]);}
export function parameterBounds(id,j){
 if(id===25||id===26)return j===0?[-8,8]:[.25,2];
 if(id===28||id===29)return j===0?[.05,1.5]:id===28?[0,0]:[-2,2];
 return id===30&&j===1?[0,0]:[-2,2];
}
function randomParams(id,r){
 if(id===25||id===26)return [pick(r,[-8,-7,-6,-5,-4,-3,-2,2,3,4,5,6,7,8]),.5+r()];
 if(id===27)return [(r()-.5)*2.4,(r()-.5)*1.2];
 if(id===28)return [.15+r()*.85,0];
 if(id===29)return [.2+r()*.9,(r()-.5)*2];
 return [(r()-.5)*2,0];
}
function validVariationParams(v,index){
 if(v.id<25)return v.params===undefined;
 if(index!==0||(v.params!==undefined&&!Array.isArray(v.params)))return false;
 const p=variationParams(v);
 if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))return false;
 if((v.id===25||v.id===26)&&(!Number.isInteger(p[0])||Math.abs(p[0])<2||Math.abs(p[0])>8))return false;
 return p.every((x,j)=>{const [lo,hi]=parameterBounds(v.id,j);return x>=lo&&x<=hi;});
}
export function validRecipe(g){
  if(g?.form!==undefined&&!FORMS.includes(g.form))return false;
  if(g?.customColors!==undefined&&!validColors(g.customColors))return false;
  const finite=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
  return !!(g&&g.version===2&&Number.isInteger(g.seed)&&g.seed>0&&g.seed<=0xffffffff&&
    (g.parentSeed===null||(Number.isInteger(g.parentSeed)&&g.parentSeed>0&&g.parentSeed<=0xffffffff))&&Number.isInteger(g.depth)&&g.depth>=0&&g.depth<=100000&&
    LEVELS.includes(g.wildness)&&[1,2,3,4,5,6,8].includes(g.symmetry)&&Number.isInteger(g.palette)&&g.palette>=0&&g.palette<4&&
    Array.isArray(g.transforms)&&g.transforms.length>=2&&g.transforms.length<=8&&g.transforms.every(t=>
      Array.isArray(t.affine)&&t.affine.length===6&&t.affine.every(x=>finite(x,-2,2))&&finite(t.probability,.000001,2)&&finite(t.color,0,1)&&finite(t.speed,.1,.9)&&
      Array.isArray(t.variations)&&t.variations.length>=1&&t.variations.length<=2&&t.variations.every((v,i)=>Number.isInteger(v.id)&&v.id>=0&&v.id<VARIATIONS.length&&finite(v.weight,0,1)&&validVariationParams(v,i))&&t.variations.reduce((s,v)=>s+v.weight,0)<=1.000001));
}
export function applyRecipe(core,recipe,phase=0){
  setCoreColors(core,recipe.customColors);
  const data=new Float32Array(core.memory.buffer,core.transforms_ptr(),128);data.fill(0);
  const sum=recipe.transforms.reduce((s,t)=>s+t.probability,0);let cdf=0;
  recipe.transforms.forEach((t,i)=>{
    const k=i*16,a=Math.sin(phase)*.045*(i%2?1:-1),c=Math.cos(a),s=Math.sin(a),[x0,x1,y0,y1,tx,ty]=t.affine;
    const first=t.variations[0],second=t.variations[1];cdf+=t.probability/sum;
    data.set([c*x0-s*y0,c*x1-s*y1,s*x0+c*y0,s*x1+c*y1,tx,ty,first.id,first.weight,t.color,t.speed,second?.id||0,second?.weight||0,i===recipe.transforms.length-1?1:cdf,recipe.symmetry,...variationParams(first)],k);
  });core.configure(recipe.transforms.length);
}
export function fromLegacy(core,seed,family,mutation,palette){
  core.genome(seed,family,mutation,0);const data=new Float32Array(core.memory.buffer,core.transforms_ptr(),64);
  return {version:2,seed,parentSeed:null,depth:0,wildness:'gentle',palette,symmetry:1,transforms:Array.from({length:4},(_,i)=>{
    const t=data.slice(i*16,i*16+16);return {affine:Array.from(t.slice(0,6)),variations:[{id:t[6],weight:t[7]}],probability:.25,color:t[8],speed:.5};
  })};
}
export function describeRecipe(recipe){
  const variations=[...new Set(recipe.transforms.flatMap(t=>t.variations.map(v=>VARIATIONS[v.id])))];
  return `${recipe.form?recipe.form+' · ':''}${recipe.transforms.length} transforms · ${variations.join(' + ')}${recipe.symmetry>1?` · ${recipe.symmetry}-fold symmetry`:''}`;
}
export function histogramStats(h,w,hgt,attempts){
  let hits=0,occupied=0,peak=0;const signature=new Float32Array(64);
  for(let y=0;y<hgt;y++)for(let x=0;x<w;x++){
    const n=h[(y*w+x)*4+3];hits+=n;if(n>0)occupied++;peak=Math.max(peak,n);
    signature[Math.floor(y/hgt*8)*8+Math.floor(x/w*8)]+=n;
  }
  // Square roots retain shape in dim regions while reducing the dominance of hot spots.
  let sum=0;for(let i=0;i<64;i++){signature[i]=Math.sqrt(signature[i]);sum+=signature[i];}
  for(let i=0;i<64;i++)signature[i]/=sum||1;
  return {hitRate:hits/attempts,coverage:occupied/(w*hgt),peakShare:peak/(hits||1),signature};
}
export function acceptable(stats){return stats.hitRate>.08&&stats.coverage>.012&&stats.peakShare<.22;}
export function distance(a,b){return a.reduce((s,x,i)=>s+Math.abs(x-b[i]),0);}
