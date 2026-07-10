/* ====== WINE 200 · 이마트 대전복합터미널점 전체 매대판 ====== */
const DATA = window.WINE_DATA;
const V = DATA.varieties;
const byNo = Object.fromEntries(V.map(v=>[v.no,v]));
const TIERS = ['1만','3만','5만','10만'];
const TIER_CLASS = {'1만':'t1','3만':'t3','5만':'t5','10만':'t10'};
const TIER_LABEL = {'1만':'1만원대','3만':'3만원대','5만':'5만원대','10만':'10만 내외'};
const AXES = [['sweet','당도'],['acid','산도'],['tannin','타닌'],['body','바디']];
const FLAVCOLORS = ['#6e1f2a','#8c2d39','#a8505b','#c07f88','#d6a9af'];
const COLORS = ['레드','화이트','스파클링','디저트','로제'];
const COLOR_CLASS = {'레드':'red','화이트':'white','스파클링':'spark','디저트':'dessert','로제':'rose'};

/* ---------- state ---------- */
const state = {
  color:'all', q:'', tiers:new Set(),
  aromas:new Set(),
  foods:new Set(),           // 마리아주 필터 (foodTags.tag)
  stock:'all',               // all | Y (구매 가능만)
  taste:{sweet:new Set(),acid:new Set(),tannin:new Set(),body:new Set()}, // 1 낮음/2 중간/3 높음, 중복 선택
  mode:'browse',
  pairFood:''
};

/* ---------- helpers ---------- */
const $ = s=>document.querySelector(s);
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function colorClass(v){return COLOR_CLASS[v.color]||'red';}
function won(n){return (n||0).toLocaleString('ko-KR');}
function level(val){ if(val==null) return 1; return val<=40?1:(val<70?2:3); } // 낮음/중간/높음

/* 대표(메인) 와인 */
function mainWine(v){
  for(const tk of ['3만','1만','5만','10만']){
    const arr=v.tiers[tk]; if(arr&&arr.length) return {tk,w:arr[0]};
  }
  return null;
}
function allWines(v){
  const out=[];
  for(const tk of TIERS){ (v.tiers[tk]||[]).forEach(w=>out.push({tk,w})); }
  return out;
}

