
/* ===== GAME RUNTIME LIFECYCLE v4.7.6 ===== */
window.GB_RUNTIME=window.GB_RUNTIME||{active:false,epoch:0,timeouts:new Set(),intervals:new Set(),rafs:new Set(),game:null};
(function(){
 const R=window.GB_RUNTIME,_st=window.setTimeout,_ct=window.clearTimeout,_si=window.setInterval,_ci=window.clearInterval;
 const _raf=window.requestAnimationFrame||function(fn){return _st(()=>fn(performance.now()),16)},_caf=window.cancelAnimationFrame||_ct;
 window.setTimeout=function(fn,ms,...args){const id=_st(function(...aa){R.timeouts.delete(id);fn(...aa)},ms,...args);if(R.active)R.timeouts.add(id);return id};
 window.clearTimeout=function(id){R.timeouts.delete(id);return _ct(id)};
 window.setInterval=function(fn,ms,...args){const id=_si(fn,ms,...args);if(R.active)R.intervals.add(id);return id};
 window.clearInterval=function(id){R.intervals.delete(id);return _ci(id)};
 window.requestAnimationFrame=function(fn){const id=_raf(function(t){R.rafs.delete(id);fn(t)});if(R.active)R.rafs.add(id);return id};
 window.cancelAnimationFrame=function(id){R.rafs.delete(id);return _caf(id)};
 window.GB_stopGameRuntime=function(){R.timeouts.forEach(_ct);R.intervals.forEach(_ci);R.rafs.forEach(_caf);R.timeouts.clear();R.intervals.clear();R.rafs.clear();R.active=false;R.epoch++;};
 window.GB_startGameRuntime=function(name){window.GB_stopGameRuntime();R.active=true;R.epoch++;R.game=name;debugLog("RUNTIME","START",{game:name,epoch:R.epoch});return R.epoch};
})();

/* ===== SAFE RUNTIME / DEBUG BOOT ===== */
const TEST_MODE=true;
const TEST_COINS=9999;
window.__GB_DEBUG_LINES=window.__GB_DEBUG_LINES||[];
window.__GB_DEBUG_COUNT=window.__GB_DEBUG_COUNT||0;
function debugLog(level,msg,data){
  try{
    const now=new Date();
    const time=now.toLocaleTimeString();
    let extra="";
    try{extra=data===undefined?"":" "+JSON.stringify(data)}catch(e){extra=" {data_serialization_error:"+String(e)+"}";}
    const line=`[${time}] [${level}] ${msg}${extra}`;
    if(!Array.isArray(window.__GB_DEBUG_LINES))window.__GB_DEBUG_LINES=[];
    window.__GB_DEBUG_LINES.push(line);
    if(window.__GB_DEBUG_LINES.length>2000)window.__GB_DEBUG_LINES.splice(0,window.__GB_DEBUG_LINES.length-2000);
    window.__GB_DEBUG_COUNT=window.__GB_DEBUG_LINES.length;
    try{localStorage.setItem("GB_DEBUG_LOG",window.__GB_DEBUG_LINES.join("\n"));}catch(e){}
    try{
      const body=document.getElementById("debugBody");if(body)body.textContent=window.__GB_DEBUG_LINES.join("\n");
      const count=document.getElementById("debugCount");if(count)count.textContent=window.__GB_DEBUG_COUNT;
      const ev=document.getElementById("dbgEvents");if(ev)ev.textContent=window.__GB_DEBUG_COUNT;
      const err=document.getElementById("dbgErrors");if(err&&level==="ERROR")err.textContent=Number(err.textContent||0)+1;
    }catch(uiErr){try{console.error("[GAMBLE BOX][DEBUG UI ERROR]",uiErr)}catch(e){}}
    try{console.log("[GAMBLE BOX]",line)}catch(e){}
  }catch(e){try{console.error("[GAMBLE BOX][LOGGER FAILURE]",e)}catch(x){}}
}

/* 4.7.37 PERSISTENT DIAGNOSTICS — capture failures before game code can swallow them */
window.addEventListener("error",function(ev){
  debugLog("ERROR","UNCAUGHT ERROR",{
    message:ev.message||"unknown",
    source:ev.filename||"",
    line:ev.lineno||0,
    col:ev.colno||0,
    stack:ev.error&&ev.error.stack?ev.error.stack:""
  });
});
window.addEventListener("unhandledrejection",function(ev){
  const reason=ev.reason;
  debugLog("ERROR","UNHANDLED PROMISE REJECTION",{
    message:reason&&reason.message?reason.message:String(reason),
    stack:reason&&reason.stack?reason.stack:""
  });
});
window.addEventListener("beforeunload",function(){
  try{localStorage.setItem("GB_DEBUG_LOG",window.__GB_DEBUG_LINES.join("\n"));}catch(e){}
});
try{
  const old=localStorage.getItem("GB_DEBUG_LOG");
  if(old)window.__GB_DEBUG_LINES=old.split("\n").filter(Boolean);
}catch(e){}

function toggleDebug(){const p=document.getElementById("debugPanel");if(p)p.classList.toggle("hidden")}
function clearDebug(){window.__GB_DEBUG_LINES=[];window.__GB_DEBUG_COUNT=0;const b=document.getElementById("debugBody");if(b)b.textContent="";const n=document.getElementById("debugCount");if(n)n.textContent="0"}
async function copyDebug(){const text=(window.__GB_DEBUG_LINES||[]).join("\n")||"NO DEBUG LOGS";try{await navigator.clipboard.writeText(text);debugLog("SYSTEM","DEBUG COPIED")}catch(e){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();}}
window.addEventListener("error",e=>debugLog("ERROR","UNCAUGHT ERROR",{message:e.message,source:e.filename,line:e.lineno,col:e.colno,stack:e.error&&e.error.stack}));
window.addEventListener("unhandledrejection",e=>debugLog("ERROR","UNHANDLED PROMISE",{reason:String(e.reason),stack:e.reason&&e.reason.stack}));
window.addEventListener("DOMContentLoaded",()=>{
  const t=document.getElementById("debugToggle");
  if(t)t.addEventListener("click",toggleDebug);
  debugLog("BOOT","DEBUG RUNTIME ONLINE",{version:"4.7.43"});
});

const KEY="gb3_save";
const S=JSON.parse(localStorage.getItem(KEY)||'{"coins":9999,"wagered":0,"profit":0,"wins":0,"maxwin":0,"history":[],"lastDaily":0,"items":[],"sound":true}');
// BASE RESET: test balance remains 9999; dashboard statistics start clean.
S.coins=9999; S.wagered=0; S.profit=0; S.wins=0; S.maxwin=0; S.history=[];
const $=id=>document.getElementById(id); let audioCtx=null,lastBet=0,timer=null,multi=1;


function gbPlay(name){
  if(!S.sound)return;
  const map={click:"click.wav",chip:"chip.wav",card:"card.wav",win:"win.wav",lose:"lose.wav",spin:"spin.wav",dice:"dice.wav",roulette:"roulette.wav",crash:"crash.wav",jackpot:"jackpot.wav",flip:"flip.wav",deal:"card.wav",puchun:"puchun_notice.mp3"};
  if(!map[name])return;
  try{const au=new Audio(map[name]+"?v=4");au.volume=.75;au.play().catch(()=>{})}catch(e){}
}
const _sfxOriginal=sfx;
sfx=function(name){gbPlay(name);try{_sfxOriginal(name)}catch(e){}};



function puchun(){
  const e=$("blackout");
  if(e){
    e.classList.add("puchun-active");
    e.style.display="flex";
  }
  // The supplied 2.68s announcement is the only Puchun sound.
  try{
    const au=new Audio("puchun_notice.mp3?v=4.2");
    au.volume=.9;
    au.currentTime=0;
    au.play().catch(()=>{});
    au.addEventListener("ended",()=>{
      if(e){e.classList.remove("puchun-active");e.style.display="none"}
    },{once:true});
    // Fallback in case mobile Safari does not fire ended.
    setTimeout(()=>{
      if(e){e.classList.remove("puchun-active");e.style.display="none"}
    },2900);
  }catch(err){
    if(e){setTimeout(()=>{e.classList.remove("puchun-active");e.style.display="none"},2900)}
  }
  debugLog&&debugLog("AUDIO","PUCHUN",{file:"puchun_notice.mp3",blackout:true});
}

