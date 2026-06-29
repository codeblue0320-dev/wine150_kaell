/* ====== WINE 150 · mobile cellar app ====== */
const DATA = window.WINE_DATA;
const V = DATA.varieties;
const byNo = Object.fromEntries(V.map(v=>[v.no,v]));
const TIERS = ['1만','3만','5만','10만'];
const TIER_CLASS = {'1만':'t1','3만':'t3','5만':'t5','10만':'t10'};
const TIER_LABEL = {'1만':'1만원대','3만':'3만원대','5만':'5만원대','10만':'10만 내외'};
const AXES = [['sweet','당도'],['acid','산도'],['tannin','타닌'],['body','바디']];
const FLAVCOLORS = ['#6e1f2a','#8c2d39','#a8505b','#c07f88','#d6a9af'];

/* ---------- state ---------- */
const state = {
  color:'all', q:'', tiers:new Set(),
  aromas:new Set(),
  taste:{sweet:0,acid:0,tannin:0,body:0}, // 0 무관 / 1 낮음 / 2 중간 / 3 높음
  mode:'browse', // browse | pair
  pairFood:''
};

/* ---------- helpers ---------- */
const $ = s=>document.querySelector(s);
const el = (tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function colorClass(v){return v.color==='레드'?'red':'white';}

/* wine visual style for bottle */
function wineStyle(v, tier){
  const t = (v.tiers[tier].wine+' '+v.tiers[tier].taste+' '+v.summary).toLowerCase();
  const has = arr=>arr.some(k=>t.includes(k.toLowerCase()));
  let type='red';
  if(has(['스파클','brut','prosecco','프로세코','champagne','샴페인','cava','카바','crémant','크레망','spumante','스푸만테','asti','아스티','블랑케트','franciacorta','버블']))
    type='sparkling';
  else if(has(['로제','rosé','rosado','rosato']))
    type='rose';
  else if(has(['px','pedro','sauternes','소테른','tokaji','토카이','토카이','madeira','마데이라','marsala','마르살라','sherry','셰리','port','포트','파시토','passito','귀부','아이스','ice','뱅 존','vin jaune','어수','aszú','solera','솔레라']) || (v.tiers[tier].st.당도||0) >= 35)
    type='dessert';
  else type = v.color==='화이트' ? 'white' : 'red';

  const liquid = {red:'#6b1f2a',white:'#e7d79b',rose:'#e6a6a0',sparkling:'#efe0a2',dessert:'#b8702c'}[type];
  const glass  = {red:'#2c3a2c',white:'#3a4a32',rose:'#caa6a6',sparkling:'#3a4a32',dessert:'#2c2a22'}[type] || '#2c3a2c';
  return {type, liquid, glass};
}

/* generate elegant SVG bottle */
function bottleSVG(v, tier, big){
  const s = wineStyle(v, tier);
  const w = big?150:46, h = big?300:62;
  const glass = s.glass;
  const labelTxt = esc(v.en.split(' / ')[0]).slice(0,16);
  const sparkle = s.type==='sparkling'
    ? `<g fill="#fff" opacity=".7">${[...Array(7)].map((_,i)=>`<circle cx="${42+ (i%3)*8}" cy="${120 - i*9}" r="${1.4+ (i%2)}"/>`).join('')}</g>` : '';
  const capColor = s.type==='sparkling'||s.type==='dessert' ? '#b3963f' : '#5e1622';
  // viewBox 0 0 100 220
  return `<svg viewBox="0 0 100 220" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="g${v.no}${tier}" x1="0" x2="1">
        <stop offset="0" stop-color="${glass}" stop-opacity=".55"/>
        <stop offset=".5" stop-color="${glass}"/>
        <stop offset="1" stop-color="#000" stop-opacity=".35"/>
      </linearGradient>
    </defs>
    <!-- body -->
    <path d="M38 64 Q38 52 44 44 L44 20 Q44 14 50 14 Q56 14 56 20 L56 44 Q62 52 62 64 L62 196 Q62 208 50 208 Q38 208 38 196 Z"
      fill="url(#g${v.no}${tier})" stroke="rgba(0,0,0,.25)" stroke-width="1"/>
    <!-- liquid tint near base -->
    <path d="M40 120 L60 120 L60 196 Q60 206 50 206 Q40 206 40 196 Z" fill="${s.liquid}" opacity="${s.type==='sparkling'||s.type==='white'?'.45':'.6'}"/>
    ${sparkle}
    <!-- capsule -->
    <rect x="44" y="12" width="12" height="16" rx="2" fill="${capColor}"/>
    <rect x="43.5" y="26" width="13" height="4" fill="${capColor}" opacity=".85"/>
    <!-- label -->
    <rect x="37" y="120" width="26" height="56" rx="2" fill="#f7f0e7" stroke="#d8c9b0"/>
    <rect x="37" y="125" width="26" height="2" fill="#7b1e2b"/>
    <rect x="37" y="170" width="26" height="2" fill="#b3963f"/>
    <text x="50" y="150" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" fill="#7b1e2b" transform="rotate(90 50 150)" >${labelTxt}</text>
    <!-- highlight -->
    <rect x="41" y="48" width="3" height="150" rx="2" fill="#fff" opacity=".18"/>
  </svg>`;
}

function slug(wine){return wine.split(' (')[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}

/* mini axes for card */
function miniAxes(v){
  return `<div class="miniaxes">${AXES.map(([k,lbl])=>{
    const val=v.struct[k]||0;const col=val>=66?'#7b1e2b':val>=40?'#9a4b34':'#9a7b3f';
    return `<span class="mx">${lbl}<span class="mxbar"><i style="width:${val}%;background:${col}"></i></span></span>`;
  }).join('')}</div>`;
}

/* ---------- filtering ---------- */
function tasteOK(val, want){ // want:1 low 2 mid 3 high
  if(!want) return true;
  if(want===1) return val<=40;
  if(want===2) return val>40 && val<70;
  if(want===3) return val>=60;
  return true;
}
function passFilters(v){
  if(state.color!=='all' && v.color!==state.color) return false;
  if(state.q){
    const q=state.q.toLowerCase();
    if(!(v.ko.toLowerCase().includes(q)||v.en.toLowerCase().includes(q))) return false;
  }
  for(const [k] of AXES){ if(!tasteOK(v.struct[k]||0, state.taste[k])) return false; }
  if(state.aromas.size){
    let hit=false;
    for(const a of state.aromas){ if(v.aromaKeys.includes(a)){hit=true;break;} }
    if(!hit) return false;
  }
  return true;
}

/* ---------- food pairing ---------- */
const FOOD_SYN = {
  '스테이크':['스테이크','소고기','한우','등심','안심','갈비','비프'],
  '소고기':['소고기','스테이크','한우','등심','비프','갈비'],
  '삼겹살':['돼지','포크','삼겹','목살','수육','보쌈'],
  '돼지':['돼지','포크','삼겹','목살','로스트 포크'],
  '치킨':['닭','치킨','가금','오리'],'닭':['닭','치킨','가금'],'오리':['오리','가금','닭'],
  '양':['양','램','양갈비','양고기'],'양고기':['양','양갈비','양고기'],
  '회':['해산물','생선','초밥','조개','굴','세비체','문어'],'사시미':['해산물','생선','초밥'],
  '초밥':['초밥','해산물','생선'],'생선':['생선','해산물','구운 생선','화이트 피시'],
  '해산물':['해산물','조개','굴','새우','문어','생선'],'굴':['굴','해산물','조개'],
  '새우':['새우','해산물','마늘'],'문어':['문어','해산물'],
  '치즈':['치즈','경성','블루치즈','염소치즈','숙성 치즈','페코리노'],
  '파스타':['파스타','토마토','라구','미트소스','크림'],'피자':['피자','토마토'],
  '바비큐':['바비큐','립','구운','그릴'],'스튜':['스튜','브레이즈','굴라시','라구'],
  '버섯':['버섯','트러플','리소토'],'디저트':['디저트','케이크','초콜릿','과일','타르트'],
  '초콜릿':['초콜릿','디저트','베리'],'케이크':['케이크','디저트','과일'],
  '샐러드':['샐러드','채소','가벼운'],'커리':['커리','향신료','인도','태국'],
  '햄버거':['햄버거','바비큐','소고기'],'족발':['돼지','수육','보쌈'],'보쌈':['돼지','수육','보쌈'],
  '전':['전','튀김','기름'],'튀김':['튀김','기름','가벼운'],'타파스':['타파스','하몬','살루미','안주']
};
function expandFood(text){
  const out=new Set();
  const t=text.trim();
  if(!t) return out;
  out.add(t);
  for(const key in FOOD_SYN){ if(t.includes(key)) FOOD_SYN[key].forEach(x=>out.add(x)); }
  // also add raw tokens
  t.split(/[\s,]+/).filter(Boolean).forEach(x=>out.add(x));
  return out;
}
function pairResults(food){
  const terms=[...expandFood(food)];
  const res=[];
  for(const v of V){
    if(state.color!=='all' && v.color!==state.color) continue;
    for(const tk of TIERS){
      if(state.tiers.size && !state.tiers.has(tk)) continue;
      const pairTxt=(v.tiers[tk].pair+' '+v.pair).toLowerCase();
      let score=0, matched=[];
      for(const term of terms){
        if(term.length<1) continue;
        if(pairTxt.includes(term.toLowerCase())){ score+= (term===food?3:1); if(!matched.includes(term))matched.push(term);}
      }
      if(score>0) res.push({v,tk,score,matched,pair:v.tiers[tk].pair});
    }
  }
  res.sort((a,b)=> b.score-a.score || a.v.no-b.v.no);
  // dedupe: keep best tier per variety, then flatten top
  const seen=new Set(), out=[];
  for(const r of res){ const id=r.v.no+'_'+r.tk; if(seen.has(id))continue; seen.add(id); out.push(r); if(out.length>=30)break; }
  return out;
}

/* ---------- renders ---------- */
function varietyCard(v){
  return `<div class="vc" onclick="go('v/${v.no}')">
    <div class="thumb">${bottleSVG(v,'3만',false)}</div>
    <div class="vinfo">
      <div class="vno">No.${v.no} · <span class="badge ${colorClass(v)}">${v.color}</span></div>
      <div class="vname">${esc(v.ko)} <span class="ven">${esc(v.en)}</span></div>
      <div class="vsum">${esc(v.summary)}</div>
      ${miniAxes(v)}
    </div>
  </div>`;
}

function renderHome(){
  document.body.classList.remove('subpage');
  const list = V.filter(passFilters);
  const view=$('#view');
  $('#resultMeta').textContent = `${list.length}개 품종 · ${list.length*4}개 와인`;
  if(!list.length){ view.innerHTML=`<div class="empty">조건에 맞는 와인이 없어요.<br>필터를 조정해 보세요.</div>`; return; }
  view.innerHTML = `<div class="grid">${list.map(varietyCard).join('')}</div>`
    + `<footer class="foot">와인 150 · 이마트 대전복합터미널점 가격대 기준<br>가격·빈티지·재고는 매장·시즌에 따라 달라질 수 있습니다.</footer>`;
  window.scrollTo(0,0);
}

function renderPair(){
  document.body.classList.remove('subpage');
  const view=$('#view');
  const food=state.pairFood;
  const res=pairResults(food);
  $('#resultMeta').textContent = `“${food}” 마리아주 추천 ${res.length}건`;
  if(!res.length){ view.innerHTML=`<div class="empty">“${esc(food)}”에 딱 맞는 마리아주를 못 찾았어요.<br>다른 음식명을 입력하거나 필터를 풀어보세요.</div>`; return; }
  view.innerHTML = `<div class="sectitle">🍷 “${esc(food)}”와 어울리는 와인</div><div class="tiers">`
    + res.map(r=>`<div class="tier" onclick="go('w/${r.v.no}/${encodeURIComponent(r.tk)}')">
        <div class="tier-h"><span class="tbadge ${TIER_CLASS[r.tk]}">${TIER_LABEL[r.tk]}</span>
          <span class="twine">${esc(r.v.tiers[r.tk].wine)}</span><span class="go">›</span></div>
        <div class="tprv">${esc(r.v.ko)} · ${esc(r.v.color)} · No.${r.v.no}</div>
        <div class="reason">마리아주 ${esc(r.pair)}</div>
      </div>`).join('') + `</div>`
    + `<footer class="foot">음식명을 바꿔 다시 검색해 보세요. 가격대 필터로 예산도 좁힐 수 있어요.</footer>`;
  window.scrollTo(0,0);
}

function structBars(v){
  const all=[...AXES,['alcohol','알코올']];
  return `<div class="axes">${all.map(([k,lbl])=>{
    const val=v.struct[k]||0;const col=val>=66?'#7b1e2b':val>=40?'#9a4b34':'#9a7b3f';
    return `<div class="axis"><span class="albl">${lbl}</span><span class="atrk"><i style="width:${val}%;background:${col}"></i></span><span class="aval">${val}</span></div>`;
  }).join('')}</div>`;
}
function flavorBar(v){
  const fl=v.flavors.slice(0,5);
  const segs=fl.map((f,i)=>`<i style="width:${f[1]}%;background:${FLAVCOLORS[i%5]}"></i>`).join('');
  const leg=fl.map((f,i)=>`<span><span class="sw" style="background:${FLAVCOLORS[i%5]}"></span>${esc(f[0])} ${f[1]}%</span>`).join('');
  return `<div class="fbar">${segs}</div><div class="fleg">${leg}</div>`;
}
function pills(st){
  const items=[['당도',st.당도],['산도',st.산도],['타닌',st.타닌],['바디',st.바디]];
  const cols={'당도':'#b9893b','산도':'#6f8f3f','타닌':'#7a4a6e','바디':'#7b1e2b'};
  let h=items.map(([k,val])=>`<span class="pill"><i style="width:${val}%;background:${cols[k]}"></i><span><b>${k}</b> ${val}</span></span>`).join('');
  h+=`<span class="pill"><span><b>도수</b> ${esc(st.도수||'')}</span></span>`;
  return `<div class="pills">${h}</div>`;
}

function renderVariety(no){
  document.body.classList.add('subpage');
  const v=byNo[no]; if(!v){go('');return;}
  $('#brandTitle').innerHTML = `No.${v.no}`;
  const view=$('#view');
  view.innerHTML = `<div class="detail">
    <div class="dhero">
      <div class="thumb">${bottleSVG(v,'5만',false)}</div>
      <div class="dhead">
        <div class="dno">No.${v.no} · <span class="badge ${colorClass(v)}">${v.color}</span></div>
        <div class="dname">${esc(v.ko)}</div>
        <div class="den">${esc(v.en)}</div>
        <div class="dsum">${esc(v.summary)}</div>
      </div>
    </div>

    <div class="block"><h3>구조 (0-100)</h3>${structBars(v)}</div>
    <div class="block"><h3>맛·향 구성 (합 100%)</h3>${flavorBar(v)}</div>
    <div class="block"><h3>품종 정보</h3>
      <div class="info">
        <div class="irow"><span class="k">고향</span><span class="v">${esc(v.home)}</span></div>
        <div class="irow"><span class="k">유래</span><span class="v">${esc(v.parent)}</span></div>
        <div class="irow"><span class="k">주요 산지</span><span class="v">${esc(v.region)}</span></div>
        <div class="irow"><span class="k">마리아주</span><span class="v">${esc(v.pair)}</span></div>
      </div>
      <div class="terroir"><b>떼루아</b> ${esc(v.terroir)}</div>
      <div class="feature"><b>특징</b> ${esc(v.feature)}</div>
    </div>

    <div class="block"><h3>이 향이 느껴져요</h3>
      <div class="atags">${v.aromaKeys.map(a=>`<span class="atag">${esc(a)}</span>`).join('')}</div>
    </div>

    <div class="block"><h3>가격대별 추천 와인 · 이마트 대전복합터미널점</h3>
      <div class="tiers">${TIERS.map(tk=>{
        const t=v.tiers[tk];
        return `<div class="tier" onclick="go('w/${v.no}/${encodeURIComponent(tk)}')">
          <div class="tier-h"><span class="tbadge ${TIER_CLASS[tk]}">${TIER_LABEL[tk]}</span>
            <span class="twine">${esc(t.wine)}</span><span class="go">›</span></div>
          <div class="tprv">${esc(t.prv)}</div>
        </div>`;
      }).join('')}</div>
    </div>
  </div>`;
  window.scrollTo(0,0);
}

function renderWine(no, tier){
  document.body.classList.add('subpage');
  const v=byNo[no]; if(!v||!v.tiers[tier]){go('v/'+no);return;}
  const t=v.tiers[tier];
  $('#brandTitle').innerHTML = TIER_LABEL[tier];
  const sg=slug(t.wine);
  const view=$('#view');
  view.innerHTML = `<div class="detail">
    <div class="crumb" onclick="go('v/${v.no}')">‹ ${esc(v.ko)} (No.${v.no})</div>
    <div class="wine-hero">
      <div class="bottle-wrap">
        <img src="images/${sg}.jpg" alt="" onerror="this.remove()"/>
        ${bottleSVG(v,tier,true)}
      </div>
      <div class="wine-tier-badge"><span class="tbadge ${TIER_CLASS[tier]}">${TIER_LABEL[tier]}</span></div>
      <div class="wname">${esc(t.wine)}</div>
      <div class="wprv">${esc(t.prv)}</div>
    </div>
    <div class="tdesc">${esc(t.desc)}</div>
    ${pills(t.st)}
    <div class="block"><h3>맛·향 / 마리아주</h3>
      <div class="pairbox"><b>맛·향</b> ${esc(t.taste)}<br><b>마리아주</b> ${esc(t.pair)}</div>
    </div>
    <div class="buy"><b>구매처</b> ▸ ${esc(t.buy)}</div>
    <div class="block"><h3>품종 정보</h3>
      <div class="tier" onclick="go('v/${v.no}')">
        <div class="tier-h"><span class="twine">${esc(v.ko)} · ${esc(v.en)}</span><span class="go">›</span></div>
        <div class="tprv">${esc(v.summary)}</div>
      </div>
    </div>
    <footer class="foot">사진은 자동 생성된 일러스트입니다. images/${sg}.jpg 파일을 넣으면 실제 사진으로 표시됩니다.</footer>
  </div>`;
  window.scrollTo(0,0);
}

/* ---------- router ---------- */
function go(path){ location.hash = '#/'+path; }
function route(){
  const h=location.hash.replace(/^#\/?/,'');
  const parts=h.split('/').filter(Boolean);
  if(parts[0]==='v'){ renderVariety(+parts[1]); }
  else if(parts[0]==='w'){ renderWine(+parts[1], decodeURIComponent(parts[2])); }
  else { $('#brandTitle').innerHTML='WINE <span>150</span>'; document.body.classList.remove('subpage');
    state.mode==='pair'? renderPair() : renderHome(); }
}
window.addEventListener('hashchange', route);

/* ---------- filter drawer ---------- */
function buildDrawer(){
  const b=$('#drawerBody');
  // taste
  let html=`<div class="fgroup"><span class="flbl">맛 (당도·산도·타닌·바디)</span>`;
  for(const [k,lbl] of AXES){
    html+=`<div class="taste-axis"><div class="tname">${lbl}</div>
      <div class="seg4" data-axis="${k}">
        ${['무관','낮음','중간','높음'].map((t,i)=>`<button data-val="${i}" class="${state.taste[k]===i?'on':''}">${t}</button>`).join('')}
      </div></div>`;
  }
  html+=`</div>`;
  // price tiers
  html+=`<div class="fgroup"><span class="flbl">가격대</span><div class="tierchips" id="tierChips">
    ${TIERS.map(tk=>`<button class="tc ${state.tiers.has(tk)?'on':''}" data-tier="${tk}">${TIER_LABEL[tk]}</button>`).join('')}
  </div></div>`;
  // aromas
  html+=`<div class="fgroup"><span class="flbl">향 (선택한 향이 하나라도 포함된 와인)</span>`;
  for(const g of DATA.aromaGroups){
    html+=`<div class="acgroup-t">${g.group}</div><div class="aromachips">
      ${g.aromas.map(a=>`<button class="ac ${state.aromas.has(a)?'on':''}" data-aroma="${esc(a)}">${esc(a)}</button>`).join('')}
    </div>`;
  }
  html+=`</div>`;
  b.innerHTML=html;
  // events
  b.querySelectorAll('.seg4').forEach(seg=>{
    seg.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
      const ax=seg.dataset.axis; state.taste[ax]=+btn.dataset.val;
      seg.querySelectorAll('button').forEach(x=>x.classList.remove('on')); btn.classList.add('on');
    });
  });
  b.querySelectorAll('.tc').forEach(c=>c.onclick=()=>{ const tk=c.dataset.tier;
    if(state.tiers.has(tk)){state.tiers.delete(tk);c.classList.remove('on');}else{state.tiers.add(tk);c.classList.add('on');} });
  b.querySelectorAll('.ac').forEach(c=>c.onclick=()=>{ const a=c.dataset.aroma;
    if(state.aromas.has(a)){state.aromas.delete(a);c.classList.remove('on');}else{state.aromas.add(a);c.classList.add('on');} });
}
function openDrawer(){ buildDrawer(); $('#drawer').classList.add('open'); $('#drawerOverlay').classList.add('open'); }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#drawerOverlay').classList.remove('open'); }
function filterCount(){
  let n=0; for(const k in state.taste) if(state.taste[k]) n++;
  n+=state.tiers.size+state.aromas.size;
  $('#filterCount').textContent = n? n : '';
}

/* ---------- wire up ---------- */
function init(){
  $('#backBtn').onclick=()=>history.back();
  $('#homeBtn').onclick=()=>{state.mode='browse';go('');};
  $('#searchInput').addEventListener('input',e=>{state.q=e.target.value;state.mode='browse';if(!location.hash||location.hash.startsWith('#/v')||location.hash.startsWith('#/w'))location.hash='#/';else route();});
  $('#quickRow').querySelectorAll('.seg').forEach(s=>s.onclick=()=>{
    $('#quickRow').querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));s.classList.add('active');
    state.color=s.dataset.color; state.mode==='pair'?renderPair():renderHome();
  });
  $('#pairBtn').onclick=()=>{ const f=$('#foodInput').value.trim(); if(!f){$('#foodInput').focus();return;} state.pairFood=f;state.mode='pair'; if(location.hash!=='#/')location.hash='#/'; else renderPair(); };
  $('#foodInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#pairBtn').click();});
  $('#filterBtn').onclick=openDrawer;
  $('#drawerClose').onclick=closeDrawer;
  $('#drawerOverlay').onclick=closeDrawer;
  $('#applyFilters').onclick=()=>{ closeDrawer(); filterCount(); state.mode='browse'; if(location.hash!=='#/')location.hash='#/'; else renderHome(); };
  $('#resetFilters').onclick=()=>{ state.taste={sweet:0,acid:0,tannin:0,body:0};state.tiers.clear();state.aromas.clear(); buildDrawer(); filterCount(); };
  if(!location.hash) location.hash='#/';
  route();
}
init();
