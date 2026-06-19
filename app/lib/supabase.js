"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { createClient } from '@supabase/supabase-js'
import {
    NAME_DISPLAY_LANG_KEY,
    NAME_DISPLAY_LANG_OPTIONS,
    NAME_DISPLAY_LANGUAGE_HINT,
    CATALOG_BILINGUAL_TABLES,
    CATALOG_NAME_COLUMN_PAIRS,
    formatCatalogColumnLabel,
    normalizeNameDisplayLang,
    pickBilingualDisplayName,
    buildCatalogOptions,
    sortCatalogNames,
} from "./catalogBilingual";
import {
    getActiveTableSortRules,
    parseTableSortSetting,
    sortRowsByTableSortRules,
    parseColumnOrderFromSetting,
    serializeTableSettings,
} from "./Settings_db";

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
let playersNamesById = {};
let managersNamesById = {};
let refereesNamesById = {};
let teamsNamesById = {};
let stadiumsNamesById = {};
let countriesNamesById = {};
let nameDisplayLang = "auto";
let cachesPromise = null;

const playerColumnsMap = {
    'alahly_GKSDETAILS': ['PLAYER NAME'],
    'alahly_LINEUPDETAILS': ['PLAYER NAME', 'PLAYER NAME OUT'],
    'alahly_PKS': ['AHLY GK', 'AHLY PLAYER', 'OPPONENT GK', 'OPPONENT PLAYER'],
    'alahly_PLAYERDETAILS': ['PLAYER NAME'],
    'egy_NT_GKSDETAILS': ['PLAYER NAME'],
    'egy_NT_LINEUPDETAILS': ['PLAYER NAME', 'PLAYER NAME OUT'],
    'egy_NT_PKS': ['EGYPT GK', 'Egypt PLAYER', 'OPPONENT GK', 'OPPONENT PLAYER'],
    'egy_NT_PLAYERDETAILS': ['PLAYER NAME'],
    'egy_NT_SQUAD': ['PLAYERNAME']
};

