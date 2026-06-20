"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import "./int_nt_team_details.css";

const PER_PAGE = 50;

export default function IntNtTeamDetailsStatsTable({ rows, labelColumn, totalsSuffix, searchPlaceholder, noDataMessage, searchEmptyMessage }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    useEffect(() => { setPage(1); setSearch(""); }, [rows, labelColumn]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter((row) => String(row.name).toLowerCase().includes(q));
    }, [rows, search]);

    const totals = useMemo(() => {
        const t = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
        filtered.forEach((row) => {
            t.played += row.played; t.wins += row.wins; t.draws += row.draws;
            t.losses += row.losses; t.gf += row.gf; t.ga += row.ga;
        });
        return { ...t, gd: t.gf - t.ga, winRate: t.played > 0 ? Math.round((t.wins / t.played) * 100) : 0 };
    }, [filtered]);

    if (!rows.length) return <NoData_db message={noDataMessage} />;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <>
            <div className="int-nt-team-details-search">
                <SearchBar_db value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={searchPlaceholder} />
            </div>
            <div className="int-nt-team-details-panel">
                {filtered.length === 0 ? (
                    <NoData_db message={searchEmptyMessage} />
                ) : (
                    <>
                        <div className="int-nt-team-details-table-wrap">
                            <table className="int-nt-team-details-table int-nt-team-details-table--opponents">
                                <thead>
                                    <tr><th>{labelColumn}</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>WIN %</th></tr>
                                </thead>
                                <tbody>
                                    {paginated.map((row) => (
                                        <tr key={row.name}>
                                            <td className="opponent">{row.name}</td>
                                            <td>{row.played}</td>
                                            <td className="result-w">{row.wins}</td>
                                            <td className="result-d">{row.draws}</td>
                                            <td className="result-l">{row.losses}</td>
                                            <td>{row.gf}</td>
                                            <td>{row.ga}</td>
                                            <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                                            <td className="win-rate">{row.winRate}%</td>
                                        </tr>
                                    ))}
                                    <tr className="totals-row">
                                        <td className="opponent">TOTAL ({filtered.length} {totalsSuffix})</td>
                                        <td>{totals.played}</td>
                                        <td className="result-w">{totals.wins}</td>
                                        <td className="result-d">{totals.draws}</td>
                                        <td className="result-l">{totals.losses}</td>
                                        <td>{totals.gf}</td>
                                        <td>{totals.ga}</td>
                                        <td>{totals.gd > 0 ? `+${totals.gd}` : totals.gd}</td>
                                        <td className="win-rate">{totals.winRate}%</td>
                                    </tr>
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
