import { isAhlyTeam } from "../PlayerDetails/alahly_player_impact_utils";
import { sortRowsByTableSortRules } from "../../Database/TableSortLogic_db.js";

export const PENALTY_MISS_DESCRIPTIONS = ["برا المرمى", "القائم", "العارضة", "؟"];
const MISS_DESCRIPTIONS = PENALTY_MISS_DESCRIPTIONS;

export const PEN_EVENT_OPTION_SEP = " · ";

function getHowPenMissedLinkIds(row) {
    return [
        String(row?.EVENT_ID || "").trim(),
        String(row?.PARENT_EVENT_ID || "").trim(),
    ].filter(Boolean);
}

export function howPenMissedRowMatchesEventId(howRow, eventId) {
    const target = String(eventId || "").trim();
    if (!target) return false;
    return getHowPenMissedLinkIds(howRow).includes(target);
}

export function createEmptyPenaltyStats() {
    return {
        attFor: 0,
        scored: 0,
        missed: 0,
        saved: 0,
        wonGoal: 0,
        wonMiss: 0,
        concGoal: 0,
        concMiss: 0,
        concSaved: 0,
        makeGoal: 0,
        makeMiss: 0,
    };
}

export function createEmptyPlayerPenaltyStats(name) {
    return {
        name,
        total: 0,
        goal: 0,
        miss: 0,
        saved: 0,
        wonGoal: 0,
        wonMiss: 0,
        makeGoal: 0,
        makeMiss: 0,
    };
}

export function getConversionPct(scored, attempts) {
    if (!attempts) return "0.0";
    return ((scored / attempts) * 100).toFixed(1);
}

export function getGkPenaltySavePct(saved, scoredFromPen) {
    return getConversionPct(saved, saved + scoredFromPen);
}

export function extractSeasonYear(str) {
    const match = String(str || "").match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 0;
}

export function parseSeasonNumber(str) {
    const n = parseInt(String(str || "").replace(/[^\d]/g, ""), 10);
    return Number.isNaN(n) ? 0 : n;
}

export function compareSeasonNameRows(a, b, direction = "desc") {
    const nameCmp = String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: "base" });
    if (nameCmp !== 0) {
        return direction === "asc" ? nameCmp : -nameCmp;
    }

    const numA = parseSeasonNumber(a.seasonNumber);
    const numB = parseSeasonNumber(b.seasonNumber);
    if (numA !== numB) {
        return direction === "asc" ? numA - numB : numB - numA;
    }

    return 0;
}

export function compareSeasonNumberRows(a, b, direction = "desc") {
    const numA = parseSeasonNumber(a.name);
    const numB = parseSeasonNumber(b.name);
    if (numA !== numB) {
        return direction === "asc" ? numA - numB : numB - numA;
    }

    const yearA = extractSeasonYear(a.seasonName);
    const yearB = extractSeasonYear(b.seasonName);
    if (yearA !== yearB) {
        return direction === "asc" ? yearA - yearB : yearB - yearA;
    }

    return direction === "asc"
        ? String(a.name || "").localeCompare(String(b.name || ""))
        : String(b.name || "").localeCompare(String(a.name || ""));
}

export function sortSeasonRows(rows, mode = "name", direction = "desc") {
    const compare = mode === "number" ? compareSeasonNumberRows : compareSeasonNameRows;
    return [...(rows || [])].sort((a, b) => compare(a, b, direction));
}

export function buildMatchContextMap(filteredMatches) {
    const map = new Map();
    (filteredMatches || []).forEach((m) => {
        const matchId = String(m.MATCH_ID || "").trim();
        if (!matchId) return;
        map.set(matchId, {
            matchId,
            champion: String(m.CHAMPION || "Unknown Competition").trim(),
            seasonName: String(m["SEASON - NAME"] || "Unknown Season").trim(),
            seasonNumber: String(m["SEASON - NUMBER"] || "Unknown").trim(),
            date: m.DATE || "",
            opponent: String(m["OPPONENT TEAM"] || "").trim(),
            gf: parseInt(m.GF, 10) || 0,
            ga: parseInt(m.GA, 10) || 0,
            wdl: String(m["W-D-L"] || "").trim(),
        });
    });
    return map;
}