const teamColumnsMap = {
    'alahly_GKSDETAILS': ['TEAM'],
    'alahly_HOWPENMISSED': ['TEAM'],
    'alahly_LINEUPDETAILS': ['TEAM'],
    'alahly_MATCHDETAILS': ['AHLY TEAM', 'OPPONENT TEAM'],
    'alahly_PKS': ['AHLY TEAM', 'OPPONENT TEAM'],
    'alahly_PLAYERDETAILS': ['TEAM'],
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
        nameCols: ["PLAYER_NAME", "PLAYER_NAME_EN"],
        idPrefix: "P-",
        labelAr: "اللاعب"
    },
    db_MANAGERS: {
        idCol: "MANAGER_ID",
        nameCols: ["MANAGER_NAME", "MANAGER_NAME_EN"],
        idPrefix: "M-",
        labelAr: "المدرب"
    },
    db_REFEREES: {
        idCol: "REFEREE_ID",
        nameCols: ["REFEREE_NAME", "REFEREE_NAME_EN"],
        idPrefix: "REF-",
        labelAr: "الحكم"
    },
    db_TEAMS: {
        idCol: "TEAM_ID",
        nameCols: ["TEAM_NAME", "TEAM_NAME_EN"],
        idPrefix: "T-",
        labelAr: "الفريق"
    },
    db_STADIUMS: {
        idCol: "STADIUM_ID",
        nameCols: ["STADIUM_NAME", "STADIUM_NAME_EN"],
        idPrefix: "S-",
        labelAr: "الاستاد"
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

function getCatalogNamesByIdMap(catalog) {
    switch (catalog) {
        case "db_PLAYERS": return playersNamesById;
        case "db_MANAGERS": return managersNamesById;
        case "db_REFEREES": return refereesNamesById;
        case "db_TEAMS": return teamsNamesById;
        case "db_STADIUMS": return stadiumsNamesById;
        case "db_COUNTRIES": return countriesNamesById;
        default: return null;
    }
}

function getLegacyIdToNameMap(catalog) {
    switch (catalog) {
        case "db_PLAYERS": return playersIdToName;
        case "db_MANAGERS": return managersIdToName;
        case "db_REFEREES": return refereesIdToName;
        case "db_TEAMS": return teamsIdToName;
        case "db_STADIUMS": return stadiumsIdToName;
        case "db_COUNTRIES": return countriesIdToName;
        default: return null;
    }
}

function getLegacyNameToIdMap(catalog) {
    switch (catalog) {
        case "db_PLAYERS": return playersNameToId;
        case "db_MANAGERS": return managersNameToId;
        case "db_REFEREES": return refereesNameToId;
        case "db_TEAMS": return teamsNameToId;
        case "db_STADIUMS": return stadiumsNameToId;
        case "db_COUNTRIES": return countriesNameToId;
        default: return null;
    }
}

export function getNameDisplayLang() {
    return nameDisplayLang;
}

export function getCatalogDisplayName(catalog, id, lang = nameDisplayLang) {
    if (!id) return "";
    const names = getCatalogNamesByIdMap(catalog)?.[id];
    return pickBilingualDisplayName(names, lang);
}

function syncLegacyDisplayMap(catalog, id) {
    const names = getCatalogNamesByIdMap(catalog)?.[id];
    const legacyMap = getLegacyIdToNameMap(catalog);
    if (!legacyMap || !names) return;
    legacyMap[id] = pickBilingualDisplayName(names, nameDisplayLang);
}

function registerBilingualCatalogEntry(catalog, id, ar, en) {
    if (!id) return;
    const namesMap = getCatalogNamesByIdMap(catalog);
    const nameToId = getLegacyNameToIdMap(catalog);
    if (!namesMap || !nameToId) return;

    const arName = String(ar || "").trim();
    const enName = String(en || "").trim();
    namesMap[id] = { ar: arName, en: enName };

    if (arName) nameToId[normalizeCatalogName(arName)] = id;
    if (enName) nameToId[normalizeCatalogName(enName)] = id;
    syncLegacyDisplayMap(catalog, id);
}

function rebuildAllLegacyDisplayMaps() {
    Object.keys(CATALOG_CONFIG).forEach((catalog) => {
        const namesMap = getCatalogNamesByIdMap(catalog) || {};
        Object.keys(namesMap).forEach((id) => syncLegacyDisplayMap(catalog, id));
    });
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

function describeSupabaseError(error) {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    return [
        error.message,
        error.details,
        error.hint,
        error.code,
        error.name,
    ].filter(Boolean).join(" | ") || JSON.stringify(error);
}

function isTransientFetchError(error) {
    const details = describeSupabaseError(error).toLowerCase();
    return (
        error?.name === "AbortError" ||
        details.includes("abort") ||
        details.includes("lock broken") ||
        details.includes("request was aborted")
    );
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllRows(tableName, selectColumns, attempt = 1) {
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
            if (isTransientFetchError(error) && attempt < 4) {
                await sleep(150 * attempt);
                return fetchAllRows(tableName, selectColumns, attempt + 1);
            }
            const details = describeSupabaseError(error);
            console.error(`Error fetching all rows from ${tableName}: ${details}`);
            throw new Error(details);
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

async function fetchCatalogRows(tableName, selectWithEn, selectWithoutEn) {
    try {
        return await fetchAllRows(tableName, selectWithEn);
    } catch (error) {
        if (isTransientFetchError(error)) throw error;
        if (!selectWithoutEn) throw error;
        console.warn(
            `Falling back to legacy catalog columns for ${tableName}: ${describeSupabaseError(error)}`
        );
        return fetchAllRows(tableName, selectWithoutEn);
    }
}

async function safeFetchCatalogRows(tableName, selectWithEn, selectWithoutEn) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            return await fetchCatalogRows(tableName, selectWithEn, selectWithoutEn);
        } catch (error) {
            if (isTransientFetchError(error) && attempt < 3) {
                await sleep(200 * attempt);
                continue;
            }
            console.error(`Failed to load catalog table ${tableName}: ${describeSupabaseError(error)}`);
            return [];
        }
    }
    return [];
}

async function fetchNameDisplayLangSetting() {
    try {
        const { data, error } = await rawSupabase
            .from("db_Settings")
            .select("SORTING")
            .eq("TABLE_NAME", NAME_DISPLAY_LANG_KEY)
            .maybeSingle();

        if (error) return "auto";
        return normalizeNameDisplayLang(data?.SORTING);
    } catch {
        return "auto";
    }
}

async function loadCaches() {
    if (cachesPromise) return cachesPromise;
    cachesPromise = (async () => {
        try {
            const stadsData = await safeFetchCatalogRows('db_STADIUMS', 'STADIUM_ID, STADIUM_NAME, STADIUM_NAME_EN', 'STADIUM_ID, STADIUM_NAME');
            const mgrsData = await safeFetchCatalogRows('db_MANAGERS', 'MANAGER_ID, MANAGER_NAME, MANAGER_NAME_EN', 'MANAGER_ID, MANAGER_NAME');
            const playersData = await safeFetchCatalogRows('db_PLAYERS', 'PLAYER_ID, PLAYER_NAME, PLAYER_NAME_EN', 'PLAYER_ID, PLAYER_NAME');
            const refsData = await safeFetchCatalogRows('db_REFEREES', 'REFEREE_ID, REFEREE_NAME, REFEREE_NAME_EN', 'REFEREE_ID, REFEREE_NAME');
            const teamsData = await safeFetchCatalogRows('db_TEAMS', 'TEAM_ID, TEAM_NAME, TEAM_NAME_EN', 'TEAM_ID, TEAM_NAME');
            const countriesData = await safeFetchCatalogRows('db_COUNTRIES', 'COUNTRY_ID, COUNTRY_NAME, COUNTRY_NAME_EN', 'COUNTRY_ID, COUNTRY_NAME');
            const displayLang = await fetchNameDisplayLangSetting();

            nameDisplayLang = normalizeNameDisplayLang(displayLang);
            
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
            playersNamesById = {};
            managersNamesById = {};
            refereesNamesById = {};
            teamsNamesById = {};
            stadiumsNamesById = {};
            countriesNamesById = {};

            if (stadsData) {
                stadsData.forEach(r => {
                    if (r.STADIUM_ID) {
                        registerBilingualCatalogEntry(
                            "db_STADIUMS",
                            r.STADIUM_ID,
                            r.STADIUM_NAME,
                            r.STADIUM_NAME_EN
                        );
                    }
                });
            }
            if (mgrsData) {
                mgrsData.forEach(r => {
                    if (r.MANAGER_ID) {
                        registerBilingualCatalogEntry(
                            "db_MANAGERS",
                            r.MANAGER_ID,
                            r.MANAGER_NAME,
                            r.MANAGER_NAME_EN
                        );
                    }
                });
            }
            if (playersData) {
                playersData.forEach(r => {
                    if (r.PLAYER_ID) {
                        registerBilingualCatalogEntry(
                            "db_PLAYERS",
                            r.PLAYER_ID,
                            r.PLAYER_NAME,
                            r.PLAYER_NAME_EN
                        );
                    }
                });
            }
            if (refsData) {
                refsData.forEach(r => {
                    if (r.REFEREE_ID) {
                        registerBilingualCatalogEntry(
                            "db_REFEREES",
                            r.REFEREE_ID,
                            r.REFEREE_NAME,
                            r.REFEREE_NAME_EN
                        );
                    }
                });
            }
            if (teamsData) {
                teamsData.forEach(r => {
                    if (r.TEAM_ID) {
                        registerBilingualCatalogEntry(
                            "db_TEAMS",
                            r.TEAM_ID,
                            r.TEAM_NAME,
                            r.TEAM_NAME_EN
                        );
                    }
                });
            }
            if (countriesData) {
                countriesData.forEach(r => {
                    if (r.COUNTRY_ID) {
                        registerBilingualCatalogEntry(
                            "db_COUNTRIES",
                            r.COUNTRY_ID,
                            r.COUNTRY_NAME,
                            r.COUNTRY_NAME_EN
                        );
                    }
                });
            }
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
    const existing = getCatalogNamesByIdMap(catalog)?.[id] || { ar: "", en: "" };
    const value = String(name).trim();
    const cfg = CATALOG_CONFIG[catalog];
    if (!cfg) return;

    const enCol = cfg.nameCols.find((col) => col.endsWith("_EN"));
    const arCol = cfg.nameCols.find((col) => !col.endsWith("_EN"));
    const matchedCol = cfg.nameCols.find((col) => {
        const current = col === enCol ? existing.en : existing.ar;
        return normalizeCatalogName(current) === normalizeCatalogName(value);
    });

    if (matchedCol === enCol) {
        registerBilingualCatalogEntry(catalog, id, existing.ar, value);
        return;
    }
    if (matchedCol === arCol) {
        registerBilingualCatalogEntry(catalog, id, value, existing.en);
        return;
    }

    registerBilingualCatalogEntry(catalog, id, value, existing.en);
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

async function resolveSoftCatalogValue(catalog, val) {
    try {
        return await resolveStrictCatalogValue(catalog, val);
    } catch {
        return val;
    }
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
                    STADIUM_NAME: String(val).trim(),
                    STADIUM_NAME_EN: null
                });

                registerBilingualCatalogEntry("db_STADIUMS", nextId, String(val).trim(), "");
                return nextId;
            } catch (e) {
                console.error("Auto-register stadium failed:", e);
                return val;
            }
        }

        if (!isCatalogReferenceColumn(col, tableName)) return val;

        const catalog = getCatalogForColumn(col);
        if (catalog) {
            if (PKS_TABLES.has(tableName)) {
                return await resolveSoftCatalogValue(catalog, val);
            }
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

function parseTrailingIdNumber(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return 0;

    const trailingNumber = raw.match(/(\d+)(?!.*\d)/);
    if (trailingNumber) return parseInt(trailingNumber[1], 10);

    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : 0;
}

const PKS_TABLES = new Set(["alahly_PKS", "egy_NT_PKS"]);

const ROW_ID_AUTO_TABLE_PATTERN = /_(LINEUPDETAILS|PLAYERDETAILS|GKSDETAILS|HOWPENMISSED|SQUAD)$/i;

function shouldAutoAssignRowId(tableName) {
    if (CATALOG_TABLES.includes(tableName)) return false;
    if (String(tableName || "").endsWith("_MATCHDETAILS")) return false;
    if (tableName === "alahly_PKS" || tableName === "egy_NT_PKS") return false;
    return ROW_ID_AUTO_TABLE_PATTERN.test(String(tableName || ""));
}

function rowNeedsAutoRowId(row) {
    const rowId = String(row?.ROW_ID ?? "").trim();
    return rowId === "" || rowId === "null" || rowId === "undefined";
}

async function allocateRowIds(tableName, count = 1) {
    const total = Math.max(1, Number(count) || 1);
    let maxNum = 0;
    let from = 0;

    while (true) {
        const { data, error } = await rawSupabase
            .from(tableName)
            .select("ROW_ID")
            .range(from, from + 999);

        if (error) throw error;
        if (!data?.length) break;

        data.forEach((row) => {
            maxNum = Math.max(maxNum, parseTrailingIdNumber(row?.ROW_ID));
        });

        if (data.length < 1000) break;
        from += 1000;
    }

    return Array.from({ length: total }, (_, index) =>
        `R-${String(maxNum + 1 + index).padStart(4, "0")}`
    );
}

async function ensureRowIdsOnInsert(payload, tableName) {
    if (!shouldAutoAssignRowId(tableName) || payload == null) return payload;

    if (Array.isArray(payload)) {
        const missingCount = payload.filter(rowNeedsAutoRowId).length;
        if (missingCount === 0) return payload;

        const rowIds = await allocateRowIds(tableName, missingCount);
        let idIndex = 0;
        return payload.map((row) => {
            if (!rowNeedsAutoRowId(row)) return row;
            return { ...row, ROW_ID: rowIds[idIndex++] };
        });
    }

    if (!rowNeedsAutoRowId(payload)) return payload;
    const [rowId] = await allocateRowIds(tableName, 1);
    return { ...payload, ROW_ID: rowId };
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
                                    if (call.method === 'insert' || call.method === 'upsert') {
                                        newCall.args[0] = await ensureRowIdsOnInsert(newCall.args[0], tableName);
                                    }
                                }
                            }
                            
                            // Invalidate caches if writing or deleting in the catalogs
                            if (['insert', 'update', 'upsert', 'delete'].includes(call.method)) {
                                if (['db_STADIUMS', 'db_MANAGERS', 'db_PLAYERS', 'db_REFEREES', 'db_TEAMS', 'db_COUNTRIES'].includes(tableName)) {
                                    cachesPromise = null;
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

export function getChangedFormFields(original = {}, updated = {}) {
    const changed = {};
    const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)]);

    for (const key of allKeys) {
        if (key.startsWith("_")) continue;

        const originalValue = original[key] ?? "";
        const updatedValue = updated[key] ?? "";
        if (String(originalValue).trim() !== String(updatedValue).trim()) {
            changed[key] = updated[key];
        }
    }

    return changed;
}

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

const parseManagementIdSortValue = (value) => parseTrailingIdNumber(value);

const findManagementSortKey = (columns = []) => {
    const cols = columns.map((column) => String(column));
    const upperCols = cols.map((column) => column.toUpperCase());

    const rowIdIndex = upperCols.indexOf("ROW_ID");
    if (rowIdIndex !== -1) return cols[rowIdIndex];

    const eventIdIndex = upperCols.indexOf("EVENT_ID");
    if (eventIdIndex !== -1) return cols[eventIdIndex];

    const matchIdIndex = upperCols.indexOf("MATCH_ID");
    if (matchIdIndex !== -1) return cols[matchIdIndex];

    const entityId = cols.find((column) => {
        const upper = column.toUpperCase();
        return upper.endsWith("_ID") && upper !== "ROW_ID";
    });
    if (entityId) return entityId;

    return null;
};

const compareManagementRowsByIdDesc = (a, b, sortKey) => {
    if (!sortKey) return 0;

    const valueA = parseManagementIdSortValue(a?.[sortKey]);
    const valueB = parseManagementIdSortValue(b?.[sortKey]);
    if (valueB !== valueA) return valueB - valueA;

    return String(b?.[sortKey] ?? "").localeCompare(String(a?.[sortKey] ?? ""), undefined, { numeric: true });
};

export function sortManagementTableData(rows, columns, sorting = null) {
    if (!Array.isArray(rows) || rows.length === 0) return rows;

    if (sorting) {
        const rules = parseTableSortSetting(sorting, columns);
        if (getActiveTableSortRules(rules).length > 0) {
            return sortRowsByTableSortRules(rows, columns, rules);
        }
    }

    const sortKey = findManagementSortKey(columns);
    if (!sortKey) return rows;

    return [...rows].sort((a, b) => compareManagementRowsByIdDesc(a, b, sortKey));
}

const GLOBAL_DB_NAME_SORT_COLUMNS = [
    "PLAYER_NAME",
    "MANAGER_NAME",
    "STADIUM_NAME",
    "REFEREE_NAME",
    "TEAM_NAME",
    "COUNTRY_NAME"
];

const GLOBAL_DB_NAME_SORT_COLUMNS_EN = [
    "PLAYER_NAME_EN",
    "MANAGER_NAME_EN",
    "STADIUM_NAME_EN",
    "REFEREE_NAME_EN",
    "TEAM_NAME_EN",
    "COUNTRY_NAME_EN"
];

function findCatalogNamePairInColumns(columns = []) {
    const colSet = new Set(columns);
    return CATALOG_NAME_COLUMN_PAIRS.find(([arCol, enCol]) => colSet.has(arCol) || colSet.has(enCol));
}

function sortRowsByResolvedCatalogName(rows, columns, lang) {
    const pair = findCatalogNamePairInColumns(columns);
    if (!pair) return rows;

    const [arCol, enCol] = pair;
    return [...rows].sort((a, b) => {
        const nameA = pickBilingualDisplayName({ ar: a[arCol], en: a[enCol] }, lang);
        const nameB = pickBilingualDisplayName({ ar: b[arCol], en: b[enCol] }, lang);
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base", numeric: true });
    });
}

export function sortGlobalDbManagementTableData(rows, columns = [], sorting = null) {
    if (!Array.isArray(rows) || rows.length === 0) return rows;

    if (sorting) {
        return sortManagementTableData(rows, columns, sorting);
    }

    if (nameDisplayLang === "auto") {
        return sortRowsByResolvedCatalogName(rows, columns, "auto");
    }

    const sortColumns = nameDisplayLang === "en"
        ? GLOBAL_DB_NAME_SORT_COLUMNS_EN
        : GLOBAL_DB_NAME_SORT_COLUMNS;
    const locale = nameDisplayLang === "en" ? "en" : "ar";
    const nameColumn = sortColumns.find((col) => columns.includes(col))
        || GLOBAL_DB_NAME_SORT_COLUMNS.find((col) => columns.includes(col));

    if (nameColumn) {
        return [...rows].sort((a, b) =>
            String(a[nameColumn] || "").localeCompare(String(b[nameColumn] || ""), locale)
        );
    }

    const sortKey = findManagementSortKey(columns);
    if (!sortKey) return rows;

    return [...rows].sort((a, b) =>
        String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, { numeric: true })
    );
}