/* wine visual fallback bottle (사진 없을 때) */
function wineStyle(v, w){
  const t=((w?w.wine:'')+' '+v.color+' '+v.summary).toLowerCase();
  let type = v.color==='스파클링'?'sparkling' : v.color==='로제'?'rose' : v.color==='디저트'?'dessert' : v.color==='화이트'?'white':'red';
  if(/로제|rosé/.test(t)&&type!=='sparkling') type='rose';
  const liquid={red:'#6b1f2a',white:'#e7d79b',rose:'#e6a6a0',sparkling:'#efe0a2',dessert:'#b8702c'}[type];
  const glass ={red:'#2c3a2c',white:'#3a4a32',rose:'#caa6a6',sparkling:'#3a4a32',dessert:'#2c2a22'}[type];
  return {type,liquid,glass};
}
function bottleSVG(v, w, big){
  const s=wineStyle(v,w);
  const wd=big?150:46, h=big?300:62;
  const labelTxt=esc((v.en||'').split(' / ')[0]).slice(0,16);
  const uid=v.no+'x'+(w&&w.id?w.id:'v');
  const sparkle=s.type==='sparkling'?`<g fill="#fff" opacity=".7">${[...Array(7)].map((_,i)=>`<circle cx="${42+(i%3)*8}" cy="${120-i*9}" r="${1.4+(i%2)}"/>`).join('')}</g>`:'';
  const capColor=s.type==='sparkling'||s.type==='dessert'?'#b3963f':'#5e1622';
  return `<svg viewBox="0 0 100 220" width="${wd}" height="${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="g${uid}" x1="0" x2="1">
      <stop offset="0" stop-color="${s.glass}" stop-opacity=".55"/><stop offset=".5" stop-color="${s.glass}"/>
      <stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>
    <path d="M38 64 Q38 52 44 44 L44 20 Q44 14 50 14 Q56 14 56 20 L56 44 Q62 52 62 64 L62 196 Q62 208 50 208 Q38 208 38 196 Z"
      fill="url(#g${uid})" stroke="rgba(0,0,0,.25)" stroke-width="1"/>
    <path d="M40 120 L60 120 L60 196 Q60 206 50 206 Q40 206 40 196 Z" fill="${s.liquid}" opacity="${s.type==='sparkling'||s.type==='white'?'.45':'.6'}"/>
    ${sparkle}
    <rect x="44" y="12" width="12" height="16" rx="2" fill="${capColor}"/>
    <rect x="43.5" y="26" width="13" height="4" fill="${capColor}" opacity=".85"/>
    <rect x="37" y="120" width="26" height="56" rx="2" fill="#f7f0e7" stroke="#d8c9b0"/>
    <rect x="37" y="125" width="26" height="2" fill="#7b1e2b"/>
    <rect x="37" y="170" width="26" height="2" fill="#b3963f"/>
    <text x="50" y="150" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" fill="#7b1e2b" transform="rotate(90 50 150)">${labelTxt}</text>
    <rect x="41" y="48" width="3" height="150" rx="2" fill="#fff" opacity=".18"/></svg>`;
}
function thumbHTML(v, w, big){
  if(w && w.img) return `<img class="ph${big?' big':''}" src="${w.img}" alt="" loading="lazy" onerror="this.outerHTML=this.nextElementSibling?'':''"/>`+bottleSVG(v,w,big);
  return bottleSVG(v,w,big);
}
function badges(w){
  let h='';
  if(w.role==='second') h+=`<span class="wb pick2">세컨드 픽</span>`;
  if(w.role==='alt') h+=`<span class="wb altb">구매 가능 대안</span>`;
  if(w.stock==='F') h+=`<span class="wb oos">장바구니 비활성</span>`;
  if(w.viv) h+=`<span class="wb viv">vivino ${esc(w.viv)}</span>`;
  return h;
}

/* mini axes for card */
function miniAxes(v){
  return `<div class="miniaxes">${AXES.map(([k,lbl])=>{
    const val=v.struct[k]||0;const col=val>=66?'#7b1e2b':val>=40?'#9a4b34':'#9a7b3f';
    return `<span class="mx">${lbl}<span class="mxbar"><i style="width:${val}%;background:${col}"></i></span></span>`;
  }).join('')}</div>`;
}

/* ---------- filtering ---------- */
/* 낮음/중간/높음 중복 선택: 선택된 레벨 중 하나라도 일치하면 통과 (축별 OR, 축 간 AND) */
function tasteOK(val, wantSet){
  if(!wantSet.size) return true;
  return wantSet.has(level(val));
}
function foodMatchWine(w){
  if(!state.foods.size) return true;
  const txt=(w.pair||'').toLowerCase();
  for(const tag of state.foods){
    const ft=DATA.foodTags.find(f=>f.tag===tag);
    if(ft && ft.keys.some(k=>txt.includes(k.toLowerCase()))) return true;
  }
  return false;
}
function wineOK(w){
  if(state.stock==='Y' && w.stock!=='Y') return false;
  return foodMatchWine(w);
}
function passFilters(v){
  if(state.color!=='all' && v.color!==state.color) return false;
  if(state.q){
    const q=state.q.toLowerCase();
    const inWine=allWines(v).some(({w})=>w.wine.toLowerCase().includes(q));
    if(!(v.ko.toLowerCase().includes(q)||(v.en||'').toLowerCase().includes(q)||inWine)) return false;
  }
  for(const [k] of AXES){
    if(k==='tannin' && v.color!=='레드' && !state.taste[k].size) continue;
    if(!tasteOK(v.struct[k]==null?0:v.struct[k], state.taste[k])) return false;
  }
  if(state.aromas.size){
    let hit=false;
    for(const a of state.aromas){ if(v.aromaKeys.includes(a)){hit=true;break;} }
    if(!hit) return false;
  }
  // 가격대·마리아주·재고 필터: 조건에 맞는 병이 하나라도 있으면 통과
  const ws=allWines(v).filter(({tk,w})=>(!state.tiers.size||state.tiers.has(tk)) && wineOK(w));
  if(!ws.length) return false;
  return true;
}
function visibleWineCount(list){
  let n=0;
  for(const v of list){
    n+=allWines(v).filter(({tk,w})=>(!state.tiers.size||state.tiers.has(tk)) && wineOK(w)).length;
  }
  return n;
}

