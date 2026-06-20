"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import { getClubMatchPerspective } from "./intl_club_details_utils";
import "./intl_club_details.css";

const PER_PAGE = 50;

function resultClass(outcome) {
    if (outcome === "W") return "result-w";
    if (outcome === "L") return "result-l";
    if (outcome && String(outcome).startsWith("D")) return "result-d";
    return "";
}

export default function IntlClubDetailsMatches({ clubName, matches }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setPage(1);
        setSearch("");
    }, [clubName, matches]);

    const rows = useMemo(() => {
        return (matches || [])
            .map((m) => ({ match: m, perspective: getClubMatchPerspective(m, clubName) }))
            .sort((a, b) => {
                const edA = String(a.match.Edition || "");
                const edB = String(b.match.Edition || "");
                return edB.localeCompare(edA, undefined, { numeric: true });
            });
    }, [matches, clubName]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(({ match, perspective }) =>
            [
                match.Edition,
                match.GAME,
                match.KIND,
                match.ROUND,
                perspective.opponent,
                perspective.han,
                perspective.winner,
                `${perspective.gf}-${perspective.ga}`,
                match.PEN,
                match.NOTE,
            ].some((v) => String(v ?? "").toLowerCase().includes(q))
        );
    }, [rows, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <>
            <div className="intl-club-details-search">
                <SearchBar_db
                    value={search}
                    onChange={(v) => { setSearch(v); setPage(1); }}
                    placeholder="Search matches..."
                />
            </div>

            <div className="intl-club-details-panel">
            {filtered.length === 0 ? (
                <NoData_db message="NO MATCHES MATCH YOUR SEARCH" />
            ) : (
                <>
                    <div className="intl-club-details-table-wrap">
                        <table className="intl-club-details-table">
                            <thead>
                                <tr>
                                    <th>Edition</th>
                                    <th>GAME</th>
                                    <th>KIND</th>
                                    <th>ROUND</th>
                                    <th>OPPONENT</th>
                                    <th>SCORE</th>
                                    <th>H-A-N</th>
                                    <th>RESULT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(({ match, perspective }) => (
                                    <tr key={match.ROW_ID}>
                                        <td>{match.Edition || "—"}</td>
                                        <td>{match.GAME || "—"}</td>
                                        <td>{match.KIND || "—"}</td>
                                        <td>{match.ROUND || "—"}</td>
                                        <td className="opponent">{perspective.opponent}</td>
                                        <td className="score">
                                            {perspective.gf} - {perspective.ga}
                                            {match.PEN ? ` (${match.PEN})` : ""}
                                        </td>
                                        <td>{perspective.han}</td>
                                        <td className={resultClass(perspective.outcome)}>{perspective.winner || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="intl-club-details-pagination">
                            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                            <span>{page} / {totalPages}</span>
                            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                        </div>
                    )}
                </>
            )}
            </div>
        </>
    );
}