export const SETTINGS_TAB_ID = "SETTINGS";

const SETTINGS_TABLE = "db_Settings";

const isSettingsTableMissing = (error) => {
    const code = String(error?.code || "");
    const message = String(error?.message || "");
    return code === "PGRST205" || /db_settings/i.test(message);
};

const logSettingsError = (context, error) => {
    if (isSettingsTableMissing(error)) return;
    const message = error?.message || error?.details || JSON.stringify(error);
    console.error(`${context}: ${message}`);
};

const parseSettingsRowIdNumber = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return 0;

    const trailingNumber = raw.match(/(\d+)(?!.*\d)/);
    if (trailingNumber) return parseInt(trailingNumber[1], 10);

    const asNum = parseInt(raw, 10);
    return Number.isFinite(asNum) ? asNum : 0;
};

async function allocateNextSettingsRowId() {
    let maxNum = 0;
    let from = 0;

    while (true) {
        const { data, error } = await rawSupabase
            .from(SETTINGS_TABLE)
            .select("ROW_ID")
            .range(from, from + 999);

        if (error) throw error;
        if (!data?.length) break;

        data.forEach((row) => {
            maxNum = Math.max(maxNum, parseSettingsRowIdNumber(row?.ROW_ID));
        });

        if (data.length < 1000) break;
        from += 1000;
    }

    return `R-${String(maxNum + 1).padStart(4, "0")}`;
}