let CRASH={running:false,x:1,bet:0,t:0,raf:null,token:0,crashPoint:2,points:[]};
function crashPickPoint(){
 const r=Math.random();
 return Math.max(1.01,Math.min(100,1+(-Math.log(Math.max(.0001,1-r)))*2.25));
}
function crashStart(){
 if(CRASH.running)return;
 const b=wager($("bet")?.value);if(!b)return;
 const token=GB_GAME_TOKEN,path=$("crashLine"),area=$("crashArea"),dot=$("crashDot"),xEl=$("crashX"),res=$("res"),chart=$("crashChart");
 if(!path||!area||!dot||!xEl||!res||!chart){debugLog("ERROR","CRASH DOM MISSING",{path:!!path,area:!!area,dot:!!dot,x:!!xEl});return;}
 CRASH={running:true,x:1,bet:b,t:0,raf:null,token,crashPoint:crashPickPoint(),points:[],seed:Math.random()*1000};
 path.setAttribute("d","");area.setAttribute("d","");xEl.textContent="1.00x";res.textContent="FLYING…";chart.classList.remove("crash-hit","crash-cashed");sfx("click");
 const start=performance.now(),curveSpeed=.82,shape=Math.random()*.75+.72;
 const draw=now=>{
   if(!CRASH.running||!gbAlive(token)||CRASH.token!==token)return;
   const elapsed=(now-start)/1000;CRASH.t=elapsed;
   const visibleX=1+Math.exp(curveSpeed*elapsed)-1;
   CRASH.x=Math.min(CRASH.crashPoint,visibleX);xEl.textContent=CRASH.x.toFixed(2)+"x";
   const W=620,H=300,L=18,R=12,T=18,B=22,uw=W-L-R,uh=H-T-B;
   const px=L+uw*Math.min(.995,elapsed/8.5);
   const progress=1-Math.exp(-shape*elapsed/4.5);
   const noise=Math.sin(CRASH.seed+elapsed*2.1)*5+Math.sin(CRASH.seed*.43+elapsed*3.7)*3;
   const py=Math.max(T,H-B-uh*Math.min(.94,progress*.94)+noise);
   CRASH.points.push([px,py]);
   let d=`M ${CRASH.points[0][0].toFixed(1)} ${CRASH.points[0][1].toFixed(1)}`;
   for(let i=1;i<CRASH.points.length;i++)d+=` L ${CRASH.points[i][0].toFixed(1)} ${CRASH.points[i][1].toFixed(1)}`;
   path.setAttribute("d",d);area.setAttribute("d",d+` L ${px.toFixed(1)} ${H-B} L ${L} ${H-B} Z`);dot.setAttribute("cx",px);dot.setAttribute("cy",py);
   if(CRASH.x>=CRASH.crashPoint-.0001){
     CRASH.running=false;res.textContent=`CRASHED @ ${CRASH.x.toFixed(2)}x`;chart.classList.add("crash-hit");settle(b,0,"CRASH");sfx("crash");return;
   }
   CRASH.raf=requestAnimationFrame(draw);
 };
 CRASH.raf=requestAnimationFrame(draw);
}
function crashCashout(){
 if(!CRASH.running)return;
 CRASH.running=false;cancelAnimationFrame(CRASH.raf);
 const payout=Math.floor(CRASH.bet*CRASH.x),res=$("res"),chart=$("crashChart");
 if(res)res.textContent=`CASH OUT @ ${CRASH.x.toFixed(2)}x  +${fmt(payout)}`;
 if(chart)chart.classList.add("crash-cashed");
 settle(CRASH.bet,payout,"CRASH");sfx("win");
}
function choHan(pick){
  if(window.GB_ACTION_BUSY)return;window.GB_ACTION_BUSY=true;
  const b=wager($("bet").value);if(!b)return;
  const x=$("diceA"),y=$("diceB");$("res").textContent="SHAKING…";[x,y].forEach(e=>{e.classList.remove("dice-shake");void e.offsetWidth;e.classList.add("dice-shake")});sfx("dice");
  let n=0;const iv=setInterval(()=>{x.textContent=1+Math.floor(Math.random()*6);y.textContent=1+Math.floor(Math.random()*6);if(++n>=12){clearInterval(iv);const a=1+Math.floor(Math.random()*6),d=1+Math.floor(Math.random()*6),sum=a+d,side=sum%2===0?"cho":"han";x.textContent=a;y.textContent=d;$("res").textContent=`${a} + ${d} = ${sum} — ${side.toUpperCase()} / ${side===pick?"WIN":"LOSE"}`;settle(b,side===pick?b*2:0,"丁半");sfx(side===pick?"win":"lose");window.GB_ACTION_BUSY=false}},110);
}
function coinFlip(pick){
  if(window.GB_ACTION_BUSY)return;window.GB_ACTION_BUSY=true;
  const b=wager($("bet").value);if(!b)return;
  const c=$("coin3d");$("res").textContent="FLIPPING…";c.classList.remove("coin-flipping");void c.offsetWidth;c.classList.add("coin-flipping");sfx("flip");
  setTimeout(()=>{const result=Math.random()<.5?"heads":"tails",win=result===pick;c.classList.remove("coin-flipping");c.classList.toggle("show-tail",result==="tails");$("res").textContent=`${result.toUpperCase()} — ${win?"WIN":"LOSE"}`;settle(b,win?b*2:0,"COIN TOSS");sfx(win?"win":"lose");window.GB_ACTION_BUSY=false},2200);
}
function pokerCard(c){return `<div class="poker-card">${c.r}${c.s}</div>`}
function flipHeroCard(i){H.heroRevealed[i]=!H.heroRevealed[i];sfx("card");hRender()}
function toggleHandFocus(){document.querySelector(".compact-poker").classList.toggle("hand-focused")}
function pokerCut(t){const e=$("hcut");if(!e)return;e.textContent=t;e.classList.remove("hidden");void e.offsetWidth;e.classList.add("show");setTimeout(()=>e.classList.add("hidden"),900)}
function save(){localStorage.setItem(KEY,JSON.stringify(S));render()}
function fmt(n){return Math.floor(n).toLocaleString()}
function audio(){if(!S.sound)return null; try{return audioCtx||(audioCtx=new (window.AudioContext||window.webkitAudioContext)())}catch(e){return null}}
function tone(freq,d=.08,type="sine",vol=.035,delay=0){let a=audio();if(!a)return;let o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0.0001,a.currentTime+delay);g.gain.exponentialRampToValueAtTime(vol,a.currentTime+delay+.01);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+delay+d);o.connect(g);g.connect(a.destination);o.start(a.currentTime+delay);o.stop(a.currentTime+delay+d+.02)}

function audioFile(name){
  if(!S.sound) return;
  try{ const a=new Audio(name); a.volume=0.7; a.preload="auto"; a.play().catch(()=>{}); }catch(e){}
}

function sfx(name){if(!S.sound)return; const fileMap={click:"click.wav",chip:"chip.wav",card:"card.wav",win:"win.wav",lose:"lose.wav",spin:"spin.wav",dice:"dice.wav",roulette:"roulette.wav",crash:"crash.wav",jackpot:"jackpot.wav",flip:"flip.wav",deal:"card.wav"}; if(fileMap[name]) audioFile(fileMap[name]);
 const sets={click:[[180,.05]],chip:[[450,.05,"square"]],card:[[850,.045,"triangle"]],win:[[523,.08],[659,.08],[784,.16]],lose:[[180,.15],[120,.18]],spin:[[180,.05],[220,.05],[280,.05]],dice:[[220,.05],[330,.05],[180,.07]],roulette:[[260,.04],[320,.04],[390,.04],[460,.05]],crash:[[180,.15,"sawtooth"],[80,.35,"sawtooth"]],jackpot:[[392,.1],[523,.1],[659,.1],[1046,.3]],flip:[[600,.08],[400,.08]],deal:[[700,.05],[900,.05]]};
 (sets[name]||sets.click).forEach((x,i)=>tone(x[0],x[1],x[2]||"sine",.035,i*.06));
}
function wager(v){v=Number(v);if(!Number.isFinite(v)||v<1||v>S.coins)return 0;lastBet=v;S.coins-=v;S.wagered+=v;lastBet=v;sfx("chip");return v}
function showOutcome(kind,game,net){
 const root=document.getElementById("modalContent");if(!root)return;
 const old=document.getElementById("gbOutcome");if(old)old.remove();
 const el=document.createElement("div");el.id="gbOutcome";el.className=`gb-outcome ${kind==="BIG WIN"?"big":kind.toLowerCase().replace(/\s+/g,"-")}`;
 el.innerHTML=`<div class="gb-outcome-inner"><small>${game}</small><strong>${kind}</strong><b>${net>0?"+":""}${fmt(net)} COIN</b></div>`;
 root.appendChild(el);
 requestAnimationFrame(()=>el.classList.add("show"));
 setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),300)},1250);
}
function settle(b,p,g){
 let net=p-b;S.coins+=p;S.profit+=net;
 if(p>b){S.wins++;S.maxwin=Math.max(S.maxwin,net);showOutcome(p>=b*5?"BIG WIN":"WIN",g,net)}
 else if(p===0){showOutcome("LOSE",g,-b)}
 S.history.unshift({g,net,t:new Date().toLocaleTimeString()});S.history=S.history.slice(0,20);save();return net;
}
function render(){$("coins").textContent=fmt(S.coins);$("coins2").textContent=fmt(S.coins);if($("welcomeCoins"))$("welcomeCoins").textContent=fmt(S.coins);$("profit").textContent=(S.profit>=0?"+":"")+fmt(S.profit);$("wagered").textContent=fmt(S.wagered);$("level").textContent=Math.floor(S.wagered/10000)+1;$("history").innerHTML=S.history.length?S.history.map(x=>`<div class="history-row"><span>${x.g}</span><b class="${x.net>=0?"win":"lose"}">${x.net>=0?"+":""}${fmt(x.net)}</b><small>${x.t}</small></div>`).join(""):"<div class='history-row'>NO DATA</div>";let names=["YOU","777_MASTER","BLACK_KING","LUCKY_ACE","HOUSE"];$("ranking").innerHTML=names.map((n,i)=>`<div class="rank-row"><span>#${i+1}　${n}</span><b>${fmt(i?250000-i*28000:S.maxwin)} COIN</b><small>${i?"ONLINE":"YOU"}</small></div>`).join("")}

