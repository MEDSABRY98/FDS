export const EGY_NT_BACKFILL_AGE = "الأول";

export const EGY_NT_OFFICIAL_KINDS = new Set([
    "أسيوي",
    "أفريقي",
    "ت-عالمي",
    "شمال أفريقيا",
    "عالمي",
    "عربي",
]);

export const EGY_NT_FRIENDLY_KIND = "ودي";

export function parseNtMatchDate(dateInput) {
    const raw = String(dateInput ?? "").trim();
    if (!raw) return null;

    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return new Date(raw);
    }

    const parts = raw.split("/");
    if (parts.length === 3) {
        const a = parseInt(parts[0], 10);
        const b = parseInt(parts[1], 10);
        const c = parseInt(parts[2], 10);
        if (a > 31) return new Date(a, b - 1, c);
        return new Date(c, b - 1, a);
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatNtDate(date) {
    if (!date || Number.isNaN(date.getTime())) return "—";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function isCountableGoal(row) {
    const type = String(row?.TYPE || "").trim();
    const sub = String(row?.TYPE_SUB || "").trim();
    return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
}

const normalizeTeamLabel = (value) => String(value || "").trim().toLowerCase();

/** Goal/event scored for Egypt NT (not opponent). */
export function isEgyptScorerEvent(row, match = {}) {
    const team = String(row?.TEAM || "").trim();
    if (!team) return false;

    const opponentTeam = String(match["OPPONENT TEAM"] || "").trim();
    const egyptTeamName = String(match["Egypt TEAM"] || match["EGYPT TEAM"] || "منتخب مصر").trim();
    const normalizedTeam = normalizeTeamLabel(team);

    if (normalizedTeam === "opponent" && opponentTeam) return false;
    if (opponentTeam && normalizedTeam === normalizeTeamLabel(opponentTeam)) return false;

    const egyptIdentifiers = new Set(
        ["مصر", "Egypt", "منتخب مصر", "المنتخب المصري", egyptTeamName]
            .filter(Boolean)
            .map(normalizeTeamLabel)
    );

    return egyptIdentifiers.has(normalizedTeam);
}

export function collapseClubAnchors(anchors) {
    if (!anchors.length) return [];
    const sorted = [...anchors].sort((a, b) => a.date - b.date);
    const out = [sorted[0]];
    for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].club !== out[out.length - 1].club) {
            out.push(sorted[i]);
        }
    }
    return out;
}

export function buildClubPeriods(collapsedAnchors) {
    const periods = [];
    for (let i = 0; i < collapsedAnchors.length; i += 1) {
        const anchor = collapsedAnchors[i];
        const start =
            i === 0
                ? null
                : new Date(
                      (collapsedAnchors[i - 1].date.getTime() + anchor.date.getTime()) / 2
                  );
        const end =
            i === collapsedAnchors.length - 1
                ? null
                : new Date(
                      (anchor.date.getTime() + collapsedAnchors[i + 1].date.getTime()) / 2
                  );
        periods.push({
            club: anchor.club,
            start,
            end,
            anchorDate: anchor.dateStr,
            anchorChampion: anchor.champion,
            anchorMatchId: anchor.matchId,
        });
    }
    return periods;
}

export function suggestClubForDate(date, periods) {
    if (!date || !periods.length) return null;

    for (let i = 0; i < periods.length; i += 1) {
        const period = periods[i];
        const afterStart = !period.start || date >= period.start;
        const beforeEnd = !period.end || date < period.end;
        if (afterStart && beforeEnd) {
            return { club: period.club, periodIndex: i, period };
        }
    }
    return null;
}

export function findNearestClubHints(friDate, allAnchors = []) {
    if (!friDate || !allAnchors.length) {
        return { before: null, after: null, nearestHint: null, nearestSide: null };
    }

    const sorted = [...allAnchors].sort((a, b) => a.date - b.date);
    let before = null;
    let after = null;

    sorted.forEach((anchor) => {
        if (anchor.date.getTime() <= friDate.getTime()) {
            before = anchor;
        } else if (!after) {
            after = anchor;
        }
    });

    let nearestHint = null;
    let nearestSide = null;

    if (before && after) {
        const diffBefore = friDate.getTime() - before.date.getTime();
        const diffAfter = after.date.getTime() - friDate.getTime();
        if (diffBefore <= diffAfter) {
            nearestHint = before;
            nearestSide = "before";
        } else {
            nearestHint = after;
            nearestSide = "after";
        }
    } else if (before) {
        nearestHint = before;
        nearestSide = "before";
    } else if (after) {
        nearestHint = after;
        nearestSide = "after";
    }

    return { before, after, nearestHint, nearestSide };
}

