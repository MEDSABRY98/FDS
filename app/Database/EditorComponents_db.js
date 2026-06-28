"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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

function calcBenchLineupTotalMinutes(outMinuteValue, matchMinute) {
    const matchMin = parseInt(String(matchMinute ?? ""), 10) || 90;
    const outRaw = String(outMinuteValue ?? "").trim();
    if (!outRaw) return "";

    const entryMin = parseLineupMinute(outRaw);
    if (Number.isNaN(entryMin) || entryMin <= 0) return "";

    if (isInjuryTimeAtMatchBase(outRaw, matchMin)) {
        return 1;
    }

    return Math.max(0, matchMin - entryMin);
}

function calcStarterLineupTotalMinutes(subOutMinuteValue, matchMinute) {
    const matchMin = parseInt(String(matchMinute ?? ""), 10) || 90;
    const outRaw = String(subOutMinuteValue ?? "").trim();
    if (!outRaw) return matchMin;

    const actualOutMin = parseLineupMinute(outRaw);
    return !Number.isNaN(actualOutMin) ? actualOutMin : matchMin;
}

export function applyLineupLogic(prev, action) {
    const next = typeof action === "function" ? action(prev) : action;
    const changedRow = next.find((r, i) => r["MATCH MINUTE"] !== prev[i]?.["MATCH MINUTE"]);
    const matchMinuteRef = changedRow ? changedRow["MATCH MINUTE"] : (next[0]?.["MATCH MINUTE"] || "90");

    return next.map((row) => {
        let total = "";

        if (row.STATU === "اساسي") {
            const playerName = String(row["PLAYER NAME"] || "").trim();
            const subOutRow = playerName
                ? next.find((r) => String(r["PLAYER NAME OUT"] || "").trim() === playerName)
                : null;

            if (subOutRow) {
                total = calcStarterLineupTotalMinutes(subOutRow["OUT MINUTE"], matchMinuteRef);
            } else {
                total = parseInt(matchMinuteRef, 10) || 90;
            }
        } else if (row.STATU === "احتياطي") {
            const benchTotal = calcBenchLineupTotalMinutes(row["OUT MINUTE"], matchMinuteRef);
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

export { AutocompleteInputDb as AutocompleteInput };
