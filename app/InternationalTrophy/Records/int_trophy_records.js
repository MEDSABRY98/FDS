"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { sortTrophiesBySeason } from "../Service/int_trophy_service";
import "../Leaderboard/int_trophy_leaderboard.css";

const PER_PAGE = 50;
const COLS = ["TYPE", "AREA", "GAME", "COMPETITION", "SEASON", "W-MANAGER", "L-MANAGER", "PLACE", "CHAMPION", "RESULT", "RUNNER-UP", "NOTE"];

export default function IntTrophyRecords({ trophies }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let rows = trophies || [];
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((t) =>
                COLS.some((col) => String(t[col] ?? "").toLowerCase().includes(q))
            );
        }
        return sortTrophiesBySeason(rows);
    }, [trophies, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    if (!trophies?.length) return <NoData_db message="NO TROPHY RECORDS FOUND" />;

    return (
        <div className="int-trophy-lb">
            <div className="int-trophy-lb-header">
                <h1>ALL <span className="gold">RECORDS</span></h1>
            </div>
            <SearchBar_db value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search all columns..." />
            <div className="int-trophy-table-wrap">
                <table className="int-trophy-table">
                    <thead>
                        <tr>{COLS.map((col) => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                        {paginated.map((t) => (
                            <tr key={t.ROW_ID}>
                                {COLS.map((col) => (
                                    <td key={col}>{col === "CHAMPION" ? <strong>{t[col] || "—"}</strong> : (t[col] ?? "—")}</td>
                                ))}
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
        </div>
    );
}
