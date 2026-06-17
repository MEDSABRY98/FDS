const AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LAT = /[A-Za-z]/;

const AR_TO_LAT = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ء': '',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
    'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't',
    'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h',
    'و': 'w', 'ؤ': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'y',
    'ة': 'h', 'لا': 'la',
};

export const DUPLICATE_CATALOG_TABLES = new Set([
    'db_PLAYERS',
    'db_MANAGERS',
    'db_TEAMS',
    'db_REFEREES',
    'db_STADIUMS',
]);

const TABLE_ID_COL = {
    db_PLAYERS: 'PLAYER_ID',
    db_MANAGERS: 'MANAGER_ID',
    db_TEAMS: 'TEAM_ID',
    db_REFEREES: 'REFEREE_ID',
    db_STADIUMS: 'STADIUM_ID',
};

const TABLE_NAME_COL = {
    db_PLAYERS: 'PLAYER_NAME',
    db_MANAGERS: 'MANAGER_NAME',
    db_TEAMS: 'TEAM_NAME',
    db_REFEREES: 'REFEREE_NAME',
    db_STADIUMS: 'STADIUM_NAME',
};

function scriptType(name) {
    const a = AR.test(name);
    const l = LAT.test(name);
    if (a && !l) return 'arabic';
    if (l && !a) return 'latin';
    if (a && l) return 'mixed';
    return 'other';
}

function normLatin(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function arabicKey(name) {
    let key = '';
    for (const ch of String(name || '')) {
        key += AR_TO_LAT[ch] ?? (/\s/.test(ch) ? ' ' : '');
    }
    return normLatin(key);
}

function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;

    let prev = new Array(n + 1);
    let curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

function similarity(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (!maxLen) return 1;
    return 1 - levenshtein(a, b) / maxLen;
}

function splitNameCountry(name) {
    const parts = String(name || '').split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2 && AR.test(parts[parts.length - 1])) {
        return {
            core: parts.slice(0, -1).join(' - '),
            country: parts[parts.length - 1],
        };
    }
    return { core: String(name || ''), country: null };
}

function getEntityId(table, row) {
    const col = TABLE_ID_COL[table];
    return col ? String(row?.[col] || '').trim() : '';
}

function getEntityName(table, row) {
    const col = TABLE_NAME_COL[table];
    return col ? String(row?.[col] || '').trim() : '';
}

function exactGroupKey(name, scriptType) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    if (scriptType === 'arabic') return trimmed;
    return normLatin(trimmed);
}

function prepareEntry(id, name) {
    const type = scriptType(name);
    const split = splitNameCountry(name);
    const core = type === 'arabic' ? arabicKey(split.core) : normLatin(split.core);
    const words = core.split(' ').filter(Boolean);
    return {
        id,
        name,
        scriptType: type,
        country: split.country,
        core,
        words,
        lastWord: words[words.length - 1] || '',
        firstWord: words[0] || '',
        exactKey: exactGroupKey(name, type),
        wordKey: [...words].sort().join('|'),
    };
}

function buildPair(a, b, scored, isExact = false) {
    const preferB = b.scriptType === 'mixed' || b.scriptType === 'latin';
    return {
        idA: a.id,
        nameA: a.name,
        idB: b.id,
        nameB: b.name,
        suggestedTarget: preferB ? b.name : a.name,
        score: isExact ? 100 : scored.score,
        confidence: isExact ? 'HIGH' : scored.confidence,
        reasons: isExact ? ['exact name'] : scored.reasons,
        crossScript: isExact ? false : scored.crossScript,
        pairKey: [a.id, b.id].sort().join('|'),
    };
}

