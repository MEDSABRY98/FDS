import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://wsygeerxfdaavdtvogvy.supabase.co',
  'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk'
);

const AR = /[\u0600-\u06FF]/;
const LAT = /[A-Za-z]/;

function scriptType(name) {
  const a = AR.test(name), l = LAT.test(name);
  if (a && !l) return 'arabic_only';
  if (l && !a) return 'latin_only';
  if (a && l) return 'mixed';
  return 'other';
}

function splitNC(name) {
  const parts = name.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2 && AR.test(parts[parts.length - 1]))
    return { core: parts.slice(0, -1).join(' - '), country: parts[parts.length - 1] };
  return { core: name, country: null };
}

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
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

const rows = await fetchAll();

// 1) Exact duplicate names (different IDs)
const byName = {};
for (const r of rows) {
  (byName[r.name] ??= []).push(r);
}
const exactDupes = Object.entries(byName)
  .filter(([, list]) => list.length > 1)
  .map(([name, list]) => ({
    type: 'exact_same_name',
    name,
    ids: list.map(x => x.id),
    suggested_target: name,
    merge_ids: list.slice(1).map(x => x.id),
  }));

// 2) Same normalized English core + same country (mixed entries)
const mixed = rows.filter(r => scriptType(r.name) === 'mixed');
const byCoreCountry = {};
for (const r of mixed) {
  const { core, country } = splitNC(r.name);
  if (!country || !LAT.test(core)) continue;
  const key = `${norm(core)}|${country}`;
  (byCoreCountry[key] ??= []).push(r);
}
const sameCoreDupes = Object.values(byCoreCountry)
  .filter(list => list.length > 1)
  .map(list => ({
    type: 'same_english_core',
    country: splitNC(list[0].name).country,
    entries: list.map(x => ({ id: x.id, name: x.name })),
    suggested_target: list[0].name,
  }));

// 3) Similar English core same country (typo / middle name diff)
const similarMixed = [];
for (let i = 0; i < mixed.length; i++) {
  for (let j = i + 1; j < mixed.length; j++) {
    const a = mixed[i], b = mixed[j];
    const aS = splitNC(a.name), bS = splitNC(b.name);
    if (aS.country !== bS.country || !aS.country) continue;
    const na = norm(aS.core), nb = norm(bS.core);
    if (na === nb) continue;
    // one contains the other or very similar
    const wordsA = new Set(na.split(' '));
    const wordsB = new Set(nb.split(' '));
    let overlap = 0;
    for (const w of wordsA) if (wordsB.has(w) && w.length >= 3) overlap++;
    const minWords = Math.min(wordsA.size, wordsB.size);
    if (overlap >= minWords - 1 && overlap >= 2) {
      similarMixed.push({
        type: 'similar_english_same_country',
        score: overlap,
        country: aS.country,
        id_a: a.id, name_a: a.name,
        id_b: b.id, name_b: b.name,
        suggested_target: a.name.length >= b.name.length ? a.name : b.name,
      });
    }
  }
}

// 4) Arabic-script entry vs English mixed same country (manual verified patterns from data)
const arabicScript = rows.filter(r => scriptType(r.name) === 'arabic_only');
const arVsEn = [];
for (const ar of arabicScript) {
  const arS = splitNC(ar.name);
  if (!arS.country) continue;
  for (const mx of mixed) {
    const mxS = splitNC(mx.name);
    if (mxS.country !== arS.country) continue;
    // Flag for manual review - same country, arabic script vs english
    arVsEn.push({
      type: 'arabic_script_vs_english',
      country: arS.country,
      arabic_id: ar.id,
      arabic_name: ar.name,
      english_id: mx.id,
      english_name: mx.name,
    });
  }
}

// Filter arVsEn to only plausible pairs: country with few refs each side
const countryCounts = {};
for (const r of rows) {
  const c = splitNC(r.name).country;
  if (!c) continue;
  (countryCounts[c] ??= { ar: 0, mx: 0 }).ar += scriptType(r.name) === 'arabic_only' ? 1 : 0;
  (countryCounts[c] ??= { ar: 0, mx: 0 }).mx += scriptType(r.name) === 'mixed' ? 1 : 0;
}

