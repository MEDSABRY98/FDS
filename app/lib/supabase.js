import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wsygeerxfdaavdtvogvy.supabase.co'
const supabaseAnonKey = 'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk'

const rawSupabase = createClient(supabaseUrl, supabaseAnonKey)

let stadiumsIdToName = {};
let stadiumsNameToId = {};
let managersIdToName = {};
let managersNameToId = {};
let playersIdToName = {};
let playersNameToId = {};
let refereesIdToName = {};
let refereesNameToId = {};
let teamsIdToName = {};
let teamsNameToId = {};
let countriesIdToName = {};
let countriesNameToId = {};
let cachesLoaded = false;
let cachesPromise = null;

const playerColumnsMap = {
    'alahly_FINALS_LINEUPDETAILS': ['PLAYER NAME', 'PLAYER NAME OUT'],
    'alahly_FINALS_PLAYERDETAILS': ['PLAYER NAME'],
    'alahly_GKSDETAILS': ['PLAYER NAME'],
    'alahly_LINEUPDETAILS': ['PLAYER NAME', 'PLAYER NAME OUT'],
    'alahly_PKS': ['AHLY GK', 'AHLY PLAYER', 'OPPONENT GK', 'OPPONENT PLAYER'],
    'alahly_PLAYERDETAILS': ['PLAYER NAME'],
    'alahly_vs_zamalek_LINEUPDETAILS': ['PLAYER NAME', 'PLAYER NAME OUT'],
    'alahly_vs_zamalek_PLAYERDETAILS': ['PLAYER NAME'],
    'egy_NT_GKSDETAILS': ['PLAYER NAME'],
    'egy_NT_LINEUPDETAILS': ['PLAYER NAME', 'PLAYER NAME OUT'],
    'egy_NT_PKS': ['EGYPT GK', 'Egypt PLAYER', 'OPPONENT GK', 'OPPONENT PLAYER'],
    'egy_NT_PLAYERDETAILS': ['PLAYER NAME'],
    'egy_NT_SQUAD': ['PLAYERNAME']
};

const teamColumnsMap = {
    'alahly_FINALS_LINEUPDETAILS': ['TEAM'],
    'alahly_FINALS_MATCHDETAILS': ['AHLY TEAM', 'OPPONENT TEAM'],
    'alahly_FINALS_PLAYERDETAILS': ['TEAM'],
    'alahly_GKSDETAILS': ['TEAM'],
    'alahly_HOWPENMISSED': ['TEAM'],
    'alahly_LINEUPDETAILS': ['TEAM'],
    'alahly_MATCHDETAILS': ['AHLY TEAM', 'OPPONENT TEAM'],
    'alahly_PKS': ['AHLY TEAM', 'OPPONENT TEAM'],
    'alahly_PLAYERDETAILS': ['TEAM'],
    'alahly_vs_zamalek_LINEUPDETAILS': ['TEAM'],
    'alahly_vs_zamalek_PLAYERDETAILS': ['TEAM'],
    'egy_CLUB_MATCHDETAILS': ['EGYPT TEAM', 'OPPONENT TEAM'],
    'egy_NT_GKSDETAILS': ['TEAM'],
    'egy_NT_HOWPENMISSED': ['TEAM'],
    'egy_NT_LINEUPDETAILS': ['TEAM'],
    'egy_NT_MATCHDETAILS': ['Egypt TEAM', 'OPPONENT TEAM'],
    'egy_NT_PKS': ['Egypt TEAM', 'OPPONENT TEAM'],
    'egy_NT_PLAYERDETAILS': ['TEAM'],
    'egy_NT_SQUAD': ['CLUB']
};

const CATALOG_CONFIG = {
    db_PLAYERS: {
        idCol: "PLAYER_ID",
        nameCols: ["PLAYER_NAME"],
        idPrefix: "P-",
        labelAr: "اللاعب"
    },
    db_MANAGERS: {
        idCol: "MANAGER_ID",
        nameCols: ["MANAGER_NAME"],
        idPrefix: "M-",
        labelAr: "المدرب"
    },
    db_REFEREES: {
        idCol: "REFEREE_ID",
        nameCols: ["REFEREE_NAME"],
        idPrefix: "REF-",
        labelAr: "الحكم"
    },
    db_TEAMS: {
        idCol: "TEAM_ID",
        nameCols: ["TEAM_NAME"],
        idPrefix: "T-",
        labelAr: "الفريق"
    },
    db_COUNTRIES: {
        idCol: "COUNTRY_ID",
        nameCols: ["COUNTRY_NAME", "COUNTRY_NAME_EN"],
        idPrefix: "C-",
        labelAr: "الدولة"
    }
};

