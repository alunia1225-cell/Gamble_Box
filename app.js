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

let CRASH={running:false,x:1,timer:null,bet:0};
function crashStart(){
  if(CRASH.running)return;const b=wager($("bet").value);if(!b)return;
  CRASH={running:true,x:1,timer:null,bet:b};$("res").textContent="RUNNING…";sfx("click");
  const path=$("crashLine");let t=0;
  CRASH.timer=setInterval(()=>{t+=.075;CRASH.x=1+Math.pow(t,1.32)*(.6+Math.random()*.08);const px=Math.min(570,t*105),py=Math.max(22,280-(CRASH.x-1)*46);path.setAttribute("d",`M0 280 C${px*.22} ${280-py*.12},${px*.56} ${280-py*.68},${px} ${py}`);$("crashX").textContent=CRASH.x.toFixed(2)+"x";if(Math.random()<.006||CRASH.x>30){clearInterval(CRASH.timer);CRASH.running=false;$("res").textContent=`CRASHED @ ${CRASH.x.toFixed(2)}x`;settle(b,0,"CRASH");sfx("crash")}},80);
}
function crashCashout(){
  if(!CRASH.running)return;clearInterval(CRASH.timer);CRASH.running=false;const payout=Math.floor(CRASH.bet*CRASH.x);$("res").textContent=`CASH OUT ${CRASH.x.toFixed(2)}x — +${fmt(payout)}`;settle(CRASH.bet,payout,"CRASH");sfx("win");
}
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
slot(){gameBody.innerHTML=betbox()+`<div class="reels"><div class="reel" id="r1">7️⃣</div><div class="reel" id="r2">7️⃣</div><div class="reel" id="r3">7️⃣</div></div><button onclick="slotSpin()">SPIN</button><div id="res" class="result"></div>`},
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
function hCard(c,index){const revealed=!!(H.heroRevealed&&H.heroRevealed[index]);return `<div class="poker-flip dealt ${revealed?"is-revealed":""}" onclick="flipHeroCard(${index})"><div class="poker-face poker-back-face">GB</div><div class="poker-face poker-front-face ${c.s==="♥"||c.s==="♦"?"red":""}">${c.r}${c.s}</div></div>`}
function flipHeroCard(index){if(!H.heroRevealed)H.heroRevealed=[false,false];H.heroRevealed[index]=!H.heroRevealed[index];sfx("card");debugLog&&debugLog("GAME","HOLD'EM card flip",{card:index+1,revealed:H.heroRevealed[index]});hRender()}
function holdemInit(){
  H={deck:deck(),hero:[],villain:[],board:[],pot:0,heroPaid:0,villainPaid:0,street:0,over:false,button:Math.random()<.5?"YOU":"CPU",turn:null,currentBet:0,heroRevealed:[false,false]};
  document.getElementById("gameBody").innerHTML=`
  <div class="felt holdem-felt">
    <div class="poker-topbar"><span class="street" id="hstreet">PRE-FLOP</span><span id="hposition" class="position-badge"></span></div>
    <div class="dealer-seat"><div class="seat-title">CPU <span id="cpuTurn" class="turn-light"></span></div><div id="villain" class="holdem-row"></div><div class="stackline">STACK <b id="cpuStack">10,000</b></div></div>
    <div class="pot"><span class="chip-stack-mini">● ● ●</span> POT <span id="hpot">0</span></div>
    <div class="board-wrap"><div class="board-label">BOARD</div><div id="board" class="holdem-row board-cards"></div></div>
    <div class="hero-seat"><div class="seat-title">YOU <span id="youTurn" class="turn-light"></span></div><div id="hero" class="holdem-row"></div><div class="stackline">STACK <b id="heroStack">0</b></div></div>
    <div class="chip-tray"><button onclick="hBet(100)">🪙 100</button><button onclick="hBet(500)">🪙 500</button><button onclick="hBet(1000)">🪙 1K</button><button onclick="hRaise()">RAISE</button><button onclick="hFold()">FOLD</button></div>
    <div class="raisebox">
  <div class="raise-head"><span>RAISE</span><b id="raiseValue">100</b></div>
  <input id="hraise" class="bet-slider" type="range" min="100" max="1000" step="100" value="100" oninput="updateRaiseSlider(this.value)">
  <div class="bet-scale"><span>100</span><span>1,000</span></div>
</div>
    <div class="actions"><button onclick="hCheck()">CHECK / CALL</button></div>
    <div id="hstatus" class="result"></div>
  </div>`;
  hStart();
}
function hStart(){
  const ante=100;if(S.coins<ante){$("hstatus").textContent="100 COIN以上必要";return}
  H.hero=[H.deck.pop(),H.deck.pop()];H.villain=[H.deck.pop(),H.deck.pop()];
  S.coins-=ante;S.wagered+=ante;H.heroPaid=ante;H.villainPaid=ante;H.pot=ante*2;
  H.turn=H.button==="YOU"?"YOU":"CPU";hRender();sfx("deal");if(H.turn==="CPU")setTimeout(hCpu,700)
}
function hRender(){
  const names=["PRE-FLOP","FLOP","TURN","RIVER","SHOWDOWN"];
  $("hstreet").textContent=names[H.street];$("hpot").textContent=fmt(H.pot);
  $("hero").innerHTML=H.hero.map((card,i)=>hCard(card,i)).join("");
  $("villain").innerHTML=H.over?H.villain.map(c=>hCard(c)).join(""):'<div class="card back">?</div><div class="card back">?</div>';
  $("board").innerHTML=H.board.map(c=>hCard(c)).join("");
  $("heroStack").textContent=fmt(S.coins);$("cpuStack").textContent=fmt(Math.max(0,10000-H.villainPaid));
  $("hposition").textContent=H.button==="YOU"?"DEALER BUTTON: YOU":"DEALER BUTTON: CPU";
  $("youTurn").classList.toggle("on",H.turn==="YOU"&&!H.over);$("cpuTurn").classList.toggle("on",H.turn==="CPU"&&!H.over);
}
function hNeedCall(){return Math.max(0,H.villainPaid-H.heroPaid)}
function hCheck(){
  if(H.over||H.turn!=="YOU")return;
  const call=hNeedCall();if(call>0){if(S.coins<call){$("hstatus").textContent="COIN不足";return}S.coins-=call;S.wagered+=call;H.heroPaid+=call;H.pot+=call;sfx("chip")}else sfx("click");
  H.turn="CPU";hRender();setTimeout(hCpu,600)
}
function hBet(amount){
  if(H.over||H.turn!=="YOU")return;
  const call=hNeedCall(),need=call+amount;if(S.coins<need){$("hstatus").textContent="COIN不足";return}
  S.coins-=need;S.wagered+=need;H.heroPaid+=need;H.pot+=need;H.currentBet=amount;sfx("chip");debugLog&&debugLog("GAME","HOLD'EM chips placed",{amount,pot:H.pot});
  H.turn="CPU";hRender();setTimeout(()=>hCpu(true),700)
}
function updateRaiseSlider(v){const n=Number(v)||100;const e=$("raiseValue");if(e)e.textContent=fmt(n)}
function hRaiseCustom(){hBet(Math.max(100,Number($("hraise").value)||100))}
function hRaise(){hBet(Math.max(100,H.currentBet*2||200))}
function hFold(){if(H.over||H.turn!=="YOU")return;H.over=true;H.turn=null;S.coins+=H.pot;save();$("hstatus").textContent="FOLD — CPU WINS";sfx("lose");hRender()}
function hCpu(aggressive=false){
  if(H.over)return;
  const call=hNeedCall(),strength=Math.random();
  if(strength<.18&&call>0){H.over=true;H.turn=null;S.coins+=H.pot;save();$("hstatus").textContent="CPU FOLDS — YOU WIN";sfx("win");hRender();return}
  if(call>0){H.villainPaid+=call;H.pot+=call;sfx("chip")}
  if(aggressive){const extra=Math.min(500,Math.max(100,Math.floor(Math.random()*400)));H.villainPaid+=extra;H.pot+=extra;sfx("chip")}
  if(H.street<3){H.street++;if(H.street===1)H.board.push(H.deck.pop(),H.deck.pop(),H.deck.pop());else H.board.push(H.deck.pop());H.turn="YOU";hRender();sfx("card");$("hstatus").textContent="YOUR TURN — CHECK / BET / RAISE"}
  else showdown()
}
function best5(cards){let combos=[];function rec(start,arr){if(arr.length===5){combos.push(arr.slice());return}for(let i=start;i<cards.length;i++){arr.push(cards[i]);rec(i+1,arr);arr.pop()}}rec(0,[]);let best=null;for(const cc of combos){const r=handRank(cc);if(!best||r.score>best.score)best={score:r.score,name:r.name,cards:cc}}return best}
function handRank(cs){const vals=cs.map(c=>c.r==="A"?14:["K","Q","J"].includes(c.r)?({K:13,Q:12,J:11}[c.r]):+c.r).sort((a,b)=>b-a);const cnt={};vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);const flush=cs.every(c=>c.s===cs[0].s);const uniq=[...new Set(vals)];if(uniq.includes(14))uniq.push(1);let straight=0;for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){straight=uniq[i];break}const groups=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);if(flush&&straight)return{score:800+straight,name:"STRAIGHT FLUSH"};if(groups[0][1]===4)return{score:700+ +groups[0][0],name:"FOUR OF A KIND"};if(groups[0][1]===3&&groups[1][1]===2)return{score:600+ +groups[0][0],name:"FULL HOUSE"};if(flush)return{score:500+vals[0],name:"FLUSH"};if(straight)return{score:400+straight,name:"STRAIGHT"};if(groups[0][1]===3)return{score:300+ +groups[0][0],name:"THREE OF A KIND"};if(groups[0][1]===2&&groups[1][1]===2)return{score:200+Math.max(+groups[0][0],+groups[1][0]),name:"TWO PAIR"};if(groups[0][1]===2)return{score:100+ +groups[0][0],name:"ONE PAIR"};return{score:vals[0],name:"HIGH CARD"}}
function showdown(){H.over=true;H.turn=null;H.street=4;const a=best5([...H.hero,...H.board]),b=best5([...H.villain,...H.board]);let payout=0,msg;if(a.score>b.score){payout=H.pot*2;msg=`YOU WIN — ${a.name}`}else if(a.score===b.score){payout=H.pot;msg=`PUSH — ${a.name}`}else msg=`CPU WINS — ${b.name}`;$("hstatus").textContent=msg;settle(H.heroPaid,payout,"TEXAS HOLD'EM");sfx(payout>H.heroPaid?"win":payout===H.heroPaid?"click":"lose");hRender()}
function roulette(c){const b=wager($("bet").value);if(!b)return;const w=$("rouletteWheel"),ball=$("rouletteBall");sfx("roulette");$("res").textContent="WHEEL SPINNING…";w.classList.remove("spin-wheel");ball.classList.remove("spin-ball");void w.offsetWidth;void ball.offsetWidth;w.classList.add("spin-wheel");ball.classList.add("spin-ball");setTimeout(()=>{const n=Math.floor(Math.random()*37),red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n),co=n===0?"green":red?"red":"black",ok=co===c;$("res").textContent=`${n}　${co.toUpperCase()}　${ok?"WIN":"LOSE"}`;settle(b,ok?b*(c==="green"?14:2):0,"ROULETTE");sfx(ok?"win":"lose");if(c==="green"&&ok)puchun()},2600)}
function hl(c){let b=wager($("bet").value),n=1+Math.floor(Math.random()*13),ok=c==="high"?n>=8:n<=6;$("card").textContent=n;sfx("card");settle(b,ok?Math.floor(b*1.8):0,"HIGH & LOW");sfx(ok?"win":"lose")}
function ch(c){let b=wager($("bet").value),s=2+Math.floor(Math.random()*11),r=s%2?"半":"丁";$("res").textContent=`${s} → ${r}`;sfx("dice");settle(b,r===c?b*2:0,"丁半");sfx(r===c?"win":"lose")}
function coin(c){let b=wager($("bet").value),r=Math.random()<.5?"表":"裏";$("res").textContent=r;sfx("flip");settle(b,r===c?b*2:0,"COIN FLIP");sfx(r===c?"win":"lose")}
function lottery(){let b=wager(100);if(!b)return;let r=Math.random(),p=r<.002?100000:r<.022?10000:r<.147?500:0;$("res").textContent=p?`🎉 ${fmt(p)} COIN`:"MISS";settle(b,p,"LOTTERY");sfx(p>=10000?"jackpot":p?"win":"lose");if(p>=10000)puchun()}
function crashStart(){let b=wager($("bet").value);if(!b)return;multi=1;sfx("spin");clearInterval(timer);$("res").innerHTML=`<button onclick="cash()">CASH OUT</button>`;timer=setInterval(()=>{multi*=1+Math.random()*.055;$("mult").textContent=multi.toFixed(2)+"×";$("meter").style.width=Math.min(100,multi/8*100)+"%";if(Math.random()<.018)crash()},260)}
function crash(){clearInterval(timer);$("res").textContent="💥 CRASH";sfx("crash");settle(lastBet,0,"CRASH ×")}
function cash(){clearInterval(timer);$("res").textContent=`CASH OUT ${multi.toFixed(2)}×`;settle(lastBet,Math.floor(lastBet*multi),"CRASH ×");sfx(multi>=5?"jackpot":"win");if(multi>=10)puchun()}
function daily(){if(Date.now()-S.lastDaily<=86400000)return;S.coins+=1000;S.lastDaily=Date.now();save();$("res").textContent="+1,000 COIN";sfx("win")}
function buy(n,p){if(S.coins<p){$("res").textContent="INSUFFICIENT COINS";sfx("lose");return}S.coins-=p;S.items.push(n);save();$("res").textContent="PURCHASED: "+n;sfx("chip")}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");let f=b.dataset.filter;document.querySelectorAll(".gamecard").forEach(c=>c.style.display=f==="all"||c.dataset.cat===f?"":"none");sfx("click")});
document.addEventListener("pointerdown",()=>{let a=audio();if(a&&a.state==="suspended")a.resume()},{once:true});
render();

