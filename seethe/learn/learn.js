import {rng} from './genetics.js';
import {morphGenome} from './discovery-morph.js';
import {pairTransforms} from './morph-pairs.js';
import {encodeSession,decodeSession} from './session.js';
import {corners,halfway,triangles,anchoredOffset,adaptSamples,dissolve,Circuit} from './learn-models.js';

const $=s=>document.querySelector(s),copy=structuredClone;
const scenes=[],pending=new Map();let running=null,serial=0,base,target,endpoints=[];
const worker=new Worker('./learn-worker.js',{type:'module'});
function pump(){if(running||!pending.size)return;const [key,job]=pending.entries().next().value;pending.delete(key);running=job;worker.postMessage(job.data);}
function enqueue(key,data,done){pending.set(key,{key,data:{...data,id:++serial},done});pump();}
worker.onerror=()=>{$('#loading').hidden=false;$('#loading').textContent='The flame engine could not load. Reload this page to try again.';};
worker.onmessage=({data})=>{
  if(data.ready){base=data.base;target=data.target;for(const [i,recipe]of [base,target].entries())enqueue(`endpoint${i}`,{recipe},result=>{endpoints[i]=result;if(endpoints.filter(Boolean).length===2)start();});return;}
  const job=running;running=null;
  if(data.error){$('#loading').hidden=false;$('#loading').textContent=`Flame rendering stopped: ${data.error}`;}
  else job?.done(data);
  pump();
};
function genome(recipe){return {recipe,seed:recipe.seed,family:0,palette:recipe.palette,mutation:8,speed:8,motionMode:'evolve',zoom:.3,exposure:1.2,budget:4,quality:.75,history:true,denoise:true};}
function morph(t){return morphGenome(genome(base),genome(target),t).recipe;}
function picture(c,result){c.width=c.height=result.size;c.getContext('2d').putImageData(new ImageData(result.rgba,result.size,result.size),0,0);}
function flame(s,c,recipe,options={}){
  if(!s.visible)return;
  const revision=(c.revision||0)+1;c.revision=revision;
  const {onHits,...renderOptions}=options;
  enqueue(c,{recipe,...renderOptions},result=>{if(c.revision!==revision)return;picture(c,result);if(onHits)onHits(result.hits);});
}
function scene(n,title,description,takeaway){
  const el=document.createElement('section');el.id=`scene-${n}`;
  el.innerHTML=`<p class="kicker">EXPERIMENT ${String(n).padStart(2,'0')}</p><h2>${title}</h2><p class="description">${description}</p><div class="stage"></div><div class="controls"></div><p class="readout" role="status"></p><p class="takeaway">${takeaway}</p>`;
  $('#experiments').append(el);const s={el,controls:el.querySelector('.controls'),stage:el.querySelector('.stage'),status:el.querySelector('.readout'),visible:false,playing:false,draw:()=>{},tick:null};scenes.push(s);return s;
}
function canvas(s,label,wide=false){const f=document.createElement('figure');f.className='panel';const caption=document.createElement('figcaption');caption.textContent=label;const c=document.createElement('canvas');c.width=640;c.height=wide?320:640;if(wide)c.className='wide';c.setAttribute('role','img');c.setAttribute('aria-label',label);f.append(caption,c);s.stage.append(f);return c;}
function button(s,text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;s.controls.append(b);return b;}
function slider(s,label,min,max,value,step,fn){const l=document.createElement('label'),i=document.createElement('input'),o=document.createElement('output');i.type='range';Object.assign(i,{min,max,step,value});l.append(document.createTextNode(label),i,o);s.controls.append(l);const update=()=>{o.value=Number(i.value).toFixed(step<1?2:0);fn(+i.value);};i.addEventListener('input',update);o.value=value;return i;}
function toggle(s,label,fn){const b=button(s,label,()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));fn(on);});b.setAttribute('aria-pressed','false');return b;}
function play(s,tick){s.tick=tick;s.playButton=button(s,'Play',()=>{s.playing=!s.playing;s.playButton.textContent=s.playing?'Pause':'Play';s.playButton.setAttribute('aria-pressed',String(s.playing));});s.playButton.setAttribute('aria-pressed','false');}
function clear(c){const x=c.getContext('2d');x.fillStyle='#05060a';x.fillRect(0,0,c.width,c.height);return x;}
function dot(x,p,color='#c3b5ff',radius=3){x.fillStyle=color;x.beginPath();x.arc(p[0],p[1],radius,0,Math.PI*2);x.fill();}
function line(x,a,b,color='#776691',width=1){x.strokeStyle=color;x.lineWidth=width;x.beginPath();x.moveTo(...a);x.lineTo(...b);x.stroke();}
function text(x,label,p,color='#d8d4e5'){x.fillStyle=color;x.font='17px system-ui';x.fillText(label,...p);}