export function findHowPenMissedForEvent(howPenMissed, penEvent) {
    const matchId = String(penEvent?.MATCH_ID || "").trim();
    const eventId = String(penEvent?.EVENT_ID || "").trim();
    if (!matchId || !eventId) return null;

    return (howPenMissed || []).find((d) => {
        if (String(d.MATCH_ID || "").trim() !== matchId) return false;
        return howPenMissedRowMatchesEventId(d, eventId);
    }) || null;
}

export function getPenaltyMissOutcome(detail) {
    if (!detail) return "missed";
    const desc = String(detail["HOW MISSED?"] || "").trim();
    return MISS_DESCRIPTIONS.includes(desc) ? "missed" : "saved";
}

function gkWasOnFieldForPenalty(gk, penMinute) {
    const outRaw = gk?.["OUT MINUTE"];
    if (!outRaw || String(outRaw).trim() === "") return true;
    const outMin = parseInt(outRaw, 10);
    const penMin = parseInt(penMinute, 10) || 0;
    return penMin <= (Number.isNaN(outMin) ? 90 : outMin);
}

function resolveDefendingGk({ penEvent, gkDetails, howPenMissed, detail }) {
    const mId = String(penEvent.MATCH_ID || "").trim();
    const takerTeam = String(penEvent.TEAM || "").trim();
    const penMin = penEvent.MINUTE;
    const matchGks = (gkDetails || []).filter(
        (g) => String(g.MATCH_ID || "").trim() === mId && String(g.TEAM || "").trim() !== takerTeam
    );

    const linkIds = new Set(
        [...getHowPenMissedLinkIds(detail), String(penEvent.EVENT_ID || "").trim()].filter(Boolean)
    );

    for (const linkId of linkIds) {
        const viaLink = matchGks.find((gk) => String(gk.EVENT_ID || "").trim() === linkId);
        if (viaLink && gkWasOnFieldForPenalty(viaLink, penMin)) return viaLink;
    }

    const onField = matchGks.filter((gk) => gkWasOnFieldForPenalty(gk, penMin));
    if (onField.length === 1) return onField[0];

    return null;
}

export function findDefendingGkForPenalty({ penEvent, howPenMissed, gkDetails }) {
    const detail = findHowPenMissedForEvent(howPenMissed, penEvent);
    return resolveDefendingGk({ penEvent, gkDetails, howPenMissed, detail });
}

export function findGkForPenaltyMiss({ penEvent, howPenMissed, gkDetails }) {
    const detail = findHowPenMissedForEvent(howPenMissed, penEvent);
    if (getPenaltyMissOutcome(detail) !== "saved") return null;
    return resolveDefendingGk({ penEvent, gkDetails, howPenMissed, detail });
}

export function findPenaltyTakerForHowPenRow(howPenRow, playerDetails) {
    const mId = String(howPenRow?.MATCH_ID || "").trim();
    if (!mId) return null;

    for (const linkId of getHowPenMissedLinkIds(howPenRow)) {
        const pen = (playerDetails || []).find(
            (p) =>
                String(p.MATCH_ID || "").trim() === mId &&
                String(p.EVENT_ID || "").trim() === linkId &&
                String(p.TYPE || "").trim().toUpperCase() === "PENMISSED"
        );
        if (pen) return pen;
    }

    return null;
}

export function normalizeHowPenMissedRowForEditor(row) {
    if (!row) return row;
    const { PARENT_EVENT_ID, ...rest } = row;
    return {
        ...rest,
        EVENT_ID: String(rest.EVENT_ID || PARENT_EVENT_ID || "").trim(),
    };
}

export function sanitizeHowPenMissedRowForSave(row) {
    if (!row || typeof row !== "object") return row;
    const { PARENT_EVENT_ID, ...rest } = row;
    return rest;
}

export function isHowPenMissedRowFilled(row) {
    return String(row?.EVENT_ID || "").trim() !== "";
}

export function formatPenMissedEventOption(playerEvent) {
    const eventId = String(playerEvent.EVENT_ID || "").trim();
    const player = String(playerEvent["PLAYER NAME"] || "").trim();
    const minute = String(playerEvent.MINUTE || "").trim();
    return [eventId, player || "?", minute ? `${minute}'` : "?"].join(PEN_EVENT_OPTION_SEP);
}

export function parsePenMissedEventOption(option) {
    const raw = String(option || "").trim();
    if (!raw) return "";
    const idx = raw.indexOf(PEN_EVENT_OPTION_SEP);
    return idx === -1 ? raw : raw.slice(0, idx).trim();
}

