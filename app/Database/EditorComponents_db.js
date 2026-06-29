"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { filterAutocompleteOptions, getAutocompleteDisplayLabel, normalizeAutocompleteOption } from "./CatalogBilingual_db";
// Editor autocomplete (TYPE / TYPE_SUB shrink-to-fit)

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
    if (col === "CLUB") return 120;
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
    optionLimit = 50,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || "");
    const [rect, setRect] = useState(null);
    const [inputFontSize, setInputFontSize] = useState(12);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { setQuery(value || ""); }, [value]);

    const normalizedOptions = useMemo(
        () => (options || []).map(normalizeAutocompleteOption).filter(Boolean),
        [options]
    );

    const filtered = useMemo(
        () => filterAutocompleteOptions(normalizedOptions, query, optionLimit),
        [normalizedOptions, query, optionLimit]
    );

    const handleSelect = (opt) => {
        const label = getAutocompleteDisplayLabel(
            typeof opt === "object" ? opt : normalizeAutocompleteOption(opt),
            query
        );
        setQuery(label);
        onChange(label);
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
                        {filtered.map((opt, i) => {
                            const displayLabel = getAutocompleteDisplayLabel(opt, query);
                            return (
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
                                    <FitDropdownLabel text={displayLabel} width={dropdownWidth} />
                                ) : (
                                    <div style={{ flex: 1, transition: "color 0.2s" }}>{displayLabel}</div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                );
            })(), document.body)}
        </div>
    );
}

/** Match minute for lineup totals; stoppage after + is not counted (90+3 → 90). */
export function parseLineupMinute(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return NaN;
    const injuryMatch = raw.match(/^(\d+)\+(\d+)$/);
    if (injuryMatch) {
        return parseInt(injuryMatch[1], 10);
    }
    const num = parseInt(raw, 10);
    return Number.isNaN(num) ? NaN : num;
}

function isInjuryTimeMinute(value) {
    return /^(\d+)\+(\d+)$/.test(String(value ?? "").trim());
}

function isInjuryTimeAtMatchBase(outMinuteValue, matchMinute) {
    if (!isInjuryTimeMinute(outMinuteValue)) return false;
    const base = parseLineupMinute(outMinuteValue);
    const matchNum = parseInt(String(matchMinute ?? ""), 10);
    return !Number.isNaN(matchNum) && !Number.isNaN(base) && base === matchNum;
}

function calcBenchLineupTotalMinutes(entryMinuteValue, exitMinuteValue, matchMinute) {
    const matchMin = parseInt(String(matchMinute ?? ""), 10) || 90;
    const entryRaw = String(entryMinuteValue ?? "").trim();
    if (!entryRaw) return "";

    const entryMin = parseLineupMinute(entryRaw);
    if (Number.isNaN(entryMin) || entryMin <= 0) return "";

    const exitRaw = String(exitMinuteValue ?? "").trim();
    if (!exitRaw) {
        if (isInjuryTimeAtMatchBase(entryRaw, matchMin)) {
            return 1;
        }
        return Math.max(0, matchMin - entryMin);
    }

    const exitMin = parseLineupMinute(exitRaw);
    if (Number.isNaN(exitMin)) return "";

    return Math.max(0, exitMin - entryMin);
}

function calcStarterLineupTotalMinutes(subOutMinuteValue, matchMinute) {
    const matchMin = parseInt(String(matchMinute ?? ""), 10) || 90;
    const outRaw = String(subOutMinuteValue ?? "").trim();
    if (!outRaw) return matchMin;

    const actualOutMin = parseLineupMinute(outRaw);
    return !Number.isNaN(actualOutMin) ? actualOutMin : matchMin;
}

export function resolveMatchLengthMinute(matchRow) {
    const et = String(matchRow?.ET ?? "").trim().toLowerCase();
    if (et && et !== "0" && et !== "no" && et !== "false" && et !== "-" && et !== "—") {
        return 120;
    }
    return 90;
}

function findGkBenchExitMinute(gkRows, team, entryMinute) {
    const normalizedTeam = String(team || "").trim();
    const exits = [];

    gkRows.forEach((row) => {
        if (String(row.TEAM || "").trim() !== normalizedTeam) return;
        const minute = parseLineupMinute(row["OUT MINUTE"]);
        if (Number.isNaN(minute) || minute <= entryMinute) return;
        exits.push(minute);
    });

    return exits.length ? Math.min(...exits) : null;
}

