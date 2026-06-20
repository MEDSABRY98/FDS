"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import { getTeamMatchPerspective } from "./int_nt_team_details_utils";
import "./int_nt_team_details.css";

const PER_PAGE = 50;

function resultClass(outcome) {
    if (outcome === "W") return "result-w";
    if (outcome === "L") return "result-l";
    if (outcome && String(outcome).startsWith("D")) return "result-d";
    return "";
}

export default function IntNtTeamDetailsMatches({ teamName, matches }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    useEffect(() => { setPage(1); setSearch(""); }, [teamName, matches]);

    const rows = useMemo(() =>
        (matches || [])
            .map((m) => ({ match: m, perspective: getTeamMatchPerspective(m, teamName) }))
            .sort((a, b) => String(b.match.SEASON || "").localeCompare(String(a.match.SEASON || ""), undefined, { numeric: true })),
    [matches, teamName]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(({ match, perspective }) =>
            [match.SEASON, match.GAME, match.CATEGORY, match.ROUND, match.DATE, match["HOST COUNTRY"], perspective.opponent, perspective.winner, `${perspective.gf}-${perspective.ga}`, perspective.pen]
                .some((v) => String(v ?? "").toLowerCase().includes(q))
        );
    }, [rows, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <>
            <div className="int-nt-team-details-search">
                <SearchBar_db value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search matches..." />
            </div>
            <div className="int-nt-team-details-panel">
                {filtered.length === 0 ? (
                    <NoData_db message="NO MATCHES MATCH YOUR SEARCH" />
                ) : (
                    <>
                        <div className="int-nt-team-details-table-wrap">
                            <table className="int-nt-team-details-table">
                                <thead>
                                    <tr><th>DATE</th><th>SEASON</th><th>GAME</th><th>CATEGORY</th><th>ROUND</th><th>OPPONENT</th><th>SCORE</th><th>HOST COUNTRY</th><th>RESULT</th></tr>
                                </thead>
                                <tbody>
                                    {paginated.map(({ match, perspective }) => (
                                        <tr key={match.ROW_ID}>
                                            <td>{match.DATE || "—"}</td>
                                            <td>{match.SEASON || "—"}</td>
                                            <td>{match.GAME || "—"}</td>
                                            <td>{match.CATEGORY || "—"}</td>
                                            <td>{match.ROUND || "—"}</td>
                                            <td className="opponent">{perspective.opponent}</td>
                                            <td className="score">{perspective.gf} - {perspective.ga}{perspective.pen ? ` (${perspective.pen})` : ""}</td>
                                            <td>{perspective.hostCountry}</td>
                                            <td className={resultClass(perspective.outcome)}>{perspective.winner || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="int-nt-team-details-pagination">
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