export async function FetchTableSortSetting(tableName) {
    if (!tableName) return null;

    try {
        const { data, error } = await rawSupabase
            .from(SETTINGS_TABLE)
            .select("SORTING")
            .eq("TABLE_NAME", tableName)
            .maybeSingle();

        if (error) {
            logSettingsError("Failed to fetch table sort setting", error);
            return null;
        }
        return data?.SORTING || null;
    } catch (err) {
        logSettingsError("Failed to fetch table sort setting", err);
        return null;
    }
}

export async function FetchAllTableSortSettings() {
    try {
        const { data, error } = await rawSupabase
            .from(SETTINGS_TABLE)
            .select("TABLE_NAME, SORTING");

        if (error) {
            logSettingsError("Failed to fetch table sort settings", error);
            return {};
        }

        const settings = {};
        (data || []).forEach((row) => {
            const tableName = String(row.TABLE_NAME);
            if (tableName === NAME_DISPLAY_LANG_KEY) return;
            settings[tableName] = String(row.SORTING || "ROW_ID");
        });
        return settings;
    } catch (err) {
        logSettingsError("Failed to fetch table sort settings", err);
        return {};
    }
}

export async function SaveTableSettings(tableName, { columnOrder = [], sortRules = [], dataSortPreset = null } = {}) {
    const normalizedTableName = String(tableName || "").trim();
    if (!normalizedTableName) {
        throw new Error("TABLE_NAME is required.");
    }

    const payload = serializeTableSettings({ columnOrder, sortRules, dataSortPreset });

    const { data: existing, error: fetchError } = await rawSupabase
        .from(SETTINGS_TABLE)
        .select("ROW_ID")
        .eq("TABLE_NAME", normalizedTableName)
        .maybeSingle();

    if (fetchError) {
        if (isSettingsTableMissing(fetchError)) {
            throw new Error("db_Settings table is missing. Run scripts/setup-db-settings.mjs first.");
        }
        throw fetchError;
    }

    if (existing?.ROW_ID) {
        const { error } = await rawSupabase
            .from(SETTINGS_TABLE)
            .update({ SORTING: payload })
            .eq("TABLE_NAME", normalizedTableName);
        if (error) throw error;
        return existing.ROW_ID;
    }

    const rowId = await allocateNextSettingsRowId();
    const { error } = await rawSupabase
        .from(SETTINGS_TABLE)
        .insert({
            ROW_ID: rowId,
            TABLE_NAME: normalizedTableName,
            SORTING: payload,
        });

    if (error) throw error;
    return rowId;
}

