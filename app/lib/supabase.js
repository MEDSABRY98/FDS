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
            const [stadsData, mgrsData, playersData, refsData, teamsData] = await Promise.all([
                fetchAllRows('db_STADIUMS', 'STADIUM_ID, STADIUM_NAME'),
                fetchAllRows('db_MANAGERS', 'MANAGER_ID, MANAGER_NAME'),
                fetchAllRows('db_PLAYERS', 'PLAYER_ID, PLAYER_NAME'),
                fetchAllRows('db_REFEREES', 'REFEREE_ID, REFEREE_NAME'),
                fetchAllRows('db_TEAMS', 'TEAM_ID, TEAM_NAME')
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

            if (stadsData) {
                stadsData.forEach(r => {
                    if (r.STADIUM_ID && r.STADIUM_NAME) {
                        stadiumsIdToName[r.STADIUM_ID] = r.STADIUM_NAME;
                        stadiumsNameToId[r.STADIUM_NAME.trim().toLowerCase()] = r.STADIUM_ID;
                    }
                });
            }
            if (mgrsData) {
                mgrsData.forEach(r => {
                    if (r.MANAGER_ID && r.MANAGER_NAME) {
                        managersIdToName[r.MANAGER_ID] = r.MANAGER_NAME;
                        managersNameToId[r.MANAGER_NAME.trim().toLowerCase()] = r.MANAGER_ID;
                    }
                });
            }
            if (playersData) {
                playersData.forEach(r => {
                    if (r.PLAYER_ID && r.PLAYER_NAME) {
                        playersIdToName[r.PLAYER_ID] = r.PLAYER_NAME;
                        playersNameToId[r.PLAYER_NAME.trim().toLowerCase()] = r.PLAYER_ID;
                    }
                });
            }
            if (refsData) {
                refsData.forEach(r => {
                    if (r.REFEREE_ID && r.REFEREE_NAME) {
                        refereesIdToName[r.REFEREE_ID] = r.REFEREE_NAME;
                        refereesNameToId[r.REFEREE_NAME.trim().toLowerCase()] = r.REFEREE_ID;
                    }
                });
            }
            if (teamsData) {
                teamsData.forEach(r => {
                    if (r.TEAM_ID && r.TEAM_NAME) {
                        teamsIdToName[r.TEAM_ID] = r.TEAM_NAME;
                        teamsNameToId[r.TEAM_NAME.trim().toLowerCase()] = r.TEAM_ID;
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
    const clean = String(value).trim().toLowerCase();
    
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

// Async resolution and registration of payload names -> IDs
async function resolveAndRegisterPayload(payload, tableName) {
    await loadCaches();
    
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
    
    if (!isMappedTable) return payload;
    
    const resolveOrRegister = async (col, val) => {
        if (!val || val === '-' || val === 'Unknown' || val === '?' || val === '؟') return val;
        
        const isStadium = ['STAD', 'PLACE'].includes(col);
        const isManager = ['AHLY MANAGER', 'OPPONENT MANAGER', 'ZAMALEK MANAGER', 'EGYPT MANAGER'].includes(col);
        const isReferee = ['REFREE', 'REFEREE'].includes(col);
        const isPlayer = playerCols && playerCols.includes(col);
        const isTeam = teamCols && teamCols.includes(col);
        
        if (!isStadium && !isManager && !isReferee && !isPlayer && !isTeam) return val;
        
        const clean = String(val).trim().toLowerCase();
        
        if (isStadium) {
            if (stadiumsNameToId[clean]) return stadiumsNameToId[clean];
            if (String(val).startsWith('S-')) return val;
            
            // Register new stadium
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
        
        if (isManager) {
            if (managersNameToId[clean]) return managersNameToId[clean];
            if (String(val).startsWith('M-')) return val;
            
            // Register new manager
            try {
                const { data } = await rawSupabase.from('db_MANAGERS').select('MANAGER_ID');
                const nums = data ? data.map(r => {
                    const m = String(r.MANAGER_ID).match(/(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                }) : [0];
                const nextNum = Math.max(0, ...nums) + 1;
                const nextId = 'M-' + String(nextNum).padStart(4, '0');
                const nextRowId = 'R-' + String(nextNum).padStart(4, '0');
                
                await rawSupabase.from('db_MANAGERS').insert({
                    ROW_ID: nextRowId,
                    MANAGER_ID: nextId,
                    MANAGER_NAME: String(val).trim()
                });
                
                managersIdToName[nextId] = String(val).trim();
                managersNameToId[clean] = nextId;
                return nextId;
            } catch (e) {
                console.error("Auto-register manager failed:", e);
                return val;
            }
        }
        
        if (isReferee) {
            if (refereesNameToId[clean]) return refereesNameToId[clean];
            if (String(val).startsWith('REF-')) return val;
            
            // Register new referee
            try {
                const { data } = await rawSupabase.from('db_REFEREES').select('REFEREE_ID');
                const nums = data ? data.map(r => {
                    const m = String(r.REFEREE_ID).match(/(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                }) : [0];
                const nextNum = Math.max(0, ...nums) + 1;
                const nextId = 'REF-' + String(nextNum).padStart(4, '0');
                const nextRowId = 'R-' + String(nextNum).padStart(4, '0');
                
                await rawSupabase.from('db_REFEREES').insert({
                    ROW_ID: nextRowId,
                    REFEREE_ID: nextId,
                    REFEREE_NAME: String(val).trim()
                });
                
                refereesIdToName[nextId] = String(val).trim();
                refereesNameToId[clean] = nextId;
                return nextId;
            } catch (e) {
                console.error("Auto-register referee failed:", e);
                return val;
            }
        }
        
        if (isPlayer) {
            if (playersNameToId[clean]) return playersNameToId[clean];
            if (String(val).startsWith('P-')) return val;
            
            // Register new player
            try {
                const { data } = await rawSupabase.from('db_PLAYERS').select('PLAYER_ID');
                const nums = data ? data.map(r => {
                    const m = String(r.PLAYER_ID).match(/(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                }) : [0];
                const nextNum = Math.max(0, ...nums) + 1;
                const nextId = 'P-' + String(nextNum).padStart(4, '0');
                const nextRowId = 'R-' + String(nextNum).padStart(4, '0');
                
                await rawSupabase.from('db_PLAYERS').insert({
                    ROW_ID: nextRowId,
                    PLAYER_ID: nextId,
                    PLAYER_NAME: String(val).trim()
                });
                
                playersIdToName[nextId] = String(val).trim();
                playersNameToId[clean] = nextId;
                return nextId;
            } catch (e) {
                console.error("Auto-register player failed:", e);
                return val;
            }
        }
        
        if (isTeam) {
            if (teamsNameToId[clean]) return teamsNameToId[clean];
            if (String(val).startsWith('T-')) return val;
            
            // Register new team
            try {
                const { data } = await rawSupabase.from('db_TEAMS').select('TEAM_ID');
                const nums = data ? data.map(r => {
                    const m = String(r.TEAM_ID).match(/(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                }) : [0];
                const nextNum = Math.max(0, ...nums) + 1;
                const nextId = 'T-' + String(nextNum).padStart(4, '0');
                const nextRowId = 'R-' + String(nextNum).padStart(4, '0');
                
                await rawSupabase.from('db_TEAMS').insert({
                    ROW_ID: nextRowId,
                    TEAM_ID: nextId,
                    TEAM_NAME: String(val).trim()
                });
                
                teamsIdToName[nextId] = String(val).trim();
                teamsNameToId[clean] = nextId;
                return nextId;
            } catch (e) {
                console.error("Auto-register team failed:", e);
                return val;
            }
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
                                if (['db_STADIUMS', 'db_MANAGERS', 'db_PLAYERS', 'db_REFEREES', 'db_TEAMS'].includes(tableName)) {
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

// Trigger initial cache load in the background
loadCaches();
