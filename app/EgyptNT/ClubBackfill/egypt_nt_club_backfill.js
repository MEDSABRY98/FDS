"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, X, Save } from "lucide-react";
import Login_db from "../../lib/Login_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput, fetchCatalogDisplayNames, supabase } from "../../Database";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import { buildClubBackfillRows } from "./egypt_nt_club_backfill_utils";
import "./egypt_nt_club_backfill.css";

const PAGE_SIZE = 50;

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
