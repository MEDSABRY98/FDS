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
  'پ':'p','چ':'ch','گ':'g','ڤ':'v',
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

function lev(a,b) {
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function sim(a,b) {
  const mx=Math.max(a.length,b.length);
  return mx?1-lev(a,b)/mx:1;
}

function splitNC(name) {
  const parts = name.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2 && AR.test(parts[parts.length - 1]))
    return { core: parts.slice(0, -1).join(' - '), country: parts[parts.length - 1] };
  return { core: name, country: null };
}

async function fetchAll() {
  const rows=[]; let from=0;
  while(true){
    const {data,error}=await supabase.from('db_REFEREES').select('REFEREE_ID, REFEREE_NAME').range(from,from+999);
    if(error) throw error;
    if(!data?.length) break;
    rows.push(...data);
    if(data.length<1000) break;
    from+=1000;
  }
  return rows.map(r=>({id:r.REFEREE_ID, name:(r.REFEREE_NAME||'').trim()})).filter(r=>r.name);
}

function scoreRefPair(arEntry, enEntry) {
  const arS = splitNC(arEntry.name);
  const enS = splitNC(enEntry.name);
  if (!arS.country || arS.country !== enS.country) return null;

  const ak = arKey(arS.core);
  const ek = norm(enS.core);
  const aw = ak.split(' ').filter(Boolean);
  const ew = ek.split(' ').filter(Boolean);
  if (aw.length < 2 || ew.length < 2) return null;

  const fullSim = sim(ak, ek);
  const lastSim = sim(aw[aw.length-1], ew[ew.length-1]);
  const firstSim = sim(aw[0], ew[0]);

  let score = fullSim;
  const reasons = [];

  if (lastSim >= 0.82) {
    score = Math.max(score, 0.7 + lastSim * 0.25);
    reasons.push(`last ${Math.round(lastSim*100)}%`);
  }
  if (firstSim >= 0.75 && lastSim >= 0.85) {
    score = Math.max(score, 0.88);
    reasons.push(`first+last`);
  }
  if (fullSim >= 0.78) reasons.push(`full ${Math.round(fullSim*100)}%`);

  // Word overlap (handles middle names)
  let wordHits = 0;
  for (const w of aw) {
    if (w.length < 3) continue;
    for (const w2 of ew) {
      if (w2.length < 3) continue;
      if (sim(w, w2) >= 0.8) wordHits++;
    }
  }
  if (wordHits >= 2) {
    score = Math.max(score, 0.85 + wordHits * 0.03);
    reasons.push(`words ${wordHits}`);
  }

  if (score < 0.78) return null;

  return {
    score: Math.round(score * 100),
    confidence: score >= 0.92 ? 'high' : score >= 0.85 ? 'medium' : 'review',
    reasons,
    country: arS.country,
    arabic_id: arEntry.id,
    arabic_name: arEntry.name,
    english_id: enEntry.id,
    english_name: enEntry.name,
    suggested_target: enEntry.name,
    merge_these: [arEntry.name],
  };
}

const rows = await fetchAll();
const arabicOnly = rows.filter(r => AR.test(r.name) && !LAT.test(r.name));
const mixed = rows.filter(r => AR.test(r.name) && LAT.test(r.name));

const pairs = [];
for (const ar of arabicOnly) {
  let best = null;
  for (const en of mixed) {
    const s = scoreRefPair(ar, en);
    if (!s) continue;
    if (!best || s.score > best.score) best = s;
  }
  if (best) pairs.push(best);
}

pairs.sort((a,b) => b.score - a.score);
const usedEn = new Set(), filtered = [];
for (const p of pairs) {
  if (usedEn.has(p.english_id)) continue;
  usedEn.add(p.english_id);
  filtered.push(p);
}

// Similar English-only pairs (same country)
const similarEn = [];
for (let i = 0; i < mixed.length; i++) {
  for (let j = i + 1; j < mixed.length; j++) {
    const a = mixed[i], b = mixed[j];
    const aS = splitNC(a.name), bS = splitNC(b.name);
    if (aS.country !== bS.country || !aS.country) continue;
    const na = norm(aS.core), nb = norm(bS.core);
    if (na === nb) {
      similarEn.push({ type: 'identical_core', confidence: 'high', score: 100, id_a: a.id, name_a: a.name, id_b: b.id, name_b: b.name, suggested_target: a.name });
      continue;
    }
    const wordsA = na.split(' ').filter(w => w.length >= 3);
    const wordsB = nb.split(' ').filter(w => w.length >= 3);
    let overlap = wordsA.filter(w => wordsB.some(w2 => sim(w, w2) >= 0.9)).length;
    const minW = Math.min(wordsA.length, wordsB.length);
    if (overlap >= minW - 1 && overlap >= 2) {
      similarEn.push({
        type: 'similar_spelling',
        confidence: overlap >= minW ? 'high' : 'medium',
        score: Math.round((overlap / Math.max(wordsA.length, wordsB.length)) * 100),
        country: aS.country,
        id_a: a.id, name_a: a.name,
        id_b: b.id, name_b: b.name,
        suggested_target: a.name.length >= b.name.length ? a.name : b.name,
      });
    }
  }
}

const simSeen = new Set();
const similarEnDeduped = similarEn.filter(p => {
  const k = [p.id_a, p.id_b].sort().join('|');
  if (simSeen.has(k)) return false;
  simSeen.add(k);
  return true;
}).sort((a,b) => b.score - a.score);

const report = {
  stats: { total: rows.length, arabic_only: arabicOnly.length, mixed: mixed.length },
  arabic_vs_english: filtered.sort((a,b) => a.arabic_name.localeCompare(b.arabic_name, 'ar')),
  english_spelling_variants: similarEnDeduped,
};

writeFileSync('scripts/referee-duplicate-analysis.json', JSON.stringify(report, null, 2), 'utf8');

console.log('Arabic vs English pairs:', filtered.length);
console.log('High:', filtered.filter(p=>p.confidence==='high').length);
console.log('Medium:', filtered.filter(p=>p.confidence==='medium').length);
console.log('Review:', filtered.filter(p=>p.confidence==='review').length);
console.log('\nEnglish spelling variants:', similarEnDeduped.length);

console.log('\n=== HIGH/MEDIUM Arabic vs English ===');
filtered.filter(p => p.confidence === 'high' || p.confidence === 'medium').forEach(p => {
  console.log(`[${p.confidence} ${p.score}%] ${p.arabic_name} (${p.arabic_id})`);
  console.log(`              -> ${p.english_name} (${p.english_id})`);
});

console.log('\n=== English spelling variants ===');
similarEnDeduped.forEach(p => {
  console.log(`[${p.confidence} ${p.score}%] ${p.name_a} (${p.id_a})`);
  console.log(`              <-> ${p.name_b} (${p.id_b})`);
});