let GB_GAME_TOKEN=0;
function gbAlive(t){return t===GB_GAME_TOKEN&&window.GB_RUNTIME&&window.GB_RUNTIME.active}
function openGame(g){
 debugLog("GAME","Launch requested",{game:g});
 GB_GAME_TOKEN++;
 const lobby=document.getElementById("appLobby");
 if(lobby)lobby.classList.add("hidden");
 window.GB_stopGameRuntime();window.GB_startGameRuntime(g);
 const token=GB_GAME_TOKEN;
 const title={slot:"ULTIMATE SLOTS",dice:"HIGH DICE",blackjack:"BLACKJACK",holdem:"TEXAS HOLD'EM",roulette:"ROULETTE",highlow:"HIGH & LOW",chohan:"丁半",coin:"COIN FLIP",lottery:"LOTTERY",multiplier:"CRASH ×",daily:"DAILY VAULT",shop:"CHIP SHOP"}[g]||g.toUpperCase();
 $("modalContent").innerHTML=`<div class="game"><div class="jackpot">GAMBLE BOX / ${title}</div><h2>${title}</h2><div id="gameBody"></div></div>`;
 $("modal").classList.remove("hidden");sfx("click");
 try{if(typeof games[g]!=="function")throw new Error("Unknown game: "+g);games[g]();debugLog("GAME","Launch success",{game:g,token})}
 catch(e){debugLog("ERROR","Game launch failed",{game:g,error:String(e),stack:e.stack});$("modalContent").innerHTML=`<div class="game"><h2>GAME ERROR</h2><pre class="debug-error">${String(e.stack||e)}</pre></div>`}
}
function closeGame(){GB_GAME_TOKEN++;debugLog("RUNTIME","STOP",{game:GB_RUNTIME.game});window.GB_stopGameRuntime();$("modal").classList.add("hidden");const lobby=document.getElementById("appLobby");if(lobby)lobby.classList.remove("hidden");sfx("click")}
function betbox(min=100){
  const max=Math.max(min,S.coins||0);
  const step=max<=1000?10:max<=10000?100:500;
  const value=Math.min(max,Math.max(min,lastBet||min));
  return `<div class="bet-control">
    <div class="bet-control-head"><span>BET AMOUNT</span><strong id="betValue">${fmt(value)}</strong><small>COIN</small></div>
    <input id="bet" class="bet-slider" type="range" min="${Math.min(min,max)}" max="${Math.max(min,max)}" step="${step}" value="${value}" oninput="updateBetSlider(this.value)">
    <div class="bet-scale"><span>${fmt(Math.min(min,max))}</span><span>${fmt(max)}</span></div>
  </div>`;
}
function updateBetSlider(v){
  const n=Math.max(1,Math.min(Number(v)||1,S.coins||0));
  lastBet=n;
  const el=$("betValue");if(el)el.textContent=fmt(n);
  const slider=$("bet");if(slider){const min=Number(slider.min),max=Number(slider.max);const pct=max>min?((n-min)/(max-min))*100:100;slider.style.setProperty("--bet-progress",pct+"%")}
}
function scrollToGames(){$("games").scrollIntoView()}
function toggleSound(){S.sound=!S.sound;$("sound").textContent=S.sound?"🔊":"🔇";if(S.sound)sfx("win");save()}

function lottery(){
 if(window.GB_LOTTERY_BUSY)return;const b=100,res=$("res"),btn=document.querySelector(".lottery-draw");
 if(S.coins<b){if(res)res.textContent="NOT ENOUGH COINS";return}
 S.coins-=b;S.wagered+=b;save();render();window.GB_LOTTERY_BUSY=true;if(btn)btn.disabled=true;if(res)res.textContent="DRAWING…";sfx("spin");
 const r=Math.random(),win=r<.005?100000:r<.025?10000:r<.15?500:0;
 setTimeout(()=>{window.GB_LOTTERY_BUSY=false;if(btn)btn.disabled=false;if(win){S.coins+=win;S.profit+=win-b;S.wins++;S.maxwin=Math.max(S.maxwin,win-b);S.history.unshift({g:"LOTTERY",net:win-b,t:new Date().toLocaleTimeString()});S.history=S.history.slice(0,20);save();render();res.textContent=win===100000?"★ JACKPOT 100,000 ★":win===10000?"GOLD 10,000":"SILVER 500";sfx(win>=10000?"jackpot":"win");if(win>=100000)puchun()}else{S.profit-=b;S.history.unshift({g:"LOTTERY",net:-b,t:new Date().toLocaleTimeString()});S.history=S.history.slice(0,20);save();render();res.textContent="NO WIN";sfx("lose")}},1800);
}
function daily(){
  const now=Date.now();
  if(now-S.lastDaily<86400000){const r=$("res");if(r)r.textContent="VAULT LOCKED";return}
  const bonus=1000;S.coins+=bonus;S.profit+=bonus;S.lastDaily=now;S.wins++;S.maxwin=Math.max(S.maxwin,bonus);S.history.unshift({g:"DAILY VAULT",net:bonus,t:new Date().toLocaleTimeString()});S.history=S.history.slice(0,20);save();const r=$("res");if(r)r.textContent="CLAIMED +1,000";sfx("win");
}
function buy(name,cost){
  cost=Number(cost)||0;if(S.coins<cost){const r=$("res");if(r)r.textContent="NOT ENOUGH COINS";return false}
  S.coins-=cost;S.items=S.items||[];S.items.push(name);S.history.unshift({g:"SHOP",net:-cost,t:new Date().toLocaleTimeString()});S.history=S.history.slice(0,20);save();const r=$("res");if(r)r.textContent=`PURCHASED ${name}`;sfx("chip");return true;
}
const games={
slot(){
 $("gameBody").innerHTML=betbox()+`<div class="anim-game slot-game">
  <div class="anim-title">GOLDEN REEL</div>
  <div class="slot-machine">
   <div class="slot-top">★ JACKPOT ★</div>
   <div class="slot-body">
    <div class="reels" id="slotReels">
     <div class="reel-window"><div id="reel1" class="reel"><div class="slot-cell seven">7</div><div class="slot-cell bar">BAR</div><div class="slot-cell cherry">●●</div></div></div>
     <div class="reel-window"><div id="reel2" class="reel"><div class="slot-cell seven">7</div><div class="slot-cell diamond">◆</div><div class="slot-cell bell">◉</div></div></div>
     <div class="reel-window"><div id="reel3" class="reel"><div class="slot-cell seven">7</div><div class="slot-cell bar">BAR</div><div class="slot-cell lemon">●</div></div></div>
     <div class="payline horizontal"></div><div class="payline diagonal down"></div><div class="payline diagonal up"></div>
    </div>
    <div class="slot-lever-wrap"><button id="slotLever" class="slot-lever" onclick="spinSlot()"><span class="lever-knob"></span><span class="lever-shaft"></span></button><small>PULL</small></div>
   </div>
   <button id="slotSpinBtn" class="slot-spin" onclick="spinSlot()">PULL LEVER</button>
  </div>
  <div class="slot-paytable">
   <div class="slot-paytitle">PAYOUT TABLE</div>
   <div class="slot-paygrid">
    <div><b>7</b><span>×50</span></div><div><b>BAR</b><span>×12</span></div>
    <div><b>◆</b><span>×8</span></div><div><b>◉</b><span>×5</span></div>
    <div><b>●●</b><span>×5</span></div><div><b>●</b><span>×5</span></div>
   </div>
  </div>
  <div id="res" class="result">PLACE YOUR BET</div>
 </div>`;
},
dice(){$("gameBody").innerHTML=betbox()+`<div class="choices"><button onclick="dice('high')">HIGH ×1.8</button><button onclick="dice('low')">LOW ×1.8</button><button onclick="dice('exact')">EXACT ×5</button></div><div id="res" class="result">🎲</div>`},
blackjack(){
  document.getElementById("gameBody").innerHTML=betbox(100)+`
  <div class="felt bj-felt">
    <div class="street">BLACKJACK TABLE</div>
    <div class="bj-zone"><div class="bj-label">DEALER <span id="bjDealerValue">0</span></div><div id="dealer" class="holdem-row"></div></div>
    <div class="pot">BET <span id="bjbet">0</span></div>
    <div class="bj-zone"><div class="bj-label">YOU <span id="bjPlayerValue">0</span></div><div id="player" class="holdem-row"></div></div>
    <div class="actions"><button id="bjdeal" onclick="bjDeal()">DEAL</button><button id="bjhit" onclick="bjHit()" disabled>HIT</button><button id="bjstand" onclick="bjStand()" disabled>STAND</button><button id="bjdouble" onclick="bjDouble()" disabled>DOUBLE</button></div>
    <div id="bjres" class="result"></div><div id="bjNext" class="bj-next hidden"><span>ROUND FINISHED</span><button onclick="bjJoinNext()">JOIN NEXT HAND</button></div>
  </div>`;
},
holdem(){holdemInit()},
roulette(){$("gameBody").innerHTML=betbox()+`<div class="real-roulette"><div class="real-wheel-wrap"><div class="real-pointer"></div><div id="rouletteWheel" class="real-wheel"><div class="real-pocket green" style="--i:0"><span>0</span></div><div class="real-pocket red" style="--i:1"><span>32</span></div><div class="real-pocket black" style="--i:2"><span>15</span></div><div class="real-pocket red" style="--i:3"><span>19</span></div><div class="real-pocket black" style="--i:4"><span>4</span></div><div class="real-pocket red" style="--i:5"><span>21</span></div><div class="real-pocket black" style="--i:6"><span>2</span></div><div class="real-pocket red" style="--i:7"><span>25</span></div><div class="real-pocket black" style="--i:8"><span>17</span></div><div class="real-pocket red" style="--i:9"><span>34</span></div><div class="real-pocket black" style="--i:10"><span>6</span></div><div class="real-pocket red" style="--i:11"><span>27</span></div><div class="real-pocket black" style="--i:12"><span>13</span></div><div class="real-pocket red" style="--i:13"><span>36</span></div><div class="real-pocket black" style="--i:14"><span>11</span></div><div class="real-pocket red" style="--i:15"><span>30</span></div><div class="real-pocket black" style="--i:16"><span>8</span></div><div class="real-pocket red" style="--i:17"><span>23</span></div><div class="real-pocket black" style="--i:18"><span>10</span></div><div class="real-pocket red" style="--i:19"><span>5</span></div><div class="real-pocket black" style="--i:20"><span>24</span></div><div class="real-pocket red" style="--i:21"><span>16</span></div><div class="real-pocket black" style="--i:22"><span>33</span></div><div class="real-pocket red" style="--i:23"><span>1</span></div><div class="real-pocket black" style="--i:24"><span>20</span></div><div class="real-pocket red" style="--i:25"><span>14</span></div><div class="real-pocket black" style="--i:26"><span>31</span></div><div class="real-pocket red" style="--i:27"><span>9</span></div><div class="real-pocket black" style="--i:28"><span>22</span></div><div class="real-pocket red" style="--i:29"><span>18</span></div><div class="real-pocket black" style="--i:30"><span>29</span></div><div class="real-pocket red" style="--i:31"><span>7</span></div><div class="real-pocket black" style="--i:32"><span>28</span></div><div class="real-pocket red" style="--i:33"><span>12</span></div><div class="real-pocket black" style="--i:34"><span>35</span></div><div class="real-pocket red" style="--i:35"><span>3</span></div><div class="real-pocket black" style="--i:36"><span>26</span></div><div id="rouletteBall" class="real-ball"></div><div class="real-hub">GB</div></div></div><div class="roulette-readout"><span id="rouletteNumber">—</span><small id="rouletteColor">WAITING</small></div><div class="roulette-bets" role="group" aria-label="Roulette bets"><button class="roulette-bet roulette-bet-red" onclick="rouletteSpin('red')"><b>RED</b><span>2× RETURN</span></button><button class="roulette-bet roulette-bet-black" onclick="rouletteSpin('black')"><b>BLACK</b><span>2× RETURN</span></button><button class="roulette-bet roulette-bet-zero" onclick="rouletteSpin('green')"><b>ZERO</b><span>14× RETURN</span></button></div><div id="res" class="result">PLACE YOUR BET</div></div>`},highlow(){
 $("gameBody").innerHTML=betbox()+`<div class="hl-game">
   <div class="hl-head"><span>HIGH</span><b id="hlValue">—</b><span>LOW</span></div>
   <div class="hl-axis"><span>HIGH ZONE</span><span>LOW ZONE</span></div>
   <div class="hl-chart" id="hlChart">
     <div class="hl-zone high-zone"></div><div class="hl-zone low-zone"></div>
     <div class="hl-center-line"></div>
     <svg viewBox="0 0 620 250" preserveAspectRatio="none"><path id="hlArea"></path><path id="hlLine"></path><circle id="hlDot" cx="12" cy="206" r="6"></circle></svg>
     <div class="hl-live">LIVE MARKET PATH</div>
   </div>
   <div class="choices"><button onclick="hl('high')">HIGH</button><button onclick="hl('low')">LOW</button></div>
   <div id="res" class="result">CHOOSE A SIDE</div>
 </div>`;
},

chohan(){
  document.getElementById("gameBody").innerHTML=betbox()+`<div class="anim-game dice-game">
  <div class="anim-title">丁 半</div><div class="dice-stage"><div id="diceA" class="die">?</div><div id="diceB" class="die">?</div></div>
  <div class="choices"><button onclick="choHan('cho')">丁 / EVEN</button><button onclick="choHan('han')">半 / ODD</button></div><div id="res" class="result">PLACE YOUR BET</div></div>`;
},
coin(){
  document.getElementById("gameBody").innerHTML=betbox()+`<div class="anim-game coin-game">
  <div class="anim-title">COIN TOSS</div><div class="coin-stage"><div id="coin3d" class="coin3d"><div class="coin-face coin-head">H</div><div class="coin-face coin-tail">T</div></div></div>
  <div class="choices"><button onclick="coinFlip('heads')">HEADS</button><button onclick="coinFlip('tails')">TAILS</button></div><div id="res" class="result">CHOOSE YOUR SIDE</div></div>`;
},
lottery(){$("gameBody").innerHTML=`<div class="lottery-game"><div class="lottery-hero">ONE DRAW <b>100 COIN</b></div><div class="lottery-prizes"><div><b>100,000</b><small>JACKPOT</small></div><div><b>10,000</b><small>GOLD</small></div><div><b>500</b><small>SILVER</small></div></div><div class="lottery-ball">?</div><button class="lottery-draw" onclick="lottery()">DRAW LOTTERY</button><div id="res" class="result">READY</div></div>`},
multiplier(){
 $("gameBody").innerHTML=betbox()+`<div class="crash-wrap">
 <div id="crashChart" class="crash-chart">
  <div class="crash-grid"></div><div id="crashX" class="crash-big">1.00x</div>
  <svg viewBox="0 0 620 300" preserveAspectRatio="none">
   <path id="crashArea" class="crash-area"></path><path id="crashLine" class="crash-line"></path>
   <circle id="crashDot" class="crash-dot" cx="18" cy="278" r="6"></circle>
  </svg>
  <div class="crash-axis-x">TIME</div><div class="crash-axis-y">MULTIPLIER</div>
 </div>
 <div id="res" class="result">READY</div>
 <div class="crash-controls"><button onclick="crashStart()">START</button><button onclick="crashCashout()">CASH OUT</button></div>
 </div>`;
},
daily(){let ok=Date.now()-S.lastDaily>86400000;$("gameBody").innerHTML=`<p>${ok?"VAULT READY":"VAULT LOCKED"}</p><button ${ok?"":"disabled"} onclick="daily()">CLAIM 1,000</button><div id="res" class="result"></div>`},
shop(){$("gameBody").innerHTML=`<div class="shop-head"><small>CHIP BANK</small><h2>TABLE CHIPS</h2><p>Prepare your virtual stack before entering a table.</p></div><div class="chip-bank"><div><b>🪙 ${fmt(S.coins)}</b><small>AVAILABLE</small></div><button onclick="buy('100 CHIP STACK',100)">+100</button><button onclick="buy('500 CHIP STACK',500)">+500</button><button onclick="buy('1,000 CHIP STACK',1000)">+1,000</button></div><div class="shop-note">Chip stacks are virtual table markers. Your bankroll remains fixed at 9,999 in TEST MODE.</div><div id="res" class="result">READY</div>`}
};

