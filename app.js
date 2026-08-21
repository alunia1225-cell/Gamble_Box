const KEY="gb3_save";
const S=JSON.parse(localStorage.getItem(KEY)||'{"coins":10000,"wagered":0,"profit":0,"wins":0,"maxwin":0,"history":[],"lastDaily":0,"items":[],"sound":true}');
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

let CRASH={running:false,x:1,timer:null,bet:0,t:0};function crashStart(){if(CRASH.running)return;const b=wager($("bet").value);if(!b)return;CRASH={running:true,x:1,timer:null,bet:b,t:0};$("res").textContent="CLIMBING…";let last=performance.now();const loop=now=>{if(!CRASH.running)return;const dt=Math.min(50,now-last);last=now;CRASH.t+=dt/1000;CRASH.x=1+Math.pow(CRASH.t,1.38)*.72;const px=Math.min(580,25+CRASH.t*110),py=Math.max(20,280-(CRASH.x-1)*40);$("crashLine").setAttribute("d",`M0 280 C${px*.2} ${280-py*.15},${px*.5} ${280-py*.72},${px} ${py}`);$("crashDot").setAttribute("cx",px);$("crashDot").setAttribute("cy",py);$("crashX").textContent=CRASH.x.toFixed(2)+"x";if(CRASH.x>30||Math.random()<.0018){CRASH.running=false;$("res").textContent=`CRASHED @ ${CRASH.x.toFixed(2)}x`;settle(b,0,"CRASH");sfx("crash");return}requestAnimationFrame(loop)};requestAnimationFrame(loop)}function crashCashout(){if(!CRASH.running)return;CRASH.running=false;const payout=Math.floor(CRASH.bet*CRASH.x);$("res").textContent=`CASH OUT ${CRASH.x.toFixed(2)}x +${fmt(payout)}`;settle(CRASH.bet,payout,"CRASH");sfx("win")}
function choHan(pick){
  const b=wager($("bet").value);if(!b)return;
  const x=$("diceA"),y=$("diceB");$("res").textContent="SHAKING…";[x,y].forEach(e=>{e.classList.remove("dice-shake");void e.offsetWidth;e.classList.add("dice-shake")});sfx("dice");
  let n=0;const iv=setInterval(()=>{x.textContent=1+Math.floor(Math.random()*6);y.textContent=1+Math.floor(Math.random()*6);if(++n>=12){clearInterval(iv);const a=1+Math.floor(Math.random()*6),d=1+Math.floor(Math.random()*6),sum=a+d,side=sum%2===0?"cho":"han";x.textContent=a;y.textContent=d;$("res").textContent=`${a} + ${d} = ${sum} — ${side.toUpperCase()} / ${side===pick?"WIN":"LOSE"}`;settle(b,side===pick?b*2:0,"丁半");sfx(side===pick?"win":"lose")}},110);
}
function coinFlip(pick){
  const b=wager($("bet").value);if(!b)return;
  const c=$("coin3d");$("res").textContent="FLIPPING…";c.classList.remove("coin-flipping");void c.offsetWidth;c.classList.add("coin-flipping");sfx("flip");
  setTimeout(()=>{const result=Math.random()<.5?"heads":"tails",win=result===pick;c.classList.remove("coin-flipping");c.classList.toggle("show-tail",result==="tails");$("res").textContent=`${result.toUpperCase()} — ${win?"WIN":"LOSE"}`;settle(b,win?b*2:0,"COIN TOSS");sfx(win?"win":"lose")},2200);
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
function settle(b,p,g){let net=p-b;S.coins+=p;S.profit+=net;if(p>b){S.wins++;S.maxwin=Math.max(S.maxwin,net)}S.history.unshift({g,net,t:new Date().toLocaleTimeString()});S.history=S.history.slice(0,20);save();return net}
function render(){$("coins").textContent=fmt(S.coins);$("coins2").textContent=fmt(S.coins);$("profit").textContent=(S.profit>=0?"+":"")+fmt(S.profit);$("wagered").textContent=fmt(S.wagered);$("level").textContent=Math.floor(S.wagered/10000)+1;$("history").innerHTML=S.history.length?S.history.map(x=>`<div class="history-row"><span>${x.g}</span><b class="${x.net>=0?"win":"lose"}">${x.net>=0?"+":""}${fmt(x.net)}</b><small>${x.t}</small></div>`).join(""):"<div class='history-row'>NO DATA</div>";let names=["YOU","777_MASTER","BLACK_KING","LUCKY_ACE","HOUSE"];$("ranking").innerHTML=names.map((n,i)=>`<div class="rank-row"><span>#${i+1}　${n}</span><b>${fmt(i?250000-i*28000:S.maxwin)} COIN</b><small>${i?"ONLINE":"YOU"}</small></div>`).join("")}

function openGame(g){debugLog("GAME","Launch requested",{game:g});let title={slot:"ULTIMATE SLOTS",dice:"HIGH DICE",blackjack:"BLACKJACK",holdem:"TEXAS HOLD'EM",roulette:"ROULETTE",highlow:"HIGH & LOW",chohan:"丁半",coin:"COIN FLIP",lottery:"LOTTERY",multiplier:"CRASH ×",daily:"DAILY VAULT",shop:"CHIP SHOP"}[g];$("modalContent").innerHTML=`<div class="game"><div class="jackpot">GAMBLE BOX / ${title}</div><h2>${title}</h2><div id="gameBody"></div></div>`;$("modal").classList.remove("hidden");sfx("click");
try{if(typeof games[g]!=="function")throw new Error("Unknown game: "+g);games[g]();debugLog("GAME","Launch success",{game:g})}
catch(e){debugLog("ERROR","Game launch failed",{game:g,error:String(e),stack:e.stack});$("modalContent").innerHTML=`<div class="game"><h2>GAME ERROR</h2><pre class="debug-error">${String(e.stack||e)}</pre></div>`}}
function closeGame(){clearInterval(timer);$("modal").classList.add("hidden");sfx("click")}
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

const games={
slot(){
 document.getElementById("gameBody").innerHTML=betbox()+`<div class="anim-game slot-game"><div class="anim-title">GOLDEN REEL</div><div class="slot-machine"><div class="slot-top">★ JACKPOT ★</div><div class="reels"><div class="reel-window"><div id="reel1" class="reel">7</div></div><div class="reel-window"><div id="reel2" class="reel">7</div></div><div class="reel-window"><div id="reel3" class="reel">7</div></div></div><div class="payline"></div><button class="slot-spin" onclick="spinSlot()">SPIN</button></div><div id="res" class="result">PLACE YOUR BET</div></div>`;
},
dice(){gameBody.innerHTML=betbox()+`<div class="choices"><button onclick="dice('high')">HIGH ×1.8</button><button onclick="dice('low')">LOW ×1.8</button><button onclick="dice('exact')">EXACT ×5</button></div><div id="res" class="result">🎲</div>`},
blackjack(){
  document.getElementById("gameBody").innerHTML=betbox(100)+`
  <div class="felt bj-felt">
    <div class="street">BLACKJACK TABLE</div>
    <div class="bj-zone"><div class="bj-label">DEALER <span id="bjDealerValue">0</span></div><div id="dealer" class="holdem-row"></div></div>
    <div class="pot">BET <span id="bjbet">0</span></div>
    <div class="bj-zone"><div class="bj-label">YOU <span id="bjPlayerValue">0</span></div><div id="player" class="holdem-row"></div></div>
    <div class="actions"><button id="bjdeal" onclick="bjDeal()">DEAL</button><button id="bjhit" onclick="bjHit()" disabled>HIT</button><button id="bjstand" onclick="bjStand()" disabled>STAND</button><button id="bjdouble" onclick="bjDouble()" disabled>DOUBLE</button><button id="bjsplit" onclick="bjSplit()" disabled>SPLIT</button></div>
    <div id="bjres" class="result"></div>
  </div>`;
},
holdem(){holdemInit()},
roulette(){
  document.getElementById("gameBody").innerHTML=betbox()+`
  <div class="roulette-stage"><div class="roulette-wheel" id="rouletteWheel"><div class="wheel-center">GB</div><div class="wheel-numbers">0　32　15　19　4　21　2　25　17　34　6　27　13　36　11　30　8　23　10　5　24　16　33　1　20　14　31　9　22　18　29　7　28　12　35　3　26</div></div><div class="roulette-ball" id="rouletteBall"></div></div>
  <div class="choices roulette-bets"><button onclick="roulette('red')">🔴 RED ×2</button><button onclick="roulette('black')">⚫ BLACK ×2</button><button onclick="roulette('green')">🟢 ZERO ×14</button></div><div id="res" class="result">PLACE YOUR BET</div>`;
},
highlow(){gameBody.innerHTML=betbox()+`<div id="card" class="result">7</div><div class="choices"><button onclick="hl('high')">HIGH</button><button onclick="hl('low')">LOW</button></div>`},
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
lottery(){gameBody.innerHTML=`<p>ONE DRAW / 100 COIN</p><p>JACKPOT 100,000　•　1 / 500</p><p>GOLD 10,000　•　1 / 50</p><p>SILVER 500　•　約1 / 8</p><button onclick="lottery()">DRAW LOTTERY</button><div id="res" class="result">?</div>`},
multiplier(){gameBody.innerHTML=betbox()+`<div id="mult" class="result">1.00×</div><div class="meter"><i id="meter"></i></div><button onclick="crashStart()">START</button><div id="res"></div>`},
daily(){let ok=Date.now()-S.lastDaily>86400000;gameBody.innerHTML=`<p>${ok?"VAULT READY":"VAULT LOCKED"}</p><button ${ok?"":"disabled"} onclick="daily()">CLAIM 1,000</button><div id="res" class="result"></div>`},
shop(){gameBody.innerHTML=`<div class="shop-item">🎩 LUCKY HAT <button onclick="buy('Lucky Hat',3000)">3,000</button></div><div class="shop-item">💎 GOLD CHIP <button onclick="buy('Gold Chip',10000)">10,000</button></div><div class="shop-item">👑 JACKPOT CROWN <button onclick="buy('Crown',50000)">50,000</button></div><div id="res" class="result"></div>`}
};

function slotSpin(){let b=wager($("bet").value);if(!b)return;sfx("spin");let a=["🍒","🍋","🔔","💎","7️⃣"];for(let i=1;i<4;i++){setTimeout(()=>{$("r"+i).textContent=a[Math.floor(Math.random()*a.length)];sfx("spin")},i*260)}setTimeout(()=>{let r=[1,2,3].map(i=>$("r"+i).textContent),m=r[0]===r[1]&&r[1]===r[2]?(r[0]==="7️⃣"?50:15):r[0]===r[1]?3:0;$("res").textContent=m?`BIG WIN ×${m}`:"LOSE";settle(b,b*m,"ULTIMATE SLOTS");m?sfx(m>=15?"jackpot":"win"):sfx("lose");if(m>=15)puchun()},900)}
function dice(c){let b=wager($("bet").value);if(!b)return;sfx("dice");let d=1+Math.floor(Math.random()*6),ok=c==="exact"?d===6:c==="high"?d>=4:d<=3;$("res").textContent=`🎲 ${d} / ${ok?"WIN":"LOSE"}`;settle(b,ok?Math.floor(b*(c==="exact"?5:1.8)):0,"HIGH DICE");sfx(ok?"win":"lose")}
function deck(){let suits=["♠","♥","♦","♣"],ranks=["2","3","4","5","6","7","8","9","10","J","Q","K","A"],d=[];for(let s of suits)for(let r of ranks)d.push({s,r});return d.sort(()=>Math.random()-.5)}
function val(cards){let total=0,aces=0;cards.forEach(c=>{if(["J","Q","K"].includes(c.r))total+=10;else if(c.r==="A"){total+=11;aces++}else total+=+c.r});while(total>21&&aces--)total-=10;return total}
let BJ={};
function bjValueText(cards){
  let hard=0, aces=0;
  for(const c of cards){
    if(["J","Q","K"].includes(c.r)) hard+=10;
    else if(c.r==="A"){hard+=11;aces++}
    else hard+=Number(c.r);
  }
  let soft=hard, a=aces;
  while(soft>21&&a>0){soft-=10;a--}
  return aces>0 && soft!==hard ? `${soft} or ${hard}` : `${soft}`;
}
function bjCard(c,hidden=false){
  if(hidden)return '<div class="card back">?</div>';
  return `<div class="card ${c.s==="♥"||c.s==="♦"?"red":""} dealt">${c.r}${c.s}</div>`;
}
function bjRender(){
  $("player").innerHTML=BJ.p.map(c=>bjCard(c)).join("");
  $("dealer").innerHTML=BJ.d.map((c,i)=>bjCard(c,i===1&&!BJ.reveal)).join("");
  $("bjPlayerValue").textContent=bjValueText(BJ.p);
  $("bjDealerValue").textContent=BJ.reveal?bjValueText(BJ.d):bjValueText([BJ.d[0]]);
  $("bjbet").textContent=fmt(BJ.bet);
}
function bjActions(on){["bjhit","bjstand","bjdouble","bjsplit"].forEach(id=>$(id).disabled=!on)}
function bjDeal(){
  const b=wager($("bet").value);if(!b)return;
  BJ={deck:deck(),p:[],d:[],bet:b,reveal:false,over:false};
  BJ.p=[BJ.deck.pop(),BJ.deck.pop()];BJ.d=[BJ.deck.pop(),BJ.deck.pop()];
  $("bjdeal").disabled=true;bjRender();sfx("deal");
  $("bjsplit").disabled=!(BJ.p[0].r===BJ.p[1].r&&S.coins>=b);$("bjdouble").disabled=S.coins<b;
  if(val(BJ.p)===21){BJ.reveal=true;BJ.over=true;bjRender();$("bjres").textContent="BLACKJACK!";settle(BJ.bet,Math.floor(BJ.bet*2.5),"BLACKJACK");sfx("jackpot");puchun();bjActions(false);return}
  bjActions(true);
}
function bjHit(){if(BJ.over)return;BJ.p.push(BJ.deck.pop());sfx("card");bjRender();if(val(BJ.p)>21){BJ.reveal=true;BJ.over=true;bjRender();$("bjres").textContent="BUST";settle(BJ.bet,0,"BLACKJACK");sfx("lose");bjActions(false)}else if(val(BJ.p)===21)bjStand()}
function bjStand(){if(BJ.over)return;BJ.reveal=true;while(val(BJ.d)<17){BJ.d.push(BJ.deck.pop());sfx("card")}BJ.over=true;bjRender();bjResolve()}
function bjDouble(){if(BJ.over||S.coins<BJ.bet)return;S.coins-=BJ.bet;S.wagered+=BJ.bet;BJ.bet*=2;BJ.p.push(BJ.deck.pop());sfx("chip");if(val(BJ.p)>21){BJ.reveal=true;BJ.over=true;bjRender();$("bjres").textContent="DOUBLE BUST";settle(BJ.bet,0,"BLACKJACK");sfx("lose");bjActions(false);return}bjStand()}
function bjSplit(){debugLog&&debugLog("GAME","SPLIT requested",{supported:"single-hand demo mode"});$("bjres").textContent="SPLIT is reserved for the next hand";sfx("click")}
function bjResolve(){
  const pv=val(BJ.p),dv=val(BJ.d);let payout=0,msg;
  if(dv>21||pv>dv){msg="YOU WIN";payout=BJ.bet*2}else if(pv===dv){msg="PUSH";payout=BJ.bet}else msg="DEALER WINS";
  $("bjres").textContent=`${msg}　YOU ${pv} / DEALER ${dv}`;settle(BJ.bet,payout,"BLACKJACK");sfx(payout>BJ.bet?"win":payout===BJ.bet?"click":"lose");bjActions(false);$("bjdeal").disabled=false;
}
let H={};

function holdemNames(){return["CPU_RIVER","CPU_ACE","CPU_BOSS","CPU_QUEEN","CPU_BLUFF","CPU_TIGER"]}

function pokerActionSound(action){
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const ctx=new C();
    const tone=(f,d,type)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=f;g.gain.value=.035;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+d)};
    if(action==="CHECK"){tone(170,.10,"triangle");setTimeout(()=>tone(125,.07,"triangle"),45)}
    else if(["BET","CALL","RAISE","ALL IN"].includes(action)){tone(850,.055,"square");setTimeout(()=>tone(1250,.045,"square"),45)}
  }catch(e){}
}

