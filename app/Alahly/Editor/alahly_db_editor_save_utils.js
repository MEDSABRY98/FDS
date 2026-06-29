import { supabase } from "../../Database";
import { isEditorLinkedRowFilled, preparePlayerEventHowMissedForSave } from "../Penalties/alahly_db_penalties_utils";
import { getNextPlayerEventId } from "./alahly_db_editor_event_utils";

const MATCH_INTEGER_FIELDS = new Set(["GF", "GA", "ET", "SEASON - NUMBER"]);

export function prepareMatchDetailsPayload(matchData = {}) {
    const { "W-D-L": _wdl, "CLEAN SHEET": _cs, ...payload } = matchData;
    Object.keys(payload).forEach((key) => {
        if (payload[key] === "") payload[key] = null;
    });
    MATCH_INTEGER_FIELDS.forEach((field) => {
        if (payload[field] == null || payload[field] === "") return;
        const parsed = parseInt(String(payload[field]).trim(), 10);
        payload[field] = Number.isNaN(parsed) ? null : parsed;
    });
    return payload;
}

export async function cleanLinkedRowForSave(tableName, row, matchId, isNew, allRows = []) {
    const { _isNew, _isDirty, _key, ...clean } = { ...row, MATCH_ID: matchId };
    if (isNew || !clean.ROW_ID || clean.ROW_ID === "" || clean.ROW_ID === null) {
        delete clean.ROW_ID;
    }
    if (tableName === "alahly_PLAYERDETAILS" && isNew && !String(clean.EVENT_ID || "").trim()) {
        clean.EVENT_ID = getNextPlayerEventId(matchId, allRows);
    }
    if (tableName === "alahly_PLAYERDETAILS") {
        return preparePlayerEventHowMissedForSave(clean);
    }
    return clean;
}

export async function persistLinkedTableRows(tableName, rows, matchId) {
    const pending = rows.filter((row) => row._isNew || row._isDirty);
    const filled = pending.filter((row) => isEditorLinkedRowFilled(tableName, row));
    if (filled.length === 0) return rows;

    const toInsert = filled.filter((row) => row._isNew);
    const toUpdate = filled.filter((row) => !row._isNew);
    const savedResults = [];

    if (toInsert.length > 0) {
        let eventIdContext = tableName === "alahly_PLAYERDETAILS"
            ? rows.filter((r) => String(r?.EVENT_ID || "").trim())
            : [];
        const insertPayload = [];
        for (const row of toInsert) {
            const cleaned = await cleanLinkedRowForSave(tableName, row, matchId, true, eventIdContext);
            insertPayload.push(cleaned);
            if (tableName === "alahly_PLAYERDETAILS" && cleaned.EVENT_ID) {
                eventIdContext = [...eventIdContext, { EVENT_ID: cleaned.EVENT_ID }];
            }
        }
        const { data, error } = await supabase.from(tableName).insert(insertPayload).select();
        if (error) throw new Error(`${tableName}: ${error.message}`);
        if (data) savedResults.push(...data);
    }

    if (toUpdate.length > 0) {
        const updatePayload = await Promise.all(toUpdate.map((row) => cleanLinkedRowForSave(tableName, row, matchId, false, rows)));
        const { data, error } = await supabase.from(tableName).upsert(updatePayload).select();
        if (error) throw new Error(`${tableName}: ${error.message}`);
        if (data) savedResults.push(...data);
    }

    if (savedResults.length === 0) return rows;

    return rows.map((existingRow) => {
        const saved = savedResults.find((candidate) =>
            (existingRow.ROW_ID && candidate.ROW_ID === existingRow.ROW_ID) ||
            (existingRow._isNew && !existingRow.ROW_ID &&
                candidate["PLAYER NAME"] === existingRow["PLAYER NAME"] &&
                candidate.TEAM === existingRow.TEAM)
        );
        return saved ? { ...existingRow, ...saved, _isNew: false, _isDirty: false } : existingRow;
    });
}

export async function insertStagedLinkedTableRows(tableName, rows, matchId) {
    const filled = rows.filter((row) => isEditorLinkedRowFilled(tableName, row));
    if (filled.length === 0) return;

    let eventIdContext = tableName === "alahly_PLAYERDETAILS"
        ? rows.filter((r) => String(r?.EVENT_ID || "").trim())
        : [];
    const clean = [];
    for (const row of filled) {
        const { _isNew, _isDirty, _key, ...rest } = row;
        const payload = { ...rest, MATCH_ID: matchId };
        if (payload.ROW_ID === "" || payload.ROW_ID === null) delete payload.ROW_ID;
        if (tableName === "alahly_PLAYERDETAILS" && !String(payload.EVENT_ID || "").trim()) {
            payload.EVENT_ID = getNextPlayerEventId(matchId, eventIdContext);
        }
        if (tableName === "alahly_PLAYERDETAILS") {
            clean.push(await preparePlayerEventHowMissedForSave(payload));
        } else {
            clean.push(payload);
        }
        if (tableName === "alahly_PLAYERDETAILS" && payload.EVENT_ID) {
            eventIdContext = [...eventIdContext, { EVENT_ID: payload.EVENT_ID }];
        }
    }

    const { error } = await supabase.from(tableName).insert(clean);
    if (error) throw new Error(`${tableName}: ${error.message}`);
}