let SLOT_BUSY=false;
const SLOT_SYMBOLS=[
 {id:"seven",html:'<span class="slot-cell seven">7</span>'},
 {id:"bar",html:'<span class="slot-cell bar">BAR</span>'},
 {id:"cherry",html:'<span class="slot-cell cherry">●●</span>'},
 {id:"diamond",html:'<span class="slot-cell diamond">◆</span>'},
 {id:"bell",html:'<span class="slot-cell bell">◉</span>'},
 {id:"lemon",html:'<span class="slot-cell lemon">●</span>'}
];
function slotSetReel(el,rows){if(!el)return;el.innerHTML=rows.map(x=>SLOT_SYMBOLS.find(s=>s.id===x)?.html||SLOT_SYMBOLS[0].html).join("")}
function slotPick(){return SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)].id}
function slotAudio(type){
 try{
  if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  const ctx=audioCtx,now=ctx.currentTime;
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);
  if(type==="lever"){
   osc.type="square";osc.frequency.setValueAtTime(180,now);osc.frequency.exponentialRampToValueAtTime(72,now+.13);
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.13,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.17);osc.start(now);osc.stop(now+.18);
  }else if(type==="reel"){
   osc.type="triangle";osc.frequency.setValueAtTime(95,now);osc.frequency.exponentialRampToValueAtTime(145,now+.035);
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.045,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.045);osc.start(now);osc.stop(now+.05);
  }else if(type==="stop"){
   osc.type="square";osc.frequency.setValueAtTime(420,now);osc.frequency.exponentialRampToValueAtTime(110,now+.075);
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.12,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.11);osc.start(now);osc.stop(now+.12);
  }else if(type==="line"){
   osc.type="sine";osc.frequency.setValueAtTime(520,now);osc.frequency.exponentialRampToValueAtTime(780,now+.16);
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.09,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.2);osc.start(now);osc.stop(now+.21);
  }
 }catch(e){}
}
function slotMarkLines(lines){
 document.querySelectorAll(".slot-machine .payline").forEach(e=>e.classList.remove("hit"));
 lines.forEach(i=>{const el=document.querySelectorAll(".slot-machine .payline")[i];if(el)el.classList.add("hit")});
}
function spinSlot(){
 if(SLOT_BUSY)return;
 const b=wager($("bet")?.value);if(!b)return;
 const token=GB_GAME_TOKEN,res=$("res"),btn=$("slotSpinBtn"),lever=$("slotLever");
 const reels=[1,2,3].map(i=>$("reel"+i));
 SLOT_BUSY=true;if(btn)btn.disabled=true;if(lever)lever.classList.add("pulled");
 if(res)res.textContent="GOOD LUCK…";
 slotAudio("lever");sfx("click");
 setTimeout(()=>{if(lever)lever.classList.remove("pulled")},230);
 const final=[
   [slotPick(),slotPick(),slotPick()],
   [slotPick(),slotPick(),slotPick()],
   [slotPick(),slotPick(),slotPick()]
 ];
 // Bias only the visual frequency, never force a win. Winning lines remain genuinely random.
 const timers=[];
 reels.forEach((el,i)=>{
   if(!el)return;
   el.classList.add("reel-running");
   const iv=setInterval(()=>{if(!gbAlive(token)){clearInterval(iv);return}slotSetReel(el,[slotPick(),slotPick(),slotPick()]);slotAudio("reel")},72);
   timers.push(iv);
   setTimeout(()=>{
     clearInterval(iv);el.classList.remove("reel-running");slotSetReel(el,final[i]);slotAudio("stop");
     if(i===2){
       const lines=[];
       const paths=[[0,0,0],[1,1,1],[2,2,2],[0,1,2],[2,1,0]];
       paths.forEach((path,idx)=>{const ids=path.map((row,col)=>final[col][row]);if(ids[0]===ids[1]&&ids[1]===ids[2])lines.push(idx)});
       slotMarkLines(lines);
       let mult=0,hitName="";
       for(const li of lines){const ids=paths[li];const id=final[0][ids[0]];const v=id==="seven"?50:id==="bar"?12:id==="diamond"?8:5;if(v>mult){mult=v;hitName=id.toUpperCase()}}
       const winLines=lines.length;
       if(winLines){mult*=winLines>1?1.5:1;mult=Math.floor(mult);}
       SLOT_BUSY=false;if(btn)btn.disabled=false;
       if(res)res.textContent=winLines?`${hitName} • ${winLines} LINE${winLines>1?"S":""} • ×${mult}`:"LOSE";
       if(winLines){slotAudio("line");settle(b,Math.floor(b*mult),"ULTIMATE SLOTS");sfx(mult>=15?"jackpot":"win");if(mult>=15)puchun()}else{settle(b,0,"ULTIMATE SLOTS");sfx("lose")}
     }
   },1000+i*700);
 },
 );
}
let HL_BUSY=false;

