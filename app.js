const P=["PS","Switch","その他"], B=["ゲオ","Amazon","オンライン","DLC","その他"], S=["ゲオ","その他"];
let platform="",buyPlace="",sellPlace="",bonusPlace="",editingId=null;
const $=id=>document.getElementById(id);
const yen=n=>Number(n||0).toLocaleString("ja-JP")+"円";
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0)}
function today(){let d=new Date(),l=new Date(d-d.getTimezoneOffset()*60000);$("buyDate").value=l.toISOString().slice(0,10)}
function buttons(id,vals,get,set,other){let c=$(id);c.innerHTML="";vals.forEach(v=>{let b=document.createElement("button");b.type="button";b.textContent=v;b.className=v===get()?"sel":"";b.onclick=()=>{set(v);[...c.children].forEach(x=>x.classList.remove("sel"));b.classList.add("sel");if(other){let o=$(other);v==="その他"?(o.classList.remove("hidden"),o.focus()):(o.classList.add("hidden"),o.value="")}};c.appendChild(b)})}
function build(){
  buttons("platformBtns",P,()=>platform,v=>platform=v,"platformOther");
  buttons("buyPlaceBtns",B,()=>buyPlace,v=>buyPlace=v,"buyPlaceOther");
  buttons("sellPlaceBtns",S,()=>sellPlace,v=>sellPlace=v,"sellPlaceOther");
  buttons("bonusPlaceBtns",S,()=>bonusPlace,v=>bonusPlace=v,"bonusPlaceOther");
}
function recs(){return JSON.parse(localStorage.getItem("gameTradeRecords")||"[]")}
function save(a){localStorage.setItem("gameTradeRecords",JSON.stringify(a))}
function bonusRecs(){return JSON.parse(localStorage.getItem("gameTradeBonusRecords")||"[]")}
function saveBonus(a){localStorage.setItem("gameTradeBonusRecords",JSON.stringify(a))}
function val(choice,other){if(choice==="その他"){let x=$(other).value.trim();return x?`その他：${x}`:"その他"}return choice}
function calc(){
  let b=+$("buyPrice").value||0,s=+$("sellPrice").value||0,n=b-s;
  $("calcSell").textContent=yen(s);
  $("calcNet").textContent=yen(n);
  return{b,s,n}
}
["buyPrice","sellPrice"].forEach(id=>$(id).addEventListener("input",calc));
$("gameForm").onsubmit=e=>{
  e.preventDefault();
  if(!platform)return alert("機種を選んでください");
  if(!buyPlace)return alert("購入場所を選んでください");

  let sd=$("sellDate").value,sp=+$("sellPrice").value||0;
  if((sd||sp)&&!sellPlace)return alert("売却場所を選んでください");

  let c=calc();
  let r={
    id:editingId||Date.now(),
    title:$("title").value.trim(),
    platform:val(platform,"platformOther"),
    buyDate:$("buyDate").value,
    buyPrice:c.b,
    buyPlace:val(buyPlace,"buyPlaceOther"),
    sellDate:sd,
    sellPrice:c.s,
    sellTotal:c.s,
    sellPlace:sellPlace?val(sellPlace,"sellPlaceOther"):"",
    net:c.n
  };

  let a=recs();
  if(editingId){
    a=a.map(x=>x.id===editingId?r:x);
  }else{
    a.unshift(r);
  }
  save(a);
  resetGameForm();
  updateSummary();
  show("list");
  renderList();
  renderBonusList();
};

function resetGameForm(){
  $("gameForm").reset();
  editingId=null;
  platform=buyPlace=sellPlace="";
  $("sellPrice").value="";
  ["platformOther","buyPlaceOther","sellPlaceOther"].forEach(id=>$(id).classList.add("hidden"));
  $("formTitle").textContent="ゲームを記録";
  $("gameSaveBtn").textContent="保存する";
  build();
  today();
  calc();
}

function splitChoice(value, choices){
  if(!value)return {choice:"",other:""};
  if(choices.includes(value))return {choice:value,other:""};
  if(value.startsWith("その他："))return {choice:"その他",other:value.slice(4)};
  return {choice:"その他",other:value};
}

function editGame(id){
  const r=recs().find(x=>x.id===id);
  if(!r)return;

  editingId=id;
  $("title").value=r.title||"";
  $("buyDate").value=r.buyDate||"";
  $("buyPrice").value=r.buyPrice||0;
  $("sellDate").value=r.sellDate||"";
  $("sellPrice").value=r.sellPrice||0;

  const p=splitChoice(r.platform,P);
  platform=p.choice;
  $("platformOther").value=p.other;
  $("platformOther").classList.toggle("hidden",platform!=="その他");

  const bp=splitChoice(r.buyPlace,B);
  buyPlace=bp.choice;
  $("buyPlaceOther").value=bp.other;
  $("buyPlaceOther").classList.toggle("hidden",buyPlace!=="その他");

  const sp=splitChoice(r.sellPlace,S);
  sellPlace=sp.choice;
  $("sellPlaceOther").value=sp.other;
  $("sellPlaceOther").classList.toggle("hidden",sellPlace!=="その他");

  build();
  $("formTitle").textContent="ゲームを編集";
  $("gameSaveBtn").textContent="変更を保存";
  calc();
  show("form");
}

