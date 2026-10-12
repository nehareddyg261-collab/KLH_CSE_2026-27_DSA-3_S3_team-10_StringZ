/* StringZ – user interface */
const $=id=>document.getElementById(id);
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
let FILE=null,LAST=null;

/* Tabs */
function show(n){[1,2].forEach(i=>{$('p'+i).hidden=i!==n;$('t'+i).setAttribute('aria-selected',i===n)});if(n===2&&LAST)drawLine()}
$('t1').onclick=()=>show(1);$('t2').onclick=()=>show(2);

/* File */
$('file').onchange=e=>{const f=e.target.files[0];FILE=null;if(!f)return;$('msg').textContent='Reading file…';
 const rd=new FileReader();rd.onload=()=>{FILE={name:f.name,text:rd.result};$('msg').textContent=`${f.name}: ${rd.result.length.toLocaleString()} characters loaded.`};
 rd.onerror=()=>{$('msg').textContent='Could not read this file. Choose a plain text file.'};rd.readAsText(f)};

/* Search */
$('run').onclick=async()=>{const w=$('word').value.trim();
 if(!FILE){$('msg').textContent='Choose a text file first.';return}
 if(!w){$('msg').textContent='Enter a word to search.';return}
 const mc=$('mc').checked,orig=FILE.text,t=mc?orig:orig.toLowerCase(),p=mc?w:w.toLowerCase();
 if(t.length!==orig.length){$('msg').textContent='This file has characters that change length when lowercased. Tick "Match case" to search it.';return}
 $('run').disabled=true;$('msg').textContent='Searching…';await new Promise(r=>setTimeout(r,30));
 const Z=time(()=>zSearch(p,t)),N=time(()=>naive(p,t));
 const rows=[];for(const f of [.2,.4,.6,.8,1]){const sub=t.slice(0,Math.floor(t.length*f)||1);
  rows.push({len:sub.length,z:time(()=>zSearch(p,sub),15).ms,n:time(()=>naive(p,sub),15).ms})}
 LAST={w,p,orig,Z,N,rows,same:Z.out.res.length===N.out.res.length&&Z.out.res.every((v,i)=>v===N.out.res[i])};
 renderSearch();renderCompare();$('run').disabled=false;$('msg').textContent=`${FILE.name}: ${orig.length.toLocaleString()} characters searched.`};

function lineIndex(text){const st=[0];for(let i=0;i<text.length;i++)if(text.charCodeAt(i)===10)st.push(i+1);return st}
function lineOf(st,pos){let a=0,b=st.length-1;while(a<b){const mid=(a+b+1)>>1;if(st[mid]<=pos)a=mid;else b=mid-1}return a}

function renderSearch(){const{w,orig,Z}=LAST,a=Z.out.res,m=LAST.p.length;
 if(!a.length){$('res').innerHTML=`<div class="card empty">“${esc(w)}” was not found in this file.</div>`;return}
 const st=lineIndex(orig),cap=Math.min(a.length,300);let rows='';
 for(let k=0;k<cap;k++){const pos=a[k],ln=lineOf(st,pos),col=pos-st[ln]+1;
  const s=Math.max(0,pos-35),e=Math.min(orig.length,pos+m+35);
  rows+=`<tr><td>${k+1}</td><td class="mono">${pos}</td><td>${ln+1}</td><td>${col}</td><td class="snip">${s>0?'…':''}${esc(orig.slice(s,pos).replace(/\n/g,' '))}<mark>${esc(orig.slice(pos,pos+m))}</mark>${esc(orig.slice(pos+m,e).replace(/\n/g,' '))}${e<orig.length?'…':''}</td></tr>`}
 $('res').innerHTML=`<div class="stat"><div class="sm"><b>${a.length.toLocaleString()}</b>matches found</div><div class="sz"><b>${fmt(Z.ms)} ms</b>Z search</div><div class="sn"><b>${fmt(LAST.N.ms)} ms</b>Normal search</div></div>
 <div class="card"><h3>Locations</h3><div class="scroll"><table><tr><th>#</th><th>Index</th><th>Line</th><th>Column</th><th>Context</th></tr>${rows}</table></div>
 ${a.length>cap?`<p class="note">Showing the first ${cap} of ${a.length.toLocaleString()} matches.</p>`:''}</div>`}