const CATALOG_SKIP_VALUES = new Set(["-", "unknown", "?", "؟", "n/a", "na", "none", ""]);

function isSkippableCatalogValue(val) {
    if (val === null || val === undefined) return true;
    const s = String(val).trim();
    if (!s) return true;
    return CATALOG_SKIP_VALUES.has(s.toLowerCase());
}

function getCatalogForColumn(colName) {
    const col = String(colName || "").toUpperCase();

    if (col.includes("COUNTRY")) return "db_COUNTRIES";
    if (
        col.includes("PLAYER") ||
        col === "MOTM" ||
        col === "PLAYERNAME" ||
        col === "CAPTAIN_ID" ||
        col.includes("CAPTAIN") ||
        (col.includes("GK") && !col.includes("TEAM"))
    ) {
        return "db_PLAYERS";
    }
    if (col.includes("MANAGER")) return "db_MANAGERS";
    if (col.includes("REF")) return "db_REFEREES";
    if (col.includes("TEAM") || col.includes("OPPONENT") || col === "CLUB") {
        return "db_TEAMS";
    }

    return null;
}

function isLikelyCatalogName(val, idPrefix) {
    if (typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (idPrefix && trimmed.toUpperCase().startsWith(idPrefix.toUpperCase())) return false;
    if (/^\d+$/.test(trimmed)) return false;
    return true;
}

function buildCatalogError(catalog, value) {
    const label = CATALOG_CONFIG[catalog]?.labelAr || catalog;
    return `"${value}" غير موجود في ${label}. أضفه أولاً من Global DB Management.`;
}

function normalizeCatalogName(val) {
    return String(val || "").trim().replace(/\s+/g, " ").toLowerCase();
}

async function lookupCatalogIdByText(catalog, value, rawClient, caches = null) {
    if (isSkippableCatalogValue(value)) return value;

    const cfg = CATALOG_CONFIG[catalog];
    if (!cfg || !rawClient) return value;

    const raw = String(value).trim().replace(/\s+/g, " ");
    const normalized = normalizeCatalogName(raw);

    const idToName = caches?.idToName?.[catalog];
    const nameToId = caches?.nameToId?.[catalog];

    if (raw.toUpperCase().startsWith(cfg.idPrefix.toUpperCase())) {
        if (idToName?.[raw]) return raw;
        const { data: idRow } = await rawClient
            .from(catalog)
            .select(cfg.idCol)
            .eq(cfg.idCol, raw)
            .maybeSingle();
        if (idRow?.[cfg.idCol]) return idRow[cfg.idCol];
        throw new Error(buildCatalogError(catalog, raw));
    }

    if (nameToId?.[normalized]) return nameToId[normalized];

    for (const nameCol of cfg.nameCols) {
        const { data, error } = await rawClient
            .from(catalog)
            .select(`${cfg.idCol}, ${nameCol}`)
            .ilike(nameCol, raw)
            .limit(10);

        if (error) continue;

        const exact = (data || []).find(
            (row) => normalizeCatalogName(row[nameCol]) === normalized
        );
        if (exact?.[cfg.idCol]) {
            const id = exact[cfg.idCol];
            if (caches?.nameToId?.[catalog] && exact[nameCol]) {
                caches.nameToId[catalog][normalizeCatalogName(exact[nameCol])] = id;
                if (caches?.idToName?.[catalog]) {
                    caches.idToName[catalog][id] = exact[nameCol];
                }
            }
            return id;
        }

        if (data?.length === 1 && data[0]?.[cfg.idCol]) {
            const id = data[0][cfg.idCol];
            const dbName = data[0][nameCol];
            if (caches?.nameToId?.[catalog] && dbName) {
                caches.nameToId[catalog][normalizeCatalogName(dbName)] = id;
                if (caches?.idToName?.[catalog]) {
                    caches.idToName[catalog][id] = dbName;
                }
            }
            return id;
        }
    }

    throw new Error(buildCatalogError(catalog, raw));
}

async function fetchAllRows(tableName, selectColumns) {
    let allData = [];
    let from = 0;
    const step = 1000;
    let finished = false;
    
    while (!finished) {
        const { data, error } = await rawSupabase
            .from(tableName)
            .select(selectColumns)
            .range(from, from + step - 1);
            
        if (error) {
            console.error(`Error fetching all rows from ${tableName}:`, error);
            throw error;
        }
        
        if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += step;
            if (data.length < step) finished = true;
        } else {
            finished = true;
        }
    }
    return allData;
}

