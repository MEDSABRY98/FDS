"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import { GK_TabSearch, GK_TOTAL_ROW_STYLE, GK_TOTAL_LABEL_STYLE, GK_TOTAL_VAL_STYLE, gkStatText, gkStatCellStyle, gkTotalCellStyle } from "./egypt_nt_db_gk_details_utils";

export default function EgyptNTGKChampionships({ stats }) {
    const [search, setSearch] = useState("");
    const compStore = stats.compStats || {};

    const list = useMemo(() => {
        const query = search.trim().toLowerCase();
        return Object.keys(compStore)
            .filter((name) => !query || name.toLowerCase().includes(query))
            .map((name) => ({ name, ...compStore[name] }))
            .sort((a, b) => b.matches - a.matches);
    }, [compStore, search]);

    const totals = useMemo(() => list.reduce((acc, row) => {
        acc.matches += row.matches || 0;
        acc.wins += row.wins || 0;
        acc.draws += row.draws || 0;
        acc.losses += row.losses || 0;
        acc.gs += row.gs || 0;
        acc.ga += row.ga || 0;
        acc.gc += row.gc || 0;
        acc.cs += row.cs || 0;
        acc.ps += row.ps || 0;
        return acc;
    }, { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, gc: 0, cs: 0, ps: 0 }), [list]);

    return (
        <div className="history-section fade-in">
            <GK_TabSearch
                value={search}
                onChange={setSearch}
                placeholder="SEARCH CHAMPIONSHIP..."
            />
            <div style={{ overflowX: "auto" }}>
                {list.length === 0 ? (
                    <NoData_db message="No championship data available." />
                ) : (
                    <table className="player-match-table fade-in">
                        <thead>
                            <tr>
                                <th>CHAMPIONSHIP</th>
                                <th>MP</th>
                                <th>W</th>
                                <th>D</th>
                                <th>L</th>
                                <th>GS</th>
                                <th>GA</th>
                                <th>CONCEDED</th>
                                <th>CLEAN SHEETS</th>
                                <th>PEN SAVED</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((c) => (
                                <tr key={c.name}>
                                    <td style={{ fontWeight: "800", color: "var(--gold)" }}>{c.name}</td>
                                    <td style={gkStatCellStyle(c.matches)}>{gkStatText(c.matches)}</td>
                                    <td style={gkStatCellStyle(c.wins)}>{gkStatText(c.wins)}</td>
                                    <td style={gkStatCellStyle(c.draws)}>{gkStatText(c.draws)}</td>
                                    <td style={gkStatCellStyle(c.losses)}>{gkStatText(c.losses)}</td>
                                    <td style={gkStatCellStyle(c.gs)}>{gkStatText(c.gs)}</td>
                                    <td style={gkStatCellStyle(c.ga)}>{gkStatText(c.ga)}</td>
                                    <td style={gkStatCellStyle(c.gc, { color: "#e74c3c", fontWeight: "800" })}>{gkStatText(c.gc)}</td>
                                    <td style={gkStatCellStyle(c.cs, { color: "#2ecc71", fontWeight: "800" })}>{gkStatText(c.cs)}</td>
                                    <td style={gkStatCellStyle(c.ps)}>{gkStatText(c.ps)}</td>
                                </tr>
                            ))}
                            <tr style={GK_TOTAL_ROW_STYLE}>
                                <td style={GK_TOTAL_LABEL_STYLE}>TOTAL</td>
                                <td style={gkTotalCellStyle(totals.matches, { color: "var(--gold)" })}>{gkStatText(totals.matches)}</td>
                                <td style={gkTotalCellStyle(totals.wins)}>{gkStatText(totals.wins)}</td>
                                <td style={gkTotalCellStyle(totals.draws)}>{gkStatText(totals.draws)}</td>
                                <td style={gkTotalCellStyle(totals.losses)}>{gkStatText(totals.losses)}</td>
                                <td style={gkTotalCellStyle(totals.gs)}>{gkStatText(totals.gs)}</td>
                                <td style={gkTotalCellStyle(totals.ga)}>{gkStatText(totals.ga)}</td>
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