export const PEN_MISSED_EVENT_OPTION_GET_VALUE = {
    EVENT_ID: parsePenMissedEventOption,
};

export function buildPenMissedEventOptions(playerRowsList) {
    const penMissed = (playerRowsList || []).filter(
        (p) => String(p.TYPE || "").trim().toUpperCase() === "PENMISSED" && String(p.EVENT_ID || "").trim()
    );
    const sorted = sortRowsByTableSortRules(penMissed, ["EVENT_ID"], [{ column: "EVENT_ID", direction: "asc" }]);
    return sorted.map(formatPenMissedEventOption);
}

export function isEditorLinkedRowFilled(tableName, row) {
    if (tableName === "alahly_HOWPENMISSED") return isHowPenMissedRowFilled(row);
    return Boolean(row?.["PLAYER NAME"] && String(row["PLAYER NAME"]).trim() !== "");
}

export function collectGkPenaltySaves({ playerDetails, howPenMissed, gkDetails, matchIds }) {
    const allowed = matchIds instanceof Set ? matchIds : new Set(matchIds || []);
    const savesByGk = {};

    (playerDetails || []).forEach((penEvent) => {
        const mId = String(penEvent.MATCH_ID || "").trim();
        if (!allowed.has(mId)) return;
        if (String(penEvent.TYPE || "").trim().toUpperCase() !== "PENMISSED") return;

        const gk = findGkForPenaltyMiss({ penEvent, howPenMissed, gkDetails });
        if (!gk) return;

        const gkName = String(gk["PLAYER NAME"] || "").trim();
        if (!gkName || gkName.toLowerCase() === "unknown") return;

        if (!savesByGk[gkName]) savesByGk[gkName] = [];
        savesByGk[gkName].push({
            penEvent,
            detail: findHowPenMissedForEvent(howPenMissed, penEvent),
            takerName: String(penEvent["PLAYER NAME"] || "").trim(),
            matchId: mId,
            eventId: String(penEvent.EVENT_ID || "").trim(),
        });
    });

    return savesByGk;
}

export function collectGkPenaltyMisses({ playerDetails, howPenMissed, gkDetails, matchIds }) {
    const allowed = matchIds instanceof Set ? matchIds : new Set(matchIds || []);
    const missesByGk = {};

    (playerDetails || []).forEach((penEvent) => {
        const mId = String(penEvent.MATCH_ID || "").trim();
        if (!allowed.has(mId)) return;
        if (String(penEvent.TYPE || "").trim().toUpperCase() !== "PENMISSED") return;

        const detail = findHowPenMissedForEvent(howPenMissed, penEvent);
        if (getPenaltyMissOutcome(detail) !== "missed") return;

        const gk = findDefendingGkForPenalty({ penEvent, howPenMissed, gkDetails });
        if (!gk) return;

        const gkName = String(gk["PLAYER NAME"] || "").trim();
        if (!gkName || gkName.toLowerCase() === "unknown") return;

        if (!missesByGk[gkName]) missesByGk[gkName] = [];
        missesByGk[gkName].push({
            penEvent,
            detail,
            takerName: String(penEvent["PLAYER NAME"] || "").trim(),
            matchId: mId,
            eventId: String(penEvent.EVENT_ID || "").trim(),
        });
    });

    return missesByGk;
}

function isPenaltyMissSaved(event, howPenMissed) {
    const detail = findHowPenMissedForEvent(howPenMissed, event);
    return getPenaltyMissOutcome(detail) === "saved";
}

export function classifyPenaltyEvent(event, howPenMissed) {
    const type = String(event.TYPE || "").trim().toUpperCase();
    const sub = String(event.TYPE_SUB || "").trim().toUpperCase();
    const playerName = String(event["PLAYER NAME"] || "").trim();
    if (!playerName || playerName.toLowerCase() === "unknown") return null;

    const teamIsAhly = isAhlyTeam(event.TEAM);
    const matchId = String(event.MATCH_ID || "").trim();
    const minute = String(event.MINUTE || "").trim();

    let category = null;
    if (sub === "PENGOAL" || sub === "هدف جزاء" || type === "PENGOAL") {
        category = "scored";
    } else if (type === "PENMISSED") {
        category = isPenaltyMissSaved(event, howPenMissed) ? "saved" : "missed";
    } else if (type === "PENASSISTGOAL") {
        category = "wonGoal";
    } else if (type === "PENASSISTMISSED") {
        category = "wonMiss";
    } else if (type === "PENMAKEGOAL") {
        category = "makeGoal";
    } else if (type === "PENMAKEMISSED") {
        category = "makeMiss";
    }

    if (!category) return null;

    return {
        category,
        playerName,
        teamIsAhly,
        matchId,
        minute,
        team: String(event.TEAM || "").trim(),
    };
}