async function loadCaches() {
    if (cachesPromise) return cachesPromise;
    cachesPromise = (async () => {
        try {
            const [stadsData, mgrsData, playersData, refsData, teamsData, countriesData] = await Promise.all([
                fetchAllRows('db_STADIUMS', 'STADIUM_ID, STADIUM_NAME'),
                fetchAllRows('db_MANAGERS', 'MANAGER_ID, MANAGER_NAME'),
                fetchAllRows('db_PLAYERS', 'PLAYER_ID, PLAYER_NAME'),
                fetchAllRows('db_REFEREES', 'REFEREE_ID, REFEREE_NAME'),
                fetchAllRows('db_TEAMS', 'TEAM_ID, TEAM_NAME'),
                fetchAllRows('db_COUNTRIES', 'COUNTRY_ID, COUNTRY_NAME, COUNTRY_NAME_EN')
            ]);
            
            stadiumsIdToName = {};
            stadiumsNameToId = {};
            managersIdToName = {};
            managersNameToId = {};
            playersIdToName = {};
            playersNameToId = {};
            refereesIdToName = {};
            refereesNameToId = {};
            teamsIdToName = {};
            teamsNameToId = {};
            countriesIdToName = {};
            countriesNameToId = {};

            if (stadsData) {
                stadsData.forEach(r => {
                    if (r.STADIUM_ID && r.STADIUM_NAME) {
                        stadiumsIdToName[r.STADIUM_ID] = r.STADIUM_NAME;
                        stadiumsNameToId[normalizeCatalogName(r.STADIUM_NAME)] = r.STADIUM_ID;
                    }
                });
            }
            if (mgrsData) {
                mgrsData.forEach(r => {
                    if (r.MANAGER_ID && r.MANAGER_NAME) {
                        managersIdToName[r.MANAGER_ID] = r.MANAGER_NAME;
                        managersNameToId[normalizeCatalogName(r.MANAGER_NAME)] = r.MANAGER_ID;
                    }
                });
            }
            if (playersData) {
                playersData.forEach(r => {
                    if (r.PLAYER_ID && r.PLAYER_NAME) {
                        playersIdToName[r.PLAYER_ID] = r.PLAYER_NAME;
                        playersNameToId[normalizeCatalogName(r.PLAYER_NAME)] = r.PLAYER_ID;
                    }
                });
            }
            if (refsData) {
                refsData.forEach(r => {
                    if (r.REFEREE_ID && r.REFEREE_NAME) {
                        refereesIdToName[r.REFEREE_ID] = r.REFEREE_NAME;
                        refereesNameToId[normalizeCatalogName(r.REFEREE_NAME)] = r.REFEREE_ID;
                    }
                });
            }
            if (teamsData) {
                teamsData.forEach(r => {
                    if (r.TEAM_ID && r.TEAM_NAME) {
                        teamsIdToName[r.TEAM_ID] = r.TEAM_NAME;
                        teamsNameToId[normalizeCatalogName(r.TEAM_NAME)] = r.TEAM_ID;
                    }
                });
            }
            if (countriesData) {
                countriesData.forEach(r => {
                    if (r.COUNTRY_ID) {
                        countriesIdToName[r.COUNTRY_ID] = r.COUNTRY_NAME || r.COUNTRY_NAME_EN;
                        if (r.COUNTRY_NAME) {
                            countriesNameToId[normalizeCatalogName(r.COUNTRY_NAME)] = r.COUNTRY_ID;
                        }
                        if (r.COUNTRY_NAME_EN) {
                            countriesNameToId[normalizeCatalogName(r.COUNTRY_NAME_EN)] = r.COUNTRY_ID;
                        }
                    }
                });
            }
            cachesLoaded = true;
        } catch (e) {
            console.error("Failed to load database caches in supabase.js", e);
            cachesPromise = null; // Reset to allow retry
        }
    })();
    return cachesPromise;
}

