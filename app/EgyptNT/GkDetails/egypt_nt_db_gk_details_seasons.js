"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import { GK_TabSearch, GK_TOTAL_ROW_STYLE, GK_TOTAL_LABEL_STYLE, gkStatText, gkStatCellStyle, gkTotalCellStyle } from "./egypt_nt_db_gk_details_utils";

export default function EgyptNTGKSeasons({ stats }) {
    const [search, setSearch] = useState("");
    const dataObj = stats.statsBySY || {};

    const list = useMemo(() => {
        const query = search.trim().toLowerCase();
        return Object.keys(dataObj)
            .filter((sy) => !query || sy.toLowerCase().includes(query))
            .map((sy) => ({ key: sy, ...dataObj[sy] }))
            .sort((a, b) => b.key.localeCompare(a.key));
    }, [dataObj, search]);

    const totals = useMemo(() => list.reduce((acc, row) => {
        acc.matches += row.matches || 0;
        acc.wins += row.wins || 0;
        acc.draws += row.draws || 0;
        acc.losses += row.losses || 0;
        acc.gc += row.gc || 0;
        acc.cs += row.cs || 0;
        acc.ps += row.ps || 0;
        return acc;
    }, { matches: 0, wins: 0, draws: 0, losses: 0, gc: 0, cs: 0, ps: 0 }), [list]);

    return (
        <div className="history-section fade-in">
            <GK_TabSearch
                value={search}
                onChange={setSearch}
                placeholder="SEARCH SEASON..."
            />
            <div style={{ overflowX: "auto" }}>
                {list.length === 0 ? (
                    <NoData_db message="No season data available." />
                ) : (
                    <table className="player-match-table fade-in">
                        <thead>
                            <tr>
                                <th>SEASON</th>
                                <th>MP</th>
                                <th>W</th>
                                <th>D</th>
                                <th>L</th>
                                <th>CONCEDED</th>
                                <th>CLEAN SHEETS</th>
                                <th>PEN SAVED</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((s) => (
                                <tr key={s.key}>
                                    <td style={{ fontWeight: "800", color: "var(--gold)" }}>{s.key}</td>
                                    <td style={gkStatCellStyle(s.matches)}>{gkStatText(s.matches)}</td>
                                    <td style={gkStatCellStyle(s.wins)}>{gkStatText(s.wins)}</td>
                                    <td style={gkStatCellStyle(s.draws)}>{gkStatText(s.draws)}</td>
                                    <td style={gkStatCellStyle(s.losses)}>{gkStatText(s.losses)}</td>
                                    <td style={gkStatCellStyle(s.gc, { color: "#e74c3c", fontWeight: "800" })}>{gkStatText(s.gc)}</td>
                                    <td style={gkStatCellStyle(s.cs, { color: "#2ecc71", fontWeight: "800" })}>{gkStatText(s.cs)}</td>
                                    <td style={gkStatCellStyle(s.ps)}>{gkStatText(s.ps)}</td>
                                </tr>
                            ))}
                            <tr style={GK_TOTAL_ROW_STYLE}>
                                <td style={GK_TOTAL_LABEL_STYLE}>TOTAL</td>
                                <td style={gkTotalCellStyle(totals.matches, { color: "var(--gold)" })}>{gkStatText(totals.matches)}</td>
                                <td style={gkTotalCellStyle(totals.wins)}>{gkStatText(totals.wins)}</td>
                                <td style={gkTotalCellStyle(totals.draws)}>{gkStatText(totals.draws)}</td>
                                <td style={gkTotalCellStyle(totals.losses)}>{gkStatText(totals.losses)}</td>
                                <td style={gkTotalCellStyle(totals.gc, { color: "#ff6b6b" })}>{gkStatText(totals.gc)}</td>
                                <td style={gkTotalCellStyle(totals.cs, { color: "#5ef193" })}>{gkStatText(totals.cs)}</td>
                                <td style={gkTotalCellStyle(totals.ps, { color: "#5dade2" })}>{gkStatText(totals.ps)}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
