import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://wsygeerxfdaavdtvogvy.supabase.co',
  'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk'
);

const AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LAT = /[A-Za-z]/;

function scriptType(name) {
  const a = AR.test(name), l = LAT.test(name);
  if (a && !l) return 'arabic';
  if (l && !a) return 'latin';
  if (a && l) return 'mixed';
  return 'other';
}

const AR_TO_LAT = {
  'ا':'a','أ':'a','إ':'i','آ':'a','ء':'','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h',
  'خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t',
  'ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h',
  'و':'w','ؤ':'w','ي':'y','ى':'a','ئ':'y','ة':'h','لا':'la',
};

function normLatin(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

function arKey(name) {
  let k = '';
  for (const ch of name) k += AR_TO_LAT[ch] ?? (/\s/.test(ch) ? ' ' : '');
  return normLatin(k);
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

function splitNameCountry(name) {
  const parts = name.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2 && AR.test(parts[parts.length - 1])) {
    return { core: parts.slice(0, -1).join(' - '), country: parts[parts.length - 1] };
  }
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

function scorePair(arName, enName) {
  const arS = splitNameCountry(arName);
  const enS = splitNameCountry(enName);
  const arCore = arS.core;
  const enCore = enS.core;

  const ak = AR.test(arCore) && !LAT.test(arCore) ? arKey(arCore) : normLatin(arCore);
  const ek = normLatin(enCore);
  const phon = sim(ak, ek);

  const aw = ak.split(' ').filter(Boolean);
  const ew = ek.split(' ').filter(Boolean);

  let score = phon;
  let reasons = [`phonetic ${Math.round(phon*100)}%`];

  if (arS.country && enS.country && arS.country === enS.country) {
    score = Math.max(score, phon + 0.05);
    reasons.push('same country');
  }

  if (aw.length >= 2 && ew.length >= 2) {
    const first = sim(aw[0], ew[0]);
    const last = sim(aw[aw.length-1], ew[ew.length-1]);
    if (first >= 0.85 && last >= 0.85) {
      score = Math.max(score, 0.92);
      reasons.push(`first+last ${Math.round(first*100)}/${Math.round(last*100)}%`);
    }
  }

  if (aw.length === ew.length && aw.length >= 2) {
    let wbw = true;
    for (let i = 0; i < aw.length; i++) if (sim(aw[i], ew[i]) < 0.78) wbw = false;
    if (wbw) {
      score = Math.max(score, 0.94);
      reasons.push('word-by-word');
    }
  }

  return { score, reasons: [...new Set(reasons)], phon, sameCountry: arS.country === enS.country && !!arS.country };
}

function findCrossScriptPairs(rows) {
  const arabic = rows.filter(r => scriptType(r.name) === 'arabic');
  const latin = rows.filter(r => scriptType(r.name) === 'latin');
  const mixed = rows.filter(r => scriptType(r.name) === 'mixed');

  const pairs = [];

  // Arabic-only vs Latin-only
  for (const ar of arabic) {
    for (const lat of latin) {
      const s = scorePair(ar.name, lat.name);
      if (s.score >= 0.82) {
        pairs.push({ type: 'arabic_vs_latin', ar, lat, ...s });
      }
    }
  }

  // Arabic-only vs Mixed (English core in mixed)
  for (const ar of arabic) {
    const arS = splitNameCountry(ar.name);
    if (arS.core.length < 4) continue;
    for (const mx of mixed) {
      const mxS = splitNameCountry(mx.name);
      if (!LAT.test(mxS.core)) continue;
      const s = scorePair(ar.name, mx.name);
      if (s.score >= 0.82) {
        pairs.push({ type: 'arabic_vs_mixed', ar, lat: mx, ...s });
      }
    }
  }

  // Arabic-script full entry vs Mixed (same pattern as managers: "محمد الحنافي - مصر" vs "Mohamed El Hanafy - مصر")
  const arabicStyle = rows.filter(r => AR.test(r.name) && !LAT.test(r.name));
  for (const ar of arabicStyle) {
    const { core: arCore, country } = splitNameCountry(ar.name);
    if (!country || arCore.split(/\s+/).length < 2) continue;
    for (const mx of mixed) {
      const mxS = splitNameCountry(mx.name);
      if (mxS.country !== country) continue;
      const s = scorePair(ar.name, mx.name);
      if (s.score >= 0.78 && s.sameCountry) {
        pairs.push({ type: 'ar_script_vs_en_script', ar, lat: mx, ...s });
      }
    }
  }

  // Mixed vs Mixed duplicates (different spelling)
  for (let i = 0; i < mixed.length; i++) {
    for (let j = i + 1; j < mixed.length; j++) {
      const a = mixed[i], b = mixed[j];
      const aS = splitNameCountry(a.name);
      const bS = splitNameCountry(b.name);
      if (aS.country !== bS.country) continue;
      const s = scorePair(a.name, b.name);
      if (normLatin(aS.core) === normLatin(bS.core)) {
        pairs.push({ type: 'mixed_exact_en_core', ar: a, lat: b, score: 1, reasons: ['same english core'], phon: 1, sameCountry: true });
      } else if (s.score >= 0.9) {
        pairs.push({ type: 'mixed_similar', ar: a, lat: b, ...s });
      }
    }
  }

  pairs.sort((a,b) => b.score - a.score);

  const usedA = new Set(), usedL = new Set(), filtered = [];
  for (const p of pairs) {
    const aid = p.ar.id, lid = p.lat.id;
    if (usedA.has(aid) || usedL.has(lid)) continue;
    usedA.add(aid);
    usedL.add(lid);
    filtered.push({
      confidence: p.score >= 0.92 ? 'high' : p.score >= 0.86 ? 'medium' : 'review',
      score: Math.round(p.score * 100),
      type: p.type,
      reasons: p.reasons,
      same_country: p.sameCountry,
      arabic_id: p.ar.id,
      arabic_name: p.ar.name,
      english_id: p.lat.id,
      english_name: p.lat.name,
      suggested_target: p.lat.name,
      merge_these: [p.ar.name],
    });
  }

  return filtered.sort((a,b) => a.arabic_name.localeCompare(b.arabic_name, 'ar'));
}

// Manual search for known transliteration patterns
async function knownPatternSearch(rows) {
  const patterns = [
    ['محمد', 'Mohamed'], ['محمود', 'Mahmoud'], ['أحمد', 'Ahmed'],
    ['عادل', 'Adel'], ['الحنافي', 'Hanafy'], ['البanna', 'Banna'],
    ['بasyoni', 'basyoni'], [' أمين', 'Amin'], ['Omar', 'Omar'],
  ];
  const hits = [];
  for (const [arQ, enQ] of patterns) {
    const arH = rows.filter(r => r.name.includes(arQ) && scriptType(r.name) !== 'latin');
    const enH = rows.filter(r => r.name.toLowerCase().includes(enQ.toLowerCase()));
    if (arH.length && enH.length) {
      for (const ar of arH) {
        for (const en of enH) {
          const s = scorePair(ar.name, en.name);
          if (s.score >= 0.75) {
            hits.push({ ar, en, score: Math.round(s.score*100), reasons: s.reasons });
          }
        }
      }
    }
  }
  return hits.sort((a,b)=>b.score-a.score).slice(0, 20);
}

const rows = await fetchAll();
const stats = {
  total: rows.length,
  arabic: rows.filter(r => scriptType(r.name) === 'arabic').length,
  latin: rows.filter(r => scriptType(r.name) === 'latin').length,
  mixed: rows.filter(r => scriptType(r.name) === 'mixed').length,
};

console.log('Stats:', stats);

const suggestions = findCrossScriptPairs(rows);
const patternHits = await knownPatternSearch(rows);

const report = { stats, suggestions, patternHits };
writeFileSync('scripts/referee-duplicate-analysis.json', JSON.stringify(report, null, 2), 'utf8');

console.log('\nSuggestions:', suggestions.length);
for (const s of suggestions) {
  console.log(`[${s.confidence} ${s.score}%] ${s.arabic_name} (${s.arabic_id}) <-> ${s.english_name} (${s.english_id})`);
}

if (patternHits.length) {
  console.log('\nPattern hits (review):');
  for (const h of patternHits.slice(0, 10)) {
    console.log(`  ${h.score}% ${h.ar.name} <-> ${h.en.name}`);
  }
}
