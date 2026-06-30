import {
    buildTeamIdDateMatchId,
    buildTeamIdLookupMap,
    getEgyptNtMatchIdAgePrefix,
    resolveTeamIdFromLookup,
} from "../../app/Database/editor_match_utils.js";

export const EGYPT_NT_MATCH_TABLES = [
    "egy_NT_MATCHDETAILS",
    "egy_NT_LINEUPDETAILS",
    "egy_NT_PLAYERDETAILS",
    "egy_NT_GKSDETAILS",
    "egy_NT_PKS",
];

export const EGYPT_NT_LINKED_TABLES = [
    "egy_NT_LINEUPDETAILS",
    "egy_NT_PLAYERDETAILS",
    "egy_NT_GKSDETAILS",
    "egy_NT_PKS",
];

export {
    buildTeamIdLookupMap,
    resolveTeamIdFromLookup,
};

export function buildEgyptNtMatchIdFromTeamId({ age, egyptTeam, opponentTeamId, date } = {}) {
    const teamId = String(opponentTeamId ?? "").trim();
    const serial = buildTeamIdDateMatchId(teamId, date);
    if (!teamId || !serial) return "";

    const agePrefix = getEgyptNtMatchIdAgePrefix({ age, egyptTeam });
    return `${agePrefix}${serial}`;
}

export function suggestEgyptNtMatchId({ age, egyptTeam, opponent, date, teamLookup } = {}) {
    const teamId = resolveTeamIdFromLookup(opponent, teamLookup);
    return buildEgyptNtMatchIdFromTeamId({ age, egyptTeam, opponentTeamId: teamId, date });
}

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

export function buildEgyptNtMatchMigrationPlan(matches, teamLookup) {
    const rows = [];
    const collisions = new Map();
    const unresolved = [];

    matches.forEach((match) => {
        const currentId = String(match.MATCH_ID || "").trim();
        const opponentRaw = match["OPPONENT TEAM"];
        const teamId = resolveTeamIdFromLookup(opponentRaw, teamLookup);
        const proposedId = buildEgyptNtMatchIdFromTeamId({
            age: match.AGE,
            egyptTeam: match["Egypt TEAM"],
            opponentTeamId: teamId,
            date: match.DATE,
        });

        const entry = {
            rowId: match.ROW_ID,
            currentMatchId: currentId,
            opponentRaw,
            age: match.AGE,
            egyptTeam: match["Egypt TEAM"],
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

export function summarizeOrphans(childRows, masterIds, matchIdField = "MATCH_ID") {
    const orphans = [];
    childRows.forEach((row) => {
        const currentId = String(row[matchIdField] || "").trim();
        if (currentId && !masterIds.has(currentId)) {
            orphans.push(row);
        }
    });
    return orphans;
}