// Map database values (IDs) to application values (Names)
function mapRowDbToApp(row, tableName) {
    if (!row) return row;
    const mapped = { ...row };
    
    // Stadiums
    if (mapped.STAD && stadiumsIdToName[mapped.STAD]) {
        mapped.STAD = stadiumsIdToName[mapped.STAD];
    }
    if (mapped.PLACE && stadiumsIdToName[mapped.PLACE]) {
        mapped.PLACE = stadiumsIdToName[mapped.PLACE];
    }
    
    // Managers
    if (mapped["AHLY MANAGER"] && managersIdToName[mapped["AHLY MANAGER"]]) {
        mapped["AHLY MANAGER"] = managersIdToName[mapped["AHLY MANAGER"]];
    }
    if (mapped["OPPONENT MANAGER"] && managersIdToName[mapped["OPPONENT MANAGER"]]) {
        mapped["OPPONENT MANAGER"] = managersIdToName[mapped["OPPONENT MANAGER"]];
    }
    if (mapped["ZAMALEK MANAGER"] && managersIdToName[mapped["ZAMALEK MANAGER"]]) {
        mapped["ZAMALEK MANAGER"] = managersIdToName[mapped["ZAMALEK MANAGER"]];
    }
    if (mapped["EGYPT MANAGER"] && managersIdToName[mapped["EGYPT MANAGER"]]) {
        mapped["EGYPT MANAGER"] = managersIdToName[mapped["EGYPT MANAGER"]];
    }

    // Referees
    if (mapped.REFREE && refereesIdToName[mapped.REFREE]) {
        mapped.REFREE = refereesIdToName[mapped.REFREE];
    }
    if (mapped.REFEREE && refereesIdToName[mapped.REFEREE]) {
        mapped.REFEREE = refereesIdToName[mapped.REFEREE];
    }
    
    // Players
    const playerCols = playerColumnsMap[tableName];
    if (playerCols) {
        playerCols.forEach(col => {
            if (mapped[col] && playersIdToName[mapped[col]]) {
                mapped[col] = playersIdToName[mapped[col]];
            }
        });
    }
    
    // Teams
    const teamCols = teamColumnsMap[tableName];
    if (teamCols) {
        teamCols.forEach(col => {
            if (mapped[col] && teamsIdToName[mapped[col]]) {
                mapped[col] = teamsIdToName[mapped[col]];
            }
        });
    }
    
    return mapped;
}

function mapDataDbToApp(data, tableName) {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(row => mapRowDbToApp(row, tableName));
    }
    return mapRowDbToApp(data, tableName);
}

// Resolve filter value from name to ID
function resolveNameToId(columnName, value, tableName) {
    if (!value) return value;
    const clean = normalizeCatalogName(value);
    
    const isStadiumCol = ['STAD', 'PLACE'].includes(columnName);
    const isManagerCol = ['AHLY MANAGER', 'OPPONENT MANAGER', 'ZAMALEK MANAGER', 'EGYPT MANAGER'].includes(columnName);
    const isRefereeCol = ['REFREE', 'REFEREE'].includes(columnName);
    
    if (isStadiumCol && stadiumsNameToId[clean]) {
        return stadiumsNameToId[clean];
    }
    if (isManagerCol && managersNameToId[clean]) {
        return managersNameToId[clean];
    }
    if (isRefereeCol && refereesNameToId[clean]) {
        return refereesNameToId[clean];
    }
    
    // Check if player column
    const playerCols = playerColumnsMap[tableName];
    const isPlayerCol = playerCols && playerCols.includes(columnName);
    if (isPlayerCol && playersNameToId[clean]) {
        return playersNameToId[clean];
    }
    
    // Check if team column
    const teamCols = teamColumnsMap[tableName];
    const isTeamCol = teamCols && teamCols.includes(columnName);
    if (isTeamCol && teamsNameToId[clean]) {
        return teamsNameToId[clean];
    }
    
    return value;
}

const CATALOG_TABLES = Object.keys(CATALOG_CONFIG);

function getNameToIdMap(catalog) {
    switch (catalog) {
        case 'db_PLAYERS': return playersNameToId;
        case 'db_MANAGERS': return managersNameToId;
        case 'db_REFEREES': return refereesNameToId;
        case 'db_TEAMS': return teamsNameToId;
        case 'db_COUNTRIES': return countriesNameToId;
        default: return null;
    }
}

function getIdToNameMap(catalog) {
    switch (catalog) {
        case 'db_PLAYERS': return playersIdToName;
        case 'db_MANAGERS': return managersIdToName;
        case 'db_REFEREES': return refereesIdToName;
        case 'db_TEAMS': return teamsIdToName;
        case 'db_COUNTRIES': return countriesIdToName;
        default: return null;
    }
}