/* ---------- food pairing (실시간 Top 3 추천) ---------- */
const FOOD_SYN = {
  '스테이크':['스테이크','소고기','등심','안심','비프','붉은 고기','그릴'],
  '소고기':['소고기','스테이크','등심','비프','갈비','불고기'],
  '삼겹살':['돼지','포크','삼겹','목살','수육','보쌈','바비큐'],
  '돼지':['돼지','포크','삼겹','목살','수육'],
  '치킨':['닭','치킨','가금','오리','로스트 치킨'],'닭':['닭','치킨','가금'],'오리':['오리','가금'],
  '양':['양','램','양갈비','양고기'],'양고기':['양','양갈비','램'],
  '회':['해산물','생선','굴','조개','세비체','문어','광어','사시미'],'사시미':['해산물','생선','회'],
  '초밥':['초밥','스시','해산물','생선'],'생선':['생선','해산물','구운 생선'],
  '해산물':['해산물','조개','굴','새우','문어','생선','랍스터','관자'],'굴':['굴','해산물','조개'],
  '새우':['새우','해산물'],'문어':['문어','해산물'],'연어':['연어','생선','해산물'],
  '치즈':['치즈','블루치즈','염소치즈','경성','만체고','파르미지아노','브리'],
  '파스타':['파스타','토마토','라구','미트소스','크림','리조토'],'피자':['피자','토마토'],
  '바비큐':['바비큐','립','구운','그릴','훈제'],'스튜':['스튜','브레이즈','굴라시','라구'],
  '버섯':['버섯','트러플','리소토'],'디저트':['디저트','케이크','초콜릿','과일','타르트','아이스크림'],
  '초콜릿':['초콜릿','디저트'],'케이크':['케이크','디저트','과일'],
  '샐러드':['샐러드','채소','전채','가벼운'],'커리':['커리','카레','향신료','인도','태국'],
  '매운':['매운','매콤','향신료','마라','떡볶이'],'떡볶이':['매콤','매운','떡볶이'],
  '햄버거':['햄버거','바비큐','소고기'],'족발':['돼지','수육','보쌈'],'보쌈':['돼지','수육','보쌈'],
  '불고기':['불고기','소고기','한식'],'갈비':['갈비','소고기','바비큐'],
  '전':['전','튀김','부침'],'튀김':['튀김','전','가벼운'],'타파스':['타파스','하몬','살루미','전채'],
  '푸아그라':['푸아그라','디저트','귀부'],'한식':['불고기','제육','갈비','전','비빔']
};
function expandFood(text){
  const out=new Set(); const t=text.trim();
  if(!t) return out;
  out.add(t);
  for(const key in FOOD_SYN){ if(t.includes(key)) FOOD_SYN[key].forEach(x=>out.add(x)); }
  t.split(/[\s,]+/).filter(Boolean).forEach(x=>out.add(x));
  return out;
}
function pairResults(food){
  const terms=[...expandFood(food)];
  const res=[];
  for(const v of V){
    if(state.color!=='all' && v.color!==state.color) continue;
    for(const tk of TIERS){
      for(const w of (v.tiers[tk]||[])){
        if(state.tiers.size && !state.tiers.has(tk)) continue;
        if(state.stock==='Y' && w.stock!=='Y') continue;
        const pairTxt=(w.pair+' '+v.pair).toLowerCase();
        let score=0, matched=[];
        for(const term of terms){
          if(!term) continue;
          if(pairTxt.includes(term.toLowerCase())){ score+=(term===food?3:1); if(!matched.includes(term))matched.push(term); }
        }
        if(score>0){
          if(w.viv) score+=parseFloat(w.viv)-3.5;       // 비비노 가점
          if(w.stock==='Y') score+=0.4;                  // 구매 가능 가점
          res.push({v,tk,w,score,matched});
        }
      }
    }
  }
  res.sort((a,b)=> b.score-a.score || a.v.no-b.v.no);
  return res.slice(0,30);
}