function hl(choice){
 if(HL_BUSY)return;
 const b=wager($("bet")?.value);if(!b)return;
 HL_BUSY=true;const token=GB_GAME_TOKEN;
 const line=$("hlLine"),area=$("hlArea"),dot=$("hlDot"),vEl=$("hlValue"),res=$("res"),chart=$("hlChart");
 if(!line||!area||!dot||!vEl||!res||!chart){HL_BUSY=false;return}
 const finalHigh=Math.random()<.5,start=performance.now(),duration=10000,seed=Math.random()*1000;
 let points=[[12,214]],lastY=214,nextShock=start+1600;
 res.textContent="LIVE…";vEl.textContent="1.00";chart.classList.remove("hl-high","hl-low","hl-wild");sfx("click");
 const tick=now=>{
   if(!gbAlive(token)){HL_BUSY=false;return}
   const p=Math.min(1,(now-start)/duration),x=12+596*p;
   const wave=Math.sin(seed+p*10)*2.3+Math.sin(seed*.31+p*18)*1.5;
   const volatility=9*(1-p*.20);
   let y=lastY+(Math.random()-.5)*volatility+wave;
   if(p>.18&&p<.86&&now>=nextShock){
     nextShock=now+1400+Math.random()*1300;
     if(Math.random()<.45)y+=(Math.random()<.5?-1:1)*(14+Math.random()*28);
   }
   const finalStart=.83,blend=p>finalStart?Math.min(1,(p-finalStart)/(1-finalStart)):0;
   const targetY=finalHigh?34:220;
   y=y*(1-blend)+targetY*blend;
   y=Math.max(24,Math.min(224,y));lastY=y;
   points.push([x,y]);dot.setAttribute("cx",x);dot.setAttribute("cy",y);
   const liveVal=finalHigh?(1.05+p*8.8):(8.8-p*8.3);vEl.textContent=liveVal.toFixed(2);
   let d=`M ${points[0][0]} ${points[0][1]}`;for(let i=1;i<points.length;i++)d+=` L ${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`;
   line.setAttribute("d",d);area.setAttribute("d",d+` L ${x.toFixed(1)} 125 L 12 125 Z`);
   if(p>=1){
     HL_BUSY=false;chart.classList.remove("hl-wild");chart.classList.add(finalHigh?"hl-high":"hl-low");
     const win=(choice==="high")===finalHigh;vEl.textContent=finalHigh?"9.80":"0.45";
     res.textContent=`${finalHigh?"HIGH":"LOW"} • ${win?"WIN":"LOSE"}`;
     settle(b,win?Math.floor(b*1.9):0,"HIGH & LOW");sfx(win?"win":"lose");return;
   }
   requestAnimationFrame(tick);
 };
 requestAnimationFrame(tick);
}
function dice(c){let b=wager($("bet").value);if(!b)return;sfx("dice");let d=1+Math.floor(Math.random()*6),ok=c==="exact"?d===6:c==="high"?d>=4:d<=3;$("res").textContent=`🎲 ${d} / ${ok?"WIN":"LOSE"}`;settle(b,ok?Math.floor(b*(c==="exact"?5:1.8)):0,"HIGH DICE");sfx(ok?"win":"lose");window.GB_ACTION_BUSY=false}
function deck(){let suits=["♠","♥","♦","♣"],ranks=["2","3","4","5","6","7","8","9","10","J","Q","K","A"],d=[];for(let s of suits)for(let r of ranks)d.push({s,r});return d.sort(()=>Math.random()-.5)}
function val(cards){let total=0,aces=0;cards.forEach(c=>{if(["J","Q","K"].includes(c.r))total+=10;else if(c.r==="A"){total+=11;aces++}else total+=+c.r});while(total>21&&aces--)total-=10;return total}
let BJ={hands:[],active:0,deck:[],d:[],bet:0,reveal:false,over:false,totalBet:0,split:false,splitHands:[]};
function bjValueText(cards){
  let hard=0,aces=0;
  for(const c of cards){
    if(["J","Q","K"].includes(c.r))hard+=10;
    else if(c.r==="A"){hard+=1;aces++}
    else hard+=Number(c.r);
  }
  const soft=hard+(aces?10:0);
  return aces && soft<=21 ? `${soft} or ${hard}` : `${hard}`;
}
function bjCard(c,hidden=false){if(hidden)return '<div class="card back">?</div>';return `<div class="card ${c.s==="♥"||c.s==="♦"?"red":""} dealt">${c.r}${c.s}</div>`}
function bjRender(){
 const hand=BJ.split?BJ.hands[BJ.active]:BJ.p;
 $("player").innerHTML=hand.map(c=>bjCard(c)).join("");
 $("dealer").innerHTML=BJ.d.map((c,i)=>bjCard(c,i===1&&!BJ.reveal)).join("");
 $("bjPlayerValue").textContent=bjValueText(hand);
 $("bjDealerValue").textContent=BJ.reveal?bjValueText(BJ.d):bjValueText([BJ.d[0]]);
 $("bjbet").textContent=fmt(BJ.bet);
}
function bjActions(on){["bjhit","bjstand","bjdouble"].forEach(id=>$(id).disabled=!on);const n=$("bjNext");if(n)n.classList.toggle("hidden",on)}
function bjJoinNext(){const n=$("bjNext");if(n)n.classList.add("hidden");bjDeal()}
function bjDeal(){
 const b=wager($("bet").value);if(!b)return;
 BJ={deck:deck(),p:[],d:[],bet:b,reveal:false,over:false,split:false,hands:[],active:0,totalBet:b};
 BJ.p=[BJ.deck.pop(),BJ.deck.pop()];BJ.d=[BJ.deck.pop(),BJ.deck.pop()];
 $("bjdeal").disabled=true;bjRender();sfx("deal");
 if(val(BJ.p)===21){BJ.reveal=true;BJ.over=true;bjRender();$("bjres").textContent="BLACKJACK!";settle(BJ.bet,Math.floor(BJ.bet*2.5),"BLACKJACK");sfx("jackpot");puchun();bjActions(false);return}
 bjActions(true);
}
function bjHit(){if(BJ.over)return;const hand=BJ.split?BJ.hands[BJ.active]:BJ.p;hand.push(BJ.deck.pop());sfx("card");bjRender();if(val(hand)>21){BJ.reveal=true;BJ.over=true;bjRender();$("bjres").textContent="BUST";settle(BJ.bet,0,"BLACKJACK");sfx("lose");bjActions(false)}else if(val(hand)===21)bjStand()}
function bjStand(){if(BJ.over)return;BJ.reveal=true;while(val(BJ.d)<17){BJ.d.push(BJ.deck.pop());sfx("card")}BJ.over=true;bjRender();bjResolve()}
function bjDouble(){if(BJ.over||S.coins<BJ.bet)return;S.coins-=BJ.bet;S.wagered+=BJ.bet;BJ.bet*=2;BJ.p.push(BJ.deck.pop());sfx("chip");if(val(BJ.p)>21){BJ.reveal=true;BJ.over=true;bjRender();$("bjres").textContent="DOUBLE BUST";settle(BJ.bet,0,"BLACKJACK");sfx("lose");bjActions(false);return}bjStand()}
function bjResolve(){const pv=val(BJ.p),dv=val(BJ.d);let payout=0,msg;if(dv>21||pv>dv){msg="YOU WIN";payout=BJ.bet*2}else if(pv===dv){msg="PUSH";payout=BJ.bet}else msg="DEALER WINS";$("bjres").textContent=`${msg}　YOU ${pv} / DEALER ${dv}`;settle(BJ.bet,payout,"BLACKJACK");sfx(payout>BJ.bet?"win":payout===BJ.bet?"click":"lose");bjActions(false);$("bjdeal").disabled=false}
let H={};
function pokerActionSound(action){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const x=new C(),o=x.createOscillator(),g=x.createGain();o.type=action==="CHECK"?"triangle":"square";o.frequency.value=action==="CHECK"?165:930;g.gain.value=.03;o.connect(g);g.connect(x.destination);o.start();o.stop(x.currentTime+(action==="CHECK"?.11:.07));if(["BET","RAISE","CALL","ALL IN"].includes(action))sfx("chip")}catch(e){}}
function pokerTurnSound(){try{sfx("click")}catch(e){}}
const HE_N=4;
function holdemNames(){return["PLAYER","CPU_ACE","CPU_BOSS","CPU_QUEEN"];}
function holdemInit(){
 H={
 players:holdemNames().map((name,i)=>({name,stack:9999,bet:0,total:0,folded:false,allin:false,cards:[],action:"",
   style:["TAG","LAG","TRICKSTER","CALLING"][i%4],bluff:0.06+(i%4)*0.045,confidence:.45,tilt:0,history:[]})),
 hero:0,button:Math.floor(Math.random()*HE_N),street:0,board:[],deck:deck(),pot:0,currentBet:0,turn:0,pending:new Set(),
 heroRevealed:[false,false],communityRevealed:[],over:false,timerId:null,advanceTimer:null,cpuTimer:null,token:GB_GAME_TOKEN,raiseCount:0,lastRaiseSize:100,streetAggro:0,heroAggro:0};
 document.getElementById("gameBody").innerHTML=`<div class="felt he-clean"><div class="he-head"><span id="heStreet">PRE-FLOP</span><b id="hePot">POT 0</b><span id="heButton"></span></div>
 <div class="he-stage"><div id="hePlayers" class="he-players"></div><div class="he-center"><div class="he-potline">POT <strong id="hePotCenter">0</strong></div><div id="heBoard" class="he-board"></div><div id="heStreetCenter" class="he-street-label">PRE-FLOP</div></div><div id="heHero" class="he-hero"></div></div>
 <div class="he-actions"><button id="heCheck" onclick="heAction('CHECK')">CHECK</button><button id="heBet" onclick="heOpenBet('BET')">BET</button><button id="heCall" onclick="heAction('CALL')">CALL</button><button id="heRaise" onclick="heOpenBet('RAISE')">RAISE</button><button id="heFold" onclick="heAction('FOLD')">FOLD</button></div>
 <div id="heBetBox" class="he-betbox hidden"><div><span id="heBetMode">BET</span> <b id="heBetValue">100</b></div><input id="heBetSlider" type="range" min="100" max="9999" step="100" value="100" oninput="heSyncBet(this.value)"><button onclick="heConfirmBet()">CONFIRM</button></div>
 <div class="he-timer"><i id="heTimerBar"></i></div><div id="heCut" class="he-cut hidden"></div><div id="heStatus" class="he-status"></div><div id="heNext" class="he-next hidden"><span>HAND FINISHED</span><button onclick="heJoinNext()">JOIN NEXT HAND</button></div></div>`;
 heStart();
}
function heStart(){
 clearTimeout(H.advanceTimer);clearTimeout(H.cpuTimer);cancelAnimationFrame(H.timerId);H.cpuTimer=null;
 H.street=0;H.board=[];H.deck=deck();H.pot=0;H.currentBet=0;H.over=false;H.heroRevealed=[false,false];H.communityRevealed=[];H.raiseCount=0;H.lastRaiseSize=100;H.streetAggro=0;H.heroAggro=0;
 H.players.forEach(p=>{p.stack=9999;p.bet=0;p.total=0;p.folded=false;p.allin=false;p.action="";p.cards=[H.deck.pop(),H.deck.pop()];p.confidence=.45;p.tilt=Math.max(0,(p.tilt||0)*.8);p.history=[]});
 const sb=(H.button+1)%HE_N,bb=(H.button+2)%HE_N;
 hePut(sb,50,"SB");hePut(bb,100,"BB");H.currentBet=100;
 H.pending=new Set(H.players.map((_,i)=>i).filter(i=>!H.players[i].folded&&!H.players[i].allin));
 H.turn=(bb+1)%HE_N;heRender();heHero();
 if(H.turn===H.hero)heTimer();else heCpuLater();
}
function hePut(i,n,act){const p=H.players[i],v=Math.min(n,p.stack);p.stack-=v;p.bet+=v;p.total+=v;H.pot+=v;p.action=act;if(p.stack===0)p.allin=true}
function heCard(c){return`<span class="he-mini ${c.s==="♥"||c.s==="♦"?"red":""}">${c.r}${c.s}</span>`}
function heRender(){
 const s=["PRE-FLOP","FLOP","TURN","RIVER","SHOWDOWN"][H.street];
 $("heStreet").textContent=s;$("heStreetCenter").textContent=s;$("hePot").textContent=`POT ${fmt(H.pot)}`;$("hePotCenter").textContent=fmt(H.pot);$("heButton").textContent=`BUTTON ${H.players[H.button].name}`;
 const pos=["","tl","tr","tc"];
 $("hePlayers").innerHTML=H.players.map((p,i)=>{
   if(i===H.hero)return "";
   const act=p.action?`<span class="he-act ${["CHECK","CALL","SB","BB"].includes(p.action)?"passive":p.action==="FOLD"?"fold":"aggressive"}">${p.action}</span>`:"";
   const d=i===H.button?`<span class="he-d">D</span>`:"";
   const cards=H.over?p.cards.map(heCard).join(""):`<span class="he-mini back">GB</span><span class="he-mini back">GB</span>`;
   return`<div class="he-player ${pos[i]} ${H.turn===i&&!H.over?"turn":""}">${d}<div class="he-avatar">${p.name==="PLAYER"?"YOU":p.name.slice(4,7)}</div>${act}<b>${p.name}</b><small>🪙 ${fmt(p.stack)}</small><small class="he-bet">BET ${fmt(p.bet)}</small><div>${cards}</div></div>`;
 }).join("");
 $("heBoard").innerHTML=H.board.map((c,i)=>`<div class="he-community ${H.communityRevealed[i]?"open":""}"><div class="he-ci"><div class="he-back">GB</div><div class="he-front ${c.s==="♥"||c.s==="♦"?"red":""}">${c.r}${c.s}</div></div></div>`).join("");
 const active=H.turn===H.hero&&!H.over,call=heCall();
 $("heCheck").disabled=!active||call>0;$("heCall").disabled=!active||call<=0;$("heBet").disabled=!active||call>0;$("heRaise").disabled=!active||call<=0;$("heFold").disabled=!active;
}
function heHero(){const p=H.players[H.hero];$("heHero").innerHTML=`<div class="he-you">YOU • 🪙 ${fmt(p.stack)} • BET ${fmt(p.bet)}</div><div class="he-myhand">${p.cards.map((c,i)=>`<div class="he-card ${H.heroRevealed[i]?"open":""}" onclick="heFlip(${i})"><div class="front ${c.s==="♥"||c.s==="♦"?"red":""}">${c.r}${c.s}</div><div class="back">GB</div></div>`).join("")}</div>`}
function heFlip(i){H.heroRevealed[i]=!H.heroRevealed[i];heHero();sfx("card")}
function heCall(){return Math.max(0,H.currentBet-H.players[H.hero].bet)}
function heOpenBet(mode){
 if(H.over||H.turn!==H.hero)return;
 const sl=$("heBetSlider"),p=H.players[H.hero],call=heCall();
 if(mode==="BET"){sl.min=Math.max(100,p.bet+100);sl.max=Math.max(sl.min,p.bet+p.stack);sl.value=Math.min(sl.min,p.bet+p.stack)}
 else {const min=Math.min(p.bet+p.stack,H.currentBet+H.lastRaiseSize);sl.min=Math.min(min,p.bet+p.stack);sl.max=p.bet+p.stack;sl.value=min}
 $("heBetMode").textContent=mode;$("heBetValue").textContent=fmt(Number(sl.value)||0);$("heBetBox").classList.remove("hidden");
}
function heSyncBet(v){$("heBetValue").textContent=fmt(Number(v)||0)}
function heConfirmBet(){const v=Number($("heBetSlider").value)||100,m=$("heBetMode").textContent;$("heBetBox").classList.add("hidden");heAction(m,v)}
function heAfter(p,action){
 p.action=action;H.pending.delete(H.turn);heRender();heHero();heCut(action);
 setTimeout(()=>{if(gbAlive(H.token)){pokerTurnSound();heNext()}},520);
}
function heResetPending(except){
 H.pending=new Set(H.players.map((_,i)=>i).filter(i=>i!==except&&!H.players[i].folded&&!H.players[i].allin));
}
function heAction(action,amount=0){
 if(H.over||H.turn!==H.hero)return;
 const p=H.players[H.hero],call=heCall();

 if(action==="FOLD"){p.folded=true;p.action="FOLD";H.heroAggro=Math.max(0,H.heroAggro-.15);heFinish("YOU FOLD");return}
 if(action==="CHECK"){if(call>0)return;pokerActionSound("CHECK");heAfter(p,"CHECK");return}

 if(action==="CALL"){
   const v=Math.min(call,p.stack);p.stack-=v;p.bet+=v;p.total+=v;H.pot+=v;if(p.stack===0)p.allin=true;
   pokerActionSound(p.allin?"ALL IN":"CALL");heAfter(p,p.allin?"ALL IN":"CALL");return;
 }

 if(action==="BET"||action==="RAISE"){
   const target=Math.min(amount,p.bet+p.stack);
   const minTarget=action==="BET"?Math.max(100,p.bet+100):H.currentBet+H.lastRaiseSize;
   if(target<minTarget&&target<p.bet+p.stack)return;
   const v=Math.max(0,target-p.bet);if(v<=0)return;
   const old=H.currentBet;
   p.stack-=v;p.bet+=v;p.total+=v;H.pot+=v;H.currentBet=Math.max(H.currentBet,p.bet);p.allin=p.stack===0;
   if(H.currentBet>old)H.lastRaiseSize=H.currentBet-old;
   H.raiseCount++;H.streetAggro++;H.heroAggro++;
   pokerActionSound(p.allin?"ALL IN":action);
   heResetPending(H.hero);heAfter(p,p.allin?"ALL IN":(action==="BET"&&old===0?"BET":"RAISE"));
 }
}
function heCpuLater(){
 clearTimeout(H.cpuTimer);
 const token=H.token,turn=H.turn;
 const delay=2300+Math.floor(Math.random()*1500);
 H.cpuTimer=setTimeout(()=>{
   H.cpuTimer=null;
   if(!gbAlive(token)||H.over||H.turn!==turn)return;
   const p=H.players[turn];
   if(!p||p.folded||p.allin)return;
   heCpu();
 },delay);
}
function heRankValue(c){return c.r==="A"?14:c.r==="K"?13:c.r==="Q"?12:c.r==="J"?11:+c.r}
function hePreflopStrength(p){
 const a=heRankValue(p.cards[0]),b=heRankValue(p.cards[1]),hi=Math.max(a,b),lo=Math.min(a,b);
 let s=(hi+lo)/28;
 if(a===b)s+=.46+hi/50;
 if(p.cards[0].s===p.cards[1].s)s+=.10;
 if(hi-lo<=2)s+=.075;
 if(hi>=14&&lo>=12)s+=.12;
 if(hi===14&&lo>=10)s+=.07;
 if(hi>=13&&lo>=10)s+=.05;
 return Math.min(1,s);
}
function heBoardTexture(){
 const b=H.board;if(!b.length)return 0;
 const suits={};const vals=b.map(heRankValue).sort((x,y)=>x-y);
 b.forEach(c=>suits[c.s]=(suits[c.s]||0)+1);
 const flush=Math.max(...Object.values(suits||{0:0}))>=2;
 let near=0;
 for(let i=0;i<vals.length;i++)for(let j=i+1;j<vals.length;j++)if(Math.abs(vals[i]-vals[j])<=2)near++;
 return Math.min(1,(flush?.32:0)+(near*.08)+(b.length===5?.22:0));
}
function heEquity(p){
 if(!H.board.length)return hePreflopStrength(p);
 try{
   const known=new Set(H.board.concat(p.cards).map(c=>c.r+c.s));
   const pool=H.deck.filter(c=>!known.has(c.r+c.s));
   let wins=0,ties=0,trials=40;
   for(let t=0;t<trials;t++){
     const sample=pool.slice().sort(()=>Math.random()-.5),opps=[],heroIndex=H.players.indexOf(p);let cur=0;
     for(let k=0;k<HE_N;k++){
       if(k===heroIndex)continue;
       const op=H.players[k];
       if(op.folded||op.allin)continue;
       opps.push([sample[cur++],sample[cur++]]);
     }
     const board=H.board.slice();while(board.length<5)board.push(sample[cur++]);
     const me=best5(p.cards.concat(board)).score;let beaten=false,tie=true;
     for(const oc of opps){
       const sc=best5(oc.concat(board)).score;
       if(sc>me){beaten=true;break}
       if(sc!==me)tie=false;
     }
     if(!beaten){if(tie)ties++;else wins++}
   }
   return (wins+ties*.5)/trials;
 }catch(e){return hePreflopStrength(p)}
}
function heBluffChance(p,eq,call){
 const texture=heBoardTexture();
 const style=p.style==="TRICKSTER"?1.65:p.style==="LAG"?1.3:p.style==="TAG"?.85:.55;
 const position=H.turn===H.hero?0:1;
 const pressure=call/Math.max(1,p.stack);
 let chance=p.bluff*style + texture*.10 + (H.street>0?.035:0);
 if(position)chance+=.035;
 if(H.heroAggro>1)chance+=.045;
 if(eq<.30)chance*=1.1;
 if(pressure>.06)chance*=.65;
 return Math.min(.32,Math.max(.01,chance));
}
function heCpu(){
 H.cpuTimer=null;
 if(H.over||H.turn===H.hero||!gbAlive(H.token))return;
 const i=H.turn,p=H.players[i];
 if(!p||p.folded||p.allin)return;
 const call=Math.max(0,H.currentBet-p.bet),eq=heEquity(p),pressure=call/Math.max(1,p.stack),bluff=heBluffChance(p,eq,call);
 let action="CHECK",amount=0;

 // Strong hands: value bet / value raise.
 if(p.stack<=0){p.allin=true;action="ALL IN"}
 else if(call>0){
   const canBluffRaise=Math.random()<bluff && H.currentBet>0;
   if(eq<.23 && canBluffRaise){
     const raiseSize=Math.max(H.lastRaiseSize,Math.max(100,Math.floor(H.pot*.65/100)*100));
     amount=Math.min(p.bet+p.stack,H.currentBet+raiseSize);action="RAISE";
   }else if(eq<.25 && pressure>.028){
     action="FOLD";
   }else if(eq>.72 && Math.random()<.62){
     const raiseSize=Math.max(H.lastRaiseSize,Math.max(100,Math.floor(H.pot*.55/100)*100));
     amount=Math.min(p.bet+p.stack,H.currentBet+raiseSize);action="RAISE";
   }else if(eq>.48 || pressure<.055){
     action="CALL";
   }else if(eq>.35 && Math.random()<.22){
     action="CALL";
   }else{
     action="FOLD";
   }
 }else{
   const valueBet=eq>.70 && Math.random()<.66;
   const bluffBet=Math.random()<bluff;
   if(valueBet||bluffBet){
     const base=bluffBet&&!valueBet ? Math.max(100,Math.floor(H.pot*.5/100)*100)
       : Math.max(100,Math.floor(Math.max(H.pot*.62,H.lastRaiseSize)/100)*100);
     amount=Math.min(p.bet+p.stack,Math.max(base,p.bet+100));
     action="BET";
   }else if(eq>.55 && Math.random()<.25){
     // Delayed trap: strong-ish hands occasionally CHECK behind to induce.
     action="CHECK";
   }else{
     action="CHECK";
   }
 }

 if(action==="CALL"){
   const v=Math.min(call,p.stack);p.stack-=v;p.bet+=v;p.total+=v;H.pot+=v;p.allin=p.stack===0;
 }else if(action==="BET"||action==="RAISE"){
   const old=H.currentBet;
   const minTarget=action==="BET"?Math.max(100,p.bet+100):H.currentBet+H.lastRaiseSize;
   const target=Math.min(p.bet+p.stack,Math.max(minTarget,amount));
   const v=Math.max(0,target-p.bet);
   if(v<=0){action="CHECK"}
   else{
     p.stack-=v;p.bet+=v;p.total+=v;H.pot+=v;H.currentBet=Math.max(H.currentBet,p.bet);
     if(H.currentBet>old)H.lastRaiseSize=H.currentBet-old;
     p.allin=p.stack===0;H.streetAggro++;if(action==="RAISE")p.confidence=Math.min(1,p.confidence+.08);
     heResetPending(i);
   }
 }

 p.action=p.allin?"ALL IN":action;
 p.history.push(action);
 if(action==="FOLD")p.confidence=Math.max(0,p.confidence-.06);
 if(action==="FOLD")p.folded=true;
 H.pending.delete(i);
 pokerActionSound(p.action);heRender();heCut(`${p.name} • ${p.action}`);
 setTimeout(()=>{if(gbAlive(H.token))heNext()},p.action==="FOLD"||p.action==="ALL IN"?450:2200+Math.floor(Math.random()*1300));
}
function heNext(){
 clearTimeout(H.cpuTimer);H.cpuTimer=null;
 if(H.over||!gbAlive(H.token))return;
 const contenders=H.players.filter(p=>!p.folded);const active=contenders.filter(p=>!p.allin);if(contenders.length<=1){heFinish(`${contenders[0]?.name||"CPU"} WINS`);return}
 if(active.length===0){heShowdown();return}
 if(H.pending.size===0){if(H.street<3)heStreet();else heShowdown();return}
 let n=H.turn;for(let k=0;k<HE_N;k++){n=(n+1)%HE_N;if(H.pending.has(n)&&!H.players[n].folded&&!H.players[n].allin)break}
 H.turn=n;heRender();heHero();if(H.turn===H.hero)heTimer();else heCpuLater();
}
function heStreet(){
 clearTimeout(H.cpuTimer);H.cpuTimer=null;
 H.street++;debugLog("POKER","STREET",{street:["","FLOP","TURN","RIVER"][H.street]||"SHOWDOWN",pot:H.pot});H.currentBet=0;H.raiseCount=0;H.lastRaiseSize=100;H.streetAggro=0;H.players.forEach(p=>p.bet=0);
 if(H.street===1)H.board=[H.deck.pop(),H.deck.pop(),H.deck.pop()];else H.board.push(H.deck.pop());
 H.communityRevealed=H.board.map(()=>false);heRender();heCut(["","FLOP","TURN","RIVER"][H.street]);
 let i=0;const reveal=()=>{
   if(!gbAlive(H.token)||H.over)return;
   if(i<H.board.length){H.communityRevealed[i]=true;heRender();sfx("card");i++;H.advanceTimer=setTimeout(reveal,360);return}
   const live=H.players.map((p,idx)=>idx).filter(idx=>!pFold(idx));
   H.pending=new Set(live.filter(idx=>!H.players[idx].allin));
   if(H.pending.size===0){heShowdown();return}
   H.turn=(H.button+1)%HE_N;while(!H.pending.has(H.turn))H.turn=(H.turn+1)%HE_N;
   heRender();if(H.turn===H.hero)heTimer();else heCpuLater();
 };
 H.advanceTimer=setTimeout(reveal,320);
}
function pFold(i){return H.players[i].folded||H.players[i].allin}
function heTimer(){
 cancelAnimationFrame(H.timerId);const token=H.token,start=performance.now(),el=$("heTimerBar");
 if(el)el.style.width="0%";
 const tick=()=>{if(H.over||H.turn!==H.hero||!gbAlive(token))return;const e=$("heTimerBar");if(!e)return;const pct=Math.min(100,(performance.now()-start)/7000*100);e.style.width=pct+"%";if(pct>=100){heAction("FOLD");return}H.timerId=requestAnimationFrame(tick)};
 H.timerId=requestAnimationFrame(tick);
}
function heShowdown(){
 clearTimeout(H.cpuTimer);H.cpuTimer=null;
 debugLog("POKER","SHOWDOWN",{pot:H.pot});H.over=true;cancelAnimationFrame(H.timerId);H.street=4;H.communityRevealed=H.board.map(()=>true);H.heroRevealed=[true,true];
 const live=H.players.filter(p=>!p.folded),ranked=live.map(p=>({p,r:best5([...p.cards,...H.board])})).sort((a,b)=>b.r.score-a.r.score),best=ranked[0].r.score,winners=ranked.filter(x=>x.r.score===best),share=Math.floor(H.pot/winners.length);
 winners.forEach(x=>x.p.stack+=share);heRender();heHero();heFinishOverlay(winners.some(x=>x.p===H.players[H.hero])?"YOU WIN":"SHOWDOWN");
}
function heFinish(text){clearTimeout(H.cpuTimer);H.cpuTimer=null;H.over=true;cancelAnimationFrame(H.timerId);clearTimeout(H.advanceTimer);heRender();heHero();heFinishOverlay(text)}
function heFinishOverlay(text){$("heStatus").textContent=text;heCut(text);$("heNext").classList.remove("hidden")}
function heJoinNext(){H.button=(H.button+1)%HE_N;$("heNext").classList.add("hidden");$("heStatus").textContent="";heStart()}
function heCut(t){const e=$("heCut");if(!e)return;e.textContent=t;e.classList.remove("hidden");void e.offsetWidth;e.classList.add("show");setTimeout(()=>e.classList.add("hidden"),900)}
function best5(cards){const out=[];function r(st,a){if(a.length===5){out.push(a.slice());return}for(let i=st;i<cards.length;i++){a.push(cards[i]);r(i+1,a);a.pop()}}r(0,[]);let b=null;for(const x of out){const q=handRank(x);if(!b||q.score>b.score)b=q}return b}
function handRank(cs){
 const rv=c=>c.r==="A"?14:c.r==="K"?13:c.r==="Q"?12:c.r==="J"?11:+c.r;
 const vals=cs.map(rv).sort((a,b)=>b-a),cnt={};vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);
 const flush=cs.every(c=>c.s===cs[0].s),u=[...new Set(vals)],uniq=u.includes(14)?[...u,1]:u;let straight=0;
 for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){straight=uniq[i];break}
 const groups=Object.entries(cnt).map(([v,n])=>({v:+v,n})).sort((a,b)=>b.n-a.n||b.v-a.v);
 const kick=[...vals];
 if(flush&&straight)return{score:800000+straight,name:"STRAIGHT FLUSH"};
 if(groups[0].n===4){const k=groups.filter(g=>g.n!==4).map(g=>g.v).sort((a,b)=>b-a)[0]||0;return{score:700000+groups[0].v*100+k,name:"FOUR OF A KIND"}}
 if(groups[0].n===3&&groups.some(g=>g.n>=2&&g.v!==groups[0].v))return{score:600000+groups[0].v*100+groups.find(g=>g.n>=2&&g.v!==groups[0].v).v,name:"FULL HOUSE"}
 if(flush)return{score:500000+kick.reduce((s,v,j)=>s+v*Math.pow(15,4-j),0),name:"FLUSH"};
 if(straight)return{score:400000+straight,name:"STRAIGHT"};
 if(groups[0].n===3)return{score:300000+groups[0].v*225+kick.filter(v=>v!==groups[0].v).slice(0,2).reduce((s,v,j)=>s+v*Math.pow(15,1-j),0),name:"THREE OF A KIND"};
 const pairs=groups.filter(g=>g.n===2).sort((a,b)=>b.v-a.v);
 if(pairs.length>=2)return{score:200000+pairs[0].v*225+pairs[1].v*15+kick.find(v=>v!==pairs[0].v&&v!==pairs[1].v),name:"TWO PAIR"};
 if(pairs.length===1){const ks=kick.filter(v=>v!==pairs[0].v).slice(0,3);return{score:100000+pairs[0].v*3375+ks[0]*225+ks[1]*15+ks[2],name:"ONE PAIR"}}
 return{score:kick.reduce((s,v,j)=>s+v*Math.pow(15,4-j),0),name:"HIGH CARD"};
}
let GB_ROULETTE_BUSY=false;
function rouletteSpin(choice){
 if(GB_ROULETTE_BUSY)return;
 const b=wager($("bet")?.value);if(!b)return;
 GB_ROULETTE_BUSY=true;
 const token=GB_GAME_TOKEN,w=$("rouletteWheel"),ball=$("rouletteBall"),res=$("res"),numEl=$("rouletteNumber"),colEl=$("rouletteColor");
 if(!w||!ball||!res){GB_ROULETTE_BUSY=false;debugLog("ERROR","ROULETTE DOM MISSING");return}
 const pockets=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
 const red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
 const idx=Math.floor(Math.random()*pockets.length),n=pockets[idx],color=n===0?"green":red.includes(n)?"red":"black";
 res.textContent="NO MORE BETS";numEl.textContent="—";colEl.textContent="SPINNING";sfx("roulette");
 const start=performance.now(),duration=5200,finalWheel=360*7-idx*(360/37),finalBall=360*11+idx*(360/37);
 let raf;
 const tick=now=>{
   if(!gbAlive(token)){GB_ROULETTE_BUSY=false;return}
   const p=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-p,3);
   const wheelAngle=360*7*ease-(360*7+idx*(360/37))*ease; // exact selected pocket alignment, no end snap
   const ballAngle=360*11*ease+finalBall*ease;
   w.style.transform=`rotate(${wheelAngle}deg)`;
   ball.style.transform=`rotate(${ballAngle}deg) translateY(-108px)`;
   if(p<1){raf=requestAnimationFrame(tick);return}
   w.style.transform=`rotate(${-idx*(360/37)}deg)`;
   ball.style.transform=`rotate(${-idx*(360/37)}deg) translateY(-108px)`;
   numEl.textContent=String(n);colEl.textContent=color.toUpperCase();
   const win=color===choice;res.textContent=`${n} • ${color.toUpperCase()} • ${win?"WIN":"LOSE"}`;
   settle(b,win?b*(choice==="green"?14:2):0,"ROULETTE");sfx(win?"win":"lose");if(win&&choice==="green")puchun();GB_ROULETTE_BUSY=false;
 };
 raf=requestAnimationFrame(tick);
}
function roulette(c){return rouletteSpin(c)}

