"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import "./egypt_nt_db_match_details.css";
import NoData_db from "../../lib/NoData_db";
import { reorderMatchEvents, AutocompleteInput } from "../../Database";

const parseTimelineMinute = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw || raw === "?" || raw === "؟" || raw === "-") return null;
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(num) ? num : null;
};

const parseTimelineEventOrder = (event) => {
    const isPenMissDetail = event?.eventType === 'penMiss';
    const id = String(
        isPenMissDetail
            ? (event?.PARENT_EVENT_ID || event?.EVENT_ID || "")
            : (event?.EVENT_ID || event?.PARENT_EVENT_ID || "")
    ).trim();
    if (!id) return Number.MAX_SAFE_INTEGER;

    const trailingNumber = id.match(/(\d+)(?!.*\d)/);
    const base = trailingNumber ? parseInt(trailingNumber[1], 10) : Number.MAX_SAFE_INTEGER - 1;

    // HOW MISSED detail follows the linked PENMISSED player event at the same minute
    return isPenMissDetail ? base + 0.5 : base;
};

const compareTimelineEvents = (a, b) => {
    const orderA = parseTimelineEventOrder(a);
    const orderB = parseTimelineEventOrder(b);
    if (orderA !== orderB) return orderA - orderB;

    const minuteA = parseTimelineMinute(a.MINUTE);
    const minuteB = parseTimelineMinute(b.MINUTE);
    if (minuteA !== null && minuteB !== null && minuteA !== minuteB) {
        return minuteA - minuteB;
    }
    if (minuteA !== null && minuteB === null) return -1;
    if (minuteA === null && minuteB !== null) return 1;

    const aIsPenMissDetail = a?.eventType === 'penMiss';
    const bIsPenMissDetail = b?.eventType === 'penMiss';
    if (aIsPenMissDetail !== bIsPenMissDetail) {
        return aIsPenMissDetail ? 1 : -1;
    }

    return String(a.ROW_ID ?? "").localeCompare(String(b.ROW_ID ?? ""), undefined, { numeric: true });
};

