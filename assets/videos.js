/* Shared YouTube footage: verified video IDs + an in-app lightbox player.
   Exposes window.VIDS (maps) and window.playVid(id). Used by guide.html (and others). */
(function(){
  // one verified video per trip day (keys match guide day ids)
  const DAYVIDS={
    'rio-1':'8PFoO_h2Swc','rio-2':'xyh7M9t9p6o','rio-3':'QF2O2HTeQWY','rio-4':'tWfYAloKxzk',
    'ilha-1':'FFGX_irYS2g','ilha-2':'SiURNfawaRA','ilha-3':'MgXxUp0khYc',
    'iguacu-1':'p4R3BeelepY','iguacu-2':'N0zk5YC3hl4',
    'amazon-1':'vwS76LVPvLY','amazon-2':'skB1beVlowU','amazon-3':'fO-VlxcyFv4','amazon-4':'MEvoCxrq-nY',
    'sp-1':'phPgZC9_QhQ','sp-2':'yu0PHOC6svM','sp-3':'gTC6ZUY3gdg','sp-4':'hG2JE98UwGY','sp-5':'m2KK8Oq6koo'
  };
  // per decision-option footage (key = "<questionId>-<optIndex>") — clips of that exact activity
  const OPTVIDS={
    'lopes-mendes-vs-boat-0':'SiURNfawaRA', // Lopes Mendes hike
    'lopes-mendes-vs-boat-1':'MgXxUp0khYc', // Lagoa Azul boat tour
    'iguazu-which-sides-0':'N0zk5YC3hl4',   // Argentine side / Devil's Throat
    'activity-intensity-0':'skB1beVlowU',   // night caiman spotting
    'activity-intensity-1':'fO-VlxcyFv4',   // piranha / pink dolphin Amazon
    'sp-friday-nightlife-2':'gTC6ZUY3gdg',  // Vila Madalena
    'biggest-splurge-1':'QF2O2HTeQWY'       // Maracanã match
  };
  window.VIDS={DAYVIDS,OPTVIDS};

  const css=`
  .vplay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,0,0,.12);transition:.2s}
  .vplay:hover{background:rgba(0,0,0,.28)}
  .vplay i{width:34px;height:34px;border-radius:50%;background:rgba(220,30,40,.92);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.5)}
  .vplay i::after{content:'';border-left:11px solid #fff;border-top:7px solid transparent;border-bottom:7px solid transparent;margin-left:3px}
  .vidchip{display:inline-flex;align-items:center;gap:.35rem;cursor:pointer;font-size:.72rem;font-weight:600;color:#ff6b6b;
    border:1px solid #ff6b6b44;background:#ff6b6b14;border-radius:99px;padding:.3rem .7rem}
  .vidchip::before{content:'▶'}
  #vidlb{position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;
    padding:1rem;opacity:0;pointer-events:none;transition:opacity .2s}
  #vidlb.show{opacity:1;pointer-events:auto}
  #vidlb .box{width:100%;max-width:840px;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;border:1px solid #1e2b22}
  #vidlb iframe{width:100%;height:100%;border:0}
  #vidlb .x{position:absolute;top:max(1rem,env(safe-area-inset-top));right:1rem;width:42px;height:42px;border:none;border-radius:50%;
    background:rgba(255,255,255,.15);color:#fff;font-size:1.3rem;line-height:1;cursor:pointer}`;
  function ready(fn){document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn);}
  function ensure(){
    if(document.getElementById('vidlb'))return;
    const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    const lb=document.createElement('div');lb.id='vidlb';
    lb.innerHTML='<button class="x" aria-label="close">✕</button><div class="box"><iframe allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>';
    document.body.appendChild(lb);
    const close=()=>{lb.classList.remove('show');lb.querySelector('iframe').src='';};
    lb.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('x'))close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  window.playVid=function(id){
    if(!id)return; ensure();
    const lb=document.getElementById('vidlb');
    lb.querySelector('iframe').src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1';
    lb.classList.add('show');
  };
  ready(ensure);
})();