// Known high-confidence from first pass + search
const AR_TO_LAT = {
  'ا':'a','أ':'a','إ':'i','ب':'b','ت':'t','ج':'j','ح':'h','خ':'kh','د':'d','ر':'r','ز':'z',
  'س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l',
  'م':'m','ن':'n','ه':'h','و':'w','ي':'y','ة':'h',
};
function arKey(n){let k='';for(const ch of n)k+=AR_TO_LAT[ch]??(/\s/.test(ch)?' ':'');return norm(k);}
function sim(a,b){const mx=Math.max(a.length,b.length);if(!mx)return 1;const dp=Array.from({length:a.length+1},(_,i)=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)dp[i][0]=i;for(let j=0;j<=b.length;j++)dp[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return 1-dp[a.length][b.length]/mx;}

const crossScript = [];
for (const ar of arabicScript) {
  const arS = splitNC(ar.name);
  if (arS.core.length < 4) continue;
  const ak = arKey(arS.core);
  for (const mx of mixed) {
    const mxS = splitNC(mx.name);
    if (mxS.country !== arS.country || !mxS.country) continue;
    const ek = norm(mxS.core);
    const score = sim(ak, ek);
    const lastA = ak.split(' ').pop() || '';
    const lastE = ek.split(' ').pop() || '';
    const lastSim = sim(lastA, lastE);
    if (score >= 0.72 || lastSim >= 0.85) {
      crossScript.push({
        confidence: score >= 0.85 || lastSim >= 0.9 ? 'high' : score >= 0.78 ? 'medium' : 'review',
        score: Math.round(Math.max(score, lastSim) * 100),
        arabic_id: ar.id,
        arabic_name: ar.name,
        english_id: mx.id,
        english_name: mx.name,
        suggested_target: mx.name,
      });
    }
  }
}
crossScript.sort((a,b)=>b.score-a.score);
const used = new Set(), crossFiltered = [];
for (const p of crossScript) {
  const k = `${p.arabic_id}|${p.english_id}`;
  if (used.has(k)) continue;
  used.add(k);
  crossFiltered.push(p);
}

// Dedupe similarMixed
const simSeen = new Set(), simFiltered = [];
for (const p of similarMixed.sort((a,b)=>b.score-a.score)) {
  const k = [p.id_a, p.id_b].sort().join('|');
  if (simSeen.has(k)) continue;
  simSeen.add(k);
  simFiltered.push(p);
}

const report = {
  stats: {
    total: rows.length,
    arabic_only: rows.filter(r => scriptType(r.name) === 'arabic_only').length,
    latin_only: rows.filter(r => scriptType(r.name) === 'latin_only').length,
    mixed: mixed.length,
  },
  exact_duplicate_names: exactDupes,
  same_english_core: sameCoreDupes,
  similar_english_pairs: simFiltered,
  arabic_vs_english_suggestions: crossFiltered.filter(p => p.confidence !== 'review' || p.score >= 78).slice(0, 30),
  all_cross_script_high_medium: crossFiltered.filter(p => p.confidence === 'high' || p.confidence === 'medium'),
};

writeFileSync('scripts/referee-duplicate-analysis.json', JSON.stringify(report, null, 2), 'utf8');

console.log('Exact name dupes:', exactDupes.length);
exactDupes.forEach(d => console.log(' ', d.name, d.ids.join(', ')));
console.log('\nSame EN core:', sameCoreDupes.length);
sameCoreDupes.forEach(d => d.entries.forEach(e => console.log(' ', e.id, e.name)));
console.log('\nSimilar EN pairs:', simFiltered.length);
simFiltered.slice(0,15).forEach(p => console.log(` [${p.score}] ${p.name_a} <-> ${p.name_b}`));
console.log('\nCross-script (high/medium):', report.all_cross_script_high_medium.length);
report.all_cross_script_high_medium.forEach(p =>
  console.log(` [${p.confidence} ${p.score}%] ${p.arabic_name} <-> ${p.english_name}`)
);
