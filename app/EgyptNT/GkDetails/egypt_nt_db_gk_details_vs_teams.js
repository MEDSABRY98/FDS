"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import { GK_TabSearch, GK_TOTAL_ROW_STYLE, GK_TOTAL_LABEL_STYLE, gkStatText, gkStatCellStyle, gkTotalCellStyle } from "./egypt_nt_db_gk_details_utils";

export default function EgyptNTGKVSTeams({ stats }) {
    const [search, setSearch] = useState("");
    const oppStore = stats.statsByOpponent || {};

    const list = useMemo(() => {
        const query = search.trim().toLowerCase();
        return Object.keys(oppStore)
            .filter((name) => !query || name.toLowerCase().includes(query))
            .map((name) => ({ name, ...oppStore[name] }))
            .sort((a, b) => (b.matches - a.matches) || a.name.localeCompare(b.name));
    }, [oppStore, search]);

    const totals = useMemo(() => list.reduce((acc, row) => {
        acc.matches += row.matches || 0;
        acc.gc += row.gc || 0;
        acc.cs += row.cs || 0;
        acc.pr += row.pr || 0;
        acc.ps += row.ps || 0;
        return acc;
    }, { matches: 0, gc: 0, cs: 0, pr: 0, ps: 0 }), [list]);

    return (
        <div className="history-section fade-in">
            <GK_TabSearch
                value={search}
                onChange={setSearch}
                placeholder="SEARCH OPPONENT TEAM..."
            />
            <div style={{ overflowX: "auto" }}>
                {list.length === 0 ? (
                    <NoData_db message="No opponent data available." />
                ) : (
                    <table className="player-match-table vs-teams-table fade-in">
                        <thead>
                            <tr>
                                <th>OPPONENT TEAM</th>
                                <th>MATCHES</th>
                                <th>CLEAN SHEETS</th>
                                <th>GOALS CONCEDED</th>
                                <th>PEN REC.</th>
                                <th>PEN SAVED</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((row) => (
                                <tr key={row.name}>
                                    <td style={{ fontWeight: "800", color: "var(--gold)" }}>{row.name}</td>
                                    <td style={gkStatCellStyle(row.matches)}>{gkStatText(row.matches)}</td>
                                    <td style={gkStatCellStyle(row.cs, { color: "#2ecc71", fontWeight: "800" })}>{gkStatText(row.cs)}</td>
                                    <td style={gkStatCellStyle(row.gc, { color: "#e74c3c", fontWeight: "800" })}>{gkStatText(row.gc)}</td>
                                    <td style={gkStatCellStyle(row.pr)}>{gkStatText(row.pr)}</td>
                                    <td style={gkStatCellStyle(row.ps, { color: "#2980b9", fontWeight: "800" })}>{gkStatText(row.ps)}</td>
                                </tr>
                            ))}
                            <tr style={GK_TOTAL_ROW_STYLE}>
                                <td style={GK_TOTAL_LABEL_STYLE}>TOTAL</td>
                                <td style={gkTotalCellStyle(totals.matches, { color: "var(--gold)" })}>{gkStatText(totals.matches)}</td>
                                <td style={gkTotalCellStyle(totals.cs, { color: "#5ef193" })}>{gkStatText(totals.cs)}</td>
                                <td style={gkTotalCellStyle(totals.gc, { color: "#ff6b6b" })}>{gkStatText(totals.gc)}</td>
                                <td style={gkTotalCellStyle(totals.pr)}>{gkStatText(totals.pr)}</td>
                                <td style={gkTotalCellStyle(totals.ps, { color: "#5dade2" })}>{gkStatText(totals.ps)}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