document.addEventListener("DOMContentLoaded",()=>{
  try{
    if(typeof render==="function")render();
    debugLog("BOOT","APPLICATION INITIALIZED",{coins:S.coins});
  }catch(e){debugLog("ERROR","INITIALIZATION FAILED",{error:String(e),stack:e.stack})}
});

(function(){
 document.addEventListener("pointerdown",function(e){
   const b=e.target.closest("button");
   if(b&&navigator.vibrate){try{navigator.vibrate(7)}catch(_){}}
 },{passive:true});
})();

/* ===== REAL APP TITLE / LOBBY SHELL ===== */
(function(){
  const profileKey='gb_profile_v2';
  function prof(){try{return JSON.parse(localStorage.getItem(profileKey))||{name:'PLAYER',avatar:'GB',games:0,wins:0}}catch(e){return{name:'PLAYER',avatar:'GB',games:0,wins:0}}}
  function saveProf(x){localStorage.setItem(profileKey,JSON.stringify(x))}
  function showLobby(){document.getElementById('appSplash')?.classList.add('hide');document.getElementById('appLobby')?.classList.remove('hidden');renderProfile()}
  function renderProfile(){const p=prof();const n=document.getElementById('playerName'),a=document.getElementById('avatarText'),m=document.getElementById('profileMeta');if(n)n.textContent=p.name;if(a)a.textContent=(p.avatar||'GB').slice(0,3).toUpperCase();if(m)m.textContent=p.name+' • LV.'+(Math.floor((p.games||0)/10)+1)}
  async function start(){const b=document.getElementById('tapStart'),box=document.getElementById('loadBox'),bar=document.getElementById('loadFill'),pct=document.getElementById('loadPct'),txt=document.getElementById('loadText'),detail=document.getElementById('loadDetail');b.classList.add('hidden');box.classList.remove('hidden');const assets=['style.css','app.js','click.wav','chip.wav','card.wav','spin.wav','roulette.wav','dice.wav','flip.wav','win.wav','lose.wav','jackpot.wav','crash.wav'];for(let i=0;i<assets.length;i++){txt.textContent=i<3?'INITIALIZING':i<assets.length-2?'LOADING ASSETS':'FINALIZING';detail.textContent='Loading '+assets[i];try{await fetch(assets[i],{cache:'no-store'})}catch(e){try{debugLog('WARN','ASSET LOAD WARNING',{asset:assets[i]})}catch(_){} }const q=Math.round((i+1)/assets.length*100);bar.style.width=q+'%';pct.textContent=q+'%';await new Promise(r=>setTimeout(r,55))}txt.textContent='READY';detail.textContent='GAME RUNTIME ONLINE';await new Promise(r=>setTimeout(r,350));showLobby()}
  function openSocial(type){const o=document.getElementById('socialOverlay'),p=document.getElementById('socialPanel');o.classList.remove('hidden');if(type==='profile'){const x=prof();p.innerHTML='<h2>PROFILE</h2><label>PLAYER NAME</label><input id="pname" maxlength="16" value="'+String(x.name).replace(/"/g,'&quot;')+'"><label>AVATAR TAG</label><input id="pavatar" maxlength="3" value="'+String(x.avatar).replace(/"/g,'&quot;')+'"><div class="socialActions"><button class="primary" id="saveP">SAVE</button><button id="closeP">CLOSE</button></div>';document.getElementById('saveP').onclick=()=>{x.name=(document.getElementById('pname').value||'PLAYER').trim()||'PLAYER';x.avatar=(document.getElementById('pavatar').value||'GB').trim().slice(0,3).toUpperCase()||'GB';saveProf(x);renderProfile();o.classList.add('hidden')};document.getElementById('closeP').onclick=()=>o.classList.add('hidden')}
  else if(type==='friends'){p.innerHTML='<h2>FRIENDS</h2><p style="color:#777;font-size:10px">Friend system is ready for the online backend.</p><label>ADD FRIEND NAME</label><input id="friendName" maxlength="16" placeholder="PLAYER"><div class="socialActions"><button class="primary" onclick="this.textContent=\'ADDED\'">ADD</button><button id="closeF">CLOSE</button></div>';document.getElementById('closeF').onclick=()=>o.classList.add('hidden')}
  else{const code=Math.random().toString(36).slice(2,8).toUpperCase(),url=location.origin+location.pathname+'#room='+code;p.innerHTML='<h2>PRIVATE ROOM</h2><p style="color:#777;font-size:10px">Share this URL when the online server is connected.</p><div class="roomCode"><small>ROOM CODE</small><strong>'+code+'</strong></div><div class="socialActions"><button class="primary" id="copyRoom">COPY URL</button><button id="closeR">CLOSE</button></div>';document.getElementById('copyRoom').onclick=()=>navigator.clipboard?.writeText(url);document.getElementById('closeR').onclick=()=>o.classList.add('hidden')}}
  document.addEventListener('DOMContentLoaded',()=>{document.getElementById('tapStart')?.addEventListener('click',start);document.getElementById('profileBtn')?.addEventListener('click',()=>openSocial('profile'));document.getElementById('profileCard')?.addEventListener('click',()=>openSocial('profile'));document.getElementById('friendsBtn')?.addEventListener('click',()=>openSocial('friends'));document.getElementById('lobbyDebugBtn')?.addEventListener('click',toggleDebug);document.getElementById('roomBtn')?.addEventListener('click',()=>openSocial('room'));document.querySelectorAll('.lobbyGrid button').forEach(b=>b.addEventListener('click',()=>{const p=prof();p.games=(p.games||0)+1;saveProf(p);renderProfile();document.getElementById('appLobby').classList.add('hidden');openGame(b.dataset.game)}));document.querySelectorAll('#lobbyTabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#lobbyTabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.lobbyGrid button').forEach(g=>g.style.display=b.dataset.cat==='all'||g.dataset.cat===b.dataset.cat?'flex':'none')}));});
})();

(function(){
  function syncEmergency(){
    var body=document.getElementById("debugEmergencyBody");
    if(body)body.textContent=(window.__GB_DEBUG_LINES||[]).join("\n");
  }
  document.addEventListener("DOMContentLoaded",function(){
    var b=document.getElementById("debugEmergency");
    var p=document.getElementById("debugEmergencyPanel");
    if(b)b.addEventListener("click",function(){syncEmergency();if(p)p.classList.remove("hidden");});
  });
})();