export function normalizePenaltyEvents(playerDetails, filteredMatches, howPenMissed) {
    const matchMap = buildMatchContextMap(filteredMatches);
    const events = [];

    (playerDetails || []).forEach((event) => {
        const matchId = String(event.MATCH_ID || "").trim();
        if (!matchMap.has(matchId)) return;

        const classified = classifyPenaltyEvent(event, howPenMissed);
        if (!classified) return;

        const ctx = matchMap.get(matchId);
        events.push({
            ...classified,
            champion: ctx.champion,
            seasonName: ctx.seasonName,
            seasonNumber: ctx.seasonNumber,
            date: ctx.date,
            opponent: ctx.opponent,
        });
    });

    return { events, matchMap };
}

function applyEventToStats(stats, ev) {
    if (ev.teamIsAhly) {
        if (["scored", "missed", "saved"].includes(ev.category)) {
            stats.attFor += 1;
            if (ev.category === "scored") stats.scored += 1;
            if (ev.category === "missed") stats.missed += 1;
            if (ev.category === "saved") stats.saved += 1;
        }
        if (ev.category === "wonGoal") stats.wonGoal += 1;
        if (ev.category === "wonMiss") stats.wonMiss += 1;
        if (ev.category === "makeGoal") stats.makeGoal += 1;
        if (ev.category === "makeMiss") stats.makeMiss += 1;
    } else {
        if (ev.category === "scored") stats.concGoal += 1;
        if (ev.category === "missed") stats.concMiss += 1;
        if (ev.category === "saved") stats.concSaved += 1;
    }
}

function applyEventToPlayerStats(stats, ev) {
    const isAttempt = ["scored", "missed", "saved"].includes(ev.category);
    if (isAttempt) stats.total += 1;
    if (ev.category === "scored") stats.goal += 1;
    if (ev.category === "missed") stats.miss += 1;
    if (ev.category === "saved") stats.saved += 1;
    if (ev.category === "wonGoal") stats.wonGoal += 1;
    if (ev.category === "wonMiss") stats.wonMiss += 1;
    if (ev.category === "makeGoal") stats.makeGoal += 1;
    if (ev.category === "makeMiss") stats.makeMiss += 1;
}

export function aggregateTeamStats(events) {
    const forAhly = createEmptyPenaltyStats();
    const againstAhly = createEmptyPenaltyStats();

    (events || []).forEach((ev) => {
        if (ev.teamIsAhly) {
            if (["scored", "missed", "saved"].includes(ev.category)) {
                forAhly.attFor += 1;
                if (ev.category === "scored") forAhly.scored += 1;
                if (ev.category === "missed") forAhly.missed += 1;
                if (ev.category === "saved") forAhly.saved += 1;
            }
            if (ev.category === "wonGoal") forAhly.wonGoal += 1;
            if (ev.category === "wonMiss") forAhly.wonMiss += 1;
            if (ev.category === "makeGoal") againstAhly.makeGoal += 1;
            if (ev.category === "makeMiss") againstAhly.makeMiss += 1;
        } else {
            if (ev.category === "scored") againstAhly.concGoal += 1;
            if (ev.category === "missed") againstAhly.concMiss += 1;
            if (ev.category === "saved") againstAhly.concSaved += 1;
        }
    });

    return {
        forAhly: {
            ...forAhly,
            conversion: getConversionPct(forAhly.scored, forAhly.attFor),
        },
        againstAhly: {
            ...againstAhly,
            saveRate: getAhlySaveRate(againstAhly),
        },
    };
}

function getAhlySaveRate(againstStats) {
    const faced = againstStats.concGoal + againstStats.concMiss + againstStats.concSaved;
    if (!faced) return "0.0";
    return ((againstStats.concSaved / faced) * 100).toFixed(1);
}