/* ---------- renders ---------- */
function varietyCard(v){
  const mw=mainWine(v);
  const cnt=allWines(v).length;
  return `<div class="vc" onclick="go('v/${v.no}')">
    <div class="thumb">${thumbHTML(v, mw&&mw.w, false)}</div>
    <div class="vinfo">
      <div class="vno">No.${v.no} · <span class="badge ${colorClass(v)}">${v.color}</span> <span class="cnt">${cnt}병</span></div>
      <div class="vname">${esc(v.ko)} <span class="ven">${esc(v.en)}</span></div>
      <div class="vsum">${esc(v.summary)}</div>
      ${miniAxes(v)}
    </div>
  </div>`;
}

function renderHome(){
  document.body.classList.remove('subpage');
  const list=V.filter(passFilters);
  const view=$('#view');
  $('#resultMeta').textContent=`${list.length}개 품종·스타일 · ${visibleWineCount(list)}병`;
  if(!list.length){ view.innerHTML=`<div class="empty">조건에 맞는 와인이 없어요.<br>필터를 조정해 보세요.</div>`; return; }
  view.innerHTML=`<div class="grid">${list.map(varietyCard).join('')}</div>`
    +`<footer class="foot">와인 200 · 이마트 대전복합터미널점 매대 영상(2026.07) 판독 기준<br>붉은 「장바구니 비활성」 표시는 촬영 시점 결품 추정 상품입니다.</footer>`;
  window.scrollTo(0,0);
}