function getCatalogCaches() {
    return {
        idToName: {
            db_PLAYERS: playersIdToName,
            db_MANAGERS: managersIdToName,
            db_REFEREES: refereesIdToName,
            db_TEAMS: teamsIdToName,
            db_COUNTRIES: countriesIdToName
        },
        nameToId: {
            db_PLAYERS: playersNameToId,
            db_MANAGERS: managersNameToId,
            db_REFEREES: refereesNameToId,
            db_TEAMS: teamsNameToId,
            db_COUNTRIES: countriesNameToId
        }
    };
}

function registerCacheEntry(catalog, id, name) {
    if (!id || !name) return;
    const idToName = getIdToNameMap(catalog);
    const nameToId = getNameToIdMap(catalog);
    if (!idToName || !nameToId) return;
    idToName[id] = String(name).trim();
    nameToId[normalizeCatalogName(name)] = id;
}

async function resolveStrictCatalogValue(catalog, val) {
    const resolvedId = await lookupCatalogIdByText(catalog, val, rawSupabase, getCatalogCaches());
    if (resolvedId !== val && CATALOG_CONFIG[catalog]) {
        const cfg = CATALOG_CONFIG[catalog];
        const idToName = getIdToNameMap(catalog);
        registerCacheEntry(catalog, resolvedId, idToName?.[resolvedId] || String(val).trim());
    }
    return resolvedId;
}

function isCatalogReferenceColumn(col, tableName) {
    if (CATALOG_TABLES.includes(tableName)) return false;

    const catalog = getCatalogForColumn(col);
    if (!catalog) return false;

    const playerCols = playerColumnsMap[tableName];
    const teamCols = teamColumnsMap[tableName];

    if (playerCols?.includes(col)) return catalog === 'db_PLAYERS';
    if (teamCols?.includes(col)) return catalog === 'db_TEAMS';

    const matchDetailCols = [
        'AHLY MANAGER', 'OPPONENT MANAGER', 'ZAMALEK MANAGER', 'EGYPT MANAGER',
        'REFREE', 'REFEREE'
    ];
    if (matchDetailCols.includes(col)) return true;

    return !!catalog;
}