function holdemInit(){
  const names=holdemNames();
  H={
    players:names.map(n=>({name:n,stack:9999,bet:0,total:0,folded:false,allin:false,cards:[],action:""})),
    hero:0,button:Math.floor(Math.random()*6),street:0,board:[],deck:deck(),pot:0,currentBet:0,
    turn:0,roundStart:0,heroRevealed:[false,false],communityRevealed:[],over:false,timerId:null
  };

  document.getElementById("gameBody").innerHTML=`
  <div class="felt holdem-pro">
    <div class="he-top"><span id="heStreet">PRE-FLOP</span><b id="hePot">POT 0</b><span id="heButton"></span></div>
    <div id="heTable" class="he-table"></div>
    <div class="he-board"><div id="heBoard" class="he-board-row"></div></div>
    <div class="he-my-label">YOUR HAND <small>• TAP CARD TO FLIP</small></div>
    <div id="heMyHand" class="he-my-hand"></div>
    <div class="he-actions">
      <button id="heCheck" onclick="heDo('CHECK')">CHECK</button>
      <button id="heBet" onclick="heOpenBet('BET')">BET</button>
      <button id="heCall" onclick="heDo('CALL')">CALL</button>
      <button id="heRaise" onclick="heOpenBet('RAISE')">RAISE</button>
      <button id="heFold" onclick="heDo('FOLD')">FOLD</button>
    </div>
    <div id="heBetBox" class="he-betbox hidden"><div><span id="heBetMode">BET</span> <b id="heBetValue">100</b></div><input id="heBetSlider" type="range" min="100" max="9999" step="100" value="100" oninput="heSyncBet(this.value)"><button onclick="heConfirmBet()">CONFIRM</button></div>
    <div class="he-timer"><i id="heTimerBar"></i></div>
    <div id="heCut" class="he-cut hidden"></div>
    <div id="hstatus" class="result"></div>
  </div>`;

  heDeal();
}