function fdate(s){if(!s)return"未売却";let[y,m,d]=s.split("-");return`${y}/${+m}/${+d}`}
function esc(s=""){let d=document.createElement("div");d.textContent=s;return d.innerHTML}
function renderList(){
  let a=recs().sort((x,y)=>new Date(y.buyDate)-new Date(x.buyDate));
  $("count").textContent=`${a.length}本 記録中`;
  $("records").innerHTML=a.length?a.map(r=>`
    <div class="card">
      <h3>${esc(r.title)} <span class="badge">${esc(r.platform)}</span></h3>
      <div class="badges">
        <span class="badge">購入 ${fdate(r.buyDate)}</span>
        <span class="badge">${esc(r.buyPlace)}</span>
        <span class="badge">売却 ${r.sellDate?fdate(r.sellDate):"未売却"}</span>
        ${r.sellPlace?`<span class="badge">${esc(r.sellPlace)}</span>`:""}
      </div>
      <div class="money">
        <div><small>購入価格</small><b>${yen(r.buyPrice)}</b></div>
        <div><small>売却総額</small><b>${yen(r.sellTotal)}</b></div>
        <div><small>実質負担額</small><b>${yen(r.net)}</b></div>
      </div>
      ${r.sellDate?`<div class="badges" style="margin-top:8px"><span class="badge">買取 ${yen(r.sellPrice)}</span></div>`:""}
      <div class="card-actions">
        <button class="edit" onclick="editGame(${r.id})">編集</button>
        <button class="del" onclick="del(${r.id})">削除</button>
      </div>
    </div>
  `).join(""):'<div class="empty">まだ記録がありません</div>';
}
function del(id){if(!confirm("この記録を削除しますか？"))return;save(recs().filter(r=>r.id!==id));renderList();updateSummary()}

$("bonusFormEl").onsubmit=e=>{
  e.preventDefault();
  if(!bonusPlace) return alert("売却場所を選んでください");

  const amount=+$("bonusTotalInput").value||0;
  if(amount<=0) return alert("ボーナス総額を入力してください");

  const r={
    id:Date.now(),
    date:$("bonusDate").value,
    place:val(bonusPlace,"bonusPlaceOther"),
    games:$("bonusGames").value.trim(),
    amount
  };

  const a=bonusRecs();
  a.unshift(r);
  saveBonus(a);

  e.target.reset();
  bonusPlace="";
  $("bonusPlaceOther").classList.add("hidden");
  build();
  setBonusDateToday();
  updateSummary();

  alert("まとめ売りボーナスを保存しました");
  show("list");
  renderList();
  renderBonusList();
};

function setBonusDateToday(){
  const d=new Date(),l=new Date(d-d.getTimezoneOffset()*60000);
  $("bonusDate").value=l.toISOString().slice(0,10);
}

function renderBonusList(){
  const a=[...bonusRecs()].sort((x,y)=>new Date(y.date)-new Date(x.date));
  $("bonusCount").textContent=`${a.length}件 記録中`;
  $("bonusRecords").innerHTML=a.length?a.map(r=>`
    <div class="bonus-card">
      <h3>${esc(r.place)}</h3>
      <div class="badges">
        <span class="badge">${fdate(r.date)}</span>
        ${r.games?`<span class="badge">${esc(r.games)}</span>`:""}
      </div>
      <div class="bonus-amount">＋${yen(r.amount)}</div>
      <button class="del" onclick="delBonus(${r.id})">削除</button>
    </div>
  `).join(""):'<div class="empty">まとめ売りボーナスの記録はありません</div>';
}

function delBonus(id){
  if(!confirm("このボーナス記録を削除しますか？"))return;
  saveBonus(bonusRecs().filter(r=>r.id!==id));
  renderBonusList();
  updateSummary();
}

function updateSummary(){
  let y=new Date().getFullYear(),a=recs(),ba=bonusRecs();
  let b=a.filter(r=>r.buyDate?.startsWith(y)).reduce((s,r)=>s+(+r.buyPrice||0),0);
  let gameSales=a.filter(r=>r.sellDate?.startsWith(y)).reduce((s,r)=>s+(+r.sellPrice||0),0);
  let bonusSales=ba.filter(r=>r.date?.startsWith(y)).reduce((s,r)=>s+(+r.amount||0),0);
  let t=gameSales+bonusSales;
  $("year").textContent=y;
  $("buyTotal").textContent=yen(b);
  $("sellTotal").textContent=yen(t);
  $("netTotal").textContent=yen(b-t);
}
build();today();setBonusDateToday();calc();updateSummary();