const GB_DEBUG=[];let GB_ERRORS=0,GB_GAMES=0;
function debugLog(type,message,data=null){if(type==="ERROR"||type==="PROMISE")GB_ERRORS++;if(type==="GAME")GB_GAMES++;GB_DEBUG.push({time:new Date().toLocaleTimeString("ja-JP",{hour12:false}),type,message,data});if(GB_DEBUG.length>300)GB_DEBUG.shift();const b=document.getElementById("debugBody");if(b)b.textContent=GB_DEBUG.map(x=>`[${x.time}] [${x.type}] ${x.message}${x.data!==null?"\n  "+JSON.stringify(x.data):""}`).join("\n\n");const n=document.getElementById("debugCount");if(n)n.textContent=GB_DEBUG.length;const e=document.getElementById("dbgErrors");if(e)e.textContent=GB_ERRORS;const g=document.getElementById("dbgGames");if(g)g.textContent=GB_GAMES;const ev=document.getElementById("dbgEvents");if(ev)ev.textContent=GB_DEBUG.length}
function toggleDebug(){const p=document.getElementById("debugPanel");if(!p)return;p.classList.toggle("hidden");debugLog("DEBUG",p.classList.contains("hidden")?"Panel closed":"Panel opened")}
async function copyDebug(){const text=GB_DEBUG.map(x=>`[${x.time}] [${x.type}] ${x.message}${x.data!==null?"\n  "+JSON.stringify(x.data):""}`).join("\n\n");try{await navigator.clipboard.writeText(text);debugLog("DEBUG","Log copied",{entries:GB_DEBUG.length})}catch(e){const t=document.createElement("textarea");t.value=text;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();debugLog("DEBUG","Log copied via fallback",{entries:GB_DEBUG.length})}}
function clearDebug(){GB_DEBUG.length=0;GB_ERRORS=0;GB_GAMES=0;debugLog("DEBUG","Log cleared")}
window.addEventListener("error",e=>debugLog("ERROR",e.message,{file:e.filename,line:e.lineno,column:e.colno}));
window.addEventListener("unhandledrejection",e=>debugLog("PROMISE",String(e.reason)));
document.addEventListener("DOMContentLoaded",()=>{const t=document.getElementById("debugToggle");if(t)t.addEventListener("click",toggleDebug);debugLog("BOOT","DEBUG HUD ONLINE",{version:"4.7.33"})});


/* ===== TEST MODE: INFINITE COINS ===== */
const TEST_MODE=true;
const TEST_COINS=9999;
function testCoins(){
  if(TEST_MODE){S.coins=TEST_COINS}
}
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
    if(typeof debugLog==="function")debugLog("BOOT","PREMIUM DEBUG HUD ONLINE",{version:"4.7.33",testMode:true});
  });
})();
