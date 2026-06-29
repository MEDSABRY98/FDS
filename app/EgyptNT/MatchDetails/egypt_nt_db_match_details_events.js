"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import NoData_db from "../../lib/NoData_db";
import { reorderMatchEvents, AutocompleteInput } from "../../Database";
import { formatHowPenMissedForDisplay } from "../../Alahly/Penalties/alahly_db_penalties_utils";
import {
    compareTimelineEvents,
    parseTimelineMinute,
    getEventIcon,
    getEventMeta,
} from "./egypt_nt_db_match_details_utils";

export default function EventsTab({ matchId, playerDetails, events, isEgyptSide, onRefresh }) {
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [reorderRows, setReorderRows] = useState([]);
    const [savingOrder, setSavingOrder] = useState(false);
    const [orderError, setOrderError] = useState("");

    const matchPlayerEvents = useMemo(() => (
        (playerDetails || [])
            .filter((event) => String(event.MATCH_ID) === String(matchId))
            .sort(compareTimelineEvents)
    ), [playerDetails, matchId]);

    const startReorderMode = useCallback(() => {
        setReorderRows(matchPlayerEvents.map((event) => ({ ...event })));
        setOrderError("");
        setIsReorderMode(true);
    }, [matchPlayerEvents]);

    const cancelReorderMode = useCallback(() => {
        setIsReorderMode(false);
        setReorderRows([]);
        setOrderError("");
    }, []);

    const moveEventRow = useCallback((index, direction) => {
        setReorderRows((prev) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= prev.length) return prev;
            const nextRows = [...prev];
            [nextRows[index], nextRows[nextIndex]] = [nextRows[nextIndex], nextRows[index]];
            return nextRows;
        });
        setOrderError("");
    }, []);

    const updateEventMinute = useCallback((index, minute) => {
        setReorderRows((prev) => {
            const nextRows = [...prev];
            nextRows[index] = { ...nextRows[index], MINUTE: minute };
            return nextRows;
        });
        setOrderError("");
    }, []);

    const handleMinuteBlur = useCallback(() => {
        setReorderRows((prev) => (
            [...prev].sort((a, b) => {
                const minA = parseTimelineMinute(a.MINUTE);
                const minB = parseTimelineMinute(b.MINUTE);
                if (minA !== null && minB !== null && minA !== minB) {
                    return minA - minB;
                }
                if (minA !== null && minB === null) return -1;
                if (minA === null && minB !== null) return 1;
                return 0;
            })
        ));
    }, []);

    const updateEventTypeSub = useCallback((index, typeSub) => {
        setReorderRows((prev) => {
            const nextRows = [...prev];
            nextRows[index] = { ...nextRows[index], TYPE_SUB: typeSub };
            return nextRows;
        });
        setOrderError("");
    }, []);

    const eventSubTypeOptions = useMemo(() => {
        const values = new Set();
        (playerDetails || []).forEach((row) => {
            const value = String(row?.TYPE_SUB || "").trim();
            if (value) values.add(value);
        });
        return [...values].sort((a, b) => a.localeCompare(b));
    }, [playerDetails]);

    const saveEventOrder = useCallback(async () => {
        if (!reorderRows.length) return;

        const orderedItems = reorderRows
            .map((event) => ({
                rowId: String(event.ROW_ID || "").trim(),
                minute: String(event.MINUTE ?? "").trim(),
                typeSub: String(event.TYPE_SUB ?? "").trim(),
            }))
            .filter((item) => item.rowId);

        if (orderedItems.length !== reorderRows.length) {
            setOrderError("Some events are missing ROW_ID and cannot be reordered.");
            return;
        }

        setSavingOrder(true);
        setOrderError("");
        try {
            await reorderMatchEvents(matchId, orderedItems);
            if (onRefresh) await onRefresh();
            setIsReorderMode(false);
            setReorderRows([]);
        } catch (error) {
            setOrderError(error?.message || "Failed to save event order.");
        } finally {
            setSavingOrder(false);
        }
    }, [reorderRows, matchId, onRefresh]);

    useEffect(() => {
        setIsReorderMode(false);
        setReorderRows([]);
        setOrderError("");
    }, [matchId]);

    return (
        <div className="timeline-view">
            {orderError && (
                <div className="timeline-order-error">{orderError}</div>
            )}

            {isReorderMode ? (
                <>
                    <div className="timeline-axis-controls timeline-axis-controls--edit">
                        <span className="timeline-axis-edit-title">Edit timeline</span>
                        <div className="timeline-axis-actions">
                            <button
                                type="button"
                                className="timeline-axis-icon-btn timeline-axis-icon-btn--save"
                                onClick={saveEventOrder}
                                disabled={savingOrder}
                                title="Save order"
                            >
                                {savingOrder ? (
                                    <span className="timeline-axis-spinner" aria-hidden="true" />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                            <button
                                type="button"
                                className="timeline-axis-icon-btn timeline-axis-icon-btn--cancel"
                                onClick={cancelReorderMode}
                                disabled={savingOrder}
                                title="Cancel"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="event-reorder-panel">
                        {reorderRows.length === 0 ? (
                            <NoData_db message="No player events to reorder for this game." />
                        ) : (
                            <div className="event-reorder-list">
                                {reorderRows.map((event, index) => {
                                    const eventMeta = getEventMeta({ ...event, eventType: "player" });
                                    return (
                                        <div key={String(event.ROW_ID || index)} className="event-reorder-row">
                                            <span className="event-order-badge">{index + 1}</span>
                                            <div className="event-reorder-edit-panel">
                                                <div className="event-reorder-field">
                                                    <span className="event-reorder-field-label">Minute</span>
                                                    <div className="event-reorder-minute-wrap">
                                                        <input
                                                            type="text"
                                                            className="event-reorder-minute-input"
                                                            value={event.MINUTE ?? ""}
                                                            onChange={(e) => updateEventMinute(index, e.target.value)}
                                                            onBlur={handleMinuteBlur}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                            disabled={savingOrder}
                                                            placeholder="—"
                                                            aria-label={`Minute for event ${index + 1}`}
                                                        />
                                                        <span className="event-reorder-minute-suffix">'</span>
                                                    </div>
                                                </div>
                                                <div className="event-reorder-field event-reorder-field--wide">
                                                    <span className="event-reorder-field-label">Sub type</span>
                                                    <AutocompleteInput
                                                        value={String(event.TYPE_SUB ?? "")}
                                                        onChange={(value) => updateEventTypeSub(index, value)}
                                                        options={eventSubTypeOptions}
                                                        placeholder="Optional"
                                                        disabled={savingOrder}
                                                        accentColor="#111"
                                                        className="event-reorder-type-sub-input"
                                                    />
                                                </div>
                                            </div>
                                            <div className="event-reorder-main">
                                                <div className="event-reorder-player-row">
                                                    <span className="event-reorder-player">{event["PLAYER NAME"] || "—"}</span>
                                                    {event.CLUB && (
                                                        <>
                                                            <span className="event-reorder-dot" aria-hidden="true" />
                                                            <span className="event-reorder-club">{event.CLUB}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="event-reorder-meta">
                                                    <span className={`entry-type entry-type--${eventMeta.kind}`}>
                                                        {eventMeta.label}
                                                        {eventMeta.subLabel && (
                                                            <span className="entry-type-sub"> / {eventMeta.subLabel}</span>
                                                        )}
                                                    </span>
                                                    <span className="event-reorder-id">{event.EVENT_ID}</span>
                                                </div>
                                            </div>
                                            <div className="event-reorder-controls">
                                                <button
                                                    type="button"
                                                    className="event-move-btn"
                                                    onClick={() => moveEventRow(index, -1)}
                                                    disabled={index === 0 || savingOrder}
                                                    title="Move up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    type="button"
                                                    className="event-move-btn"
                                                    onClick={() => moveEventRow(index, 1)}
                                                    disabled={index === reorderRows.length - 1 || savingOrder}
                                                    title="Move down"
                                                >
                                                    ↓
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="timeline-container">
                    {events.chronological.length === 0 ? (
                        <NoData_db message="No specific match events recorded for this game." />
                    ) : (
                        <>
                            <div className="timeline-axis-controls">
                                <button
                                    type="button"
                                    className="timeline-axis-icon-btn"
                                    onClick={startReorderMode}
                                    disabled={matchPlayerEvents.length === 0}
                                    title="Edit event order"
                                    aria-label="Edit event order"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="timeline-track">
                                {events.chronological.map((e, i) => {
                                    const isEgypt = isEgyptSide(e);
                                    const typeUpper = String(e.TYPE || "").trim().toUpperCase();
                                    const isSpecialPen = ['PENASSISTGOAL', 'PENASSISTMISSED', 'PENMAKEGOAL', 'PENMAKEMISSED'].includes(typeUpper);
                                    const eventMeta = getEventMeta(e);
                                    const playerIndex = matchPlayerEvents.findIndex((event) => String(event.ROW_ID) === String(e.ROW_ID));
                                    const orderNumber = playerIndex >= 0 ? playerIndex + 1 : null;
                                    return (
                                        <div key={i} className={`timeline-entry ${isEgypt ? 'left' : 'right'}`}>
                                            <div className={`entry-content ${isSpecialPen ? 'special-pen-card' : ''}`}>
                                                <div className="entry-time">
                                                    {orderNumber ? <span className="entry-order-badge">#{orderNumber}</span> : null}
                                                    {e.MINUTE}'
                                                </div>
                                                <div className="entry-details">
                                                    {!isSpecialPen && <span className="entry-icon">{getEventIcon(e.TYPE)}</span>}
                                                    <div className="entry-text">
                                                        <span className="entry-player">{e["PLAYER NAME"]}</span>
                                                        {e.CLUB && <span className="entry-club">{e.CLUB}</span>}
                                                        {isSpecialPen ? (
                                                            <span className={`pen-type-badge ${
                                                                typeUpper === 'PENASSISTGOAL' ? 'pen-assist-goal' :
                                                                typeUpper === 'PENASSISTMISSED' ? 'pen-assist-missed' :
                                                                typeUpper === 'PENMAKEGOAL' ? 'pen-make-goal' :
                                                                'pen-make-missed'
                                                            }`}>
                                                                {typeUpper}
                                                            </span>
                                                        ) : !e["HOW MISSED"] ? (
                                                            <span className={`entry-type entry-type--${eventMeta.kind}`}>
                                                                {eventMeta.label}
                                                                {eventMeta.subLabel && (
                                                                    <span className="entry-type-sub"> / {eventMeta.subLabel}</span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="entry-note">HOW MISSED: {formatHowPenMissedForDisplay(e["HOW MISSED"])}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="timeline-dot"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