function heDeal(){
  const p=H.players;
  const sb=(H.button+1)%p.length,bb=(H.button+2)%p.length;
  hePut(sb,50,"BLIND");hePut(bb,100,"BLIND");
  for(const pl of p)pl.cards=[H.deck.pop(),H.deck.pop()];
  H.turn=(H.button+3)%p.length;
  heRender();heRenderMyHand();
  if(H.turn===H.hero)heStartTimer();else setTimeout(heCpu,450);
}

function hePut(i,n,action){
  const p=H.players[i],add=Math.min(n,p.stack);p.stack-=add;p.bet+=add;p.total+=add;H.pot+=add;if(action)p.action=action;
}

function heRender(){
  $("heStreet").textContent=["PRE-FLOP","FLOP","TURN","RIVER","SHOWDOWN"][H.street];
  $("hePot").textContent=`POT ${fmt(H.pot)}`;
  $("heButton").textContent=`BUTTON ${H.players[H.button].name}`;
  $("heTable").innerHTML=H.players.map((p,i)=>{
    const act=p.action?`<span class="he-act ${p.action==="FOLD"?"fold":p.action==="CHECK"||p.action==="CALL"?"passive":"aggressive"}">${p.action}</span>`:"";
    const d=i===H.button?`<span class="he-d">D</span>`:"";
    const cards=(i===H.hero||H.over)?p.cards.map(heMini).join(""):`<span class="he-mini back">GB</span><span class="he-mini back">GB</span>`;
    return `<div class="he-seat he-s${i+1} ${H.turn===i&&!H.over?"active":""}">
      <div class="he-avatar">${p.name.slice(4,7)}</div>${d}${act}
      <b class="he-name">${p.name}</b><small class="he-stack">🪙 ${fmt(p.stack)}</small><small class="he-bet">BET ${fmt(p.bet)}</small>
      <div class="he-hole">${cards}</div></div>`;
  }).join("");
  $("heBoard").innerHTML=H.board.map((card,i)=>`<div class="he-community ${H.communityRevealed[i]?"open":""}"><div class="he-ci"><div class="he-back">GB</div><div class="he-front ${card.s==="♥"||card.s==="♦"?"red":""}">${card.r}${card.s}</div></div></div>`).join("");
  const active=H.turn===H.hero&&!H.over;
  ["heCheck","heBet","heCall","heRaise","heFold"].forEach(id=>$(id).disabled=!active);
}

