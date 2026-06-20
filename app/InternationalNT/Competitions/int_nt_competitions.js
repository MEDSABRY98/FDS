"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";
import { buildCompetitionStats, buildCompetitionTotals } from "./int_nt_competitions_utils";
import "./int_nt_competitions.css";

export default function IntNtCompetitions({ matches }) {
    const rows = useMemo(() => buildCompetitionStats(matches), [matches]);
    const totals = useMemo(() => buildCompetitionTotals(rows), [rows]);

    if (!rows.length) return <NoData_db message="NO COMPETITION DATA" />;

    return (
        <div className="int-nt-competitions">
            <div className="int-nt-competitions-header">
                <h1>COMPETITIONS</h1>
            </div>
            <div className="int-nt-competitions-table-wrap">
                <table className="int-nt-competitions-table">
                    <thead>
                        <tr>
                            <th>GAME</th>
                            <th>SEASON</th>
                            <th>P</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>GF</th>
                            <th>GA</th>
                            <th>GD</th>
                            <th>WIN %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={`${r.game}-${r.season}`}>
                                <td className="game">{r.game}</td>
                                <td>{r.season}</td>
                                <td>{r.played}</td>
                                <td className="result-w">{r.wins}</td>
                                <td className="result-d">{r.draws}</td>
                                <td className="result-l">{r.losses}</td>
                                <td>{r.gf}</td>
                                <td>{r.ga}</td>
                                <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                                <td className="win-rate">{r.winRate}%</td>
                            </tr>
                        ))}
                        <tr className="totals-row">
                            <td className="game">TOTAL ({rows.length})</td>
                            <td>—</td>
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
        </div>
    );
}