export async function SaveTableSortSetting(tableName, sorting) {
    const normalizedTableName = String(tableName || "").trim();
    if (!normalizedTableName) {
        throw new Error("TABLE_NAME is required.");
    }

    if (Array.isArray(sorting)) {
        const existingRaw = await FetchTableSortSetting(normalizedTableName);
        const existingOrder = parseColumnOrderFromSetting(existingRaw) || [];
        return SaveTableSettings(normalizedTableName, {
            columnOrder: existingOrder,
            sortRules: sorting,
        });
    }

    const normalizedSorting = String(sorting || "").trim();
    if (!normalizedSorting) {
        throw new Error("Sort configuration is required.");
    }

    const { data: existing, error: fetchError } = await rawSupabase
        .from(SETTINGS_TABLE)
        .select("ROW_ID")
        .eq("TABLE_NAME", normalizedTableName)
        .maybeSingle();

    if (fetchError) {
        if (isSettingsTableMissing(fetchError)) {
            throw new Error("db_Settings table is missing. Run scripts/setup-db-settings.mjs first.");
        }
        throw fetchError;
    }

    if (existing?.ROW_ID) {
        const { error } = await rawSupabase
            .from(SETTINGS_TABLE)
            .update({ SORTING: normalizedSorting })
            .eq("TABLE_NAME", normalizedTableName);
        if (error) throw error;
        return existing.ROW_ID;
    }

    const rowId = await allocateNextSettingsRowId();
    const { error } = await rawSupabase
        .from(SETTINGS_TABLE)
        .insert({
            ROW_ID: rowId,
            TABLE_NAME: normalizedTableName,
            SORTING: normalizedSorting,
        });

    if (error) throw error;
    return rowId;
}

export async function ClearTableSortSetting(tableName) {
    const normalizedTableName = String(tableName || "").trim();
    if (!normalizedTableName) {
        throw new Error("TABLE_NAME is required.");
    }

    const { error } = await rawSupabase
        .from(SETTINGS_TABLE)
        .delete()
        .eq("TABLE_NAME", normalizedTableName);

    if (error) {
        if (isSettingsTableMissing(error)) {
            throw new Error("db_Settings table is missing. Run scripts/setup-db-settings.mjs first.");
        }
        throw error;
    }
}

export async function FetchNameDisplayLang() {
    return fetchNameDisplayLangSetting();
}