const MEDALS=['🥇 TOP 1','🥈 TOP 2','🥉 TOP 3'];
function pairCard(r,i){
  const medal=i<3?`<span class="medal">${MEDALS[i]}</span>`:'';
  return `<div class="tier ${i<3?'top3':''}" onclick="go('w/${r.v.no}/${encodeURIComponent(r.tk)}/${r.w.id}')">
    <div class="tier-h">${medal}<span class="tbadge ${TIER_CLASS[r.tk]}">${TIER_LABEL[r.tk]}</span>
      <span class="twine">${esc(r.w.wine)}</span><span class="go">›</span></div>
    <div class="tprv">${esc(r.v.ko)} · ${esc(r.v.color)} · ₩${won(r.w.price)} ${badges(r.w)}</div>
    <div class="reason">마리아주 ${esc(r.w.pair)}</div>
  </div>`;
}
function renderPair(){
  document.body.classList.remove('subpage');
  const view=$('#view');
  const food=state.pairFood;
  const res=pairResults(food);
  $('#resultMeta').textContent=`“${food}” 마리아주 추천 ${res.length}건`;
  if(!res.length){ view.innerHTML=`<div class="empty">“${esc(food)}”에 딱 맞는 마리아주를 못 찾았어요.<br>다른 음식명을 입력해 보세요. (예: 스테이크, 회, 치즈, 디저트)</div>`; return; }
  const top=res.slice(0,3), rest=res.slice(3);
  view.innerHTML=`<div class="sectitle">🍷 “${esc(food)}” 최고의 마리아주 TOP 3</div>
    <div class="tiers">${top.map(pairCard).join('')}</div>`
    +(rest.length?`<div class="sectitle sub">이 와인들도 잘 어울려요</div><div class="tiers">${rest.map((r,i)=>pairCard(r,i+3)).join('')}</div>`:'')
    +`<footer class="foot">추천 점수 = 마리아주 일치도 + Vivino 평점 + 구매 가능 여부. 리스트 안 200병 기준입니다.</footer>`;
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
function pills(w){
  const st=w.st;
  const items=[['당도',st.당도],['산도',st.산도]];
  if(!w.noTannin) items.push(['타닌',st.타닌]);
  items.push(['바디',st.바디]);
  const cols={'당도':'#b9893b','산도':'#6f8f3f','타닌':'#7a4a6e','바디':'#7b1e2b'};
  let h=items.map(([k,val])=>`<span class="pill"><i style="width:${val}%;background:${cols[k]}"></i><span><b>${k}</b> ${val}</span></span>`).join('');
  h+=`<span class="pill"><span><b>도수</b> ${esc(st.도수||'')}</span></span>`;
  return `<div class="pills">${h}</div>`;
}

function tierRow(v,tk,w){
  return `<div class="tier" onclick="go('w/${v.no}/${encodeURIComponent(tk)}/${w.id}')">
    <div class="tier-h"><span class="tbadge ${TIER_CLASS[tk]}">${TIER_LABEL[tk]}</span>
      <span class="twine">${esc(w.wine)}</span><span class="go">›</span></div>
    <div class="tprv">${esc(w.prv)} · ₩${won(w.price)} ${badges(w)}</div>
  </div>`;
}
function renderVariety(no){
  document.body.classList.add('subpage');
  const v=byNo[no]; if(!v){go('');return;}
  $('#brandTitle').innerHTML=`No.${v.no}`;
  const mw=mainWine(v);
  const view=$('#view');
  const tiersHtml=TIERS.map(tk=>{
    const arr=v.tiers[tk]||[];
    if(!arr.length) return `<div class="tier off"><div class="tier-h"><span class="tbadge off">${TIER_LABEL[tk]}</span><span class="twine dim">해당 가격대 재고 없음</span></div></div>`;
    return arr.map(w=>tierRow(v,tk,w)).join('');
  }).join('');
  view.innerHTML=`<div class="detail">
    <div class="dhero">
      <div class="thumb">${thumbHTML(v,mw&&mw.w,false)}</div>
      <div class="dhead">
        <div class="dno">No.${v.no} · <span class="badge ${colorClass(v)}">${v.color}</span></div>
        <div class="dname">${esc(v.ko)}</div>
        <div class="den">${esc(v.en)}</div>
        <div class="dsum">${esc(v.summary)}</div>
      </div>
    </div>
    <div class="block"><h3>구조 (0-100)</h3>${structBars(v)}</div>
    <div class="block"><h3>맛·향 구성 (대표 와인 기준)</h3>${flavorBar(v)}</div>
    <div class="block"><h3>품종 정보</h3>
      <div class="info">
        <div class="irow"><span class="k">고향</span><span class="v">${esc(v.home)}</span></div>
        <div class="irow"><span class="k">유래</span><span class="v">${esc(v.parent)}</span></div>
        <div class="irow"><span class="k">주요 산지</span><span class="v">${esc(v.region)}</span></div>
        <div class="irow"><span class="k">마리아주</span><span class="v">${esc(v.pair)}</span></div>
      </div>
      <div class="terroir"><b>떼루아</b> ${esc(v.terroir)}</div>
      ${v.feature?`<div class="feature"><b>특징</b> ${esc(v.feature)}</div>`:''}
    </div>
    <div class="block"><h3>이 향이 느껴져요</h3>
      <div class="atags">${v.aromaKeys.map(a=>`<span class="atag">${esc(a)}</span>`).join('')}</div>
    </div>
    <div class="block"><h3>가격대별 추천 와인 · 이마트 대전복합터미널점</h3>
      <div class="tiers">${tiersHtml}</div>
    </div>
  </div>`;
  window.scrollTo(0,0);
}

function renderWine(no,tier,id){
  document.body.classList.add('subpage');
  const v=byNo[no]; if(!v){go('');return;}
  const arr=v.tiers[tier]||[];
  const w=arr.find(x=>x.id===id)||arr[0];
  if(!w){go('v/'+no);return;}
  $('#brandTitle').innerHTML=TIER_LABEL[tier];
  const view=$('#view');
  view.innerHTML=`<div class="detail">
    <div class="crumb" onclick="go('v/${v.no}')">‹ ${esc(v.ko)} (No.${v.no})</div>
    <div class="wine-hero">
      <div class="bottle-wrap">${w.img?`<img class="realph" src="${w.img}" alt="" onerror="this.remove()"/>`:bottleSVG(v,w,true)}</div>
      <div class="wine-tier-badge"><span class="tbadge ${TIER_CLASS[tier]}">${TIER_LABEL[tier]}</span> ${badges(w)}</div>
      <div class="wname">${esc(w.wine)}</div>
      <div class="wprv">${esc(w.prv)}${w.vintage&&w.vintage!=='NV'?' · '+esc(w.vintage)+' 빈티지':(w.vintage==='NV'?' · NV':'')}</div>
      <div class="wprice">₩${won(w.price)} <span class="per">· 100ml당 ₩${won(w.per100)}</span>${w.star?` <span class="star">★ ${esc(w.star)}${w.rev?` (${esc(w.rev)})`:''}</span>`:''}</div>
    </div>
    ${w.stock==='F'?`<div class="oosbox">🛒 촬영 시점에 앱 장바구니가 비활성(결품 추정)이었던 상품입니다. 방문 전 매장에 입고 여부를 문의하세요.</div>`:''}
    <div class="tdesc">${esc(w.desc)}</div>
    ${pills(w)}
    <div class="block"><h3>서빙 가이드</h3>
      <div class="servegrid">
        <div class="serve"><span class="si">🌡</span><div><b>시음 온도</b><br>${esc(w.temp)}</div></div>
        <div class="serve"><span class="si">🍷</span><div><b>추천 글라스</b><br>${esc(w.glass)}</div></div>
      </div>
    </div>
    <div class="block"><h3>맛·향 / 마리아주</h3>
      <div class="pairbox"><b>맛·향</b> ${esc(w.taste)}<br><b>마리아주</b> ${esc(w.pair)}</div>
    </div>
    <div class="block"><h3>원산지 · 등급 · 양조</h3>
      <div class="info">
        <div class="irow"><span class="k">원산지</span><span class="v">${esc(w.origin)}</span></div>
        ${w.grade?`<div class="irow"><span class="k">등급</span><span class="v">${esc(w.grade)}</span></div>`:''}
        <div class="irow"><span class="k">세파주</span><span class="v">${esc(w.cepage)}</span></div>
        <div class="irow"><span class="k">떼루아</span><span class="v">${esc(w.terroir)}</span></div>
        <div class="irow"><span class="k">양조·스타일</span><span class="v">${esc(w.method)}</span></div>
      </div>
    </div>
    <div class="buy"><b>구매처</b> ▸ ${esc(w.buy)}${w.note?` <span class="wb note">${esc(w.note)}</span>`:''}</div>
    <div class="block"><h3>품종 정보</h3>
      <div class="tier" onclick="go('v/${v.no}')">
        <div class="tier-h"><span class="twine">${esc(v.ko)} · ${esc(v.en)}</span><span class="go">›</span></div>
        <div class="tprv">${esc(v.summary)}</div>
      </div>
    </div>
    <footer class="foot">사진은 매장 앱 화면에서 추출한 실물 상품 이미지입니다.</footer>
  </div>`;
  window.scrollTo(0,0);
}

/* ---------- router ---------- */
function go(path){ location.hash='#/'+path; }
function route(){
  const h=location.hash.replace(/^#\/?/,'');
  const parts=h.split('/').filter(Boolean);
  if(parts[0]==='v'){ renderVariety(+parts[1]); }
  else if(parts[0]==='w'){ renderWine(+parts[1], decodeURIComponent(parts[2]), parts[3]); }
  else { $('#brandTitle').innerHTML='WINE <span>200</span>'; document.body.classList.remove('subpage');
    state.mode==='pair'? renderPair() : renderHome(); }
}
window.addEventListener('hashchange', route);

/* ---------- filter drawer ---------- */
function buildDrawer(){
  const b=$('#drawerBody');
  let html=`<div class="fgroup"><span class="flbl">맛 (낮음·중간·높음 중복 선택 — 하나라도 해당하면 표시)</span>`;
  for(const [k,lbl] of AXES){
    html+=`<div class="taste-axis"><div class="tname">${lbl}</div>
      <div class="seg4 multi" data-axis="${k}">
        <button data-val="0" class="${state.taste[k].size===0?'on':''}">무관</button>
        ${['낮음','중간','높음'].map((t,i)=>`<button data-val="${i+1}" class="${state.taste[k].has(i+1)?'on':''}">${t}</button>`).join('')}
      </div></div>`;
  }
  html+=`</div>`;
  html+=`<div class="fgroup"><span class="flbl">가격대</span><div class="tierchips" id="tierChips">
    ${TIERS.map(tk=>`<button class="tc ${state.tiers.has(tk)?'on':''}" data-tier="${tk}">${TIER_LABEL[tk]}</button>`).join('')}
  </div></div>`;
  html+=`<div class="fgroup"><span class="flbl">재고</span><div class="tierchips">
    <button class="tc ${state.stock==='all'?'on':''}" data-stock="all">전체 (비활성 포함)</button>
    <button class="tc ${state.stock==='Y'?'on':''}" data-stock="Y">구매 가능만</button>
  </div></div>`;
  html+=`<div class="fgroup"><span class="flbl">마리아주 (하나라도 해당하는 와인 표시)</span><div class="aromachips">
    ${DATA.foodTags.map(f=>`<button class="fc ${state.foods.has(f.tag)?'on':''}" data-food="${esc(f.tag)}">${esc(f.tag)}</button>`).join('')}
  </div></div>`;
  html+=`<div class="fgroup"><span class="flbl">향 (선택한 향이 하나라도 포함된 품종)</span>`;
  for(const g of DATA.aromaGroups){
    html+=`<div class="acgroup-t">${g.group}</div><div class="aromachips">
      ${g.aromas.map(a=>`<button class="ac ${state.aromas.has(a)?'on':''}" data-aroma="${esc(a)}">${esc(a)}</button>`).join('')}
    </div>`;
  }
  html+=`</div>`;
  b.innerHTML=html;
  b.querySelectorAll('.seg4').forEach(seg=>{
    const ax=seg.dataset.axis;
    seg.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
      const val=+btn.dataset.val;
      if(val===0){ state.taste[ax].clear(); }
      else{
        if(state.taste[ax].has(val)) state.taste[ax].delete(val);
        else state.taste[ax].add(val);
      }
      seg.querySelectorAll('button').forEach(x=>{
        const v2=+x.dataset.val;
        x.classList.toggle('on', v2===0? state.taste[ax].size===0 : state.taste[ax].has(v2));
      });
    });
  });
  b.querySelectorAll('.tc[data-tier]').forEach(c=>c.onclick=()=>{ const tk=c.dataset.tier;
    if(state.tiers.has(tk)){state.tiers.delete(tk);c.classList.remove('on');}else{state.tiers.add(tk);c.classList.add('on');} });
  b.querySelectorAll('.tc[data-stock]').forEach(c=>c.onclick=()=>{ state.stock=c.dataset.stock;
    b.querySelectorAll('.tc[data-stock]').forEach(x=>x.classList.toggle('on',x.dataset.stock===state.stock)); });
  b.querySelectorAll('.fc').forEach(c=>c.onclick=()=>{ const f=c.dataset.food;
    if(state.foods.has(f)){state.foods.delete(f);c.classList.remove('on');}else{state.foods.add(f);c.classList.add('on');} });
  b.querySelectorAll('.ac').forEach(c=>c.onclick=()=>{ const a=c.dataset.aroma;
    if(state.aromas.has(a)){state.aromas.delete(a);c.classList.remove('on');}else{state.aromas.add(a);c.classList.add('on');} });
}
function openDrawer(){ buildDrawer(); $('#drawer').classList.add('open'); $('#drawerOverlay').classList.add('open'); }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#drawerOverlay').classList.remove('open'); }
function filterCount(){
  let n=0; for(const k in state.taste) n+=state.taste[k].size;
  n+=state.tiers.size+state.aromas.size+state.foods.size+(state.stock==='Y'?1:0);
  $('#filterCount').textContent=n?n:'';
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
  $('#resetFilters').onclick=()=>{ for(const k in state.taste) state.taste[k].clear();
    state.tiers.clear();state.aromas.clear();state.foods.clear();state.stock='all'; buildDrawer(); filterCount(); };
  if(!location.hash) location.hash='#/';
  route();
}
init();
