// Node build step: precompute curved arcs + per-connection time/cost labels for the map.
// Reads assets/logi-data.js (the workflow/codex data) and writes assets/map-arcs.js.
const fs = require('fs');
const dir = __dirname + '/assets';

// load window.LOGI from the data file
const src = fs.readFileSync(dir + '/logi-data.js', 'utf8');
const sandbox = { window: {} };
new Function('window', src)(sandbox.window);
const LOGI = sandbox.window.LOGI;

const PLACES = {
  rio:{lat:-22.9068,lng:-43.1729}, 'ilha-grande':{lat:-23.1526,lng:-44.2290},
  paraty:{lat:-23.2178,lng:-44.7131}, buzios:{lat:-22.7469,lng:-41.8817}, arraial:{lat:-22.9661,lng:-42.0278},
  iguacu:{lat:-25.6953,lng:-54.4367}, chapada:{lat:-12.5616,lng:-41.3872}, lencois:{lat:-2.7550,lng:-42.8240},
  bonito:{lat:-21.1261,lng:-56.4836}, manaus:{lat:-3.1190,lng:-60.0217}, pantanal:{lat:-16.50,lng:-56.75},
  salvador:{lat:-12.9777,lng:-38.5016}, saopaulo:{lat:-23.5505,lng:-46.6333},
};

// sequential core route edges -> the logistics connection key that covers them
const EDGES = [
  { from:'rio', to:'ilha-grande', key:'rio-ilha' },
  { from:'ilha-grande', to:'iguacu', key:'ilha-foz' },
  { from:'iguacu', to:'manaus', key:'foz-manaus' },
  { from:'manaus', to:'saopaulo', key:'manaus-sp' },
];

const byKey = {};
[].concat(LOGI.core||[], LOGI.alt||[]).forEach(c => byKey[c.key] = c);

function shortTime(t){ if(!t) return '';
  const m = String(t).match(/(\d[\d\s:.–-]*\s?(?:hours?|hrs?|h\b|min(?:ute)?s?|days?))/i);
  return (m ? m[0] : String(t)).replace(/\s+/g,' ').trim().slice(0,12); }
function shortCost(c){ if(c && c.cxPrice) return c.cxPrice.split(';')[0].replace(/\s*pp\b/i,'').trim();
  if(c && c.cost) return c.cost.split('(')[0].replace(/\s*pp\b/i,'').trim().slice(0,14); return ''; }
function modeIcon(c){ const segs=(c&&c.segments)||[]; const modes=segs.map(s=>(s.mode||'').toLowerCase()).join(' ');
  if(/flight|fly|air/.test(modes)) return '✈️';
  if(/ferry|boat|speedboat|schooner/.test(modes)) return '⛴️';
  if(/bus|coach/.test(modes)) return '🚌'; return '🚐'; }

// quadratic bezier arc, control point offset perpendicular to the segment
function arc(a, b, bend, n){
  const mx=(a.lng+b.lng)/2, my=(a.lat+b.lat)/2;
  const dx=b.lng-a.lng, dy=b.lat-a.lat;
  const cx=mx - dy*bend, cy=my + dx*bend; // perpendicular offset
  const pts=[];
  for(let i=0;i<=n;i++){ const t=i/n, u=1-t;
    const lng=u*u*a.lng + 2*u*t*cx + t*t*b.lng;
    const lat=u*u*a.lat + 2*u*t*cy + t*t*b.lat;
    pts.push([+lat.toFixed(4), +lng.toFixed(4)]);
  }
  return { pts, mid:[+cy.toFixed(4), +cx.toFixed(4)] };
}

const out = EDGES.map(e => {
  const A=PLACES[e.from], B=PLACES[e.to], c=byKey[e.key];
  const {pts, mid} = arc(A, B, 0.16, 28);
  return { key:e.key, from:e.from, to:e.to, arc:pts, mid,
    icon:modeIcon(c), time:shortTime(c&&c.total), cost:shortCost(c) };
});

fs.writeFileSync(dir + '/map-arcs.js', 'window.MAPARCS=' + JSON.stringify(out) + ';');
console.log('wrote map-arcs.js with', out.length, 'edges:');
out.forEach(e => console.log(`  ${e.from} → ${e.to}: ${e.icon} ${e.time} · ${e.cost}`));
