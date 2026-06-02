/* Shared inline-glossary: wraps Brazilian/jargon terms with a tappable "?" explainer.
   Used by quiz.html, guide.html and index.html. Exposes window.walkTerms(root). */
(function(){
  const TERMS=[
    {key:'rodizio',label:'Rodízio',pat:'rod[ií]zios?',def:'All-you-can-eat — waiters keep bringing skewers of grilled meat to your table until you tap out.'},
    {key:'churrascaria',label:'Churrascaria',pat:'churrascarias?',def:'A Brazilian barbecue steakhouse.'},
    {key:'churrasco',label:'Churrasco',pat:'churrasco',def:'Brazilian-style barbecue — grilled meats.'},
    {key:'caipirinha',label:'Caipirinha',pat:'caipirinhas?',def:"Brazil's national cocktail: lime, sugar and cachaça (sugarcane spirit). Delicious and strong."},
    {key:'cachaca',label:'Cachaça',pat:'cachaça',def:'A Brazilian spirit distilled from sugarcane — the base of a caipirinha.'},
    {key:'boteco',label:'Boteco',pat:'botecos?',def:'A casual neighbourhood bar for cold beer and small plates.'},
    {key:'petiscos',label:'Petiscos',pat:'petiscos',def:'Small sharing plates / bar snacks.'},
    {key:'pousada',label:'Pousada',pat:'pousadas?',def:'A small, family-run guesthouse or B&B.'},
    {key:'forro',label:'Forró',pat:'forró',def:"A lively couples' dance and music style from northeast Brazil."},
    {key:'samba',label:'Samba',pat:'samba',def:"Brazil's iconic upbeat dance and music."},
    {key:'caiman',label:'Caiman',pat:'caimans?',def:'A small crocodilian found in Amazon rivers — spotted at night by torchlight.'},
    {key:'favela',label:'Favela',pat:'favelas?',def:'A self-built hillside neighbourhood / informal community.'},
    {key:'maracana',label:'Maracanã',pat:'maracanã',def:"Rio's legendary football stadium — one of the most famous on earth."},
    {key:'devils',label:"Devil's Throat",pat:"devil[''’]s throat",def:'The biggest, most dramatic section of Iguaçu Falls — a U-shaped chasm of thundering water.'},
    {key:'reais',label:'Reais (R$)',pat:'reais',def:'The Brazilian currency. Roughly R$6–7 = £1.'},
    {key:'acai',label:'Açaí',pat:'açaí',def:'A frozen purple Amazon berry, eaten like a thick smoothie bowl.'},
    {key:'mortadella',label:'Mortadella',pat:'mortadella',def:"A big bologna-style sausage; São Paulo's Mercado is famous for a towering mortadella sandwich."},
    {key:'pirarucu',label:'Pirarucu',pat:'pirarucu',def:'A giant Amazonian river fish, often grilled.'},
    {key:'tacaca',label:'Tacacá',pat:'tacacá',def:'A hot Amazonian soup with tingly jambu leaves and shrimp.'},
    {key:'bonde',label:'Bonde',pat:'bonde',def:"Rio's historic little tram in the Santa Teresa hills."},
    {key:'pinacoteca',label:'Pinacoteca',pat:'pinacoteca',def:"São Paulo's oldest art museum."},
  ];
  const DEF={},LBL={};
  TERMS.forEach(t=>{DEF[t.key]=t.def;LBL[t.key]=t.label;});
  const RE=new RegExp('(?<![\\p{L}])(?:'+TERMS.map(t=>'('+t.pat+')').join('|')+')(?![\\p{L}])','giu');

  // styles + popover element
  const css=`
  .term{color:var(--green-bright,#3affa0);border-bottom:1px dashed var(--green,#00d47b);cursor:pointer;white-space:nowrap}
  .term sup{font-size:.62em;color:var(--green,#00d47b);margin-left:1px;font-weight:700}
  #termpop{position:fixed;z-index:600;max-width:270px;background:var(--card2,#162019);border:1px solid var(--green-dim,#00d47b33);
    border-radius:12px;padding:.75rem .9rem;box-shadow:0 12px 44px rgba(0,0,0,.6);font-size:.83rem;line-height:1.5;color:var(--text,#e8efe8);
    opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;transform:translateY(6px);font-family:'DM Sans',sans-serif}
  #termpop.show{opacity:1;pointer-events:auto;transform:none}
  #termpop .tw{font-weight:700;color:var(--green-bright,#3affa0);margin-bottom:.2rem;font-size:.9rem}`;
  function ready(fn){document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn);}

  function ensurePop(){
    if(document.getElementById('termpop'))return;
    const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    const p=document.createElement('div');p.id='termpop';document.body.appendChild(p);
    document.addEventListener('click',e=>{ if(!e.target.closest||!e.target.closest('.term')) p.classList.remove('show'); });
    window.addEventListener('scroll',()=>p.classList.remove('show'),{passive:true});
  }
  window.explainTerm=function(e,key){
    e.stopPropagation();ensurePop();
    const p=document.getElementById('termpop');
    p.innerHTML='<div class="tw">'+LBL[key]+'</div>'+DEF[key];
    p.classList.add('show');
    const w=Math.min(270,innerWidth-20),x=Math.min(Math.max(10,e.clientX-w/2),innerWidth-w-10);
    let y=e.clientY+16; const ph=p.offsetHeight;
    if(y+ph>innerHeight-10) y=Math.max(10,e.clientY-ph-12);
    p.style.left=x+'px';p.style.top=y+'px';
  };

  window.walkTerms=function(root){
    if(!root)return; ensurePop();
    const skip={SCRIPT:1,STYLE:1,SUP:1,TEXTAREA:1,INPUT:1,A:1,BUTTON:0};
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
      if(!n.nodeValue||!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
      let p=n.parentNode;
      while(p&&p!==root.parentNode){
        if(p.nodeType===1){ if(skip[p.nodeName])return NodeFilter.FILTER_REJECT;
          if(p.classList&&p.classList.contains('term'))return NodeFilter.FILTER_REJECT; }
        p=p.parentNode;
      }
      RE.lastIndex=0; return RE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      const s=n.nodeValue;let m,last=0;RE.lastIndex=0;
      const frag=document.createDocumentFragment();
      while((m=RE.exec(s))){
        let gi=-1;for(let i=1;i<m.length;i++){if(m[i]!=null){gi=i-1;break;}}
        if(gi<0)continue;
        const term=TERMS[gi],whole=m[0];
        if(m.index>last)frag.appendChild(document.createTextNode(s.slice(last,m.index)));
        const span=document.createElement('span');span.className='term';span.textContent=whole;
        const sup=document.createElement('sup');sup.textContent='?';span.appendChild(sup);
        span.addEventListener('click',e=>window.explainTerm(e,term.key));
        frag.appendChild(span);last=m.index+whole.length;
      }
      if(last>0){if(last<s.length)frag.appendChild(document.createTextNode(s.slice(last)));n.parentNode.replaceChild(frag,n);}
    });
  };

  ready(()=>{ try{ walkTerms(document.body); }catch(e){} });
})();