function heMini(c){return `<span class="he-mini ${c.s==="♥"||c.s==="♦"?"red":""}">${c.r}${c.s}</span>`}

function heRenderMyHand(){
  const p=H.players[H.hero];
  $("heMyHand").innerHTML=p.cards.map((c,i)=>`<div class="he-card ${H.heroRevealed[i]?"open":""}" onclick="heFlip(${i})"><div class="front ${c.s==="♥"||c.s==="♦"?"red":""}">${c.r}${c.s}</div><div class="back">GB</div></div>`).join("");
}

function heFlip(i){H.heroRevealed[i]=!H.heroRevealed[i];heRenderMyHand();sfx("card")}

function heCallAmount(){return Math.max(0,H.currentBet-H.players[H.hero].bet)}

function heOpenBet(mode){
  if(H.over||H.turn!==H.hero)return;
  const sl=$("heBetSlider"),min=mode==="RAISE"?Math.max(100,H.currentBet*2||200):100;
  sl.min=min;sl.max=Math.max(min,H.players[H.hero].stack);sl.step=sl.max<=1000?50:100;sl.value=min;
  $("heBetMode").textContent=mode;heSyncBet(min);$("heBetBox").classList.remove("hidden");
}
function heSyncBet(v){$("heBetValue").textContent=fmt(Number(v)||0)}
function heConfirmBet(){const n=Number($("heBetSlider").value)||100,m=$("heBetMode").textContent;$("heBetBox").classList.add("hidden");heDo(m,n)}