export default function EgyptNTMatchDetails({
    matchId,
    matches,
    playerDetails,
    lineupDetails,
    gkDetails,
    howPenMissed,
    onBack,
    onRefresh
}) {

    const [activeTab, setActiveTab] = useState('info');
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [reorderRows, setReorderRows] = useState([]);
    const [orderDirty, setOrderDirty] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [orderError, setOrderError] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    // Core data extraction
    const matchInfo = useMemo(() => (matches || []).find(m => String(m.MATCH_ID) === String(matchId)), [matchId, matches]);

    const { egyptTeamName, opponentTeamName, isEgyptSide } = useMemo(() => {
        const egyptTeamName = String(matchInfo?.["Egypt TEAM"] || matchInfo?.["EGYPT TEAM"] || "منتخب مصر").trim();
        const opponentTeamName = String(matchInfo?.["OPPONENT TEAM"] || "").trim();
        const norm = (value) => String(value || "").trim().toLowerCase();

        const egyptIdentifiers = new Set([
            "egypt",
            "مصر",
            "منتخب مصر",
            "المنتخب المصري",
            norm(egyptTeamName)
        ].filter(Boolean));

        const resolveTeamSide = (teamValue) => {
            const name = String(teamValue || "").trim();
            if (!name) return null;

            const normalizedName = norm(name);
            if (opponentTeamName && normalizedName === norm(opponentTeamName)) return false;
            if (normalizedName === "opponent" && opponentTeamName) return false;
            if (egyptIdentifiers.has(normalizedName)) return true;
            return null;
        };

        const playerSideByName = new Map();
        (lineupDetails || []).forEach((lineupRow) => {
            if (String(lineupRow.MATCH_ID) !== String(matchId)) return;

            const playerName = String(lineupRow["PLAYER NAME"] || "").trim();
            if (!playerName) return;

            const side = resolveTeamSide(lineupRow.TEAM);
            if (side !== null) playerSideByName.set(playerName, side);
        });

        const isEgyptSide = (record) => {
            const byTeam = resolveTeamSide(record?.TEAM);
            if (byTeam !== null) return byTeam;

            const playerName = String(record?.["PLAYER NAME"] || "").trim();
            if (playerName && playerSideByName.has(playerName)) {
                return playerSideByName.get(playerName);
            }

            return false;
        };

        return { egyptTeamName, opponentTeamName, isEgyptSide };
    }, [matchInfo, lineupDetails, matchId]);

    const squads = useMemo(() => {
        const egyptLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && isEgyptSide(l));
        const oppLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && !isEgyptSide(l));

        return {
            egypt: {
                starters: egyptLineup.filter(p => p.STATU === 'اساسي'),
                subs: egyptLineup.filter(p => p.STATU !== 'اساسي')
            },
            opp: {
                starters: oppLineup.filter(p => p.STATU === 'اساسي'),
                subs: oppLineup.filter(p => p.STATU !== 'اساسي')
            }
        };
    }, [matchId, lineupDetails, isEgyptSide]);

    const events = useMemo(() => {
        const allEvents = [
            ...(playerDetails || []).filter(p => String(p.MATCH_ID) === String(matchId)).map(e => ({ ...e, eventType: 'player' })),
            ...(howPenMissed || []).filter(h => String(h.MATCH_ID) === String(matchId)).map(e => ({ ...e, eventType: 'penMiss', TYPE: 'PEN MISS' }))
        ].sort(compareTimelineEvents);

        return {
            egypt: allEvents.filter(e => isEgyptSide(e)),
            opp: allEvents.filter(e => !isEgyptSide(e)),
            chronological: allEvents
        };
    }, [matchId, playerDetails, howPenMissed, isEgyptSide]);

    const matchPlayerEvents = useMemo(() => (
        (playerDetails || [])
            .filter((event) => String(event.MATCH_ID) === String(matchId))
            .sort(compareTimelineEvents)
    ), [playerDetails, matchId]);

    const startReorderMode = useCallback(() => {
        setReorderRows(matchPlayerEvents.map((event) => ({ ...event })));
        setOrderDirty(false);
        setOrderError("");
        setIsReorderMode(true);
    }, [matchPlayerEvents]);

    const cancelReorderMode = useCallback(() => {
        setIsReorderMode(false);
        setReorderRows([]);
        setOrderDirty(false);
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
        setOrderDirty(true);
        setOrderError("");
    }, []);

    const updateEventMinute = useCallback((index, minute) => {
        setReorderRows((prev) => {
            const nextRows = [...prev];
            nextRows[index] = { ...nextRows[index], MINUTE: minute };
            return nextRows;
        });
        setOrderDirty(true);
        setOrderError("");
    }, []);

    const handleMinuteBlur = useCallback(() => {
        setReorderRows((prev) => {
            return [...prev].sort((a, b) => {
                const minA = parseTimelineMinute(a.MINUTE);
                const minB = parseTimelineMinute(b.MINUTE);
                if (minA !== null && minB !== null && minA !== minB) {
                    return minA - minB;
                }
                if (minA !== null && minB === null) return -1;
                if (minA === null && minB !== null) return 1;
                return 0;
            });
        });
    }, []);

    const updateEventTypeSub = useCallback((index, typeSub) => {
        setReorderRows((prev) => {
            const nextRows = [...prev];
            nextRows[index] = { ...nextRows[index], TYPE_SUB: typeSub };
            return nextRows;
        });
        setOrderDirty(true);
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
            setOrderDirty(false);
        } catch (error) {
            setOrderError(error?.message || "Failed to save event order.");
        } finally {
            setSavingOrder(false);
        }
    }, [reorderRows, matchId, onRefresh]);

    useEffect(() => {
        setIsReorderMode(false);
        setReorderRows([]);
        setOrderDirty(false);
        setOrderError("");
    }, [matchId]);

    const getSubInfo = (subPlayer) => {
        const inMin = subPlayer["IN MINUTE"] || subPlayer["MINUTE IN"] || subPlayer["MINUTE"] || subPlayer["OUT MINUTE"];
        const playerOut = subPlayer["PLAYER NAME OUT"] || subPlayer["NAME OUT"];

        if (inMin) {
            return {
                minute: inMin,
                playerOut: playerOut || null
            };
        }
        return null;
    };

    const gks = useMemo(() => {
        const matchGks = (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId));
        const sortGks = (list) => [...list].sort((a, b) => {
            const aStarter = String(a.STATU || "").trim() === "اساسي" ? 0 : 1;
            const bStarter = String(b.STATU || "").trim() === "اساسي" ? 0 : 1;
            return aStarter - bStarter;
        });

        return {
            egypt: sortGks(matchGks.filter(g => isEgyptSide(g))),
            opp: sortGks(matchGks.filter(g => !isEgyptSide(g)))
        };
    }, [matchId, gkDetails, isEgyptSide]);

    if (!matchInfo) return <div className="error-state">Match record not located.</div>;

    const matchNote = matchInfo.NOTE || "";

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getEventIcon = (type) => {
        const t = String(type || "").trim().toUpperCase();
        if (t === "PENASSISTGOAL") return "⭐";
        if (t === "PENASSISTMISSED") return "⚠️";
        if (t === "PENMAKEGOAL") return "🎯";
        if (t === "PENMAKEMISSED") return "❌";

        const tLower = t.toLowerCase();
        if (tLower.includes('هدف') || tLower.includes('goal')) return '⚽';
        if (tLower.includes('اسيست') || tLower.includes('assist') || tLower.includes('صنع')) return 'A';

        switch (tLower) {
            case 'انذار':
            case 'yellow': return '🟨';
            case 'طرد':
            case 'red': return '🟥';
            case 'تغيير':
            case 'sub': return '🔄';
            case 'pen miss': return '❌';
            default: return '⚽';
        }
    };

    const getEventMeta = (event) => {
        const type = String(event.TYPE || "").trim().toUpperCase();
        const sub = String(event.TYPE_SUB || "").trim().toUpperCase();

        if (type === "PENASSISTGOAL") return { kind: "assist", label: "Penalty Assist" };
        if (type === "PENMAKEGOAL") return { kind: "assist", label: "Penalty Won" };
        if (type === "ASSIST" || type === "اسيست" || type === "صنع" || type.includes("ASSIST")) {
            return { kind: "assist", label: "Assist" };
        }

        if (event.eventType === "penMiss" || type === "PEN MISS") {
            return { kind: "miss", label: "Penalty Missed" };
        }

        if (type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء") {
            const isPen = sub === "PENGOAL" || sub === "هدف جزاء";
            return { kind: "goal", label: isPen ? "Penalty Goal" : "Goal" };
        }

        if (type === "انذار" || type === "YELLOW") return { kind: "card", label: "Yellow Card" };
        if (type === "طرد" || type === "RED") return { kind: "card", label: "Red Card" };
        if (type === "تغيير" || type === "SUB") return { kind: "sub", label: "Substitution" };

        return {
            kind: "other",
            label: event.TYPE || "Event",
            subLabel: event.TYPE_SUB || null
        };
    };

    return (
        <div className="match-center-page fade-in">
            {/* Premium Header/Navigation */}
            <div className="match-nav">
                <button className="btn-back" onClick={onBack}>
                    <span className="icon">←</span>
                    <span className="text">All Matches</span>
                </button>
                <div className="match-id-badge">{matchId}</div>
            </div>

            {/* Cinematic Scoreboard Section */}
            <section className="hero-scoreboard">
                <div className="hero-overlay"></div>
                <div className="scoreboard-content">
                    <div className="team-display egypt">
                        <div className="team-logo-container">
                            <div className="logo-placeholder egypt-logo">🇪🇬</div>
                        </div>
                        <div className="team-meta">
                            <h1 className="team-name">{egyptTeamName}</h1>
                            <span className="manager-tag">COACH: {matchInfo["EGYPT MANAGER"]}</span>
                        </div>
                    </div>

                    <div className="score-hub">
                        <div className="score-main">
                            <span className="score-digit">{matchInfo.GF}</span>
                            <span className="score-divider">-</span>
                            <span className="score-digit">{matchInfo.GA}</span>
                        </div>
                        {matchInfo.PEN && <div className="pen-result">{matchInfo.PEN}</div>}
                    </div>

                    <div className="team-display opponent">
                        <div className="team-meta tr">
                            <h1 className="team-name" dir="auto">{opponentTeamName}</h1>
                            <span className="manager-tag">COACH: {matchInfo["OPPONENT MANAGER"]}</span>
                        </div>
                        <div className="team-logo-container">
                            <div className="logo-placeholder opp-logo">🛡️</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Tabs Section */}
            <div className="match-details-container">
                <div className="tabs-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        MATCH INFO
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'lineup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lineup')}
                    >
                        SQUAD & LINEUP
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        MATCH TIMELINE
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'subs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subs')}
                    >
                        SUBS TIMELINE
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'motm' ? 'active' : ''}`}
                        onClick={() => setActiveTab('motm')}
                    >
                        MAN OF THE MATCH
                    </button>
                </div>

                {activeTab === 'info' && (
                    <div className="match-info-tab-content fade-in">
                        <div className="info-grid">
                            {/* Card 1: Competition & Date */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">🏆</span>
                                    <h3>Competition Details</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">DATE</span>
                                        <span className="info-value">{formatDate(matchInfo.DATE)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">CHAMPION</span>
                                        <span className="info-value">{matchInfo.CHAMPION || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">SEASON</span>
                                        <span className="info-value">{matchInfo.SEASON || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">ROUND</span>
                                        <span className="info-value">{matchInfo.ROUND || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Match Venue & Logistics */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">📍</span>
                                    <h3>Venue & Logistics</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">PLACE (STADIUM)</span>
                                        <span className="info-value">{matchInfo.PLACE || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">H-A-N (VENUE STATUS)</span>
                                        <span className="info-value">
                                            {matchInfo["H-A-N"] === "H" ? "Home" :
                                             matchInfo["H-A-N"] === "A" ? "Away" :
                                             matchInfo["H-A-N"] === "N" ? "Neutral" : matchInfo["H-A-N"] || "—"}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">AGE GROUP</span>
                                        <span className="info-value">{matchInfo.AGE || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Match Officials & Managers */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">👔</span>
                                    <h3>Officials & Staff</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">EGYPT MANAGER</span>
                                        <span className="info-value">{matchInfo["EGYPT MANAGER"] || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">OPPONENT MANAGER</span>
                                        <span className="info-value">{matchInfo["OPPONENT MANAGER"] || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">REFEREE</span>
                                        <span className="info-value">{matchInfo.REFREE || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Competition System */}
                            <div className="info-card">
                                <div className="info-card-header">
                                    <span className="info-card-icon">⚙️</span>
                                    <h3>System Details</h3>
                                </div>
                                <div className="info-card-body">
                                    <div className="info-row">
                                        <span className="info-label">CHAMPION SYSTEM</span>
                                        <span className="info-value">{matchInfo.CHAMPION_SYSTEM || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">EXTRA TIME (ET)</span>
                                        <span className="info-value">{matchInfo.ET ? "Yes" : "No"}</span>
                                    </div>
                                    {matchInfo.PEN && (
                                        <div className="info-row">
                                            <span className="info-label">PENALTY SHOOTOUT</span>
                                            <span className="info-value" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{matchInfo.PEN}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {matchInfo.NOTE && (
                            <div className="info-note-section">
                                <h3>📝 Match Notes</h3>
                                <p>{matchInfo.NOTE}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'lineup' && (
                    <>
                        {/* â”€â”€ Main Players Grid â”€â”€ */}
                        <div className="lineup-view grid-layout">
                            {/* Egypt Column */}
                            <div className="team-column egypt-theme">
                                <div className="column-header">
                                    <span className="team-label">{egyptTeamName}</span>
                                    <span className="starter-count">{squads.egypt.starters.length} STARTERS</span>
                                </div>
                                <div className="players-list">
                                    <h3 className="list-title">STARTERS</h3>
                                    {squads.egypt.starters.length === 0 ? (
                                        Array(11).fill(0).map((_, i) => (
                                            <div key={i} className="player-card placeholder-card">
                                                <span className="player-num">{i + 1}</span>
                                                <span className="player-name">Match Player</span>
                                            </div>
                                        ))
                                    ) : (
                                        squads.egypt.starters.map((p, i) => {
                                            const wasSubbed = p["OUT MINUTE"] || p["MINUTE OUT"];
                                            return (
                                                <div key={i} className="player-card">
                                                    <span className="player-num">{i + 1}</span>
                                                    <span className="player-name">
                                                        {p["PLAYER NAME"]} {wasSubbed && <span className="out-arrow-indicator">▼</span>}
                                                        {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>({p.CLUB})</span>}
                                                    </span>
                                                    <div className="player-badges">
                                                        {events.egypt.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"]).map((e, idx) => (
                                                            <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                {getEventIcon(e.TYPE)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    {squads.egypt.subs.length > 0 && (
                                        <>
                                            <h3 className="list-title subs-title">SUBSTITUTES</h3>
                                            {squads.egypt.subs.map((p, i) => {
                                                const subInfo = getSubInfo(p);
                                                return (
                                                    <div key={i} className="player-card sub-card">
                                                        <span className="player-num sub-num">S</span>
                                                        <div className="sub-main">
                                                            <span className="player-name">
                                                                {p["PLAYER NAME"]}
                                                                {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>({p.CLUB})</span>}
                                                            </span>
                                                            {subInfo && (
                                                                <div className="sub-details-row">
                                                                    <span className="sub-in-label">🔄</span>
                                                                    {subInfo.playerOut && (
                                                                        <span className="sub-out-label">↙ {subInfo.playerOut}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="player-badges">
                                                            {events.egypt.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"] && String(e.TYPE).trim() !== 'تغيير').map((e, idx) => (
                                                                <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                    {getEventIcon(e.TYPE)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Opponent Column */}
                            <div className="team-column opp-theme">
                                <div className="column-header">
                                    <span className="team-label">{opponentTeamName}</span>
                                    <span className="starter-count">{squads.opp.starters.length} STARTERS</span>
                                </div>
                                <div className="players-list">
                                    <h3 className="list-title">STARTERS</h3>
                                    {squads.opp.starters.length === 0 ? (
                                        Array(11).fill(0).map((_, i) => (
                                            <div key={i} className="player-card placeholder-card rev">
                                                <span className="player-num">{i + 1}</span>
                                                <span className="player-name tr">Match Player</span>
                                            </div>
                                        ))
                                    ) : (
                                        squads.opp.starters.map((p, i) => {
                                            const wasSubbed = p["OUT MINUTE"] || p["MINUTE OUT"];
                                            return (
                                                <div key={i} className="player-card rev">
                                                    <div className="player-badges">
                                                        {events.opp.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"]).map((e, idx) => (
                                                            <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                {getEventIcon(e.TYPE)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="player-name tr">
                                                        {wasSubbed && <span className="out-arrow-indicator">▼</span>} {p["PLAYER NAME"]}
                                                        {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginRight: '6px' }}>({p.CLUB})</span>}
                                                    </span>
                                                    <span className="player-num">{i + 1}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                    {squads.opp.subs.length > 0 && (
                                        <>
                                            <h3 className="list-title subs-title">SUBSTITUTES</h3>
                                            {squads.opp.subs.map((p, i) => {
                                                const subInfo = getSubInfo(p);
                                                return (
                                                    <div key={i} className="player-card sub-card rev">
                                                        <span className="player-num sub-num">S</span>
                                                        <div className="sub-main tr">
                                                            <span className="player-name">
                                                                {p["PLAYER NAME"]}
                                                                {p.CLUB && <span style={{ fontSize: '11px', color: '#999', marginRight: '6px' }}>({p.CLUB})</span>}
                                                            </span>
                                                            {subInfo && (
                                                                <div className="sub-details-row rev">
                                                                    <span className="sub-in-label">🔄</span>
                                                                    {subInfo.playerOut && (
                                                                        <span className="sub-out-label">↙ {subInfo.playerOut}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="player-badges">
                                                            {events.opp.filter(e => e["PLAYER NAME"] === p["PLAYER NAME"] && String(e.TYPE).trim() !== 'تغيير').map((e, idx) => (
                                                                <span key={idx} title={e.TYPE} className="event-mini-icon">
                                                                    {getEventIcon(e.TYPE)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* â”€â”€ Goalkeeper Row â”€â”€ */}
                        <div className="gk-sync-row grid-layout">
                            <div className="team-column egypt-theme">
                                <div className="gk-section">
                                    <h3 className="list-title">GOALKEEPER</h3>
                                    {gks.egypt.length === 0 ? (
                                        <div className="gk-card highlighting placeholder-card op-mask">
                                            <span className="gk-icon">🧤</span>
                                            <div className="gk-info">
                                                <span className="gk-name">Main Keeper</span>
                                                <span className="gk-stat">N/A</span>
                                            </div>
                                        </div>
                                    ) : (
                                        gks.egypt.map((g, i) => (
                                            <div key={i} className="gk-card highlighting">
                                                <span className="gk-icon">🧤</span>
                                                <div className="gk-info">
                                                    <span className="gk-name">
                                                        {g["PLAYER NAME"]}
                                                        {g.CLUB && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginLeft: '6px' }}>({g.CLUB})</span>}
                                                    </span>
                                                    <span className="gk-stat">{g["GOALS CONCEDED"]} GA</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="team-column opp-theme">
                                <div className="gk-section">
                                    <h3 className="list-title">GOALKEEPER</h3>
                                    {gks.opp.length === 0 ? (
                                        <div className="gk-card highlighting placeholder-card rev op-mask">
                                            <div className="gk-info tr">
                                                <span className="gk-name">Main Keeper</span>
                                                <span className="gk-stat">N/A</span>
                                            </div>
                                            <span className="gk-icon">🧤</span>
                                        </div>
                                    ) : (
                                        gks.opp.map((g, i) => (
                                            <div key={i} className="gk-card highlighting rev">
                                                <div className="gk-info tr">
                                                    <span className="gk-name">
                                                        {g["PLAYER NAME"]}
                                                        {g.CLUB && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginRight: '6px' }}>({g.CLUB})</span>}
                                                    </span>
                                                    <span className="gk-stat">{g["GOALS CONCEDED"]} GA</span>
                                                </div>
                                                <span className="gk-icon">🧤</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'events' && (
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
                                                            ) : !e["HOW MISSED?"] ? (
                                                                <span className={`entry-type entry-type--${eventMeta.kind}`}>
                                                                    {eventMeta.label}
                                                                    {eventMeta.subLabel && (
                                                                        <span className="entry-type-sub"> / {eventMeta.subLabel}</span>
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="entry-note">HOW MISSED: {e["HOW MISSED?"]}</span>
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
                )}
                {activeTab === 'subs' && (
                    <div className="timeline-view subs-timeline">
                        <div className="timeline-container">
                            {(() => {
                                const subEvents = [
                                    ...squads.egypt.subs.map(s => ({ ...s, isEgypt: true })),
                                    ...squads.opp.subs.map(s => ({ ...s, isEgypt: false }))
                                ].map(s => {
                                    const rawMin = s["IN MINUTE"] || s["MINUTE IN"] || s["OUT MINUTE"] || s["MINUTE OUT"] || "0";
                                    const minute = parseInt(String(rawMin).replace(/[^0-9]/g, '')) || 0;
                                    return {
                                        ...s,
                                        minute
                                    };
                                })
                                    .filter(s => s.minute > 0)
                                    .sort((a, b) => a.minute - b.minute);

                                if (subEvents.length === 0) {
                                    return <NoData_db message="No substitutions recorded for this game." />;
                                }

                                return (
                                    <div className="timeline-track">
                                        {subEvents.map((s, i) => (
                                            <div key={i} className={`timeline-entry ${s.isEgypt ? 'left' : 'right'}`}>
                                                <div className="entry-content premium-sub-entry">
                                                    <div className="sub-premium-card">
                                                        <div className="sub-s-icon">S</div>
                                                        <div className="sub-card-main">
                                                            <div className="sub-player-in-name">
                                                                {s["PLAYER NAME"]}
                                                                {s.CLUB && <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>({s.CLUB})</span>}
                                                            </div>
                                                            <div className="sub-meta-row">
                                                                <div className="sub-time-pill">
                                                                    <div className="sub-blue-box">
                                                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M17 1L21 5L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <path d="M7 23L3 19L7 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="sub-min-val">{s.minute}'</span>
                                                                </div>
                                                                <div className="sub-player-out-info">
                                                                    <span className="red-diag-arrow">↙</span>
                                                                    <span className="out-name-text">{s["PLAYER NAME OUT"] || s["NAME OUT"] || "???"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="timeline-dot sub-dot-premium"></div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {activeTab === 'motm' && (
                    <div className="motm-tab-content fade-in">
                        {matchInfo.MOTM ? (
                            <div className="motm-container">
                                <div className="motm-trophy">🏆</div>
                                <h2 className="motm-title">MAN OF THE MATCH</h2>
                                <div className="motm-player-name">{matchInfo.MOTM}</div>
                                {(() => {
                                    const playerEvents = events.chronological.filter(
                                        e => String(e["PLAYER NAME"] || "").trim().toLowerCase() === String(matchInfo.MOTM).trim().toLowerCase()
                                    );
                                    const goals = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t.includes("هدف") || t.includes("goal") || t === "penmakegoal";
                                    }).length;
                                    const assists = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t.includes("اسيست") || t.includes("assist") || t.includes("صنع") || t === "penassistgoal";
                                    }).length;
                                    const yellows = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t === "yellow" || t === "انذار";
                                    }).length;
                                    const reds = playerEvents.filter(e => {
                                        const t = String(e.TYPE || "").trim().toLowerCase();
                                        return t === "red" || t === "طرد";
                                    }).length;

                                    if (goals > 0 || assists > 0 || yellows > 0 || reds > 0) {
                                        return (
                                            <div className="motm-performance-summary">
                                                <h3>Match Performance</h3>
                                                <div className="motm-stats-row">
                                                    {goals > 0 && <span className="motm-stat-item">⚽ {goals} Goal(s)</span>}
                                                    {assists > 0 && <span className="motm-stat-item">🅰️ {assists} Assist(s)</span>}
                                                    {yellows > 0 && <span className="motm-stat-item">🟨 {yellows} Yellow</span>}
                                                    {reds > 0 && <span className="motm-stat-item">🟥 {reds} Red</span>}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        ) : (
                            <NoData_db message="No Man of the Match awarded for this game." />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
