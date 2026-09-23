import {morphGenome} from './discovery-morph.js';
import {validRecipe} from './genetics.js';
import {validColors,HARMONIES} from './color.js';
import {Evolution} from './evolution.js';
export function validGenome(g) {
  if(g?.motionMode!==undefined&&!['evolve','breathe'].includes(g.motionMode))return false;
  if(g?.speed!==undefined&&(!Number.isFinite(g.speed)||g.speed<.25||g.speed>8))return false;
  if(g?.colors!==undefined&&!validColors(g.colors))return false;
  if(g?.colorSettings!==undefined){const c=g.colorSettings;if(!c||!Number.isFinite(c.hue)||c.hue<0||c.hue>359||!Number.isFinite(c.saturation)||c.saturation<0||c.saturation>100||!Number.isFinite(c.lightness)||c.lightness<25||c.lightness>70||!(c.scheme==='custom'||Object.hasOwn(HARMONIES,c.scheme)))return false;}
  if(g?.recipe!==undefined&&(!validRecipe(g.recipe)||g.recipe.seed!==g.seed))return false;
  return g && Number.isInteger(g.seed) && g.seed>0 && g.seed<=0xffffffff && Number.isInteger(g.family) && g.family>=0 && g.family<4 && Number.isInteger(g.palette) && g.palette>=0 && g.palette<4 && Number.isFinite(g.mutation) && g.mutation>=0 && g.mutation<=8 && Number.isFinite(g.zoom) && g.zoom>=.12 && g.zoom<=.65 && Number.isFinite(g.exposure) && g.exposure>=.3 && g.exposure<=3 && [1,2,3,4].includes(g.budget) && [.5,.75,1].includes(g.quality) && typeof g.history==='boolean' && typeof g.denoise==='boolean';
}

export function encodeSession(session){
 const bytes=new TextEncoder().encode(JSON.stringify({version:1,...session}));
 return '#session='+btoa(Array.from(bytes,x=>String.fromCharCode(x)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decodeSession(hash){
 const legacy=hash.startsWith('#genome=');
 if(!legacy&&!hash.startsWith('#session='))return null;
 if(hash.length>250000)throw Error('Session link too large');
 const payload=hash.slice(legacy?8:9);
 const value=JSON.parse(legacy?decodeURIComponent(payload):new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(payload.replaceAll('-','+').replaceAll('_','/')),x=>x.charCodeAt(0))));
 if(!validGenome(value.genome))throw Error('Invalid genome');
 if(legacy)return {genome:value.genome,phase:Number.isFinite(value.phase)?value.phase:0};
 if(value.version!==1||!Number.isFinite(value.phase)||value.phase<0||!Number.isInteger(value.generation)||value.generation<0||typeof value.moving!=='boolean'||typeof value.compare!=='boolean'||!['gentle','adventurous','wild'].includes(value.wildness))throw Error('Invalid session');
 const sound=value.sound;
 if(!sound||typeof sound.enabled!=='boolean'||![sound.volume,sound.texture].every(x=>Number.isFinite(x)&&x>=0&&x<=1))throw Error('Invalid sound settings');
 if(value.discoveryMorph){const m=value.discoveryMorph;if(value.evolution||!validGenome(m.from)||!validGenome(m.to)||!m.from.recipe||!m.to.recipe||!Number.isFinite(m.elapsed)||m.elapsed<0||m.elapsed>=6)throw Error('Invalid discovery transition');if(m.legacy!==undefined&&typeof m.legacy!=='boolean')throw Error('Invalid discovery transition version');
 const matches=legacy=>JSON.stringify(morphGenome(m.from,m.to,m.elapsed/6,legacy))===JSON.stringify(value.genome);
 if(!matches(m.legacy===true)){
  if(m.legacy===undefined&&matches(true))m.legacy=true;
  else throw Error('Mismatched discovery transition');
 }}
 if(value.evolution){const e=Evolution.restore(value.evolution);if(JSON.stringify(e.snapshot())!==JSON.stringify(value.genome.recipe))throw Error('Mismatched evolution');}
 return value;
}