export async function SaveNameDisplayLang(lang) {
    const normalizedLang = normalizeNameDisplayLang(lang);

    const { data: existing, error: fetchError } = await rawSupabase
        .from(SETTINGS_TABLE)
        .select("ROW_ID")
        .eq("TABLE_NAME", NAME_DISPLAY_LANG_KEY)
        .maybeSingle();

    if (fetchError) {
        if (isSettingsTableMissing(fetchError)) {
            throw new Error("db_Settings table is missing. Run scripts/setup-db-settings.mjs first.");
        }
        throw fetchError;
    }

    if (existing?.ROW_ID) {
        const { error } = await rawSupabase
            .from(SETTINGS_TABLE)
            .update({ SORTING: normalizedLang })
            .eq("TABLE_NAME", NAME_DISPLAY_LANG_KEY);
        if (error) throw error;
    } else {
        const rowId = await allocateNextSettingsRowId();
        const { error } = await rawSupabase
            .from(SETTINGS_TABLE)
            .insert({
                ROW_ID: rowId,
                TABLE_NAME: NAME_DISPLAY_LANG_KEY,
                SORTING: normalizedLang,
            });
        if (error) throw error;
    }

    nameDisplayLang = normalizedLang;
    cachesPromise = null;
    rebuildAllLegacyDisplayMaps();
    await loadCaches();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("nameDisplayLangChanged", { detail: normalizedLang }));
    }
    return normalizedLang;
}

export async function fetchCatalogDisplayNames(tableName) {
    const config = CATALOG_BILINGUAL_TABLES[tableName];
    if (!config) return [];

    await loadCaches();
    const { idCol, nameColAr, nameColEn } = config;
    const namesMap = getCatalogNamesByIdMap(tableName) || {};
    const rows = Object.entries(namesMap).map(([id, names]) => ({
        [idCol]: id,
        [nameColAr]: names?.ar ?? "",
        [nameColEn]: names?.en ?? "",
    }));
    return buildCatalogOptions(rows, config, nameDisplayLang);
}

export { formatCatalogColumnLabel, NAME_DISPLAY_LANG_OPTIONS, NAME_DISPLAY_LANG_KEY, NAME_DISPLAY_LANGUAGE_HINT };

export function formatManagementTableLabel(tableName = "") {
    return String(tableName)
        .replace(/^alahly_/i, "")
        .replace(/^db_/i, "")
        .replace(/^egy_CLUB_/i, "")
        .replace(/^egy_NT_/i, "")
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export function appendSettingsTab(tables = []) {
    const filtered = (tables || []).filter(
        (table) => table.name !== SETTINGS_TAB_ID
    );
    return [...filtered, { name: SETTINGS_TAB_ID, label: "Settings" }];
}

const remapEventId = (value, idMap) => {
    const key = String(value || "").trim();
    if (!key) return key;
    return idMap.get(key) || key;
};

const normalizeReorderItems = (items = []) => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => {
            if (item && typeof item === "object" && item.rowId != null) {
                const normalized = {
                    rowId: String(item.rowId).trim(),
                    minute: item.minute !== undefined ? String(item.minute).trim() : undefined,
                };
                if (item.typeSub !== undefined || item.TYPE_SUB !== undefined) {
                    normalized.typeSub = String(item.typeSub ?? item.TYPE_SUB ?? "").trim();
                }
                return normalized;
            }

            return {
                rowId: String(item ?? "").trim(),
                minute: undefined
            };
        })
        .filter((item) => item.rowId);
};

