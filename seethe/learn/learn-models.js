// Small, deterministic models for the learning page. Rendering uses the app's core.
export const corners = [[.5,.08],[.08,.88],[.92,.88]];
export const halfway = (p,q) => p.map((v,i)=>(v+q[i])/2);
export function triangles(depth) {
  let result=[corners];
  for(let n=0;n<depth;n++) result=result.flatMap(t=>t.map(c=>t.map(p=>halfway(p,c))));
  return result;
}
export const anchoredOffset = (anchor,scale) => anchor.map(v=>v*(1-scale));
export function adaptSamples(samples,cost) {
  return Math.max(100,Math.min(4000,samples*(cost>16.7?Math.max(.5,16.7/cost):cost<13?1.04:1)));
}
export function dissolve(a,b,t) {
  const out=new Uint8ClampedArray(a.length);
  for(let i=0;i<a.length;i++)out[i]=i%4===3?255:255*((a[i]/255)**2.2*(1-t)+(b[i]/255)**2.2*t)**(1/2.2);
  return out;
}
export class Circuit {
  constructor(){this.nodes=[0,1];this.edges=[[0,1],[1,0]];this.branches=[];this.building=[];this.next=2;this.current=0;this.progress=0;this.evicted=0;this.walk=0;}
  tick(speed=1){
    this.progress=Math.min(100,this.progress+speed);
    if(this.progress>=100){
      if(this.nodes.length>=8){
        const victim=this.branches.find(b=>!b.includes(this.current));
        if(victim){this.nodes=this.nodes.filter(n=>!victim.includes(n));this.edges=this.edges.filter(e=>!e.some(n=>victim.includes(n)));this.branches=this.branches.filter(b=>b!==victim);this.evicted+=victim.length;}
      }
      if(this.nodes.length<8){
        const source=this.building.at(-1)??0,target=this.next++;
        this.nodes.push(target);this.edges.push([source,target]);this.building.push(target);this.progress=0;
        if(this.building.length===3){this.edges.push([target,0]);this.branches.push(this.building);this.building=[];}
      }
    }
    this.walk++;
    if(this.walk%20===0){const options=this.edges.filter(e=>e[0]===this.current);if(options.length)this.current=options.at(-1)[1];}
  }
}
