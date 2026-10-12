/* StringZ – search algorithms (no DOM code here) */
const fmt=x=>x<1?x.toFixed(3):x<100?x.toFixed(2):x.toFixed(0);

/* Algorithms */
function zSearch(p,t){const m=p.length,s=p+'\u0001'+t,n=s.length,z=new Int32Array(n),res=[];let l=0,r=0,cmp=0;
 for(let i=1;i<n;i++){let k=0;if(i<r)k=Math.min(r-i,z[i-l]);
  while(i+k<n){cmp++;if(s.charCodeAt(k)===s.charCodeAt(i+k))k++;else break}
  z[i]=k;if(i+k>r){l=i;r=i+k}if(k===m&&i>m)res.push(i-m-1)}
 return{res,cmp}}
function naive(p,t){const m=p.length,n=t.length,res=[];let cmp=0;
 for(let i=0;i<=n-m;i++){let j=0;while(j<m){cmp++;if(t.charCodeAt(i+j)!==p.charCodeAt(j))break;j++}if(j===m)res.push(i)}
 return{res,cmp}}
function time(fn,minMs=30){let runs=0,out;const t0=performance.now();
 do{out=fn();runs++}while(performance.now()-t0<minMs&&runs<100);
 return{ms:(performance.now()-t0)/runs,out}}