function heDo(action,amount=0){
  if(H.over||H.turn!==H.hero)return;
  const p=H.players[H.hero],call=heCallAmount();
  if(action==="FOLD"){p.folded=true;p.action="FOLD";pokerActionSound("CHECK");heEnd("FOLD — CPU WINS");return}
  if(action==="CHECK"){
    if(call>0){$("hstatus").textContent="CALL is required";return}
    p.action="CHECK";pokerActionSound("CHECK");
  }else if(action==="CALL"){
    const add=Math.min(call,p.stack);p.stack-=add;p.bet+=add;p.total+=add;H.pot+=add;p.action=add<call?"ALL IN":"CALL";pokerActionSound(p.action);
  }else if(action==="BET"||action==="RAISE"){
    const add=Math.min(amount,p.stack);
    if(add<Math.min(action==="RAISE"?Math.max(100,H.currentBet*2||100):100,p.stack))return;
    p.stack-=add;p.bet+=add;p.total+=add;H.pot+=add;H.currentBet=Math.max(H.currentBet,p.bet);p.action=p.stack===0?"ALL IN":action;pokerActionSound(p.action);
  }
  heRender();heRenderMyHand();heCut(p.action);
  setTimeout(heNext,350);
}

function heCpu(){
  if(H.over)return;
  const p=H.players[H.turn],call=Math.max(0,H.currentBet-p.bet),r=Math.random();
  if(p.stack<=0){p.allin=true;p.action="ALL IN"}
  else if(call>0&&r<.16){p.folded=true;p.action="FOLD"}
  else if(call>0&&r<.55){const add=Math.min(call,p.stack);p.stack-=add;p.bet+=add;p.total+=add;H.pot+=add;p.action=add<call?"ALL IN":"CALL"}
  else if(r<.72){p.action="CHECK"}
  else{const add=Math.min(p.stack,Math.max(100,(1+Math.floor(Math.random()*4))*100));p.stack-=add;p.bet+=add;p.total+=add;H.pot+=add;H.currentBet=Math.max(H.currentBet,p.bet);p.action=p.stack===0?"ALL IN":"RAISE"}
  pokerActionSound(p.action);heRender();heCut(`${p.name} • ${p.action}`);setTimeout(heNext,650);
}

