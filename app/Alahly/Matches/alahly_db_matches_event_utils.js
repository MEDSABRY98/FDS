import { getPenaltyMissOutcome } from "../Penalties/alahly_db_penalties_utils";

function isGoalEvent(row) {
    const type = String(row?.TYPE || "").trim().toUpperCase();
    const sub = String(row?.TYPE_SUB || "").trim().toUpperCase();
    return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
}

function isAssistEvent(row) {
    const type = String(row?.TYPE || "").trim().toUpperCase();
    return type === "ASSIST" || type === "اسيست" || type === "صنع";
}

export const MATCH_EVENT_FILTER_OPTIONS = [
    { value: "all", label: "All Matches" },
    { value: "g_brace", label: "Goal Brace (2)" },
    { value: "g_hattrick", label: "Goal Hat-Trick (3)" },
    { value: "g_super", label: "Goal Super (4+)" },
    { value: "a_brace", label: "Assist Brace (2)" },
    { value: "a_hattrick", label: "Assist Hat-Trick (3)" },
    { value: "a_super", label: "Assist Super (4+)" },
    { value: "pen_goal", label: "Penalty Goal" },
    { value: "pen_missed", label: "Penalty Missed" },
    { value: "pen_saved", label: "Penalty Saved" },
];

export function buildMatchEventIndex(playerDetails = []) {
    const byMatchPlayer = new Map();
    const index = new Map();

    const ensureMatch = (matchId) => {
        if (!index.has(matchId)) {
            index.set(matchId, {
                g_brace: false,
                g_hattrick: false,
                g_super: false,
                a_brace: false,
                a_hattrick: false,
                a_super: false,
                pen_goal: false,
                pen_missed: false,
                pen_saved: false,
            });
        }
        return index.get(matchId);
    };

    (playerDetails || []).forEach((row) => {
        const matchId = String(row?.MATCH_ID || "").trim();
        if (!matchId) return;

        const match = ensureMatch(matchId);

        if (isGoalEvent(row)) {
            const name = String(row["PLAYER NAME"] || "").trim();
            if (!name || name.toLowerCase() === "unknown") return;
            const key = `${matchId}|${name}`;
            if (!byMatchPlayer.has(key)) byMatchPlayer.set(key, { g: 0, a: 0 });
            byMatchPlayer.get(key).g++;
        }

        if (isAssistEvent(row)) {
            const name = String(row["PLAYER NAME"] || "").trim();
            if (!name || name.toLowerCase() === "unknown") return;
            const key = `${matchId}|${name}`;
            if (!byMatchPlayer.has(key)) byMatchPlayer.set(key, { g: 0, a: 0 });
            byMatchPlayer.get(key).a++;
        }

        const type = String(row?.TYPE || "").trim().toUpperCase();
        const sub = String(row?.TYPE_SUB || "").trim().toUpperCase();
        if (sub === "PENGOAL" || sub === "هدف جزاء" || type === "PENGOAL") {
            match.pen_goal = true;
        }

        if (type === "PENMISSED") {
            const outcome = getPenaltyMissOutcome(row);
            if (outcome === "saved") match.pen_saved = true;
            else match.pen_missed = true;
        }
    });

    byMatchPlayer.forEach((counts, key) => {
        const matchId = key.split("|")[0];
        const match = ensureMatch(matchId);
        if (counts.g === 2) match.g_brace = true;
        if (counts.g === 3) match.g_hattrick = true;
        if (counts.g >= 4) match.g_super = true;
        if (counts.a === 2) match.a_brace = true;
        if (counts.a === 3) match.a_hattrick = true;
        if (counts.a >= 4) match.a_super = true;
    });

    return index;
}

export function matchPassesEventFilter(matchId, eventIndex, filterKey) {
    const key = String(filterKey || "all").trim();
    if (!key || key === "all") return true;
    const mid = String(matchId || "").trim();
    const flags = eventIndex.get(mid);
    if (!flags) return false;
    return Boolean(flags[key]);
}
