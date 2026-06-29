import { getPrimaryEventIdForSort, parseGkEventIds } from "../../Database";
import { formatHowPenMissedForDisplay } from "../Penalties/alahly_db_penalties_utils";

export const parseEventIdSuffix = (eventId) => {
    const id = String(eventId || "").trim();
    if (!id) return 0;
    const trailing = id.match(/(\d+)(?!.*\d)/);
    return trailing ? parseInt(trailing[1], 10) : 0;
};

export const getNextPlayerEventId = (matchId, rows = []) => {
    const normalizedMatchId = String(matchId || "").trim();
    if (!normalizedMatchId) return "";

    let maxSuffix = 0;
    rows.forEach((row) => {
        maxSuffix = Math.max(maxSuffix, parseEventIdSuffix(row?.EVENT_ID));
    });

    return `${normalizedMatchId}-${maxSuffix + 1}`;
};

export const sortRowsByEventId = (rows = []) => (
    [...rows].sort((a, b) => {
        const idA = getPrimaryEventIdForSort(a?.EVENT_ID);
        const idB = getPrimaryEventIdForSort(b?.EVENT_ID);
        if (!idA && !idB) return 0;
        if (!idA) return 1;
        if (!idB) return -1;
        const suffixDiff = parseEventIdSuffix(idA) - parseEventIdSuffix(idB);
        if (suffixDiff !== 0) return suffixDiff;
        return idA.localeCompare(idB);
    })
);

export const listIndexedRowsByEventId = (rows = []) => (
    rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            const idA = getPrimaryEventIdForSort(a.row?.EVENT_ID);
            const idB = getPrimaryEventIdForSort(b.row?.EVENT_ID);
            const suffixDiff = parseEventIdSuffix(idA) - parseEventIdSuffix(idB);
            if (suffixDiff !== 0) return suffixDiff;
            if (!idA && idB) return 1;
            if (idA && !idB) return -1;
            return idA.localeCompare(idB);
        })
);

export const buildPlayerEventIdOptions = (playerRows = []) => (
    [...new Set(playerRows.map((row) => String(row?.EVENT_ID || "").trim()).filter(Boolean))]
        .sort((a, b) => parseEventIdSuffix(a) - parseEventIdSuffix(b))
);

export const isPlayerEventRowSaveable = (row) => (
    String(row?.["PLAYER NAME"] || "").trim() !== "" ||
    String(row?.TYPE || "").trim() !== "" ||
    String(row?.MINUTE || "").trim() !== "" ||
    String(row?.TYPE_SUB || "").trim() !== ""
);

export const isGkRowSaveable = (row) => String(row?.["PLAYER NAME"] || "").trim() !== "";

export const UNNAMED_PLAYER_LABEL = "— Unnamed Player —";

export const formatEventLine = (row) => {
    const type = String(row.TYPE || "").trim();
    const parts = [
        type,
        String(row.TYPE_SUB || "").trim(),
        String(row.MINUTE || "").trim() ? `${String(row.MINUTE).trim()}'` : "",
    ].filter(Boolean);

    if (type.toUpperCase() === "PENMISSED") {
        const howMissed = formatHowPenMissedForDisplay(row["HOW MISSED"]);
        if (howMissed) parts.push(howMissed);
    }

    return parts.join(" · ") || "—";
};

export const formatGkLine = (row) => {
    const linkedGoals = parseGkEventIds(row.EVENT_ID).length;
    const parts = [
        String(row.STATU || "").trim(),
        String(row["OUT MINUTE"] || "").trim() ? `OUT ${String(row["OUT MINUTE"]).trim()}'` : "",
        String(row["GOALS CONCEDED"] || "").trim() !== "" ? `GC ${String(row["GOALS CONCEDED"]).trim()}` : "",
        linkedGoals ? `${linkedGoals} goal link${linkedGoals > 1 ? "s" : ""}` : "",
    ].filter(Boolean);
    return parts.join(" · ") || "—";
};

export function findRowIndexInList(list, row, fallbackIndex) {
    if (row?._key != null) {
        const byKey = list.findIndex((r) => r._key === row._key);
        if (byKey >= 0) return byKey;
    }
    if (row?.ROW_ID) {
        const byRowId = list.findIndex((r) => r.ROW_ID === row.ROW_ID);
        if (byRowId >= 0) return byRowId;
    }
    return fallbackIndex;
}