function heNext(){
  if(H.over)return;
  let n=(H.turn+1)%H.players.length;
  for(let i=0;i<H.players.length;i++){if(!H.players[n].folded&&!H.players[n].allin)break;n=(n+1)%H.players.length}
  H.turn=n;
  const live=H.players.filter(p=>!p.folded&&!p.allin);
  if(live.length<=1){heShowdown();return}
  const matched=live.every(p=>p.bet===H.currentBet);
  if(matched){
    // Give every remaining player a chance when the round is complete.
    const next=H.players.findIndex((p,i)=>i===H.turn&&!p.folded&&!p.allin);
    if(H.street<3){heStreet();return}
    heShowdown();return;
  }
  heRender();
  if(H.turn===H.hero)heStartTimer();else setTimeout(heCpu,500);
}

function heStreet(){
  H.street++;H.currentBet=0;H.players.forEach(p=>p.bet=0);
  if(H.street===1)H.board.push(H.deck.pop(),H.deck.pop(),H.deck.pop());else H.board.push(H.deck.pop());
  H.communityRevealed=H.board.map(()=>false);heRender();heCut(["","FLOP","TURN","RIVER"][H.street]);sfx("card");
  setTimeout(()=>{H.communityRevealed=H.board.map(()=>true);heRender();H.turn=(H.button+1)%H.players.length;while(H.players[H.turn].folded||H.players[H.turn].allin)H.turn=(H.turn+1)%H.players.length;if(H.turn===H.hero)heStartTimer();else setTimeout(heCpu,500)},750);
}