export async function reorderMatchEvents(matchId, orderedItems = []) {
    const normalizedMatchId = String(matchId || "").trim();
    if (!normalizedMatchId) {
        throw new Error("MATCH_ID is required to reorder events.");
    }

    const normalizedItems = normalizeReorderItems(orderedItems);
    const minuteByRowId = new Map(
        normalizedItems
            .filter((item) => item.minute !== undefined)
            .map((item) => [item.rowId, item.minute])
    );
    const typeSubByRowId = new Map(
        normalizedItems
            .filter((item) => item.typeSub !== undefined)
            .map((item) => [item.rowId, item.typeSub])
    );

    const { data: events, error: fetchError } = await rawSupabase
        .from("egy_NT_PLAYERDETAILS")
        .select("*")
        .eq("MATCH_ID", normalizedMatchId);

    if (fetchError) throw fetchError;
    if (!events?.length) return { updated: 0 };

    const eventByRowId = new Map(
        events.map((event) => [String(event.ROW_ID || ""), event]).filter(([rowId]) => rowId)
    );

    const orderedEvents = [];
    normalizedItems.forEach(({ rowId }) => {
        const event = eventByRowId.get(String(rowId));
        if (event) {
            orderedEvents.push(event);
            eventByRowId.delete(String(rowId));
        }
    });

    eventByRowId.forEach((event) => orderedEvents.push(event));
    if (orderedEvents.length === 0) {
        throw new Error("No player events found for this match.");
    }

    const oldToNew = new Map();
    const minuteByOldEventId = new Map();
    orderedEvents.forEach((event, index) => {
        const oldId = String(event.EVENT_ID || "").trim();
        const newId = `${normalizedMatchId}-${index + 1}`;
        if (oldId) oldToNew.set(oldId, newId);

        const rowId = String(event.ROW_ID || "").trim();
        if (oldId && minuteByRowId.has(rowId)) {
            minuteByOldEventId.set(oldId, minuteByRowId.get(rowId));
        }
    });

    for (const event of orderedEvents) {
        const rowId = String(event.ROW_ID || "").trim();
        if (!rowId) continue;
        const { error } = await rawSupabase
            .from("egy_NT_PLAYERDETAILS")
            .update({ EVENT_ID: `__TEMP__${rowId}` })
            .eq("ROW_ID", rowId);
        if (error) throw error;
    }

    for (let index = 0; index < orderedEvents.length; index += 1) {
        const event = orderedEvents[index];
        const rowId = String(event.ROW_ID || "").trim();
        if (!rowId) continue;

        const newEventId = `${normalizedMatchId}-${index + 1}`;
        const newParentId = remapEventId(event.PARENT_EVENT_ID, oldToNew);
        const payload = {
            EVENT_ID: newEventId,
            PARENT_EVENT_ID: newParentId || null
        };

        if (minuteByRowId.has(rowId)) {
            payload.MINUTE = minuteByRowId.get(rowId) || null;
        }
        if (typeSubByRowId.has(rowId)) {
            payload.TYPE_SUB = typeSubByRowId.get(rowId) || null;
        }

        const { error } = await rawSupabase
            .from("egy_NT_PLAYERDETAILS")
            .update(payload)
            .eq("ROW_ID", rowId);
        if (error) throw error;
    }

    const { data: gkRows, error: gkFetchError } = await rawSupabase
        .from("egy_NT_GKSDETAILS")
        .select("ROW_ID, EVENT_ID")
        .eq("MATCH_ID", normalizedMatchId);

    if (gkFetchError) throw gkFetchError;

    for (const gkRow of gkRows || []) {
        const oldEventId = String(gkRow.EVENT_ID || "").trim();
        const mappedId = oldToNew.get(oldEventId);
        if (!mappedId || !gkRow.ROW_ID) continue;

        const { error } = await rawSupabase
            .from("egy_NT_GKSDETAILS")
            .update({ EVENT_ID: mappedId })
            .eq("ROW_ID", gkRow.ROW_ID);
        if (error) throw error;
    }

    const { data: penRows, error: penFetchError } = await rawSupabase
        .from("egy_NT_HOWPENMISSED")
        .select("*")
        .eq("MATCH_ID", normalizedMatchId);

    if (penFetchError) throw penFetchError;

    for (const penRow of penRows || []) {
        if (!penRow.ROW_ID) continue;

        const updates = {};
        const oldParentId = String(penRow.PARENT_EVENT_ID || "").trim();
        const oldEventId = String(penRow.EVENT_ID || "").trim();

        if (oldParentId && oldToNew.has(oldParentId)) {
            updates.PARENT_EVENT_ID = oldToNew.get(oldParentId);
        }
        if (oldEventId && oldToNew.has(oldEventId)) {
            updates.EVENT_ID = oldToNew.get(oldEventId);
        }
        if (oldParentId && minuteByOldEventId.has(oldParentId)) {
            updates.MINUTE = minuteByOldEventId.get(oldParentId) || null;
        }

        if (Object.keys(updates).length === 0) continue;

        const { error } = await rawSupabase
            .from("egy_NT_HOWPENMISSED")
            .update(updates)
            .eq("ROW_ID", penRow.ROW_ID);
        if (error) throw error;
    }

    return { updated: orderedEvents.length };
}

// ── Editor autocomplete (TYPE / TYPE_SUB shrink-to-fit) ─────────────────────

const EDITOR_FIT_COLUMNS = new Set(["TYPE", "TYPE_SUB"]);

const FIT_FIELD_STYLE = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "clip",
    lineHeight: "34px",
};

export function isEditorWrapColumn(col) {
    return EDITOR_FIT_COLUMNS.has(col);
}

export function getEditorColumnMinWidth(col) {
    if (col === "PLAYER NAME" || col === "PLAYER NAME OUT") return 140;
    return 80;
}

let editorMeasureCtx = null;

function getEditorMeasureContext() {
    if (typeof document === "undefined") return null;
    if (!editorMeasureCtx) {
        const canvas = document.createElement("canvas");
        editorMeasureCtx = canvas.getContext("2d");
    }
    return editorMeasureCtx;
}

export function getFittedFontSize(text, maxWidth, {
    maxSize = 12,
    minSize = 7,
    fontFamily = "Outfit, sans-serif",
    fontWeight = 600,
    padding = 12,
} = {}) {
    const label = String(text || "").trim();
    if (!label || maxWidth <= 0) return maxSize;

    const ctx = getEditorMeasureContext();
    if (!ctx) return maxSize;

    const available = Math.max(0, maxWidth - padding);
    for (let size = maxSize; size >= minSize; size -= 0.5) {
        ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
        if (ctx.measureText(label).width <= available) return size;
    }

    return minSize;
}

function FitDropdownLabel({ text, width, maxSize = 14, minSize = 8 }) {
    const fontSize = useMemo(
        () => getFittedFontSize(text, width, { maxSize, minSize, fontWeight: 700, padding: 28 }),
        [text, width, maxSize, minSize]
    );

    return (
        <div
            style={{
                flex: 1,
                transition: "color 0.2s",
                whiteSpace: "nowrap",
                overflow: "hidden",
                fontSize,
                lineHeight: 1.2,
            }}
            dir="auto"
        >
            {text}
        </div>
    );
}

export function ShrinkToFitInput({ value, disabled, onChange, className = "", style = {} }) {
    const inputRef = useRef(null);
    const [fontSize, setFontSize] = useState(12);

    useLayoutEffect(() => {
        const measure = () => {
            const width = inputRef.current?.clientWidth || 0;
            setFontSize(getFittedFontSize(value, width, {
                maxSize: Number.parseFloat(style?.fontSize) || 12,
                minSize: 7,
                fontWeight: 600,
                padding: 16,
            }));
        };

        measure();

        const target = inputRef.current;
        if (!target || typeof ResizeObserver === "undefined") return undefined;

        const observer = new ResizeObserver(measure);
        observer.observe(target);
        return () => observer.disconnect();
    }, [value, style?.fontSize, style?.minWidth]);

    return (
        <input
            ref={inputRef}
            value={value}
            disabled={disabled}
            onChange={onChange}
            className={className}
            style={{ ...FIT_FIELD_STYLE, ...style, fontSize: `${fontSize}px` }}
        />
    );
}

