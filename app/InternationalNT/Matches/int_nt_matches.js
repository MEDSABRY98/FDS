"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import "./int_nt_matches.css";

const PER_PAGE = 25;

export default function IntNtMatches({ matches }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        if (!search.trim()) return matches || [];
        const q = search.toLowerCase();
        return (matches || []).filter((m) =>
            ["SEASON", "GAME", "AGE", "CATEGORY", "ROUND", "TEAMA", "TEAMB", "HOST COUNTRY", "DATE", "MATCH_ID"].some((col) =>
                String(m[col] ?? "").toLowerCase().includes(q)
            )
        );
    }, [matches, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    if (!matches?.length) return <NoData_db message="NO MATCHES FOUND" />;

    return (
        <div className="int-nt-matches">
            <div className="int-nt-matches-header">
                <h1>MATCHES</h1>
                <SearchBar_db value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search matches..." />
            </div>
            <div className="int-nt-table-wrap">
                <table className="int-nt-table">
                    <thead>
                        <tr>
                            <th>ROW_ID</th>
                            <th>DATE</th>
                            <th>SEASON</th>
                            <th>GAME</th>
                            <th>CATEGORY</th>
                            <th>ROUND</th>
                            <th>TEAMA</th>
                            <th>SCORE</th>
                            <th>TEAMB</th>
                            <th>HOST COUNTRY</th>
                            <th>W-D-L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((m) => (
                            <tr key={m.ROW_ID || m.MATCH_ID}>
                                <td className="mono">{m.ROW_ID}</td>
                                <td>{m.DATE || "—"}</td>
                                <td>{m.SEASON || "—"}</td>
                                <td>{m.GAME || "—"}</td>
                                <td>{m.CATEGORY || "—"}</td>
                                <td>{m.ROUND || "—"}</td>
                                <td><strong>{m.TEAMA || "—"}</strong></td>
                                <td className="score">
                                    {m.TEAMASCORE ?? "—"} - {m.TEAMBSCORE ?? "—"}
                                    {m["PEN DISPLAY"] ? ` (${m["PEN DISPLAY"]})` : ""}
                                </td>
                                <td><strong>{m.TEAMB || "—"}</strong></td>
                                <td>{m["HOST COUNTRY"] || "—"}</td>
                                <td>{m["W-D-L"] || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="int-nt-pagination">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                    <span>{page} / {totalPages}</span>
                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}
