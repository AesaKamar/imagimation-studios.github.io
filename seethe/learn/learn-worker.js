import {applyRecipe,fromLegacy,mutateRecipe} from './genetics.js';
const core=(await WebAssembly.instantiate(await (await fetch('./flame_core.wasm')).arrayBuffer())).instance.exports;
const base=fromLegacy(core,24091,0,.8,0);
postMessage({ready:true,base,target:mutateRecipe(base,1801645634,'gentle',1)});
self.onmessage=({data})=>{
  const {id,recipe,size=320,chains=4096,zoom=.3,tone=true}=data;
  try {
    applyRecipe(core,recipe);
    const hits=core.sample(size,size,chains,24091,zoom,recipe.palette);
    const hist=new Float32Array(core.memory.buffer,core.histogram_ptr(),size*size*4);
    const rgba=new Uint8ClampedArray(hist.length),normal=chains*72/(size*size);
    // Same density normalization and photographic shoulder as share-render.js.
    for(let i=0;i<rgba.length;i+=4){
      const n=hist[i+3]/normal,light=Math.log1p(n*5)*.42*1.2/Math.max(n,.00001);
      for(let c=0;c<3;c++)rgba[i+c]=tone?Math.max(c===2?6:3,255*(1-Math.exp(-hist[i+c]/normal*light))**(1/2.2)):255*Math.min(1,hist[i+c]/normal);
      rgba[i+3]=255;
    }
    postMessage({id,rgba,size,hits},[rgba.buffer]);
  }catch(error){postMessage({id,error:error.message});}
};