function start(){
  $('#loading').hidden=true;
  // 1. A deterministic point walk. Changing the start leaves the choices fixed.
  {
    const s=scene(1,'A shape without an outline','Choose a corner. Move halfway toward it. Repeat. There is no instruction here to draw a triangle—or to leave a hole.','A few local rules can produce a whole shape. The gaps are a consequence of where the rules can take you.');
    const c=canvas(s,'The halfway game');let points=[],p=[.5,.5],random=rng(42),last=null,origin=0;
    function add(n){for(let i=0;i<n;i++){const k=Math.floor(random()*3);last=[p,corners[k],k];p=halfway(p,corners[k]);points.push(p);}if(points.length>30000)points=points.slice(-30000);s.draw();}
    s.draw=()=>{const x=clear(c),scale=p=>p.map(v=>v*640);for(const q of points)dot(x,scale(q),'#b9a0e0',.85);corners.forEach((q,i)=>{dot(x,scale(q),'#f0c790',7);text(x,['A','B','C'][i],[q[0]*640+12,q[1]*640]);});if(last)line(x,scale(last[0]),scale(last[1]),'#8e7657',2);dot(x,scale(p),'#fff',5);s.status.textContent=`${points.length.toLocaleString()} visits shown${last?` · Last choice: corner ${'ABC'[last[2]]}`:''}. Each new dot becomes the next starting point.`;};
    button(s,'One step',()=>add(1));play(s,()=>add(40));button(s,'+100 visits',()=>add(100));button(s,'+10,000 visits',()=>add(10000));button(s,'New start / reset',()=>{origin++;p=origin%2?[.15,.2]:[.5,.5];random=rng(42);points=[];last=null;s.draw();});s.draw();
  }
  {
    const s=scene(2,'Where can a point possibly go?','Shrink the entire triangle halfway toward each corner. Those three smaller triangles contain every possible next position. Do it again.','The empty middle never gets visited because no rule leads there. Repeat the argument and smaller holes appear inside the survivors.');
    const c=canvas(s,'Successive reachable regions');let depth=0,overlay=false;
    s.draw=()=>{const x=clear(c);for(const t of triangles(depth)){x.beginPath();t.forEach((p,i)=>i?x.lineTo(p[0]*640,p[1]*640):x.moveTo(p[0]*640,p[1]*640));x.closePath();x.fillStyle='#75589b';x.fill();}if(overlay){let p=[.5,.5],r=rng(42);for(let i=0;i<12000;i++){p=halfway(p,corners[Math.floor(r()*3)]);if(i>20)dot(x,p.map(v=>v*640),'#f4d5a3',.7);}}s.status.textContent=`Generation ${depth}: ${3**depth} reachable triangles. ${overlay?'The dot walk lands inside the surviving regions.':''}`;};
    slider(s,'Generation',0,6,0,1,v=>{depth=v;s.draw();});toggle(s,'Overlay visits',on=>{overlay=on;s.draw();});s.draw();
  }
  {
    const s=scene(3,'Bend the rule, bend the world','Straight rules make straight-edged patterns. A swirl bends space before the next step. Turn it up and watch the grid—and the repeated visits—change together.','A flame is the long-term result of moving through distorted space. A tiny rule can leave a huge signature.');
    const grid=canvas(s,'One pass through a swirl'),c=canvas(s,'Repeated through the flame engine');let amount=0;
    s.draw=()=>{const x=clear(grid),warp=(a,b)=>{const r=a*a+b*b;return [(a*(1-amount)+(a*Math.sin(r)-b*Math.cos(r))*amount)*140+320,(b*(1-amount)+(a*Math.cos(r)+b*Math.sin(r))*amount)*140+320];};for(let row=-2;row<=2.001;row+=.25){for(const flip of [false,true]){let prev;for(let k=-2;k<=2.001;k+=.025){const p=flip?warp(row,k):warp(k,row);if(prev)line(x,prev,p,'#8876ac');prev=p;}}}const r=copy(base);r.transforms[0].variations=[{id:0,weight:1-amount},{id:3,weight:amount}];flame(s,c,r);s.status.textContent=`Swirl contribution: ${Math.round(amount*100)}%. Only the first rule’s distortion changes.`;};
    slider(s,'Swirl',0,1,0,.01,v=>{amount=v;s.draw();});s.draw();
  }
  {
    const s=scene(4,'The picture is evidence','A handful of visits gives you scattered clues. More visits reveal the fine structure. Change the pixel grid too: more pixels divide the same evidence into smaller piles.','Resolution is the number of little buckets. Detail also depends on how much evidence each bucket receives.');
    const c=canvas(s,'One fixed flame, increasingly well measured');let power=9,size=320,tone=true;
    s.draw=()=>{s.status.textContent='Collecting visits…';flame(s,c,base,{chains:2**power,size,tone,onHits:h=>{s.status.textContent=`${(2**power).toLocaleString()} chains · ${h.toLocaleString()} visits inside the viewport · ${size} × ${size} pixels. Brightness is normalized for the sampling budget.`;}});};
    slider(s,'Evidence level',6,15,9,1,v=>{power=v;s.draw();});slider(s,'Pixel grid',160,480,320,160,v=>{size=v;s.draw();});toggle(s,'Show raw brightness',on=>{tone=!on;s.draw();});button(s,'More evidence',()=>{power=Math.min(15,power+1);const i=s.controls.querySelector('input');i.value=power;i.dispatchEvent(new Event('input'));});
  }
  {
    const s=scene(5,'Color remembers the route','Every rule has a color address. Each visit moves your address halfway toward that rule’s address. The palette turns the address into light.','Two points can reach the same neighborhood by different routes—and carry different colors into it.');
    const c=canvas(s,'A point’s color history',true);let address=.5,history=[],palette=0;
    const palettes=[['#584193','#dd7595','#ffc983'],['#194f6a','#57c6b4','#e4edaa']];
    s.draw=()=>{const x=clear(c),g=x.createLinearGradient(40,0,600,0);palettes[palette].forEach((v,i)=>g.addColorStop(i/2,v));x.fillStyle=g;x.fillRect(40,115,560,70);line(x,[40+address*560,92],[40+address*560,205],'white',3);text(x,'A · address 0',[40,70]);text(x,'B · address 1',[460,70]);text(x,history.slice(-14).join(' → ')||'Choose a rule below',[40,250]);s.status.textContent=`Current color address: ${address.toFixed(4)}. The next rule changes the address; swapping the palette changes its appearance.`;};
    const choose=k=>{address=(address+k)/2;history.push(k?'B':'A');s.draw();};button(s,'Rule A',()=>choose(0));button(s,'Rule B',()=>choose(1));let r=rng(5);play(s,()=>choose(r()>.5?1:0));button(s,'Swap palette',()=>{palette=1-palette;s.draw();});button(s,'Reset',()=>{address=.5;history=[];r=rng(5);s.draw();});s.draw();
  }
  {
    const s=scene(6,'One small change, everywhere','Move one rule sideways. Every later visit inherits the consequences. The camera, palette, and sampling choices stay fixed.','Motion can come from changing the recipe itself. The whole structure responds, rather than sliding across the screen.');
    const c=canvas(s,'A single changing coefficient');let value=0,direction=1;s.cadence=33;
    s.draw=()=>{const recipe=copy(base);recipe.transforms[0].affine[4]+=value;flame(s,c,recipe);s.status.textContent=`Rule A’s horizontal shift: ${value.toFixed(2)}. The other rules stay fixed.`;};
    const input=slider(s,'Shift',-.45,.45,0,.005,v=>{value=v;s.draw();});play(s,()=>{value+=direction*.005;if(Math.abs(value)>.45){value=Math.sign(value)*.45;direction*=-1;}input.value=value;input.dispatchEvent(new Event('input'));});button(s,'Reset',()=>{input.value=0;input.dispatchEvent(new Event('input'));});
  }
  {
    const s=scene(7,'Which rule should become which?','Two recipes can contain exactly the same rules in a different order. Matching by position makes them take a detour. Matching by resemblance keeps the shape together.','Smooth change begins with a good correspondence: decide what belongs with what before moving anything.');
    const links=canvas(s,'Rule correspondence',true),c=canvas(s,'The intermediate recipe');let t=.5,matched=false;
    const a=copy(base),b=copy(base);b.transforms.reverse();
    s.draw=()=>{const x=clear(links),pairs=matched?pairTransforms(a.transforms,b.transforms):a.transforms.map((_,i)=>[i,i]);pairs.forEach(([i,j])=>{const y=65+i*60,z=65+j*60;line(x,[135,y],[500,z],['#bb9ee3','#efad8c','#87d6c0','#80a8e5'][i],3);text(x,`Rule ${'ABCD'[i]}`,[35,y+6]);text(x,`Rule ${'DCBA'[j]}`,[520,z+6]);});const recipe=copy(a);recipe.transforms=pairs.map(([i,j])=>{const p=a.transforms[i],q=b.transforms[j];return {...copy(p),affine:p.affine.map((v,k)=>v+(q.affine[k]-v)*t),color:p.color+(q.color-p.color)*t,variations:t<.5?copy(p.variations):copy(q.variations)};});flame(s,c,recipe);s.status.textContent=matched?'Matching finds the original rules. Every intermediate recipe stays the same.':'Position matching makes different rules collide. At the midpoint even their distortions switch identities.';};
    slider(s,'Journey',0,1,.5,.01,v=>{t=v;s.draw();});toggle(s,'Match by resemblance',on=>{matched=on;s.draw();});
  }
  {
    const s=scene(8,'Changing a flame or fading a picture?','Both panels have the same starting and ending flames. On the left, the rules change. On the right, two finished pictures fade over each other. Stop halfway.','A morph creates an intermediate structure. A dissolve mixes two structures that already exist.');
    const a=canvas(s,'Morph · rules change'),b=canvas(s,'Dissolve · pictures overlap');let t=.5,dir=1;s.cadence=33;
    s.draw=()=>{flame(s,a,morph(t));picture(b,{size:320,rgba:dissolve(endpoints[0].rgba,endpoints[1].rgba,t)});s.status.textContent=`${Math.round(t*100)}% of the journey. The dissolve blends light from the two endpoint images.`;};
    const input=slider(s,'Journey',0,1,.5,.005,v=>{t=v;s.draw();});play(s,()=>{t+=dir*.005;if(t>=1||t<=0){t=Math.max(0,Math.min(1,t));dir*=-1;}input.value=t;input.dispatchEvent(new Event('input'));});button(s,'Stop halfway',()=>{s.playing=false;s.playButton.textContent='Play';s.playButton.setAttribute('aria-pressed','false');input.value=.5;input.dispatchEvent(new Event('input'));});s.draw();
  }
  {
    const s=scene(9,'Keep the thing under your finger','Pick an off-center point, then zoom. A center-based zoom lets it drift away. An anchored zoom moves the view enough to keep your chosen point in place.','Natural zooming is two actions together: change the scale, then correct the position.');
    const c=canvas(s,'Zoom anchor experiment');let scale=1,anchor=[140,-110],anchored=false;
    s.draw=()=>{const x=clear(c),offset=anchored?anchoredOffset(anchor,scale):[0,0],project=p=>p.map((v,i)=>320+v*scale+offset[i]);for(let k=-600;k<=600;k+=50){line(x,project([k,-600]),project([k,600]),'#252433');line(x,project([-600,k]),project([600,k]),'#252433');}dot(x,project(anchor),'#c5a6fc',12);const screen=anchor.map(v=>v+320);line(x,[screen[0]-22,screen[1]],[screen[0]+22,screen[1]],'#ffd08b',2);line(x,[screen[0],screen[1]-22],[screen[0],screen[1]+22],'#ffd08b',2);s.status.textContent=anchored?'The purple point stays under the gold crosshair at every scale.':'The crosshair stays still. The point drifts as the picture grows around its center.';};
    slider(s,'Zoom',1,3,1,.01,v=>{scale=v;s.draw();});slider(s,'Anchor left / right',-220,220,140,1,v=>{anchor[0]=v;s.draw();});slider(s,'Anchor up / down',-220,220,-110,1,v=>{anchor[1]=v;s.draw();});toggle(s,'Anchor the zoom',on=>{anchored=on;s.draw();});c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect(),inputs=s.controls.querySelectorAll('input');anchor=[(e.clientX-r.left)/r.width*640-320,(e.clientY-r.top)/r.height*640-320].map(v=>Math.round(Math.max(-220,Math.min(220,v))));anchor.forEach((v,j)=>{inputs[j+1].value=v;inputs[j+1].dispatchEvent(new Event('input'));});s.draw();});s.draw();
  }
  {
    const s=scene(10,'Spend the next sixteen milliseconds wisely','Some flames cost more to calculate. Give the renderer a harder scene and watch a fixed work budget miss its deadline. Then let it adjust how much work it attempts.','Smoothness depends on finishing in time. Reduce work quickly when overloaded; grow it carefully when there is room.');
    const c=canvas(s,'Illustrative timing model · not a device benchmark',true);let cost=1,samples=2000,adaptive=false,frame=0;
    s.draw=()=>{const x=clear(c),ms=samples/200*cost;x.fillStyle=ms>16.7?'#d58994':'#a995ce';x.fillRect(40,120,Math.min(560,ms/40*560),60);const deadline=40+16.7/40*560;line(x,[deadline,75],[deadline,205],'#edca97',2);text(x,'16.7 ms deadline',[deadline-65,60]);text(x,`${ms.toFixed(1)} ms of work`,[40,235]);s.status.textContent=`Simulation · ${Math.round(samples).toLocaleString()} samples · ${ms>16.7?'over budget':'within budget'} · ${frame} frames advanced.`;};
    const advance=()=>{if(adaptive)samples=adaptSamples(samples,samples/200*cost);frame++;s.draw();};
    slider(s,'Scene cost',.5,4,1,.1,v=>{cost=v;s.draw();});toggle(s,'Adaptive budget',on=>{adaptive=on;s.draw();});button(s,'Next frame',advance);play(s,advance);button(s,'Reset budget',()=>{samples=2000;frame=0;s.draw();});s.draw();
  }
  {
    const s=scene(11,'Send the recipe, keep the flame','Change the sender’s flame, then send it across. This little exchange uses the same session encoder and decoder as Seethe. The recipient gets a recipe they can explore.','A picture keeps one view. A recipe keeps the machinery that can make the view again.');
    const a=canvas(s,'Sender · your current recipe'),b=canvas(s,'Recipient · last received recipe');let t=0,received=copy(base),zoom=.3;let hash='';
    const link=document.createElement('a');link.textContent='Open received flame in Seethe';link.target='_blank';link.rel='noopener';link.hidden=true;s.controls.append(link);
    s.draw=()=>{flame(s,a,morph(t));flame(s,b,received,{zoom});};slider(s,'Sender’s journey',0,1,0,.01,v=>{t=v;s.draw();});button(s,'Send recipe locally',()=>{hash=encodeSession({genome:genome(morph(t)),phase:0,generation:0,moving:false,compare:false,wildness:'gentle',sound:{enabled:false,volume:1,texture:.55}});received=decodeSession(hash).genome.recipe;link.href='https://flame-lab.aesa-kamar.workers.dev/'+hash;link.hidden=false;s.status.textContent=`Recipe encoded and received · ${new TextEncoder().encode(hash).length.toLocaleString()} bytes in this link. No server upload.`;s.draw();});slider(s,'Recipient zoom',.12,.65,.3,.01,v=>{zoom=v;s.draw();});s.status.textContent='The receiver stays on the last sent recipe while you change the sender.';
  }
  {
    const s=scene(12,'Build the road before you travel','The TV can dwell on a flame while it prepares the next path. Completed paths become roads it can revisit. When the collection fills, old unoccupied branches make room.','Preparation turns spare computing time into smooth future playback. A useful cache remembers paths as well as destinations.');
    const c=canvas(s,'Illustrative cache · eight-node limit for visibility');let model=new Circuit(),speed=5;
    s.draw=()=>{const x=clear(c),positions=new Map(model.nodes.map((id,i)=>[id,[320+230*Math.cos(i/model.nodes.length*2*Math.PI-Math.PI/2),300+230*Math.sin(i/model.nodes.length*2*Math.PI-Math.PI/2)]]));for(const [a,b]of model.edges){const p=positions.get(a),q=positions.get(b);line(x,p,q,'#57546d',2);const mid=p.map((v,i)=>v*.35+q[i]*.65),angle=Math.atan2(q[1]-p[1],q[0]-p[0]);line(x,mid,[mid[0]-12*Math.cos(angle-.5),mid[1]-12*Math.sin(angle-.5)],'#baa8d8',2);line(x,mid,[mid[0]-12*Math.cos(angle+.5),mid[1]-12*Math.sin(angle+.5)],'#baa8d8',2);}for(const [id,p]of positions){dot(x,p,id===model.current?'#f2cca0':id<2?'#b7a0e4':'#65a99c',19);text(x,String(id),[p[0]-6,p[1]+6],'#111019');}x.fillStyle='#34313e';x.fillRect(60,582,520,8);x.fillStyle='#b8a0df';x.fillRect(60,582,520*model.progress/100,8);s.status.textContent=`Simulation · ${model.nodes.length} saved flames · ${model.progress}% of next path prepared · ${model.evicted} evicted. Playing flame ${model.current}${model.edges.some(e=>e[0]===model.current)?'.':': dwelling until a path is ready.'}`;};
    const tick=()=>{model.tick(speed);s.draw();};button(s,'One mining step',tick);play(s,tick);slider(s,'Mining speed',1,20,5,1,v=>{speed=v;});button(s,'Reset cache',()=>{model=new Circuit();s.draw();});s.draw();
  }
  const observer=new IntersectionObserver(entries=>{for(const e of entries){const s=scenes.find(s=>s.el===e.target);s.visible=e.isIntersecting;if(s.visible)s.draw();else{for(const c of s.el.querySelectorAll('canvas')){pending.delete(c);c.revision=(c.revision||0)+1;}if(s.playing){s.playing=false;s.playButton.textContent='Play';s.playButton.setAttribute('aria-pressed','false');}}}},{rootMargin:'100px'});
  const embed=Number(new URLSearchParams(location.search).get('scene'));
  if(Number.isInteger(embed)&&embed>=1&&embed<=12){document.body.classList.add('embedded');for(const [i,s]of scenes.entries())if(i!==embed-1)s.el.hidden=true;}
  scenes.filter(s=>!s.el.hidden).forEach(s=>observer.observe(s.el));
  setInterval(()=>{if(document.hidden)return;const now=performance.now();for(const s of scenes)if(s.playing&&s.visible&&now-(s.lastTick||0)>=(s.cadence||180)){if([...s.stage.querySelectorAll('canvas')].some(c=>pending.has(c)||running?.key===c))continue;s.lastTick=now;s.tick();}},33);
}
