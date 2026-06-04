/* Shared interactive map (Leaflet). window.PLACES + window.makeMap(elId, opts).
   opts: { route:[placeIds in order], alts:[placeIds], onClick:(id)=>{} } */
(function(){
  window.PLACES={
    rio:{n:'Rio de Janeiro',lat:-22.9068,lng:-43.1729},
    'ilha-grande':{n:'Ilha Grande',lat:-23.1526,lng:-44.2290},
    paraty:{n:'Paraty',lat:-23.2178,lng:-44.7131},
    buzios:{n:'Búzios',lat:-22.7469,lng:-41.8817},
    arraial:{n:'Arraial do Cabo',lat:-22.9661,lng:-42.0278},
    iguacu:{n:'Iguaçu Falls',lat:-25.6953,lng:-54.4367},
    chapada:{n:'Chapada Diamantina',lat:-12.5616,lng:-41.3872},
    lencois:{n:'Lençóis Maranhenses',lat:-2.7550,lng:-42.8240},
    bonito:{n:'Bonito',lat:-21.1261,lng:-56.4836},
    manaus:{n:'Manaus & Amazon',lat:-3.1190,lng:-60.0217},
    pantanal:{n:'Pantanal',lat:-16.50,lng:-56.75},
    salvador:{n:'Salvador',lat:-12.9777,lng:-38.5016},
    saopaulo:{n:'São Paulo',lat:-23.5505,lng:-46.6333},
  };
  const css=`
  .leaflet-container{background:#0a0f0d!important;font-family:'DM Sans',sans-serif!important;border-radius:16px}
  .lf-mk{position:relative}
  .lf-dot{width:16px;height:16px;border-radius:50%;border:2px solid #0a0f0d;box-shadow:0 1px 5px rgba(0,0,0,.7);
    display:flex;align-items:center;justify-content:center;font:700 9px/1 'JetBrains Mono',monospace;color:#04140c}
  .lf-pulse{position:absolute;inset:-5px;border-radius:50%;opacity:.25;animation:lfp 2.4s ease-out infinite}
  @keyframes lfp{0%{transform:scale(1);opacity:.3}100%{transform:scale(2.4);opacity:0}}
  .lf-lbl{position:absolute;left:18px;top:50%;transform:translateY(-50%);white-space:nowrap;
    font:700 11px/1 'Playfair Display',serif;text-shadow:0 1px 4px #000,0 0 8px #000}
  .leaflet-popup-content-wrapper{background:#162019!important;color:#e8efe8!important;border:1px solid #1e2b22!important;border-radius:10px!important}
  .leaflet-popup-tip{background:#162019!important;border:none!important}
  .leaflet-popup-content{font-size:13px!important;margin:8px 12px!important}
  .leaflet-control-zoom a{background:#111916!important;color:#e8efe8!important;border-color:#1e2b22!important}
  .leaflet-bar{border:none!important}`;
  let injected=false;
  function inject(){ if(injected)return; injected=true; const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); }

  window.makeMap=function(elId,opts){
    inject(); opts=opts||{};
    const map=L.map(elId,{zoomControl:true,scrollWheelZoom:false,attributionControl:false}).setView([-15,-50],3.4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:18}).addTo(map);
    const layer=L.layerGroup().addTo(map);
    function icon(color,label,num,pulse){
      return L.divIcon({className:'lf-mk',iconSize:[16,16],iconAnchor:[8,8],
        html:`${pulse?`<div class="lf-pulse" style="background:${color}"></div>`:''}<div class="lf-dot" style="background:${color}">${num||''}</div>${label?`<div class="lf-lbl" style="color:${color}">${label}</div>`:''}`});
    }
    function render(route,alts){
      layer.clearLayers();
      const pts=[];
      (route||[]).forEach((id,i)=>{const p=PLACES[id];if(!p)return;pts.push([p.lat,p.lng]);
        L.marker([p.lat,p.lng],{icon:icon('#00d47b',p.n,i+1,true),zIndexOffset:1000}).addTo(layer)
          .on('click',()=>opts.onClick&&opts.onClick(id)).bindPopup('<b>'+p.n+'</b><br><span style="color:#88a08c;font-size:11px">stop '+(i+1)+'</span>');});
      if(pts.length>1)L.polyline(pts,{color:'#00d47b',weight:2.5,opacity:.75,dashArray:'2,7'}).addTo(layer);
      (alts||[]).forEach(id=>{const p=PLACES[id];if(!p)return;
        L.marker([p.lat,p.lng],{icon:icon('#ff8c42','',null,false)}).addTo(layer)
          .on('click',()=>opts.onClick&&opts.onClick(id)).bindPopup('<b>'+p.n+'</b><br><span style="color:#ff8c42;font-size:11px">alternative</span>');});
      const all=(route||[]).concat(alts||[]).map(id=>PLACES[id]).filter(Boolean).map(p=>[p.lat,p.lng]);
      if(all.length){ try{ map.fitBounds(all,{padding:[45,45],maxZoom:6}); }catch(e){} }
    }
    render(opts.route,opts.alts);
    setTimeout(()=>map.invalidateSize(),200);
    return {map,render,invalidate:()=>map.invalidateSize()};
  };
})();
