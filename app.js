const S=JSON.parse(localStorage.getItem("gb_save")||'{"coins":10000,"wagered":0,"profit":0,"wins":0,"maxwin":0,"history":[],"lastDaily":0,"items":[]}');const $=id=>document.getElementById(id);
function save(){localStorage.setItem("gb_save",JSON.stringify(S));render()}
function fmt(n){return Math.floor(n).toLocaleString()}
function bet(v){v=Number(v);if(!Number.isFinite(v)||v<1||v>S.coins) return 0;S.coins-=v;S.wagered+=v;return v}
function settle(b,payout,game){const net=payout-b;S.coins+=payout;S.profit+=net;if(payout>b){S.wins++;S.maxwin=Math.max(S.maxwin,net)}S.history.unshift({game,net,t:new Date().toLocaleTimeString()});S.history=S.history.slice(0,15);save();return net}
function render(){$("coins").textContent=fmt(S.coins);$("wagered").textContent=fmt(S.wagered);$("profit").textContent=(S.profit>=0?"+":"")+fmt(S.profit);$("wins").textContent=S.wins;$("maxwin").textContent=fmt(S.maxwin);$("level").textContent=Math.floor(S.wagered/10000)+1;$("history").innerHTML=S.history.length?S.history.map(x=>`<div class="history-row"><span>${x.game}</span><span class="${x.net>=0?'win':'lose'}">${x.net>=0?'+':''}${fmt(x.net)}</span><small>${x.t}</small></div>`).join(""):"まだ履歴なし";$("ranking").innerHTML=["YOU","LUCKY_777","DEALER_X","BLACK_JACK"].map((n,i)=>`<div class="rank-row"><span>#${i+1}　${n}</span><b>${fmt(i?100000-i*17000:S.maxwin)} COIN</b></div>`).join("")}
function openGame(g){const names={slot:"🎰 スロット",dice:"🎲 サイコロ",blackjack:"🃏 ブラックジャック",poker:"♠️ ポーカー",roulette:"🎡 ルーレット",highlow:"📈 ハイ＆ロー",chohan:"🎯 丁半",coin:"🪙 コイントス",lottery:"🎟️ 宝くじ・抽選",multiplier:"🚀 倍率ゲーム",daily:"🎁 デイリーボーナス",shop:"🛒 景品ショップ"};$("modalContent").innerHTML=`<div class="game"><h2>${names[g]}</h2><div id="gameBody"></div></div>`;$("modal").classList.remove("hidden");games[g]()}
function closeGame(){$("modal").classList.add("hidden")}
function inputBet(def=100){return `<div class="betrow"><input id="bet" type="number" min="1" value="${def}"><button class="primary" onclick="play()">BET</button></div>`}
function setBody(x){$("gameBody").innerHTML=x}
const games={
slot(){setBody(inputBet()+`<div class="result" id="res">🍒 | 🍋 | 7️⃣</div><button class="primary" onclick="slotPlay()">SPIN</button>`);window.play=()=>slotPlay()},
dice(){setBody(inputBet()+`<div class="choices"><button class="choice" onclick="dicePlay('high')">HIGH 4-6 ×1.8</button><button class="choice" onclick="dicePlay('low')">LOW 1-3 ×1.8</button><button class="choice" onclick="dicePlay('exact')">EXACT ×5</button></div><div id="res" class="result">🎲</div>`)},
blackjack(){setBody(inputBet()+`<div id="bj" class="cards">—</div><button class="primary" onclick="bjPlay()">DEAL</button><div id="res"></div>`)},
poker(){setBody(inputBet()+`<div id="pk" class="cards">🂠 🂠 🂠 🂠 🂠</div><button class="primary" onclick="pokerPlay()">DRAW</button><div id="res"></div>`)},
roulette(){setBody(inputBet()+`<div class="choices"><button class="choice" onclick="roulettePlay('red')">🔴 RED ×2</button><button class="choice" onclick="roulettePlay('black')">⚫ BLACK ×2</button><button class="choice" onclick="roulettePlay('green')">🟢 0 ×14</button></div><div id="res" class="result">0-36</div>`)},
highlow(){setBody(inputBet()+`<div class="result" id="card">7</div><div class="choices"><button class="choice" onclick="hlPlay('high')">HIGH ×1.8</button><button class="choice" onclick="hlPlay('low')">LOW ×1.8</button></div>`)},
chohan(){setBody(inputBet()+`<div class="choices"><button class="choice" onclick="chPlay('丁')">丁 ×2</button><button class="choice" onclick="chPlay('半')">半 ×2</button></div><div id="res" class="result">🎯</div>`)},
coin(){setBody(inputBet()+`<div class="choices"><button class="choice" onclick="coinPlay('表')">表 ×2</button><button class="choice" onclick="coinPlay('裏')">裏 ×2</button></div><div id="res" class="result">🪙</div>`)},
lottery(){setBody(`<p>1回 <b>100 COIN</b></p><p>🎟️ JACKPOT 100,000（1/500）</p><p>🥇 10,000（1/50）</p><p>🥈 500（1/8）</p><button class="primary" onclick="lotteryPlay()">抽選する</button><div id="res" class="result">?</div>`)},
multiplier(){setBody(inputBet()+`<div class="result" id="mult">1.00×</div><button class="primary" onclick="multiStart()">START</button><div id="res"></div>`)},
daily(){const ready=Date.now()-S.lastDaily>86400000;setBody(`<p>${ready?"今日のボーナスを受け取れます。":"次のボーナスまで24時間。"}</p><button class="primary" ${ready?"":"disabled"} onclick="dailyClaim()">+1,000 COIN</button><div id="res"></div>`)},
shop(){setBody(`<p>仮想コインでコレクションを購入。</p><div class="shop-item">🎩 Lucky Hat <button onclick="buy('Lucky Hat',3000)">3,000</button></div><div class="shop-item">💎 Golden Chip <button onclick="buy('Golden Chip',10000)">10,000</button></div><div class="shop-item">👑 Jackpot Crown <button onclick="buy('Jackpot Crown',50000)">50,000</button></div><div id="res"></div>`)}
};
function slotPlay(){let b=bet(+$("bet").value);if(!b)return;let a=["🍒","🍋","🔔","💎","7️⃣"],r=[a[Math.floor(Math.random()*a.length)],a[Math.floor(Math.random()*a.length)],a[Math.floor(Math.random()*a.length)]];let p=r[0]===r[1]&&r[1]===r[2]?r[0]==="7️⃣"?50:15:r[0]===r[1]?3:0;$("res").textContent=r.join(" | ");settle(b,b*p,"スロット");if(p>=15)setTimeout(puchun,250)}
function dicePlay(c){let b=bet(+$("bet").value);if(!b)return;let d=1+Math.floor(Math.random()*6),win=c==="exact"?d===6:(c==="high"?d>=4:d<=3);$("res").textContent=`🎲 ${d} ${win?"WIN":"LOSE"}`;settle(b,win?Math.floor(b*(c==="exact"?5:1.8)):0,"サイコロ")}
function roulettePlay(c){let b=bet(+$("bet").value);if(!b)return;let n=Math.floor(Math.random()*37),red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n),color=n===0?"green":red?"red":"black",win=color===c;$("res").textContent=`${n} ${color} ${win?"WIN":"LOSE"}`;settle(b,win?b*(c==="green"?14:2):0,"ルーレット");if(c==="green"&&win)puchun()}
function chPlay(c){let b=bet(+$("bet").value);if(!b)return;let s=1+Math.floor(Math.random()*6)+1+Math.floor(Math.random()*6),r=s%2?"半":"丁";$("res").textContent=`${s} → ${r} ${r===c?"WIN":"LOSE"}`;settle(b,r===c?b*2:0,"丁半")}
function coinPlay(c){let b=bet(+$("bet").value);if(!b)return;let r=Math.random()<.5?"表":"裏";$("res").textContent=`${r} ${r===c?"WIN":"LOSE"}`;settle(b,r===c?b*2:0,"コイントス")}
function hlPlay(c){let b=bet(+$("bet").value),n=1+Math.floor(Math.random()*13),win=c==="high"?n>=8:n<=6;$("card").textContent=n;settle(b,win?Math.floor(b*1.8):0,"ハイ＆ロー")}
function bjPlay(){let b=bet(+$("bet").value);if(!b)return;let player=15+Math.floor(Math.random()*8),dealer=15+Math.floor(Math.random()*8),win=player<=21&&(dealer>21||player>dealer);$("bj").textContent=`YOU ${player}　vs　DEALER ${dealer}`;settle(b,win?b*2:player===dealer?b:0,"ブラックジャック")}
function pokerPlay(){let b=bet(+$("bet").value);if(!b)return;let r=Math.random(),mult=r<.02?25:r<.08?10:r<.25?4:r<.5?2:0;$("pk").textContent=["🂡","🂱","🃁","🃑","🂮"].sort(()=>Math.random()-.5).join(" ");$("res").textContent=mult?`WIN ×${mult}`:"LOSE";settle(b,b*mult,"ポーカー");if(mult>=25)puchun()}
function lotteryPlay(){let b=bet(100);if(!b)return;let r=Math.random(),p=r<.002?100000:r<.02?10000:r<.145?500:0;$("res").textContent=p?`🎉 ${p.toLocaleString()} COIN`:"ハズレ";settle(b,p,"宝くじ");if(p>=10000)puchun()}
let multiTimer=null,multi=1;
function multiStart(){let b=bet(+$("bet").value);if(!b)return;multi=1;clearInterval(multiTimer);$("res").innerHTML=`<button class="primary" onclick="cashout()">CASH OUT</button>`;multiTimer=setInterval(()=>{multi*=1+Math.random()*.045;$("mult").textContent=multi.toFixed(2)+"×";if(Math.random()<.025)crash()},300)}
function crash(){clearInterval(multiTimer);$("res").textContent="💥 CRASH — 0 COIN";S.history.unshift({game:"倍率ゲーム",net:-Math.round(lastBet||0),t:new Date().toLocaleTimeString()});save()}
function cashout(){clearInterval(multiTimer);let b=lastBet||0;settle(b,Math.floor(b*multi),"倍率ゲーム");$("res").textContent=`CASH OUT ${multi.toFixed(2)}×`}
let lastBet=0;
const oldBet=bet;bet=function(v){let x=oldBet(v);if(x)lastBet=x;return x}
function dailyClaim(){if(Date.now()-S.lastDaily<=86400000)return;S.coins+=1000;S.lastDaily=Date.now();save();$("res").textContent="🎁 +1,000 COIN"}
function buy(n,p){if(S.coins<p)return $("res").textContent="コイン不足";S.coins-=p;S.items.push(n);save();$("res").textContent=`購入: ${n}`}
function puchun(){const e=$("blackout");e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1700)}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");let f=b.dataset.filter;document.querySelectorAll(".card").forEach(c=>c.style.display=f==="all"||c.dataset.cat===f?"":"none")});
render();