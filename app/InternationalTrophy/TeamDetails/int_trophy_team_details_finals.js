"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import { getTeamFinalAppearances } from "./int_trophy_team_details_utils";
import { sortTrophiesBySeason } from "../Service/int_trophy_service";
import "../Leaderboard/int_trophy_leaderboard.css";
import "./int_trophy_team_details.css";

const PER_PAGE = 50;
const COLS = ["TYPE", "PLACE", "GAME", "COMPETITION", "SEASON", "CHAMPION", "RESULT", "RUNNER-UP"];

export default function IntTrophyTeamDetailsFinals({ trophies, teamName, typeFilter, outcomeFilter = "all" }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const rows = useMemo(
        () => getTeamFinalAppearances(trophies, teamName, typeFilter, outcomeFilter),
        [trophies, teamName, typeFilter, outcomeFilter]
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter((t) =>
            COLS.some((col) => String(t[col] ?? "").toLowerCase().includes(q))
        );
    }, [rows, search]);

    const sorted = useMemo(() => sortTrophiesBySeason(filtered), [filtered]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
    const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    useEffect(() => { setPage(1); setSearch(""); }, [teamName, typeFilter, outcomeFilter]);

    if (!rows.length) return <NoData_db message="NO FINAL DATA FOR THIS TEAM" />;

    return (
        <>
            <SearchBar_db value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search finals..." />
            <div className="int-trophy-table-wrap">
                <table className="int-trophy-table">
                    <thead>
                        <tr>{COLS.map((col) => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                        {paginated.map((t) => (
                            <tr key={t.ROW_ID}>
                                {COLS.map((col) => {
                                    const value = t[col] ?? "—";
                                    const isWin = col === "CHAMPION" && String(t.CHAMPION ?? "").trim() === teamName;
                                    const isLoss = col === "RUNNER-UP" && String(t["RUNNER-UP"] ?? "").trim() === teamName;
                                    return (
                                        <td key={col} className={isWin ? "result-w" : isLoss ? "result-l" : ""}>
                                            {isWin || isLoss ? <strong>{value || "—"}</strong> : value}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="int-trophy-pagination">
                    <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← PREV</button>
                    <span className="page-info">PAGE {page} OF {totalPages}</span>
                    <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>NEXT →</button>
                </div>
            )}
        </>
    );
}
