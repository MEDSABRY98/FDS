"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import "./intl_matches.css";

const PER_PAGE = 25;

export default function IntlClubMatches({ matches }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        if (!search.trim()) return matches || [];
        const q = search.toLowerCase();
        return (matches || []).filter((m) =>
            ["Edition", "GAME", "KIND", "ROUND", "TEAM A", "TEAM B", "ROW_ID", "NOTE"].some((col) =>
                String(m[col] ?? "").toLowerCase().includes(q)
            )
        );
    }, [matches, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    if (!matches?.length) return <NoData_db message="NO MATCHES FOUND" />;

    return (
        <div className="intl-matches">
            <div className="intl-matches-header">
                <h1>MATCHES</h1>
                <SearchBar_db value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search matches..." />
            </div>

            <div className="intl-table-wrap">
                <table className="intl-table">
                    <thead>
                        <tr>
                            <th>ROW_ID</th>
                            <th>Edition</th>
                            <th>GAME</th>
                            <th>ROUND</th>
                            <th>TEAM A</th>
                            <th>SCORE</th>
                            <th>TEAM B</th>
                            <th>H-A-N</th>
                            <th>W-D-L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((m) => (
                            <tr key={m.ROW_ID || `${m.Edition}-${m["TEAM A"]}-${m["TEAM B"]}`}>
                                <td className="mono">{m.ROW_ID}</td>
                                <td>{m.Edition || "—"}</td>
                                <td>{m.GAME || "—"}</td>
                                <td>{m.ROUND || "—"}</td>
                                <td><strong>{m["TEAM A"] || "—"}</strong></td>
                                <td className="score">{m.GF ?? "—"} - {m.GA ?? "—"}{m.PEN ? ` (${m.PEN})` : ""}</td>
                                <td><strong>{m["TEAM B"] || "—"}</strong></td>
                                <td>{m["H-A-N"] || "—"}</td>
                                <td>{m["W-D-L"] || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="intl-pagination">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                    <span>{page} / {totalPages}</span>
                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}