// Resolve catalog names to IDs — reject unknown names (no auto-register)
async function resolveAndRegisterPayload(payload, tableName) {
    await loadCaches();

    if (CATALOG_TABLES.includes(tableName)) return payload;
    
    const resolveOrRegister = async (col, val) => {
        if (isSkippableCatalogValue(val)) return val;

        const isStadium = ['STAD', 'PLACE'].includes(col);
        if (isStadium) {
            const clean = String(val).trim().toLowerCase();
            if (stadiumsNameToId[clean]) return stadiumsNameToId[clean];
            if (String(val).startsWith('S-')) return val;

            try {
                const { data } = await rawSupabase.from('db_STADIUMS').select('STADIUM_ID');
                const nums = data ? data.map(r => {
                    const m = String(r.STADIUM_ID).match(/(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                }) : [0];
                const nextNum = Math.max(0, ...nums) + 1;
                const nextId = 'S-' + String(nextNum).padStart(4, '0');
                const nextRowId = 'R-' + String(nextNum).padStart(4, '0');

                await rawSupabase.from('db_STADIUMS').insert({
                    ROW_ID: nextRowId,
                    STADIUM_ID: nextId,
                    STADIUM_NAME: String(val).trim()
                });

                stadiumsIdToName[nextId] = String(val).trim();
                stadiumsNameToId[clean] = nextId;
                return nextId;
            } catch (e) {
                console.error("Auto-register stadium failed:", e);
                return val;
            }
        }

        if (!isCatalogReferenceColumn(col, tableName)) return val;

        const catalog = getCatalogForColumn(col);
        if (catalog) {
            return await resolveStrictCatalogValue(catalog, val);
        }

        return val;
    };
    
    const mapRow = async (row) => {
        const mapped = { ...row };
        for (const col of Object.keys(mapped)) {
            mapped[col] = await resolveOrRegister(col, mapped[col]);
        }
        return mapped;
    };
    
    if (Array.isArray(payload)) {
        return await Promise.all(payload.map(mapRow));
    }
    return await mapRow(payload);
}

function wrapQueryBuilder(target, tableName, calls = []) {
    return new Proxy(target, {
        get(obj, prop, receiver) {
            if (prop === 'then') {
                return function(onFulfilled, onRejected) {
                    const run = async () => {
                        // 1. Ensure caches are loaded
                        await loadCaches();
                        
                        // 2. Resolve writes and filters in recorded calls
                        const processedCalls = [];
                        for (const call of calls) {
                            const newCall = { method: call.method, args: [...call.args] };
                            
                            // Map payloads in insert/update/upsert
                            if (['insert', 'update', 'upsert'].includes(call.method)) {
                                if (newCall.args[0] && typeof newCall.args[0] === 'object') {
                                    newCall.args[0] = await resolveAndRegisterPayload(newCall.args[0], tableName);
                                }
                            }
                            
                            // Invalidate caches if writing or deleting in the catalogs
                            if (['insert', 'update', 'upsert', 'delete'].includes(call.method)) {
                                if (['db_STADIUMS', 'db_MANAGERS', 'db_PLAYERS', 'db_REFEREES', 'db_TEAMS', 'db_COUNTRIES'].includes(tableName)) {
                                    cachesPromise = null;
                                    cachesLoaded = false;
                                }
                            }
                            
                            // Map values in filters
                            if (['eq', 'neq'].includes(call.method)) {
                                newCall.args[1] = resolveNameToId(newCall.args[0], newCall.args[1], tableName);
                            }
                            if (call.method === 'in') {
                                newCall.args[1] = Array.isArray(newCall.args[1]) 
                                    ? newCall.args[1].map(v => resolveNameToId(newCall.args[0], v, tableName)) 
                                    : newCall.args[1];
                            }
                            if (call.method === 'filter') {
                                newCall.args[2] = resolveNameToId(newCall.args[0], newCall.args[2], tableName);
                            }
                            
                            processedCalls.push(newCall);
                        }
                        
                        // 3. Rebuild query builder starting from rawSupabase
                        let query = rawSupabase.from(tableName);
                        for (const call of processedCalls) {
                            query = query[call.method](...call.args);
                        }
                        
                        // 4. Run the query
                        const result = await query;
                        
                        // 5. Map returned data back to names
                        const isStadiumsOrManagersTable = [
                            'alahly_MATCHDETAILS',
                            'alahly_FINALS_MATCHDETAILS',
                            'alahly_vs_zamalek_MATCHDETAILS',
                            'egy_NT_MATCHDETAILS',
                            'egy_CLUB_MATCHDETAILS'
                        ].includes(tableName);
                        
                        const playerCols = playerColumnsMap[tableName];
                        const teamCols = teamColumnsMap[tableName];
                        const isMappedTable = isStadiumsOrManagersTable || !!playerCols || !!teamCols;
                        
                        if (result && result.data && isMappedTable) {
                            result.data = mapDataDbToApp(result.data, tableName);
                        }
                        return result;
                    };
                    
                    return run().then(onFulfilled, onRejected);
                };
            }
            
            const value = Reflect.get(obj, prop, receiver);
            if (typeof value === 'function') {
                return function(...args) {
                    // Collect method calls
                    const nextCalls = [...calls, { method: prop, args }];
                    const nextResult = value.apply(obj, args);
                    if (nextResult && typeof nextResult.then === 'function') {
                        return wrapQueryBuilder(nextResult, tableName, nextCalls);
                    }
                    return nextResult;
                };
            }
            return value;
        }
    });
}

const wrappedSupabase = new Proxy(rawSupabase, {
    get(target, prop, receiver) {
        if (prop === 'from') {
            return function(tableName) {
                const originalBuilder = target.from(tableName);
                return wrapQueryBuilder(originalBuilder, tableName);
            };
        }
        return Reflect.get(target, prop, receiver);
    }
});

export const supabase = wrappedSupabase;

export async function resolveCatalogFieldsInForm(selectedTable, form) {
    await loadCaches();
    const resolved = { ...form };

    for (const col of Object.keys(resolved)) {
        const val = resolved[col];
        if (typeof val !== "string" || isSkippableCatalogValue(val)) continue;

        const catalog = getCatalogForColumn(col);
        if (!catalog || catalog === "db_STADIUMS") continue;

        if (selectedTable === catalog) {
            const cfg = CATALOG_CONFIG[catalog];
            if (cfg?.nameCols?.includes(col)) continue;
        }

        if (isLikelyCatalogName(val, CATALOG_CONFIG[catalog]?.idPrefix)) {
            resolved[col] = await resolveStrictCatalogValue(catalog, val);
        }
    }

    return resolved;
}

// Trigger initial cache load in the background
loadCaches();
