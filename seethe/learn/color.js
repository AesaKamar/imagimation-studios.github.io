export const PRESETS=[
 [[.08,.12,.65],[.55,.08,.8],[1,.15,.3],[1,.65,.23],[.5,.95,1]],
 [[.02,.15,.3],[0,.55,.55],[.15,.9,.65],[.7,1,.75],[1,.85,.35]],
 [[.18,.03,.1],[.65,.07,.1],[1,.32,.06],[1,.75,.25],[1,.95,.7]],
 [[.1,.1,.35],[.25,.35,.85],[.65,.45,1],[.95,.65,.8],[.8,.95,1]],
];
export const HARMONIES={analogous:{name:'Analogous',offsets:[-40,-20,0,20,40],note:'Neighboring hues. Soft transitions with a shared character.'},complementary:{name:'Complementary',offsets:[0,0,180,180,180],note:'Opposite hues. Warm and cool colors in conversation.'},split:{name:'Split complementary',offsets:[0,0,150,210,210],note:'A base hue and two colors beside its opposite.'},triadic:{name:'Triadic',offsets:[0,0,120,240,240],note:'Three evenly spaced hues. A lively, balanced contrast.'},mono:{name:'Monochromatic',offsets:[0,0,0,0,0],note:'One hue, five shades. Let the flame’s structure lead.'}};
export const validColors=c=>Array.isArray(c)&&c.length===5&&c.every(x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x));
export function hexRgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
export function rgbHex(rgb){return '#'+rgb.map(x=>Math.round(Math.max(0,Math.min(1,x))*255).toString(16).padStart(2,'0')).join('');}
export function hslRgb(h,s,l){h=((h%360)+360)%360/360;s/=100;l/=100;const a=s*Math.min(l,1-l);return [0,8,4].map(n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));});}
export function rgbHsl([r,g,b]){const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0;if(d)h=(max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4)*60;return [((h%360)+360)%360,d?d/(1-Math.abs(2*l-1))*100:0,l*100];}
export function harmonyColors(hue,saturation,lightness,scheme){const offsets=(HARMONIES[scheme]||HARMONIES.analogous).offsets;return offsets.map((o,i)=>rgbHex(hslRgb(hue+o,Math.max(0,saturation-[0,3,0,8,18][i]),Math.max(8,Math.min(92,lightness+[-25,-12,0,12,25][i])))));}
export function paletteData(preset,colors){const rgb=validColors(colors)?colors.map(hexRgb):PRESETS[preset];const packed=new Float32Array(20);rgb.forEach((c,i)=>packed.set([...c,0],i*4));return packed;}
export function setCoreColors(core,colors){if(validColors(colors)){new Float32Array(core.memory.buffer,core.palette_ptr(),20).set(paletteData(0,colors));core.custom_palette(1);}else core.custom_palette(0);}