export function AutocompleteInputDb({
    value,
    onChange,
    options = [],
    placeholder,
    style,
    disabled,
    className = "",
    shrinkToFit = false,
    accentColor = "#C8102E",
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || "");
    const [rect, setRect] = useState(null);
    const [inputFontSize, setInputFontSize] = useState(12);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { setQuery(value || ""); }, [value]);

    const filtered = query
        ? options.filter((o) => String(o).toLowerCase().includes(String(query).toLowerCase())).slice(0, 50)
        : options.slice(0, 50);

    const handleSelect = (opt) => {
        setQuery(opt);
        onChange(opt);
        setOpen(false);
    };

    useLayoutEffect(() => {
        if (!open) return;
        const updateRect = () => {
            if (wrapperRef.current) setRect(wrapperRef.current.getBoundingClientRect());
        };
        updateRect();
        window.addEventListener("scroll", updateRect, true);
        window.addEventListener("resize", updateRect);
        return () => {
            window.removeEventListener("scroll", updateRect, true);
            window.removeEventListener("resize", updateRect);
        };
    }, [open, query]);

    useLayoutEffect(() => {
        if (!shrinkToFit) {
            setInputFontSize(Number.parseFloat(style?.fontSize) || 12);
            return;
        }

        const measure = () => {
            const width = inputRef.current?.clientWidth || wrapperRef.current?.clientWidth || 0;
            setInputFontSize(getFittedFontSize(query, width, {
                maxSize: Number.parseFloat(style?.fontSize) || 12,
                minSize: 7,
                fontWeight: 600,
                padding: 16,
            }));
        };

        measure();

        const target = inputRef.current || wrapperRef.current;
        if (!target || typeof ResizeObserver === "undefined") return undefined;

        const observer = new ResizeObserver(measure);
        observer.observe(target);
        return () => observer.disconnect();
    }, [query, shrinkToFit, style?.fontSize, style?.minWidth]);

    const fieldStyle = {
        ...style,
        width: "100%",
        boxSizing: "border-box",
        ...(shrinkToFit ? { ...FIT_FIELD_STYLE, fontSize: `${inputFontSize}px` } : {}),
    };

    return (
        <div style={{ position: "relative", width: "100%" }} ref={wrapperRef} className="autocomplete-wrapper">
            <input
                ref={inputRef}
                value={query}
                disabled={disabled}
                placeholder={placeholder}
                className={className}
                onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
                onFocus={() => { setOpen(true); if (wrapperRef.current) setRect(wrapperRef.current.getBoundingClientRect()); }}
                onBlur={() => setTimeout(() => setOpen(false), 180)}
                style={fieldStyle}
                autoComplete="off"
            />
            {open && filtered.length > 0 && !disabled && rect && typeof document !== "undefined" && createPortal((() => {
                const spaceBelow = typeof window !== "undefined" ? window.innerHeight - rect.bottom : 300;
                const dropdownHeight = 280;
                const openUpwards = spaceBelow < dropdownHeight && rect.top > spaceBelow;
                const dropdownWidth = rect.width;

                return (
                    <div className="premium-scroll" style={{
                        position: "fixed",
                        left: rect.left,
                        width: dropdownWidth,
                        zIndex: 9999999,
                        ...(openUpwards ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
                        background: "rgba(255, 255, 255, 0.85)",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        borderRadius: openUpwards ? "16px 16px 0 0" : "0 0 16px 16px",
                        borderTop: openUpwards ? "1px solid rgba(0, 0, 0, 0.08)" : `3px solid ${accentColor}`,
                        borderBottom: openUpwards ? `3px solid ${accentColor}` : "1px solid rgba(0, 0, 0, 0.08)",
                        boxShadow: openUpwards ? "0 -20px 50px -10px rgba(0, 0, 0, 0.15)" : "0 20px 50px -10px rgba(0, 0, 0, 0.15)",
                        maxHeight: dropdownHeight,
                        overflowY: "auto",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        padding: "10px",
                        animation: openUpwards ? "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)" : "slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        transformOrigin: openUpwards ? "bottom center" : "top center",
                    }}>
                        <div style={{ fontSize: 10, color: "#aaa", padding: "0 8px 8px", letterSpacing: 1, fontFamily: "'Space Mono', monospace" }}>
                            SELECT {placeholder ? placeholder.toUpperCase() : "OPTION"}
                        </div>
                        {filtered.map((opt, i) => (
                            <div
                                key={i}
                                onMouseDown={() => handleSelect(opt)}
                                style={{
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 700,
                                    color: "#333",
                                    borderRadius: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `${accentColor}26`;
                                    e.currentTarget.style.color = "#000";
                                    e.currentTarget.style.paddingLeft = "20px";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "#333";
                                    e.currentTarget.style.paddingLeft = "14px";
                                }}
                                dir="auto"
                            >
                                {shrinkToFit ? (
                                    <FitDropdownLabel text={opt} width={dropdownWidth} />
                                ) : (
                                    <div style={{ flex: 1, transition: "color 0.2s" }}>{opt}</div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })(), document.body)}
        </div>
    );
}

export { AutocompleteInputDb as AutocompleteInput };

// Trigger initial cache load in the background
loadCaches();