export function buildOfAnchorsByPlayer(playerDetails, matchMap, officialMatchIds) {
    const byPlayer = new Map();

    (playerDetails || []).forEach((row) => {
        if (!isCountableGoal(row)) return;
        const matchId = String(row.MATCH_ID || "");
        if (!officialMatchIds.has(matchId)) return;

        const club = String(row.CLUB || "").trim();
        if (!club) return;

        const playerKey = String(row["PLAYER NAME"] || "").trim();
        if (!playerKey) return;

        const match = matchMap.get(matchId);
        if (!isEgyptScorerEvent(row, match)) return;

        const date = parseNtMatchDate(match?.DATE);
        if (!date) return;

        if (!byPlayer.has(playerKey)) byPlayer.set(playerKey, []);
        byPlayer.get(playerKey).push({
            date,
            dateStr: match?.DATE || formatNtDate(date),
            club,
            matchId,
            champion: String(match?.CHAMPION || "").trim(),
        });
    });

    byPlayer.forEach((anchors, playerKey) => {
        byPlayer.set(
            playerKey,
            [...anchors].sort((a, b) => a.date - b.date)
        );
    });

    return byPlayer;
}

export function buildSuggestionReason({ friDateStr, suggestedClub, hit, collapsedAnchors }) {
    const { period, periodIndex } = hit;
    const lines = [];

    lines.push(`تاريخ هدف الودي: ${friDateStr}`);
    lines.push("");
    lines.push(`الفترة النشطة (P${periodIndex + 1}): ${suggestedClub}`);

    const startLabel = period.start ? formatNtDate(period.start) : "— (قبل أول هدف رسمي)";
    const endLabel = period.end ? formatNtDate(period.end) : "— (بعد آخر هدف رسمي)";
    lines.push(`من ${startLabel} إلى ${endLabel}`);
    lines.push("");

    const before = collapsedAnchors[periodIndex];
    const after = collapsedAnchors[periodIndex + 1];

    lines.push("مراسي OF:");
    if (before) {
        lines.push(`  • ${before.dateStr} — ${before.club} (${before.champion || "—"})`);
    }
    if (after) {
        lines.push(`  • ${after.dateStr} — ${after.club} (${after.champion || "—"})`);
    }

    lines.push("");
    lines.push(`السبب: تاريخ الماتش يقع داخل فترة ${suggestedClub}.`);

    return {
        periodIndex: periodIndex + 1,
        periodStart: startLabel,
        periodEnd: endLabel,
        anchorBefore: before || null,
        anchorAfter: after || null,
        lines,
    };
}

export function buildUnresolvedReason({ friDateStr, friDate, allAnchors = [] }) {
    const { before, after, nearestHint, nearestSide } = findNearestClubHints(friDate, allAnchors);

    const lines = [
        `تاريخ هدف الودي: ${friDateStr}`,
        "",
        "لا يوجد هدف رسمي بـ CLUB يحدد النادي في هذه الفترة.",
    ];

    if (before || after) {
        lines.push("");
        lines.push("أقرب هدف رسمي:");
        if (before) {
            lines.push(`  • قبل: ${before.dateStr} — ${before.club} (${before.champion || "—"})`);
        }
        if (after) {
            lines.push(`  • بعد: ${after.dateStr} — ${after.club} (${after.champion || "—"})`);
        }
    }

    if (nearestHint) {
        const sideLabel =
            nearestSide === "before" && after
                ? "الأقرب زمنياً (هدف قبل)"
                : nearestSide === "after" && before
                  ? "الأقرب زمنياً (هدف بعد)"
                  : nearestSide === "before"
                    ? "هدف رسمي قبل فقط"
                    : "هدف رسمي بعد فقط";
        lines.push("");
        lines.push(`اقتراح للاختيار: ${nearestHint.club}`);
        lines.push(`(${sideLabel})`);
    } else if (!allAnchors.length) {
        lines.push("");
        lines.push("لا يوجد أي هدف رسمي مسجل لهذا اللاعب.");
    }

    return {
        lines,
        nearestHintClub: nearestHint?.club || "",
        nearestHint,
        nearestSide,
    };
}