function renderCompare(){const{Z,N,same}=LAST,zw=Z.ms<=N.ms,cw=Z.out.cmp<=N.out.cmp;
 $('cmp').innerHTML=`<div class="card"><h2>Normal vs Z search</h2><table><tr><th></th><th>Z search</th><th>Normal search</th></tr>
 <tr><td>Time taken</td><td class="${zw?'win':''}">${fmt(Z.ms)} ms</td><td class="${zw?'':'win'}">${fmt(N.ms)} ms</td></tr>
 <tr><td>Character comparisons</td><td class="${cw?'win':''}">${Z.out.cmp.toLocaleString()}</td><td class="${cw?'':'win'}">${N.out.cmp.toLocaleString()}</td></tr>
 <tr><td>Matches found</td><td>${Z.out.res.length.toLocaleString()}</td><td>${N.out.res.length.toLocaleString()}</td></tr>
 <tr><td>First match at index</td><td>${Z.out.res.length?Z.out.res[0]:'–'}</td><td>${N.out.res.length?N.out.res[0]:'–'}</td></tr>
 <tr><td>Results identical</td><td colspan="2" class="${same?'win':''}">${same?'Yes, both found the same positions':'No, the results differ'}</td></tr></table>
 <p class="note">${zw?`Z search was ${(N.ms/Z.ms).toFixed(1)}× faster on this file.`:`Normal search was ${(Z.ms/N.ms).toFixed(1)}× faster on this file.`} Times are averaged over repeated runs.</p></div>
 <div class="card"><h3>Time by amount of text searched</h3><p class="note">Each point searches the first 20%, 40%, 60%, 80% and 100% of your file.</p><canvas id="chart" aria-label="Running time of both methods"></canvas>
 <div class="scroll"><table><tr><th>Characters searched</th><th>Z search</th><th>Normal search</th></tr>${LAST.rows.map(r=>`<tr><td>${r.len.toLocaleString()}</td><td>${fmt(r.z)} ms</td><td>${fmt(r.n)} ms</td></tr>`).join('')}</table></div></div>`;
 if(!$('p2').hidden)drawLine()}

function drawLine(){const cv=$('chart');if(!cv||!LAST)return;const rows=LAST.rows,dpr=devicePixelRatio||1,W=cv.clientWidth,H=300;
 cv.width=W*dpr;cv.height=H*dpr;const g=cv.getContext('2d');g.scale(dpr,dpr);g.clearRect(0,0,W,H);
 const L=62,R=16,T=26,B=34,mx=Math.max(...rows.map(r=>Math.max(r.z,r.n)))*1.1||1,xm=rows[rows.length-1].len;
 const X=v=>L+(W-L-R)*v/xm,Y=v=>T+(H-T-B)*(1-v/mx);
 g.font='12px IBM Plex Mono, monospace';g.fillStyle='#5F7285';g.strokeStyle='#E3EEF2';g.lineWidth=1;
 for(let i=0;i<=4;i++){const v=mx*i/4,y=Y(v);g.beginPath();g.moveTo(L,y);g.lineTo(W-R,y);g.stroke();g.textAlign='right';g.fillText(fmt(v)+' ms',L-6,y+4)}
 g.textAlign='center';rows.forEach(r=>g.fillText(r.len>=1e6?(r.len/1e6).toFixed(1)+'M':Math.round(r.len/1000)+'k',X(r.len),H-12));
 [['n','#E9822B'],['z','#0F9BA8']].forEach(([k,c])=>{g.strokeStyle=c;g.fillStyle=c;g.lineWidth=3;g.beginPath();
  rows.forEach((r,i)=>i?g.lineTo(X(r.len),Y(r[k])):g.moveTo(X(r.len),Y(r[k])));g.stroke();rows.forEach(r=>{g.beginPath();g.arc(X(r.len),Y(r[k]),4,0,7);g.fill()})});
 g.textAlign='left';g.fillStyle='#E9822B';g.fillText('Normal search',L+8,14);g.fillStyle='#0F9BA8';g.fillText('Z search',L+130,14)}
addEventListener('resize',()=>{if(!$('p2').hidden)drawLine()});
$('word').addEventListener('keydown',e=>{if(e.key==='Enter')$('run').click()});