export function aggregateByChampion(events) {
    const map = new Map();

    (events || []).forEach((ev) => {
        const key = ev.champion || "Unknown Competition";
        if (!map.has(key)) map.set(key, { name: key, ...createEmptyPenaltyStats() });
        applyEventToStats(map.get(key), ev);
    });

    return Array.from(map.values())
        .map((row) => ({
            ...row,
            conversion: getConversionPct(row.scored, row.attFor),
        }))
        .sort((a, b) => b.attFor - a.attFor || b.scored - a.scored);
}

export function aggregateBySeason(events, mode = "name") {
    const map = new Map();

    (events || []).forEach((ev) => {
        const key = mode === "number" ? ev.seasonNumber : ev.seasonName;
        const label = key || (mode === "number" ? "Unknown" : "Unknown Season");
        if (!map.has(label)) {
            map.set(label, {
                name: label,
                seasonName: ev.seasonName || label,
                seasonNumber: ev.seasonNumber || "",
                ...createEmptyPenaltyStats(),
            });
        }

        const row = map.get(label);
        applyEventToStats(row, ev);

        if (mode === "name") {
            const sy = parseSeasonNumber(ev.seasonNumber);
            const current = parseSeasonNumber(row.seasonNumber);
            if (sy >= current) row.seasonNumber = ev.seasonNumber || row.seasonNumber;
            if (!row.seasonName && ev.seasonName) row.seasonName = ev.seasonName;
        } else if (!row.seasonName && ev.seasonName) {
            row.seasonName = ev.seasonName;
        }
    });

    return sortSeasonRows(
        Array.from(map.values()).map((row) => ({
            ...row,
            conversion: getConversionPct(row.scored, row.attFor),
        })),
        mode,
        "desc"
    );
}

export function getConcAttempts(stats) {
    return (stats?.concGoal || 0) + (stats?.concMiss || 0) + (stats?.concSaved || 0);
}

export function aggregateByOpponent(events) {
    const map = new Map();

    (events || []).forEach((ev) => {
        const key = String(ev.opponent || "").trim() || "Unknown Opponent";
        if (!map.has(key)) map.set(key, { name: key, ...createEmptyPenaltyStats() });
        applyEventToStats(map.get(key), ev);
    });

    return Array.from(map.values())
        .map((row) => ({
            ...row,
            conversion: getConversionPct(row.scored, row.attFor),
            concAtt: getConcAttempts(row),
        }))
        .filter((row) => row.attFor > 0 || row.concAtt > 0)
        .sort((a, b) => b.attFor - a.attFor || b.concAtt - a.concAtt || String(a.name).localeCompare(String(b.name), "ar"));
}

export function aggregateByPlayer(events, teamFilter = "all") {
    const map = new Map();

    (events || []).forEach((ev) => {
        if (teamFilter === "ahly" && !ev.teamIsAhly) return;
        if (teamFilter === "opponents" && ev.teamIsAhly) return;

        const name = ev.playerName;
        if (!map.has(name)) map.set(name, createEmptyPlayerPenaltyStats(name));
        applyEventToPlayerStats(map.get(name), ev);
    });

    return Array.from(map.values())
        .map((row) => ({
            ...row,
            conversion: getConversionPct(row.goal, row.total),
        }))
        .sort((a, b) => b.total - a.total || b.goal - a.goal);
}

export function getTopChampionshipsForChart(events, limit = 6) {
    const rows = aggregateByChampion(events);
    return rows
        .filter((r) => r.attFor > 0)
        .slice(0, limit);
}

export function sumPenaltyRows(rows) {
    const totals = createEmptyPenaltyStats();
    (rows || []).forEach((row) => {
        totals.attFor += row.attFor || 0;
        totals.scored += row.scored || 0;
        totals.missed += row.missed || 0;
        totals.saved += row.saved || 0;
        totals.wonGoal += row.wonGoal || 0;
        totals.wonMiss += row.wonMiss || 0;
        totals.concGoal += row.concGoal || 0;
        totals.concMiss += row.concMiss || 0;
        totals.concSaved += row.concSaved || 0;
        totals.makeGoal += row.makeGoal || 0;
        totals.makeMiss += row.makeMiss || 0;
    });
    return {
        ...totals,
        concAtt: getConcAttempts(totals),
        conversion: getConversionPct(totals.scored, totals.attFor),
    };
}

export function applyPenaltyEventToPlayerRow(row, event, howPenMissed) {
    const classified = classifyPenaltyEvent(event, howPenMissed);
    if (!classified) return;
    applyEventToPlayerStats(row, classified);
}
