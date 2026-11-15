const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
let matches=[], liveMode=false, remaining=null;
const demo=[
 {id:"d1",league:"Premier League · DEMO",home:"Arsenal",away:"Chelsea",time:"18:30",odds:[1.95,3.55,3.9],p:[.55,.24,.21]},
 {id:"d2",league:"LaLiga · DEMO",home:"Real Madrid",away:"Valencia",time:"20:00",odds:[1.48,4.3,6.2],p:[.69,.19,.12]},
 {id:"d3",league:"Serie A · DEMO",home:"Inter",away:"Roma",time:"20:45",odds:[1.82,3.6,4.5],p:[.52,.26,.22]},
 {id:"d4",league:"Bundesliga · DEMO",home:"Dortmund",away:"Mainz",time:"17:30",odds:[1.7,3.9,4.8],p:[.61,.22,.17]}
];
function fmt(n){return Number(n).toFixed(2).replace(".",",")}
function calc(m){
 const imp=m.odds.map(x=>x?1/x:0),sum=imp.reduce((a,b)=>a+b,0);
 return m.p.map((p,i)=>({p,implied:sum?imp[i]/sum:0,edge:p-(sum?imp[i]/sum:0),ev:p*m.odds[i]-1,odd:m.odds[i]}));
}
function card(m){
 const c=calc(m), names=["1","X","2"],best=c.map((x,i)=>({...x,i})).sort((a,b)=>b.edge-a.edge)[0];
 const isValue=best.edge>=.05 && best.ev>0;
 return `<article class="match"><div class="league">${esc(m.league||"Piłka nożna")}</div><div class="teams"><div class="team">${esc(m.home)}</div><div class="vs">VS</div><div class="team">${esc(m.away)}</div></div><div class="kick">${esc(m.time||"Godzina nieznana")}</div><div class="odds">${c.map((x,i)=>`<div class="odd"><small>${names[i]}</small><b>${m.odds[i]?fmt(m.odds[i]):"—"}</b></div>`).join("")}</div><div class="metric"><span>Największa przewaga: <b>${names[best.i]}</b> · ${(best.edge*100).toFixed(1).replace(".",",")} pp</span><span class="tag ${isValue?"":"bad"}">${isValue?"VALUE BET":"POMIŃ"}</span></div><div class="metric"><span>EV: ${(best.ev*100).toFixed(1).replace(".",",")}%</span><button class="ghost" style="padding:6px 9px;font-size:10px" onclick="savePick('${m.id}','${names[best.i]}','${m.home.replace(/'/g,"")} – ${m.away.replace(/'/g,"")}')">Zapisz typ</button></div></article>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){
 $("#matches").innerHTML=matches.length?matches.map(card).join(""):`<div class="empty">Nie znaleziono meczów do analizy.<br>Spróbuj odświeżyć dane później.</div>`;
 const count=matches.reduce((n,m)=>n+calc(m).some(x=>x.edge>=.05&&x.ev>0),0);
 $("#matchCount").textContent=matches.length;$("#valueCount").textContent=count;
 $("#statusDot").style.background=liveMode?"var(--green)":"#e8b34b";
 $("#statusText").textContent=liveMode?"Dane API aktywne":"Tryb demonstracyjny";
}
async function load(){
 $("#refresh").disabled=true;$("#refresh").textContent="Ładowanie…";
 try{
  const r=await fetch(`/api/fixtures?date=${today()}`);
  if(!r.ok)throw new Error(r.status===503?"Brak klucza API na serwerze":"Błąd pobierania terminarza");
  const data=await r.json();remaining=data.remaining??null;
  const fixtures=(data.data?.response||[]).filter(x=>x.fixture?.status?.short==="NS").slice(0,20);
  const out=[];
  for(const f of fixtures.slice(0,2)){
   try{
    const a=await fetch(`/api/analysis?fixture=${f.fixture.id}`);
    let x={};if(a.ok)x=await a.json();
    out.push({id:String(f.fixture.id),league:f.league?.name,home:f.teams?.home?.name,away:f.teams?.away?.name,time:new Date(f.fixture.date).toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}),odds:x.odds||[null,null,null],p:x.probabilities||[null,null,null]
   }catch(e){}
  }
  matches=out;liveMode=true;$("#notice").textContent="Dane pobrane z API-Football. Analiza wykorzystuje dostępne prognozy i kursy 1X2. Brak danych nie jest zastępowany zgadywaniem.";
  $("#apiCount").textContent=remaining===null?"—":remaining;
  $("#updated").textContent="Aktualizacja: "+new Date().toLocaleTimeString("pl-PL");
  if(!matches.length)$("#notice").textContent+=" Dla dzisiejszych spotkań nie znaleziono kompletnej pary danych: prognoza + kursy.";
 }catch(e){
  matches=demo;liveMode=false;$("#apiCount").textContent="DEMO";
  $("#notice").textContent="Nie udało się pobrać danych LIVE ("+e.message+"). Pokazujemy dane demonstracyjne – nie obstawiaj ich.";
  $("#updated").textContent="Tryb demonstracyjny · "+new Date().toLocaleTimeString("pl-PL");
 }
 render();$("#refresh").disabled=false;$("#refresh").textContent="↻ Odśwież";
}
function history(){let h=JSON.parse(localStorage.getItem("dc_history")||"[]").filter(x=>Date.now()-x.ts<7*86400000);localStorage.setItem("dc_history",JSON.stringify(h));$("#history").innerHTML=h.length?h.map(x=>`<div class="historyrow"><span>${esc(x.match)} · typ ${x.pick}</span><span>${new Date(x.ts).toLocaleDateString("pl-PL")}</span></div>`).join(""):"Brak zapisanych typów."}
window.savePick=(id,pick,match)=>{let h=JSON.parse(localStorage.getItem("dc_history")||"[]");h.unshift({id,pick,match,ts:Date.now()});localStorage.setItem("dc_history",JSON.stringify(h));history()};
$("#refresh").addEventListener("click",load);$("#clearHistory").addEventListener("click",()=>{localStorage.removeItem("dc_history");history()});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
history();load();