export function calcGkAppearanceMinutes(gkRow, matchGkRows = [], matchMinute = "90") {
    const stored = String(gkRow?.["TOTAL MINUTE"] || "").trim();
    if (stored) {
        const parsed = parseInt(stored, 10);
        if (!Number.isNaN(parsed)) return parsed;
    }

    const statu = String(gkRow?.STATU || "").trim();
    const outRaw = String(gkRow?.["OUT MINUTE"] || "").trim();

    if (statu === "اساسي") {
        return calcStarterLineupTotalMinutes(outRaw, matchMinute);
    }

    if (statu === "احتياطي") {
        const entry = parseLineupMinute(outRaw);
        if (Number.isNaN(entry) || entry <= 0) return 0;

        const team = String(gkRow?.TEAM || "").trim();
        const exitMinute = findGkBenchExitMinute(matchGkRows, team, entry);
        const benchTotal = calcBenchLineupTotalMinutes(
            outRaw,
            exitMinute != null ? String(exitMinute) : "",
            matchMinute
        );
        if (benchTotal !== "") return benchTotal;

        const matchMin = parseInt(String(matchMinute || ""), 10) || 90;
        return Math.max(0, matchMin - entry);
    }

    const matchMin = parseInt(String(matchMinute || ""), 10) || 90;
    if (!outRaw) return matchMin;

    const parsedOut = parseLineupMinute(outRaw);
    return Number.isNaN(parsedOut) ? matchMin : parsedOut;
}

function findLineupSubOutRow(rows, playerName, team) {
    const normalizedName = String(playerName || "").trim();
    const normalizedTeam = String(team || "").trim();
    if (!normalizedName) return null;

    return rows.find(
        (r) =>
            String(r["PLAYER NAME OUT"] || "").trim() === normalizedName &&
            String(r.TEAM || "").trim() === normalizedTeam
    ) || null;
}

export function getLineupSubOutOptions(rows = []) {
    const subbedOut = new Set(
        rows
            .map((r) => String(r["PLAYER NAME OUT"] || "").trim())
            .filter(Boolean)
    );

    const options = [];
    rows.forEach((row) => {
        const name = String(row["PLAYER NAME"] || "").trim();
        if (!name || subbedOut.has(name)) return;

        const statu = String(row.STATU || "").trim();
        if (statu === "اساسي") {
            options.push(name);
        } else if (statu === "احتياطي" && String(row["OUT MINUTE"] || "").trim()) {
            options.push(name);
        }
    });

    return [...new Set(options)].sort((a, b) => a.localeCompare(b, "ar"));
}

export function applyLineupLogic(prev, action) {
    const next = typeof action === "function" ? action(prev) : action;
    const changedRow = next.find((r, i) => r["MATCH MINUTE"] !== prev[i]?.["MATCH MINUTE"]);
    const matchMinuteRef = changedRow ? changedRow["MATCH MINUTE"] : (next[0]?.["MATCH MINUTE"] || "90");

    return next.map((row) => {
        let total = "";
        const team = String(row.TEAM || "").trim();
        const playerName = String(row["PLAYER NAME"] || "").trim();

        if (row.STATU === "اساسي") {
            const subOutRow = playerName
                ? findLineupSubOutRow(next, playerName, team)
                : null;

            if (subOutRow) {
                total = calcStarterLineupTotalMinutes(subOutRow["OUT MINUTE"], matchMinuteRef);
            } else {
                total = parseInt(matchMinuteRef, 10) || 90;
            }
        } else if (row.STATU === "احتياطي") {
            const subOutRow = playerName
                ? findLineupSubOutRow(next, playerName, team)
                : null;
            const benchTotal = calcBenchLineupTotalMinutes(
                row["OUT MINUTE"],
                subOutRow?.["OUT MINUTE"],
                matchMinuteRef
            );
            if (benchTotal !== "") total = benchTotal;
        } else {
            total = row["TOTAL MINUTE"] || "";
        }

        return {
            ...row,
            "MATCH MINUTE": matchMinuteRef,
            "TOTAL MINUTE": total.toString(),
        };
    });
}

export const GK_EVENT_ID_SEP = " & ";

const parseGkEventIdSuffix = (eventId) => {
    const id = String(eventId || "").trim();
    if (!id) return 0;
    const trailing = id.match(/(\d+)(?!.*\d)/);
    return trailing ? parseInt(trailing[1], 10) : 0;
};

