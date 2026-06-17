import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://wsygeerxfdaavdtvogvy.supabase.co',
  'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk'
);

const AR = /[\u0600-\u06FF]/;
const LAT = /[A-Za-z]/;

const AR_TO_LAT = {
  'ا':'a','أ':'a','إ':'i','آ':'a','ء':'','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h',
  'خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t',
  'ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h',
  'و':'w','ؤ':'w','ي':'y','ى':'a','ئ':'y','ة':'h','لا':'la',
};

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

function arKey(name) {
  let k = '';
  for (const ch of name) k += AR_TO_LAT[ch] ?? (/\s/.test(ch) ? ' ' : '');
  return norm(k);
}

function sim(a,b) {
  const mx=Math.max(a.length,b.length); if(!mx) return 1;
  const dp=Array.from({length:a.length+1},(_,i)=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)dp[i][0]=i;
  for(let j=0;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return 1-dp[a.length][b.length]/mx;
}

function splitNC(name) {
  const parts = name.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2 && AR.test(parts[parts.length - 1]))
    return { core: parts.slice(0, -1).join(' - '), country: parts[parts.length - 1] };
  return { core: name, country: null };
}

async function fetchAll(table, cols) {
  const rows=[]; let from=0;
  while(true){
    const {data,error}=await supabase.from(table).select(cols).range(from,from+999);
    if(error) throw error;
    if(!data?.length) break;
    rows.push(...data);
    if(data.length<1000) break;
    from+=1000;
  }
  return rows;
}

function countUsage(name, usedSet) {
  return usedSet.has(name) ? 'used' : 'unused';
}

// Load referees
const refRows = (await fetchAll('db_REFEREES', 'REFEREE_ID, REFEREE_NAME'))
  .map(r => ({ id: r.REFEREE_ID, name: (r.REFEREE_NAME||'').trim() }))
  .filter(r => r.name);

const arabicOnly = refRows.filter(r => AR.test(r.name) && !LAT.test(r.name));
const mixed = refRows.filter(r => AR.test(r.name) && LAT.test(r.name));

// Usage in match tables
const usedNames = new Set();
for (const table of ['alahly_MATCHDETAILS', 'egy_NT_MATCHDETAILS']) {
  const rows = await fetchAll(table, 'REFREE');
  rows.forEach(r => { const v = (r.REFREE||'').trim(); if(v) usedNames.add(v); });
}

const pairs = [];

for (const ar of arabicOnly) {
  const arS = splitNC(ar.name);
  if (!arS.country || arS.country === '؟') continue;
  const arWords = arKey(arS.core).split(' ').filter(Boolean);
  const arLast = arWords[arWords.length - 1] || '';
  if (arLast.length < 3) continue;

  let best = null;
  for (const en of mixed) {
    const enS = splitNC(en.name);
    if (enS.country !== arS.country) continue;
    const enWords = norm(enS.core).split(' ').filter(Boolean);
    const enLast = enWords[enWords.length - 1] || '';
    const lastSim = sim(arLast, enLast);
    const fullSim = sim(arKey(arS.core), norm(enS.core));

    // Last name match is key for Egyptian/Arab refs
    if (lastSim < 0.78) continue;

    let score = lastSim;
    const reasons = [`last ${Math.round(lastSim*100)}%`];
    if (fullSim >= 0.65) { score = Math.max(score, fullSim); reasons.push(`full ${Math.round(fullSim*100)}%`); }

    const firstSim = sim(arWords[0]||'', enWords[0]||'');
    if (firstSim >= 0.7) { score = Math.max(score, 0.82); reasons.push(`first ${Math.round(firstSim*100)}%`); }

    if (!best || score > best.score) {
      best = {
        score: Math.round(score * 100),
        confidence: lastSim >= 0.9 && firstSim >= 0.65 ? 'high' :
          lastSim >= 0.85 ? 'medium' : 'review',
        reasons,
        country: arS.country,
        arabic_id: ar.id,
        arabic_name: ar.name,
        english_id: en.id,
        english_name: en.name,
        arabic_usage: countUsage(ar.name, usedNames),
        english_usage: countUsage(en.name, usedNames),
        suggested_target: countUsage(en.name, usedNames) === 'used' ? en.name :
          countUsage(ar.name, usedNames) === 'used' ? ar.name : en.name,
      };
    }
  }
  if (best && best.score >= 78) pairs.push(best);
}

pairs.sort((a,b) => b.score - a.score);
const usedEn = new Set(), filtered = [];
for (const p of pairs) {
  if (usedEn.has(p.english_id)) continue;
  usedEn.add(p.english_id);
  filtered.push(p);
}

// English variants
const enVariants = [];
for (let i = 0; i < mixed.length; i++) {
  for (let j = i + 1; j < mixed.length; j++) {
    const a = mixed[i], b = mixed[j];
    const aS = splitNC(a.name), bS = splitNC(b.name);
    if (aS.country !== bS.country || !aS.country) continue;
    const na = norm(aS.core), nb = norm(bS.core);
    if (na === nb) {
      enVariants.push({ type: 'identical', confidence: 'high', score: 100,
        name_a: a.name, id_a: a.id, name_b: b.name, id_b: b.id,
        usage_a: countUsage(a.name, usedNames), usage_b: countUsage(b.name, usedNames),
        suggested_target: countUsage(a.name, usedNames)==='used'?a.name:countUsage(b.name, usedNames)==='used'?b.name:a.name });
      continue;
    }
    const wA = na.split(' ').filter(x=>x.length>=3);
    const wB = nb.split(' ').filter(x=>x.length>=3);
    const overlap = wA.filter(w => wB.some(w2 => sim(w,w2)>=0.92)).length;
    if (overlap >= Math.min(wA.length,wB.length)-1 && overlap>=2) {
      enVariants.push({ type: 'similar', confidence: overlap>=wA.length?'high':'medium',
        score: Math.round(100*overlap/Math.max(wA.length,wB.length)), country: aS.country,
        name_a: a.name, id_a: a.id, name_b: b.name, id_b: b.id,
        usage_a: countUsage(a.name, usedNames), usage_b: countUsage(b.name, usedNames),
        suggested_target: [a,b].find(x=>countUsage(x.name,usedNames)==='used')?.name || (a.name.length>=b.name.length?a.name:b.name) });
    }
  }
}

const vSeen = new Set();
const enVariantsDedup = enVariants.filter(p=>{
  const k=[p.id_a,p.id_b].sort().join('|');
  if(vSeen.has(k))return false; vSeen.add(k); return true;
});

const report = {
  stats: {
    total: refRows.length,
    arabic_only: arabicOnly.length,
    mixed: mixed.length,
    unique_used_in_matches: usedNames.size,
  },
  arabic_vs_english: filtered.sort((a,b)=>a.arabic_name.localeCompare(b.arabic_name,'ar')),
  english_spelling_variants: enVariantsDedup.sort((a,b)=>b.score-a.score),
};

writeFileSync('scripts/referee-duplicate-analysis.json', JSON.stringify(report, null, 2), 'utf8');

console.log('Pairs found:', filtered.length);
filtered.forEach(p => console.log(JSON.stringify({
  conf: p.confidence, score: p.score,
  ar: p.arabic_name, en: p.english_name,
  usage: `${p.arabic_usage}/${p.english_usage}`, target: p.suggested_target
})));

console.log('\nEN variants:', enVariantsDedup.length);