function scoreNamePair(nameA, nameB, isTeam = false) {
    const aType = scriptType(nameA);
    const bType = scriptType(nameB);

    const aSplit = splitNameCountry(nameA);
    const bSplit = splitNameCountry(nameB);

    const aCore = aType === 'arabic' ? arabicKey(aSplit.core) : normLatin(aSplit.core);
    const bCore = bType === 'arabic' ? arabicKey(bSplit.core) : normLatin(bSplit.core);

    const aWords = aCore.split(' ').filter(Boolean);
    const bWords = bCore.split(' ').filter(Boolean);
    const phonetic = similarity(aCore, bCore);

    let score = phonetic;
    const reasons = [];

    if (phonetic >= 0.88) reasons.push('phonetic match');

    if (aSplit.country && bSplit.country && aSplit.country === bSplit.country) {
        score += 0.03;
        reasons.push('same country');
    }

    if (aWords.length >= 2 && bWords.length >= 2) {
        const first = similarity(aWords[0], bWords[0]);
        const last = similarity(aWords[aWords.length - 1], bWords[bWords.length - 1]);
        if (first >= 0.85 && last >= 0.85) {
            score = Math.max(score, 0.92);
            reasons.push('first and last name');
        }
    }

    if (aWords.length === bWords.length && aWords.length >= 2) {
        let wordByWord = true;
        for (let i = 0; i < aWords.length; i++) {
            if (similarity(aWords[i], bWords[i]) < 0.78) wordByWord = false;
        }
        if (wordByWord) {
            score = Math.max(score, 0.94);
            reasons.push('word-by-word');
        }
    }

    if (isTeam && aWords.length === 1 && bWords.length === 1 && phonetic >= 0.85) {
        score = Math.max(score, phonetic);
        reasons.push('country name');
    }

    let wordHits = 0;
    for (const aw of aWords) {
        for (const bw of bWords) {
            if (aw.length >= 3 && bw.length >= 3 && similarity(aw, bw) >= 0.82) wordHits++;
        }
    }
    if (wordHits >= 2 || (wordHits >= 1 && aWords.length === 1)) {
        score = Math.max(score, 0.84);
        reasons.push('shared words');
    }

    const minScore = isTeam ? 0.85 : 0.86;
    const wordCountDiff = Math.abs(aWords.length - bWords.length);
    if (score < minScore) return null;
    if (!isTeam && wordCountDiff > 1 && phonetic < 0.9) return null;

    const crossScript = (aType === 'arabic' && bType !== 'arabic') ||
        (bType === 'arabic' && aType !== 'arabic');

    const confidence = score >= 0.92 ? 'HIGH' : score >= 0.88 ? 'MEDIUM' : 'REVIEW';

    return {
        score: Math.round(score * 100),
        confidence,
        reasons: [...new Set(reasons)],
        crossScript,
    };
}

function tryAddPair(candidates, seenPairKeys, a, b, isTeam, isExact = false) {
    const key = [a.id, b.id].sort().join('|');
    if (seenPairKeys.has(key)) return;
    if (a.name === b.name) {
        seenPairKeys.add(key);
        candidates.push(buildPair(a, b, null, true));
        return;
    }
    const scored = scoreNamePair(a.name, b.name, isTeam);
    if (!scored) return;
    seenPairKeys.add(key);
    candidates.push(buildPair(a, b, scored));
}

const MAX_FUZZY_BUCKET = 12;
const MAX_GROUP_COMPARE = 40;

function compareGroupedEntries(groups, candidates, seenPairKeys, isTeam) {
    for (const group of groups.values()) {
        if (group.length < 2 || group.length > MAX_GROUP_COMPARE) continue;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                tryAddPair(candidates, seenPairKeys, group[i], group[j], isTeam);
            }
        }
    }
}
function compareCrossScript(arabicEntries, englishEntries, candidates, seenPairKeys, isTeam) {
    const enByExact = new Map();
    const enByBucket = new Map();

    for (const en of englishEntries) {
        if (!isTeam && en.words.length < 2) continue;
        if (en.lastWord.length < 2) continue;

        const exactKey = `${en.words.length}|${en.lastWord}`;
        if (!enByExact.has(exactKey)) enByExact.set(exactKey, []);
        enByExact.get(exactKey).push(en);

        const prefix = en.lastWord.slice(0, 2);
        const bucketKey = `${en.words.length}|${prefix}`;
        if (!enByBucket.has(bucketKey)) enByBucket.set(bucketKey, []);
        enByBucket.get(bucketKey).push(en);
    }

    for (const ar of arabicEntries) {
        if (!isTeam && ar.words.length < 2) continue;
        if (ar.lastWord.length < 2) continue;

        const matched = new Map();
        const prefix = ar.lastWord.slice(0, 2);

        for (const wordLen of [ar.words.length - 1, ar.words.length, ar.words.length + 1]) {
            if (wordLen < 1) continue;

            const exactKey = `${wordLen}|${ar.lastWord}`;
            (enByExact.get(exactKey) || []).forEach(en => matched.set(en.id, en));

            const bucketKey = `${wordLen}|${prefix}`;
            const bucket = enByBucket.get(bucketKey) || [];
            if (bucket.length > MAX_FUZZY_BUCKET) continue;

            for (const en of bucket) {
                if (en.lastWord === ar.lastWord || similarity(ar.lastWord, en.lastWord) >= 0.82) {
                    matched.set(en.id, en);
                }
            }
        }

        for (const en of matched.values()) {
            tryAddPair(candidates, seenPairKeys, ar, en, isTeam);
        }
    }
}

