/* Interactive map (Leaflet) — curved arcs with time+cost labels on each connection.
   window.PLACES, window.makeMap(elId,{route:[ids],alts:[ids],onClick,onEdge}). Uses window.MAPARCS (Node-built). */
(function(){
  window.PLACES={
    rio:{n:'Rio de Janeiro',lat:-22.9068,lng:-43.1729,dir:'right'},
    'ilha-grande':{n:'Ilha Grande',lat:-23.1526,lng:-44.2290,dir:'left'},
    paraty:{n:'Paraty',lat:-23.2178,lng:-44.7131,dir:'left'},
    buzios:{n:'Búzios',lat:-22.7469,lng:-41.8817,dir:'right'},
    arraial:{n:'Arraial do Cabo',lat:-22.9661,lng:-42.0278,dir:'right'},
    iguacu:{n:'Iguaçu Falls',lat:-25.6953,lng:-54.4367,dir:'left'},
    chapada:{n:'Chapada Diamantina',lat:-12.5616,lng:-41.3872,dir:'right'},
    lencois:{n:'Lençóis Maranhenses',lat:-2.7550,lng:-42.8240,dir:'top'},
    bonito:{n:'Bonito',lat:-21.1261,lng:-56.4836,dir:'left'},
    manaus:{n:'Manaus & Amazon',lat:-3.1190,lng:-60.0217,dir:'right'},
    pantanal:{n:'Pantanal',lat:-16.50,lng:-56.75,dir:'left'},
    salvador:{n:'Salvador',lat:-12.9777,lng:-38.5016,dir:'right'},
    saopaulo:{n:'São Paulo',lat:-23.5505,lng:-46.6333,dir:'bottom'},
  };
  const css=`
  .leaflet-container{background:#0a0f0d!important;font-family:'DM Sans',sans-serif!important;border-radius:16px}
  .lf-mk{position:relative}
  .lf-dot{position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;
    border:2.5px solid #0a0f0d;box-shadow:0 1px 6px rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;
    font:800 9px/1 'JetBrains Mono',monospace;color:#04140c}
  .lf-dot.alt{width:12px;height:12px;border-width:2px}
  .lf-pulse{position:absolute;left:0;top:0;width:18px;height:18px;border-radius:50%;transform:translate(-50%,-50%);opacity:.3;animation:lfp 2.6s ease-out infinite}
  @keyframes lfp{0%{transform:translate(-50%,-50%) scale(1);opacity:.35}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0}}
  .lf-edge{position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-family:'JetBrains Mono',monospace;font-size:10px;
    font-weight:600;white-space:nowrap;background:rgba(8,14,11,.92);border:1px solid #00d47b66;color:#bfe9d2;
    padding:2px 8px;border-radius:99px;box-shadow:0 2px 10px rgba(0,0,0,.6);cursor:pointer}
  .lf-edge:hover{border-color:#00d47b;color:#eafff3}
  .leaflet-tooltip.lf-tip{background:rgba(8,14,11,.9)!important;border:1px solid #1e2b22!important;color:#e8efe8!important;
    font-family:'Playfair Display',serif!important;font-weight:700!important;font-size:11px!important;box-shadow:0 2px 8px rgba(0,0,0,.6)!important;padding:2px 7px!important}
  .leaflet-tooltip.lf-tip.alt{color:#ffb27a!important;font-size:10px!important}
  .leaflet-tooltip.lf-tip::before{display:none!important}
  .leaflet-popup-content-wrapper{background:#162019!important;color:#e8efe8!important;border:1px solid #1e2b22!important;border-radius:10px!important}
  .leaflet-popup-tip{background:#162019!important}.leaflet-popup-content{font-size:13px!important;margin:8px 12px!important}
  .leaflet-control-zoom a{background:#111916!important;color:#e8efe8!important;border-color:#1e2b22!important}
  .leaflet-bar{border:none!important;box-shadow:0 1px 6px rgba(0,0,0,.5)!important}`;
  let injected=false;
  function inject(){ if(injected)return; injected=true; const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); }

  function bezier(a,b,bend,n){ const mx=(a.lng+b.lng)/2,my=(a.lat+b.lat)/2,dx=b.lng-a.lng,dy=b.lat-a.lat;
    const cx=mx-dy*bend,cy=my+dx*bend,pts=[]; for(let i=0;i<=n;i++){const t=i/n,u=1-t;
      pts.push([u*u*a.lat+2*u*t*cy+t*t*b.lat, u*u*a.lng+2*u*t*cx+t*t*b.lng]); }
    return {pts,mid:[cy,cx]}; }
  function edgeData(fromId,toId){ const arcs=window.MAPARCS||[];
    return arcs.find(e=>(e.from===fromId&&e.to===toId)||(e.from===toId&&e.to===fromId))||null; }

  window.makeMap=function(elId,opts){
    inject(); opts=opts||{};
    const map=L.map(elId,{zoomControl:true,scrollWheelZoom:false,attributionControl:false}).setView([-15,-50],3.4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:18}).addTo(map);
    const layer=L.layerGroup().addTo(map);

    function placeMarker(id,i,isAlt){
      const p=PLACES[id]; if(!p)return null;
      const color=isAlt?'#ff8c42':'#00d47b';
      const html=`${isAlt?'':`<div class="lf-pulse" style="background:${color}"></div>`}<div class="lf-dot ${isAlt?'alt':''}" style="background:${color}">${isAlt?'':(i+1)}</div>`;
      const m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'lf-mk',iconSize:[0,0],html}),zIndexOffset:isAlt?0:1000});
      m.bindTooltip(p.n,{permanent:!isAlt,direction:p.dir||'right',className:'lf-tip'+(isAlt?' alt':''),offset:dirOffset(p.dir,isAlt)});
      m.on('click',()=>opts.onClick&&opts.onClick(id));
      m.bindPopup('<b>'+p.n+'</b>'+(isAlt?'<br><span style="color:#ff8c42;font-size:11px">alternative</span>':'<br><span style="color:#88a08c;font-size:11px">stop '+(i+1)+'</span>'));
      return m;
    }
    function dirOffset(d,isAlt){const k=isAlt?9:12;return d==='left'?[-k,0]:d==='top'?[0,-k]:d==='bottom'?[0,k]:[k,0];}

    function edge(fromId,toId){
      const A=PLACES[fromId],B=PLACES[toId]; if(!A||!B)return;
      const known=edgeData(fromId,toId);
      const geo=known&&known.arc?{pts:known.arc,mid:known.mid}:bezier(A,B,0.16,26);
      L.polyline(geo.pts,{color:'#00d47b',weight:2.5,opacity:.85}).addTo(layer);
      L.polyline(geo.pts,{color:'#00d47b',weight:9,opacity:.08}).addTo(layer); // glow
      if(known&&(known.time||known.cost)){
        const label=`${known.icon||''} ${known.time||''}${known.cost?' · '+known.cost:''}`.trim();
        const lm=L.marker(geo.mid,{icon:L.divIcon({className:'lf-mk',iconSize:[0,0],html:`<div class="lf-edge">${label}</div>`}),zIndexOffset:1500});
        lm.on('click',()=>{opts.onEdge?opts.onEdge(known.key):(opts.onClick&&opts.onClick(fromId));});
        lm.addTo(layer);
      }
    }

    function render(route,alts){
      layer.clearLayers();
      route=route||[]; alts=alts||[];
      for(let i=0;i<route.length-1;i++) edge(route[i],route[i+1]);
      route.forEach((id,i)=>{const m=placeMarker(id,i,false);if(m)m.addTo(layer);});
      alts.forEach(id=>{const m=placeMarker(id,0,true);if(m)m.addTo(layer);});
      const all=route.concat(alts).map(id=>PLACES[id]).filter(Boolean).map(p=>[p.lat,p.lng]);
      if(all.length){try{map.fitBounds(all,{padding:[55,55],maxZoom:6});}catch(e){}}
    }
    render(opts.route,opts.alts);
    setTimeout(()=>map.invalidateSize(),200);
    return {map,render,invalidate:()=>map.invalidateSize()};
  };
})();