export function buildClubBackfillRows({
    matches = [],
    playerDetails = [],
    ageFilter = EGY_NT_BACKFILL_AGE,
    onlyMissingClub = true,
    onlyUnresolved = false,
}) {
    const matchMap = new Map(
        (matches || []).map((m) => [String(m.MATCH_ID), m])
    );

    const ageMatches = (matches || []).filter(
        (m) => String(m.AGE || "").trim() === String(ageFilter).trim()
    );

    const officialMatchIds = new Set(
        ageMatches
            .filter((m) => EGY_NT_OFFICIAL_KINDS.has(String(m.SYSTEM_KIND || "").trim()))
            .map((m) => String(m.MATCH_ID))
    );

    const friendlyMatchIds = new Set(
        ageMatches
            .filter((m) => String(m.SYSTEM_KIND || "").trim() === EGY_NT_FRIENDLY_KIND)
            .map((m) => String(m.MATCH_ID))
    );

    const anchorsByPlayer = buildOfAnchorsByPlayer(
        playerDetails,
        matchMap,
        officialMatchIds
    );

    const periodsByPlayer = new Map();
    anchorsByPlayer.forEach((anchors, playerKey) => {
        periodsByPlayer.set(playerKey, buildClubPeriods(collapseClubAnchors(anchors)));
    });

    const rows = [];

    (playerDetails || []).forEach((row) => {
        if (!isCountableGoal(row)) return;

        const matchId = String(row.MATCH_ID || "");
        if (!friendlyMatchIds.has(matchId)) return;

        const currentClub = String(row.CLUB || "").trim();
        if (onlyMissingClub && currentClub) return;

        const playerKey = String(row["PLAYER NAME"] || "").trim();
        if (!playerKey) return;

        const match = matchMap.get(matchId);
        if (!isEgyptScorerEvent(row, match)) return;

        const date = parseNtMatchDate(match?.DATE);
        if (!date) return;

        const allAnchors = anchorsByPlayer.get(playerKey) || [];
        const collapsedAnchors = collapseClubAnchors(allAnchors);
        const periods = periodsByPlayer.get(playerKey) || [];
        const hit = suggestClubForDate(date, periods);

        let status = "unresolved";
        let suggestedClub = "";
        let nearestHintClub = "";
        let reason = buildUnresolvedReason({
            friDateStr: match?.DATE || formatNtDate(date),
            friDate: date,
            allAnchors,
        });
        nearestHintClub = reason.nearestHintClub || "";

        if (hit) {
            suggestedClub = hit.club;
            status = "ready";
            reason = buildSuggestionReason({
                friDateStr: match?.DATE || formatNtDate(date),
                suggestedClub,
                hit,
                collapsedAnchors,
            });
        }

        rows.push({
            rowId: String(row.ROW_ID || ""),
            matchId,
            eventId: String(row.EVENT_ID || ""),
            playerKey,
            date,
            dateStr: match?.DATE || formatNtDate(date),
            champion: String(match?.CHAMPION || "").trim(),
            systemKind: String(match?.SYSTEM_KIND || "").trim(),
            currentClub,
            suggestedClub,
            nearestHintClub,
            status,
            reason,
        });
    });

    rows.sort((a, b) => {
        if (a.date - b.date !== 0) return b.date - a.date;
        return String(a.playerKey).localeCompare(String(b.playerKey), "ar");
    });

    const filteredRows = onlyUnresolved
        ? rows.filter((row) => row.status === "unresolved")
        : rows;

    return {
        rows: filteredRows,
        stats: {
            total: filteredRows.length,
            ready: rows.filter((r) => r.status === "ready").length,
            unresolved: rows.filter((r) => r.status === "unresolved").length,
            officialMatchCount: officialMatchIds.size,
            friendlyMatchCount: friendlyMatchIds.size,
        },
    };
}

export function buildReadyClubBackfillUpdates(matches = [], playerDetails = []) {
    const { rows } = buildClubBackfillRows({ matches, playerDetails, onlyUnresolved: false });
    return rows
        .filter((row) => row.status === "ready" && row.suggestedClub && row.rowId)
        .map((row) => ({ rowId: row.rowId, club: row.suggestedClub }));
}