export function isDuplicateCatalogTable(tableName) {
    return DUPLICATE_CATALOG_TABLES.has(tableName);
}

/**
 * Indexed duplicate scan — avoids O(n²) over the full catalog.
 * Compares: exact names, Arabic↔English, and small same-country / same-token groups.
 */
export function findDuplicatePairs(tableName, rows = []) {
    if (!isDuplicateCatalogTable(tableName) || !rows.length) return [];

    const isTeam = tableName === 'db_TEAMS';
    const entries = rows
        .map(row => prepareEntry(getEntityId(tableName, row), getEntityName(tableName, row)))
        .filter(entry => entry.id && entry.name);

    const candidates = [];
    const seenPairKeys = new Set();

    const exactGroups = new Map();
    for (const entry of entries) {
        if (!entry.exactKey) continue;
        if (!exactGroups.has(entry.exactKey)) exactGroups.set(entry.exactKey, []);
        exactGroups.get(entry.exactKey).push(entry);
    }
    compareGroupedEntries(exactGroups, candidates, seenPairKeys, isTeam);

    const arabicEntries = entries.filter(e => e.scriptType === 'arabic');
    const englishEntries = entries.filter(e => e.scriptType === 'latin' || e.scriptType === 'mixed');
    compareCrossScript(arabicEntries, englishEntries, candidates, seenPairKeys, isTeam);

    const arabicWordKeyGroups = new Map();
    for (const entry of arabicEntries) {
        if (entry.words.length < 2) continue;
        const key = `${entry.country || ''}|${entry.wordKey}`;
        if (!arabicWordKeyGroups.has(key)) arabicWordKeyGroups.set(key, []);
        arabicWordKeyGroups.get(key).push(entry);
    }
    compareGroupedEntries(arabicWordKeyGroups, candidates, seenPairKeys, isTeam);

    const arabicLastNameGroups = new Map();
    for (const entry of arabicEntries) {
        if (entry.lastWord.length < 3) continue;
        const key = `${entry.country || ''}|${entry.lastWord}`;
        if (!arabicLastNameGroups.has(key)) arabicLastNameGroups.set(key, []);
        arabicLastNameGroups.get(key).push(entry);
    }
    for (const group of arabicLastNameGroups.values()) {
        if (group.length < 2 || group.length > 6) continue;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                tryAddPair(candidates, seenPairKeys, group[i], group[j], isTeam);
            }
        }
    }

    const wordKeyGroups = new Map();
    for (const entry of englishEntries) {
        if (entry.words.length < 2) continue;
        const key = `${entry.country || ''}|${entry.wordKey}`;
        if (!wordKeyGroups.has(key)) wordKeyGroups.set(key, []);
        wordKeyGroups.get(key).push(entry);
    }
    compareGroupedEntries(wordKeyGroups, candidates, seenPairKeys, isTeam);

    const lastNameGroups = new Map();
    for (const entry of englishEntries) {
        if (entry.lastWord.length < 4) continue;
        const key = `${entry.country || ''}|${entry.lastWord}`;
        if (!lastNameGroups.has(key)) lastNameGroups.set(key, []);
        lastNameGroups.get(key).push(entry);
    }
    for (const group of lastNameGroups.values()) {
        if (group.length < 2 || group.length > 6) continue;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                tryAddPair(candidates, seenPairKeys, group[i], group[j], isTeam);
            }
        }
    }

    candidates.sort((x, y) => y.score - x.score);

    const usedIds = new Set();
    const filtered = [];
    for (const pair of candidates) {
        if (usedIds.has(pair.idA) || usedIds.has(pair.idB)) continue;
        usedIds.add(pair.idA);
        usedIds.add(pair.idB);
        filtered.push(pair);
    }

    return filtered.sort((a, b) => a.nameA.localeCompare(b.nameA, 'ar'));
}

export function loadIgnoredPairKeys(tableName) {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(`db_mgmt_ignored_dupes_${tableName}`);
        const list = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(list) ? list : []);
    } catch {
        return new Set();
    }
}

export function saveIgnoredPairKey(tableName, key) {
    if (typeof window === 'undefined') return;
    const current = loadIgnoredPairKeys(tableName);
    current.add(key);
    localStorage.setItem(
        `db_mgmt_ignored_dupes_${tableName}`,
        JSON.stringify([...current])
    );
}