function heStartTimer(){
  H.roundStart=performance.now();$("heTimerBar").style.width="0%";
  cancelAnimationFrame(H.timerId);
  const tick=()=>{if(H.over||H.turn!==H.hero)return;const pct=Math.min(100,(performance.now()-H.roundStart)/7000*100);$("heTimerBar").style.width=pct+"%";if(pct>=100){heDo("FOLD");return}H.timerId=requestAnimationFrame(tick)};H.timerId=requestAnimationFrame(tick);
}

function heCut(text){const e=$("heCut");if(!e)return;e.textContent=text;e.classList.remove("hidden");void e.offsetWidth;e.classList.add("show");setTimeout(()=>e.classList.add("hidden"),900)}

function heShowdown(){
  H.over=true;cancelAnimationFrame(H.timerId);H.street=4;H.communityRevealed=H.board.map(()=>true);H.heroRevealed=[true,true];
  const live=H.players.filter(p=>!p.folded);
  if(live.length===1){live[0].stack+=H.pot;heFinishText(`${live[0].name} WINS`);return}
  const ranks=live.map(p=>({p,r:best5([...p.cards,...H.board])})).sort((a,b)=>b.r.score-a.r.score);
  const winners=ranks.filter(x=>x.r.score===ranks[0].r.score),share=Math.floor(H.pot/winners.length);
  winners.forEach(x=>x.p.stack+=share);
  heRender();heRenderMyHand();heCut(winners.some(x=>x.p===H.players[H.hero])?"YOU WIN":"SHOWDOWN");sfx(winners.some(x=>x.p===H.players[H.hero])?"win":"lose");
}

function heFinishText(text){heRender();heRenderMyHand();$("hstatus").textContent=text;heCut(text);sfx("lose")}
function heEnd(text){H.over=true;cancelAnimationFrame(H.timerId);H.players.filter(p=>!p.folded).forEach(p=>p.stack+=H.pot);heFinishText(text)}

function roulette(c){const b=wager($("bet").value);if(!b)return;const w=$("rouletteWheel"),ball=$("rouletteBall"),res=$("res");const red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];const pockets=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];const n=pockets[Math.floor(Math.random()*pockets.length)];const color=n===0?"green":red.includes(n)?"red":"black";res.textContent="NO MORE BETS";w.classList.remove("spin-wheel");ball.classList.remove("spin-ball");void w.offsetWidth;void ball.offsetWidth;w.classList.add("spin-wheel");ball.classList.add("spin-ball");sfx("roulette");setTimeout(()=>{const win=color===c;res.textContent=`${n} • ${color.toUpperCase()} • ${win?"WIN":"LOSE"}`;settle(b,win?b*(c==="green"?14:2):0,"ROULETTE");sfx(win?"win":"lose");if(win&&c==="green")puchun()},4200)}
const _saveOriginal=save;
save=function(){if(TEST_MODE)S.coins=TEST_COINS;return _saveOriginal.apply(this,arguments)};

(function(){
  if(!TEST_MODE)return;
  const oldSetInterval=window.setInterval;
  oldSetInterval(()=>{try{S.coins=TEST_COINS; if(typeof save==="function")save()}catch(e){}},1000);
  document.addEventListener("DOMContentLoaded",()=>debugLog("TEST","INFINITE COINS ENABLED",{balance:TEST_COINS}));
})();

(function(){
  document.addEventListener("DOMContentLoaded",()=>{
    const t=document.getElementById("debugToggle");
    if(t&&!t.dataset.wired){t.dataset.wired="1";t.addEventListener("click",()=>{if(typeof toggleDebug==="function")toggleDebug();else{const p=document.getElementById("debugPanel");if(p)p.classList.toggle("hidden")}})}
    if(typeof debugLog==="function")debugLog("BOOT","PREMIUM DEBUG HUD ONLINE",{version:"4.4",testMode:true});
  });
})();
