"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, X, Save } from "lucide-react";
import Login_db from "../../lib/Login_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput, fetchCatalogDisplayNames, supabase } from "../../Database";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import "./egypt_nt_club_backfill.css";

const PAGE_SIZE = 50;

const EGY_NT_BACKFILL_AGE = "الأول";


function parseNtMatchDate(dateInput) {
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

function formatNtDate(date) {
    if (!date || Number.isNaN(date.getTime())) return "—";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function isCountableGoal(row) {
    const type = String(row?.TYPE || "").trim();
    const sub = String(row?.TYPE_SUB || "").trim();
    return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
}

const normalizeTeamLabel = (value) => String(value || "").trim().toLowerCase();

function isEgyptScorerEvent(row, match = {}) {
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

function collapseClubAnchors(anchors) {
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

function buildClubPeriods(collapsedAnchors) {
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

function suggestClubForDate(date, periods) {
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

function findNearestClubHints(friDate, allAnchors = []) {
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

function buildOfAnchorsByPlayer(playerDetails, matchMap, officialMatchIds) {
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

function buildSuggestionReason({ friDateStr, suggestedClub, hit, collapsedAnchors }) {
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

function buildUnresolvedReason({ friDateStr, friDate, allAnchors = [] }) {
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

function buildClubBackfillRows({
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
            .filter((m) => String(m.CHAMPION_SYSTEM || "").trim() === "OFI")
            .map((m) => String(m.MATCH_ID))
    );

    const friendlyMatchIds = new Set(
        ageMatches
            .filter((m) => String(m.CHAMPION_SYSTEM || "").trim() === "FRI")
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

export default function EgyptNTClubBackfill({ matches = [], playerDetails = [], onRefresh }) {
    const { addNotification } = useNotification();
    const [search, setSearch] = useState("");
    const [clubInputs, setClubInputs] = useState({});
    const [selected, setSelected] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [saving, setSaving] = useState(false);
    const [infoRow, setInfoRow] = useState(null);
    const [playerNameMap, setPlayerNameMap] = useState({});
    const [clubOptions, setClubOptions] = useState([]);

    const { rows, stats } = useMemo(
        () => buildClubBackfillRows({ matches, playerDetails, onlyUnresolved: true }),
        [matches, playerDetails]
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const teams = await fetchCatalogDisplayNames("db_TEAMS");
                if (cancelled) return;
                setClubOptions(teams || []);

                const { data: playersData } = await supabase
                    .from("db_PLAYERS")
                    .select("PLAYER_ID, PLAYER_NAME, PLAYER_NAME_EN");

                if (cancelled || !playersData) return;

                const map = {};
                playersData.forEach((p) => {
                    const id = String(p.PLAYER_ID || "").trim();
                    const name = String(p.PLAYER_NAME || p.PLAYER_NAME_EN || id).trim();
                    if (id) map[id] = name;
                });
                setPlayerNameMap(map);
            } catch (err) {
                console.error("ClubBackfill catalog load:", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const resolvePlayerLabel = useCallback(
        (playerKey) => playerNameMap[playerKey] || playerKey,
        [playerNameMap]
    );

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) => {
            const label = resolvePlayerLabel(row.playerKey).toLowerCase();
            return (
                label.includes(q) ||
                row.playerKey.toLowerCase().includes(q) ||
                row.matchId.toLowerCase().includes(q) ||
                row.champion.toLowerCase().includes(q)
            );
        });
    }, [rows, search, resolvePlayerLabel]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredRows.slice(start, start + PAGE_SIZE);
    }, [filteredRows, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const getClubInput = (row) => clubInputs[row.rowId] ?? "";

    const setClubInput = (rowId, value) => {
        setClubInputs((prev) => ({ ...prev, [rowId]: value }));
    };

    const toggleSelect = (rowId) => {
        setSelected((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const toggleSelectPage = () => {
        const allSelected = pageRows.every((r) => selected[r.rowId]);
        setSelected((prev) => {
            const next = { ...prev };
            pageRows.forEach((r) => {
                next[r.rowId] = !allSelected;
            });
            return next;
        });
    };

    const buildUpdatesFromRows = (targetRows) =>
        targetRows
            .map((row) => ({
                rowId: row.rowId,
                club: String(getClubInput(row) || "").trim(),
            }))
            .filter((u) => u.rowId && u.club);

    const applyUpdates = async (updates) => {
        if (!updates.length) {
            addNotification("Enter CLUB for selected rows before applying.", "warning");
            return;
        }
        setSaving(true);
        try {
            const { updated } = await EgyptNTService.applyClubBackfill(updates);
            addNotification(`Updated ${updated} row(s) in database.`, "success");
            if (onRefresh) await onRefresh();
            setSelected({});
        } catch (err) {
            addNotification(err?.message || "Failed to save CLUB values.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleApplySelected = async () => {
        const target = rows.filter((r) => selected[r.rowId]);
        if (!target.length) {
            addNotification("Select at least one row to apply.", "warning");
            return;
        }
        await applyUpdates(buildUpdatesFromRows(target));
    };

    return (
        <Login_db title="CLUB BACKFILL" subtitle="AUTHORIZATION REQUIRED">
            <div className="club-backfill-wrap">
                <div className="club-backfill-header">
                    <div>
                        <div className="section-title">
                            CLUB <span className="accent">BACKFILL</span>
                        </div>
                    </div>
                    <div className="club-backfill-stats">
                        <div className="club-backfill-stat">
                            MANUAL <span>{stats.total}</span>
                        </div>
                    </div>
                </div>

                <div className="club-backfill-controls">
                    <input
                        className="club-backfill-search"
                        placeholder="Search player / match..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        type="button"
                        className="club-backfill-btn club-backfill-btn-primary"
                        disabled={saving}
                        onClick={handleApplySelected}
                    >
                        <Save size={14} />
                        APPLY SELECTED
                    </button>
                </div>

                <div className="club-backfill-table-wrap">
                    <table className="club-backfill-table">
                        <colgroup>
                            <col className="col-check" />
                            <col className="col-date" />
                            <col className="col-match" />
                            <col className="col-player" />
                            <col className="col-champion" />
                            <col className="col-club" />
                            <col className="col-info" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={
                                            pageRows.length > 0 &&
                                            pageRows.every((r) => selected[r.rowId])
                                        }
                                        onChange={toggleSelectPage}
                                    />
                                </th>
                                <th>DATE</th>
                                <th>MATCH_ID</th>
                                <th>PLAYER</th>
                                <th>CHAMPION</th>
                                <th>CLUB</th>
                                <th>INFO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 40, color: "#888" }}>
                                        No manual backfill rows remaining.
                                    </td>
                                </tr>
                            ) : (
                                pageRows.map((row) => (
                                    <tr key={row.rowId}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(selected[row.rowId])}
                                                onChange={() => toggleSelect(row.rowId)}
                                            />
                                        </td>
                                        <td>{row.dateStr}</td>
                                        <td>{row.matchId}</td>
                                        <td>{resolvePlayerLabel(row.playerKey)}</td>
                                        <td>{row.champion || "—"}</td>
                                        <td className="cell-club">
                                            <AutocompleteInput
                                                value={getClubInput(row)}
                                                options={clubOptions}
                                                placeholder="CLUB"
                                                onChange={(val) => setClubInput(row.rowId, val)}
                                                className="club-backfill-club-input"
                                                style={{ width: "100%" }}
                                                accentColor="#C8102E"
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="club-backfill-info-btn"
                                                title="Why no suggestion?"
                                                onClick={() => setInfoRow(row)}
                                            >
                                                <Info size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="club-backfill-pagination">
                    <button
                        type="button"
                        className="club-backfill-page-btn"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                    >
                        PREV
                    </button>
                    <span className="club-backfill-page-info">
                        PAGE {currentPage} OF {totalPages}
                    </span>
                    <button
                        type="button"
                        className="club-backfill-page-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        NEXT
                    </button>
                </div>
            </div>

            {infoRow && (
                <div
                    className="club-backfill-popup-overlay"
                    onClick={() => setInfoRow(null)}
                >
                    <div
                        className="club-backfill-popup"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="club-backfill-popup-header">
                            <h3>ROW DETAILS</h3>
                            <button
                                type="button"
                                className="club-backfill-popup-close"
                                onClick={() => setInfoRow(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="club-backfill-popup-body">
                            {(infoRow.reason?.lines || ["No details available."]).map((line, i) => (
                                <div
                                    key={i}
                                    className={
                                        line.startsWith("اقتراح للاختيار:")
                                            ? "club-backfill-popup-hint"
                                            : undefined
                                    }
                                >
                                    {line || "\u00A0"}
                                </div>
                            ))}
                            {infoRow.nearestHintClub ? (
                                <button
                                    type="button"
                                    className="club-backfill-use-hint-btn"
                                    onClick={() => {
                                        setClubInput(infoRow.rowId, infoRow.nearestHintClub);
                                        setInfoRow(null);
                                    }}
                                >
                                    استخدام: {infoRow.nearestHintClub}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </Login_db>
    );
}