export function normalizeGkEventToken(token) {
    const raw = String(token || "").trim();
    if (!raw) return "";
    const match = raw.match(/(\d+-\d+)\s*$/);
    return match ? match[1] : raw;
}

export function parseGkEventIds(value) {
    const raw = String(value || "").trim();
    if (!raw) return [];
    return raw.split(GK_EVENT_ID_SEP).map((part) => part.trim()).filter(Boolean);
}

export function serializeGkEventIds(ids = []) {
    const seen = new Set();
    const ordered = [];
    ids.forEach((id) => {
        const token = String(id || "").trim();
        if (!token || seen.has(token)) return;
        seen.add(token);
        ordered.push(token);
    });
    return ordered.join(GK_EVENT_ID_SEP);
}

export function formatGkEventIdToken(eventRow) {
    const eventId = String(eventRow?.EVENT_ID || "").trim();
    if (!eventId) return "";
    const team = String(eventRow?.TEAM || "").trim();
    return team ? `${team}${eventId}` : eventId;
}

export function gkRowLinksEventId(gkRow, eventId) {
    const target = normalizeGkEventToken(eventId);
    if (!target) return false;
    return parseGkEventIds(gkRow?.EVENT_ID).some(
        (token) => normalizeGkEventToken(token) === target
    );
}

export function remapGkEventIdsField(value, oldToNew) {
    const tokens = parseGkEventIds(value);
    if (!tokens.length) return String(value || "").trim();

    const remapped = tokens.map((token) => {
        const normalized = normalizeGkEventToken(token);
        const mapped = oldToNew.get(normalized) || oldToNew.get(token);
        if (!mapped) return token;
        const prefix = token.slice(0, Math.max(0, token.length - normalized.length));
        return `${prefix}${mapped}`;
    });

    return serializeGkEventIds(remapped);
}

export function getPrimaryEventIdForSort(value) {
    const tokens = parseGkEventIds(value);
    if (!tokens.length) return "";
    if (tokens.length === 1) return normalizeGkEventToken(tokens[0]);
    return [...tokens]
        .map(normalizeGkEventToken)
        .sort((a, b) => parseGkEventIdSuffix(a) - parseGkEventIdSuffix(b))[0];
}

export function isGoalPlayerEventRow(row) {
    const type = String(row?.TYPE || "").trim();
    const sub = String(row?.TYPE_SUB || "").trim();
    return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
}

function gkEventTokenSelected(selectedTokens, token) {
    const normalized = normalizeGkEventToken(token);
    return selectedTokens.some((selected) => normalizeGkEventToken(selected) === normalized);
}

function removeGkEventToken(selectedTokens, token) {
    const normalized = normalizeGkEventToken(token);
    return selectedTokens.filter((selected) => normalizeGkEventToken(selected) !== normalized);
}

export function GkGoalEventIdMultiSelect({
    playerEventRows = [],
    value,
    onChange,
    accentColor = "#c8102e",
    className = "",
    style,
}) {
    const selectedTokens = useMemo(() => parseGkEventIds(value), [value]);

    const goalEvents = useMemo(() => (
        [...(playerEventRows || [])]
            .filter(isGoalPlayerEventRow)
            .sort(
                (a, b) => parseGkEventIdSuffix(a?.EVENT_ID) - parseGkEventIdSuffix(b?.EVENT_ID)
            )
    ), [playerEventRows]);

    const toggleToken = (token) => {
        const next = gkEventTokenSelected(selectedTokens, token)
            ? removeGkEventToken(selectedTokens, token)
            : [...selectedTokens, token];
        onChange(serializeGkEventIds(next));
    };

    return (
        <div
            className={`gk-event-id-multi${className ? ` ${className}` : ""}`}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 180,
                overflowY: "auto",
                padding: "8px 10px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#fff",
                ...style,
            }}
        >
            {goalEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>No goal events in this match</div>
            ) : (
                goalEvents.map((row) => {
                    const token = formatGkEventIdToken(row);
                    const minute = String(row.MINUTE || "").trim();
                    const checked = gkEventTokenSelected(selectedTokens, token);
                    return (
                        <label
                            key={token}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                cursor: "pointer",
                                userSelect: "none",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleToken(token)}
                                style={{ accentColor }}
                            />
                            <span>
                                {token}
                                {minute ? ` · ${minute}'` : ""}
                            </span>
                        </label>
                    );
                })
            )}
        </div>
    );
}

export { AutocompleteInputDb as AutocompleteInput };
