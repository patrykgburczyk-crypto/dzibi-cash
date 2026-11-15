const API="https://v3.football.api-sports.io";
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==="/api/health")return json({ok:true,configured:!!env.API_FOOTBALL_KEY});
  if(!env.API_FOOTBALL_KEY)return json({error:"Brak API_FOOTBALL_KEY"},503);
  if(url.pathname==="/api/fixtures"){
   const date=url.searchParams.get("date")||new Date().toISOString().slice(0,10);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return json({error:"Nieprawidłowa data"},400);
   const result=await api(`/fixtures?date=${date}&timezone=Europe%2FWarsaw`,env,ctx,900);
return json(result, result.ok ? 200 : 502);
  }
  if(url.pathname==="/api/analysis"){
   const id=url.searchParams.get("fixture");
   if(!/^\d+$/.test(id||""))return json({error:"Nieprawidłowy identyfikator meczu"},400);
   const [pred,odds]=await Promise.all([
    api(`/predictions?fixture=${id}`,env,ctx,1800),
    api(`/odds?fixture=${id}`,env,ctx,1800)
   ]);
   const pr=pred.ok?pred.data.response?.[0]?.predictions?.percent:null;
const probs=pr?[num(pr.home),num(pr.draw),num(pr.away)]:null;
const normalized=probs&&probs.every(x=>x!==null)&&probs.reduce((a,b)=>a+b,0)>0?probs.map(x=>x/probs.reduce((a,b)=>a+b,0)):null;
const all=odds.ok?(odds.data.response?.[0]?.bookmakers||[]):[];
let found=null;
for(const book of all){
 const market=book.bets?.find(b=>/match winner|1x2|winner/i.test(b.name));
 if(!market)continue;
 const vals=market.values||[];
 const get=patterns=>{const v=vals.find(x=>patterns.some(p=>p.test(x.value)));return v?Number(v.odd):null};
 const candidate=[get([/^home$/i,/^1$/]),get([/^draw$/i,/^x$/i,/^tie$/i]),get([/^away$/i,/^2$/i])];
 if(candidate.every(x=>x&&x>1)){found=candidate;break}
}
return json({probabilities:normalized,odds:found,bookmakers:all.length,remaining:odds.ok?odds.remaining:null});
  }
  return env.ASSETS.fetch(request);
 },
};
function num(x){const n=parseFloat(String(x??"").replace("%",""));return Number.isFinite(n)?n/100:null}
async function api(path,env,ctx,ttl){
 const key=new Request("https://cache.local/"+encodeURIComponent(path));
 const cache=caches.default;let hit=await cache.match(key);
 if(hit)return {ok:true,data:await hit.json(),remaining:hit.headers.get("x-dc-remaining")?Number(hit.headers.get("x-dc-remaining")):null};
 const r=await fetch(API+path,{headers:{"x-apisports-key":env.API_FOOTBALL_KEY}});
 const text=await r.text();if(!r.ok)return {ok:false};
 let data;try{data=JSON.parse(text)}catch(e){return {ok:false}}
 const remaining=Number(r.headers.get("x-ratelimit-requests-remaining")||0);
 const response=json(data,200,{"x-dc-remaining":String(remaining),"Cache-Control":`public, max-age=${ttl}`});
 ctx.waitUntil(cache.put(key,response.clone()));
 return {ok:true,data,remaining};
}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*",...headers}})}
