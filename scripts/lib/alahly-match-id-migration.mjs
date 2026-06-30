import {
    buildTeamIdDateMatchId,
    buildTeamIdLookupMap,
    resolveTeamIdFromLookup,
    suggestAlAhlyMatchId,
} from "../../app/Database/editor_match_utils.js";

export const ALAHLY_MATCH_TABLES = [
    "alahly_MATCHDETAILS",
    "alahly_LINEUPDETAILS",
    "alahly_PLAYERDETAILS",
    "alahly_GKSDETAILS",
    "alahly_PKS",
    "alahly_MEDIATRACKER",
];

export const ALAHLY_LINKED_TABLES = [
    "alahly_LINEUPDETAILS",
    "alahly_PLAYERDETAILS",
    "alahly_GKSDETAILS",
    "alahly_PKS",
    "alahly_MEDIATRACKER",
];

export {
    buildTeamIdDateMatchId,
    buildTeamIdLookupMap,
    resolveTeamIdFromLookup,
    suggestAlAhlyMatchId,
};

export async function fetchAllRows(supabase, table, select = "*") {
    const rows = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase.from(table).select(select).range(from, from + 999);
        if (error) throw error;
        if (!data?.length) break;
        rows.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }
    return rows;
}

export function remapEventIdPrefix(eventId, oldMatchId, newMatchId) {
    const id = String(eventId || "").trim();
    const oldId = String(oldMatchId || "").trim();
    const newId = String(newMatchId || "").trim();
    if (!id || !oldId || !newId || oldId === newId) return id;
    if (id === oldId) return newId;
    if (id.startsWith(`${oldId}-`)) return `${newId}${id.slice(oldId.length)}`;
    return id;
}

export function remapGkEventIdField(value, oldMatchId, newMatchId) {
    const raw = String(value || "").trim();
    if (!raw) return raw;
    return raw
        .split(/[,;|]+/)
        .map((token) => remapEventIdPrefix(token.trim(), oldMatchId, newMatchId))
        .filter(Boolean)
        .join(",");
}

export function buildMatchMigrationPlan(matches, teamLookup) {
    const rows = [];
    const collisions = new Map();
    const unresolved = [];

    matches.forEach((match) => {
        const currentId = String(match.MATCH_ID || "").trim();
        const opponentRaw = match["OPPONENT TEAM"];
        const teamId = resolveTeamIdFromLookup(opponentRaw, teamLookup);
        const proposedId = suggestAlAhlyMatchId({
            opponentTeam: opponentRaw,
            date: match.DATE,
            teamId,
            teamLookup,
        });

        const entry = {
            rowId: match.ROW_ID,
            currentMatchId: currentId,
            opponentRaw,
            teamId: teamId || null,
            date: match.DATE,
            proposedMatchId: proposedId,
            needsChange: Boolean(proposedId && currentId !== proposedId),
            unresolved: !teamId || !proposedId,
        };

        rows.push(entry);

        if (!teamId || !proposedId) {
            unresolved.push(entry);
            return;
        }

        if (!collisions.has(proposedId)) collisions.set(proposedId, []);
        collisions.get(proposedId).push(entry);
    });

    const duplicateGroups = [...collisions.entries()]
        .filter(([, group]) => group.length > 1)
        .map(([proposedMatchId, group]) => ({ proposedMatchId, group }));

    return {
        rows,
        unresolved,
        duplicateGroups,
        lookupMap: new Map(
            rows
                .filter((r) => r.currentMatchId && r.proposedMatchId)
                .map((r) => [r.currentMatchId, r.proposedMatchId])
        ),
        stats: {
            total: rows.length,
            unchanged: rows.filter((r) => r.proposedMatchId && r.currentMatchId === r.proposedMatchId).length,
            toUpdate: rows.filter((r) => r.needsChange).length,
            unresolved: unresolved.length,
            collisions: duplicateGroups.length,
        },
    };
}

export function summarizeOrphans(childRows, lookupMap, matchIdField = "MATCH_ID") {
    const orphans = [];
    childRows.forEach((row) => {
        const currentId = String(row[matchIdField] || "").trim();
        if (!currentId) return;
        if (!lookupMap.has(currentId)) {
            orphans.push({ table: row.__table, rowId: row.ROW_ID, matchId: currentId });
        }
    });
    return orphans;
}
